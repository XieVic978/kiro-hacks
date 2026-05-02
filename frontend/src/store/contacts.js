import { useState } from 'react'

export const DEMO_CONTACTS = [
  { id: 1, name: 'Sarah Chen',    company: 'Google',     city: 'Chicago', role: 'Engineering Manager' },
  { id: 2, name: 'Marcus Rivera', company: 'Stripe',     city: 'Denver',  role: 'Head of Partnerships' },
  { id: 3, name: 'Priya Nair',    company: 'Salesforce', city: 'Phoenix', role: 'Product Lead' },
]

// Simple hook — import this wherever contacts are needed
export function useContacts() {
  const [contacts, setContacts] = useState(DEMO_CONTACTS)
  const addContact    = (c) => setContacts(prev => [...prev, { ...c, id: Date.now() }])
  const removeContact = (id) => setContacts(prev => prev.filter(c => c.id !== id))
  return { contacts, addContact, removeContact }
}
