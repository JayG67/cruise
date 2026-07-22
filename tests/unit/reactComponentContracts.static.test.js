const fs = require('fs')
const path = require('path')

const RETIRED_APP_CSS_PATH = ['frontend/react/src/styles/app', 'css'].join('.')
const PROJECT_ROOT = path.resolve(__dirname, '../..')

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), 'utf8')
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

describe('React component accessibility and presentation contracts', () => {
  test('keeps semantic muted text dark by default and light only on known dark command surfaces', () => {
    const utilitiesCss = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/utilities/index.css'), 'utf8')
    const contrastContract = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/utilities/contrast-contract.css'), 'utf8')

    expect(utilitiesCss).toContain('.react-production-shell .ce-muted')
    expect(utilitiesCss).toContain('var(--ce-light-surface-muted-text, #1f3a56)')
    expect(contrastContract).toContain('.ce-command-panel')
    expect(contrastContract).toContain('var(--ce-contrast-dark-muted)')
    expect(contrastContract).toContain('--ce-contrast-light-muted: #1f3a56;')
    expect(contrastContract).toContain('--ce-contrast-dark-muted: #d8f3ff;')
    expect(utilitiesCss).not.toContain('.react-production-shell .ce-muted {\n  color: var(--ce-command-text-muted)')
  })

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
      read('frontend/react/src/components/operations/OperationsIncidentOutreachScenarioPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsDormantReadinessPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx'),
      read('frontend/react/src/components/operations/operationalDashboardUtils.js'),
      read('frontend/react/src/components/operations/useOperationalDashboardDrafts.js')
    ].join('\n')
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
    const dashboard = readRoleDashboardSurface()

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
    const dashboard = readRoleDashboardSurface()
    const styles = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
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
    const styles = readCssBundle('frontend/react/src/styles/components/product-shell.css')

    expect(app).toContain("import EmployerDemoCommandCenter from './components/EmployerDemoCommandCenter.jsx'")
    expect(app).toContain("selectedRoleView === 'admin' &&")
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

  it('renders actionable turnaround lifecycle controls instead of demo-guide panels', () => {
    const dashboard = readRoleDashboardSurface()
    const styles = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

    expect(dashboard).not.toContain('Five-minute demo guide')
    expect(dashboard).not.toContain('data-testid="react-operations-presentation-guide"')
    expect(dashboard).toContain('data-testid="react-operations-lifecycle-phase-action"')
    expect(dashboard).toContain('data-testid="react-operations-lifecycle-blocker-action"')
    expect(dashboard).toContain('data-testid="react-operations-lifecycle-department-action"')
    expect(dashboard).toContain('data-testid="react-operations-lifecycle-next-action-button"')
    expect(dashboard).toContain('focusOperationsWorkspace')
    expect(styles).toContain('.operations-lifecycle-detail-action')
  })



  it('keeps operations directory panels in the approved dark command-center motif', () => {
    const dashboard = readRoleDashboardSurface()
    const styles = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css')

    expect(dashboard).toContain('data-testid="react-operations-directory-panel"')
    expect(dashboard).toContain('data-testid="react-operations-directory-card"')
    expect(dashboard).toContain('data-testid="react-operations-directory-detail"')
    expect(styles).toContain('.operations-directory-panel')
    expect(styles).toContain('linear-gradient(135deg, #082334 0%, #0f5360 52%, #15713f 100%)')
    expect(styles).toContain('.operations-directory-card {')
    expect(styles).toContain('.operations-directory-detail {')
    expect(styles).toContain('.operations-directory-metrics div {')
    expect(styles).toContain('.operations-directory-contact {')
    expect(styles).toContain('background: rgba(6, 30, 45, 0.88);')
    expect(styles).toContain('.operations-directory-panel *')
    expect(styles).toContain('-webkit-text-fill-color: #ffffff !important;')
    expect(styles).toContain('-webkit-text-fill-color: #9ee7ff !important;')
    expect(styles).toContain('color: #ffffff;')
    expect(styles).toContain('color: #9ee7ff;')
    expect(styles).not.toContain('linear-gradient(135deg, #ffffff, #f7fbff)')
  })

  it('keeps operations workspace navigation labels on a single line with command-center styling', () => {
    const dashboard = readRoleDashboardSurface()
    const styles = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css')

    expect(dashboard).toContain("{ id: 'dependencies', label: 'Dependencies'")
    expect(styles).toContain('grid-template-columns: repeat(3, minmax(10rem, 1fr)) !important;')
    expect(styles).toContain('.operations-workspace-nav-button')
    expect(styles).toContain('min-width: 0;')
    expect(styles).toContain('box-sizing: border-box;')
    expect(styles).toContain('@media (max-width: 1180px)')
    expect(styles).toContain('grid-column: 1 / -1;')
    expect(styles).toContain('white-space: nowrap;')
    expect(styles).toContain('overflow-wrap: normal;')
    expect(styles).toContain('background: rgba(6, 30, 45, 0.88);')
    expect(styles).toContain('border: 1px solid rgba(125, 211, 252, 0.35);')
  })


  it('keeps production contrast guardrails stronger than legacy compatibility selectors', () => {
    const contrastHardening = read('frontend/react/src/styles/components/contrast-hardening.css')
    const componentDirectory = path.join(projectRoot, 'frontend/react/src/styles/components')
    const componentCssFiles = fs.readdirSync(componentDirectory).filter(file => file.endsWith('.css'))
    const cssFilesWithLegacyRootOnly = componentCssFiles.filter(file => {
      const css = fs.readFileSync(path.join(componentDirectory, file), 'utf8')
      return css.includes('.react-app-shell') && !css.includes('.react-production-shell')
    })

    expect(cssFilesWithLegacyRootOnly).toEqual([])
    expect(contrastHardening).toContain('Build 283 audited contrast enforcement')
    expect(contrastHardening).toContain('.react-production-shell .react-admin-management-card .react-admin-stat-pills span')
    expect(contrastHardening).toContain('.react-production-shell .cruise-line-presentation-suite .presentation-hero-card .presentation-metric-grid article')
    expect(contrastHardening).toContain('.react-production-shell .cruise-line-presentation-suite .presentation-hero-card .presentation-metric-grid article span')
    expect(contrastHardening).toContain('background: #ffffff !important;')
    expect(contrastHardening).toContain('color: #071827 !important;')
    expect(contrastHardening).toContain('-webkit-text-fill-color: #071827 !important;')
  })

  it('prevents oversized customer and booking selectors with coordinated narrowing fields', () => {
    const hierarchyState = read('frontend/react/src/components/admin/useCustomerBookingHierarchyState.js')
    const mutationPanel = read('frontend/react/src/components/admin/AdminCustomerBookingMutationPanel.jsx')
    const workflowSelector = read('frontend/react/src/components/admin/AdminCustomerWorkflowSelector.jsx')

    expect(hierarchyState).toContain('const MAX_SELECTOR_OPTIONS = 75')
    expect(hierarchyState).toContain('customerSelectorNeedsNarrowing')
    expect(hierarchyState).toContain('bookingSelectorNeedsNarrowing')
    expect(hierarchyState).toContain('workflowSelectorNeedsNarrowing')
    expect(hierarchyState).not.toContain('.slice(0, 500)')

    expect(mutationPanel).toContain('data-testid="react-admin-delete-customer-last-name"')
    expect(mutationPanel).toContain('data-testid="react-admin-delete-customer-first-initial"')
    expect(mutationPanel).toContain('data-testid="react-admin-delete-booking-passenger-last-name"')
    expect(mutationPanel).toContain('data-testid="react-admin-delete-booking-passenger-first-initial"')
    expect(mutationPanel).toContain('disabled={customerSelectorNeedsNarrowing}')
    expect(mutationPanel).toContain('disabled={bookingSelectorNeedsNarrowing}')
    expect(mutationPanel).toContain('Narrow the customer list first')
    expect(mutationPanel).toContain('Narrow the booking list first')

    expect(workflowSelector).toContain('data-testid="react-hierarchy-customer-last-name-filter"')
    expect(workflowSelector).toContain('data-testid="react-hierarchy-customer-first-initial-filter"')
    expect(workflowSelector).toContain('disabled={workflowSelectorNeedsNarrowing}')
  })

  it('keeps shared muted text readable on light surfaces and admin summary bars rounded', () => {
    const utilities = read('frontend/react/src/styles/utilities/index.css')
    const contrastContract = read('frontend/react/src/styles/utilities/contrast-contract.css')
    const cssIndex = read('frontend/react/src/styles/index.css')
    const adminHierarchy = readAdminHierarchySurface()
    const adminWorkspace = read('frontend/react/src/styles/components/application-admin-workspace.css')
    const contrastHardening = read('frontend/react/src/styles/components/contrast-hardening.css')

    expect(utilities).toContain('Semantic muted text reads from the nearest surface context.')
    expect(utilities).toContain('var(--ce-surface-muted-text, var(--ce-light-surface-muted-text, #1f3a56))')
    expect(contrastHardening).toContain('Surface-owned contrast context.')
    expect(cssIndex.trim().endsWith("@import './utilities/contrast-contract.css';")).toBe(true)
    expect(contrastContract).toContain('Final application-wide surface contrast contract.')
    expect(contrastContract).toContain('--ce-contrast-light-muted: #1f3a56;')
    expect(contrastContract).toContain('--ce-contrast-dark-muted: #d8f3ff;')
    expect(contrastContract).toContain('.react-admin-management-card.ce-surface-light')
    expect(contrastContract).toContain('.react-admin-mutation-panel.ce-surface-light')
    expect(contrastContract).toContain('.react-admin-record-selector.ce-surface-light')
    expect(contrastContract).toContain('color: var(--ce-contrast-light-muted) !important;')
    expect(contrastContract).toContain('color: var(--ce-contrast-dark-muted) !important;')
    expect(adminHierarchy).toContain('react-admin-management-card ce-command-card ce-surface-light')
    expect(adminHierarchy).toContain('react-admin-mutation-panel ce-editor-card ce-surface-light')
    expect(adminHierarchy).toContain('draft-editor admin-delete-selector-card ce-surface-light')
    expect(adminHierarchy).toContain('react-admin-record-selector ce-surface-light')
    expect(adminWorkspace).toContain('Shared admin workflow summary/action bar.')
    expect(adminWorkspace).toContain('.react-admin-workflow-bar {')
    expect(adminWorkspace).toContain('border-radius: 1rem;')
    expect(adminWorkspace).toContain('overflow: hidden;')
    expect(adminWorkspace).toContain('.react-admin-workflow-bar .result-summary')
  })

  it('keeps quality-console controls reachable after contrast hardening', () => {
    const contrastHardening = read('frontend/react/src/styles/components/contrast-hardening.css')

    expect(contrastHardening).toContain('Build 284 production-surface visibility regression fix')
    expect(contrastHardening).toContain('.react-production-shell .react-sqa-console')
    expect(contrastHardening).toContain('.react-production-shell [data-testid="react-sqa-console"]')
    expect(contrastHardening).toContain('.react-production-shell .react-sqa-action-card button')
    expect(contrastHardening).toContain('.react-production-shell .react-sqa-report-links a')
    expect(contrastHardening).toContain('overflow: visible !important;')
    expect(contrastHardening).toContain('max-height: none !important;')
  })

  it('keeps the shared CSS foundation as the source of truth for broad React surfaces', () => {
    const retiredDesignSystemPath = path.join(projectRoot, 'frontend/react/src/styles/design-system.css')
    const designSystem = fs.existsSync(retiredDesignSystemPath) ? fs.readFileSync(retiredDesignSystemPath, 'utf8') : ''
    const cssIndex = read('frontend/react/src/styles/index.css')
    const tokens = read('frontend/react/src/styles/foundation/tokens.css')
    const theme = read('frontend/react/src/styles/foundation/theme.css')
    const panel = read('frontend/react/src/styles/components/panel.css')
    const card = read('frontend/react/src/styles/components/card.css')
    const button = readCssBundle('frontend/react/src/styles/components/button.css')
    const badge = readCssBundle('frontend/react/src/styles/components/badge.css')
    const table = read('frontend/react/src/styles/components/table.css')
    const navigation = read('frontend/react/src/styles/components/navigation.css')
    const feedback = read('frontend/react/src/styles/components/feedback.css')
    const selectorCard = read('frontend/react/src/styles/components/selector-card.css')
    const roleSelectorCss = readCssBundle('frontend/react/src/styles/components/role-selector.css')
    const productShell = readCssBundle('frontend/react/src/styles/components/product-shell.css')
    const contrastContract = read('frontend/react/src/styles/utilities/contrast-contract.css')
    const application = readCssBundle('frontend/react/src/styles/components/application.css')
    const roleDashboardStyles = readCssBundle('frontend/react/src/styles/components/role-dashboard.css')
    const form = readCssBundle('frontend/react/src/styles/components/form.css')
    const contrastHardening = read('frontend/react/src/styles/components/contrast-hardening.css')
    const utilities = read('frontend/react/src/styles/utilities/index.css')
    const componentIndex = read('frontend/react/src/styles/components/index.css')
    const layout = read('frontend/react/src/styles/layout/index.css')
    const main = read('frontend/react/src/main.jsx')
    const legacyStyles = optionalStyleRead(RETIRED_APP_CSS_PATH)
    const packageJson = JSON.parse(read('package.json'))

    expect(main).toContain("import './styles/index.css'")
    expect(main).not.toContain("import './styles/app.css'")
    expect(main).not.toContain("import './styles/design-system.css'")
    expect(cssIndex).toContain("@import './foundation/tokens.css';")
    expect(cssIndex).toContain("@import './foundation/theme.css';")
    expect(cssIndex).toContain("@import './foundation/reset.css';")
    expect(cssIndex).not.toContain("@import './app.css';")
    expect(cssIndex).not.toContain("@import './design-system.css';")
    expect(cssIndex).toContain("@import './layout/index.css';")
    expect(cssIndex).toContain("@import './components/index.css';")
    expect(cssIndex).toContain("@import './utilities/index.css';")
    expect(cssIndex.indexOf("@import './foundation/reset.css';")).toBeLessThan(cssIndex.indexOf("@import './layout/index.css';"))
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/src/styles/design-system.css'))).toBe(false)
    expect(tokens).toContain('--surface')
    expect(tokens).toContain('--space-md')
    expect(tokens).toContain('--font-md')
    expect(componentIndex).toContain("@import './panel.css';")
    expect(componentIndex).toContain("@import './card.css';")
    expect(componentIndex).toContain("@import './button.css';")
    expect(componentIndex).toContain("@import './badge.css';")
    expect(componentIndex).toContain("@import './navigation.css';")
    expect(componentIndex).toContain("@import './feedback.css';")
    expect(componentIndex).toContain("@import './selector-card.css';")
    expect(componentIndex).toContain("@import './role-selector.css';")
    expect(componentIndex).toContain("@import './product-shell.css';")
    expect(componentIndex).toContain("@import './product-polish.css';")
    expect(componentIndex).toContain("@import './role-dashboard.css';")
    expect(componentIndex).toContain("@import './contrast-hardening.css';")
    expect(componentIndex.indexOf("@import './operations-contrast.css';")).toBeLessThan(componentIndex.indexOf("@import './contrast-hardening.css';"))
    expect(contrastHardening).toContain('.react-admin-stat-pills span')
    expect(contrastHardening).toContain('.presentation-metric-grid article')
    expect(contrastHardening).toContain('.react-production-shell')
    expect(contrastHardening).toContain('Build 282 contrast safety net')
    expect(contrastHardening).toContain('-webkit-text-fill-color: var(--ce-light-surface-text)')
    expect(panel).toContain('.ce-panel')
    expect(card).toContain('.ce-card')
    expect(button).toContain('.ce-button')
    expect(badge).toContain('.ce-badge')
    expect(layout).toContain('.ce-grid')
    expect(layout).toContain('.ce-stack')
    expect(packageJson.scripts['css:foundation:audit']).toBe('node scripts/verify-css-foundation.js && npm run css:legacy:audit')
    expect(packageJson.scripts['css:legacy:audit']).toBe('node scripts/verify-css-legacy-retirement.js')
    expect(packageJson.scripts['react:production:complete']).toContain('css:foundation:audit')
    expect(packageJson.scripts.start).toContain('node index.js')
    expect(packageJson.scripts.start).not.toContain('node --watch index.js')
    expect(packageJson.scripts['start:watch']).toContain('node --watch index.js')
    expect(fs.existsSync(path.join(projectRoot, RETIRED_APP_CSS_PATH))).toBe(false)
    expect(productShell).toContain('CSS Foundation Refactor - Phase 2')
    expect(productShell).toContain('CSS Foundation Refactor - Phase 5')
    expect(roleDashboardStyles).toContain('CSS Foundation Refactor - Phase 4')
    const commandCardStyles = read('frontend/react/src/styles/components/product-surface-command-cards.css')
    expect(commandCardStyles).not.toContain('  .role-detail-card,')
    expect(commandCardStyles).not.toContain('  .role-itinerary-day,')
    expect(contrastContract).not.toContain('  .role-itinerary-panel,')
    expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 2')
    expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 3')
    expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 4')
    expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 5')
    expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 6')
    expect(cssIndex).toContain("@import './components/index.css';")
    for (const retiredPhase of [4, 5, 7, 8, 9, 10, 11, 12, 13, 14]) {
      expect(designSystem).not.toContain(`CSS Foundation Refactor - Phase ${retiredPhase}`)
    }
    expect(navigation).toContain('.react-production-shell .react-top-nav.ce-command-card')
    expect(feedback).toContain('.react-production-shell .ce-feedback-message.ce-editor-card')
    expect(selectorCard).toContain('.react-production-shell .ce-selector-card')
    expect(form).toContain('.react-production-shell .ce-field')
    expect(utilities).toContain('.react-production-shell .ce-visually-hidden')
    expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 15')
    expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 16')
    expect(roleSelectorCss).toContain('Role selector component architecture')
    expect(roleSelectorCss).toContain('Passenger and operational finder component architecture')
    expect(tokens).toContain('--ce-command-bg-soft')
    expect(tokens).toContain('--ce-command-card-bg')
    expect(tokens).toContain('--ce-data-surface')
    expect(tokens).toContain('--ce-action-primary-bg')
    expect(tokens).toContain('--ce-focus-ring')
    expect(tokens).toContain('--ce-control-height')
    expect(tokens).toContain('--ce-transition-fast')
    expect(productShell).toContain('.react-production-shell :is(')
    expect(productShell).toContain('.react-workspace-panel')
    expect(application).toContain('.react-app-section')
    expect(productShell).toContain('.react-admin-management-card')
    expect(productShell).toContain('.react-sqa-console')
    expect(roleDashboardStyles).toContain('.operational-turnaround-panel')
    expect(productShell).toContain('.draft-editor')
    expect(application).toContain('CSS Foundation Refactor - Slice 20')
    expect(application).toContain('.cruise-line-brand-panel')
    expect(application).toContain('.brand-theme-summary')
    expect(productShell).toContain('CSS Foundation Refactor - Slice 20')
    expect(productShell).toContain('.recommended-workflow-panel')
    expect(productShell).toContain('.react-confirm-action-panel--modal')
    expect(productShell).toContain('.react-admin-table-wrap')
    expect(productShell).toContain('var(--ce-command-text)')
    expect(productShell).toContain('var(--ce-data-text)')
    expect(panel).toContain('.ce-command-panel')
    expect(card).toContain('.ce-command-card')
    expect(card).toContain('.ce-editor-card')
    expect(designSystem).not.toContain('.react-production-shell .ce-command-panel {')
    expect(designSystem).not.toContain('.react-production-shell .ce-command-card {')
    expect(designSystem).not.toContain('.react-production-shell .ce-editor-card {')
    expect(designSystem).not.toContain('.operational-turnaround-panel')
    expect(roleDashboardStyles).toContain('.react-production-shell .react-role-dashboard.ce-command-panel')
    expect(roleDashboardStyles).toContain('.operations-directory-card.ce-command-card')
    expect(roleDashboardStyles).toContain('.operational-command-form.ce-editor-card')
    expect(productShell).toContain('.production-hardening-center.ce-command-panel')
    expect(productShell).toContain('.passenger-booking-form.ce-editor-card')
    expect(layout).toContain('.ce-action-row')
    expect(button).toContain('.ce-button-primary')
    expect(table).toContain('.child-panel.ce-editor-card')
    expect(navigation).toContain('.react-top-nav.ce-command-card')
    expect(feedback).toContain('.ce-feedback-message.ce-editor-card')
    expect(layout).toContain('.ce-section-heading')
    expect(layout).toContain('.ce-field-grid')
    expect(form).toContain('.ce-field-label')
    expect(card).toContain('.ce-empty-state.ce-editor-card')
    expect(selectorCard).toContain('.ce-selector-card')
    expect(roleSelectorCss).toContain('.role-selector-section :is(.passenger-finder-panel, .person-finder-panel, .role-summary-card)')
    expect(selectorCard).toContain('.booking-guest-result-card.ce-selector-card')
    expect(selectorCard).toContain(':is(.passenger-finder-card, .person-finder-card).ce-selector-card')
    expect(selectorCard).toContain('min-height: 10.5rem;')
    expect(selectorCard).toContain('grid-auto-rows: minmax(10.5rem, auto);')
    expect(selectorCard).toContain('-webkit-line-clamp: 3;')
    expect(selectorCard).toContain('overflow: hidden;')
    expect(selectorCard).toContain('padding: 1.15rem 1.2rem 1.35rem !important;')
    expect(selectorCard).toContain('grid-auto-rows: max-content;')
    expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 17')
    expect(roleSelectorCss).toContain('Operational form action component architecture')
    expect(legacyStyles).not.toContain('Build 496 - task status action buttons keep dark text on light pills')
    expect(legacyStyles).not.toContain('Build 460 - Role/person selector white-card contrast fix')
    expect(legacyStyles).not.toContain('Build 463 - operational role assignment filter contrast fix')
    expect(designSystem).not.toContain('.selector-compatibility-card-anchor')
    expect(theme).toContain('.react-production-shell :is(button, a, input, select, textarea):focus-visible')
    expect(utilities).toContain('@media (prefers-reduced-motion: reduce)')
  })


  it('keeps the retired CSS audit explicit after app css removal', () => {
    const retirementAudit = read('scripts/verify-css-legacy-retirement.js')

    expect(retirementAudit).toContain('CSS retired file audit passed.')
    expect(retirementAudit).toContain('appCssDeleted')
    expect(retirementAudit).toContain('appCssReferenceFileCount')
    expect(retirementAudit).toContain('retired app.css must be deleted')
    expect(retirementAudit).toContain('/\\.(js|jsx|css)$/')
  })

  it('migrates major React surfaces onto reusable CSS foundation primitives', () => {
    const hierarchy = readAdminHierarchySurface()
    const fleet = readFleetDirectorySurface()
    const createWorkflow = read('frontend/react/src/components/ReactCruiseLineCreateWorkflow.jsx')
    const selector = read('frontend/react/src/components/ReactRoleSelector.jsx')
    const sqa = read('frontend/react/src/components/ReactSqaConsole.jsx')
    const turnaroundSetup = read('frontend/react/src/components/ReactTurnaroundAdminSetup.jsx')
    const app = read('frontend/react/src/App.jsx')
    const draftFeedback = read('frontend/react/src/components/DraftFeedback.jsx')
    const retiredDesignSystemPath = path.join(projectRoot, 'frontend/react/src/styles/design-system.css')
    const designSystem = fs.existsSync(retiredDesignSystemPath) ? fs.readFileSync(retiredDesignSystemPath, 'utf8') : ''
    const roleSelectorCss = readCssBundle('frontend/react/src/styles/components/role-selector.css')
    const productShell = readCssBundle('frontend/react/src/styles/components/product-shell.css')
    const contrastContract = read('frontend/react/src/styles/utilities/contrast-contract.css')

    expect(app).toContain('production-hero ce-command-panel')
    expect(app).toContain('react-top-nav ce-command-card')
    expect(app).toContain('hero-cta-row ce-action-row')
    expect(app).toContain('button-link primary ce-button-primary')
    expect(app).toContain('button-link secondary ce-button-secondary')
    expect(app).toContain('hero-status-pills ce-status-row')
    expect(app).toContain('eyebrow ce-kicker')
    expect(app).toContain('route-panel ce-command-panel')
    expect(app).toContain('react-quality-section ce-command-panel')
    expect(app).toContain('lazy-section-fallback ce-command-panel')
    expect(draftFeedback).toContain('draft-message ce-feedback-message ce-editor-card')
    expect(hierarchy).toContain('draft-grid ce-field-grid')
    expect(hierarchy).toContain('button-row ce-action-row')

    expect(hierarchy).toContain('react-admin-workspace ce-command-panel')
    expect(hierarchy).toContain('react-admin-management-card ce-command-card')
    expect(hierarchy).toContain('react-admin-table-wrap ce-editor-card')
    expect(fleet).toContain('fleet-directory-section ce-command-panel')
    expect(fleet).toContain('fleet-card ce-command-card ce-surface-dark')
    expect(fleet).toContain('react-inline-edit-form ce-editor-card')
    expect(fleet).toContain('brand-theme-summary ce-surface-dark')
    expect(contrastContract).toContain('.fleet-card.ce-surface-dark')
    expect(contrastContract).toContain('.brand-theme-summary.ce-surface-dark')
    expect(contrastContract).toContain('color: var(--ce-contrast-dark-text) !important;')
    const presentationControls = read('frontend/react/src/components/ReactCruiseLinePresentationSuite.jsx')
    expect(presentationControls).toContain('presentation-control-panel cruise-line-operations-control-panel ce-command-card ce-surface-dark')
    expect(presentationControls).toContain('presentation-scope-controls cruise-line-operations-scope-controls ce-surface-dark')
    expect(presentationControls).toContain('presentation-line-picker cruise-line-operations-picker ce-surface-dark')
    expect(contrastContract).toContain('Cruise-line operating controls are dark surfaces')
    expect(contrastContract).toContain('.presentation-control-panel.ce-surface-dark')
    expect(contrastContract).toContain('.presentation-line-picker.ce-surface-dark')
    expect(contrastContract).toContain("input:not([type='checkbox']):not([type='radio'])")
    expect(fleet).toContain('fleet-card-actions ce-action-row')
    expect(fleet).toContain('button-link secondary light-action ce-button-secondary')
    expect(fleet).toContain('search-control ce-field fleet-search-control')
    expect(createWorkflow).toContain('react-create-card ce-command-card')
    expect(createWorkflow).toContain('secondary-button add-ship-button ce-button-secondary')
    expect(createWorkflow).toContain('ce-editor-card starter-ships-panel starter-ships-locked ce-surface-light')
    const adminCreateCss = read('frontend/react/src/styles/components/admin-create.css')
    expect(adminCreateCss).toContain('Starter Ships is the second step of the same light editing workflow.')
    expect(adminCreateCss).toContain('.starter-ships-panel')
    expect(adminCreateCss).toContain('background: var(--admin-card-soft-bg, #f8fbff) !important;')
    expect(adminCreateCss).not.toContain('linear-gradient(145deg, rgba(5, 32, 46, 0.78), rgba(7, 64, 65, 0.66))')
    expect(selector).toContain('role-selector-section ce-command-panel')
    expect(selector).toContain('passenger-finder-panel ce-command-card')
    expect(selector).toContain('passenger-finder-card ce-selector-card ce-command-card')
    expect(selector).toContain('person-finder-card ce-selector-card ce-command-card')
    expect(roleSelectorCss).toContain('Role selector finder panels now use the CSS foundation')
    expect(sqa).toContain('react-sqa-console ce-command-panel')
    expect(sqa).toContain('react-sqa-action-card ce-command-card')
    expect(sqa).toContain('react-sqa-output-actions ce-action-row')
    expect(turnaroundSetup).toContain('turnaround-admin-setup-panel ce-command-panel')
    expect(turnaroundSetup).toContain('turnaround-workspace-card ce-command-card ce-surface-light')
    expect(turnaroundSetup).toContain('turnaround-workspace-step-label')
    expect(turnaroundSetup).toContain('turnaround-workspace-step-value')
    expect(turnaroundSetup).toContain('turnaround-workspace-step-detail')
    const turnaroundCss = read('frontend/react/src/styles/components/admin-turnaround.css')
    expect(turnaroundCss).toContain('Keep each workspace summary field readable as label, value, then supporting detail.')
    expect(turnaroundCss).toContain('.turnaround-workspace-step-label')
    expect(turnaroundCss).toContain('display: block !important;')
    expect(contrastContract).toContain('Turnaround workspace summary cards are light surfaces nested in a dark command panel.')
    expect(contrastContract).toContain('.turnaround-workspace-card.ce-surface-light')
    expect(turnaroundSetup).toContain('turnaround-admin-draft-summary ce-surface-dark')
    expect(contrastContract).toContain('The selected-turnaround summary is an intentionally dark status surface')
    expect(contrastContract).toContain('.turnaround-admin-draft-summary.ce-surface-dark')
    expect(turnaroundCss).toContain('Dark turnaround summary surfaces need comfortable internal spacing')
    expect(turnaroundCss).toContain('padding: 1rem 1.1rem !important;')
    expect(turnaroundCss).toContain('gap: 0.55rem !important;')
    expect(turnaroundSetup).toContain('turnaround-admin-form ce-editor-card')
    expect(turnaroundSetup).toContain('secondary-action-button compact-action ce-button-secondary')

    const demo = read('frontend/react/src/components/EmployerDemoCommandCenter.jsx')
    const passengerBooking = read('frontend/react/src/components/PassengerCruiseBookingWorkflow.jsx')
    const hardening = read('frontend/react/src/components/ReactProductionHardeningCenter.jsx')
    const architecture = read('frontend/react/src/components/ReactDataArchitectureReadinessCenter.jsx')
    const deployment = read('frontend/react/src/components/ReactDeploymentReadinessCenter.jsx')
    const publicLaunch = read('frontend/react/src/components/ReactPublicLaunchControlCenter.jsx')
    const polish = read('frontend/react/src/components/ReactPortfolioPolishCenter.jsx')
    const presentation = read('frontend/react/src/components/ReactCruiseLinePresentationSuite.jsx')

    expect(demo).toContain('employer-demo-command-center self-guided-overview ce-command-panel')
    expect(demo).toContain('employer-demo-step-button secondary-action-button ce-button-secondary')
    expect(demo).toContain('employer-demo-proof-card self-guided-proof-card ce-command-card')
    expect(passengerBooking).toContain('passenger-booking-workflow ce-command-card ce-surface-dark')
    expect(passengerBooking).toContain('passenger-booking-form ce-editor-card')
    expect(passengerBooking).toContain("import { useEffect, useMemo, useState } from 'react'")
    expect(passengerBooking).toContain('const selectedPrimaryGuestId = selectedCustomer?.id || selectedDemoUser?.customerId ||')
    expect(passengerBooking).toContain('setGuestDrafts(currentGuests =>')
    expect(passengerBooking).toContain('return [synchronizedPrimaryGuest, ...currentGuests.slice(1)]')
    expect(hardening).toContain('production-hardening-center ce-command-panel')
    expect(architecture).toContain('data-architecture-readiness-center ce-command-panel')
    expect(deployment).toContain('deployment-readiness-center ce-command-panel')
    expect(publicLaunch).toContain('public-launch-control-center ce-command-panel')
    expect(polish).toContain('portfolio-polish-center ce-command-panel')
    expect(presentation).toContain('cruise-line-presentation-suite ce-command-panel')
  })


  it('migrates role dashboards and operational workspaces onto reusable CSS foundation primitives', () => {
    const dashboard = [
      read('frontend/react/src/components/ReactRoleDashboard.jsx'),
      read('frontend/react/src/components/passenger/RolePassengerSurface.jsx'),
      read('frontend/react/src/components/passenger/RoleBookingCard.jsx'),
      read('frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'),
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
      read('frontend/react/src/components/operations/OperationsIncidentOutreachScenarioPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsDormantReadinessPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx'),
      read('frontend/react/src/components/operations/operationalDashboardUtils.js'),
      read('frontend/react/src/components/operations/useOperationalDashboardDrafts.js')
    ].join('\n')
    const roleDashboardStyles = readCssBundle('frontend/react/src/styles/components/role-dashboard.css')
    const retiredDesignSystemPath = path.join(projectRoot, 'frontend/react/src/styles/design-system.css')
    const designSystem = fs.existsSync(retiredDesignSystemPath) ? fs.readFileSync(retiredDesignSystemPath, 'utf8') : ''

    expect(dashboard).toContain('react-role-dashboard ce-command-panel')
    expect(dashboard).toContain('role-profile-card passenger-self-service ce-command-card ce-surface-dark')
    expect(dashboard).toContain('role-booking-card ce-command-card ce-surface-dark')
    expect(dashboard).toContain('role-booking-detail-panel ce-command-card ce-surface-dark')
    expect(dashboard).toContain('role-itinerary-panel ce-command-card ce-surface-dark')
    expect(dashboard).toContain('role-itinerary-day ce-editor-card ce-surface-light')
    expect(dashboard).toContain('role-profile-card passenger-self-service ce-command-card')
    expect(dashboard).toContain('passenger-profile-form react-passenger-profile-form ce-editor-card')
    expect(dashboard).toContain('role-booking-card ce-command-card')
    expect(dashboard).toContain('role-booking-detail-panel ce-command-card')
    expect(dashboard).toContain('role-detail-card ce-editor-card ce-surface-light')
    expect(dashboard).toContain('operations-portfolio-board ce-command-panel')
    expect(dashboard).toContain('operations-release-board ce-command-panel')
    expect(dashboard).toContain('operations-workspace-shell ce-command-panel')
    expect(dashboard).toContain('operations-role-brief-panel ce-command-panel')
    expect(dashboard).toContain('operations-directory-panel ce-command-panel')
    expect(dashboard).toContain('operations-directory-card ce-command-card')
    expect(dashboard).toContain('operational-command-form ce-editor-card')
    expect(dashboard).toContain('operational-task-detail-form ce-editor-card')
    expect(dashboard).toContain('secondary-action-button compact-button ce-button-secondary')
    expect(dashboard).toContain('danger-outline-button compact-button ce-button-danger')
    expect(dashboard).toContain('operational-signoff-form ce-editor-card')
    expect(dashboard).toContain('status-card compact ce-command-card')

    const customerRow = read('frontend/react/src/components/CustomerHierarchyRow.jsx')
    expect(customerRow).toContain('customer-disclosure-button ce-button-secondary')
    expect(customerRow).toContain('linked-booking-pill ce-status-pill')
    expect(customerRow).toContain('react-row-action-cluster ce-action-row')
    expect(customerRow).toContain('primary-action-button compact-action-button ce-button-primary')
    expect(customerRow).toContain('fleet-danger-action compact-action-button ce-button-danger')
    expect(customerRow).toContain('editor-row ce-editor-row')
    expect(customerRow).toContain('child-panel ce-editor-card')

    expect(roleDashboardStyles).toContain('CSS Foundation Refactor - Phase 4')
    expect(roleDashboardStyles).toContain('.role-booking-card.ce-command-card')
    expect(roleDashboardStyles).toContain('.operations-workspace-shell.ce-command-panel')
    expect(roleDashboardStyles).toContain('.operations-role-brief-card.ce-command-card')
  })


  it('loads full booking details before rendering passenger itinerary controls when bulk booking payloads are compact', () => {
    const roleBookingCard = read('frontend/react/src/components/passenger/RoleBookingCard.jsx')
    const apiClient = read('frontend/react/src/api/client.js')

    expect(apiClient).toContain('export async function getBookingDetails')
    expect(roleBookingCard).toContain("import { getBookingDetails, getItineraryForSailing } from '../../api/client.js'")
    expect(roleBookingCard).toContain('const needsItineraryDetails = isExpanded && bookingId && getBookingItineraryDays(effectiveBooking).length === 0')
    expect(roleBookingCard).toContain('const nextBooking = await getBookingDetails(bookingId)')
    expect(roleBookingCard).toContain('data-testid="react-role-booking-details-loading"')
    expect(roleBookingCard).toContain('booking={effectiveBooking}')
  })


  it('keeps role booking list state isolated in the passenger domain component', () => {
    const dashboard = readRoleDashboardSurface()
    const roleBookingList = read('frontend/react/src/components/passenger/RoleBookingList.jsx')

    expect(dashboard).toContain("import RoleBookingList from './passenger/RoleBookingList.jsx'")
    expect(dashboard).toContain('<RoleBookingList')
    expect(roleBookingList).toContain('export default function RoleBookingList')
    expect(roleBookingList).toContain('const [expandedBookingIds, setExpandedBookingIds] = useState(() => new Set())')
    expect(roleBookingList).toContain('function toggleBookingDetails')
    expect(roleBookingList).toContain('function toggleFavoriteItineraryActivity')
    expect(roleBookingList).toContain('function toggleFavoritesOnly')
    expect(roleBookingList).toContain('role-booking-list')
    expect(roleBookingList).toContain('RoleBookingCard')
    expect(roleBookingList).toContain('getBookingItineraryDays')
  })


})


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
      read('frontend/react/src/components/operations/OperationsIncidentOutreachScenarioPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsDormantReadinessPanels.jsx'),
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
    expect(app).toContain('data-testid="react-workspace-quality-button"')
    expect(app).not.toContain('data-testid="react-release-readiness-section"')
    expect(app).not.toContain(['React', 'RouteNav'].join(''))
    expect(app).toContain('aria-label="Customer-centered operations"')
  })

  it('keeps the self-guided overview concise and separate from workspace cards', () => {
    const app = read('frontend/react/src/App.jsx')
    const overview = read('frontend/react/src/components/EmployerDemoCommandCenter.jsx')
    const hierarchy = readAdminHierarchySurface()

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
    const selectors = read('cypress/react/support/reactSelectors.js')
    const cypress = read('cypress/react/reactPassengerSelfService.cy.js')

    expect(bookingWorkflow).toContain('data-testid="react-booking-guest-finder"')
    expect(bookingWorkflow).toContain('data-testid="react-booking-guest-search-input"')
    expect(bookingWorkflow).toContain('data-testid="react-booking-guest-result-card"')
    expect(bookingWorkflow).toContain('booking-guest-result-card ce-selector-card ce-command-card')
    expect(bookingWorkflow).toContain('booking-guest-result-main ce-selector-card-main')
    expect(bookingWorkflow).toContain('booking-guest-result-context ce-selector-card-detail')
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
    expect(selector).toContain('className="passenger-finder-card-main ce-selector-card-main" data-testid="react-passenger-finder-result-card"')
    expect(selector).not.toContain('selector-compatibility-card-anchor')
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
    const roleDashboard = [
      read('frontend/react/src/components/ReactRoleDashboard.jsx'),
      read('frontend/react/src/components/passenger/RolePassengerSurface.jsx'),
      read('frontend/react/src/components/passenger/RoleBookingCard.jsx'),
      read('frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'),
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
      read('frontend/react/src/components/operations/OperationsIncidentOutreachScenarioPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsDormantReadinessPanels.jsx'),
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
      read('frontend/react/src/components/passenger/RoleBookingCard.jsx'),
      read('frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'),
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
      read('frontend/react/src/components/operations/OperationsIncidentOutreachScenarioPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsDormantReadinessPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx'),
      read('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx'),
      read('frontend/react/src/components/operations/operationalDashboardUtils.js'),
      read('frontend/react/src/components/operations/useOperationalDashboardDrafts.js')
    ].join('\n')
    const roleView = read('frontend/react/src/domain/roleView.js')
    const passengerRoleSurface = read('frontend/react/src/components/passenger/RolePassengerSurface.jsx')
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
    expect(passengerRoleSurface).toContain('role-favorites-filter ce-surface-light')
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
    const roleView = read('frontend/react/src/domain/roleView.js')
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
    expect(app).toContain('data-testid="react-workspace-quality-button"')
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
    const roleView = read('frontend/react/src/domain/roleView.js')
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
    const roleDashboard = readRoleDashboardSurface()
    const selectors = read('cypress/react/support/reactSelectors.js')
    const styles = [
      optionalStyleRead(RETIRED_APP_CSS_PATH),
      readCssBundle('frontend/react/src/styles/components/operations-workspaces.css'),
      readCssBundle('frontend/react/src/styles/components/operations-queues.css'),
      readCssBundle('frontend/react/src/styles/components/operations-coverage.css'),
      readCssBundle('frontend/react/src/styles/components/readiness-centers.css'),
      readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css'),
    ].join('\n')

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



  it('keeps Playwright app-bridge role selection using display names from seeded demo users', () => {
    const app = read('frontend/react/src/App.jsx')
    const helper = read('playwright/support/reactProductionHelpers.js')

    expect(app).toContain('name: user.displayName || user.name ||')
    expect(app).toContain('const userSearchText = [user.displayName, user.name, user.email]')
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
    const dashboard = [
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactRoleDashboard.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationsStaffingReadinessWorkspaces.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationsEvidencePanels.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationsReadinessEvidencePanels.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationsDormantReadinessPanels.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/operationalDashboardUtils.js'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/operations/useOperationalDashboardDrafts.js'), 'utf8')
    ].join('\n')

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


test('role selector finder panels use CSS foundation contrast contracts', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/role-selector.css')

  expect(cssSource).toContain('Role selector component architecture')
  expect(cssSource).toContain('Role selector finder panels now use the CSS foundation')
  expect(cssSource).toContain('.react-production-shell .role-selector-section .person-finder-panel')
  expect(cssSource).toContain('.react-production-shell .role-selector-section .selected-person-card')
  expect(cssSource).toContain('var(--ce-command-text)')
  expect(cssSource).toContain('var(--ce-data-text)')
})


test('operational role assignment filters use CSS foundation light editor contracts', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/role-selector.css')

  expect(cssSource).toContain('Passenger and operational finder component architecture')
  expect(cssSource).toContain('.react-production-shell .role-selector-section :is(.passenger-finder-panel, .person-finder-panel, .role-summary-card)')
  expect(cssSource).toContain('.react-production-shell .role-selector-section :is(.passenger-finder-grid, .operational-person-filter-grid)')
  expect(cssSource).toContain('.react-production-shell .role-selector-section .operational-person-filter-grid .role-selector-field')
  expect(cssSource).toContain('var(--ce-data-text)')
})


