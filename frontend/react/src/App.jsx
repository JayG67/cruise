import useAdminHierarchySnapshot from './hooks/useAdminHierarchySnapshot.js'
import useCustomerProfileMutation from './hooks/useCustomerProfileMutation.js'
import useBookingDetailsMutation from './hooks/useBookingDetailsMutation.js'
import useCruiseLines from './hooks/useCruiseLines.js'
import useDemoUsers from './hooks/useDemoUsers.js'
import ReactFleetDirectory from './components/ReactFleetDirectory.jsx'
import ReactCruiseLineCreateWorkflow from './components/ReactCruiseLineCreateWorkflow.jsx'
import ReactRoleSelector from './components/ReactRoleSelector.jsx'
import CustomerBookingHierarchy from './components/CustomerBookingHierarchy.jsx'
import ReactQueryStatusPanel from './components/ReactQueryStatusPanel.jsx'
import ReactSqaConsole from './components/ReactSqaConsole.jsx'
import ReactRoleDashboard from './components/ReactRoleDashboard.jsx'
import ReactMigrationRouteNav from './components/ReactMigrationRouteNav.jsx'
import MigrationRoadmapPanel from './components/MigrationRoadmapPanel.jsx'
import ReactCutoverReadinessPanel from './components/ReactCutoverReadinessPanel.jsx'
import ReactPilotLaunchPanel from './components/ReactPilotLaunchPanel.jsx'
import ReactPilotParityPanel from './components/ReactPilotParityPanel.jsx'
import ReactMigrationHandoffPanel from './components/ReactMigrationHandoffPanel.jsx'
import ReactMigrationActiveRoutePanel from './components/ReactMigrationActiveRoutePanel.jsx'
import { useReactMigrationRoute } from './hooks/useReactMigrationRoute.js'
import { getSelectedRoleView, getVisibleRoleBookings } from './domain/roleView.js'

