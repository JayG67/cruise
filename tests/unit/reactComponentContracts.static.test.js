const fs = require('fs')
const path = require('path')

describe('React component accessibility and presentation contracts', () => {
  const projectRoot = path.resolve(__dirname, '../..')

  function read(relativePath) {
    return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
  }

  it('links customer expansion controls to the controlled booking panel', () => {
    const customerRow = read('frontend/react/src/components/CustomerHierarchyRow.jsx')

    expect(customerRow).toContain('const bookingsRowId = `react-customer-bookings-${customer.id}`')
    expect(customerRow).toContain('aria-expanded={isExpanded}')
    expect(customerRow).toContain('aria-controls={bookingsRowId}')
    expect(customerRow).toContain('id={bookingsRowId}')
    expect(customerRow).toContain('data-testid="react-customer-bookings-row"')
  })

  it('links booking detail controls to the controlled detail panel without losing duplicate-safe keys', () => {
    const customerRow = read('frontend/react/src/components/CustomerHierarchyRow.jsx')
    const bookingCard = read('frontend/react/src/components/BookingCard.jsx')

    expect(customerRow).toContain('createBookingExpansionKey(customer.id, booking.id)')
    expect(bookingCard).toContain('const detailsId = `react-booking-details-${bookingRowKey}`')
    expect(bookingCard).toContain('aria-expanded={bookingExpanded}')
    expect(bookingCard).toContain('aria-controls={detailsId}')
    expect(bookingCard).toContain('id={detailsId}')
  })

  it('keeps extracted booking cards independently understandable to assistive technology', () => {
    const bookingCard = read('frontend/react/src/components/BookingCard.jsx')

    expect(bookingCard).toContain('const passengerSummary = passengerNames.join')
    expect(bookingCard).toContain('aria-label={`Booking ${booking.id} for ${passengerSummary}`}')
    expect(bookingCard).toContain('aria-label={`Details for booking ${booking.id}`}')
    expect(bookingCard).toContain('data-testid="react-booking-card"')
  })

  it('scopes operational turnaround workspaces to the selected person before rendering the dashboard', () => {
    const app = read('frontend/react/src/App.jsx')
    const roleViewDomain = read('frontend/react/src/domain/roleView.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')

    expect(roleViewDomain).toContain('export function getVisibleTurnaroundOperations')
    expect(roleViewDomain).toContain('getWorkspaceUserBaseName')
    expect(roleViewDomain).toContain('getWorkspaceUserAssignedShip')
    expect(roleViewDomain).toContain('normalizeOperationalDemoUsers')
    expect(roleViewDomain).toContain('if (!assignedShip && !assignedCruiseLine) return []')
    expect(roleViewDomain).toContain('operationMatchesAssignedCruiseLine')
    expect(roleViewDomain).toContain('operationHasRoleUserAssignment')
    expect(app).toContain('getVisibleTurnaroundOperations(effectiveSelectedDemoUser, turnaroundOperations)')
    expect(app).toContain('turnaroundOperations={visibleTurnaroundOperations}')
    expect(dashboard).toContain('buildTurnaroundOperationCards(turnaroundOperations, roleView)')
  })

  it('keeps operational person selection on one assigned workspace per person and role', () => {
    const selector = read('frontend/react/src/components/ReactRoleSelector.jsx')
    const demoHook = read('frontend/react/src/hooks/useDemoUsers.js')
    const roleViewDomain = read('frontend/react/src/domain/roleView.js')

    expect(demoHook).toContain('normalizeOperationalDemoUsers(await getDemoUsers')
    expect(roleViewDomain).toContain("const assignmentKey = `${roleView}:${baseName}:${assignedCruiseLine}:${assignedShip}:${user.id || ''}`")
    expect(selector).toContain("getOperationalAssignmentShipName(user)")
    expect(selector).toContain("roleView === 'turnaround-manager'")
    expect(selector).toContain('getOperationalAssignmentContext(user)')
    expect(selector).toContain('operationalCruiseLineFilter')
    expect(selector).toContain('operationalShipFilter')
  })


  it('renders the turnaround lifecycle state as the primary command story', () => {
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = read('frontend/react/src/styles/app.css')
    const controller = read('controllers/cruise.controller.js')

    const roleViewDomain = read('frontend/react/src/domain/roleView.js')

    expect(controller).toContain('buildTurnaroundLifecycleState')
    expect(controller).toContain('lifecycleState')
    expect(roleViewDomain).toContain('lifecycleState: operation.lifecycleState || null')
    expect(dashboard).toContain('data-testid="react-operations-lifecycle-state"')
    expect(dashboard).toContain('data-testid="react-operations-lifecycle-phases"')
    expect(dashboard).toContain('data-testid="react-operations-lifecycle-blockers"')
    expect(dashboard).toContain('data-testid="react-operations-lifecycle-next-action"')
    expect(styles).toContain('.operations-lifecycle')
  })

  it('renders an employer demo command center above the workspace stack', () => {
    const app = read('frontend/react/src/App.jsx')
    const commandCenter = read('frontend/react/src/components/EmployerDemoCommandCenter.jsx')
    const styles = read('frontend/react/src/styles/app.css')

    expect(app).toContain("import EmployerDemoCommandCenter from './components/EmployerDemoCommandCenter.jsx'")
    expect(app).toContain('<EmployerDemoCommandCenter')
    expect(app.indexOf('<EmployerDemoCommandCenter')).toBeLessThan(app.indexOf('id="react-workspaces"'))
    expect(app).toContain('data-testid="react-hero-demo-button"')
    expect(app).toContain('data-testid="react-hero-demo-button"')
    expect(app).not.toContain('data-testid="react-workspace-demo-button"')
    expect(app).not.toContain('data-testid="react-workflow-demo-button"')
    expect(commandCenter).toContain('data-testid="react-employer-demo-command-center"')
    expect(commandCenter).toContain('data-testid="react-employer-demo-proof-grid"')
    expect(commandCenter).toContain('data-testid="react-employer-demo-runway"')
    expect(commandCenter).toContain('Operations dashboard')
    expect(commandCenter).not.toContain('What to say while presenting')
    expect(commandCenter).toContain('buildDemoProofPoints')
    expect(commandCenter).toContain('buildRunOfShow')
    expect(styles).toContain('.employer-demo-command-center')
  })

  it('renders a five-minute turnaround presentation guide from the same operational state', () => {
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = read('frontend/react/src/styles/app.css')
    const controller = read('controllers/cruise.controller.js')
    const roleViewDomain = read('frontend/react/src/domain/roleView.js')

    expect(controller).toContain('buildTurnaroundPresentationGuide')
    expect(controller).toContain('presentationGuide,')
    expect(roleViewDomain).toContain('presentationGuide: operation.presentationGuide || null')
    expect(dashboard).toContain('data-testid="react-operations-presentation-guide"')
    expect(dashboard).toContain('data-testid="react-operations-presentation-storyline"')
    expect(dashboard).toContain('data-testid="react-operations-presentation-focus"')
    expect(dashboard).toContain('data-testid="react-operations-presentation-risks"')
    expect(dashboard).toContain('data-testid="react-operations-presentation-freeze"')
    expect(styles).toContain('.operations-presentation-guide')
  })


})


