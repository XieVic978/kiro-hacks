import { useState } from 'react'
import { useContacts } from '../store/ContactsContext'
import AirportInput from '../components/AirportInput'

// Strip "(CODE)" suffix so contacts store just the city name — don't trim so typing spaces works
function extractCity(val) {
  return val.replace(/\s*\([A-Z]{3}\)$/, '')
}

function ContactCard({ contact, onRemove, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [name,    setName]    = useState(contact.name)
  const [company, setCompany] = useState(contact.company)
  const [city,    setCity]    = useState(contact.city)
  const [role,    setRole]    = useState(contact.role ?? '')

  // Sync fields when contact data changes (e.g. after a save)
  function resetFields() {
    setName(contact.name)
    setCompany(contact.company)
    setCity(contact.city)
    setRole(contact.role ?? '')
  }

  function handleSave() {
    if (!name.trim() || !company.trim() || !city.trim()) return
    onEdit(contact.id, { name: name.trim(), company: company.trim(), city: city.trim(), role: role.trim() })
    setEditing(false)
  }

  function handleCancel() {
    resetFields()
    setEditing(false)
  }

  const initials = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-blue-300 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm shrink-0">
            {initials}
          </div>
          <p className="text-sm font-semibold text-gray-800">Edit Contact</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Company *</label>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">City *</label>
            <AirportInput
              placeholder="Chicago"
              value={city}
              onChange={val => setCity(extractCity(val))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Product Manager"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleSave} disabled={!name.trim() || !company.trim() || !city.trim()}
            className="flex-1 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer transition-colors">
            Save
          </button>
          <button type="button" onClick={handleCancel}
            className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{contact.name}</p>
          <p className="text-xs text-gray-500">{contact.role}{contact.role && ' · '}{contact.company}</p>
          <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600">
            📍 {contact.city}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setEditing(true)}
          className="text-gray-300 hover:text-blue-500 transition-colors cursor-pointer text-sm opacity-0 group-hover:opacity-100"
          title="Edit contact"
        >
          ✏️
        </button>
        <button
          onClick={() => onRemove(contact.id)}
          className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer text-lg leading-none"
          title="Remove contact"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function AddContactForm({ onAdd, onCancel }) {
  const [name,    setName]    = useState('')
  const [company, setCompany] = useState('')
  const [city,    setCity]    = useState('')
  const [role,    setRole]    = useState('')

  function handleSubmit() {
    if (!name.trim() || !company.trim() || !city.trim()) return
    onAdd({ name: name.trim(), company: company.trim(), city: city.trim(), role: role.trim() })
  }

  const valid = name.trim() && company.trim() && city.trim()

  return (
    <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-800 mb-4">New Contact</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Company *</label>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">City *</label>
          <AirportInput
            placeholder="Chicago"
            value={city}
            onChange={val => setCity(extractCity(val))}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Role</label>
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Product Manager"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleSubmit} disabled={!valid}
          className="flex-1 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer transition-colors">
          Add Contact
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function ConnectionsPage() {
  const { contacts, addContact, removeContact, updateContact } = useContacts()
  const [showForm, setShowForm] = useState(false)
  const [cityFilter, setCityFilter] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')

  function handleAdd(contact) {
    addContact(contact)
    setShowForm(false)
  }

  // Unique cities from all contacts, sorted
  const allCities = [...new Set(contacts.map(c => c.city))].sort()

  // Apply city filter then search
  const filtered = contacts
    .filter(c => cityFilter ? c.city === cityFilter : true)
    .filter(c => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.role && c.role.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q))
      )
    })

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">My Connections</h1>
          <p className="mt-2 text-gray-500 text-base">
            People you know in cities around the world — we'll suggest meetups during your layovers.
          </p>
        </div>

        {/* Stats bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤝</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-500">
                {allCities.length} cit{allCities.length !== 1 ? 'ies' : 'y'} covered
              </p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md cursor-pointer transition-colors"
            >
              + Add Contact
            </button>
          )}
        </div>

        {/* City filter + search row */}
        <div className="flex items-center gap-3 mb-4">
          {/* City dropdown — only when there are cities */}
          {allCities.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer shadow-sm
                  ${cityFilter
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                <span>📍</span>
                <span>{cityFilter || 'Cities / Airports'}</span>
                {cityFilter && (
                  <span
                    onMouseDown={e => { e.stopPropagation(); setCityFilter(''); setDropdownOpen(false) }}
                    className="ml-1 text-white/80 hover:text-white text-xs leading-none"
                    title="Clear filter"
                  >✕</span>
                )}
                <svg className={`w-3.5 h-3.5 ml-1 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <ul className="absolute z-50 top-full mt-1 left-0 min-w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <li
                    onMouseDown={() => { setCityFilter(''); setDropdownOpen(false) }}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors
                      ${cityFilter === '' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span className="text-base">🌐</span> All cities
                    {cityFilter === '' && <span className="ml-auto text-blue-500 text-xs">✓</span>}
                  </li>
                  <li className="border-t border-gray-100" />
                  {allCities.map(city => {
                    const count = contacts.filter(c => c.city === city).length
                    return (
                      <li
                        key={city}
                        onMouseDown={() => { setCityFilter(city); setDropdownOpen(false) }}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors
                          ${cityFilter === city ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span>📍</span>
                        <span className="flex-1">{city}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${cityFilter === city ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                          {count}
                        </span>
                        {cityFilter === city && <span className="text-blue-500 text-xs">✓</span>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, city, company…"
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 cursor-pointer text-xs"
              >✕</button>
            )}
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="mb-4">
            <AddContactForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {/* Contact list */}
        {contacts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">👤</div>
            <p className="text-gray-800 font-medium">No contacts yet</p>
            <p className="text-gray-500 text-sm mt-1">Add contacts to get meetup suggestions during layovers.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-gray-500 text-sm">No contacts match{cityFilter ? ` in ${cityFilter}` : ''}{search ? ` "${search}"` : ''}.</p>
            <button onClick={() => { setCityFilter(''); setSearch('') }} className="mt-2 text-blue-600 text-xs hover:underline cursor-pointer">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-96 space-y-3 pr-1">
            {[...filtered].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
              <ContactCard key={c.id} contact={c} onRemove={removeContact} onEdit={updateContact} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
