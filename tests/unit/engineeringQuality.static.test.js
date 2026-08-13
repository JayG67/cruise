const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('Engineering quality and release-integrity contracts', () => {
  test('defines conventional repository editing standards', () => {
    const editorConfig = read('.editorconfig')

    expect(editorConfig).toContain('root = true')
    expect(editorConfig).toContain('charset = utf-8')
    expect(editorConfig).toContain('end_of_line = lf')
    expect(editorConfig).toContain('insert_final_newline = true')
    expect(editorConfig).toContain('trim_trailing_whitespace = true')
  })

  test('provides dependency-free quality and clean-release commands', () => {
    const packageJson = JSON.parse(read('package.json'))

    expect(packageJson.scripts['release:integrity']).toBe('node scripts/verify-release-integrity.js')
    expect(packageJson.scripts['quality:source']).toBe('node scripts/verify-source-quality.js')
    expect(packageJson.scripts['quality:static']).toContain('npm run quality:source')
    expect(packageJson.scripts['release:preflight']).toContain('npm run release:integrity')
    expect(packageJson.scripts['maintenance:check']).toContain('npm run quality:source')
  })

  test('enforces release integrity and source quality in CI', () => {
    const workflow = read('.github/workflows/ci.yml')

    expect(workflow).toContain('name: Verify clean release revision')
    expect(workflow).toContain('run: npm run release:integrity')
    expect(workflow).toContain('name: Verify source quality baseline')
    expect(workflow).toContain('run: npm run quality:source')
  })

  test('freezes architecture hotspot growth until decomposition reduces it', () => {
    const qualityScript = read('scripts/verify-source-quality.js')

    expect(qualityScript).toContain("['controllers/ai.controller.js', 11]")
    expect(qualityScript).toContain("['controllers/aiControllerSupport.js', 29]")
    expect(qualityScript).toContain("['controllers/aiStatus.controller.js', 35]")
    expect(qualityScript).toContain("['controllers/aiBriefing.controller.js', 156]")
    expect(qualityScript).toContain("['controllers/aiEvaluation.controller.js', 149]")
    expect(qualityScript).toContain("['controllers/cruise.controller.js', 284]")
    expect(qualityScript).toContain("['services/turnaroundOperationDetails.service.js', 373]")
    expect(qualityScript).toContain("['services/turnaroundOperationalArtifacts.service.js', 403]")
    expect(qualityScript).toContain("['controllers/fleet.controller.js', 7]")
    expect(qualityScript).toContain("['controllers/cruiseLineManagement.controller.js', 219]")
    expect(qualityScript).toContain("['controllers/shipManagement.controller.js', 194]")
    expect(qualityScript).toContain("['controllers/sailing.controller.js', 9]")
    expect(qualityScript).toContain("['controllers/sailingManagement.controller.js', 138]")
    expect(qualityScript).toContain("['controllers/itineraryQuery.controller.js', 58]")
    expect(qualityScript).toContain("['controllers/itineraryManagement.controller.js', 200]")
    expect(qualityScript).toContain("['controllers/customer.controller.js', 7]")
    expect(qualityScript).toContain("['controllers/customerManagement.controller.js', 230]")
    expect(qualityScript).toContain("['controllers/passengerExperience.controller.js', 323]")
    expect(qualityScript).toContain("['controllers/booking.controller.js', 7]")
    expect(qualityScript).toContain("['controllers/bookingManagement.controller.js', 378]")
    expect(qualityScript).toContain("['controllers/bookingPassenger.controller.js', 154]")
    expect(qualityScript).toContain("['controllers/platformAdministration.controller.js', 7]")
    expect(qualityScript).toContain("['controllers/platformReadiness.controller.js', 259]")
    expect(qualityScript).toContain("['controllers/platformOperationsAdmin.controller.js', 127]")
    expect(qualityScript).toContain("['controllers/turnaroundMutation.controller.js', 21]")
    expect(qualityScript).toContain("['controllers/turnaroundCommand.controller.js', 92]")
    expect(qualityScript).toContain("['controllers/turnaroundEscalation.controller.js', 155]")
    expect(qualityScript).toContain("['controllers/turnaroundWorkforce.controller.js', 249]")
    expect(qualityScript).toContain("['controllers/turnaroundTask.controller.js', 381]")
    expect(qualityScript).toContain("['services/turnaroundMutationSupport.service.js', 103]")
    expect(qualityScript).toContain("['services/bookingDomain.service.js', 299]")
    expect(qualityScript).toContain("['services/bookingPassengerValidation.service.js', 18]")
    expect(qualityScript).toContain("['services/sailingAuditScope.service.js', 46]")
    expect(qualityScript).toContain("['services/fleetHierarchy.service.js', 56]")
    expect(qualityScript).toContain("['services/initializeDatabase.service.js', 379]")
    expect(qualityScript).toContain("['services/databaseIdentityMigration.service.js', 285]")
    expect(qualityScript).toContain("['services/databaseCompatibilityColumns.service.js', 223]")
    expect(qualityScript).toContain("['services/databaseConstraintNormalization.service.js', 278]")
    expect(qualityScript).toContain("['services/databaseEntityMetadataMigration.service.js', 154]")
    expect(qualityScript).toContain("['services/databaseIndexProvisioning.service.js', 295]")
    expect(qualityScript).toContain("['services/loadCruiseData.service.js', 145]")
    expect(qualityScript).toContain("['services/cruiseSeedRows.service.js', 456]")
    expect(qualityScript).toContain("['frontend/react/src/api/client.js', 311]")
    expect(qualityScript).toContain("['frontend/react/src/api/platformClient.js', 137]")
    expect(qualityScript).toContain("['frontend/react/src/api/httpClient.js', 92]")
    expect(qualityScript).toContain("['frontend/react/src/api/turnaroundClient.js', 208]")
    expect(qualityScript).toContain("['frontend/react/src/api/staticFallback.js', 74]")
    expect(qualityScript).toContain("['frontend/react/src/api/staticFallbackData.js', 162]")
    expect(qualityScript).toContain("['frontend/react/src/api/staticFallbackReadiness.js', 59]")
    expect(qualityScript).toContain("['frontend/react/src/components/ReactSqaConsole.jsx', 291]")
    expect(qualityScript).toContain("['frontend/react/src/components/useAiQualityConsoleState.js', 187]")
    expect(qualityScript).toContain("['frontend/react/src/components/QualityValidationWorkspace.jsx', 97]")
    expect(qualityScript).toContain("['frontend/react/src/components/AiQualityEvidenceWorkspace.jsx', 120]")
    expect(qualityScript).toContain("['frontend/react/src/components/AiEvaluationHistoryWorkspace.jsx', 112]")
    expect(qualityScript).toContain("['frontend/react/src/components/AiEvaluationReleaseWorkspace.jsx', 108]")
    expect(qualityScript).toContain("['frontend/react/src/domain/sqaConsole.js', 65]")
    expect(qualityScript).toContain("['frontend/react/src/components/PassengerCruiseBookingWorkflow.jsx', 114]")
    expect(qualityScript).toContain("['frontend/react/src/components/usePassengerBookingWorkflowState.js', 343]")
    expect(qualityScript).toContain("['frontend/react/src/components/PassengerBookingGuestWorkspace.jsx', 109]")
    expect(qualityScript).toContain("['frontend/react/src/components/admin/useCustomerBookingHierarchyState.js', 213]")
    expect(qualityScript).toContain("['frontend/react/src/components/admin/useAdminCustomerBookingMutations.js', 217]")
    expect(qualityScript).toContain("['frontend/react/src/domain/adminCustomerBookingSelectors.js', 179]")
    expect(qualityScript).toContain("['frontend/react/src/domain/passengerBookingWorkflow.js', 231]")
    expect(qualityScript).toContain("['frontend/react/src/components/ReactTurnaroundAdminSetup.jsx', 251]")
    expect(qualityScript).toContain("['frontend/react/src/components/useTurnaroundAdminSetupState.js', 204]")
    expect(qualityScript).toContain("['frontend/react/src/domain/turnaroundAdminWorkspace.js', 231]")
    expect(qualityScript).toContain("['frontend/react/src/components/passenger/RolePassengerSurface.jsx', 128]")
    expect(qualityScript).toContain("['frontend/react/src/components/passenger/PassengerVoyagePlanner.jsx', 170]")
    expect(qualityScript).toContain("['frontend/react/src/components/role-dashboard/RolePassengerSurface.jsx', 1]")
    expect(qualityScript).toContain("['frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx', 330]")
    expect(qualityScript).toContain("['frontend/react/src/components/operations/useOperationalDashboardSelectionState.js', 154]")
    expect(qualityScript).toContain("['frontend/react/src/App.jsx', 324]")
    expect(qualityScript).toContain("['frontend/react/src/hooks/useApplicationWorkspaceNavigation.js', 56]")
    expect(qualityScript).toContain("['frontend/react/src/hooks/useDemoSelectionBridge.js', 61]")
    expect(qualityScript).toContain("['frontend/react/src/components/operations/operationalDashboardNavigation.js', 30]")
    expect(qualityScript).toContain("['frontend/react/src/components/operations/OperationalCommandOverviewPanel.jsx', 65]")
    expect(qualityScript).toContain("['frontend/react/src/domain/operationalDashboardWorkspace.js', 184]")
    expect(qualityScript).toContain("['frontend/react/src/components/operations/useOperationalDashboardDrafts.js', 252]")
    expect(qualityScript).toContain("['frontend/react/src/components/operations/useKeyedDrafts.js', 34]")
    expect(qualityScript).toContain("['frontend/react/src/domain/operationalDashboardDrafts.js', 98]")
    expect(qualityScript).toContain("['frontend/react/src/components/ReactCruiseLineOperationsWorkspace.jsx', 164]")
    expect(qualityScript).toContain("['frontend/react/src/domain/cruiseLineOperations.js', 82]")
    expect(qualityScript).toContain("['frontend/react/src/domain/cruiseLineOperationsData.js', 252]")
    expect(qualityScript).toContain("['frontend/react/src/domain/cruiseLineCommercialOperations.js', 148]")
    expect(qualityScript).toContain("['tests/unit/reactComponentContracts.static.test.js', 1254]")
    expect(qualityScript).toContain("['tests/unit/reactAccessibilityPresentationContracts.static.test.js', 872]")
    expect(qualityScript).toContain("['tests/unit/operationalPresentationContracts.static.test.js', 275]")
    expect(qualityScript).toContain("['tests/unit/operationalContrastContracts.static.test.js', 479]")
    expect(qualityScript).toContain("['tests/unit/dataArchitecture.static.test.js', 1259]")
    expect(qualityScript).toContain("['tests/unit/dataArchitecturePhaseOneContracts.static.test.js', 358]")
    expect(qualityScript).toContain('future hardening slices must reduce them rather than raise them')
  })



  test('separates cruise-line operations modeling from React rendering', () => {
    const component = read('frontend/react/src/components/ReactCruiseLineOperationsWorkspace.jsx')
    const domain = read('frontend/react/src/domain/cruiseLineOperations.js')
    const operationsData = read('frontend/react/src/domain/cruiseLineOperationsData.js')
    const commercialOperations = read('frontend/react/src/domain/cruiseLineCommercialOperations.js')

    expect(component).toContain("from '../domain/cruiseLineOperations.js'")
    expect(component).not.toContain('function buildLineMetrics')
    expect(component).not.toContain('function buildBookingDerivedShips')
    expect(component).not.toContain('const demoFlow = useMemo')
    expect(component).not.toContain('const revenueMix = useMemo')
    expect(domain).toContain("from './cruiseLineOperationsData.js'")
    expect(domain).toContain("from './cruiseLineCommercialOperations.js'")
    expect(operationsData).toContain('function buildBookingDerivedShips')
    expect(operationsData).toContain('function buildFallbackItinerary')
    expect(operationsData).toContain('function buildLineMetrics')
    expect(operationsData).toContain('function getPortsForLine')
    expect(commercialOperations).toContain('function buildRevenueMix')
    expect(commercialOperations).toContain('function buildSailingRevenueBoard')
    expect(commercialOperations).toContain('function buildPortOperationsPlan')
  })


  test('separates operational dashboard workspace calculations from React rendering', () => {
    const component = read('frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx')
    const domain = read('frontend/react/src/domain/operationalDashboardWorkspace.js')

    expect(component).toContain("from '../../domain/operationalDashboardWorkspace.js'")
    expect(component).toContain('buildOperationalWorkspaceModel({')
    expect(component).not.toContain('const operationReleaseScore = Math.round')
    expect(component).not.toContain("label: 'Task execution'")
    expect(domain).toContain('export function buildOperationalWorkspaceModel')
    expect(domain).toContain('function buildOperationReleaseScore')
    expect(domain).toContain('function buildReleaseBoardItems')
    expect(domain).toContain('function buildStaffingSummary')
  })


  test('separates passenger-booking transformation rules from React rendering', () => {
    const component = [
      read('frontend/react/src/components/PassengerCruiseBookingWorkflow.jsx'),
      read('frontend/react/src/components/usePassengerBookingWorkflowState.js')
    ].join('\n')
    const domain = read('frontend/react/src/domain/passengerBookingWorkflow.js')

    expect(component).toContain("from '../domain/passengerBookingWorkflow.js'")
    expect(component).not.toContain('function buildFareOptionsForShip')
    expect(component).not.toContain('function buildCustomerFinderOption')
    expect(domain).toContain('export function buildFareOptionsForShip')
    expect(domain).toContain('export function buildCustomerFinderOption')
    expect(domain).toContain('export function buildPrimaryGuestDraft')
    expect(domain).toContain('export function normalizeGuestPayload')
  })


  test('separates turnaround staffing rules from React rendering', () => {
    const component = [
      read('frontend/react/src/components/ReactTurnaroundAdminSetup.jsx'),
      read('frontend/react/src/components/useTurnaroundAdminSetupState.js')
    ].join('\n')
    const domain = read('frontend/react/src/domain/turnaroundAdminWorkspace.js')

    expect(component).toContain("from '../domain/turnaroundAdminWorkspace.js'")
    expect(component).not.toContain('function buildTurnaroundTeamWorkspace')
    expect(component).not.toContain('function buildRosterGroups')
    expect(domain).toContain('export function buildTurnaroundTeamWorkspace')
    expect(domain).toContain('export function buildRosterGroups')
    expect(domain).toContain('export function buildSameDayConflicts')
    expect(domain).toContain('export function getAssignmentPort')
  })

  test('separates quality-console transformation rules from React rendering', () => {
    const component = [
      read('frontend/react/src/components/ReactSqaConsole.jsx'),
      read('frontend/react/src/components/useAiQualityConsoleState.js')
    ].join('\n')
    const domain = read('frontend/react/src/domain/sqaConsole.js')

    expect(component).toContain("from '../domain/sqaConsole.js'")
    expect(component).toContain('filterAndSortAiRuns(aiQualitySummary?.runs')
    expect(component).not.toContain('const normalizedSearch = aiHistorySearch.trim().toLowerCase()')
    expect(domain).toContain('export function buildPendingReadinessChecklist()')
    expect(domain).toContain('export function buildReadinessChecklist(result = {})')
    expect(domain).toContain('export function filterAndSortAiRuns(runs = [], filters = {})')
    expect(domain).toContain('export function getAiHistoryProviders(runs = [])')
  })


  test('separates database constraints and temporal normalization from schema initialization', () => {
    const initializer = read('services/initializeDatabase.service.js')
    const compatibilityColumns = read('services/databaseCompatibilityColumns.service.js')
    const identityMigration = read('services/databaseIdentityMigration.service.js')
    const constraintNormalization = read('services/databaseConstraintNormalization.service.js')

    expect(initializer).toContain("require('./databaseCompatibilityColumns.service')")
    expect(initializer).toContain('await applyDatabaseCompatibilityColumns(db)')
    expect(initializer).not.toContain('ALTER TABLE cruise_lines ADD COLUMN IF NOT EXISTS \"brandFamily\"')
    expect(compatibilityColumns).toContain('ALTER TABLE cruise_lines ADD COLUMN IF NOT EXISTS \"brandFamily\"')
    expect(compatibilityColumns).toContain('ALTER TABLE demo_users ADD COLUMN IF NOT EXISTS \"assignedSailingId\"')
    expect(initializer).toContain("require('./databaseConstraintNormalization.service')")
    expect(initializer).toContain('await applyDatabaseConstraintsAndTemporalNormalization(db)')
    expect(initializer).not.toContain('chk_bookings_booking_status')
    expect(initializer).not.toContain('SET "departureDateValue" = "departureDate"::date')
    expect(constraintNormalization).toContain('async function applyDatabaseConstraintsAndTemporalNormalization(db)')
    expect(constraintNormalization).toContain('chk_bookings_booking_status')
    expect(constraintNormalization).toContain('chk_turnaround_handoff_roles')
    expect(constraintNormalization).toContain('SET "departureDateValue" = "departureDate"::date')
    expect(constraintNormalization).toContain('SET "completedAtTimestamp" = "completedAt"::timestamptz')
  })


  test('separates cruise seed row construction from transactional persistence', () => {
    const loader = read('services/loadCruiseData.service.js')
    const rowBuilder = read('services/cruiseSeedRows.service.js')

    expect(loader).toContain("require('./cruiseSeedRows.service')")
    expect(loader).toContain('const rows = buildSeedRows(cruiseData)')
    expect(loader).not.toContain('function buildSeedRows')
    expect(rowBuilder).toContain('function buildSeedRows(cruiseData)')
    expect(rowBuilder).toContain('module.exports = { buildSeedRows }')
    expect(rowBuilder).not.toContain('id: sailingId,\n          id: sailingId,')
    expect(loader).not.toContain('await tx.delete(turnaroundTaskTable)\n    await tx.delete(turnaroundTaskTable)')
  })

  test('separates durable entity metadata migration from schema initialization', () => {
    const initializer = read('services/initializeDatabase.service.js')
    const metadataMigration = read('services/databaseEntityMetadataMigration.service.js')
    const indexProvisioning = read('services/databaseIndexProvisioning.service.js')

    expect(initializer).toContain("require('./databaseEntityMetadataMigration.service')")
    expect(initializer).toContain('await migrateDatabaseEntityMetadata(db)')
    expect(initializer).not.toContain('ALTER TABLE customers ADD COLUMN IF NOT EXISTS "customerUuid"')
    expect(initializer).not.toContain('ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "createdAtTimestamp"')
    expect(metadataMigration).toContain('async function migrateDatabaseEntityMetadata(db)')
    expect(metadataMigration).toContain('ALTER TABLE customers ADD COLUMN IF NOT EXISTS "customerUuid"')
    expect(metadataMigration).toContain('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "bookingUuid"')
    expect(metadataMigration).toContain('ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "createdAtTimestamp"')
    expect(metadataMigration).toContain('UPDATE bookings')
    expect(indexProvisioning).toContain('idx_customers_customer_uuid')
    expect(indexProvisioning).toContain('idx_bookings_booking_uuid')
  })

  test('separates database index provisioning from schema initialization', () => {
    const initializer = read('services/initializeDatabase.service.js')
    const indexProvisioning = read('services/databaseIndexProvisioning.service.js')

    expect(initializer).toContain("require('./databaseIndexProvisioning.service')")
    expect(initializer).toContain('await provisionDatabaseIndexes(db)')
    expect(initializer).not.toContain('idx_turnaround_operations_sailing_status')
    expect(indexProvisioning).toContain('async function provisionDatabaseIndexes(db)')
    expect(indexProvisioning).toContain('idx_booking_passengers_uuid')
    expect(indexProvisioning).toContain('idx_turnaround_operations_sailing_status')
  })

  test('keeps the passenger role surface canonical instead of duplicating implementations', () => {
    const canonicalSurface = read('frontend/react/src/components/passenger/RolePassengerSurface.jsx')
    const voyagePlanner = read('frontend/react/src/components/passenger/PassengerVoyagePlanner.jsx')
    const compatibilitySurface = read('frontend/react/src/components/role-dashboard/RolePassengerSurface.jsx')

    expect(canonicalSurface).toContain('export function PassengerProfile')
    expect(canonicalSurface).toContain("export { default as PassengerVoyagePlanner } from './PassengerVoyagePlanner.jsx'")
    expect(canonicalSurface).not.toContain('function RoleBookingCard')
    expect(voyagePlanner).toContain('export default function PassengerVoyagePlanner')
    expect(compatibilitySurface.trim()).toBe(
      "export { PassengerProfile, PassengerVoyagePlanner } from '../passenger/RolePassengerSurface.jsx'"
    )
    expect(compatibilitySurface).not.toContain('function PassengerProfile')
    expect(compatibilitySurface).not.toContain('function PassengerVoyagePlanner')
  })

  test('keeps source-quality validation focused on executable and configuration source files', () => {
    const sourceAudit = read('scripts/verify-source-quality.js')

    for (const extension of ["'.js'", "'.jsx'", "'.json'", "'.css'", "'.yml'", "'.yaml'", "'.html'"]) {
      expect(sourceAudit).toContain(extension)
    }
  })
  it('keeps role selector transformations outside the React rendering component', () => {
    const selector = read('frontend/react/src/components/ReactRoleSelector.jsx')
    const operationalWorkspace = read('frontend/react/src/components/OperationalRoleSelectorWorkspace.jsx')
    const passengerWorkspace = read('frontend/react/src/components/PassengerRoleSelectorWorkspace.jsx')
    const selectorDomain = read('frontend/react/src/domain/roleSelectorOptions.js')
    const sourceAudit = read('scripts/verify-source-quality.js')

    expect(selector).toContain("from '../domain/roleSelectorOptions.js'")
    expect(selector).not.toContain('function buildPassengerOption')
    expect(selector).not.toContain('function condenseWorkspaceUserOptions')
    expect(selector).toContain("from './OperationalRoleSelectorWorkspace.jsx'")
    expect(selector).toContain("from './PassengerRoleSelectorWorkspace.jsx'")
    expect(selector).toContain('<OperationalRoleSelectorWorkspace')
    expect(selector).toContain('<PassengerRoleSelectorWorkspace')
    expect(selector).not.toContain('react-operational-person-filter-panel')
    expect(selector).not.toContain('react-passenger-finder-panel')
    expect(operationalWorkspace).toContain('react-operational-person-filter-panel')
    expect(passengerWorkspace).toContain('react-passenger-finder-panel')
    expect(selectorDomain).toContain('export function buildPassengerOption')
    expect(selectorDomain).toContain('export function getPassengerFilterOptions')
    expect(selectorDomain).toContain('export function getOperationalAssignmentContext')
    expect(selectorDomain).toContain('export function getRoleSummary')
    expect(sourceAudit).toContain("['frontend/react/src/components/ReactRoleSelector.jsx', 242]")
    expect(sourceAudit).toContain("['frontend/react/src/components/useRoleSelectorState.js', 247]")
    expect(sourceAudit).toContain("['frontend/react/src/components/PassengerRoleSelectorWorkspace.jsx', 105]")
    expect(sourceAudit).toContain("['frontend/react/src/components/OperationalRoleSelectorWorkspace.jsx', 141]")
    expect(sourceAudit).toContain("['frontend/react/src/domain/roleSelectorOptions.js', 262]")
  })


  it('keeps role-view identity, passenger, and operational rules in focused domain owners', () => {
    const facade = read('frontend/react/src/domain/roleView.js')
    const sourceAudit = read('scripts/verify-source-quality.js')

    expect(facade).toContain("export * from './roleIdentity.js'")
    expect(facade).toContain("export * from './rolePassenger.js'")
    expect(facade).toContain("export * from './roleOperations.js'")
    expect(sourceAudit).toContain("['frontend/react/src/domain/roleView.js', 4]")
    expect(sourceAudit).toContain("['frontend/react/src/domain/roleIdentity.js', 101]")
    expect(sourceAudit).toContain("['frontend/react/src/domain/rolePassenger.js', 54]")
    expect(sourceAudit).toContain("['frontend/react/src/domain/roleOperations.js', 2]")
    expect(sourceAudit).toContain("['frontend/react/src/domain/roleOperationalAssignments.js', 193]")
    expect(sourceAudit).toContain("['frontend/react/src/domain/roleOperationalCommandCenters.js', 148]")
    expect(sourceAudit).toContain("['frontend/react/src/domain/roleOperationalReadiness.js', 109]")
  })


  it('keeps operational dashboard support concerns in focused owners', () => {
    const facade = read('frontend/react/src/components/operations/operationalDashboardUtils.js')
    const sourceAudit = read('scripts/verify-source-quality.js')

    expect(facade).toContain("export * from './operationalDashboardLabels.js'")
    expect(facade).toContain("export * from './operationalDashboardReadiness.js'")
    expect(facade).toContain("export * from './operationalDashboardFormatting.js'")
    expect(sourceAudit).toContain("['frontend/react/src/components/operations/operationalDashboardUtils.js', 3]")
    expect(sourceAudit).toContain("['frontend/react/src/components/operations/operationalDashboardLabels.js', 75]")
    expect(sourceAudit).toContain("['frontend/react/src/components/operations/operationalDashboardReadiness.js', 157]")
    expect(sourceAudit).toContain("['frontend/react/src/components/operations/operationalDashboardFormatting.js', 39]")
  })

})
