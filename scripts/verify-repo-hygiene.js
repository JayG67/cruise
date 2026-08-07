const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const projectRoot = path.resolve(__dirname, '..')

const generatedArtifactPatterns = [
  /^dist\//,
  /^build\//,
  /^coverage\//,
  /^lhci-report\//,
  /^\.lighthouseci\//,
  /^github-pages\//,
  /^playwright-report\//,
  /^test-results\//,
  /^logs\//,
  /^cypress\/(screenshots|videos)\//,
  /^lighthouse-report\.report\.(html|json)$/,
  /(^|\/)\.DS_Store$/
]

const prohibitedTrackedFiles = new Map([
  ['.github/package.json', 'The repository root package.json is the only application package manifest.'],
  ['playwright/support/initializeDatabase.service.js', 'Playwright support must reuse the production database bootstrap instead of owning a stale schema copy.'],
  ['frontend/react/src/components/fleet/ReactFleetShipSailingPanel.jsx', 'The fleet directory uses separate ship and sailing panels; the combined legacy panel is dead code.'],
  ['sql/remove-leftover-created-cruise-lines.sql', 'One-time cleanup SQL is not maintained product source; operational data repair belongs in reviewed migrations or documented runbooks.'],
  ['scripts/print-db-connection.js', 'Unreferenced connection-print diagnostics are not part of the supported operational command surface.'],
  ['frontend/react/src/components/ReactDeploymentReadinessCenter.jsx', 'Deployment readiness remains available through the platform API; the unmounted standalone React workspace is dead UI code.'],
  ['frontend/react/src/components/ReactProductionHardeningCenter.jsx', 'Production assurance remains available through the platform API; the unmounted standalone React workspace is dead UI code.'],
  ['frontend/react/src/components/ReactDataArchitectureReadinessCenter.jsx', 'Data governance remains available through the platform API; the unmounted standalone React workspace is dead UI code.'],
  ['frontend/react/src/components/ReactPublicLaunchControlCenter.jsx', 'Public launch readiness remains available through the platform API; the unmounted standalone React workspace is dead UI code.'],
  ['frontend/react/src/styles/components/readiness-deployment.css', 'Styles dedicated to the retired deployment readiness workspace are dead CSS.'],
  ['frontend/react/src/styles/components/readiness-production-hardening.css', 'Styles dedicated to the retired production-hardening workspace are dead CSS.'],
  ['frontend/react/src/styles/components/readiness-data-architecture.css', 'Styles dedicated to the retired data-architecture workspace are dead CSS.'],
  ['frontend/react/src/styles/components/readiness-public-launch.css', 'Styles dedicated to the retired public-launch workspace are dead CSS.'],
  ['frontend/react/src/components/operations/OperationsDormantReadinessPanels.jsx', 'The dormant readiness panel is retired dead UI and must not return.'],
  ['frontend/react/src/styles/components/operations-evidence-production-readiness.css', 'Styles dedicated to the retired dormant readiness panel are dead CSS.'],
  ['frontend/react/src/styles/components/operations-evidence-operational-release-dossier.css', 'Styles dedicated to the retired dormant release dossier are dead CSS.'],
  ['frontend/react/src/styles/components/operations-evidence-reviewer-packet.css', 'Styles dedicated to the retired reviewer packet are dead CSS.'],
  ['frontend/react/src/styles/components/operations-continuity-reviewer.css', 'Styles dedicated to the retired reviewer continuity surface are dead CSS.'],
  ['tests/unit/operationalLanguage.static.test.js', 'The duplicate operational-language test is retired; the consolidated production audit is authoritative.'],
  ['tests/unit/cruiseLinePresentationSuite.static.test.js', 'The cruise-line operations workspace uses the operationally named static contract; the presentation-named test is retired.'],
  ['frontend/react/src/styles/components/admin-presentation.css', 'The cruise-line operations workspace uses the operational stylesheet boundary; the presentation-named stylesheet is retired.'],
  ['frontend/react/src/styles/components/admin-presentation-layout.css', 'The cruise-line operations workspace uses the operational stylesheet boundary; the presentation-named stylesheet is retired.'],
  ['frontend/react/src/styles/components/admin-presentation-header.css', 'The cruise-line operations workspace uses the operational stylesheet boundary; the presentation-named stylesheet is retired.'],
  ['frontend/react/src/styles/components/admin-presentation-panels.css', 'The cruise-line operations workspace uses the operational stylesheet boundary; the presentation-named stylesheet is retired.'],
  ['frontend/react/src/styles/components/admin-presentation-controls.css', 'The cruise-line operations workspace uses the operational stylesheet boundary; the presentation-named stylesheet is retired.'],
  ['frontend/react/src/styles/components/admin-presentation-control-polish.css', 'The cruise-line operations workspace uses the operational stylesheet boundary; the presentation-named stylesheet is retired.'],
  ['frontend/react/src/styles/components/admin-presentation-hero-controls.css', 'The cruise-line operations workspace uses the operational stylesheet boundary; the presentation-named stylesheet is retired.']
])