test('turnaround role dashboard panels use dark operational motif overrides', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 464 - dark operational role dashboard motif')
  expect(cssSource).toContain('.role-dashboard-section [class*="turnaround"][class*="panel"]')
  expect(cssSource).toContain('background: linear-gradient(135deg, #082334')
})

test('build 465 contrast correction exists', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 465 - role dashboard contrast correction')
})

test('build 466 operational dashboard contrast repair is present', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 466 - exact operational dashboard contrast repair')
  expect(cssSource).toContain('.react-role-dashboard .operations-portfolio-board')
  expect(cssSource).toContain('.react-role-dashboard .operations-release-board')
  expect(cssSource).toContain('.react-role-dashboard .operations-lifecycle')
})

test('build 467 operational panels use explicit dark motif and light tile contrast', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 467 - operational role panels aligned to admin dark motif')
  expect(cssSource).toContain('.react-role-dashboard .operations-portfolio-board')
  expect(cssSource).toContain('.react-role-dashboard .operations-release-board')
  expect(cssSource).toContain('.react-role-dashboard .operations-lifecycle')
})

test('build 468 operational role panels use role selector dark motif', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 468 - operational role panels use the same dark motif as the role selector')
  expect(cssSource).toContain('.react-role-dashboard .operations-portfolio-heading')
  expect(cssSource).toContain('background: transparent !important')
})

