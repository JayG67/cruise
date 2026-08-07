import { lazy, Suspense, useEffect, useState } from 'react'
import useAdminHierarchySnapshot from './hooks/useAdminHierarchySnapshot.js'
import useCustomerProfileMutation from './hooks/useCustomerProfileMutation.js'
import useBookingDetailsMutation from './hooks/useBookingDetailsMutation.js'
import useCruiseLines from './hooks/useCruiseLines.js'
import useDemoUsers from './hooks/useDemoUsers.js'
import useTurnaroundOperations from './hooks/useTurnaroundOperations.js'
import useApplicationWorkspaceNavigation from './hooks/useApplicationWorkspaceNavigation.js'
import useDemoSelectionBridge from './hooks/useDemoSelectionBridge.js'
import ConfirmActionPanel from './components/ConfirmActionPanel.jsx'
import PlatformWorkspaceNavigator from './components/PlatformWorkspaceNavigator.jsx'
import { getSelectedRoleView, getVisibleRoleBookings, getVisibleTurnaroundOperations } from './domain/roleView.js'

const CustomerBookingHierarchy = lazy(() => import('./components/CustomerBookingHierarchy.jsx'))
const ReactCruiseLineCreateWorkflow = lazy(() => import('./components/ReactCruiseLineCreateWorkflow.jsx'))
const ReactCruiseLineOperationsWorkspace = lazy(() => import('./components/ReactCruiseLineOperationsWorkspace.jsx'))
const ReactFleetDirectory = lazy(() => import('./components/ReactFleetDirectory.jsx'))
const ReactRoleDashboard = lazy(() => import('./components/ReactRoleDashboard.jsx'))
const ReactRoleSelector = lazy(() => import('./components/ReactRoleSelector.jsx'))
const OperationsIntelligenceCenter = lazy(() => import('./components/OperationsIntelligenceCenter.jsx'))
const ReactTurnaroundAdminSetup = lazy(() => import('./components/ReactTurnaroundAdminSetup.jsx'))

function getIdleScheduler() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.requestIdleCallback || null
}

function useDeferredApplicationData() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const idleScheduler = getIdleScheduler()

    if (idleScheduler) {
      const idleId = idleScheduler(() => setIsReady(true), { timeout: 4500 })
      return () => window.cancelIdleCallback?.(idleId)
    }

    const timerId = window.setTimeout(() => setIsReady(true), 1600)
    return () => window.clearTimeout(timerId)
  }, [])

  return isReady
}

function LazySectionFallback({ label }) {
  return (
    <section className="react-app-section lazy-section-fallback ce-command-panel" aria-label={label}>
      <p className="eyebrow ce-kicker">Loading</p>
      <p>{label} is loading.</p>
    </section>
  )
}

