import { lazy, Suspense, useEffect, useState } from 'react'
import useAdminHierarchySnapshot from './hooks/useAdminHierarchySnapshot.js'
import useCustomerProfileMutation from './hooks/useCustomerProfileMutation.js'
import useBookingDetailsMutation from './hooks/useBookingDetailsMutation.js'
import useCruiseLines from './hooks/useCruiseLines.js'
import useDemoUsers from './hooks/useDemoUsers.js'
import useTurnaroundOperations from './hooks/useTurnaroundOperations.js'
import ConfirmActionPanel from './components/ConfirmActionPanel.jsx'
import { getSelectedRoleView, getVisibleRoleBookings, getVisibleTurnaroundOperations } from './domain/roleView.js'

const CustomerBookingHierarchy = lazy(() => import('./components/CustomerBookingHierarchy.jsx'))
const ReactCruiseLineCreateWorkflow = lazy(() => import('./components/ReactCruiseLineCreateWorkflow.jsx'))
const ReactFleetDirectory = lazy(() => import('./components/ReactFleetDirectory.jsx'))
const ReactRoleDashboard = lazy(() => import('./components/ReactRoleDashboard.jsx'))
const ReactRoleSelector = lazy(() => import('./components/ReactRoleSelector.jsx'))
const ReactSqaConsole = lazy(() => import('./components/ReactSqaConsole.jsx'))

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
    <section className="react-app-section lazy-section-fallback" aria-label={label}>
      <p className="eyebrow">Loading</p>
      <p>{label} is loading.</p>
    </section>
  )
}

