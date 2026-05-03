import { useState, useRef } from 'react'
import AIRPORTS from '../data/airports.json'

function filterAirports(query) {
  if (!query || query.length < 1) return []
  const q = query.toLowerCase()
  return AIRPORTS.filter(a =>
    a.city.toLowerCase().includes(q) ||
    a.code.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q) ||
    (a.country && a.country.toLowerCase().includes(q))
  ).slice(0, 8)
}

export default function AirportInput({ label, placeholder, value, onChange }) {
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
    if (e.key === ' ') {
      e.stopPropagation() // prevent form from intercepting space
      return
    }
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && highlighted >= 0) { e.preventDefault(); select(suggestions[highlighted]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setHighlighted(-1) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        onKeyPress={e => { if (e.key === ' ') e.stopPropagation() }}
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
                <p className="text-gray-400 text-xs truncate">{airport.name}{airport.country ? ` · ${airport.country}` : ''}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
