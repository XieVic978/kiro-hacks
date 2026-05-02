import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import airports from './airports.json'

dotenv.config({ path: '.env.local' })

const app = express()
app.use(cors())

const SERPAPI_KEY = process.env.SERPAPI_KEY ?? process.env.VITE_SERPAPI_KEY
const PORT = Number(process.env.PORT ?? 5051)

// ── Types ────────────────────────────────────────────────────────────────────

interface Airport {
  id: string
  name: string
  city: string
  state: string
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
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
  const { from, to, date } = req.query as Record<string, string>

  if (!from || !to || !date) {
    res.status(400).json({ error: 'Missing required params: from, to, date' })
    return
  }

  if (!SERPAPI_KEY) {
    res.status(500).json({ error: 'Missing SERPAPI_KEY environment variable' })
    return
  }

  const params = new URLSearchParams({
    engine:         'google_flights',
    departure_id:   from,
    arrival_id:     to,
    outbound_date:  date,
    currency:       'USD',
    hl:             'en',
    type:           '2',   // one-way
    api_key:        SERPAPI_KEY ?? '',
  })

  try {
    const response = await fetch(`https://serpapi.com/search?${params}`)
    const text = await response.text()

    if (!text) {
      res.status(502).json({ error: 'Empty response from SerpAPI' })
      return
    }

    let data: Record<string, unknown>
    try {
      data = JSON.parse(text)
    } catch {
      console.error('SerpAPI raw response:', text.slice(0, 500))
      res.status(502).json({ error: 'Invalid JSON from SerpAPI' })
      return
    }

    // Surface any SerpAPI-level error
    if (data.error) {
      res.status(502).json({ error: data.error })
      return
    }

    const sections: FlightSection[] = ['best_flights', 'other_flights']
    const flights = sections.flatMap(section => {
      const items = (data[section] ?? []) as FlightItem[]
      return items.map(item => normalizeFlightResult(item, section))
    })

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

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