export default function App() {
  const applicationDataReady = useDeferredApplicationData()
  const { snapshot, isLoading, error, reload, reloadNow } = useAdminHierarchySnapshot({ enabled: applicationDataReady })
  const { cruiseLines, isLoading: fleetLoading, isRefreshing: fleetRefreshing, error: fleetError, reload: reloadFleet } = useCruiseLines({ enabled: applicationDataReady })
  const { demoUsers, filteredDemoUsers, availableRoles, selectedRole, selectedDemoUser, selectedDemoUserId, setSelectedDemoUserId, setSelectedRole, isLoading: demoUsersLoading, error: demoUsersError } = useDemoUsers({ enabled: applicationDataReady })
  const [roleSwitchRequest, setRoleSwitchRequest] = useState(null)
  const [pendingNavigationSectionId, setPendingNavigationSectionId] = useState('')
  const { saveCustomerProfile, savingCustomerId, mutationError } = useCustomerProfileMutation({ onSaved: reload })
  const { saveBookingDetails, savingBookingId, bookingMutationError } = useBookingDetailsMutation({ onSaved: reload })
  const effectiveSelectedDemoUser = selectedDemoUser || { role: 'Admin' }
  const selectedRoleView = getSelectedRoleView(effectiveSelectedDemoUser)
  const shouldLoadTurnaroundOperations = applicationDataReady && selectedRoleView !== 'admin'
  const { turnaroundOperations, isLoading: turnaroundLoading, error: turnaroundError, reload: reloadTurnaroundOperations, updateOperationCommand: updateTurnaroundOperationCommand, updateTaskStatus: updateTurnaroundTaskStatus, updateTaskDetails: updateTurnaroundTaskDetails, createTask: createTurnaroundTask, createTaskUpdate: createTurnaroundTaskUpdate, deleteTask: deleteTurnaroundTask, updateStaffing: updateTurnaroundStaffing, updateSignoff: updateTurnaroundSignoff, createEscalation: createTurnaroundEscalation, updateEscalation: updateTurnaroundEscalation, updateHandoff: updateTurnaroundHandoff, updatingOperationId: updatingTurnaroundOperationId, updatingTaskId: updatingTurnaroundTaskId, updatingTaskDetailsId: updatingTurnaroundTaskDetailsId, creatingTaskId: creatingTurnaroundTaskId, creatingTaskUpdateId: creatingTurnaroundTaskUpdateId, deletingTaskId: deletingTurnaroundTaskId, updatingStaffingKey: updatingTurnaroundStaffingKey, updatingSignoffKey: updatingTurnaroundSignoffKey, creatingEscalationId: creatingTurnaroundEscalationId, updatingEscalationId: updatingTurnaroundEscalationId, updatingHandoffId: updatingTurnaroundHandoffId, mutationStatus: turnaroundMutationStatus, mutationError: turnaroundMutationError } = useTurnaroundOperations({ enabled: shouldLoadTurnaroundOperations, selectedDemoUser: effectiveSelectedDemoUser })
  const visibleRoleBookings = getVisibleRoleBookings(effectiveSelectedDemoUser, snapshot.bookings)
  const visibleTurnaroundOperations = getVisibleTurnaroundOperations(effectiveSelectedDemoUser, turnaroundOperations)
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

  useEffect(() => {
    if (selectedRoleView !== 'admin' || !pendingNavigationSectionId) {
      return
    }

    const timerId = window.setTimeout(() => {
      scrollToSection(pendingNavigationSectionId)
      setPendingNavigationSectionId('')
    }, 50)

    return () => window.clearTimeout(timerId)
  }, [pendingNavigationSectionId, selectedRoleView])

  function scrollToSection(sectionId) {
    document.getElementById(sectionId)?.scrollIntoView({ block: 'start' })
  }

  function openWorkspace(sectionId, workspaceLabel, requiredRole = null) {
    if (!requiredRole || selectedRoleView === requiredRole) {
      scrollToSection(sectionId)
      return
    }

    setRoleSwitchRequest({ sectionId, workspaceLabel, requiredRole })
  }

  function confirmRoleSwitch() {
    if (!roleSwitchRequest) return

    if (roleSwitchRequest.requiredRole === 'admin' && adminDemoUser) {
      setSelectedDemoUserId(adminDemoUser.id)
      setPendingNavigationSectionId(roleSwitchRequest.sectionId)
      setRoleSwitchRequest(null)
    }
  }

  function cancelRoleSwitch() {
    setRoleSwitchRequest(null)
    setPendingNavigationSectionId('')
  }

  return (
    <main className="app-shell production-shell react-production-shell" data-testid="react-production-shell">
      <section className="production-hero" id="react-dashboard" aria-labelledby="react-app-title" data-testid="react-production-hero">
        <nav className="react-top-nav" aria-label="Cruise application primary navigation" data-testid="react-top-navigation">
          <a className="react-brand" href="/" aria-label="Cruise Fleet Operations Platform home">
            Cruise Fleet Operations Platform
          </a>
          <div className="react-nav-links">
            <a href="#react-dashboard">Dashboard</a>
            <a href="#react-workspaces">Workspaces</a>
            <button type="button" onClick={() => openWorkspace('react-role-selector', 'Role-aware Views')}>Roles</button>
            <button type="button" onClick={() => openWorkspace('react-hierarchy', 'Admin Operations', 'admin')}>Operations</button>
            <button type="button" onClick={() => openWorkspace('react-fleet', 'Fleet Directory', 'admin')}>Fleet</button>
            <button type="button" onClick={() => openWorkspace('react-quality', 'Quality Console', 'admin')}>Quality</button>
          </div>
        </nav>

        <div className="production-hero-content">
          <p className="eyebrow">Cruise Operations Dashboard</p>
          <h1 id="react-app-title">Manage cruise line and fleet operations</h1>
          <p className="hero-copy">
            A production-style React operations console for viewing customers, bookings, cruise lines,
            fleet data, and quality status from the same Express application and live API dataset.
          </p>

          <div className="hero-cta-row" aria-label="Cruise application shortcuts">
            <button type="button" className="button-link primary" onClick={() => openWorkspace('react-hierarchy', 'Admin Operations', 'admin')} data-testid="react-hero-operations-button">Review Operations</button>
            <button type="button" className="button-link secondary" onClick={() => openWorkspace('react-quality', 'Quality Console', 'admin')} data-testid="react-hero-quality-button">Open Quality Console</button>
          </div>

          <div className="hero-status-pills" aria-label="Cruise application capabilities">
            <span>Express Hosted</span>
            <span>API Connected</span>
            <span>Production Ready</span>
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
          <button type="button" className="react-workspace-card" style={workspaceTouchTargetStyle} onClick={() => openWorkspace('react-role-selector', 'Role-aware Views')} data-testid="react-workspace-role-button">
            <span className="workspace-icon" aria-hidden="true">👥</span>
            <span className="workspace-card-title">Role-aware Views</span>
            <span>Switch between admin, passenger, and group leader views.</span>
          </button>
          <button type="button" className="react-workspace-card" style={workspaceTouchTargetStyle} onClick={() => openWorkspace('react-hierarchy', 'Admin Operations', 'admin')} data-testid="react-workspace-operations-button">
            <span className="workspace-icon" aria-hidden="true">🧾</span>
            <span className="workspace-card-title">Admin Operations</span>
            <span>Search and manage customer and booking datasets.</span>
          </button>
          <button type="button" className="react-workspace-card" style={workspaceTouchTargetStyle} onClick={() => openWorkspace('react-fleet', 'Fleet Directory', 'admin')} data-testid="react-workspace-fleet-button">
            <span className="workspace-icon" aria-hidden="true">🚢</span>
            <span className="workspace-card-title">Fleet Directory</span>
            <span>Search cruise lines, manage fleets, ships, and sailings.</span>
          </button>
          <button type="button" className="react-workspace-card" style={workspaceTouchTargetStyle} onClick={() => openWorkspace('react-quality', 'Quality Console', 'admin')} data-testid="react-workspace-quality-button">
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
              Choose the business context, inspect customer and booking workflows,
              manage the fleet, then validate quality gates from the quality panel.
            </p>
          </div>
          <ol className="workflow-step-list" aria-label="Recommended workflow controls">
            <li>
              <button type="button" className="workflow-step-button" onClick={() => openWorkspace('react-role-selector', 'Role-aware Views')} data-testid="react-workflow-role-button">
                <strong>01</strong><span>Choose role</span>
              </button>
            </li>
            <li>
              <button type="button" className="workflow-step-button" onClick={() => openWorkspace('react-hierarchy', 'Admin Operations', 'admin')} data-testid="react-workflow-operations-button">
                <strong>02</strong><span>Review operations</span>
              </button>
            </li>
            <li>
              <button type="button" className="workflow-step-button" onClick={() => openWorkspace('react-fleet', 'Fleet Directory', 'admin')} data-testid="react-workflow-fleet-button">
                <strong>03</strong><span>Manage fleet</span>
              </button>
            </li>
            <li>
              <button type="button" className="workflow-step-button" aria-label="Run quality checks" onClick={() => openWorkspace('react-quality', 'Quality Console', 'admin')} data-testid="react-workflow-quality-button">
                <strong>04</strong><span>Quality checks</span>
              </button>
            </li>
          </ol>
        </div>
      </section>

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

            <section id="react-quality" className="react-quality-section" aria-label="Quality validation console">
              <ReactSqaConsole onRefreshData={() => Promise.all([reload(), reloadFleet()])} />
            </section>
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
