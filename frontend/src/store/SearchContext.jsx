import { createContext, useContext, useState } from 'react'

const SearchContext = createContext(null)

export function SearchProvider({ children }) {
  const [from,          setFrom]          = useState('')
  const [to,            setTo]            = useState('')
  const [date,          setDate]          = useState('')
  const [returnDate,    setReturnDate]    = useState('')
  const [tripType,      setTripType]      = useState('oneway') // 'oneway' | 'roundtrip'
  const [budget,        setBudget]        = useState('')
  const [priority,      setPriority]      = useState('cheapest')
  const [disabilityMode,setDisabilityMode]= useState(false)
  const [results,       setResults]       = useState(null)

  function clear() {
    setFrom(''); setTo(''); setDate(''); setReturnDate(''); setBudget('')
    setDisabilityMode(false); setResults(null)
  }

  return (
    <SearchContext.Provider value={{
      from, setFrom,
      to, setTo,
      date, setDate,
      returnDate, setReturnDate,
      tripType, setTripType,
      budget, setBudget,
      priority, setPriority,
      disabilityMode, setDisabilityMode,
      results, setResults,
      clear,
    }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  return useContext(SearchContext)
}
