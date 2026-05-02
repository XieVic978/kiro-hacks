import { useState } from 'react'
import './App.css'

const MOCK_FLIGHTS = [
  { id: 1, airline: 'Southwest',      dep: '7:00 AM',  arr: '3:00 PM',  duration: '8h 0m',   stops: '2 stops',  price: 229 },
  { id: 2, airline: 'Delta Airlines', dep: '8:00 AM',  arr: '2:00 PM',  duration: '6h 0m',   stops: 'Non-stop', price: 299 },
  { id: 3, airline: 'United Airlines',dep: '9:30 AM',  arr: '4:30 PM',  duration: '7h 0m',   stops: '1 stop',   price: 249 },
  { id: 4, airline: 'American Airlines',dep:'6:00 AM', arr: '11:30 AM', duration: '5h 30m',  stops: 'Non-stop', price: 349 },
  { id: 5, airline: 'JetBlue',        dep: '12:00 PM', arr: '6:30 PM',  duration: '6h 30m',  stops: 'Non-stop', price: 279 },
]

const PRIORITIES = [
  { key: 'cheapest', label: 'Cheapest',  emoji: '💰' },
  { key: 'fastest',  label: 'Fastest',   emoji: '⚡' },
  { key: 'comfort',  label: 'Comfort',   emoji: '✨' },
]

function sortFlights(flights, priority) {
  const sorted = [...flights]
  if (priority === 'cheapest') return sorted.sort((a, b) => a.price - b.price)
  if (priority === 'fastest')  return sorted.sort((a, b) => {
    const mins = f => {
      const [h, m] = f.duration.replace('h', '').replace('m', '').trim().split(' ')
      return parseInt(h) * 60 + parseInt(m)
    }
    return mins(a) - mins(b)
  })
  // comfort: non-stop first, then price
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

export default function App() {
  const [from, setFrom]       = useState('')
  const [to, setTo]           = useState('')
  const [date, setDate]       = useState('')
  const [budget, setBudget]   = useState('')
  const [priority, setPriority] = useState('cheapest')
  const [results, setResults] = useState(null)

  const canSearch = from.trim() && to.trim() && date && budget

  function handleSearch() {
    if (!canSearch) return
    const filtered = MOCK_FLIGHTS.filter(f => f.price <= Number(budget))
    setResults(sortFlights(filtered.length ? filtered : MOCK_FLIGHTS, priority))
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

      {/* Search card */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5">
        <div className="grid grid-cols-4 gap-4 mb-5">
          {/* From */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">From</label>
            <input
              type="text"
              placeholder="San Francisco"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* To */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">To</label>
            <input
              type="text"
              placeholder="New York"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Date */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Budget */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Max Budget</label>
            <input
              type="number"
              placeholder="500"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={!canSearch}
          className={`w-full py-2.5 rounded-md text-sm font-medium transition-colors ${
            canSearch
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Search Flights
        </button>
      </div>

      {/* Empty state */}
      {!results && (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">✈️</div>
          <p className="text-gray-800 font-medium text-base">Ready to find your perfect flight?</p>
          <p className="text-gray-500 text-sm mt-1">
            Enter your travel details above and let AI help you choose the best option.
          </p>
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
                <button
                  key={p.key}
                  onClick={() => {
                    setPriority(p.key)
                    setResults(sortFlights(results, p.key))
                  }}
                  className={`py-2 rounded-md text-sm font-medium transition-colors ${
                    priority === p.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Best match card */}
          {best && (
            <div className="bg-blue-50 rounded-xl border-2 border-blue-400 p-5 relative">
              {/* Badge */}
              <div className="absolute -top-3.5 left-4">
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  ⭐ Best Match
                </span>
              </div>

              <div className="flex justify-between items-start mb-4 mt-1">
                <div>
                  <p className="text-xs text-gray-500">Airline</p>
                  <p className="font-semibold text-gray-900">{best.airline}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-blue-600 font-semibold text-lg">${best.price}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Departure</p>
                  <p className="font-medium text-gray-800">{best.dep}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Arrival</p>
                  <p className="font-medium text-gray-800">{best.arr}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-medium text-gray-800">{best.duration}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Stops</p>
                  <p className="font-medium text-gray-800">{best.stops}</p>
                </div>
              </div>
            </div>
          )}

          {/* Why this flight */}
          {best && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-3 items-start">
              <span className="text-xl">🤖</span>
              <div>
                <p className="text-gray-800 font-medium text-sm mb-0.5">Why this flight?</p>
                <p className="text-blue-600 text-sm">{whyText(priority, best)}</p>
              </div>
            </div>
          )}

          {/* Other options */}
          {others && others.length > 0 && (
            <div>
              <h2 className="text-gray-800 font-medium text-base mb-3">Other Options</h2>
              <div className="space-y-2">
                {others.map(flight => (
                  <div
                    key={flight.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{flight.airline}</p>
                      <p className="text-gray-500 text-sm mt-0.5">
                        {flight.dep} → {flight.arr}
                        <span className="mx-2 text-gray-300">|</span>
                        {flight.duration}
                        <span className="mx-2 text-gray-300">|</span>
                        {flight.stops}
                      </p>
                    </div>
                    <p className="text-gray-800 font-semibold text-sm">${flight.price}</p>
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
