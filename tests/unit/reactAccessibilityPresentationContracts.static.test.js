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
      read('frontend/react/src/components/operations/operationalDashboardLabels.js'),
      read('frontend/react/src/components/operations/operationalDashboardReadiness.js'),
      read('frontend/react/src/components/operations/operationalDashboardFormatting.js'),
      read('frontend/react/src/domain/operationalDashboardWorkspace.js'),
      read('frontend/react/src/components/operations/useOperationalDashboardDrafts.js'),
      read('frontend/react/src/domain/operationalDashboardDrafts.js')
    ].join('\n')
  }


  it('keeps operational draft defaults in the domain layer without duplicate task fields', () => {
    const hook = read('frontend/react/src/components/operations/useOperationalDashboardDrafts.js')
    const drafts = read('frontend/react/src/domain/operationalDashboardDrafts.js')

    expect(hook).toContain("from '../../domain/operationalDashboardDrafts.js'")
    expect(hook).toContain('buildTaskCreateDraft({ roleView, selectedPerson: selectedDemoUser })')
    expect(drafts).toContain('export function buildTaskCreateDraft')
    expect((drafts.match(/taskName: ''/g) || [])).toHaveLength(1)
    expect(hook).not.toContain("taskName: ''")
  })

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
    const roleViewDomain = readRoleViewSurface()
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
    const selector = readRoleSelectorSurface()
    const demoHook = read('frontend/react/src/hooks/useDemoUsers.js')
    const roleViewDomain = readRoleViewSurface()

    expect(demoHook).toContain('normalizeOperationalDemoUsers(await getDemoUsers')
    expect(roleViewDomain).toContain("const assignmentKey = `${roleView}:${baseName}:${assignedCruiseLine}:${assignedShip}:${user.id || ''}`")
    expect(selector).toContain('getOperationalAssignmentShipName(user)')
    expect(selector).toContain("['turnaround-manager', 'housekeeping-lead'")
    expect(selector).toContain('getOperationalAssignmentContext(user)')
    expect(selector).toContain('operationalCruiseLineFilter')
    expect(selector).toContain('operationalShipFilter')
  })


  it('renders the turnaround lifecycle state as the primary command story', () => {
    const dashboard = readRoleDashboardSurface()
    const styles = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
    const controller = [read('services/turnaroundOperationDetails.service.js'), read('services/turnaroundOperationalArtifacts.service.js')].join('\n')

    const roleViewDomain = readRoleViewSurface()

    expect(controller).toContain('buildTurnaroundLifecycleState')
    expect(controller).toContain('lifecycleState')
    expect(roleViewDomain).toContain('lifecycleState: operation.lifecycleState || null')
    expect(dashboard).toContain('data-testid="react-operations-lifecycle-state"')
    expect(dashboard).toContain('data-testid="react-operations-lifecycle-phases"')
    expect(dashboard).toContain('data-testid="react-operations-lifecycle-blockers"')
    expect(dashboard).toContain('data-testid="react-operations-lifecycle-next-action"')
    expect(styles).toContain('.operations-lifecycle')
  })

  it('renders a product workspace navigator above the workspace stack', () => {
    const app = read('frontend/react/src/App.jsx')
    const navigator = read('frontend/react/src/components/PlatformWorkspaceNavigator.jsx')
    const styles = readCssBundle('frontend/react/src/styles/components/product-shell.css')

    expect(app).toContain("import PlatformWorkspaceNavigator from './components/PlatformWorkspaceNavigator.jsx'")
    expect(app).toContain('<PlatformWorkspaceNavigator')
    expect(navigator).toContain('data-testid="react-platform-overview-command-center"')
    expect(navigator).toContain('data-testid="react-platform-overview-proof-grid"')
    expect(navigator).toContain('data-testid="react-platform-overview-runway"')
    expect(navigator).toContain('Operational workspaces and platform capabilities')
    expect(navigator).not.toContain('What to say while presenting')
    expect(navigator).toContain('buildPlatformMetrics')
    expect(navigator).toContain('buildWorkspaceLinks')
    expect(styles).toContain('.platform-workspace-navigator')
  })

  it('keeps retired portfolio walkthrough surfaces out of the product shell and source tree', () => {
    const app = read('frontend/react/src/App.jsx')
    const retired = [
      'PortfolioExperienceWelcome',
      'PortfolioDemoJourneys',
      'PortfolioEvidenceMap',
      'PortfolioReviewerBriefing',
      'PortfolioReviewSession'
    ]

    for (const component of retired) {
      expect(app).not.toContain(component)
      expect(fs.existsSync(path.join(projectRoot, `frontend/react/src/components/${component}.jsx`))).toBe(false)
    }

    expect(app).not.toContain('Start Guided Walkthrough')
    expect(app).not.toContain('react-getting-started')
  })

  it('keeps repository-review architecture surfaces out of the user-facing application', () => {
    const app = read('frontend/react/src/App.jsx')
    const styleIndex = read('frontend/react/src/styles/components/index.css')
    const retiredSurfaces = [
      'EngineeringDecisionCenter',
      'SystemArchitectureOverview',
      'ProductionReadinessCenter',
      'QualityStrategyCenter'
    ]
    const retiredStyles = [
      'engineering-decision-center.css',
      'system-architecture-overview.css',
      'production-readiness-center.css',
      'quality-strategy-center.css'
    ]

    for (const surface of retiredSurfaces) {
      expect(app).not.toContain(surface)
      expect(fs.existsSync(path.join(projectRoot, `frontend/react/src/components/${surface}.jsx`))).toBe(false)
    }

    for (const style of retiredStyles) {
      expect(styleIndex).not.toContain(style)
      expect(fs.existsSync(path.join(projectRoot, `frontend/react/src/styles/components/${style}`))).toBe(false)
    }
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
    expect(styles).toContain('.operations-directory-metric {')
    expect(styles).toContain('.operations-directory-contact {')
    expect(styles).toContain('background: rgba(6, 30, 45, 0.88);')
    expect(styles).toContain('.operations-directory-panel *')
    expect(styles).toContain('-webkit-text-fill-color: #ffffff !important;')
    expect(styles).toContain('-webkit-text-fill-color: #9ee7ff !important;')
    expect(styles).toContain('color: #ffffff;')
    expect(styles).toContain('color: #9ee7ff;')
    expect(styles).not.toContain('linear-gradient(135deg, #ffffff, #f7fbff)')
  })

  it('stacks operations directory metrics vertically with single-line labels and values', () => {
    const dashboard = readRoleDashboardSurface()
    const styles = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css')

    expect((dashboard.match(/operations-directory-metric ce-surface-light/g) || []).length).toBe(5)
    expect(styles).toContain('.operations-directory-metrics {')
    expect(styles).toContain('grid-template-columns: minmax(0, 1fr);')
    expect(styles).toContain('.operations-directory-metric {')
    expect(styles).toContain('justify-content: space-between;')
    expect(styles).toContain('.operations-directory-metric dt {')
    expect(styles).toContain('.operations-directory-metric dd {')
    expect(styles).toContain('white-space: nowrap;')
  })

  it('keeps operations workspace navigation labels on a single line with command-center styling', () => {
    const navigation = read('frontend/react/src/components/operations/operationalDashboardNavigation.js')
    const styles = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css')

    expect(navigation).toContain("{ id: 'dependencies', label: 'Dependencies'")
    expect(styles).toContain('grid-template-columns: repeat(3, minmax(0, 1fr)) !important;')
    expect(styles).toContain('.operations-workspace-nav-button')
    expect(styles).toContain('min-width: 0;')
    expect(styles).toContain('box-sizing: border-box;')
    expect(styles).toContain('grid-template-areas:')
    expect(styles).toContain('\"summary summary\";')
    expect(styles).toContain('grid-area: summary;')
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
    const hierarchySelectors = read('frontend/react/src/domain/adminCustomerBookingSelectors.js')
    const hierarchyBoundary = `${hierarchyState}\n${hierarchySelectors}`
    const mutationPanel = read('frontend/react/src/components/admin/AdminCustomerBookingMutationPanel.jsx')
    const workflowSelector = read('frontend/react/src/components/admin/AdminCustomerWorkflowSelector.jsx')
    const productPolish = read('frontend/react/src/styles/components/product-polish.css')

    expect(hierarchyState).toContain('buildAdminCustomerBookingSelectorState')
    expect(hierarchySelectors).toContain('MAX_ADMIN_SELECTOR_OPTIONS = 75')
    expect(hierarchyBoundary).toContain('customerSelectorNeedsNarrowing')
    expect(hierarchyBoundary).toContain('bookingSelectorNeedsNarrowing')
    expect(hierarchyBoundary).toContain('workflowSelectorNeedsNarrowing')
    expect(hierarchyBoundary).not.toContain('.slice(0, 500)')
    expect(hierarchyState).not.toContain('function getScopedCustomerRows')
    expect(hierarchyState).not.toContain('function getScopedBookingRows')

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
    expect(productPolish).toContain('.admin-progressive-selector-grid {')
    expect(productPolish).toContain('grid-template-columns: minmax(0, 1fr);')
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
    expect(productShell).toContain('.cruise-line-presentation-suite.ce-command-panel')
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
    const selector = readRoleSelectorSurface()
    const sqa = [
      read('frontend/react/src/components/ReactSqaConsole.jsx'),
      read('frontend/react/src/components/QualityValidationWorkspace.jsx')
    ].join('\n')
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
    expect(app).toContain('<OperationsIntelligenceCenter')
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
    const presentationControls = read('frontend/react/src/components/ReactCruiseLineOperationsWorkspace.jsx')
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
    expect(adminCreateCss).toContain('Create Workflow is a light editing card.')
    expect(adminCreateCss).toContain('background-color: #ffffff !important;')
    expect(adminCreateCss).toContain('.react-create-card-heading :is(h3, p)')
    expect(adminCreateCss).toContain('.react-create-actions .result-summary')
    expect(adminCreateCss).toContain('color: #164e63 !important;')
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

    const demo = read('frontend/react/src/components/PlatformWorkspaceNavigator.jsx')
    const passengerBookingComponent = read('frontend/react/src/components/PassengerCruiseBookingWorkflow.jsx')
    const passengerBookingState = read('frontend/react/src/components/usePassengerBookingWorkflowState.js')
    const passengerBooking = `${passengerBookingComponent}\n${passengerBookingState}`
    const passengerBookingGuests = read('frontend/react/src/components/PassengerBookingGuestWorkspace.jsx')
    const presentation = read('frontend/react/src/components/ReactCruiseLineOperationsWorkspace.jsx')

    expect(demo).toContain('platform-workspace-navigator self-guided-overview ce-command-panel')
    expect(demo).toContain('platform-workspace-step-button secondary-action-button ce-button-secondary')
    expect(demo).toContain('platform-workspace-proof-card self-guided-proof-card ce-command-card')
    expect(passengerBooking).toContain('passenger-booking-workflow ce-command-card ce-surface-dark')
    expect(passengerBooking).toContain('passenger-booking-form ce-editor-card')
    expect(passengerBooking).toContain("import PassengerBookingGuestWorkspace from './PassengerBookingGuestWorkspace.jsx'")
    expect(passengerBooking).toContain('<PassengerBookingGuestWorkspace')
    expect(passengerBookingGuests).toContain('passenger-booking-guests ce-editor-card ce-surface-light')
    expect(passengerBookingComponent).not.toContain("from 'react'")
    expect(passengerBookingState).toContain("import { useEffect, useMemo, useState } from 'react'")
    expect(passengerBooking).toContain('const selectedPrimaryGuestId = selectedCustomer?.id || selectedDemoUser?.customerId ||')
    expect(passengerBooking).toContain('setGuestDrafts(currentGuests =>')
    expect(passengerBookingState).toContain('...currentGuests.slice(1)')
    expect(presentation).toContain('cruise-line-presentation-suite ce-command-panel')
  })


  it('migrates role dashboards and operational workspaces onto reusable CSS foundation primitives', () => {
    const dashboard = [
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
    expect(dashboard).toContain('turnaround-fleet-board ce-command-panel')
    expect(dashboard).toContain('operations-release-board ce-command-panel')
    expect(dashboard).toContain('operations-workspace-shell ce-command-panel')
    expect(dashboard).toContain('operations-role-brief-panel ce-command-panel')
    expect(dashboard).toContain('operations-directory-panel ce-command-panel')
    expect(dashboard).toContain('operations-directory-card ce-command-card')
    expect(dashboard).toContain('operational-command-form ce-editor-card')
    expect(dashboard).toContain('operational-task-detail-form ce-editor-card')
    expect(dashboard).toContain('secondary-action-button compact-button ce-button-secondary')
    expect(dashboard).toContain('operational-task-remove-action')
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