test('build 469 restores white text on dark operational cards', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 469 - restore white text on dark operational cards')
})

test('build 470 fleet portfolio dark card text contrast is present', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 470 - exact fleet portfolio dark-card text contrast')
  expect(cssSource).toContain('.react-role-dashboard .operations-portfolio-list > article > :not(dl)')
})

test('build 471 fixes exact selected turnaround portfolio card contrast', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 471 - exact selected turnaround portfolio-card contrast fix')
  expect(cssSource).toContain('button.operations-portfolio-card > span:not(.operations-portfolio-status)')
  expect(cssSource).toContain('button.operations-portfolio-card > strong')
})

test('build 473 release-board cards match operational metric tile style', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 473 - release-board KPI cards match operational metric tile style')
  expect(cssSource).toContain('.react-role-dashboard .operations-release-card')
  expect(cssSource).toContain('background: #f8fbff !important')
})

test('build 474 release board cards use white text on dark cards', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 474 - fix invisible release-board KPI text')
  expect(cssSource).toContain('-webkit-text-fill-color: #ffffff')
})

test('build 475 lifecycle story tiles use dark-card motif', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 475 - lifecycle story tiles match lifecycle dark-card motif')
  expect(cssSource).toContain('.react-role-dashboard .operations-lifecycle-story span')
})

