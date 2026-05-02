import { NavLink } from 'react-router-dom'
import { useContacts } from '../store/ContactsContext'

export default function NavBar() {
  const { contacts } = useContacts()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="font-semibold text-gray-900 text-base">✈️ Flight Decision AI</span>
        <div className="flex items-center gap-1">
          <NavLink to="/"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            Flights
          </NavLink>
          <NavLink to="/connections"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            Connections
            {contacts.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none">
                {contacts.length}
              </span>
            )}
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
