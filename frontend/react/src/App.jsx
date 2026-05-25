import useAdminHierarchySnapshot from './hooks/useAdminHierarchySnapshot.js'
import useCustomerProfileMutation from './hooks/useCustomerProfileMutation.js'
import useBookingDetailsMutation from './hooks/useBookingDetailsMutation.js'
import CustomerBookingHierarchy from './components/CustomerBookingHierarchy.jsx'
import MigrationReadiness from './components/MigrationReadiness.jsx'

export default function App() {
  const { snapshot, isLoading, error, reload } = useAdminHierarchySnapshot()
  const { saveCustomerProfile, savingCustomerId, mutationError } = useCustomerProfileMutation({ onSaved: reload })
  const { saveBookingDetails, savingBookingId, bookingMutationError } = useBookingDetailsMutation({ onSaved: reload })

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="react-migration-title">
        <p className="eyebrow">Cruise portfolio modernization</p>
        <h1 id="react-migration-title">React migration preview</h1>
        <p>
          This isolated Vite shell proves the staged React migration without replacing the stable
          production DOM application. Stage 8 extracts reusable draft editor components on top of cancellable loading,
          stable state ownership, customer saves, and live booking mutations for the customer → booking hierarchy.
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
        onSaveBookingDraft={saveBookingDetails}
        savingBookingId={savingBookingId}
        bookingMutationError={bookingMutationError}
      />
    </main>
  )
}
