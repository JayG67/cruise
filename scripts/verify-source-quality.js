const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const projectRoot = path.resolve(__dirname, '..')
const ignoredDirectories = new Set([
  '.git',
  '.lighthouseci',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'github-pages',
  'lhci-report',
  'lighthouse-report',
  'logs',
  'playwright-report',
  'test-results'
])

const textExtensions = new Set(['.js', '.jsx', '.json', '.md', '.css', '.yml', '.yaml', '.html'])
const architectureBudgets = new Map([
  ['controllers/fleet.controller.js', 7],
  ['controllers/cruiseLineManagement.controller.js', 219],
  ['controllers/shipManagement.controller.js', 194],
  ['controllers/sailing.controller.js', 9],
  ['controllers/sailingManagement.controller.js', 138],
  ['controllers/itineraryQuery.controller.js', 58],
  ['controllers/itineraryManagement.controller.js', 200],
  ['controllers/customer.controller.js', 7],
  ['controllers/customerManagement.controller.js', 230],
  ['controllers/passengerExperience.controller.js', 323],
  ['controllers/booking.controller.js', 7],
  ['controllers/bookingManagement.controller.js', 378],
  ['controllers/bookingPassenger.controller.js', 154],
  ['controllers/platformAdministration.controller.js', 7],
  ['controllers/platformReadiness.controller.js', 259],
  ['controllers/platformOperationsAdmin.controller.js', 127],
  ['controllers/turnaroundMutation.controller.js', 21],
  ['controllers/turnaroundCommand.controller.js', 92],
  ['controllers/turnaroundEscalation.controller.js', 155],
  ['controllers/turnaroundWorkforce.controller.js', 249],
  ['controllers/turnaroundTask.controller.js', 381],
  ['services/turnaroundMutationSupport.service.js', 103],
  ['services/sailingAuditScope.service.js', 46],
  ['services/bookingDomain.service.js', 299],
  ['services/bookingPassengerValidation.service.js', 18],
  ['services/fleetHierarchy.service.js', 56],
  ['services/initializeDatabase.service.js', 379],
  ['services/databaseIdentityMigration.service.js', 285],
  ['services/databaseCompatibilityColumns.service.js', 223],
  ['services/databaseConstraintNormalization.service.js', 278],
  ['services/databaseEntityMetadataMigration.service.js', 154],
  ['services/databaseIndexProvisioning.service.js', 295],
  ['services/loadCruiseData.service.js', 145],
  ['services/cruiseSeedRows.service.js', 456],
  ['controllers/ai.controller.js', 11],
  ['controllers/aiControllerSupport.js', 29],
  ['controllers/aiStatus.controller.js', 35],
  ['controllers/aiBriefing.controller.js', 156],
  ['controllers/aiEvaluation.controller.js', 149],
  ['controllers/cruise.controller.js', 284],
  ['services/turnaroundOperationDetails.service.js', 373],
  ['services/turnaroundOperationalArtifacts.service.js', 403],
  ['frontend/react/src/api/client.js', 311],
  ['frontend/react/src/api/platformClient.js', 137],
  ['frontend/react/src/api/httpClient.js', 92],
  ['frontend/react/src/api/turnaroundClient.js', 208],
  ['frontend/react/src/api/staticFallback.js', 74],
  ['frontend/react/src/api/staticFallbackData.js', 162],
  ['frontend/react/src/api/staticFallbackReadiness.js', 59],
  ['frontend/react/src/App.jsx', 324],
  ['frontend/react/src/hooks/useApplicationWorkspaceNavigation.js', 56],
  ['frontend/react/src/hooks/useDemoSelectionBridge.js', 61],
  ['frontend/react/src/components/ReactRoleSelector.jsx', 242],
  ['frontend/react/src/components/useRoleSelectorState.js', 247],
  ['frontend/react/src/components/PassengerRoleSelectorWorkspace.jsx', 105],
  ['frontend/react/src/components/OperationalRoleSelectorWorkspace.jsx', 141],
  ['frontend/react/src/domain/roleSelectorOptions.js', 262],
  ['frontend/react/src/domain/roleView.js', 4],
  ['frontend/react/src/domain/roleIdentity.js', 101],
  ['frontend/react/src/domain/rolePassenger.js', 54],
  ['frontend/react/src/domain/roleOperations.js', 2],
  ['frontend/react/src/domain/roleOperationalAssignments.js', 193],
  ['frontend/react/src/domain/roleOperationalCommandCenters.js', 148],
  ['frontend/react/src/domain/roleOperationalReadiness.js', 109],
  ['frontend/react/src/components/operations/operationalDashboardUtils.js', 3],
  ['frontend/react/src/components/operations/operationalDashboardLabels.js', 75],
  ['frontend/react/src/components/operations/operationalDashboardReadiness.js', 157],
  ['frontend/react/src/components/operations/operationalDashboardFormatting.js', 39],
  ['frontend/react/src/components/ReactSqaConsole.jsx', 291],
  ['frontend/react/src/components/useAiQualityConsoleState.js', 187],
  ['frontend/react/src/components/QualityValidationWorkspace.jsx', 97],
  ['frontend/react/src/components/AiQualityEvidenceWorkspace.jsx', 120],
  ['frontend/react/src/components/AiEvaluationHistoryWorkspace.jsx', 112],
  ['frontend/react/src/components/AiEvaluationReleaseWorkspace.jsx', 108],
  ['frontend/react/src/domain/sqaConsole.js', 65],
  ['frontend/react/src/components/PassengerCruiseBookingWorkflow.jsx', 114],
  ['frontend/react/src/components/usePassengerBookingWorkflowState.js', 343],
  ['frontend/react/src/components/PassengerBookingGuestWorkspace.jsx', 109],
  ['frontend/react/src/components/admin/useCustomerBookingHierarchyState.js', 213],
  ['frontend/react/src/components/admin/useAdminCustomerBookingMutations.js', 217],
  ['frontend/react/src/domain/adminCustomerBookingSelectors.js', 179],
  ['frontend/react/src/components/ReactTurnaroundAdminSetup.jsx', 251],
  ['frontend/react/src/components/useTurnaroundAdminSetupState.js', 204],
  ['frontend/react/src/domain/turnaroundAdminWorkspace.js', 231],
  ['frontend/react/src/domain/passengerBookingWorkflow.js', 231],
  ['frontend/react/src/components/passenger/RolePassengerSurface.jsx', 128],
  ['frontend/react/src/components/passenger/PassengerVoyagePlanner.jsx', 170],
  ['frontend/react/src/components/role-dashboard/RolePassengerSurface.jsx', 1],
  ['frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx', 330],
  ['frontend/react/src/components/operations/useOperationalDashboardSelectionState.js', 154],
  ['frontend/react/src/components/operations/operationalDashboardNavigation.js', 30],
  ['frontend/react/src/components/operations/OperationalCommandOverviewPanel.jsx', 65],
  ['frontend/react/src/domain/operationalDashboardWorkspace.js', 184],
  ['frontend/react/src/components/operations/useOperationalDashboardDrafts.js', 252],
  ['frontend/react/src/components/operations/useKeyedDrafts.js', 34],
  ['frontend/react/src/components/fleet/useFleetItineraryActions.js', 236],
  ['frontend/react/src/components/fleet/fleetItineraryActionLifecycle.js', 30],
  ['frontend/react/src/domain/operationalDashboardDrafts.js', 98],
  ['frontend/react/src/components/ReactCruiseLineOperationsWorkspace.jsx', 164],
  ['frontend/react/src/domain/cruiseLineOperations.js', 82],
  ['frontend/react/src/domain/cruiseLineOperationsData.js', 252],
  ['frontend/react/src/domain/cruiseLineCommercialOperations.js', 148],
  ['tests/unit/reactComponentContracts.static.test.js', 1254],
  ['tests/unit/reactAccessibilityPresentationContracts.static.test.js', 872],
  ['tests/unit/operationalPresentationContracts.static.test.js', 275],
  ['tests/unit/operationalContrastContracts.static.test.js', 479],
  ['tests/unit/dataArchitecture.static.test.js', 1259],
  ['tests/unit/dataArchitecturePhaseOneContracts.static.test.js', 358]
])

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '__MACOSX') continue
    const absolutePath = path.join(directory, entry.name)
    const relativePath = path.relative(projectRoot, absolutePath).split(path.sep).join('/')

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) walk(absolutePath, files)
      continue
    }

    if (textExtensions.has(path.extname(entry.name))) files.push(relativePath)
  }
  return files
}

