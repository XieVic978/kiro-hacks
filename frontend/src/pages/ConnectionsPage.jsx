import { useState } from 'react'
import { useContacts } from '../store/ContactsContext'

function ContactCard({ contact, onRemove }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm shrink-0">
          {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{contact.name}</p>
          <p className="text-xs text-gray-500">{contact.role}{contact.role && ' · '}{contact.company}</p>
          <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600">
            📍 {contact.city}
          </span>
        </div>
      </div>
      <button
        onClick={() => onRemove(contact.id)}
        className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer text-lg leading-none"
        title="Remove contact"
      >
        ✕
      </button>
    </div>
  )
}

function AddContactForm({ onAdd, onCancel }) {
  const [name,    setName]    = useState('')
  const [company, setCompany] = useState('')
  const [city,    setCity]    = useState('')
  const [role,    setRole]    = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !company.trim() || !city.trim()) return
    onAdd({ name: name.trim(), company: company.trim(), city: city.trim(), role: role.trim() })
  }

  const valid = name.trim() && company.trim() && city.trim()

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-blue-200 shadow-sm p-5">
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
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="Chicago"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Role</label>
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Product Manager"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={!valid}
          className="flex-1 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer transition-colors">
          Add Contact
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function ConnectionsPage() {
  const { contacts, addContact, removeContact } = useContacts()
  const [showForm, setShowForm] = useState(false)

  function handleAdd(contact) {
    addContact(contact)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">My Connections</h1>
          <p className="mt-2 text-gray-500 text-base">
            People you know in cities around the US — we'll suggest meetups during your layovers.
          </p>
        </div>

        {/* Stats bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤝</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-500">
                {[...new Set(contacts.map(c => c.city))].length} cit{contacts.length !== 1 ? 'ies' : 'y'} covered
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
        ) : (
          <div className="space-y-3">
            {contacts.map(c => (
              <ContactCard key={c.id} contact={c} onRemove={removeContact} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