test('build 476 role operations panels are unified to workspace selection style', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 476 - role-operations panels unified to workspace-selection style')
  expect(cssSource).toContain('.react-role-dashboard .operations-lifecycle-details > div')
  expect(cssSource).toContain('.react-role-dashboard .operations-release-packet')
})

test('build 477 reviewer packet details use a readable two-column layout', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 477 - reviewer packet detail layout repair')
  expect(cssSource).toContain('.operations-reviewer-packet-details')
  expect(cssSource).toContain('react-operations-reviewer-packet-quality')
})

test('build 478 outreach board details use readable card layout', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 478 - outreach board detail layout repair')
  expect(cssSource).toContain('.operations-outreach-board-details')
  expect(cssSource).toContain('writing-mode: horizontal-tb')
})


test('employer-facing role dashboard does not render reviewer or system-readiness packet', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'), 'utf8')

  expect(source).not.toContain('selectedOperation?.reviewerPacket')
  expect(source).not.toContain('react-operations-reviewer-packet')
  expect(source).not.toContain('Cruise-line reviewer packet')
  expect(source).not.toContain('Presentation-ready operational evidence packet')
  expect(source).not.toContain('reviewer readiness')
  expect(source).not.toContain('HOLD FOR COMMAND REVIEW')
})


test('employer-facing role dashboard does not render turnaround management status panel', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'), 'utf8')

  expect(source).not.toContain('selectedOperation?.managementStatus')
  expect(source).not.toContain('react-operations-management-status')
  expect(source).not.toContain('Turnaround management status')
  expect(source).not.toContain('Production-demo completion map')
  expect(source).not.toContain('production-demo application')
  expect(source).not.toContain('NEEDS HARDENING')
})


