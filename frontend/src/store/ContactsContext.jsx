import { createContext, useContext, useState } from 'react'

const DEMO_CONTACTS = [
  { id: 1, name: 'Sarah Chen',    company: 'Google',     city: 'Chicago', role: 'Engineering Manager' },
  { id: 2, name: 'Marcus Rivera', company: 'Stripe',     city: 'Denver',  role: 'Head of Partnerships' },
  { id: 3, name: 'Priya Nair',    company: 'Salesforce', city: 'Phoenix', role: 'Product Lead' },
]

const ContactsContext = createContext(null)

export function ContactsProvider({ children }) {
  const [contacts, setContacts] = useState(DEMO_CONTACTS)
  const addContact    = (c)       => setContacts(prev => [...prev, { ...c, id: Date.now() }])
  const removeContact = (id)      => setContacts(prev => prev.filter(c => c.id !== id))
  const updateContact = (id, updates) => setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  return (
    <ContactsContext.Provider value={{ contacts, addContact, removeContact, updateContact }}>
      {children}
    </ContactsContext.Provider>
  )
}

export function useContacts() {
  return useContext(ContactsContext)
}
