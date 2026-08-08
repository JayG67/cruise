const fs = require('fs')
const path = require('path')
const RETIRED_APP_CSS_PATH = ['frontend/react/src/styles/app', 'css'].join('.')
const PROJECT_ROOT = path.resolve(__dirname, '../..')
function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), 'utf8')
}
function readRoleViewSurface() {
  return ['roleView', 'roleIdentity', 'rolePassenger', 'roleOperations', 'roleOperationalAssignments', 'roleOperationalCommandCenters', 'roleOperationalReadiness']
    .map(name => readProjectFile(`frontend/react/src/domain/${name}.js`)).join('\n')
}
function readRoleSelectorSurface() {
  return [
    readProjectFile('frontend/react/src/components/ReactRoleSelector.jsx'),
    readProjectFile('frontend/react/src/components/useRoleSelectorState.js'),
    readProjectFile('frontend/react/src/components/OperationalRoleSelectorWorkspace.jsx'),
    readProjectFile('frontend/react/src/components/PassengerRoleSelectorWorkspace.jsx'),
    readProjectFile('frontend/react/src/domain/roleSelectorOptions.js')
  ].join('\n')
}
function readAdminHierarchySurface() {
  const projectRoot = path.join(__dirname, '..', '..')
  return [
    'frontend/react/src/components/CustomerBookingHierarchy.jsx',
    'frontend/react/src/components/admin/useCustomerBookingHierarchyState.js',
    'frontend/react/src/components/admin/AdminCustomerBookingMutationPanel.jsx',
    'frontend/react/src/components/admin/AdminCustomerWorkflowSelector.jsx',
    'frontend/react/src/components/admin/AdminCustomerWorkflowTable.jsx',
    'frontend/react/src/components/CustomerHierarchyRow.jsx',
    'frontend/react/src/components/BookingCard.jsx'
  ].map(relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')).join('\n')
}

function optionalStyleRead(relativePath) {
  const fullPath = path.join(__dirname, '..', '..', relativePath)
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : ''
}

function readCssBundle(...relativePaths) {
  const projectRoot = path.join(__dirname, '..', '..')

  function readRecursive(relativePath, seen = new Set()) {
    const fullPath = path.join(projectRoot, relativePath)
    if (seen.has(fullPath)) {
      return ''
    }
    seen.add(fullPath)

    const content = fs.readFileSync(fullPath, 'utf8')
    const directory = path.dirname(relativePath)

    return content.replace(/@import\s+['"](.+?)['"];?/g, (_match, importPath) => {
      const nestedPath = path.normalize(path.join(directory, importPath)).replace(/\\/g, '/')
      return readRecursive(nestedPath, seen)
    })
  }

  return relativePaths.map(relativePath => readRecursive(relativePath)).join('\n')
}


describe('React route preview accessibility contracts', () => {
  const projectRoot = path.resolve(__dirname, '../..')

  function read(relativePath) {
    return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
  }

  function readFleetDirectorySurface() {
    return [
      read('frontend/react/src/components/ReactFleetDirectory.jsx'),
      read('frontend/react/src/components/fleet/ReactFleetCruiseLineGrid.jsx'),
      read('frontend/react/src/components/fleet/ReactFleetShipPanel.jsx'),
      read('frontend/react/src/components/fleet/ReactFleetSailingPanel.jsx'),
      read('frontend/react/src/components/fleet/ReactFleetItineraryPanel.jsx'),
      read('frontend/react/src/components/fleet/fleetDirectoryUtils.js'),
      read('frontend/react/src/components/fleet/useFleetDirectoryState.js'),
      read('frontend/react/src/components/fleet/useFleetCruiseLineActions.js'),
      read('frontend/react/src/components/fleet/useFleetShipActions.js'),
      read('frontend/react/src/components/fleet/useFleetSailingActions.js'),
      read('frontend/react/src/components/fleet/useFleetItineraryActions.js')
    ].join('\n')
  }

  function readRoleDashboardSurface() {
    return [
      read('frontend/react/src/components/ReactRoleDashboard.jsx'),
      read('frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'),
      read('frontend/react/src/components/operations/OperationalCommandOverviewPanel.jsx'),
      read('frontend/react/src/components/operations/OperationsLifecyclePanel.jsx'),
      read('frontend/react/src/components/operations/OperationsWorkspaceRouter.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandOverviewCompatibility.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandOverviewCard.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandSummarySection.jsx'),
      read('frontend/react/src/components/operations/OperationsDependencyHandoffSection.jsx'),
      read('frontend/react/src/components/operations/OperationsStaffingSignoffSection.jsx'),
      read('frontend/react/src/components/operations/OperationsEscalationSection.jsx'),
      read('frontend/react/src/components/operations/OperationsTaskChecklistSection.jsx'),
      read('frontend/react/src/components/operations/OperationalOverviewBoards.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsStaffingReadinessWorkspaces.jsx'),
      read('frontend/react/src/components/operations/OperationsTaskFlowWorkspaces.jsx'),
      read('frontend/react/src/components/operations/OperationsDependencyWorkspace.jsx'),
      read('frontend/react/src/components/operations/OperationsEscalationWorkspace.jsx'),
      read('frontend/react/src/components/operations/OperationsHandoffWorkspace.jsx'),
      read('frontend/react/src/components/operations/OperationsTaskWorkspace.jsx'),
      read('frontend/react/src/components/operations/OperationsEvidencePanels.jsx'),
      read('frontend/react/src/components/operations/OperationsReadinessEvidencePanels.jsx'),
      read('frontend/react/src/components/operations/OperationsReleasePacketPanel.jsx'),
      read('frontend/react/src/components/operations/OperationsMetricsPanel.jsx'),
      read('frontend/react/src/components/operations/OperationsPlaybookPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsIncidentBriefingScenarioPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx'),
      read('frontend/react/src/components/operations/operationalDashboardUtils.js'),
      read('frontend/react/src/components/operations/useOperationalDashboardDrafts.js')
    ].join('\n')
  }

  it('keeps React workspace controls accessible and discoverable', () => {
    const app = read('frontend/react/src/App.jsx')

    expect(app).toContain('aria-label="React application workspaces"')
    expect(app).not.toContain('data-testid="react-workspace-demo-button"')
    expect(app).toContain('data-testid="react-workspace-role-button"')
    expect(app).toContain('data-testid="react-workspace-operations-button"')
    expect(app).toContain('data-testid="react-workspace-fleet-button"')
    expect(app).toContain('data-testid="react-workspace-intelligence-button"')
    expect(app).not.toContain('data-testid="react-release-readiness-section"')
    expect(app).not.toContain(['React', 'RouteNav'].join(''))
    expect(app).toContain('aria-label="Customer-centered operations"')
  })

  it('keeps the self-guided overview concise and separate from workspace cards', () => {
    const app = read('frontend/react/src/App.jsx')
    const overview = read('frontend/react/src/components/PlatformWorkspaceNavigator.jsx')
    const density = read('frontend/react/src/styles/components/platform-workspace-density.css')
    const hierarchy = readAdminHierarchySurface()
    expect(density).toContain('grid-template-columns: repeat(5, minmax(0, 1fr))')
    expect(density).toContain('@media (max-width: 760px)')
    expect(app).not.toContain('aria-label="Recommended workflow controls"')
    expect(app).not.toContain('type="button" className="workflow-step-button"')
    expect(app).not.toContain('data-testid="react-workspace-demo-button"')
    expect(overview).toContain('self-guided-tour-list')
    expect(overview).toContain('Operational workspaces and platform capabilities')
    expect(overview).not.toContain('What to say while presenting')
    expect(hierarchy).toContain('aria-expanded={workflowsVisible}')
    expect(hierarchy).toContain('aria-controls="react-customer-workflow-table"')
  })


  it('keeps React admin workspace table semantics aligned with the operations workflow table', () => {
    const hierarchy = readAdminHierarchySurface()
    const row = read('frontend/react/src/components/CustomerHierarchyRow.jsx')

    expect(hierarchy).toContain('aria-labelledby="react-admin-workspace-heading"')
    expect(hierarchy).toContain('aria-label="Admin workspace record counts"')
    expect(hierarchy).toContain('caption>Admin-visible customers')
    expect(row).toContain('aria-expanded={isExpanded}')
    expect(row).toContain('aria-controls={bookingsRowId}')
    expect(row).toContain('td colSpan="6"')
  })


  it('keeps admin customer records sorted and displayed by last name first', () => {
    const hierarchy = readAdminHierarchySurface()
    const adminHierarchyDomain = read('frontend/react/src/domain/adminHierarchy.js')

    expect(hierarchy).toContain('getCustomerDirectoryName(customer)')
    expect(adminHierarchyDomain).toContain('export function getCustomerDirectoryName')
    expect(adminHierarchyDomain).toContain('return `${lastName}, ${firstName}`')
    expect(adminHierarchyDomain).toContain('export function compareCustomersByDirectoryName')
    expect(adminHierarchyDomain).toContain('[...customers].sort(compareCustomersByDirectoryName)')
    expect(adminHierarchyDomain).toContain('getCustomerDirectoryName(customer)')
  })


  it('keeps React admin, fleet, create, and quality sections sequenced for production operations', () => {
    const app = read('frontend/react/src/App.jsx')

    expect(app.indexOf('<ReactRoleSelector')).toBeLessThan(app.indexOf('<CustomerBookingHierarchy'))
    expect(app.indexOf('<CustomerBookingHierarchy')).toBeLessThan(app.indexOf('<ReactFleetDirectory'))
    expect(app.indexOf('<ReactFleetDirectory')).toBeLessThan(app.indexOf('<ReactCruiseLineCreateWorkflow'))
    expect(app.indexOf('<ReactCruiseLineCreateWorkflow')).toBeLessThan(app.indexOf('<OperationsIntelligenceCenter'))
  })


  it('keeps React create cruise line workflow accessible', () => {
    const createWorkflow = read('frontend/react/src/components/ReactCruiseLineCreateWorkflow.jsx')

    expect(createWorkflow).toContain('aria-labelledby="react-create-heading"')
    expect(createWorkflow).toContain('role="status"')
    expect(createWorkflow).toContain('data-testid="react-create-cruise-line-name"')
    expect(createWorkflow).toContain('data-testid="react-create-ship-name"')
    expect(createWorkflow).toContain('data-testid="react-save-cruise-line"')
  })


  it('keeps React quality console controls accessible', () => {
    const sqa = [
      read('frontend/react/src/components/ReactSqaConsole.jsx'),
      read('frontend/react/src/components/QualityValidationWorkspace.jsx')
    ].join('\n')

    expect(sqa).toContain('aria-labelledby="react-sqa-heading"')
    expect(sqa).toContain('aria-label="Quality validation actions"')
    expect(sqa).toContain('aria-label="Quality report links"')
    expect(sqa).toContain('role="status"')
    expect(sqa).toContain('aria-live="polite"')
    expect(sqa).toContain("testId: 'react-sqa-health-button'")
    expect(sqa).toContain('data-testid={action.testId}')
    expect(sqa).toContain("testId: 'react-sqa-ui-smoke-button'")
    expect(sqa).toContain('data-testid="react-sqa-reset-demo-data-button"')
    expect(sqa).toContain("import QualityValidationWorkspace from './QualityValidationWorkspace.jsx'")
    expect(sqa).toContain("import ConfirmActionPanel from './ConfirmActionPanel.jsx'")
    expect(sqa).toContain('resetConfirmationVisible')
    expect(sqa).toContain('testId="react-sqa-reset-confirmation"')
    expect(sqa).not.toContain('window.confirm')
  })


  it('keeps operational intelligence workflow coverage aligned with the live product surface', () => {
    const cypress = read('cypress/react/reactOperationsIntelligence.cy.js')
    const selectors = read('cypress/react/support/reactSelectors.js')
    const intelligence = read('frontend/react/src/components/OperationsIntelligenceCenter.jsx')

    expect(intelligence).toContain('id="react-operations-intelligence"')
    expect(intelligence).toContain('aria-live="polite"')
    expect(intelligence).toContain('Refresh operational data')
    expect(selectors).toContain("operationsIntelligenceRefreshButton: 'react-operations-intelligence-refresh-button'")
    expect(cypress).toContain('refreshes the live operation data and visibly renders the returned changes')
    expect(cypress).toContain('cy.getByTestId(rs.operationsIntelligenceRefreshButton)')
    expect(cypress).toContain(".and('not.contain.text', 'Release policy controls')")
    expect(cypress).toContain(".and('not.contain.text', 'Baseline comparison')")
    expect(cypress).toContain(".and('not.contain.text', 'AI evaluation quality')")
  })


  it('keeps React passenger self-service profile saves wired to the passenger-profile API', () => {
    const client = read('frontend/react/src/api/client.js')
    const hook = read('frontend/react/src/hooks/useCustomerProfileMutation.js')
    const roleDashboard = [
      read('frontend/react/src/components/ReactRoleDashboard.jsx'),
      read('frontend/react/src/components/passenger/RolePassengerSurface.jsx')
    ].join('\n')
    const cypress = read('cypress/react/reactApp.cy.js')

    expect(client).toContain('updatePassengerProfile')
    expect(client).toContain('/passenger-profile')
    expect(hook).toContain('updatePassengerProfile')
    expect(hook).toContain('hasPassengerProfileFields')
    expect(hook).toContain('diningPreference: trimOptional(draft.diningPreference)')
    expect(hook).toContain('accessibilityNotes: trimOptional(draft.accessibilityNotes)')
    expect(roleDashboard).toContain('onSavePassengerProfile')
    expect(roleDashboard).toContain('buildPassengerProfileDraft')
    expect(roleDashboard).toContain('[selectedCustomerId, selectedDemoUser?.id]')
    expect(roleDashboard).not.toContain('[selectedCustomer?.id, selectedDemoUser?.id, visibleBookings]')
    expect(cypress).toContain('saves React passenger profile and preference changes through the passenger self-service API')
    expect(cypress).toContain("cy.intercept('PATCH', '/cruise/customers/react-passenger-customer/passenger-profile'")
  })


  it('keeps passenger booking guest selection on searchable finder cards instead of a giant dropdown', () => {
    const bookingWorkflow = read('frontend/react/src/components/PassengerCruiseBookingWorkflow.jsx')
    const bookingGuests = read('frontend/react/src/components/PassengerBookingGuestWorkspace.jsx')
    const bookingBoundary = `${bookingWorkflow}
${bookingGuests}`
    const selectors = read('cypress/react/support/reactSelectors.js')
    const cypress = read('cypress/react/reactPassengerSelfService.cy.js')

    expect(bookingBoundary).toContain('data-testid="react-booking-guest-finder"')
    expect(bookingBoundary).toContain('data-testid="react-booking-guest-search-input"')
    expect(bookingBoundary).toContain('data-testid="react-booking-guest-result-card"')
    expect(bookingBoundary).toContain('booking-guest-result-card ce-selector-card ce-command-card')
    expect(bookingBoundary).toContain('booking-guest-result-main ce-selector-card-main')
    expect(bookingBoundary).toContain('booking-guest-result-context ce-selector-card-detail')
    expect(bookingBoundary).not.toContain('data-testid="react-booking-existing-customer-select"')
    expect(bookingGuests).toContain('aria-pressed={guest.customerId === option.customer.id}')
    expect(selectors).toContain("bookingGuestResultCard: 'react-booking-guest-result-card'")
    expect(cypress).toContain('searchable cards instead of a giant dropdown')
  })

  it('keeps React person selector on searchable cards instead of a giant dropdown', () => {
    const selector = readRoleSelectorSurface()
    const hook = read('frontend/react/src/hooks/useDemoUsers.js')

    expect(selector).toContain("value={visibleDemoUsers.some(user => user.id === selectedDemoUserId) ? selectedDemoUserId : ''}")
    expect(selector).toContain('onChange={event => onSelectDemoUser?.(event.target.value)}')
    expect(selector).toContain('data-testid="react-demo-user-select"')
    expect(selector).toContain('data-testid="react-person-finder-panel"')
    expect(selector).toContain('data-testid="react-person-search-input"')
    expect(selector).toContain('data-testid="react-person-finder-result-card"')
    expect(selector).toContain('data-testid="react-operational-person-filter-panel"')
    expect(selector).toContain('data-testid="react-operational-cruise-line-filter"')
    expect(selector).toContain('data-testid="react-operational-ship-filter"')
    expect(selector).toContain('disabled={!operationalCruiseLineFilter}')
    expect(selector).toContain('personOptionCards.slice(0, 16)')
    expect(selector).toContain('Choose a person')
    expect(selector).toContain('Search to narrow the list instead of scanning a long dropdown')
    expect(selector).toContain('Choose the person whose workspace you want to review')
    expect(selector).toContain('data-testid="react-operational-selector-summary"')
    expect(selector).toContain('Select a cruise line to show assigned turnaround people')
    expect(selector).toContain('data-testid="react-passenger-finder-panel"')
    expect(selector).toContain('data-testid="react-passenger-search-input"')
    expect(selector).toContain('data-testid="react-passenger-finder-results"')
    expect(selector).toContain('data-testid="react-passenger-finder-result-card"')
    expect(selector).toContain('className="passenger-finder-card-main ce-selector-card-main" data-testid="react-passenger-finder-result-card"')
    expect(selector).not.toContain('selector-compatibility-card-anchor')
    expect(selector).toContain('formatDemoUserLabel(user, bookings)')
    expect(hook).toContain('getDemoUsers')
    expect(hook).toContain('selectedDemoUser')
  })

  it('formats React demo user options with display names and readable roles', () => {
    const selector = readRoleSelectorSurface()

    expect(selector).toContain('user.displayName')
    expect(read('frontend/react/src/components/ReactRoleSelector.jsx')).toContain('formatDemoUserRole,')
    expect(selector).toContain("split('_')")
    expect(selector).toContain('<option key={user.id} value={user.id}>{formatDemoUserLabel(user, bookings)}</option>')
  })


  it('keeps React passenger and group dashboards accessible after role switching', () => {
    const roleDashboard = [
      read('frontend/react/src/components/ReactRoleDashboard.jsx'),
      read('frontend/react/src/components/passenger/RolePassengerSurface.jsx'),
      read('frontend/react/src/components/passenger/PassengerVoyagePlanner.jsx'),
      read('frontend/react/src/components/passenger/RoleBookingCard.jsx'),
      read('frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'),
      read('frontend/react/src/components/operations/OperationalCommandOverviewPanel.jsx'),
      read('frontend/react/src/components/operations/OperationsLifecyclePanel.jsx'),
      read('frontend/react/src/components/operations/OperationsWorkspaceRouter.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandOverviewCompatibility.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandOverviewCard.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandSummarySection.jsx'),
      read('frontend/react/src/components/operations/OperationsDependencyHandoffSection.jsx'),
      read('frontend/react/src/components/operations/OperationsStaffingSignoffSection.jsx'),
      read('frontend/react/src/components/operations/OperationsEscalationSection.jsx'),
      read('frontend/react/src/components/operations/OperationsTaskChecklistSection.jsx'),
      read('frontend/react/src/components/operations/OperationalOverviewBoards.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsStaffingReadinessWorkspaces.jsx'),
      read('frontend/react/src/components/operations/OperationsTaskFlowWorkspaces.jsx'),
      read('frontend/react/src/components/operations/OperationsDependencyWorkspace.jsx'),
      read('frontend/react/src/components/operations/OperationsEscalationWorkspace.jsx'),
      read('frontend/react/src/components/operations/OperationsHandoffWorkspace.jsx'),
      read('frontend/react/src/components/operations/OperationsTaskWorkspace.jsx'),
      read('frontend/react/src/components/operations/OperationsEvidencePanels.jsx'),
      read('frontend/react/src/components/operations/OperationsReadinessEvidencePanels.jsx'),
      read('frontend/react/src/components/operations/OperationsReleasePacketPanel.jsx'),
      read('frontend/react/src/components/operations/OperationsMetricsPanel.jsx'),
      read('frontend/react/src/components/operations/OperationsPlaybookPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsIncidentBriefingScenarioPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx'),
      read('frontend/react/src/components/operations/operationalDashboardUtils.js'),
      read('frontend/react/src/components/operations/useOperationalDashboardDrafts.js')
    ].join('\n')
    const app = read('frontend/react/src/App.jsx')

    expect(roleDashboard).toContain('aria-labelledby="react-role-dashboard-heading"')
    expect(roleDashboard).toContain('data-testid={`react-${roleView}-dashboard`}')
    expect(roleDashboard).toContain('aria-labelledby="react-passenger-profile-heading"')
    expect(roleDashboard).toContain('data-testid="react-passenger-profile-form"')
    expect(roleDashboard).toContain('data-testid="react-dining-preference-select"')
    expect(roleDashboard).toContain('data-testid="react-passenger-profile-message"')
    expect(roleDashboard).toContain('role="status" aria-live="polite"')
    expect(roleDashboard).toContain('data-testid="react-role-booking-card"')
    expect(app).toContain('visibleBookingCount={visibleRoleBookings.length}')
    expect(app).toContain('onSavePassengerProfile={saveCustomerProfile}')
  })


  it('keeps React passenger booking details and itinerary favorites in coverage with the role dashboard', () => {
    const roleDashboard = [
      read('frontend/react/src/components/ReactRoleDashboard.jsx'),
      read('frontend/react/src/components/passenger/RolePassengerSurface.jsx'),
      read('frontend/react/src/components/passenger/PassengerVoyagePlanner.jsx'),
      read('frontend/react/src/components/passenger/RoleBookingCard.jsx'),
      read('frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'),
      read('frontend/react/src/components/operations/OperationalCommandOverviewPanel.jsx'),
      read('frontend/react/src/components/operations/OperationsLifecyclePanel.jsx'),
      read('frontend/react/src/components/operations/OperationsWorkspaceRouter.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandOverviewCompatibility.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandOverviewCard.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandSummarySection.jsx'),
      read('frontend/react/src/components/operations/OperationsDependencyHandoffSection.jsx'),
      read('frontend/react/src/components/operations/OperationsStaffingSignoffSection.jsx'),
      read('frontend/react/src/components/operations/OperationsEscalationSection.jsx'),
      read('frontend/react/src/components/operations/OperationsTaskChecklistSection.jsx'),
      read('frontend/react/src/components/operations/OperationalOverviewBoards.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsStaffingReadinessWorkspaces.jsx'),
      read('frontend/react/src/components/operations/OperationsTaskFlowWorkspaces.jsx'),
      read('frontend/react/src/components/operations/OperationsDependencyWorkspace.jsx'),
      read('frontend/react/src/components/operations/OperationsEscalationWorkspace.jsx'),
      read('frontend/react/src/components/operations/OperationsHandoffWorkspace.jsx'),
      read('frontend/react/src/components/operations/OperationsTaskWorkspace.jsx'),
      read('frontend/react/src/components/operations/OperationsEvidencePanels.jsx'),
      read('frontend/react/src/components/operations/OperationsReadinessEvidencePanels.jsx'),
      read('frontend/react/src/components/operations/OperationsReleasePacketPanel.jsx'),
      read('frontend/react/src/components/operations/OperationsMetricsPanel.jsx'),
      read('frontend/react/src/components/operations/OperationsPlaybookPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsIncidentBriefingScenarioPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx'),
      read('frontend/react/src/components/operations/operationalDashboardUtils.js'),
      read('frontend/react/src/components/operations/useOperationalDashboardDrafts.js')
    ].join('\n')
    const roleView = readRoleViewSurface()
    const passengerRoleSurface = read('frontend/react/src/components/passenger/RolePassengerSurface.jsx')
    const passengerVoyagePlanner = read('frontend/react/src/components/passenger/PassengerVoyagePlanner.jsx')
    const roleBookingCard = read('frontend/react/src/components/passenger/RoleBookingCard.jsx')
    const contrastContract = read('frontend/react/src/styles/utilities/contrast-contract.css')
    const styles = readCssBundle('frontend/react/src/styles/components/workflow.css')
    const cypress = read('cypress/react/reactApp.cy.js')

    expect(roleDashboard).toContain('RoleBookingDetails')
    expect(roleDashboard).toContain('data-testid="react-role-booking-details-toggle"')
    expect(roleDashboard).toContain('data-testid="react-role-booking-details"')
    expect(roleDashboard).toContain('data-testid="react-role-itinerary-day"')
    expect(roleDashboard).toContain('data-testid="react-role-favorite-itinerary-toggle"')
    expect(roleDashboard).toContain('data-testid="react-role-favorites-only-toggle"')
    expect(roleDashboard).toContain('role-favorites-filter ce-surface-light')
    expect(roleBookingCard).toContain('role-favorites-filter ce-surface-light')
    expect(passengerRoleSurface).toContain("export { default as PassengerVoyagePlanner } from './PassengerVoyagePlanner.jsx'")
    expect(passengerVoyagePlanner).toContain('data-testid="react-passenger-voyage-planner"')
    expect(roleBookingCard).toContain('role-favorites-filter ce-surface-light')
    expect(contrastContract).toContain('.role-favorites-filter.ce-surface-light span')
    expect(roleDashboard).toContain('group-leader-dashboard-status ce-surface-light')
    expect(contrastContract).toContain('.group-leader-dashboard-status.ce-surface-light')
    expect(roleDashboard).toContain('aria-expanded={isExpanded}')
    expect(roleView).toContain('getBookingItineraryDays')
    expect(roleView).toContain('getItineraryDayActivities')
    expect(styles).toContain('React passenger and group booking details coverage with the prior role dashboard')
    expect(styles).toContain('.role-booking-detail-panel')
    expect(styles).toContain('.role-itinerary-day')
    expect(cypress).toContain('opens React passenger booking details and filters favorite itinerary activities')
  })


  it('keeps React role dashboard tolerant of loading demo-user data', () => {
    const roleView = readRoleViewSurface()
    const roleDashboard = readRoleDashboardSurface()

    expect(roleView).toContain('selectedDemoUser?.displayName')
    expect(roleDashboard).toContain('selectedDemoUser={selectedDemoUser}')
    expect(roleDashboard).toContain('getRoleSummaryLine')
  })


  it('keeps React workspace cards usable as Safari mobile touch targets', () => {
    const app = read('frontend/react/src/App.jsx')
    const styles = readCssBundle('frontend/react/src/styles/components/workflow.css')

    expect(app).not.toContain('data-testid="react-workspace-demo-button"')
    expect(app).toContain('data-testid="react-workspace-role-button"')
    expect(app).toContain('data-testid="react-workspace-operations-button"')
    expect(app).toContain('data-testid="react-workspace-fleet-button"')
    expect(app).toContain('data-testid="react-workspace-intelligence-button"')
    expect(styles).toContain('React workspace mobile touch target stabilization')
    expect(styles).toContain('button.react-workspace-card')
    expect(styles).toContain('min-height: 72px')
    expect(styles).toContain('padding-block: 1rem')
  })


  it('keeps React workspace buttons guarded with inline Safari-safe touch targets', () => {
    const app = read('frontend/react/src/App.jsx')
    const styles = readCssBundle('frontend/react/src/styles/components/workflow.css')

    expect(app).toContain('const workspaceTouchTargetStyle')
    expect(app).toContain("minHeight: '72px'")
    expect(app).toContain('style={workspaceTouchTargetStyle}')
    expect(styles).toContain('React workspace button hard guarantee')
    expect(styles).toContain('min-height: 72px !important')
  })


  it('keeps React workspace buttons at an explicit WebKit-safe height', () => {
    const app = read('frontend/react/src/App.jsx')
    const styles = readCssBundle('frontend/react/src/styles/components/workflow.css')

    expect(app).toContain("height: '72px'")
    expect(app).toContain("blockSize: '72px'")
    expect(app).toContain("minBlockSize: '72px'")
    expect(app).toContain("WebkitAppearance: 'none'")
    expect(styles).toContain('React workspace explicit WebKit height contract')
    expect(styles).toContain('height: 72px !important')
    expect(styles).toContain('min-block-size: 72px !important')
  })


  it('keeps React workspace touch-target styles exposed to Playwright', () => {
    const app = read('frontend/react/src/App.jsx')
    const styles = readCssBundle('frontend/react/src/styles/components/workflow.css')

    expect(app).toContain("height: '72px'")
    expect(app).toContain("blockSize: '72px'")
    expect(app).toContain("boxSizing: 'border-box'")
    expect(styles).toContain('height: 72px !important')
    expect(styles).toContain('box-sizing: border-box !important')
  })


  it('keeps React mobile tests validating behavior instead of fragile Safari measurements', () => {
    const mobileReactSpec = read('playwright/mobile/react-production-mobile.spec.js')

    expect(mobileReactSpec).toContain("page.getByTestId('react-person-finder-result-card').first()")
    expect(mobileReactSpec).toContain('await roleWorkspaceButton.click()')
    expect(mobileReactSpec).not.toContain('expectTouchTargetIsUsable')
  })


  it('keeps React checkbox labels from creating Mobile Safari document overflow', () => {
    const app = read('frontend/react/src/App.jsx')
    const fleet = readFleetDirectorySurface()
    const styles = readCssBundle('frontend/react/src/styles/components/workflow.css')

    expect(app).toContain('react-production-shell')
    expect(fleet).toContain('className="react-checkbox-label"')
    expect(styles).toContain('React Mobile Safari checkbox overflow fix')
    expect(styles).toContain('overflow-x: clip')
    expect(styles).toContain('.react-production-shell input[type="checkbox"]')
    expect(styles).toContain('inline-size: 1rem')
    expect(styles).toContain('flex: 0 0 auto')
    expect(styles).toContain('flex-wrap: wrap')
  })


  it('keeps React fleet directory wired to the real View Ships API workflow', () => {
    const fleet = readFleetDirectorySurface()
    const client = read('frontend/react/src/api/client.js')
    const cypress = read('cypress/react/reactApp.cy.js')
    const responsive = read('playwright/responsive/react-production-responsive.spec.js')

    expect(client).toContain('export async function getShipsForCruiseLine')
    expect(client).toContain('/cruise/ships/${encodeURIComponent(cruiseLineId)}')
    expect(fleet).toContain('getShipsForCruiseLine')
    expect(fleet).toContain('data-testid="react-fleet-search"')
    expect(fleet).toContain('data-testid="react-view-ships-button"')
    expect(fleet).toContain('data-testid="react-selected-ships-panel"')
    expect(fleet).toContain('data-testid="react-ship-card"')
    expect(cypress).toContain('searches the React fleet directory and loads ships for a selected cruise line')
    expect(responsive).toContain('loads React fleet ships from the fleet directory at desktop width')
  })


  it('keeps React fleet delete coverage wired through the real API', () => {
    const fleet = readFleetDirectorySurface()
    const client = read('frontend/react/src/api/client.js')
    const cypress = read('cypress/react/reactApp.cy.js')
    const responsive = read('playwright/responsive/react-production-responsive.spec.js')

    expect(client).toContain('export async function deleteCruiseLine')
    expect(fleet).toContain('deleteCruiseLine')
    expect(fleet).toContain('function requestDeleteCruiseLine')
    expect(fleet).toContain('async function executeDeleteCruiseLine')
    expect(fleet).toContain('ConfirmActionPanel')
    expect(fleet).toContain('testId="react-fleet-delete-confirmation"')
    expect(fleet).toContain('data-testid="react-delete-cruise-line-button"')
    expect(fleet).toContain('data-testid="react-fleet-action-message"')
    expect(cypress).toContain('supports React fleet delete cancellation and confirmed deletion')
    expect(responsive).toContain('keeps React fleet delete guarded by a native React confirmation panel')
  })


  it('keeps the Fleet Directory on the wide admin rail with dense responsive cards', () => {
    const density = read('frontend/react/src/styles/components/fleet-directory-density.css')
    const index = read('frontend/react/src/styles/components/index.css')

    expect(index).toContain("@import './fleet-directory-density.css';")
    expect(density).toContain('max-width: var(--admin-home-rail-width, 1440px) !important')
    expect(density).toContain('padding-right: clamp(9rem, 12vw, 11rem) !important')
    expect(density).toContain('grid-template-columns: minmax(18rem, 1fr) auto !important')
    expect(density).toContain('grid-template-columns: repeat(4, minmax(0, 1fr)) !important')
    expect(density).toContain('grid-template-columns: repeat(2, minmax(0, 1fr)) !important')
    expect(density).toContain('grid-template-columns: 1fr !important')
  })


  it('keeps Turnaround Admin Setup on the shared wide administrator rail', () => {
    const turnaround = read('frontend/react/src/styles/components/admin-turnaround.css')

    expect(turnaround).toContain('max-width: var(--admin-home-rail-width, 1440px) !important')
    expect(turnaround).toContain('width: min(calc(100% - 2rem), var(--admin-home-rail-width, 1440px)) !important')
    expect(turnaround).not.toContain('max-width: 1180px !important')
    expect(turnaround).not.toContain('width: min(100% - 2rem, 1180px) !important')
  })


  it('keeps React create workflow coverage covered by browser tests', () => {
    const createWorkflow = read('frontend/react/src/components/ReactCruiseLineCreateWorkflow.jsx')
    const hook = read('frontend/react/src/hooks/useCruiseLineCreateWorkflow.js')
    const cypress = read('cypress/react/reactApp.cy.js')
    const responsive = read('playwright/responsive/react-production-responsive.spec.js')

    expect(createWorkflow).toContain('data-testid="react-remove-ship-row"')
    expect(createWorkflow).toContain('data-testid="react-reset-cruise-line"')
    expect(hook).toContain('normalizeOptional')
    expect(hook).toContain('normalizeShips')
    expect(hook).toContain('createCruiseLine')
    expect(hook).toContain('createShip')
    expect(cypress).toContain('creates a React cruise line with starter ships and reset behavior')
    expect(cypress).toContain("cy.intercept('POST', '/cruise/cruise-line'")
    expect(cypress).toContain("cy.intercept('POST', '/cruise/ship'")
    expect(responsive).toContain('keeps React create workflow usable at desktop width')
  })


  it('keeps React ship CRUD and sailing lookup coverage wired through browser coverage', () => {
    const fleet = readFleetDirectorySurface()
    const client = read('frontend/react/src/api/client.js')
    const cypress = read('cypress/react/reactApp.cy.js')
    const selectors = read('cypress/react/support/reactSelectors.js')
    const mobile = read('playwright/mobile/react-production-mobile.spec.js')
    const responsive = read('playwright/responsive/react-production-responsive.spec.js')

    expect(client).toContain('export async function updateShip')
    expect(client).toContain('export async function deleteShip')
    expect(client).toContain('export async function getSailingsForShip')
    expect(fleet).toContain('handleCreateShip')
    expect(fleet).toContain('handleUpdateShip')
    expect(fleet).toContain('requestDeleteShip')
    expect(fleet).toContain('executeDeleteShip')
    expect(fleet).toContain('handleViewSailings')
    expect(fleet).toContain('data-testid="react-create-ship-form"')
    expect(fleet).toContain('data-testid="react-view-sailings-button"')
    expect(fleet).toContain('data-testid="react-update-ship-button"')
    expect(fleet).toContain('data-testid="react-ship-edit-form"')
    expect(fleet).toContain('data-testid="react-save-ship-edit"')
    expect(fleet).toContain('data-testid="react-delete-ship-button"')
    expect(fleet).toContain('data-testid="react-sailings-panel"')
    expect(cypress).toContain('manages React ship CRUD and sailing lookup from the selected fleet panel')
    expect(mobile).toContain('keeps React ship and sailing controls reachable on mobile')
    expect(responsive).toContain('keeps React ship CRUD and sailings readable at desktop width')
  })


  it('keeps React admin create and delete coverage wired through browser coverage', () => {
    const hierarchy = readAdminHierarchySurface()
    const client = read('frontend/react/src/api/client.js')
    const cypress = read('cypress/react/reactApp.cy.js')
    const styles = readCssBundle('frontend/react/src/styles/components/workflow.css')

    expect(client).toContain('export async function createCustomer')
    expect(client).toContain('export async function deleteCustomer')
    expect(client).toContain('export async function createBooking')
    expect(client).toContain('export async function deleteBooking')
    expect(hierarchy).toContain('handleCreateCustomer')
    expect(hierarchy).toContain('handleCreateBooking')
    expect(hierarchy).toContain('handleDeleteCustomer')
    expect(hierarchy).toContain('handleDeleteBooking')
    expect(hierarchy).toContain('data-testid="react-admin-create-customer-form"')
    expect(hierarchy).not.toContain('data-testid="react-admin-create-booking-form"')
    expect(hierarchy).toContain('data-testid="react-admin-delete-booking-form"')
    expect(hierarchy).toContain('data-testid="react-admin-delete-customer-form"')
    expect(read('frontend/react/src/components/CustomerHierarchyRow.jsx')).toContain('data-testid="react-delete-customer-row-button"')
    expect(read('frontend/react/src/components/BookingCard.jsx')).toContain('data-testid="react-delete-booking-row-button"')
    expect(cypress).toContain('creates and deletes React admin customers and bookings')
    expect(cypress).toContain('deletes React admin customer and booking records from contextual workflow rows')
    expect(cypress).toContain('switches through React role dashboards using the actual demo user select')
    expect(cypress).not.toContain(`cy.get('[data-testid="react-role-selector"]').select`)
    expect(styles).toContain('React admin create/delete coverage')
  })


  it('keeps React role dashboard test ids based on normalized role views', () => {
    const roleView = readRoleViewSurface()
    const roleDashboard = readRoleDashboardSurface()
    const cypress = read('cypress/react/reactApp.cy.js')
    const selectors = read('cypress/react/support/reactSelectors.js')

    expect(roleView).toContain("if (normalizedRole.includes('group')) return 'group-leader'")
    expect(roleDashboard).toContain('data-testid={`react-${roleView}-dashboard`}')
    expect(selectors).toContain("groupLeaderDashboard: 'react-group-leader-dashboard'")
    expect(cypress).toContain('cy.getByTestId(rs.groupLeaderDashboard)')
    expect(cypress).not.toContain('react-group-dashboard')
  })


  it('keeps itinerary favorite integration test tied to demo-user context', () => {
    const integration = read('tests/integration/customersBookings.integration.test.js')
    const itineraryFavoriteTest = integration.slice(
      integration.indexOf("POST and DELETE /cruise/itinerary-favorites persists passenger itinerary interests"),
      integration.indexOf("POST /cruise/bookings should reject a booking that overlaps an existing passenger booking")
    )

    expect(itineraryFavoriteTest).toContain('const customerId = contextRes.body.customer.id')
    expect(itineraryFavoriteTest).toContain('send({ customerId, activityScheduleId })')
    expect(itineraryFavoriteTest).toContain('/itinerary-favorites/${customerId}/${activityScheduleId}')
    expect(itineraryFavoriteTest).not.toContain('customerId=C000000001')
    expect(itineraryFavoriteTest).not.toContain("customerId: 'C000000001'")
  })


  it('keeps React itinerary detail coverage wired through browser coverage', () => {
    const fleet = readFleetDirectorySurface()
    const client = read('frontend/react/src/api/client.js')
    const cypress = read('cypress/react/reactApp.cy.js')
    const selectors = read('cypress/react/support/reactSelectors.js')
    const mobile = read('playwright/mobile/react-production-mobile.spec.js')
    const responsive = read('playwright/responsive/react-production-responsive.spec.js')
    const styles = readCssBundle('frontend/react/src/styles/components/workflow.css')

    expect(client).toContain('export async function getItineraryForSailing')
    expect(fleet).toContain('handleViewItinerary')
    expect(fleet).toContain('data-testid="react-view-itinerary-button"')
    expect(fleet).toContain('data-testid="react-itinerary-panel"')
    expect(fleet).toContain('data-testid="react-itinerary-day-card"')
    expect(fleet).toContain('data-testid="react-itinerary-activity"')
    expect(cypress).toContain('loadReactItinerary')
    expect(selectors).toContain("itineraryPanel: 'react-itinerary-panel'")
    expect(cypress).toContain('cy.getByTestId(rs.itineraryPanel)')
    expect(mobile).toContain('react-view-itinerary-button')
    expect(responsive).toContain('react-view-itinerary-button')
    expect(styles).toContain('React itinerary detail coverage')
  })


  it('keeps React cruise line update coverage wired through browser coverage', () => {
    const fleet = readFleetDirectorySurface()
    const client = read('frontend/react/src/api/client.js')
    const cypress = read('cypress/react/reactApp.cy.js')
    const mobile = read('playwright/mobile/react-production-mobile.spec.js')
    const responsive = read('playwright/responsive/react-production-responsive.spec.js')

    expect(client).toContain('export async function updateCruiseLine')
    expect(client).toContain('/cruise/cruise-line/${encodeURIComponent(cruiseLineId)}')
    expect(fleet).toContain('async function handleUpdateCruiseLine')
    expect(fleet).toContain('openCruiseLineEdit')
    expect(fleet).toContain('data-testid="react-update-cruise-line-button"')
    expect(fleet).toContain('data-testid="react-cruise-line-edit-form"')
    expect(fleet).toContain('data-testid="react-save-cruise-line-edit"')
    expect(fleet).toContain('setSelectedCruiseLine({')
    expect(cypress).toContain('updates a React cruise line from the fleet directory')
    expect(cypress).toContain('updateReactCruiseLine')
    expect(mobile).toContain('keeps React cruise line update action reachable on mobile')
    expect(responsive).toContain('keeps React cruise line update form guarded by controlled cancellation')
  })


  it('keeps React cruise line update Cypress test from cancelling before PATCH', () => {
    const cypress = read('cypress/react/reactApp.cy.js')
    const selectors = read('cypress/react/support/reactSelectors.js')

    expect(selectors).toContain("cruiseLineEditForm: 'react-cruise-line-edit-form'")
    expect(selectors).toContain("saveCruiseLineEdit: 'react-save-cruise-line-edit'")
    expect(cypress).toContain('cy.getByTestId(rs.cruiseLineEditForm)')
    expect(cypress).toContain('cy.getByTestId(rs.saveCruiseLineEdit)')
    expect(cypress).toContain("cy.intercept('PATCH', '/cruise/cruise-line/*'")
    expect(cypress).toContain('expect(req.url).to.match(/\\/cruise\\/cruise-line\\/[0-9a-f-]{36}$/)')
  })


  it('keeps React cruise line update test using live seeded cruise line ids', () => {
    const cypress = read('cypress/react/reactApp.cy.js')

    expect(cypress).toContain("cy.intercept('PATCH', '/cruise/cruise-line/*'")
    expect(cypress).toContain('expect(req.url).to.match(/\\/cruise\\/cruise-line\\/[0-9a-f-]{36}$/)')
    expect(cypress).toContain("const cruiseLineId = req.url.split('/').pop()")
    expect(cypress).not.toContain("expect(req.url).to.contain('/cruise/cruise-line/royal-caribbean')")
  })


  it('keeps React sailing CRUD coverage wired through browser coverage', () => {
    const fleet = readFleetDirectorySurface()
    const client = read('frontend/react/src/api/client.js')
    const cypress = read('cypress/react/reactApp.cy.js')
    const mobile = read('playwright/mobile/react-production-mobile.spec.js')
    const responsive = read('playwright/responsive/react-production-responsive.spec.js')
    const styles = readCssBundle('frontend/react/src/styles/components/workflow.css')

    expect(client).toContain('export async function createSailing')
    expect(client).toContain('export async function updateSailing')
    expect(client).toContain('export async function deleteSailing')
    expect(fleet).toContain('handleCreateSailing')
    expect(fleet).toContain('handleUpdateSailing')
    expect(fleet).toContain('requestDeleteSailing')
    expect(fleet).toContain('executeDeleteSailing')
    expect(fleet).toContain('data-testid="react-create-sailing-form"')
    expect(fleet).toContain('data-testid="react-update-sailing-button"')
    expect(fleet).toContain('data-testid="react-delete-sailing-button"')
    expect(cypress).toContain('createReactSailing')
    expect(cypress).toContain('updateReactSailing')
    expect(cypress).toContain('deleteReactSailing')
    expect(mobile).toContain('keeps React sailing CRUD controls reachable on mobile')
    expect(responsive).toContain('keeps React sailing CRUD controls readable at desktop width')
    expect(styles).toContain('React sailing CRUD coverage')
  })


  it('keeps React sailing CRUD covered through controlled edit forms instead of prompts', () => {
    const cypress = read('cypress/react/reactApp.cy.js')
    const fleet = readFleetDirectorySurface()
    const testStart = cypress.indexOf("manages React ship CRUD and sailing lookup from the selected fleet panel")
    const testEnd = cypress.indexOf("runs a React quality health check and writes output", testStart)
    const testBlock = cypress.slice(testStart, testEnd)

    expect(fleet).toContain('data-testid="react-sailing-edit-form"')
    expect(fleet).toContain('data-testid="react-edit-sailing-departure-date"')
    expect(fleet).toContain('openSailingEdit')
    expect(testBlock).toContain('cy.getByTestId(rs.sailingEditForm).should(\'be.visible\')')
    expect(testBlock.match(/cy\.stub\(win, 'prompt'\)/g) || []).toHaveLength(0)
    expect(testBlock).toContain('cy.getByTestId(rs.fleetDeleteConfirmationConfirm)')
    expect(testBlock.match(/cy\.stub\(win, 'confirm'\)/g) || []).toHaveLength(0)
  })


  it('keeps React itinerary day and activity CRUD coverage wired through browser coverage', () => {
    const fleet = readFleetDirectorySurface()
    const client = read('frontend/react/src/api/client.js')
    const cypress = read('cypress/react/reactApp.cy.js')
    const mobile = read('playwright/mobile/react-production-mobile.spec.js')
    const responsive = read('playwright/responsive/react-production-responsive.spec.js')
    const styles = readCssBundle('frontend/react/src/styles/components/workflow.css')

    expect(client).toContain('export async function createItineraryDay')
    expect(client).toContain('export async function updateItineraryDay')
    expect(client).toContain('export async function deleteItineraryDay')
    expect(client).toContain('export async function createItineraryActivity')
    expect(client).toContain('export async function updateItineraryActivity')
    expect(client).toContain('export async function deleteItineraryActivity')
    expect(fleet).toContain('handleCreateItineraryDay')
    expect(fleet).toContain('handleUpdateItineraryDay')
    expect(fleet).toContain('requestDeleteItineraryDay')
    expect(fleet).toContain('executeDeleteItineraryDay')
    expect(fleet).toContain('handleCreateItineraryActivity')
    expect(fleet).toContain('handleUpdateItineraryActivity')
    expect(fleet).toContain('requestDeleteItineraryActivity')
    expect(fleet).toContain('executeDeleteItineraryActivity')
    expect(fleet).toContain('data-testid="react-create-itinerary-day-form"')
    expect(fleet).toContain('data-testid="react-create-itinerary-activity-form"')
    expect(fleet).toContain('data-testid="react-update-itinerary-day-button"')
    expect(fleet).toContain('data-testid="react-delete-itinerary-activity-button"')
    expect(cypress).toContain('createReactItineraryDay')
    expect(cypress).toContain('updateReactItineraryActivity')
    expect(mobile).toContain('keeps React itinerary CRUD controls reachable on mobile')
    expect(responsive).toContain('keeps React itinerary CRUD controls readable at desktop width')
    expect(styles).toContain('React itinerary day and activity CRUD coverage')
  })


  it('keeps React itinerary activity delete test scoped to the matching itinerary day', () => {
    const cypress = read('cypress/react/reactApp.cy.js')
    const testStart = cypress.indexOf("manages React ship CRUD and sailing lookup from the selected fleet panel")
    const testEnd = cypress.indexOf("runs a React quality health check and writes output", testStart)
    const testBlock = cypress.slice(testStart, testEnd)

    expect(testBlock).toContain('find(byTestId(rs.deleteItineraryActivityButton))')
    expect(testBlock).toContain("React Dinner Show was deleted")
    expect(testBlock).toContain("cy.getByTestId(rs.itineraryDayGrid).should('not.contain.text', 'React Dinner Show')")
    expect(testBlock).not.toContain("cy.getByTestId('react-delete-itinerary-activity-button').last().click()")
  })


  it('keeps cruise-line brand metadata professional, specific, and database seeded for every fleet card', () => {
    const seedData = read('data/cruise.json')
    const fleet = readFleetDirectorySurface()
    const createWorkflow = read('frontend/react/src/components/ReactCruiseLineCreateWorkflow.jsx')
    const styles = readCssBundle('frontend/react/src/styles/components/application.css')

    expect(seedData).toContain('\"brandFamily\": \"Royal Caribbean Group\"')
    expect(seedData).toContain('\"brandTheme\": \"Adventure Innovation\"')
    expect(seedData).toContain('private-destination')
    expect(seedData).toContain('\"brandFamily\": \"MSC Group\"')
    expect(seedData).toContain('\"brandTheme\": \"Mediterranean Resort\"')
    expect(seedData).toContain('\"brandFamily\": \"Margaritaville at Sea\"')
    expect(seedData).toContain('\"brandTheme\": \"Casual Island Getaway\"')
    expect(seedData).not.toContain('Cruise Fleet Operations Platform Default')
    expect(fleet).toContain('Brand family')
    expect(fleet).toContain('Positioning')
    expect(fleet).toContain('cruiseLine.brandFamily')
    expect(fleet).not.toContain('getCruiseLineBranding')
    expect(createWorkflow).toContain('brandFamily')
    expect(createWorkflow).toContain('marketPositioning')
    expect(styles).toContain('.brand-theme-summary dt')
  })

  it('keeps operational directory cards available for cross-department coordination without large unbounded rendering', () => {
    const roleDashboard = readRoleDashboardSurface(), operationalReadiness = read('frontend/react/src/components/operations/operationalDashboardReadiness.js')
    const selectors = read('cypress/react/support/reactSelectors.js')
    const styles = [
      optionalStyleRead(RETIRED_APP_CSS_PATH),
      readCssBundle('frontend/react/src/styles/components/operations-workspaces.css'),
      readCssBundle('frontend/react/src/styles/components/operations-queues.css'),
      readCssBundle('frontend/react/src/styles/components/operations-coverage.css'),
      readCssBundle('frontend/react/src/styles/components/readiness-centers.css'),
      readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css'),
    ].join('\n')

    expect(operationalReadiness).toContain('export function buildOperationalDirectory')
    expect(roleDashboard).toContain('visibleReadinessOperations.map')
    expect(roleDashboard).toContain('data-testid="react-turnaround-selector-panel"')
    expect(roleDashboard).toContain('data-testid="react-turnaround-selector"')
    expect(roleDashboard).toContain('data-testid="react-operations-workspace-shell"')
    expect(roleDashboard).toContain('data-testid="react-operations-workspace-nav"')
    expect(roleDashboard).toContain('data-testid="react-operations-role-brief-panel"')
    expect(operationalReadiness).toContain('export function buildRoleOperationsBrief')
    expect(roleDashboard).toContain('operationsWorkspaceTabs')
    expect(roleDashboard).toContain('data-testid="react-operations-task-workspace"')
    expect(roleDashboard).toContain('data-testid="react-operations-task-list"')
    expect(roleDashboard).toContain('data-testid="react-operations-task-detail-panel"')
    expect(roleDashboard).toContain('data-testid="react-operations-dependency-workspace"')
    expect(roleDashboard).toContain('data-testid="react-operations-dependency-list"')
    expect(roleDashboard).toContain('data-testid="react-operations-dependency-detail-panel"')
    expect(roleDashboard).toContain('data-testid="react-operations-handoff-workspace"')
    expect(roleDashboard).toContain('data-testid="react-operations-handoff-list"')
    expect(roleDashboard).toContain('data-testid="react-operations-handoff-detail-panel"')
    expect(roleDashboard).toContain('data-testid="react-operations-escalation-workspace"')
    expect(roleDashboard).toContain('data-testid="react-operations-escalation-list"')
    expect(roleDashboard).toContain('data-testid="react-operations-escalation-detail-panel"')
    expect(roleDashboard).toContain('data-testid="react-operations-staffing-workspace"')
    expect(roleDashboard).toContain('data-testid="react-operations-staffing-list"')
    expect(roleDashboard).toContain('data-testid="react-operations-staffing-detail-panel"')
    expect(roleDashboard).toContain('data-testid="react-operations-readiness-workspace"')
    expect(roleDashboard).toContain('data-testid="react-operations-readiness-list"')
    expect(roleDashboard).toContain('data-testid="react-operations-readiness-detail-panel"')
    expect(roleDashboard).toContain('selectedTaskId')
    expect(roleDashboard).toContain('selectedDependencyId')
    expect(roleDashboard).toContain('selectedHandoffId')
    expect(roleDashboard).toContain('selectedEscalationId')
    expect(roleDashboard).toContain('selectedStaffingRole')
    expect(roleDashboard).toContain('selectedReadinessRole')
    expect(roleDashboard).toContain('taskWorkspaceSummary')
    expect(roleDashboard).toContain('handoffWorkspaceSummary')
    expect(roleDashboard).toContain('escalationWorkspaceSummary')
    expect(roleDashboard).toContain('staffingWorkspaceSummary')
    expect(roleDashboard).toContain('readinessWorkspaceSummary')
    expect(roleDashboard).toContain('data-testid="react-operations-directory-panel"')
    expect(roleDashboard).toContain('data-testid="react-operations-directory-card"')
    expect(roleDashboard).toContain('data-testid="react-operations-directory-detail"')
    expect(operationalReadiness).toContain('export function getOperationReleaseMetrics')
    expect(roleDashboard).toContain('data-testid="react-turnaround-fleet-board"')
    expect(roleDashboard).toContain('data-testid="react-turnaround-fleet-card"')
    expect(roleDashboard).toContain('fleetAverageReadiness')
    expect(roleDashboard).toContain('data-testid="react-operations-release-board"')
    expect(roleDashboard).toContain('data-testid="react-operations-release-score"')
    expect(roleDashboard).toContain('data-testid="react-operations-release-card"')
    expect(roleDashboard).toContain('activeEscalations')
    expect(roleDashboard).toContain('blockedHandoffs')
    expect(roleDashboard).toContain('staffingPercent')
    expect(selectors).toContain("operationsWorkspaceShell: 'react-operations-workspace-shell'")
    expect(selectors).toContain("operationsWorkspaceNav: 'react-operations-workspace-nav'")
    expect(selectors).toContain("operationsRoleBriefPanel: 'react-operations-role-brief-panel'")
    expect(selectors).toContain("operationsRoleBriefCard: 'react-operations-role-brief-card'")
    expect(selectors).toContain("operationsTaskWorkspace: 'react-operations-task-workspace'")
    expect(selectors).toContain("operationsTaskDetailPanel: 'react-operations-task-detail-panel'")
    expect(selectors).toContain("operationsDependencyWorkspace: 'react-operations-dependency-workspace'")
    expect(selectors).toContain("operationsDependencyDetailPanel: 'react-operations-dependency-detail-panel'")
    expect(selectors).toContain("operationsHandoffWorkspace: 'react-operations-handoff-workspace'")
    expect(selectors).toContain("operationsHandoffDetailPanel: 'react-operations-handoff-detail-panel'")
    expect(selectors).toContain("operationsEscalationWorkspace: 'react-operations-escalation-workspace'")
    expect(selectors).toContain("operationsEscalationDetailPanel: 'react-operations-escalation-detail-panel'")
    expect(selectors).toContain("operationsStaffingWorkspace: 'react-operations-staffing-workspace'")
    expect(selectors).toContain("operationsStaffingDetailPanel: 'react-operations-staffing-detail-panel'")
    expect(selectors).toContain("operationsReadinessWorkspace: 'react-operations-readiness-workspace'")
    expect(selectors).toContain("operationsReadinessDetailPanel: 'react-operations-readiness-detail-panel'")
    expect(selectors).toContain("operationsDirectoryPanel: 'react-operations-directory-panel'")
    expect(selectors).toContain("operationsDirectoryCard: 'react-operations-directory-card'")
    expect(selectors).toContain("operationsDirectoryDetail: 'react-operations-directory-detail'")
    expect(selectors).toContain("turnaroundFleetBoard: 'react-turnaround-fleet-board'")
    expect(selectors).toContain("turnaroundFleetCard: 'react-turnaround-fleet-card'")
    expect(selectors).toContain("operationsReleaseBoard: 'react-operations-release-board'")
    expect(selectors).toContain("operationsReleaseScore: 'react-operations-release-score'")
    expect(selectors).toContain("operationsReleaseCard: 'react-operations-release-card'")
    expect(selectors).toContain("turnaroundSelector: 'react-turnaround-selector'")
    expect(roleDashboard).toContain('Department Handoffs')
    expect(styles).toContain('Turnaround fleet control')
    expect(styles).toContain('Role command brief')
    expect(styles).toContain('Handoff management workspace')
    expect(roleDashboard).toContain('Escalation Management')
    expect(styles).toContain('Escalation management workspace')
    expect(roleDashboard).toContain('Staffing Coverage')
    expect(styles).toContain('Staffing coverage workspace')
    expect(roleDashboard).toContain('Readiness Approvals')
    expect(styles).toContain('Readiness approvals workspace')
  })



  it('keeps turnaround person selector focused on choosing a scoped operational person', () => {
    const roleSelector = readRoleSelectorSurface()
    const selectors = read('cypress/react/support/reactSelectors.js')
    const cypressSpec = read('cypress/react/reactRolePersonSelector.cy.js')

    expect(roleSelector).toContain('Turnaround person finder')
    expect(roleSelector).toContain('Choose the person whose workspace you want to review')
    expect(roleSelector).toContain('data-testid="react-operational-selector-summary"')
    expect(roleSelector).toContain('data-testid="react-person-finder-result-card"')
    expect(roleSelector).not.toContain('data-testid="react-operational-assignment-audit-panel"')
    expect(roleSelector).not.toContain('data-testid="react-operational-deployment-matrix-panel"')
    expect(selectors).toContain("operationalSelectorSummary: 'react-operational-selector-summary'")
    expect(cypressSpec).toContain("cy.getByTestId(rs.operationalSelectorSummary).should('contain.text', '20 people')")
    expect(cypressSpec).toContain("cy.getByTestId(rs.personFinderResults).should('not.contain.text', 'Carnival Celebration')")
  })



  it('keeps Playwright app-bridge role selection using display names from seeded demo users', () => {
    const bridge = read('frontend/react/src/hooks/useDemoSelectionBridge.js')
    const helper = read('playwright/support/reactProductionHelpers.js')

    expect(bridge).toContain('name: user.displayName || user.name ||')
    expect(bridge).toContain('const userSearchText = [user.displayName, user.name, user.email]')
    expect(helper).toContain("passenger: 'Ryan Parker Passenger View'")
    expect(helper).toContain('[user.displayName, user.name].filter(Boolean).join')
  })

  it('keeps passenger booking detail expansion resilient when compact booking payloads omit itinerary rows', () => {
    const roleBookingCard = read('frontend/react/src/components/passenger/RoleBookingCard.jsx')
    const mobileSpec = read('playwright/mobile/react-production-mobile.spec.js')

    expect(roleBookingCard).toContain('getBookingDetails, getItineraryForSailing')
    expect(roleBookingCard).toContain('const nextItineraryDays = getBookingItineraryDays(nextBooking)')
    expect(roleBookingCard).toContain('const itineraryDays = await getItineraryForSailing(nextSailingId)')
    expect(roleBookingCard).toContain('itineraryDays')
    expect(mobileSpec).toContain('openedItineraryBooking')
    expect(mobileSpec).toContain('waitForPassengerBookingDetailToggles(page')
    expect(mobileSpec).toContain('clickStableControl(toggle')
    expect(mobileSpec).toContain('openFleetSailingsBySearch')
    expect(mobileSpec).toContain("page.getByTestId('react-role-itinerary-day').first()")
  })

  it('keeps passenger booking cascading filters and ship-aware fares guardrailed', () => {
    const workflowComponent = read('frontend/react/src/components/PassengerCruiseBookingWorkflow.jsx')
    const workflowState = read('frontend/react/src/components/usePassengerBookingWorkflowState.js')
    const workflowDomain = read('frontend/react/src/domain/passengerBookingWorkflow.js')
    const cypressSpec = read('cypress/react/reactPassengerBookingHardening.cy.js')
    expect(workflowComponent).toContain("from '../domain/passengerBookingWorkflow.js'")
    expect(workflowComponent).toContain("from './usePassengerBookingWorkflowState.js'")
    expect(workflowDomain).toContain('export function buildFareOptionsForShip')
    expect(workflowState).toContain('const filteredShipOptions = useMemo')
    expect(workflowState).toContain('const selectedFareCode = availableFareOptions.some')
    expect(workflowState).toContain('const nextShips = Array.isArray(ships) ? ships.slice().sort(sortByLabel) : []')
    expect(workflowState).toContain('const nextSailings = Array.isArray(sailings) ? sailings.slice().sort(sortByDepartureDate) : []')
    expect(workflowState).toContain('fareCode: selectedFareCode')
    expect(cypressSpec).toContain('cascades booking cruise line, ship, sailing, search filters, and ship-aware fare choices')
    expect(cypressSpec).toContain("expect(optionText).to.deep.eq(['Select ship', 'React Icon', 'React Utopia'])")
    expect(cypressSpec).toContain("expect(optionText).to.deep.eq(['Balcony'])")
  })

})


describe('turnaround command center React contract', () => {
  const projectRoot = path.resolve(__dirname, '../..')

  it('keeps the turnaround command center wired from API assembly to role dashboard render', () => {
    const controller = ['turnaroundOperationDetails', 'turnaroundOperationalArtifacts'].map(name => fs.readFileSync(path.join(projectRoot, `services/${name}.service.js`), 'utf8')).join('\n')
    const roleView = readRoleViewSurface()
    const dashboard = [
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactRoleDashboard.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationsStaffingReadinessWorkspaces.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationsEvidencePanels.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationsReadinessEvidencePanels.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/operationalDashboardUtils.js'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/useOperationalDashboardDrafts.js'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/operationalDashboardDrafts.js'), 'utf8')
    ].join('\n')

    expect(controller).toContain("buildTurnaroundCommandCenter")
    expect(controller).toContain("buildTurnaroundContinuityCenter")
    expect(controller).toContain("commandCenter,")
    expect(controller).toContain("continuityCenter,")
    expect(roleView).toContain("export function getCommandCenterFallback")
    expect(roleView).toContain("commandCenter: getCommandCenterFallback(operation, tasks, taskSummary)")
    expect(roleView).toContain("export function getContinuityCenterFallback")
    expect(roleView).toContain("continuityCenter: getContinuityCenterFallback(operation, tasks, taskSummary)")
    expect(dashboard).toContain('data-testid="react-operations-command-center"')
    expect(dashboard).toContain('data-testid="react-operations-command-center-decisions"')
    expect(dashboard).toContain('data-testid="react-operations-command-center-critical-path"')
    expect(dashboard).toContain('data-testid="react-operations-command-center-departments"')
    expect(dashboard).toContain('data-testid="react-operations-continuity-center"')
    expect(dashboard).toContain('data-testid="react-operations-continuity-scenarios"')
    expect(dashboard).toContain('data-testid="react-operations-continuity-runbook"')
    expect(dashboard).toContain('data-testid="react-operations-continuity-departments"')
    expect(dashboard).toContain('data-testid="react-operations-continuity-watchlist"')
  })
})


describe('Passenger booking summary spacing contract', () => {
  test('keeps booking field labels and values away from bordered tile edges', () => {
    const roleSwitchingCss = readProjectFile('frontend/react/src/styles/components/application-role-switching.css')

    expect(roleSwitchingCss).toContain('.role-booking-fields > .role-booking-field {')
    expect(roleSwitchingCss).toContain('padding: 0.75rem 0.9rem 0.8rem;')
    expect(roleSwitchingCss).toContain('.role-booking-fields > .role-booking-field dt,')
    expect(roleSwitchingCss).toContain('overflow-wrap: anywhere;')
  })

  it('keeps operational KPI tiles dark-on-light inside dark command surfaces', () => {
    const overview = readProjectFile('frontend/react/src/components/operations/OperationalOverviewBoards.jsx')
    const workspaceCss = readProjectFile('frontend/react/src/styles/components/operations-role-surface-workspaces.css')

    expect((overview.match(/className="ce-surface-light"/g) || []).length).toBeGreaterThanOrEqual(11)
    expect(workspaceCss).toContain('Final operational light-tile contrast contract.')
    expect(workspaceCss).toContain('.turnaround-fleet-card dl')
    expect(workspaceCss).toContain('-webkit-text-fill-color: #0f172a !important;')
    expect(workspaceCss).toContain('-webkit-text-fill-color: #075985 !important;')
  })

  it('keeps operational score tiles and the scenario runbook on explicit readable surfaces', () => {
    const releasePacket = readProjectFile('frontend/react/src/components/operations/OperationsReleasePacketPanel.jsx')
    const playbook = readProjectFile('frontend/react/src/components/operations/OperationsPlaybookPanels.jsx')
    const incidentOutreach = readProjectFile('frontend/react/src/components/operations/OperationsIncidentBriefingScenarioPanels.jsx')
    const contrastContract = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect(releasePacket).toContain('operations-release-packet-score ce-surface-light')
    expect(playbook).toContain('operations-playbook-score ce-surface-light')
    expect(playbook).toContain('operations-playbook-variance-score ce-surface-light')
    expect(incidentOutreach).toContain('operations-incident-command-score ce-surface-light')
    expect(incidentOutreach).toContain('operations-operational-briefing-board-score ce-surface-light')
    expect(incidentOutreach).toContain('operations-scenario-plan-score ce-surface-light')
    expect(incidentOutreach).toContain('operations-scenario-plan-runbook ce-surface-dark')
    expect(contrastContract).toContain('Operational score tiles are light status surfaces')
    expect(contrastContract).toContain('.operations-scenario-plan-runbook.ce-surface-dark')
  })

  it('keeps analytics and scenario score panels dark-on-light like peer score cards', () => {
    const metrics = readProjectFile('frontend/react/src/components/operations/OperationsMetricsPanel.jsx')
    const scenario = readProjectFile('frontend/react/src/components/operations/OperationsIncidentBriefingScenarioPanels.jsx')
    const contrastContract = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect(metrics).toContain('operations-metrics-confidence ce-surface-light')
    expect(scenario).toContain('operations-scenario-plan-score ce-surface-light')
    expect(contrastContract).toContain('Operational analytics and scenario summary scores use the same light-card')
    expect(contrastContract).toContain('.operations-metrics-confidence.ce-surface-light')
    expect(contrastContract).toContain('background: #f8fbff !important;')
    expect(contrastContract).toContain('-webkit-text-fill-color: #0f172a !important;')
  })

  it('keeps lifecycle phase text readable on both light and dark phase surfaces', () => {
    const lifecycle = readProjectFile('frontend/react/src/components/operations/OperationsLifecyclePanel.jsx')
    const workspaceCss = readProjectFile('frontend/react/src/styles/components/operations-role-surface-workspaces.css')

    expect(lifecycle).toContain("? 'ce-surface-light' : 'ce-surface-dark'")
    expect(workspaceCss).toContain('.operations-lifecycle-phase.ce-surface-light')
    expect(workspaceCss).toContain('-webkit-text-fill-color: #0f172a !important;')
    expect(workspaceCss).toContain('.operations-lifecycle-phase.ce-surface-dark')
    expect(workspaceCss).toContain('-webkit-text-fill-color: #ffffff !important;')
  })

  it('keeps operations percentage score cards wide enough for three-digit values', () => {
    const incident = readProjectFile('frontend/react/src/components/operations/OperationsIncidentBriefingScenarioPanels.jsx')
    const contrastContract = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect(incident).toContain('{incidentCommand.incidentScore || 0}%')
    expect(contrastContract).toContain('Shared operations score-card sizing contract.')
    expect(contrastContract).toContain('min-inline-size: 8.75rem !important;')
    expect(contrastContract).toContain('flex: 0 0 8.75rem !important;')
    expect(contrastContract).toContain('white-space: nowrap !important;')
  })

  it('keeps operations score-card typography consistent across command and scenario panels', () => {
    const contrastContract = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect(contrastContract).toContain('Shared operations score-card typography contract.')
    expect(contrastContract).toContain('font-size: 2rem !important;')
    expect(contrastContract).toContain('font-weight: 900 !important;')
    expect(contrastContract).toContain('font-size: 0.72rem !important;')
    expect(contrastContract).toContain('letter-spacing: 0.08em !important;')
    expect(contrastContract).toContain('text-transform: uppercase !important;')
    expect(contrastContract).toContain('.operations-command-center-score,')
    expect(contrastContract).toContain('.operations-scenario-plan-score,')
  })

  it('keeps all turnaround percentage summaries on the shared light score-card surface', () => {
    const overview = readProjectFile('frontend/react/src/components/operations/OperationalOverviewBoards.jsx')
    const lifecycle = readProjectFile('frontend/react/src/components/operations/OperationsLifecyclePanel.jsx')
    const commandContinuity = readProjectFile('frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx')
    const launchCloseout = readProjectFile('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx')
    const contrastContract = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect(overview).toContain('operations-release-score ce-surface-light')
    expect(lifecycle).toContain('operations-lifecycle-score ce-surface-light')
    expect(commandContinuity).toContain('operations-command-center-score ce-surface-light')
    expect(commandContinuity).toContain('operations-control-board-score ce-surface-light')
    expect(commandContinuity).toContain('operations-continuity-center-score ce-surface-light')
    expect(launchCloseout).toContain('operations-shift-briefing-score ce-surface-light')
    expect(launchCloseout).toContain('operations-go-live-score ce-surface-light')
    expect(launchCloseout).toContain('operations-closeout-packet-score ce-surface-light')
    expect(contrastContract).toContain('Turnaround percentage/status summaries share one light score-card treatment.')
    expect(contrastContract).toContain('.operations-command-center-score.ce-surface-light')
    expect(contrastContract).toContain('.operations-closeout-packet-score.ce-surface-light')
  })

})



describe('Public application audience contract', () => {
  test('does not mount personal career, interview, role-targeting, or job-search release content', () => {
    const app = readProjectFile('frontend/react/src/App.jsx')

    expect(app).not.toContain("import PortfolioCareerEvidence from './components/PortfolioCareerEvidence.jsx'")
    expect(app).not.toContain("import PortfolioInterviewCaseStudies from './components/PortfolioInterviewCaseStudies.jsx'")
    expect(app).not.toContain("import PortfolioRoleAlignment from './components/PortfolioRoleAlignment.jsx'")
    expect(app).not.toContain("import PortfolioReleaseCenter from './components/PortfolioReleaseCenter.jsx'")
    expect(app).not.toContain('<PortfolioCareerEvidence')
    expect(app).not.toContain('<PortfolioInterviewCaseStudies')
    expect(app).not.toContain('<PortfolioRoleAlignment')
    expect(app).not.toContain('<PortfolioReleaseCenter')
  })
})