test('employer-facing role dashboard does not render launch plan panel', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'), 'utf8')

  expect(source).not.toContain('selectedOperation?.launchPlan')
  expect(source).not.toContain('react-operations-launch-plan')
  expect(source).not.toContain('Turnaround launch plan')
  expect(source).not.toContain('Reviewer demo certification gates')
})

test('build 482 scenario plan uses outreach-board dark motif', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 482 - scenario plan panel matches cruise-line outreach dark motif')
  expect(cssSource).toContain('.react-role-dashboard .operations-scenario-plan')
  expect(cssSource).toContain('.react-role-dashboard .operations-scenario-plan-details')
})

test('build 483 scenario stress cards use white text', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 483 - scenario stress cards force readable white text')
})

test('build 484 remaining role operation panels use dark outreach motif', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 484 - unify remaining role-operations panels to the dark outreach-board motif')
  expect(cssSource).toContain('.react-role-dashboard .operations-command-center')
  expect(cssSource).toContain('.react-role-dashboard .operations-shift-briefing')
  expect(cssSource).toContain('.react-role-dashboard .operations-closeout-packet')
})

test('build 485 operations timeline uses executive brief dark motif', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-timeline.css', 'frontend/react/src/styles/components/operations-workspaces.css', 'frontend/react/src/styles/components/operations-queues.css', 'frontend/react/src/styles/components/operations-coverage.css')
  expect(cssSource).toContain('Build 485 - operations timeline and downstream panels match executive brief dark motif')
  expect(cssSource).toContain('[data-testid="react-operations-timeline"]')
})

