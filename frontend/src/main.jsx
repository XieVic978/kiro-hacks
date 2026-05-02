import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { ContactsProvider } from './store/ContactsContext'
import { SearchProvider } from './store/SearchContext'
import NavBar from './components/NavBar'
import App from './App.jsx'
import ConnectionsPage from './pages/ConnectionsPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ContactsProvider>
        <SearchProvider>
          <NavBar />
          <Routes>
            <Route path="/"            element={<App />} />
            <Route path="/connections" element={<ConnectionsPage />} />
          </Routes>
        </SearchProvider>
      </ContactsProvider>
    </BrowserRouter>
  </StrictMode>,
)
