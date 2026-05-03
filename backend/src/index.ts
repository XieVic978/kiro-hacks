import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import airports from './airports.json'
import { recommendFlights, FlightSummary } from './scoring'

dotenv.config({ path: '.env.local' })

const app = express()
app.use(cors())
app.use(express.json())

const SERPAPI_KEY = process.env.SERPAPI_KEY ?? process.env.VITE_SERPAPI_KEY
const GROQ_KEY    = process.env.GROQ_API_KEY ?? process.env.VITE_GROQ_API_KEY
const PORT = Number(process.env.PORT ?? 5051)

// ── Types ────────────────────────────────────────────────────────────────────

interface Airport {
  id: string
  name: string
  city: string
  state: string
}

interface MeetupSuggestion {
  name: string
  address: string
}

interface GoogleMapsResult {
  title?: string
  address?: string
  type?: string
}

interface Leg {
  airline?: string
  airline_logo?: string
  flight_number?: string
  departure_airport?: { name?: string; id?: string; time?: string }
  arrival_airport?: { name?: string; id?: string; time?: string }
  duration?: number
  airplane?: string
  legroom?: string
  extensions?: string[]
}

interface Layover {
  name?: string
  id?: string
  duration?: number
  overnight?: boolean
}

interface FlightItem {
  flights?: Leg[]
  total_duration?: number
  layovers?: Layover[]
  price?: number
  airline_logo?: string
  extensions?: string[]
  [key: string]: unknown
}

type FlightSection = 'best_flights' | 'other_flights'

interface BookingOptionOffer {
  book_with?: string
  price?: number
  airline?: boolean
}

interface BookingOption {
  together?: BookingOptionOffer
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

async function fetchSerpApiJson(params: URLSearchParams) {
  const response = await fetch(`https://serpapi.com/search?${params}`)
  const text = await response.text()

  if (!text) {
    throw new Error('Empty response from SerpAPI')
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(text)
  } catch {
    console.error('SerpAPI raw response:', text.slice(0, 500))
    throw new Error('Invalid JSON from SerpAPI')
  }

  if (data.error) {
    throw new Error(String(data.error))
  }

  return data
}

async function fetchGroqJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  if (!GROQ_KEY) {
    throw new Error('Missing GROQ_API_KEY environment variable')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    throw new Error(`Groq API error ${response.status}: ${await response.text()}`)
  }

  const data = await response.json() as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content ?? ''

  try {
    return JSON.parse(content) as T
  } catch {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) return JSON.parse(match[1]) as T
    throw new Error(`Could not parse Groq response: ${content}`)
  }
}

function isMeetupSuggestion(value: unknown): value is MeetupSuggestion {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.name === 'string' &&
    typeof item.address === 'string'
  )
}

function isOutsideAirport(address = '', airport = '') {
  const text = `${address} ${airport}`.toLowerCase()
  return !(
    text.includes('terminal') ||
    text.includes('concourse') ||
    text.includes('gate ') ||
    text.includes('inside ') ||
    text.includes('airport terminal') ||
    text.includes('airside')
  )
}

async function findNearbyCoffeeShops(
  airport: string,
  city?: string,
  iata?: string
) {
  const queries = [
    `coffee shops near ${airport}${city ? `, ${city}` : ''}`,
    `coffee near ${airport}${city ? `, ${city}` : ''}`,
    `coffee shops near ${city ?? airport}`,
    `coffee near ${iata ?? airport}`,
  ]

  let lastCandidates: MeetupSuggestion[] = []

  for (const query of queries) {
    const params = new URLSearchParams({
      engine: 'google_maps',
      type: 'search',
      q: query,
      hl: 'en',
      api_key: SERPAPI_KEY ?? '',
    })

    const data = await fetchSerpApiJson(params)
    const candidates = ((data.local_results ?? []) as GoogleMapsResult[])
      .filter(result => {
        const title = result.title?.trim()
        const address = result.address?.trim()

        return Boolean(title) &&
          Boolean(address) &&
          isOutsideAirport(address, airport)
      })
      .slice(0, 2)
      .map(result => ({
        name: result.title as string,
        address: result.address as string,
      }))

    lastCandidates = candidates
    if (candidates.length >= 2) {
      return candidates
    }
  }

  if (lastCandidates.length > 0) return lastCandidates

  throw new Error('SerpAPI did not return off-airport coffee shops')
}

function extractLivePrice(bookingOptions: BookingOption[]) {
  const pricedOffers = bookingOptions
    .map(option => option.together)
    .filter((offer): offer is BookingOptionOffer => typeof offer?.price === 'number')
    .sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER))

  if (!pricedOffers.length) return null

  const bestOffer = pricedOffers[0]
  return {
    price: bestOffer.price ?? null,
    provider: bestOffer.book_with ?? null,
    airline_direct: bestOffer.airline ?? false,
  }
}

