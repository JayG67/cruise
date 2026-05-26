import useAdminHierarchySnapshot from './hooks/useAdminHierarchySnapshot.js'
import useCustomerProfileMutation from './hooks/useCustomerProfileMutation.js'
import useBookingDetailsMutation from './hooks/useBookingDetailsMutation.js'
import CustomerBookingHierarchy from './components/CustomerBookingHierarchy.jsx'
import MigrationReadiness from './components/MigrationReadiness.jsx'
import MigrationRoadmapPanel from './components/MigrationRoadmapPanel.jsx'
import ReactMigrationRouteNav from './components/ReactMigrationRouteNav.jsx'
import ReactQueryStatusPanel from './components/ReactQueryStatusPanel.jsx'
import ReactCutoverReadinessPanel from './components/ReactCutoverReadinessPanel.jsx'
import ReactPilotLaunchPanel from './components/ReactPilotLaunchPanel.jsx'
import { currentReactMigrationStage, getReactMigrationStageLabel } from './domain/reactMigrationRoadmap.js'
import { useReactMigrationRoute } from './hooks/useReactMigrationRoute.js'

export default function App() {
  const { snapshot, isLoading, isRefreshing, error, reload, lastLoadedAt, requestId } = useAdminHierarchySnapshot()
  const { saveCustomerProfile, savingCustomerId, mutationError } = useCustomerProfileMutation({ onSaved: reload })
  const { saveBookingDetails, savingBookingId, bookingMutationError } = useBookingDetailsMutation({ onSaved: reload })
  const { activeRouteKey, activeRoute, routes, selectRoute } = useReactMigrationRoute()

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="react-migration-title">
        <p className="eyebrow">Cruise portfolio modernization</p>
        <h1 id="react-migration-title">React migration preview</h1>
        <p>
          This isolated Vite shell proves the staged React migration without replacing the stable
          production DOM application. {getReactMigrationStageLabel(currentReactMigrationStage)} keeps the
          reviewer-facing migration narrative aligned with the current React architecture.
        </p>
        <p>
          {currentReactMigrationStage.summary}
        </p>
      </section>

      <ReactMigrationRouteNav
        routes={routes}
        activeRouteKey={activeRouteKey}
        onSelectRoute={selectRoute}
      />

      <ReactQueryStatusPanel
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
        lastLoadedAt={lastLoadedAt}
        requestId={requestId}
        customerCount={snapshot.customers.length}
        bookingCount={snapshot.bookings.length}
        onRefresh={reload}
      />

      <section className="route-panel" aria-label={activeRoute.label} data-testid={`react-active-route-${activeRoute.key}`}>
        {activeRouteKey === 'readiness' && <MigrationReadiness />}

        {activeRouteKey === 'roadmap' && <MigrationRoadmapPanel />}

        {activeRouteKey === 'cutover' && <ReactCutoverReadinessPanel />}

        {activeRouteKey === 'pilot' && <ReactPilotLaunchPanel />}

        {activeRouteKey === 'hierarchy' && (
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
        )}
      </section>
    </main>
  )
}