test('build 486 role workspace lower panels use dark operational motif', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css', 'frontend/react/src/styles/components/operations-queues.css', 'frontend/react/src/styles/components/operations-coverage.css')
  expect(cssSource).toContain('Build 486 - role workspace/detail panels match the approved dark motif')
  expect(cssSource).toContain('.operations-role-brief-panel')
  expect(cssSource).toContain('.operations-directory')
  expect(cssSource).toContain('.operations-handoff-detail-panel')
})

test('build 487 command detail workspace uses dark operational motif with readable text', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css', 'frontend/react/src/styles/components/operations-queues.css', 'frontend/react/src/styles/components/operations-coverage.css')
  expect(cssSource).toContain('Build 487 - command detail workspace uses approved dark operational motif')
  expect(cssSource).toContain('.react-role-dashboard .operational-command-compatibility-panel .operational-readiness-card')
  expect(cssSource).toContain('-webkit-text-fill-color: #ffffff !important')
  expect(cssSource).toContain('.react-role-dashboard .operational-command-compatibility-panel .operational-command-form input')
})

test('build 488 command detail editor forms use dark cards with light editing controls', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css', 'frontend/react/src/styles/components/operations-queues.css', 'frontend/react/src/styles/components/operations-coverage.css')
  expect(cssSource).toContain('Build 488 - command detail editor forms use dark operational cards while controls stay editable')
  expect(cssSource).toContain('.react-role-dashboard .operational-command-compatibility-panel .operational-command-form,')
  expect(cssSource).toContain('background: rgba(6, 30, 45, 0.88) !important')
  expect(cssSource).toContain('.react-role-dashboard .operational-command-compatibility-panel .operational-command-form input,')
  expect(cssSource).toContain('background: #ffffff !important')
  expect(cssSource).toContain('-webkit-text-fill-color: #0f172a !important')
})

test('build 489 deep operations workspace styling sweep keeps panels dark and controls editable', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css', 'frontend/react/src/styles/components/operations-queues.css', 'frontend/react/src/styles/components/operations-coverage.css')
  expect(cssSource).toContain('Build 489 - deep operations workspace styling sweep')
  expect(cssSource).toContain('.operations-dependency-workspace')
  expect(cssSource).toContain('.operations-handoff-workspace')
  expect(cssSource).toContain('.operations-staffing-workspace')
  expect(cssSource).toContain('.operations-escalation-workspace')
  expect(cssSource).toContain('.operations-readiness-workspace')
  expect(cssSource).toContain('background: rgba(6, 30, 45, 0.88) !important')
  expect(cssSource).toContain('color: #ffffff !important')
  expect(cssSource).toContain('-webkit-text-fill-color: #ffffff !important')
  expect(cssSource).toContain('background: #ffffff !important')
  expect(cssSource).toContain('-webkit-text-fill-color: #0f172a !important')
})




test('phase 23 first-impression hero styles live in the hero component layer', () => {
  const heroStyles = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/hero.css'), 'utf8')
  const retiredDesignSystemPath = path.join(__dirname, '../../frontend/react/src/styles/design-system.css')
  const designSystem = fs.existsSync(retiredDesignSystemPath) ? fs.readFileSync(retiredDesignSystemPath, 'utf8') : ''
  const legacyStyles = readCssBundle('frontend/react/src/styles/components/product-shell.css', 'frontend/react/src/styles/components/product-polish.css')
  const foundationAudit = fs.readFileSync(path.join(__dirname, '../../scripts/verify-css-foundation.js'), 'utf8')
  const componentIndex = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/index.css'), 'utf8')

  expect(componentIndex).toContain("@import './hero.css';")
  expect(heroStyles).toContain('CSS Foundation Refactor - Phase 23')
  expect(heroStyles).toContain('Build 358: first-impression landing page polish for cruise-line presentation')
  expect(heroStyles).toContain('.production-hero::before')
  expect(heroStyles).toContain('.hero-product-card')
  expect(heroStyles).toContain("url('/images/cruise-background-1280.webp')")
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 23')
  expect(designSystem).not.toContain('Build 358: first-impression landing page polish for cruise-line presentation')
  expect(designSystem).not.toContain('.hero-product-card')
  expect(legacyStyles).toContain('Phase 23 CSS retirement: first-impression landing page and production hero styles')
  expect(legacyStyles).not.toContain('Build 358: first-impression landing page polish for cruise-line presentation')
  expect(foundationAudit).toContain('styles.hero')
})


test('phase 21 and 22 passenger voyage planner styles live in the passenger component layer', () => {
  const passengerStyles = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/passenger.css'), 'utf8')
  const retiredDesignSystemPath = path.join(__dirname, '../../frontend/react/src/styles/design-system.css')
  const designSystem = fs.existsSync(retiredDesignSystemPath) ? fs.readFileSync(retiredDesignSystemPath, 'utf8') : ''
  const componentIndex = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/index.css'), 'utf8')

  expect(componentIndex).toContain("@import './passenger.css';")
  expect(passengerStyles).toContain('CSS Foundation Refactor - Phase 21')
  expect(passengerStyles).toContain('CSS Foundation Refactor - Phase 22')
  expect(passengerStyles).toContain('.passenger-voyage-planner')
  expect(passengerStyles).toContain('.voyage-planner-card')
  expect(passengerStyles).toContain('.voyage-booking-card')
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 21')
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 22')
})

test('phase 20 admin workspace styles live in component CSS', () => {
  const adminWorkspaces = readCssBundle(
    'frontend/react/src/styles/components/admin-workspaces.css',
    'frontend/react/src/styles/components/admin-presentation.css'
  )
  const componentIndex = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/index.css'), 'utf8')
  const retiredDesignSystemPath = path.join(__dirname, '../../frontend/react/src/styles/design-system.css')
  const designSystem = fs.existsSync(retiredDesignSystemPath) ? fs.readFileSync(retiredDesignSystemPath, 'utf8') : ''
  const legacyStyles = readCssBundle('frontend/react/src/styles/components/product-shell.css', 'frontend/react/src/styles/components/product-polish.css')
  const appCss = optionalStyleRead(RETIRED_APP_CSS_PATH)

  expect(componentIndex).toContain("@import './admin-workspaces.css';")
  expect(componentIndex).toContain("@import './admin-presentation.css';")
  expect(adminWorkspaces).toContain('CSS Foundation Refactor - Phase 20')
  expect(adminWorkspaces).toContain('Build 437: admin surface width and panel consistency repair')
  expect(adminWorkspaces).toContain('Build 448: lock starter ship controls until cruise line details are complete')
  expect(adminWorkspaces).toContain('Build 458 - hard contrast fix for SQA status and go-live readiness text')
  expect(adminWorkspaces).toContain('.react-create-workflow-section')
  expect(adminWorkspaces).toContain('.react-quality-section .go-live-readiness-panel .readiness-item')
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 20')
  expect(designSystem).not.toContain('Build 437: admin surface width and panel consistency repair')
  expect(designSystem).not.toContain('Build 448: lock starter ship controls until cruise line details are complete')
  expect(legacyStyles).toContain('CSS Foundation Refactor Phase 20: Build 437-448 admin workspace')
  expect(legacyStyles).not.toContain('Build 437: admin surface width and panel consistency repair')
  expect(legacyStyles).not.toContain('Build 448: lock starter ship controls until cruise line details are complete')
  expect(appCss).not.toContain('Build 437: admin surface width and panel consistency repair')
})

