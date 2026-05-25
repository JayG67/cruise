import useAdminHierarchySnapshot from './hooks/useAdminHierarchySnapshot.js'
import useCustomerProfileMutation from './hooks/useCustomerProfileMutation.js'
import CustomerBookingHierarchy from './components/CustomerBookingHierarchy.jsx'
import MigrationReadiness from './components/MigrationReadiness.jsx'

export default function App() {
  const { snapshot, isLoading, error, reload } = useAdminHierarchySnapshot()
  const { saveCustomerProfile, savingCustomerId, mutationError } = useCustomerProfileMutation({ onSaved: reload })

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="react-migration-title">
        <p className="eyebrow">Cruise portfolio modernization</p>
        <h1 id="react-migration-title">React migration preview</h1>
        <p>
          This isolated Vite shell proves the staged React migration without replacing the stable
          production DOM application. Stage 2 adds a React API boundary with cancellable loading,
          retry behavior, stable state ownership, and the first React customer mutation boundary for the customer → booking hierarchy.
        </p>
      </section>

      <MigrationReadiness />

      <CustomerBookingHierarchy
        customers={snapshot.customers}
        bookings={snapshot.bookings}
        isLoading={isLoading}
        error={error}
        onRetry={reload}
        onSaveCustomerDraft={saveCustomerProfile}
        savingCustomerId={savingCustomerId}
        mutationError={mutationError}
      />
    </main>
  )
}
