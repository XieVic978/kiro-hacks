import { useState, useRef } from 'react'
import './App.css'
import AIRPORTS from './data/airports.json'
import { useContacts } from './store/ContactsContext'
import { useSearch } from './store/SearchContext'

// ── Airport autocomplete ──────────────────────────────────────────────────────

function filterAirports(query) {
  if (!query || query.length < 1) return []
  const q = query.toLowerCase()
  return AIRPORTS.filter(a =>
    a.city.toLowerCase().startsWith(q) ||
    a.code.toLowerCase().startsWith(q) ||
    a.name.toLowerCase().startsWith(q)
  ).slice(0, 6)
}

function AirportInput({ label, placeholder, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const suggestions = filterAirports(value)
  const containerRef = useRef(null)

  function select(airport) {
    onChange(`${airport.city} (${airport.code})`)
    setOpen(false)
    setHighlighted(-1)
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && highlighted >= 0) { e.preventDefault(); select(suggestions[highlighted]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setHighlighted(-1) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((airport, i) => (
            <li
              key={airport.code}
              onMouseDown={() => select(airport)}
              onMouseEnter={() => setHighlighted(i)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer text-sm ${highlighted === i ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
            >
              <span className="font-mono font-semibold text-blue-600 w-10 shrink-0">{airport.code}</span>
              <div className="min-w-0">
                <p className="text-gray-800 font-medium truncate">{airport.city}</p>
                <p className="text-gray-400 text-xs truncate">{airport.name}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Mock flight data ──────────────────────────────────────────────────────────

const MOCK_FLIGHTS = [
  {
    id: 1, airline: 'Southwest',         dep: '7:00 AM',  arr: '3:00 PM',  duration: '8h 0m',  stops: '2 stops',  price: 229,
    disabilityFeatures: ['Wheelchair assistance', 'Priority boarding', 'Accessible lavatories'],
    layovers: [
      { city: 'Denver',  airport: 'Denver (DEN)',          layoverMinutes: 55  },
      { city: 'Phoenix', airport: 'Phoenix (PHX)',          layoverMinutes: 40  },
    ],
  },
  {
    id: 2, airline: 'Delta Airlines',    dep: '8:00 AM',  arr: '2:00 PM',  duration: '6h 0m',  stops: 'Non-stop', price: 299,
    disabilityFeatures: ['Wheelchair assistance', 'Priority boarding', 'Onboard wheelchair', 'Hearing loop'],
    layovers: [],
  },
  {
    id: 3, airline: 'United Airlines',   dep: '9:30 AM',  arr: '4:30 PM',  duration: '7h 0m',  stops: '1 stop',   price: 249,
    disabilityFeatures: [],
    layovers: [
      { city: 'Chicago', airport: "Chicago O'Hare (ORD)",  layoverMinutes: 120 },
    ],
  },
  {
    id: 4, airline: 'American Airlines', dep: '6:00 AM',  arr: '11:30 AM', duration: '5h 30m', stops: 'Non-stop', price: 349,
    disabilityFeatures: ['Wheelchair assistance', 'Accessible lavatories', 'Service animal relief area'],
    layovers: [],
  },
  {
    id: 5, airline: 'JetBlue',           dep: '12:00 PM', arr: '6:30 PM',  duration: '6h 30m', stops: 'Non-stop', price: 279,
    disabilityFeatures: ['Wheelchair assistance', 'Priority boarding'],
    layovers: [],
  },
]

const MIN_MEETUP_MINUTES = 90

// ── Never Waste a Connection ──────────────────────────────────────────────────

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
    const cityContacts = contacts.filter(c =>
      haystack.includes(c.city.toLowerCase())
    )
    if (cityContacts.length > 0) {
      matches.push({ layover, contacts: cityContacts })
    }
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

const API = 'http://localhost:5051'

// Extract IATA code from strings like "San Francisco (SFO)"
function extractCode(val) {
  const m = val.match(/\(([A-Z]{3})\)/)
  return m ? m[1] : val.trim()
}

// Map SerpAPI layover data → our layover shape
function normalizeLayovers(rawLayovers = []) {
  return rawLayovers.map(l => ({
    city:           l.name ?? '',
    airport:        l.name ? `${l.name} (${l.id ?? ''})` : (l.id ?? ''),
    layoverMinutes: l.duration ?? 0,
  }))
}

// Map a normalized backend flight → UI flight shape
function toUiFlight(f, index) {
  return {
    id:                index,
    airline:           f.airline ?? 'Unknown',
    dep:               f.departure_time ?? '—',
    arr:               f.arrival_time   ?? '—',
    duration:          f.duration       ?? '—',
    stops:             f.stops_text     ?? 'Non-stop',
    price:             f.price          ?? 0,
    disabilityFeatures: [],           // SerpAPI doesn't provide this
    layovers:          normalizeLayovers(f.layovers ?? []),
    result_type:       f.result_type   ?? 'other',
  }
}


const PRIORITIES = [
  { key: 'cheapest', label: 'Cheapest', emoji: '💰' },
  { key: 'fastest',  label: 'Fastest',  emoji: '⚡' },
  { key: 'comfort',  label: 'Comfort',  emoji: '✨' },
]

function sortFlights(flights, priority) {
  const sorted = [...flights]
  if (priority === 'cheapest') return sorted.sort((a, b) => a.price - b.price)
  if (priority === 'fastest') return sorted.sort((a, b) => {
    const mins = f => {
      const [h, m] = f.duration.replace('h', '').replace('m', '').trim().split(' ')
      return parseInt(h) * 60 + parseInt(m)
    }
    return mins(a) - mins(b)
  })
  return sorted.sort((a, b) => {
    const nonstop = x => x.stops === 'Non-stop' ? 0 : 1
    return nonstop(a) - nonstop(b) || a.price - b.price
  })
}

function whyText(priority, flight, disabilityMode) {
  const disabilityNote = disabilityMode && flight.disabilityFeatures.length
    ? ` It also offers ${flight.disabilityFeatures.length} accessibility feature${flight.disabilityFeatures.length > 1 ? 's' : ''} including ${flight.disabilityFeatures[0].toLowerCase()}.`
    : ''
  if (priority === 'cheapest')
    return `This flight offers the lowest price at $${flight.price}, saving you money while still getting you to your destination efficiently.${disabilityNote}`
  if (priority === 'fastest')
    return `This flight has the shortest travel time at ${flight.duration}, getting you to your destination as quickly as possible.${disabilityNote}`
  return `This flight offers the best comfort with ${flight.stops} and a reasonable price of $${flight.price}.${disabilityNote}`
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const { contacts } = useContacts()
  const {
    from, setFrom,
    to, setTo,
    date, setDate,
    budget, setBudget,
    priority, setPriority,
    disabilityMode, setDisabilityMode,
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
      const fromCode = extractCode(from)
      const toCode   = extractCode(to)
      const res = await fetch(
        `${API}/api/flights?from=${fromCode}&to=${toCode}&date=${date}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'API error')

      let flights = data.flights.map(toUiFlight)

      // Budget filter
      if (budget) flights = flights.filter(f => f.price <= Number(budget))
      if (!flights.length) flights = data.flights.map(toUiFlight) // relax if nothing fits

      setResults(sortFlights(flights, priority))
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
        <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Flight Decision AI</h1>
        <p className="mt-2 text-gray-500 text-base">
          Let AI help you find the perfect flight based on what matters most to you
        </p>
      </div>

      {/* Search card + disability toggle */}
      <div className="max-w-3xl mx-auto mb-5 flex gap-3 items-start">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

        {/* Disability toggle */}
        <div className="shrink-0 flex flex-col items-center gap-2 pt-1">
          <button type="button" onClick={() => setDisabilityMode(v => !v)} aria-pressed={disabilityMode}
            title="Disability-friendly flights only"
            className={`w-14 h-14 rounded-xl border-2 text-2xl flex items-center justify-center transition-colors cursor-pointer ${disabilityMode ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-white border-gray-300 text-gray-400 hover:border-purple-300 hover:text-purple-500'}`}>
            ♿
          </button>
          {disabilityMode && <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">ON</span>}
        </div>
      </div>

      {/* Error banner */}
      {apiError && (
        <div className="max-w-3xl mx-auto mb-4 bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700">
          ⚠️ {apiError}
        </div>
      )}

      {/* Empty state */}
      {!results && (
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
            <div className="grid grid-cols-3 gap-3">
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
                  {disabilityMode && best.disabilityFeatures?.length > 0 && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      ♿ Accessibility friendly
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-blue-600 font-semibold text-lg">${best.price}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Departure</p><p className="font-medium text-gray-800">{best.dep}</p></div>
                <div><p className="text-xs text-gray-500">Arrival</p><p className="font-medium text-gray-800">{best.arr}</p></div>
                <div><p className="text-xs text-gray-500">Duration</p><p className="font-medium text-gray-800">{best.duration}</p></div>
                <div><p className="text-xs text-gray-500">Stops</p><p className="font-medium text-gray-800">{best.stops}</p></div>
              </div>

              {disabilityMode && best.disabilityFeatures?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs text-gray-500 mb-2">Accessibility features</p>
                  <div className="flex flex-wrap gap-2">
                    {best.disabilityFeatures.map(f => (
                      <span key={f} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              <ConnectionInsight layovers={best.layovers} contacts={contacts} />
            </div>
          )}

          {/* Why this flight */}
          {best && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-3 items-start">
              <span className="text-xl">🤖</span>
              <div>
                <p className="text-gray-800 font-medium text-sm mb-0.5">Why this flight?</p>
                <p className="text-blue-600 text-sm">{whyText(priority, best, disabilityMode)}</p>
              </div>
            </div>
          )}

          {/* Other options */}
          {others && others.length > 0 && (
            <div>
              <h2 className="text-gray-800 font-medium text-base mb-3">Other Options</h2>
              <div className="space-y-2">
                {others.map(flight => (
                  <div key={flight.id} className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm">{flight.airline}</p>
                          {disabilityMode && flight.disabilityFeatures?.length > 0 && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">♿</span>
                          )}
                        </div>
                        <div className="flex gap-0 mt-0.5 text-gray-500 text-sm">
                          <span className="w-44 shrink-0">{flight.dep} → {flight.arr}</span>
                          <span className="w-16 shrink-0">{flight.duration}</span>
                          <span>{flight.stops}</span>
                        </div>
                      </div>
                      <p className="text-gray-800 font-semibold text-sm">${flight.price}</p>
                    </div>
                    {flight.layovers?.length > 0 && (
                      <ConnectionInsight layovers={flight.layovers} contacts={contacts} />
                    )}
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