function lineCount(content) {
  if (!content) return 0
  return content.split(/\r?\n/).length - (content.endsWith('\n') ? 1 : 0)
}

function checkNodeSyntax(relativePath, failures) {
  if (path.extname(relativePath) !== '.js') return
  if (relativePath.startsWith('frontend/react/')) return
  if (relativePath.startsWith('public/')) return
  if (relativePath.startsWith('performance/')) return

  try {
    execFileSync(process.execPath, ['--check', relativePath], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    })
  } catch (error) {
    failures.push(`${relativePath}: JavaScript syntax validation failed`)
  }
}

function main() {
  const files = walk(projectRoot).sort()
  const failures = []

  for (const relativePath of files) {
    const absolutePath = path.join(projectRoot, relativePath)
    const content = fs.readFileSync(absolutePath, 'utf8')

    if (/^(<<<<<<<|=======|>>>>>>>)/m.test(content)) {
      failures.push(`${relativePath}: unresolved merge-conflict marker`)
    }

    if (content.charCodeAt(0) === 0xfeff) {
      failures.push(`${relativePath}: UTF-8 byte-order mark is not allowed`)
    }


    checkNodeSyntax(relativePath, failures)
  }

  for (const [relativePath, maximumLines] of architectureBudgets.entries()) {
    const absolutePath = path.join(projectRoot, relativePath)
    if (!fs.existsSync(absolutePath)) {
      failures.push(`${relativePath}: architecture-budget file is missing`)
      continue
    }

    const actualLines = lineCount(fs.readFileSync(absolutePath, 'utf8'))
    if (actualLines > maximumLines) {
      failures.push(`${relativePath}: ${actualLines} lines exceeds the frozen ${maximumLines}-line baseline`)
    }
  }

  if (failures.length > 0) {
    console.error('Source quality baseline failed:')
    failures.forEach(failure => console.error(`- ${failure}`))
    process.exitCode = 1
    return
  }

  console.log('Source quality baseline passed.')
  console.log(`Text source files inspected: ${files.length}`)
  console.log(`Architecture growth budgets enforced: ${architectureBudgets.size}`)
  console.log('Large-file budgets are frozen baselines; future hardening slices must reduce them rather than raise them.')
}

main()
