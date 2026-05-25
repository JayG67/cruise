import { useEffect, useState } from 'react'
import { getAdminHierarchySnapshot } from './api/client.js'
import CustomerBookingHierarchy from './components/CustomerBookingHierarchy.jsx'
import MigrationReadiness from './components/MigrationReadiness.jsx'

export default function App() {
  const [snapshot, setSnapshot] = useState({ customers: [], bookings: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadSnapshot() {
      try {
        const data = await getAdminHierarchySnapshot()

        if (isMounted) {
          setSnapshot({
            customers: Array.isArray(data.customers) ? data.customers : [],
            bookings: Array.isArray(data.bookings) ? data.bookings : []
          })
          setError('')
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load the React migration snapshot.')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadSnapshot()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="react-migration-title">
        <p className="eyebrow">Cruise portfolio modernization</p>
        <h1 id="react-migration-title">React migration preview</h1>
        <p>
          This isolated Vite shell proves the staged React migration without replacing the stable
          production DOM application. Stage 1 focuses on the customer → booking hierarchy because it
          contains the most valuable state-management and regression-testing lessons.
        </p>
      </section>

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
