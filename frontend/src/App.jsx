import { useState } from 'react'
import './App.css'
import { useContacts } from './store/ContactsContext'
import { useSearch } from './store/SearchContext'
import AirportInput from './components/AirportInput'

// ── Never Waste a Connection ──────────────────────────────────────────────────

const MIN_MEETUP_MINUTES = 90

function formatLayover(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function getMatchingContacts(layovers, contacts) {
  const matches = []
  for (const layover of layovers) {
    if (layover.layoverMinutes < MIN_MEETUP_MINUTES) continue
    const haystack = `${layover.city} ${layover.airport}`.toLowerCase()
    const cityContacts = contacts.filter(c => haystack.includes(c.city.toLowerCase()))
    if (cityContacts.length > 0) matches.push({ layover, contacts: cityContacts })
  }
  return matches
}

function ConnectionInsight({ layovers, contacts }) {
  if (!layovers || layovers.length === 0) return null
  const meetupMatches = getMatchingContacts(layovers, contacts)

  return (
    <div className="mt-4 pt-4 border-t border-blue-200 space-y-2">
      {layovers.map((layover, i) => {
        const match = meetupMatches.find(m => m.layover.city === layover.city)
        return (
          <div key={i} className="rounded-lg border border-blue-100 bg-white px-3 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-800">✈️ Layover in {layover.airport}</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {formatLayover(layover.layoverMinutes)}
              </span>
            </div>
            {match ? (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                <p className="text-xs font-semibold text-green-700 mb-1.5">
                  🤝 Never Waste a Connection — you have {match.contacts.length === 1 ? 'a contact' : 'contacts'} here!
                </p>
                {match.contacts.map(c => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-gray-800">{c.name}</span>
                      <span className="text-xs text-gray-500"> · {c.role} at {c.company}</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Suggest meetup →</span>
                  </div>
                ))}
                <p className="text-xs text-green-600 mt-1.5">
                  You have {formatLayover(layover.layoverMinutes)} — enough time for a quick coffee meeting.
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                {layover.layoverMinutes < MIN_MEETUP_MINUTES
                  ? `Only ${formatLayover(layover.layoverMinutes)} — too short for a meetup. Head straight to your gate.`
                  : `${formatLayover(layover.layoverMinutes)} layover — no contacts in this city.`}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── API helpers ───────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5051'

function buildGoogleFlightsSearchUrl(fromCode, toCode, date) {
  return `https://www.google.com/travel/flights?hl=en#flt=${fromCode}.${toCode}.${date};c:USD;e:1;sd:1;t:f`
}

function buildGoogleFlightsRedirectUrl(fromCode, toCode, date, bookingToken = null) {
  const params = new URLSearchParams({
    from: fromCode,
    to: toCode,
    date,
  })

  if (bookingToken) params.set('bookingToken', bookingToken)

  return `${API}/api/google-flights-redirect?${params.toString()}`
}

function extractCode(val) {
  const m = val.match(/\(([A-Z]{3})\)/)
  return m ? m[1] : val.trim()
}

function normalizeLayovers(rawLayovers = []) {
  return rawLayovers.map(l => ({
    city:           l.name ?? '',
    airport:        l.name ? `${l.name} (${l.id ?? ''})` : (l.id ?? ''),
    layoverMinutes: l.duration ?? 0,
  }))
}

function toUiFlight(f, index, fromCode, toCode, date) {
  return {
    id:            f.booking_token ?? `${fromCode}-${toCode}-${date}-${index}`,
    airline:       f.airline ?? 'Unknown',
    dep:           f.departure_time ?? '—',
    arr:           f.arrival_time   ?? '—',
    duration:      f.duration       ?? '—',
    stops:         f.stops_text     ?? 'Non-stop',
    price:         f.price          ?? 0,
    layovers:      normalizeLayovers(f.layovers ?? []),
    result_type:   f.result_type    ?? 'other',
    booking_token: f.booking_token  ?? null,
    booking_provider: f.booking_provider ?? null,
    price_source:  f.price_source ?? 'search_results',
    search_results_price: f.search_results_price ?? null,
    google_flights_redirect_url: buildGoogleFlightsRedirectUrl(fromCode, toCode, date, f.booking_token ?? null),
  }
}

// ── Priorities / sort ─────────────────────────────────────────────────────────

const PRIORITIES = [
  { key: 'cheapest', label: 'Cheapest', emoji: '💰' },
  { key: 'fastest',  label: 'Fastest',  emoji: '⚡' },
]

function sortFlights(flights, priority) {
  const sorted = [...flights]
  if (priority === 'cheapest') return sorted.sort((a, b) => a.price - b.price)
  if (priority === 'fastest') return sorted.sort((a, b) => {
    const mins = f => {
      const [h, m] = (f.duration ?? '0h 0m').replace('h', '').replace('m', '').trim().split(' ')
      return parseInt(h) * 60 + parseInt(m)
    }
    return mins(a) - mins(b)
  })
  return sorted.sort((a, b) => {
    const nonstop = x => x.stops === 'Non-stop' ? 0 : 1
    return nonstop(a) - nonstop(b) || a.price - b.price
  })
}

function whyText(priority, flight) {
  if (priority === 'cheapest')
    return `This flight offers the lowest price at $${flight.price}, saving you money while still getting you to your destination efficiently.`
  if (priority === 'fastest')
    return `This flight has the shortest travel time at ${flight.duration}, getting you to your destination as quickly as possible.`
  return `This flight offers the best comfort with ${flight.stops} and a reasonable price of $${flight.price}.`
}

// ── Why this flight (Groq AI) ─────────────────────────────────────────────────

function WhyThisFlight({ best, allFlights, priority }) {
  const [aiText, setAiText]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  // Reset when best flight changes
  const [lastBestId, setLastBestId] = useState(null)
  if (best?.id !== lastBestId) {
    setLastBestId(best?.id ?? null)
    if (aiText)  setAiText(null)
    if (error)   setError(null)
  }

  async function askAI() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`${API}/api/recommend`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          flights: allFlights,
          prompt:  `I want the ${priority} flight. The top pick is ${best.airline} at $${best.price} (${best.duration}, ${best.stops}). Explain in 2-3 sentences why this is the best choice compared to the other options. Use the airline name, not index numbers.`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AI request failed')
      setAiText(data.reasoning ?? data.recommendation)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex gap-3 items-start mb-3">
        <span className="text-xl">🤖</span>
        <div className="flex-1">
          <p className="text-gray-800 font-medium text-sm mb-0.5">Why this flight?</p>
          {aiText ? (
            <p className="text-blue-600 text-sm">{aiText}</p>
          ) : (
            <p className="text-gray-400 text-sm">{whyText(priority, best)}</p>
          )}
          {error && <p className="text-red-500 text-xs mt-1">⚠️ {error}</p>}
        </div>
      </div>
      {!aiText && (
        <button
          onClick={askAI}
          disabled={loading}
          className={`w-full py-2 rounded-md text-sm font-medium border transition-colors cursor-pointer
            ${loading
              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'}`}
        >
          {loading ? '✨ Asking AI…' : '✨ Ask AI to explain this pick'}
        </button>
      )}
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const { contacts } = useContacts()
  const {
    from, setFrom,
    to, setTo,
    date, setDate,
    priority, setPriority,
    results, setResults,
    clear: handleClear,
  } = useSearch()

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)

  const canSearch = from.trim() && to.trim() && date

  async function handleSearch() {
    if (!canSearch) return
    setLoading(true)
    setApiError(null)
    setResults(null)
    try {
      const searchedFromCode = extractCode(from)
      const searchedToCode   = extractCode(to)
      const searchedDate     = date
      const res  = await fetch(`${API}/api/flights?from=${searchedFromCode}&to=${searchedToCode}&date=${searchedDate}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'API error')
      const uiFlights = data.flights.map((flight, index) =>
        toUiFlight(flight, index, searchedFromCode, searchedToCode, searchedDate)
      )
      setResults(sortFlights(uiFlights, priority))
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const best   = results?.[0]
  const others = results?.slice(1)

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">ConnectFlight</h1>
        <p className="mt-2 text-gray-500 text-base">
          Let AI help you find the perfect flight based on what matters most to you
        </p>
      </div>

      {/* Search card */}
      <div className="max-w-3xl mx-auto mb-5 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <AirportInput label="From" placeholder="San Francisco" value={from} onChange={setFrom} />
          <AirportInput label="To"   placeholder="New York"      value={to}   onChange={setTo}   />
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSearch} disabled={!canSearch || loading}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${canSearch && !loading ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {loading ? 'Searching…' : 'Search Flights'}
          </button>
          {results && (
            <button onClick={handleClear}
              className="px-5 py-2.5 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {apiError && (
        <div className="max-w-3xl mx-auto mb-4 bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700">
          ⚠️ {apiError}
        </div>
      )}

      {/* Empty state */}
      {!results && !loading && (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">✈️</div>
          <p className="text-gray-800 font-medium text-base">Ready to find your perfect flight?</p>
          <p className="text-gray-500 text-sm mt-1">Enter your travel details above and let AI help you choose the best option.</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Priority selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-gray-800 font-medium mb-3">What matters most to you?</p>
            <div className="grid grid-cols-2 gap-3">
              {PRIORITIES.map(p => (
                <button key={p.key}
                  onClick={() => { setPriority(p.key); setResults(sortFlights(results, p.key)) }}
                  className={`py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${priority === p.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Best match card */}
          {best && (
            <div className="bg-blue-50 rounded-xl border-2 border-blue-400 p-5 relative">
              <div className="absolute -top-3.5 left-4">
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">⭐ Best Match</span>
              </div>
              <div className="flex justify-between items-start mb-4 mt-1">
                <div>
                  <p className="text-xs text-gray-500">Airline</p>
                  <p className="font-semibold text-gray-900">{best.airline}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-blue-600 font-semibold text-lg">${best.price}</p>
                  {best.booking_provider && (
                    <p className="text-xs text-gray-500 mt-0.5">via {best.booking_provider}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Departure</p><p className="font-medium text-gray-800">{best.dep}</p></div>
                <div><p className="text-xs text-gray-500">Arrival</p><p className="font-medium text-gray-800">{best.arr}</p></div>
                <div><p className="text-xs text-gray-500">Duration</p><p className="font-medium text-gray-800">{best.duration}</p></div>
                <div><p className="text-xs text-gray-500">Stops</p><p className="font-medium text-gray-800">{best.stops}</p></div>
              </div>
              <ConnectionInsight layovers={best.layovers} contacts={contacts} />
              <a
                href={best.google_flights_redirect_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-md text-sm font-medium bg-white border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/></svg>
                View Flights
              </a>
            </div>
          )}

          {/* Why this flight */}
          {best && <WhyThisFlight best={best} allFlights={results} priority={priority} />}

          {/* Other options */}
          {others && others.length > 0 && (
            <div>
              <h2 className="text-gray-800 font-medium text-base mb-3">Other Options</h2>
              <div className="overflow-y-auto max-h-96 space-y-2 pr-1">
                {others.map(flight => (
                  <div key={flight.id} className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{flight.airline}</p>
                        <div className="flex gap-0 mt-0.5 text-gray-500 text-sm">
                          <span className="w-44 shrink-0">{flight.dep} → {flight.arr}</span>
                          <span className="w-16 shrink-0">{flight.duration}</span>
                          <span>{flight.stops}</span>
                        </div>
                      </div>
                      <p className="text-gray-800 font-semibold text-sm">${flight.price}</p>
                    </div>
                    {flight.booking_provider && (
                      <p className="text-xs text-gray-500 mt-2">via {flight.booking_provider}</p>
                    )}
                    {flight.layovers?.length > 0 && (
                      <ConnectionInsight layovers={flight.layovers} contacts={contacts} />
                    )}
                    <a
                      href={flight.google_flights_redirect_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full py-1.5 rounded-md text-xs font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/></svg>
                      View Flights
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