async function enrichFlightWithLivePrice(item: FlightItem, from: string, to: string, date: string) {
  if (!item.booking_token || !SERPAPI_KEY) {
    return item
  }

  const params = new URLSearchParams({
    engine: 'google_flights',
    departure_id: from,
    arrival_id: to,
    outbound_date: date,
    type: '2',
    hl: 'en',
    currency: 'USD',
    booking_token: String(item.booking_token),
    api_key: SERPAPI_KEY,
  })

  try {
    const data = await fetchSerpApiJson(params)
    const bookingOptions = (data.booking_options ?? []) as BookingOption[]
    const livePrice = extractLivePrice(bookingOptions)

    if (!livePrice) {
      return {
        ...item,
        price_source: 'search_results',
        live_booking_options: bookingOptions,
      }
    }

    return {
      ...item,
      price: livePrice.price,
      search_results_price: item.price ?? null,
      booking_provider: livePrice.provider,
      booking_provider_is_airline: livePrice.airline_direct,
      price_source: 'booking_options',
      live_booking_options: bookingOptions,
    }
  } catch (error) {
    console.error('Failed to enrich flight with live price:', error)
    return {
      ...item,
      price_source: 'search_results',
    }
  }
}

function normalizeFlightResult(item: FlightItem, section: FlightSection) {
  const legs = item.flights ?? []
  const firstLeg = legs[0]
  const lastLeg = legs[legs.length - 1]
  const airlineNames = [...new Set(legs.map(leg => leg.airline).filter(Boolean))]
  const stops = Math.max(legs.length - 1, 0)

  return {
    ...item,
    result_type: section === 'best_flights' ? 'best' : 'other',
    airline: airlineNames.join(' / '),
    departure_time: firstLeg?.departure_airport?.time ?? null,
    arrival_time: lastLeg?.arrival_airport?.time ?? null,
    departure_airport: firstLeg?.departure_airport ?? null,
    arrival_airport: lastLeg?.arrival_airport ?? null,
    duration_minutes: item.total_duration ?? null,
    duration: item.total_duration ? formatDuration(item.total_duration) : null,
    number_of_stops: stops,
    stops_text: stops === 0 ? 'Non-stop' : `${stops} stop${stops > 1 ? 's' : ''}`,
    flight_numbers: legs.map(leg => leg.flight_number).filter(Boolean),
  }
}

// ── Routes ───────────────────────────────────────────────────────────────────

// Airport search — served from local JSON, no API call needed
app.get('/api/airports', (req: Request, res: Response) => {
  const { q } = req.query as Record<string, string>
  if (!q || q.length < 2) {
    res.json({ airports: [] })
    return
  }

  const query = q.toLowerCase()
  const results = (airports as Airport[])
    .filter(a =>
      a.city.toLowerCase().includes(query) ||
      a.name.toLowerCase().includes(query) ||
      a.id.toLowerCase().includes(query) ||
      a.state.toLowerCase().includes(query)
    )
    .slice(0, 8)

  res.json({ airports: results })
})