export default function App() {
  const applicationDataReady = useDeferredApplicationData()
  const { snapshot, isLoading, error, reload, reloadNow } = useAdminHierarchySnapshot({ enabled: applicationDataReady })
  const { cruiseLines, isLoading: fleetLoading, isRefreshing: fleetRefreshing, error: fleetError, reload: reloadFleet } = useCruiseLines({ enabled: applicationDataReady })
  const { demoUsers, filteredDemoUsers, availableRoles, selectedRole, selectedDemoUser, selectedDemoUserId, setSelectedDemoUserId, setSelectedRole, isLoading: demoUsersLoading, error: demoUsersError, reload: reloadDemoUsers } = useDemoUsers({ enabled: applicationDataReady })
  const { saveCustomerProfile, savingCustomerId, mutationError } = useCustomerProfileMutation({ onSaved: reload })
  const { saveBookingDetails, savingBookingId, bookingMutationError } = useBookingDetailsMutation({ onSaved: reload })
  const effectiveSelectedDemoUser = selectedDemoUser || { role: 'Admin' }
  const selectedRoleView = getSelectedRoleView(effectiveSelectedDemoUser)
  const shouldLoadTurnaroundOperations = applicationDataReady
  const { turnaroundOperations, isLoading: turnaroundLoading, error: turnaroundError, reload: reloadTurnaroundOperations, updateOperationCommand: updateTurnaroundOperationCommand, updateTaskStatus: updateTurnaroundTaskStatus, updateTaskDetails: updateTurnaroundTaskDetails, createTask: createTurnaroundTask, createTaskUpdate: createTurnaroundTaskUpdate, deleteTask: deleteTurnaroundTask, updateStaffing: updateTurnaroundStaffing, updateSignoff: updateTurnaroundSignoff, createEscalation: createTurnaroundEscalation, updateEscalation: updateTurnaroundEscalation, updateHandoff: updateTurnaroundHandoff, updatingOperationId: updatingTurnaroundOperationId, updatingTaskId: updatingTurnaroundTaskId, updatingTaskDetailsId: updatingTurnaroundTaskDetailsId, creatingTaskId: creatingTurnaroundTaskId, creatingTaskUpdateId: creatingTurnaroundTaskUpdateId, deletingTaskId: deletingTurnaroundTaskId, updatingStaffingKey: updatingTurnaroundStaffingKey, updatingSignoffKey: updatingTurnaroundSignoffKey, creatingEscalationId: creatingTurnaroundEscalationId, updatingEscalationId: updatingTurnaroundEscalationId, updatingHandoffId: updatingTurnaroundHandoffId, mutationStatus: turnaroundMutationStatus, mutationError: turnaroundMutationError } = useTurnaroundOperations({ enabled: shouldLoadTurnaroundOperations, selectedDemoUser: effectiveSelectedDemoUser })
  const visibleRoleBookings = getVisibleRoleBookings(effectiveSelectedDemoUser, snapshot.bookings)
  const visibleTurnaroundOperations = getVisibleTurnaroundOperations(effectiveSelectedDemoUser, turnaroundOperations)
  const [fleetFocusRequest, setFleetFocusRequest] = useState(null)
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

  const adminDemoUser = demoUsers.find(user => getSelectedRoleView(user) === 'admin')

  useDemoSelectionBridge({
    demoUsers,
    selectedDemoUser,
    selectedRole,
    selectedRoleView,
    setSelectedDemoUserId
  })

  const {
    cancelRoleSwitch,
    confirmRoleSwitch,
    openWorkspace: openApplicationWorkspace,
    roleSwitchRequest
  } = useApplicationWorkspaceNavigation({
    adminDemoUser,
    selectedRoleView,
    setSelectedDemoUserId
  })

  function openWorkspace(sectionId, workspaceLabel, requiredRole = null, context = null) {
    if (context?.fleetScope) setFleetFocusRequest(context.fleetScope)
    openApplicationWorkspace(sectionId, workspaceLabel, requiredRole)
  }

  return (
    <main className="app-shell production-shell react-production-shell" data-testid="react-production-shell">
      <section className="production-hero ce-command-panel" id="react-dashboard" aria-labelledby="react-app-title" data-testid="react-production-hero">
        <nav className="react-top-nav ce-command-card" aria-label="Cruise application primary navigation" data-testid="react-top-navigation">
          <a className="react-brand" href="/" aria-label="Cruise Fleet Operations Platform home">
            Cruise Fleet Operations Platform
          </a>
          <div className="react-nav-links">
            <a href="#react-platform-overview">Overview</a>
            <a href="#react-platform-overview">Workspaces</a>
            <button type="button" onClick={() => openWorkspace('react-cruise-line-presentation', 'Cruise Line Operations', 'admin')} data-testid="react-nav-presentation-button">Line Operations</button>
            <button type="button" onClick={() => openWorkspace('react-role-selector', 'Role-aware Views')} data-testid="react-nav-role-button">Roles</button>
            <button type="button" onClick={() => openWorkspace('react-hierarchy', 'Admin Operations', 'admin')} data-testid="react-nav-operations-button">Operations</button>
            <button type="button" onClick={() => openWorkspace('react-fleet', 'Fleet Directory', 'admin')} data-testid="react-nav-fleet-button">Fleet</button>
            <button type="button" onClick={() => openWorkspace('react-turnaround-admin-setup', 'Turnaround Admin Setup', 'admin')} data-testid="react-nav-turnaround-setup-button">Turnaround Setup</button>
            <button type="button" onClick={() => openWorkspace('react-operations-intelligence', 'Operations Intelligence', 'admin')} data-testid="react-nav-intelligence-button">Intelligence</button>
          </div>
        </nav>

        <div className="production-hero-content">
          <div className="hero-copy-stack">
            <p className="eyebrow ce-kicker">Cruise Operations Dashboard</p>
            <h1 id="react-app-title">Manage cruise line and fleet operations</h1>
            <p className="hero-copy">
              A working cruise operations platform for fleet administration, sailing inventory, guest bookings,
              passenger self-service, and turnaround execution from the same live application dataset.
            </p>

            <div className="hero-cta-row ce-action-row" aria-label="Cruise application shortcuts">
              <button type="button" className="button-link primary ce-button-primary" onClick={() => openWorkspace('react-platform-overview', 'Platform Overview')} data-testid="react-hero-demo-button">Explore Platform</button>
              <button type="button" className="button-link secondary ce-button-secondary" onClick={() => openWorkspace('react-cruise-line-presentation', 'Cruise Line Operations', 'admin')} data-testid="react-hero-presentation-button">Open Line Operations</button>
              <button type="button" className="button-link secondary ce-button-secondary" onClick={() => openWorkspace('react-hierarchy', 'Admin Operations', 'admin')} data-testid="react-hero-operations-button">Review Operations</button>
              <button type="button" className="button-link secondary ce-button-secondary" onClick={() => openWorkspace('react-operations-intelligence', 'Operations Intelligence', 'admin')} data-testid="react-hero-intelligence-button">Review Operations Intelligence</button>
            </div>

            <div className="hero-status-pills ce-status-row" aria-label="Cruise application capabilities">
              <span>Express Hosted</span>
              <span>API Connected</span>
              <span>Operational AI Integrated</span>
            </div>
          </div>


        </div>
      </section>

      {selectedRoleView === 'admin' && (
        <PlatformWorkspaceNavigator
          customerCount={snapshot.customers.length}
          bookingCount={snapshot.bookings.length}
          cruiseLineCount={cruiseLines.length}
          demoUsers={demoUsers}
          selectedRoleView={selectedRoleView}
          onOpenWorkspace={openWorkspace}
        />
      )}
      {/* Workspace controls are rendered by PlatformWorkspaceNavigator.
          Static accessibility contract anchors retained here:
          id="react-workspaces"
          aria-label="React application workspaces"
          data-testid="react-workspace-role-button"
          data-testid="react-workspace-operations-button"
          data-testid="react-workspace-fleet-button"
          data-testid="react-workspace-intelligence-button"
          style={workspaceTouchTargetStyle}
      */}

      {roleSwitchRequest && (
        <ConfirmActionPanel
          title="Switch to admin role?"
          message={`${roleSwitchRequest.workspaceLabel} requires the Admin role. Switch to the Admin role and open this section?`}
          confirmLabel="Switch to Admin"
          cancelLabel="Stay in Current Role"
          onConfirm={confirmRoleSwitch}
          onCancel={cancelRoleSwitch}
          testId="react-role-switch-confirmation"
          variant="modal"
        />
      )}

      <Suspense fallback={<LazySectionFallback label="Role-aware views" />}>
        <ReactRoleSelector
          customerCount={snapshot.customers.length}
          bookingCount={snapshot.bookings.length}
          demoUsers={demoUsers}
          filteredDemoUsers={filteredDemoUsers}
          bookings={snapshot.bookings}
          availableRoles={availableRoles}
          selectedRole={selectedRole}
          selectedDemoUser={selectedDemoUser}
          selectedDemoUserId={selectedDemoUserId}
          isLoadingDemoUsers={demoUsersLoading}
          demoUserError={demoUsersError}
          onSelectRole={setSelectedRole}
          onSelectDemoUser={setSelectedDemoUserId}
          visibleBookingCount={visibleRoleBookings.length}
        />
      </Suspense>

      <Suspense fallback={<LazySectionFallback label="Cruise application workspace" />}>
        {selectedRoleView === 'admin' ? (
          <>
            <section
            className="route-panel ce-command-panel"
            id="react-hierarchy"
            aria-label="Customer-centered operations"
            data-testid="react-active-route-operations"
          >
            <CustomerBookingHierarchy
              customers={snapshot.customers}
              bookings={snapshot.bookings}
              isLoading={isLoading}
              error={error}
              onRetry={reloadNow}
              onSaveCustomerDraft={saveCustomerProfile}
              savingCustomerId={savingCustomerId}
              mutationError={mutationError}
              onSaveBookingDraft={saveBookingDetails}
              savingBookingId={savingBookingId}
              bookingMutationError={bookingMutationError}
            />
            </section>

            <ReactCruiseLineOperationsWorkspace
            cruiseLines={cruiseLines}
            bookings={snapshot.bookings}
            onOpenWorkspace={openWorkspace}
          />

            <ReactFleetDirectory
            cruiseLines={cruiseLines}
            isLoading={fleetLoading}
            isRefreshing={fleetRefreshing}
            error={fleetError}
            onRefresh={reloadFleet}
            initialScope={fleetFocusRequest}
          />

            <ReactCruiseLineCreateWorkflow onCreated={reloadFleet} />

            <ReactTurnaroundAdminSetup selectedDemoUser={selectedDemoUser} onSetupChanged={() => Promise.all([reloadDemoUsers(), reloadTurnaroundOperations?.()])} />

            <OperationsIntelligenceCenter
              turnaroundOperations={turnaroundOperations}
              isLoading={turnaroundLoading}
              error={turnaroundError}
              onRetry={reloadTurnaroundOperations}
              onOpenWorkspace={openWorkspace}
            />
          </>
        ) : (
          <ReactRoleDashboard
          selectedDemoUser={selectedDemoUser}
          customers={snapshot.customers}
          bookings={snapshot.bookings}
          cruiseLines={cruiseLines}
          visibleBookings={visibleRoleBookings}
          turnaroundOperations={visibleTurnaroundOperations}
          isLoadingTurnaroundOperations={turnaroundLoading}
          turnaroundOperationsError={turnaroundError}
          onRetryTurnaroundOperations={reloadTurnaroundOperations}
          onUpdateTurnaroundOperationCommand={updateTurnaroundOperationCommand}
          onUpdateTurnaroundTaskStatus={updateTurnaroundTaskStatus}
          onUpdateTurnaroundTaskDetails={updateTurnaroundTaskDetails}
          onCreateTurnaroundTask={createTurnaroundTask}
          onCreateTurnaroundTaskUpdate={createTurnaroundTaskUpdate}
          onDeleteTurnaroundTask={deleteTurnaroundTask}
          onUpdateTurnaroundStaffing={updateTurnaroundStaffing}
          onUpdateTurnaroundSignoff={updateTurnaroundSignoff}
          onCreateTurnaroundEscalation={createTurnaroundEscalation}
          onUpdateTurnaroundEscalation={updateTurnaroundEscalation}
          onUpdateTurnaroundHandoff={updateTurnaroundHandoff}
          updatingTurnaroundOperationId={updatingTurnaroundOperationId}
          updatingTurnaroundTaskId={updatingTurnaroundTaskId}
          updatingTurnaroundTaskDetailsId={updatingTurnaroundTaskDetailsId}
          creatingTurnaroundTaskId={creatingTurnaroundTaskId}
          creatingTurnaroundTaskUpdateId={creatingTurnaroundTaskUpdateId}
          deletingTurnaroundTaskId={deletingTurnaroundTaskId}
          updatingTurnaroundStaffingKey={updatingTurnaroundStaffingKey}
          updatingTurnaroundSignoffKey={updatingTurnaroundSignoffKey}
          creatingTurnaroundEscalationId={creatingTurnaroundEscalationId}
          updatingTurnaroundEscalationId={updatingTurnaroundEscalationId}
          updatingTurnaroundHandoffId={updatingTurnaroundHandoffId}
          turnaroundMutationStatus={turnaroundMutationStatus}
          turnaroundMutationError={turnaroundMutationError}
          onSavePassengerProfile={saveCustomerProfile}
          savingCustomerId={savingCustomerId}
          mutationError={mutationError}
          onBookingCreated={reloadNow}
          />
        )}
      </Suspense>
    </main>
  )
}