export default function App() {
  const { snapshot, isLoading, isRefreshing, error, reload, lastLoadedAt, requestId } = useAdminHierarchySnapshot()
  const { cruiseLines, isLoading: fleetLoading, isRefreshing: fleetRefreshing, error: fleetError, reload: reloadFleet } = useCruiseLines()
  const { demoUsers, selectedDemoUser, selectedDemoUserId, setSelectedDemoUserId, isLoading: demoUsersLoading, error: demoUsersError } = useDemoUsers()
  const { saveCustomerProfile, savingCustomerId, mutationError } = useCustomerProfileMutation({ onSaved: reload })
  const { saveBookingDetails, savingBookingId, bookingMutationError } = useBookingDetailsMutation({ onSaved: reload })
  const selectedRoleView = getSelectedRoleView(selectedDemoUser)
  const visibleRoleBookings = getVisibleRoleBookings(selectedDemoUser, snapshot.bookings)
  const { routes: migrationRoutes, activeRouteKey, selectRoute } = useReactMigrationRoute()
  const routeSectionMap = {
    hierarchy: 'react-hierarchy',
    readiness: 'react-role-selector',
    roadmap: 'react-fleet',
    cutover: 'react-quality',
    pilot: 'react-release-readiness',
    parity: 'react-release-readiness',
    handoff: 'react-release-readiness'
  }
  const workspaceTouchTargetStyle = {
    WebkitAppearance: 'none',
    alignItems: 'flex-start',
    appearance: 'none',
    blockSize: '72px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    height: '72px',
    justifyContent: 'center',
    lineHeight: '1.25',
    minBlockSize: '72px',
    minHeight: '72px',
    overflow: 'visible',
    paddingBottom: '1rem',
    paddingTop: '1rem',
    width: '100%'
  }

  function scrollToSection(sectionId, routeKey) {
    if (routeKey) {
      selectRoute(routeKey)
    }

    document.getElementById(sectionId)?.scrollIntoView({ block: 'start' })
  }

  function selectMigrationRoute(routeKey) {
    selectRoute(routeKey)
    const sectionId = routeSectionMap[routeKey] || 'react-dashboard'

    document.getElementById(sectionId)?.scrollIntoView({ block: 'start' })
  }

  return (
    <main className="app-shell production-parity-shell react-production-parity-shell" data-testid="react-production-parity-shell">
      <section className="production-hero" id="react-dashboard" aria-labelledby="react-app-title" data-testid="react-production-hero">
        <nav className="react-top-nav" aria-label="React application primary navigation" data-testid="react-top-navigation">
          <a className="react-brand" href="/app-next" aria-label="Cruise Explorer React home">
            Cruise Explorer
          </a>
          <div className="react-nav-links">
            <a href="#react-dashboard">Dashboard</a>
            <a href="#react-workspaces">Workspaces</a>
            <a href="#react-role-selector">Roles</a>
            <a href="#react-hierarchy">Operations</a>
            <a href="#react-fleet">Fleet</a>
            <a href="#react-quality">Quality</a>
          </div>
        </nav>

        <div className="production-hero-content">
          <p className="eyebrow">Cruise Operations Dashboard</p>
          <h1 id="react-app-title">Manage cruise line and fleet operations</h1>
          <p className="hero-copy">
            A production-style React operations console for viewing customers, bookings, cruise lines,
            fleet data, and quality status from the same Express application and live API dataset.
          </p>

          <div className="hero-cta-row" aria-label="React application shortcuts">
            <a className="button-link primary" href="#react-hierarchy">Review Operations</a>
            <a className="button-link secondary" href="/legacy">Open Legacy DOM App</a>
          </div>

          <div className="hero-status-pills" aria-label="React application capabilities">
            <span>Express Hosted</span>
            <span>API Connected</span>
            <span>Full React Route</span>
          </div>
        </div>
      </section>

      <section className="react-workspace-panel operations-console-panel" id="react-workspaces" aria-labelledby="react-workspaces-heading">
        <div className="operations-console-copy">
          <p className="eyebrow">Operations console</p>
          <h2 id="react-workspaces-heading">Choose a workspace</h2>
          <p>
            Use the workspace controls to move between role simulation, customer-centered operations,
            fleet data, and quality validation.
          </p>
        </div>

        <div className="react-workspace-card-grid" aria-label="React application workspaces" data-testid="react-workspace-card-grid">
          <button type="button" className="react-workspace-card" style={workspaceTouchTargetStyle} onClick={() => scrollToSection('react-role-selector', 'readiness')} data-testid="react-workspace-role-button">
            <span className="workspace-icon" aria-hidden="true">👥</span>
            <span className="workspace-card-title">Role Simulation</span>
            <span>Switch between admin, passenger, and group leader views.</span>
          </button>
          <button type="button" className="react-workspace-card" style={workspaceTouchTargetStyle} onClick={() => scrollToSection('react-hierarchy', 'hierarchy')} data-testid="react-workspace-operations-button">
            <span className="workspace-icon" aria-hidden="true">🧾</span>
            <span className="workspace-card-title">Admin Operations</span>
            <span>Search and manage customer and booking datasets.</span>
          </button>
          <button type="button" className="react-workspace-card" style={workspaceTouchTargetStyle} onClick={() => scrollToSection('react-fleet', 'roadmap')} data-testid="react-workspace-fleet-button">
            <span className="workspace-icon" aria-hidden="true">🚢</span>
            <span className="workspace-card-title">Fleet Directory</span>
            <span>Search cruise lines, manage fleets, ships, and sailings.</span>
          </button>
          <button type="button" className="react-workspace-card" style={workspaceTouchTargetStyle} onClick={() => scrollToSection('react-quality', 'cutover')} data-testid="react-workspace-quality-button">
            <span className="workspace-icon" aria-hidden="true">✅</span>
            <span className="workspace-card-title">Quality Console</span>
            <span>Run API health, data readiness, and deployment checks.</span>
          </button>
        </div>

        <div className="recommended-workflow-panel" data-testid="react-recommended-workflow">
          <div>
            <p className="eyebrow">Recommended workflow</p>
            <h3>Start with the role, then move through the operation</h3>
            <p>
              The React route now follows the same operations-console pattern as the DOM app:
              choose the business context, inspect customer and booking workflows,
              manage the fleet, then validate quality gates.
            </p>
          </div>
          <ol className="workflow-step-list" aria-label="Recommended workflow controls">
            <li>
              <button type="button" className="workflow-step-button" onClick={() => scrollToSection('react-role-selector', 'readiness')} data-testid="react-workflow-role-button">
                <strong>01</strong><span>Choose role</span>
              </button>
            </li>
            <li>
              <button type="button" className="workflow-step-button" onClick={() => scrollToSection('react-hierarchy', 'hierarchy')} data-testid="react-workflow-operations-button">
                <strong>02</strong><span>Review operations</span>
              </button>
            </li>
            <li>
              <button type="button" className="workflow-step-button" onClick={() => scrollToSection('react-fleet', 'roadmap')} data-testid="react-workflow-fleet-button">
                <strong>03</strong><span>Manage fleet</span>
              </button>
            </li>
            <li>
              <button type="button" className="workflow-step-button" onClick={() => scrollToSection('react-quality', 'cutover')} data-testid="react-workflow-quality-button">
                <strong>04</strong><span>Run quality checks</span>
              </button>
            </li>
          </ol>
        </div>

        <ReactMigrationRouteNav
          routes={migrationRoutes}
          activeRouteKey={activeRouteKey}
          onSelectRoute={selectMigrationRoute}
        />
      </section>

      <ReactRoleSelector
        customerCount={snapshot.customers.length}
        bookingCount={snapshot.bookings.length}
        demoUsers={demoUsers}
        selectedDemoUser={selectedDemoUser}
        selectedDemoUserId={selectedDemoUserId}
        isLoadingDemoUsers={demoUsersLoading}
        demoUserError={demoUsersError}
        onSelectDemoUser={setSelectedDemoUserId}
        visibleBookingCount={visibleRoleBookings.length}
      />

      {selectedRoleView === 'admin' ? (
        <>
          <section
            className="route-panel"
            id="react-hierarchy"
            aria-label="Customer-centered operations"
            data-testid="react-active-route-operations"
          >
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
          </section>

          <ReactFleetDirectory
            cruiseLines={cruiseLines}
            isLoading={fleetLoading}
            isRefreshing={fleetRefreshing}
            error={fleetError}
            onRefresh={reloadFleet}
          />

          <ReactCruiseLineCreateWorkflow onCreated={reloadFleet} />

          <ReactSqaConsole onRefreshData={() => Promise.all([reload(), reloadFleet()])} />
        </>
      ) : (
        <ReactRoleDashboard
          selectedDemoUser={selectedDemoUser}
          customers={snapshot.customers}
          bookings={snapshot.bookings}
          visibleBookings={visibleRoleBookings}
          onSavePassengerProfile={saveCustomerProfile}
          savingCustomerId={savingCustomerId}
          mutationError={mutationError}
        />
      )}



      <section id="react-release-readiness" className="react-release-readiness-section" aria-labelledby="react-release-readiness-heading" data-testid="react-release-readiness-section">
        <div className="release-readiness-heading">
          <p className="eyebrow">React cutover command center</p>
          <h2 id="react-release-readiness-heading">Route-driven migration evidence for replacing the DOM app</h2>
          <p>
            The workspace rail now controls the active React migration evidence panel instead of showing every
            cutover artifact at once. Reviewers can focus on one workflow, gate, pilot, parity, or handoff
            path while the rest of the app stays available below.
          </p>
        </div>
        <div className="active-route-summary" data-testid="react-active-route-summary">
          <span>Active route</span>
          <strong>{activeRouteKey}</strong>
        </div>
        {(activeRouteKey === 'hierarchy' || activeRouteKey === 'readiness') && (
          <ReactMigrationActiveRoutePanel routeKey={activeRouteKey} />
        )}
        {activeRouteKey === 'roadmap' && <MigrationRoadmapPanel />}
        {activeRouteKey === 'cutover' && <ReactCutoverReadinessPanel />}
        {activeRouteKey === 'pilot' && <ReactPilotLaunchPanel />}
        {activeRouteKey === 'parity' && <ReactPilotParityPanel />}
        {activeRouteKey === 'handoff' && <ReactMigrationHandoffPanel />}
      </section>

      <section id="react-quality" className="react-quality-section" aria-label="React API status">
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
      </section>
    </main>
  )
}