const sourcePlacementRules = [
  {
    root: 'frontend/react/src/styles/',
    allowedExtensions: new Set(['.css']),
    description: 'React styles directories may contain CSS files only.'
  }
]

function getTrackedFiles() {
  try {
    return execFileSync('git', ['ls-files'], { cwd: projectRoot, encoding: 'utf8' })
      .split(/\r?\n/)
      .filter(Boolean)
  } catch (err) {
    console.error('Unable to inspect tracked files with git ls-files.')
    console.error(err.message)
    process.exitCode = 1
    return []
  }
}

function isGeneratedArtifact(filePath) {
  return generatedArtifactPatterns.some(pattern => pattern.test(filePath))
}

function getSourcePlacementViolations(trackedFiles) {
  return trackedFiles.flatMap(filePath => sourcePlacementRules
    .filter(rule => fs.existsSync(path.join(projectRoot, filePath)))
    .filter(rule => filePath.startsWith(rule.root))
    .filter(rule => !rule.allowedExtensions.has(path.extname(filePath)))
    .map(rule => ({ filePath, description: rule.description })))
}

function main() {
  const trackedFiles = getTrackedFiles()
  const trackedArtifacts = trackedFiles.filter(isGeneratedArtifact)

  if (trackedArtifacts.length > 0) {
    console.error('Generated/local artifact files are tracked by Git:')
    trackedArtifacts.forEach(filePath => console.error(`- ${filePath}`))
    console.error('Remove them with git rm --cached <file> and keep them ignored.')
    process.exitCode = 1
    return
  }

  const prohibitedFiles = trackedFiles
    .filter(filePath => fs.existsSync(path.join(projectRoot, filePath)))
    .filter(filePath => prohibitedTrackedFiles.has(filePath))
    .map(filePath => ({ filePath, description: prohibitedTrackedFiles.get(filePath) }))

  if (prohibitedFiles.length > 0) {
    console.error('Obsolete or misplaced files are tracked by Git:')
    prohibitedFiles.forEach(({ filePath, description }) => {
      console.error(`- ${filePath}: ${description}`)
    })
    console.error('Remove the dead file and keep one authoritative project manifest.')
    process.exitCode = 1
    return
  }

  const placementViolations = getSourcePlacementViolations(trackedFiles)
  if (placementViolations.length > 0) {
    console.error('Tracked source files violate repository directory conventions:')
    placementViolations.forEach(({ filePath, description }) => {
      console.error(`- ${filePath}: ${description}`)
    })
    console.error('Move the implementation to its canonical source directory or remove a dead duplicate.')
    process.exitCode = 1
    return
  }

  const ignoredExamples = [
    'dist/',
    'build/',
    'coverage/',
    'lhci-report/',
    '.lighthouseci/',
    'playwright-report/',
    'test-results/',
    'logs/',
    'cypress/screenshots/',
    'cypress/videos/',
    '.DS_Store'
  ]

  const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8')
  const missingIgnores = ignoredExamples.filter(entry => !gitignore.includes(entry))

  if (missingIgnores.length > 0) {
    console.error('Missing expected .gitignore entries:')
    missingIgnores.forEach(entry => console.error(`- ${entry}`))
    process.exitCode = 1
    return
  }

  console.log('Repository hygiene check passed.')
}

main()