test('phase 19 operational dashboard styles live in component CSS', () => {
  const retiredDesignSystemPath = path.join(__dirname, '../../frontend/react/src/styles/design-system.css')
  const designSystem = fs.existsSync(retiredDesignSystemPath) ? fs.readFileSync(retiredDesignSystemPath, 'utf8') : ''
  const operationsDashboard = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  const operationsTimeline = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/operations-timeline.css'), 'utf8')
  const operationsWorkspaces = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css')
  const componentIndex = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/index.css'), 'utf8')
  const legacyStyles = readCssBundle('frontend/react/src/styles/components/product-shell.css', 'frontend/react/src/styles/components/product-polish.css')
  const appCss = optionalStyleRead(RETIRED_APP_CSS_PATH)

  expect(componentIndex).toContain("@import './operations-role-surface.css';")
  expect(componentIndex).toContain("@import './operations-continuity.css';")
  expect(componentIndex).toContain("@import './operations-release.css';")
  expect(componentIndex).toContain("@import './operations-evidence.css';")
  expect(componentIndex).toContain("@import './operations-timeline.css';")
  expect(componentIndex).toContain("@import './operations-workspaces.css';")
  expect(componentIndex).toContain("@import './operations-queues.css';")
  expect(componentIndex).toContain("@import './operations-coverage.css';")
  expect(componentIndex).toContain("@import './readiness-centers.css';")
  expect(operationsDashboard).toContain('CSS Foundation Refactor - Phase 19')
  expect(operationsDashboard).toContain('Build 464 - dark operational role dashboard motif')
  expect(operationsDashboard).toContain('Build 484 - unify remaining role-operations panels to the dark outreach-board motif')
  expect(operationsTimeline).toContain('Build 485 - operations timeline and downstream panels match executive brief dark motif')
  expect(operationsWorkspaces).toContain('Build 489 - deep operations workspace styling sweep')
  expect(operationsWorkspaces).toContain('.operations-directory-panel')
  expect(operationsWorkspaces).toContain('.operational-command-compatibility-panel')
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 20')
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 19')
  expect(designSystem).not.toContain('Build 464 - dark operational role dashboard motif')
  expect(designSystem).not.toContain('Build 489 - deep operations workspace styling sweep')
  expect(legacyStyles).toContain('CSS Foundation Refactor Phase 19: Build 464-489 operational dashboard')
  expect(legacyStyles).not.toContain('Build 464 - dark operational role dashboard motif')
  expect(legacyStyles).not.toContain('Build 489 - deep operations workspace styling sweep')
  expect(appCss).not.toContain('Build 464 - dark operational role dashboard motif')
})


test('slice 31 readiness and diagnostic center styles live in component CSS', () => {
  const readinessCenters = readCssBundle('frontend/react/src/styles/components/readiness-centers.css')
  const operationsDashboard = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  const componentIndex = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/index.css'), 'utf8')
  const legacyStyles = readCssBundle('frontend/react/src/styles/components/product-shell.css', 'frontend/react/src/styles/components/product-polish.css')
  const appCss = optionalStyleRead(RETIRED_APP_CSS_PATH)

  expect(componentIndex).toContain("@import './readiness-centers.css';")
  expect(readinessCenters).toContain('CSS Foundation Refactor Slice 31')
  expect(readinessCenters).toContain('.data-architecture-readiness-center')
  expect(readinessCenters).toContain('.production-hardening-center')
  expect(readinessCenters).toContain('.deployment-readiness-center')
  expect(readinessCenters).toContain('.portfolio-polish-center')
  expect(readinessCenters).toContain('.public-launch-control-center')
  expect(readinessCenters).toContain('.operations-control-board')
  expect(operationsDashboard).toContain('CSS Foundation Refactor Slice 31')
  expect(operationsDashboard).toContain('.operations-shift-briefing')
  expect(operationsDashboard).toContain('.operations-go-live-center')
  expect(operationsDashboard).toContain('.turnaround-team-readiness-card')
  expect(legacyStyles).toContain('CSS Foundation Refactor Slice 31: data architecture, hardening, deployment, portfolio, control-board, migration, and public launch readiness CSS moved to layered component CSS.')
  expect(appCss).not.toContain('.data-architecture-readiness-center')
  expect(appCss).not.toContain('.operations-go-live-center')
})

test('phase 18 retires the Build 490-495 operational contrast patch stack into the component layer', () => {
  const operationsContrastStyles = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/operations-contrast.css'), 'utf8')
  const componentIndex = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/index.css'), 'utf8')
  const retiredDesignSystemPath = path.join(__dirname, '../../frontend/react/src/styles/design-system.css')
  const designSystem = fs.existsSync(retiredDesignSystemPath) ? fs.readFileSync(retiredDesignSystemPath, 'utf8') : ''
  const legacyStyles = optionalStyleRead(RETIRED_APP_CSS_PATH)

  expect(componentIndex).toContain("@import './operations-contrast.css';")
  expect(operationsContrastStyles).toContain('CSS Foundation Refactor - Phase 18')
  expect(operationsContrastStyles).toContain('Retires the Phase 18 Build 490-495 operational contrast patch stack')
  expect(operationsContrastStyles).toContain('.operational-command-compatibility-panel')
  expect(operationsContrastStyles).toContain('.operational-readiness-list')
  expect(operationsContrastStyles).toContain('.operations-dependency-workspace')
  expect(operationsContrastStyles).toContain('.operations-handoff-workspace')
  expect(operationsContrastStyles).toContain('.operations-staffing-workspace')
  expect(operationsContrastStyles).toContain('.operations-escalation-workspace')
  expect(operationsContrastStyles).toContain('.operations-readiness-workspace')
  expect(operationsContrastStyles).toContain('color: var(--ce-command-text) !important')
  expect(operationsContrastStyles).toContain('-webkit-text-fill-color: var(--ce-command-text) !important')
  expect(operationsContrastStyles).toContain('color: var(--ce-data-text) !important')
  expect(operationsContrastStyles).toContain('-webkit-text-fill-color: var(--ce-data-text) !important')
  expect(operationsContrastStyles).toContain('background: var(--ce-data-surface) !important')
  expect(operationsContrastStyles).toContain('background: #ffffff !important')
  expect(operationsContrastStyles).toContain('background: var(--ce-action-soft-bg) !important')
  expect(operationsContrastStyles).toContain(':is(input, select, textarea, option)')
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 18')
  expect(legacyStyles).not.toContain('Build 490 - operational dark-surface text contrast sweep')
  expect(legacyStyles).not.toContain('Build 491 - hard stop for dark-on-dark operational command text')
  expect(legacyStyles).not.toContain('Build 492 - command workspace dark-surface text contrast hardening')
  expect(legacyStyles).not.toContain('Build 493 - readiness workspace dark text kill switch')
  expect(legacyStyles).not.toContain('Build 494 - command workspace contrast correction')
  expect(legacyStyles).not.toContain('Build 495 - nested light editor contrast correction')
})

test('role selector component keeps operational task action buttons on component-layer contrast rules', () => {
  const designSystem = readCssBundle('frontend/react/src/styles/components/role-selector.css')
  const legacyStyles = optionalStyleRead(RETIRED_APP_CSS_PATH)

  expect(designSystem).toContain('Operational form action component architecture')
  expect(designSystem).toContain('.operational-task-actions :is(button, .secondary-action-button, .compact-button)')
  expect(designSystem).toContain(':is(button.danger-outline-button, .danger-outline-button.compact-button)')
  expect(designSystem).toContain('background: var(--ce-action-soft-bg) !important')
  expect(designSystem).toContain('background: #fff1f2 !important')
  expect(designSystem).toContain('-webkit-text-fill-color: var(--ce-data-text) !important')
  expect(designSystem).toContain(':disabled')
  expect(legacyStyles).not.toContain('Build 496 - task status action buttons keep dark text on light pills')
})


test('quality console light surfaces cannot inherit the retired dark compatibility stack', () => {
  const consoleSource = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')
  const contrastContract = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/utilities/contrast-contract.css'), 'utf8')
  const legacyCompatibility = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/admin-shell-legacy-compatibility.css'), 'utf8')

  expect(consoleSource).toContain('react-sqa-console ce-command-panel ce-surface-light')
  expect(consoleSource).toContain('react-sqa-status-pill ce-command-card ce-surface-light')
  expect(consoleSource).toContain('go-live-readiness-panel ce-surface-light')
  expect(consoleSource).toContain('react-sqa-action-card ce-command-card ce-surface-light')
  expect(contrastContract).toContain('Global readable typography contract.')
  expect(contrastContract).toContain('.react-quality-section')
  expect(contrastContract).toContain('.react-sqa-console.ce-surface-light')
  expect(contrastContract).toContain('color: var(--ce-contrast-light-text) !important;')
  expect(contrastContract).toContain('color: var(--ce-contrast-light-muted) !important;')
  expect(legacyCompatibility).not.toContain('.react-quality-section section h3,')
  expect(legacyCompatibility).not.toContain('.react-quality-section .react-sqa-action-card,')
})

