const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

const obsoleteStandaloneFiles = [
  '.github/package.json',
  'playwright/support/initializeDatabase.service.js',
  'frontend/react/src/components/fleet/ReactFleetShipSailingPanel.jsx',
  'sql/remove-leftover-created-cruise-lines.sql',
  'scripts/print-db-connection.js',
  'frontend/react/src/components/ReactDeploymentReadinessCenter.jsx',
  'frontend/react/src/components/ReactProductionHardeningCenter.jsx',
  'frontend/react/src/components/ReactDataArchitectureReadinessCenter.jsx',
  'frontend/react/src/components/ReactPublicLaunchControlCenter.jsx',
  'frontend/react/src/styles/components/readiness-deployment.css',
  'frontend/react/src/styles/components/readiness-production-hardening.css',
  'frontend/react/src/styles/components/readiness-data-architecture.css',
  'frontend/react/src/styles/components/readiness-public-launch.css',
  'frontend/react/src/components/operations/OperationsDormantReadinessPanels.jsx',
  'frontend/react/src/styles/components/operations-evidence-production-readiness.css',
  'frontend/react/src/styles/components/operations-evidence-operational-release-dossier.css',
  'frontend/react/src/styles/components/operations-evidence-reviewer-packet.css',
  'frontend/react/src/styles/components/operations-continuity-reviewer.css',
  'frontend/react/src/styles/components/operations-continuity-hidden-panels.css',
  'frontend/react/src/styles/components/operations-evidence-management-status.css',
  'frontend/react/src/styles/components/operations-evidence-launch-plan.css',
  'tests/unit/operationalLanguage.static.test.js',
  'tests/unit/cruiseLinePresentationSuite.static.test.js',
  'frontend/react/src/components/ReactCruiseLinePresentationSuite.jsx',
  'frontend/react/src/domain/cruiseLinePresentation.js',
  'frontend/react/src/styles/components/admin-presentation.css',
  'frontend/react/src/styles/components/admin-presentation-layout.css',
  'frontend/react/src/styles/components/admin-presentation-header.css',
  'frontend/react/src/styles/components/admin-presentation-panels.css',
  'frontend/react/src/styles/components/admin-presentation-controls.css',
  'frontend/react/src/styles/components/admin-presentation-control-polish.css',
  'frontend/react/src/styles/components/admin-presentation-hero-controls.css'
]

const obsoleteMisplacedFiles = [
  {
    misplaced: 'frontend/react/src/styles/components/passenger/RoleBookingCard.jsx',
    canonical: 'frontend/react/src/components/passenger/RoleBookingCard.jsx'
  },
  {
    misplaced: 'frontend/react/src/styles/components/passenger/RoleBookingList.jsx',
    canonical: 'frontend/react/src/components/passenger/RoleBookingList.jsx'
  },
  {
    misplaced: 'frontend/react/src/styles/components/passenger/RolePassengerSurface.jsx',
    canonical: 'frontend/react/src/components/passenger/RolePassengerSurface.jsx'
  }
]

function removeVerifiedDuplicate({ misplaced, canonical }) {
  const misplacedPath = path.join(projectRoot, misplaced)
  const canonicalPath = path.join(projectRoot, canonical)

  if (!fs.existsSync(misplacedPath)) return false

  if (!fs.existsSync(canonicalPath)) {
    throw new Error(`Refusing to remove ${misplaced}: canonical source is missing at ${canonical}.`)
  }

  fs.rmSync(misplacedPath, { force: true })
  console.log(`Removed misplaced duplicate ${misplaced}`)
  return true
}

function removeEmptyParentDirectories(relativeFilePath) {
  const stylesRoot = path.join(projectRoot, 'frontend/react/src/styles')
  let directory = path.dirname(path.join(projectRoot, relativeFilePath))

  while (directory.startsWith(stylesRoot) && directory !== stylesRoot) {
    if (!fs.existsSync(directory) || fs.readdirSync(directory).length > 0) return
    fs.rmdirSync(directory)
    console.log(`Removed empty directory ${path.relative(projectRoot, directory)}`)
    directory = path.dirname(directory)
  }
}

let removed = 0
for (const relativePath of obsoleteStandaloneFiles) {
  const absolutePath = path.join(projectRoot, relativePath)
  if (!fs.existsSync(absolutePath)) continue
  fs.rmSync(absolutePath, { force: true })
  removed += 1
  console.log(`Removed obsolete standalone file ${relativePath}`)

  const parentDirectory = path.dirname(absolutePath)
  if (parentDirectory !== projectRoot && fs.existsSync(parentDirectory) && fs.readdirSync(parentDirectory).length === 0) {
    fs.rmdirSync(parentDirectory)
    console.log(`Removed empty directory ${path.relative(projectRoot, parentDirectory)}`)
  }
}

for (const entry of obsoleteMisplacedFiles) {
  if (removeVerifiedDuplicate(entry)) {
    removed += 1
    removeEmptyParentDirectories(entry.misplaced)
  }
}

console.log(`Repository structure repair complete. Removed ${removed} obsolete or misplaced files.`)