// Flight search — hits SerpAPI Google Flights
app.get('/api/flights', async (req: Request, res: Response) => {
  const { from, to, date, returnDate, type } = req.query as Record<string, string>

  if (!from || !to || !date) {
    res.status(400).json({ error: 'Missing required params: from, to, date' })
    return
  }

  if (!SERPAPI_KEY) {
    res.status(500).json({ error: 'Missing SERPAPI_KEY environment variable' })
    return
  }

  const isRoundTrip = type === '1' && returnDate
  const params = new URLSearchParams({
    engine:         'google_flights',
    departure_id:   from,
    arrival_id:     to,
    outbound_date:  date,
    currency:       'USD',
    hl:             'en',
    type:           isRoundTrip ? '1' : '2',
    api_key:        SERPAPI_KEY ?? '',
  })
  if (isRoundTrip) params.set('return_date', returnDate)

  try {
    const data = await fetchSerpApiJson(params)

    const sections: FlightSection[] = ['best_flights', 'other_flights']
    const rawFlights = sections.flatMap(section => {
      const items = (data[section] ?? []) as FlightItem[]
      return items.map(item => normalizeFlightResult(item, section))
    })
    const flights = await Promise.all(
      rawFlights.map(item => enrichFlightWithLivePrice(item, from, to, date))
    )

    res.json({
      flights,
      count: flights.length,
      best_flights: data.best_flights ?? [],
      other_flights: data.other_flights ?? [],
      price_insights: data.price_insights ?? null,
      airports: data.airports ?? null,
      search_metadata: data.search_metadata ?? null,
      search_parameters: data.search_parameters ?? null,
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// AI recommendation — calls Groq with flight list + user prompt
app.post('/api/recommend', async (req: Request, res: Response) => {
  const { flights, prompt } = req.body as { flights: FlightSummary[]; prompt: string }

  if (!flights?.length || !prompt) {
    res.status(400).json({ error: 'Missing required body fields: flights, prompt' })
    return
  }

  if (!GROQ_KEY) {
    res.status(500).json({ error: 'Missing GROQ_API_KEY environment variable' })
    return
  }

  try {
    const result = await recommendFlights(flights, prompt, GROQ_KEY)
    res.json(result)
  } catch (err) {
    res.status(502).json({ error: String(err) })
  }
})

app.post('/api/layover-meetups', async (req: Request, res: Response) => {
  const {
    contactName,
    city,
    airport,
    iata,
  } = req.body as {
    contactName?: string
    city?: string
    airport?: string
    iata?: string
  }

  if (!contactName || !airport) {
    res.status(400).json({ error: 'Missing required body fields: contactName, airport' })
    return
  }

  if (!SERPAPI_KEY) {
    res.status(500).json({ error: 'Missing SERPAPI_KEY environment variable' })
    return
  }

  try {
    const suggestions = await findNearbyCoffeeShops(airport, city, iata)

    const systemPrompt = `You suggest quick meetup venues for airline layovers near airports.
Return ONLY valid JSON in this exact shape:
{
  "message": "One short casual meetup suggestion"
}
Rules:
- Keep the tone friendly, casual, and helpful.
- Mention the contact's first name.
- Mention the layover city.
- Mention one or both coffee shop names.
- Limit the message to 1-2 sentences.`

    const userPrompt = `Contact name: ${contactName}
Layover city: ${city ?? 'the layover city'}
Coffee shop options: ${suggestions.map(suggestion => `${suggestion.name} (${suggestion.address})`).join(', ')}`

    const result = await fetchGroqJson<{ message?: string }>(systemPrompt, userPrompt)

    if (!result.message || typeof result.message !== 'string') {
      throw new Error('Groq did not return a meetup message')
    }

    res.json({
      message: result.message,
      suggestions: suggestions.filter(isMeetupSuggestion),
    })
  } catch (err) {
    res.status(502).json({ error: String(err) })
  }
})

app.get('/api/google-flights-link', async (req: Request, res: Response) => {
  const {
    from,
    to,
    date,
    returnDate,
    bookingToken,
  } = req.query as Record<string, string>

  if (!from || !to || !date || !bookingToken) {
    res.status(400).json({ error: 'Missing required params: from, to, date, bookingToken' })
    return
  }

  if (!SERPAPI_KEY) {
    res.status(500).json({ error: 'Missing SERPAPI_KEY environment variable' })
    return
  }

  const params = new URLSearchParams({
    engine: 'google_flights',
    departure_id: from,
    arrival_id: to,
    outbound_date: date,
    type: returnDate ? '1' : '2',
    hl: 'en',
    currency: 'USD',
    booking_token: bookingToken,
    api_key: SERPAPI_KEY,
  })

  if (returnDate) params.set('return_date', returnDate)

  try {
    const data = await fetchSerpApiJson(params)

    const googleFlightsUrl = (data.search_metadata as { google_flights_url?: string } | undefined)?.google_flights_url

    if (!googleFlightsUrl) {
      res.status(404).json({ error: 'No Google Flights URL returned for this flight' })
      return
    }

    res.json({
      url: googleFlightsUrl,
      selected_flights: data.selected_flights ?? [],
      booking_options: data.booking_options ?? [],
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

app.get('/api/google-flights-redirect', async (req: Request, res: Response) => {
  const {
    from,
    to,
    date,
    returnDate,
    bookingToken,
  } = req.query as Record<string, string>

  if (!from || !to || !date) {
    res.status(400).send('Missing required params: from, to, date')
    return
  }

  const fallbackUrl = `https://www.google.com/travel/flights?hl=en#flt=${from}.${to}.${date};c:USD;e:1;sd:1;t:f`

  if (!bookingToken) {
    res.redirect(fallbackUrl)
    return
  }

  if (!SERPAPI_KEY) {
    res.redirect(fallbackUrl)
    return
  }

  const params = new URLSearchParams({
    engine: 'google_flights',
    departure_id: from,
    arrival_id: to,
    outbound_date: date,
    type: returnDate ? '1' : '2',
    hl: 'en',
    currency: 'USD',
    booking_token: bookingToken,
    api_key: SERPAPI_KEY,
  })

  if (returnDate) params.set('return_date', returnDate)

  try {
    const data = await fetchSerpApiJson(params)
    const googleFlightsUrl = (data.search_metadata as { google_flights_url?: string } | undefined)?.google_flights_url
    res.redirect(googleFlightsUrl || fallbackUrl)
  } catch {
    res.redirect(fallbackUrl)
  }
})

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