test('keeps cruise-line presentation light cards readable and retires legacy white-text overrides', () => {
  const presentation = readProjectFile('frontend/react/src/components/ReactCruiseLinePresentationSuite.jsx')
  const contrastContract = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')
  const legacyCompatibility = readProjectFile('frontend/react/src/styles/components/admin-shell-legacy-compatibility.css')

  expect(presentation).toContain('presentation-hero-card ce-command-card ce-surface-light')
  expect(presentation).toContain('className="ce-surface-light"><span>Ships</span>')
  expect(presentation).toContain('className="ce-surface-light"><span>Ports</span>')
  expect(contrastContract).toContain('.presentation-hero-card.ce-surface-light')
  expect(contrastContract).toContain('.presentation-metric-grid article.ce-surface-light')
  expect(contrastContract).toContain(':is(h3, p, span, strong)')
  expect(legacyCompatibility).not.toContain('.cruise-line-presentation-suite .presentation-hero-card *')
  expect(legacyCompatibility).not.toContain('.cruise-line-presentation-suite article h3')
  expect(legacyCompatibility).not.toContain('.cruise-line-presentation-suite article p')

  const presentationLayout = readProjectFile('frontend/react/src/styles/components/admin-presentation-layout.css')
  expect(presentationLayout).toContain('.presentation-demo-flow.presentation-action-grid')
  expect(presentationLayout).toContain('display: grid !important;')
  expect(presentationLayout).toContain('row-gap: var(--ce-space-4, 1rem) !important;')
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
    expect(workspaceCss).toContain('.operations-portfolio-card dl')
    expect(workspaceCss).toContain('-webkit-text-fill-color: #0f172a !important;')
    expect(workspaceCss).toContain('-webkit-text-fill-color: #075985 !important;')
  })

  it('keeps operational score tiles and the scenario runbook on explicit readable surfaces', () => {
    const releasePacket = readProjectFile('frontend/react/src/components/operations/OperationsReleasePacketPanel.jsx')
    const playbook = readProjectFile('frontend/react/src/components/operations/OperationsPlaybookPanels.jsx')
    const incidentOutreach = readProjectFile('frontend/react/src/components/operations/OperationsIncidentOutreachScenarioPanels.jsx')
    const contrastContract = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect(releasePacket).toContain('operations-release-packet-score ce-surface-light')
    expect(playbook).toContain('operations-playbook-score ce-surface-light')
    expect(playbook).toContain('operations-playbook-variance-score ce-surface-light')
    expect(incidentOutreach).toContain('operations-incident-command-score ce-surface-light')
    expect(incidentOutreach).toContain('operations-outreach-board-score ce-surface-light')
    expect(incidentOutreach).toContain('operations-scenario-plan-score ce-surface-light')
    expect(incidentOutreach).toContain('operations-scenario-plan-runbook ce-surface-dark')
    expect(contrastContract).toContain('Operational score tiles are light status surfaces')
    expect(contrastContract).toContain('.operations-scenario-plan-runbook.ce-surface-dark')
  })

  it('keeps analytics and scenario score panels dark-on-light like peer score cards', () => {
    const metrics = readProjectFile('frontend/react/src/components/operations/OperationsMetricsPanel.jsx')
    const scenario = readProjectFile('frontend/react/src/components/operations/OperationsIncidentOutreachScenarioPanels.jsx')
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
    const incident = readProjectFile('frontend/react/src/components/operations/OperationsIncidentOutreachScenarioPanels.jsx')
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



describe('Operations summary score-card consistency contract', () => {
  it('keeps executive, after-action, and timeline summaries on light surfaces', () => {
    const launchPanels = readProjectFile('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx')
    const timelinePanels = readProjectFile('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx')
    const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect(launchPanels).toContain('operations-executive-brief-score ce-surface-light')
    expect(launchPanels).toContain('operations-after-action-score ce-surface-light')
    expect((timelinePanels.match(/operations-timeline-score-card ce-surface-light/g) || []).length).toBeGreaterThanOrEqual(3)
    expect(contrastCss).toContain('.operations-executive-brief-score.ce-surface-light')
    expect(contrastCss).toContain('.operations-after-action-score.ce-surface-light')
    expect(contrastCss).toContain('.operations-timeline-summary > .ce-surface-light')
  })
})


describe('Department continuity presentation contract', () => {
  it('separates score, plain-language status, and human-readable role labels', () => {
    const continuityPanels = readProjectFile('frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx')
    const continuityCss = readProjectFile('frontend/react/src/styles/components/operations-continuity-shared-lower-panels.css')

    expect(continuityPanels).toContain("AT_RISK: 'At risk'")
    expect(continuityPanels).toContain("replace(/[_-]+/g, ' ')")
    expect(continuityPanels).toContain('operations-continuity-department-score')
    expect(continuityPanels).toContain('operations-continuity-department-status')
    expect(continuityPanels).toContain('operations-continuity-department-role')
    expect(continuityCss).toContain('Department continuity cards present score, status, and role as separate human-readable lines.')
    expect(continuityCss).toContain('.operations-continuity-department-heading')
    expect(continuityCss).toContain('text-transform: uppercase !important;')
  })
})


describe('Department command presentation contract', () => {
  it('separates score, plain-language status, and human-readable role labels', () => {
    const commandPanels = readProjectFile('frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx')
    const continuityCss = readProjectFile('frontend/react/src/styles/components/operations-continuity-shared-lower-panels.css')

    expect(commandPanels).toContain('operations-command-center-department-score')
    expect(commandPanels).toContain('operations-command-center-department-status')
    expect(commandPanels).toContain('operations-command-center-department-role')
    expect(commandPanels).toContain('{formatContinuityStatus(department.status)}')
    expect(commandPanels).toContain('{formatDepartmentRole(department.departmentRole)}')
    expect(continuityCss).toContain('Department command cards use the same business-readable hierarchy as continuity cards.')
    expect(continuityCss).toContain('.operations-command-center-department-heading')
  })
})


describe('Lower operations evidence-card presentation contract', () => {
  it('separates score, status, and business labels across briefing, deployment, closeout, and archive cards', () => {
    const panels = readProjectFile('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx')
    const lowerPanelCss = readProjectFile('frontend/react/src/styles/components/operations-continuity-shared-lower-panels.css')

    expect(panels).toContain('const formatOperationalStatus')
    expect(panels).toContain('const formatOperationalRole')
    expect((panels.match(/operations-structured-status-card/g) || []).length).toBeGreaterThanOrEqual(4)
    expect(panels).toContain('operations-status-score')
    expect(panels).toContain('operations-status-label')
    expect(panels).toContain('operations-status-title')
    expect(lowerPanelCss).toContain('Shared readable hierarchy for lower operations status/evidence cards.')
    expect(lowerPanelCss).toContain('.operations-structured-status-card .operations-status-label')
    expect(lowerPanelCss).toContain('text-transform: uppercase;')
  })
})


describe('After-action department lessons layout contract', () => {
  it('keeps department lessons wide, readable, and responsive beside follow-up actions', () => {
    const panels = readProjectFile('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx')
    const afterActionCss = readProjectFile('frontend/react/src/styles/components/operations-evidence-after-action.css')

    expect(panels).toContain('operations-after-action-departments')
    expect(panels).toContain('operations-after-action-followups')
    expect(panels).toContain('{formatOperationalRole(department.departmentRole)}')
    expect(afterActionCss).toContain('Keep after-action department lessons usable beside the follow-up action list.')
    expect(afterActionCss).toContain('grid-template-columns: minmax(18rem, 0.85fr) minmax(0, 2.15fr);')
    expect(afterActionCss).toContain('@media (max-width: 980px)')
  })
})


describe('Operations lifecycle phase alignment contract', () => {
  it('keeps every lifecycle phase card top-aligned instead of vertically centered', () => {
    const lifecycleCss = readProjectFile('frontend/react/src/styles/components/operations-evidence-lifecycle.css')

    expect(lifecycleCss).toContain('Lifecycle phase cards always begin at the top of their grid cell.')
    expect(lifecycleCss).toContain('flex-direction: column !important;')
    expect(lifecycleCss).toContain('align-items: flex-start !important;')
    expect(lifecycleCss).toContain('justify-content: flex-start !important;')
    expect(lifecycleCss).toContain('align-self: stretch;')
  })
})


describe('Operations summary surface and overflow contract', () => {
  it('keeps timeline, workspace, and directory light surfaces readable and fully visible', () => {
    const commandPanels = readProjectFile('frontend/react/src/components/operations/OperationsCommandPanels.jsx')
    const timelinePanels = readProjectFile('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx')
    const workspaceCss = readProjectFile('frontend/react/src/styles/components/operations-workspace-shell.css')
    const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect((timelinePanels.match(/operations-timeline-score-card ce-surface-light/g) || []).length).toBeGreaterThanOrEqual(3)
    expect(commandPanels).toContain('operations-workspace-active-summary ce-surface-light')
    expect((commandPanels.match(/className="ce-surface-light"/g) || []).length).toBeGreaterThanOrEqual(5)
    expect((commandPanels.match(/operations-directory-contact ce-surface-light/g) || []).length).toBe(2)
    expect(workspaceCss).toContain('grid-template-columns: minmax(12rem, 0.55fr) minmax(0, 1.35fr) minmax(18rem, 0.85fr);')
    expect(workspaceCss).toContain('overflow-wrap: anywhere;')
    expect(contrastCss).toContain('Operations summary and directory light surfaces must remain readable inside dark command panels.')
    expect(contrastCss).toContain('.operations-directory-metrics > .ce-surface-light')
  })
})

describe('Operations timeline light summary surface contract', () => {
  it('keeps timeline totals dark-on-light inside the role dashboard', () => {
    const timeline = readProjectFile('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx')
    const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect((timeline.match(/operations-timeline-score-card ce-surface-light/g) || []).length).toBeGreaterThanOrEqual(3)
    expect(contrastCss).toContain('.react-role-dashboard .operations-timeline-summary > .ce-surface-light')
    expect(contrastCss).toContain('background: #f8fbff !important;')
    expect(contrastCss).toContain('color: #0f172a !important;')
    expect(contrastCss).toContain('min-inline-size: 5.5rem !important;')
  })
})


describe('Operations timeline semantic score-card contrast contract', () => {
  it('keeps all timeline summary cards light despite broad command summary selectors', () => {
    const timelinePanels = readProjectFile('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx')
    const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect((timelinePanels.match(/operations-timeline-score-card ce-surface-light/g) || []).length).toBe(3)
    expect(contrastCss).toContain('body .react-role-dashboard .operations-timeline .operations-timeline-summary > .operations-timeline-score-card.ce-surface-light')
    expect(contrastCss).toContain('background: #f8fbff !important;')
    expect(contrastCss).toContain('background-image: none !important;')
    expect(contrastCss).toContain('color: #0f172a !important;')
  })
})
