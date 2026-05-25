import { useEffect, useState } from 'react'
import { fetchAdminHierarchySnapshot } from './api/client.js'
import MigrationReadiness from './components/MigrationReadiness.jsx'
import CustomerBookingHierarchy from './components/CustomerBookingHierarchy.jsx'

export default function App() {
  const [snapshot, setSnapshot] = useState({ customers: [], bookings: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    fetchAdminHierarchySnapshot()
      .then(data => {
        if (!isMounted) return
        setSnapshot(data)
        setError('')
      })
      .catch(fetchError => {
        if (!isMounted) return
        setError(fetchError.message || 'Unable to load React migration snapshot.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Cruise Explorer modernization</p>
        <h1>React migration workspace</h1>
        <p>
          A safe, incremental frontend modernization track for the existing Express/Postgres cruise
          portfolio application. The legacy DOM app remains production-stable while React components
          are introduced and tested workflow by workflow.
        </p>
      </header>

      <MigrationReadiness />

      <CustomerBookingHierarchy
        customers={snapshot.customers}
        bookings={snapshot.bookings}
        isLoading={isLoading}
        error={error}
      />
    </main>
  )
}