describe('React route preview accessibility contracts', () => {
  const projectRoot = path.resolve(__dirname, '../..')

  function read(relativePath) {
    return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
  }

  it('keeps React workspace controls accessible and discoverable', () => {
    const app = read('frontend/react/src/App.jsx')

    expect(app).toContain('aria-label="React application workspaces"')
    expect(app).not.toContain('data-testid="react-workspace-demo-button"')
    expect(app).toContain('data-testid="react-workspace-role-button"')
    expect(app).toContain('data-testid="react-workspace-operations-button"')
    expect(app).toContain('data-testid="react-workspace-fleet-button"')
    expect(app).toContain('data-testid="react-workspace-quality-button"')
    expect(app).not.toContain('data-testid="react-release-readiness-section"')
    expect(app).not.toContain(['React', 'RouteNav'].join(''))
    expect(app).toContain('aria-label="Customer-centered operations"')
  })

  it('keeps the self-guided overview concise and separate from workspace cards', () => {
    const app = read('frontend/react/src/App.jsx')
    const overview = read('frontend/react/src/components/EmployerDemoCommandCenter.jsx')
    const hierarchy = read('frontend/react/src/components/CustomerBookingHierarchy.jsx')

    expect(app).not.toContain('aria-label="Recommended workflow controls"')
    expect(app).not.toContain('type="button" className="workflow-step-button"')
    expect(app).not.toContain('data-testid="react-workspace-demo-button"')
    expect(overview).toContain('self-guided-tour-list')
    expect(overview).toContain('Cruise operations at a glance')
    expect(overview).not.toContain('What to say while presenting')
    expect(hierarchy).toContain('aria-expanded={workflowsVisible}')
    expect(hierarchy).toContain('aria-controls="react-customer-workflow-table"')
  })


  it('keeps React admin workspace table semantics aligned with the operations workflow table', () => {
    const hierarchy = read('frontend/react/src/components/CustomerBookingHierarchy.jsx')
    const row = read('frontend/react/src/components/CustomerHierarchyRow.jsx')

    expect(hierarchy).toContain('aria-labelledby="react-admin-workspace-heading"')
    expect(hierarchy).toContain('aria-label="Admin workspace record counts"')
    expect(hierarchy).toContain('caption>Admin-visible customers')
    expect(row).toContain('aria-expanded={isExpanded}')
    expect(row).toContain('aria-controls={bookingsRowId}')
    expect(row).toContain('td colSpan="6"')
  })


  it('keeps admin customer records sorted and displayed by last name first', () => {
    const hierarchy = read('frontend/react/src/components/CustomerBookingHierarchy.jsx')
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
    expect(app.indexOf('<ReactCruiseLineCreateWorkflow')).toBeLessThan(app.indexOf('<ReactSqaConsole'))
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
    const sqa = read('frontend/react/src/components/ReactSqaConsole.jsx')

    expect(sqa).toContain('aria-labelledby="react-sqa-heading"')
    expect(sqa).toContain('aria-label="Quality validation actions"')
    expect(sqa).toContain('aria-label="Quality report links"')
    expect(sqa).toContain('role="status"')
    expect(sqa).toContain('aria-live="polite"')
    expect(sqa).toContain("testId: 'react-sqa-health-button'")
    expect(sqa).toContain('data-testid={action.testId}')
    expect(sqa).toContain("testId: 'react-sqa-ui-smoke-button'")
    expect(sqa).toContain('data-testid="react-sqa-reset-demo-data-button"')
    expect(sqa).toContain('import ConfirmActionPanel')
    expect(sqa).toContain('resetConfirmationVisible')
    expect(sqa).toContain('testId="react-sqa-reset-confirmation"')
    expect(sqa).not.toContain('window.confirm')
  })


  it('keeps React quality reset recovery guarded by a React confirmation panel', () => {
    const cypress = read('cypress/react/reactApp.cy.js')
    const selectors = read('cypress/react/support/reactSelectors.js')
    const sqa = read('frontend/react/src/components/ReactSqaConsole.jsx')

    expect(sqa).toContain('requestResetDemoData')
    expect(sqa).toContain('cancelResetDemoData')
    expect(sqa).toContain('testId="react-sqa-reset-confirmation"')
    expect(cypress).toContain('resets React baseline data through a native React confirmation panel')
    expect(selectors).toContain("sqaResetConfirmationCancel: 'react-sqa-reset-confirmation-cancel'")
    expect(selectors).toContain("sqaResetConfirmationConfirm: 'react-sqa-reset-confirmation-confirm'")
    expect(cypress).toContain('cy.getByTestId(rs.sqaResetConfirmationCancel)')
    expect(cypress).toContain('cy.getByTestId(rs.sqaResetConfirmationConfirm)')
    expect(cypress).not.toContain("cy.stub(win, 'confirm')")
  })


  it('keeps React passenger self-service profile saves wired to the passenger-profile API', () => {
    const client = read('frontend/react/src/api/client.js')
    const hook = read('frontend/react/src/hooks/useCustomerProfileMutation.js')
    const roleDashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
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
    const selectors = read('cypress/react/support/reactSelectors.js')
    const cypress = read('cypress/react/reactPassengerSelfService.cy.js')

    expect(bookingWorkflow).toContain('data-testid="react-booking-guest-finder"')
    expect(bookingWorkflow).toContain('data-testid="react-booking-guest-search-input"')
    expect(bookingWorkflow).toContain('data-testid="react-booking-guest-result-card"')
    expect(bookingWorkflow).not.toContain('data-testid="react-booking-existing-customer-select"')
    expect(selectors).toContain("bookingGuestResultCard: 'react-booking-guest-result-card'")
    expect(cypress).toContain('searchable cards instead of a giant dropdown')
  })

  it('keeps React person selector on searchable cards instead of a giant dropdown', () => {
    const selector = read('frontend/react/src/components/ReactRoleSelector.jsx')
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
    expect(selector).toContain('formatDemoUserLabel(user, bookings)')
    expect(hook).toContain('getDemoUsers')
    expect(hook).toContain('selectedDemoUser')
  })


  it('formats React demo user options with display names and readable roles', () => {
    const selector = read('frontend/react/src/components/ReactRoleSelector.jsx')

    expect(selector).toContain('user.displayName')
    expect(selector).toContain('formatDemoUserRole')
    expect(selector).toContain("split('_')")
    expect(selector).toContain('<option key={user.id} value={user.id}>{formatDemoUserLabel(user, bookings)}</option>')
  })


  it('keeps React passenger and group dashboards accessible after role switching', () => {
    const roleDashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
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
    const roleDashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const roleView = read('frontend/react/src/domain/roleView.js')
    const styles = read('frontend/react/src/styles/app.css')
    const cypress = read('cypress/react/reactApp.cy.js')

    expect(roleDashboard).toContain('RoleBookingDetails')
    expect(roleDashboard).toContain('data-testid="react-role-booking-details-toggle"')
    expect(roleDashboard).toContain('data-testid="react-role-booking-details"')
    expect(roleDashboard).toContain('data-testid="react-role-itinerary-day"')
    expect(roleDashboard).toContain('data-testid="react-role-favorite-itinerary-toggle"')
    expect(roleDashboard).toContain('data-testid="react-role-favorites-only-toggle"')
    expect(roleDashboard).toContain('aria-expanded={isExpanded}')
    expect(roleView).toContain('getBookingItineraryDays')
    expect(roleView).toContain('getItineraryDayActivities')
    expect(styles).toContain('React passenger and group booking details coverage with the prior role dashboard')
    expect(styles).toContain('.role-booking-detail-panel')
    expect(styles).toContain('.role-itinerary-day')
    expect(cypress).toContain('opens React passenger booking details and filters favorite itinerary activities')
  })


  it('keeps React role dashboard tolerant of loading demo-user data', () => {
    const roleView = read('frontend/react/src/domain/roleView.js')
    const roleDashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')

    expect(roleView).toContain('selectedDemoUser?.displayName')
    expect(roleDashboard).toContain('selectedDemoUser={selectedDemoUser}')
    expect(roleDashboard).toContain('getRoleSummaryLine')
  })


  it('keeps React workspace cards usable as Safari mobile touch targets', () => {
    const app = read('frontend/react/src/App.jsx')
    const styles = read('frontend/react/src/styles/app.css')

    expect(app).not.toContain('data-testid="react-workspace-demo-button"')
    expect(app).toContain('data-testid="react-workspace-role-button"')
    expect(app).toContain('data-testid="react-workspace-operations-button"')
    expect(app).toContain('data-testid="react-workspace-fleet-button"')
    expect(app).toContain('data-testid="react-workspace-quality-button"')
    expect(styles).toContain('React workspace mobile touch target stabilization')
    expect(styles).toContain('button.react-workspace-card')
    expect(styles).toContain('min-height: 72px')
    expect(styles).toContain('padding-block: 1rem')
  })


  it('keeps React workspace buttons guarded with inline Safari-safe touch targets', () => {
    const app = read('frontend/react/src/App.jsx')
    const styles = read('frontend/react/src/styles/app.css')

    expect(app).toContain('const workspaceTouchTargetStyle')
    expect(app).toContain("minHeight: '72px'")
    expect(app).toContain('style={workspaceTouchTargetStyle}')
    expect(styles).toContain('React workspace button hard guarantee')
    expect(styles).toContain('min-height: 72px !important')
  })


  it('keeps React workspace buttons at an explicit WebKit-safe height', () => {
    const app = read('frontend/react/src/App.jsx')
    const styles = read('frontend/react/src/styles/app.css')

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
    const styles = read('frontend/react/src/styles/app.css')

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
    const fleet = read('frontend/react/src/components/ReactFleetDirectory.jsx')
    const styles = read('frontend/react/src/styles/app.css')

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
    const fleet = read('frontend/react/src/components/ReactFleetDirectory.jsx')
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
    const fleet = read('frontend/react/src/components/ReactFleetDirectory.jsx')
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
    const fleet = read('frontend/react/src/components/ReactFleetDirectory.jsx')
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
    const hierarchy = read('frontend/react/src/components/CustomerBookingHierarchy.jsx')
    const client = read('frontend/react/src/api/client.js')
    const cypress = read('cypress/react/reactApp.cy.js')
    const styles = read('frontend/react/src/styles/app.css')

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
    const roleView = read('frontend/react/src/domain/roleView.js')
    const roleDashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
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
    const fleet = read('frontend/react/src/components/ReactFleetDirectory.jsx')
    const client = read('frontend/react/src/api/client.js')
    const cypress = read('cypress/react/reactApp.cy.js')
    const selectors = read('cypress/react/support/reactSelectors.js')
    const mobile = read('playwright/mobile/react-production-mobile.spec.js')
    const responsive = read('playwright/responsive/react-production-responsive.spec.js')
    const styles = read('frontend/react/src/styles/app.css')

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
    const fleet = read('frontend/react/src/components/ReactFleetDirectory.jsx')
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
    const fleet = read('frontend/react/src/components/ReactFleetDirectory.jsx')
    const client = read('frontend/react/src/api/client.js')
    const cypress = read('cypress/react/reactApp.cy.js')
    const mobile = read('playwright/mobile/react-production-mobile.spec.js')
    const responsive = read('playwright/responsive/react-production-responsive.spec.js')
    const styles = read('frontend/react/src/styles/app.css')

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
    const fleet = read('frontend/react/src/components/ReactFleetDirectory.jsx')
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
    const fleet = read('frontend/react/src/components/ReactFleetDirectory.jsx')
    const client = read('frontend/react/src/api/client.js')
    const cypress = read('cypress/react/reactApp.cy.js')
    const mobile = read('playwright/mobile/react-production-mobile.spec.js')
    const responsive = read('playwright/responsive/react-production-responsive.spec.js')
    const styles = read('frontend/react/src/styles/app.css')

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
    const fleet = read('frontend/react/src/components/ReactFleetDirectory.jsx')
    const createWorkflow = read('frontend/react/src/components/ReactCruiseLineCreateWorkflow.jsx')
    const styles = read('frontend/react/src/styles/app.css')

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
    const roleDashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const selectors = read('cypress/react/support/reactSelectors.js')
    const styles = read('frontend/react/src/styles/app.css')

    expect(roleDashboard).toContain('function buildOperationalDirectory')
    expect(roleDashboard).toContain('visibleReadinessOperations.map')
    expect(roleDashboard).toContain('data-testid="react-turnaround-selector-panel"')
    expect(roleDashboard).toContain('data-testid="react-turnaround-selector"')
    expect(roleDashboard).toContain('data-testid="react-operations-workspace-shell"')
    expect(roleDashboard).toContain('data-testid="react-operations-workspace-nav"')
    expect(roleDashboard).toContain('data-testid="react-operations-role-brief-panel"')
    expect(roleDashboard).toContain('function buildRoleOperationsBrief')
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
    expect(roleDashboard).toContain('function getOperationReleaseMetrics')
    expect(roleDashboard).toContain('data-testid="react-operations-portfolio-board"')
    expect(roleDashboard).toContain('data-testid="react-operations-portfolio-card"')
    expect(roleDashboard).toContain('portfolioAverageReadiness')
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
    expect(selectors).toContain("operationsPortfolioBoard: 'react-operations-portfolio-board'")
    expect(selectors).toContain("operationsPortfolioCard: 'react-operations-portfolio-card'")
    expect(selectors).toContain("operationsReleaseBoard: 'react-operations-release-board'")
    expect(selectors).toContain("operationsReleaseScore: 'react-operations-release-score'")
    expect(selectors).toContain("operationsReleaseCard: 'react-operations-release-card'")
    expect(selectors).toContain("turnaroundSelector: 'react-turnaround-selector'")
    expect(roleDashboard).toContain('Department Handoffs')
    expect(styles).toContain('Fleet operations portfolio')
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
    const roleSelector = read('frontend/react/src/components/ReactRoleSelector.jsx')
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


  it('keeps passenger booking cascading filters and ship-aware fares guardrailed', () => {
    const workflow = read('frontend/react/src/components/PassengerCruiseBookingWorkflow.jsx')
    const cypressSpec = read('cypress/react/reactPassengerBookingHardening.cy.js')

    expect(workflow).toContain('function buildFareOptionsForShip')
    expect(workflow).toContain('const filteredShipOptions = useMemo')
    expect(workflow).toContain('const selectedFareCode = availableFareOptions.some')
    expect(workflow).toContain('setShipOptions(Array.isArray(ships) ? ships.slice().sort(sortByLabel) : [])')
    expect(workflow).toContain('setSailingOptions(Array.isArray(sailings) ? sailings.slice().sort(sortByDepartureDate) : [])')
    expect(workflow).toContain('fareCode: selectedFareCode')
    expect(cypressSpec).toContain('cascades booking cruise line, ship, sailing, search filters, and ship-aware fare choices')
    expect(cypressSpec).toContain("expect(optionText).to.deep.eq(['Select ship', 'React Icon', 'React Utopia'])")
    expect(cypressSpec).toContain("expect(optionText).to.deep.eq(['Balcony'])")
  })

})


describe('turnaround command center React contract', () => {
  const projectRoot = path.resolve(__dirname, '../..')

  it('keeps the turnaround command center wired from API assembly to role dashboard render', () => {
    const controller = fs.readFileSync(path.join(projectRoot, 'controllers/cruise.controller.js'), 'utf8')
    const roleView = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/roleView.js'), 'utf8')
    const dashboard = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactRoleDashboard.jsx'), 'utf8')

    expect(controller).toContain("buildTurnaroundCommandCenter")
    expect(controller).toContain("buildTurnaroundContinuityCenter")
    expect(controller).toContain("commandCenter,")
    expect(controller).toContain("continuityCenter,")
    expect(roleView).toContain("function getCommandCenterFallback")
    expect(roleView).toContain("commandCenter: getCommandCenterFallback(operation, tasks, taskSummary)")
    expect(roleView).toContain("function getContinuityCenterFallback")
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
