const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  const fullPath = path.join(projectRoot, relativePath)

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Expected file to exist: ${relativePath}`)
  }

  return fs.readFileSync(fullPath, 'utf8')
}

function readCssBundle(relativePath, seen = new Set()) {
  const fullPath = path.join(projectRoot, relativePath)
  if (seen.has(fullPath)) {
    return ''
  }
  seen.add(fullPath)

  const content = fs.readFileSync(fullPath, 'utf8')
  const directory = path.dirname(relativePath)

  return content.replace(/@import\s+['"](.+?)['"];?/g, (_match, importPath) => {
    const nestedPath = path.normalize(path.join(directory, importPath)).replace(/\\/g, '/')
    return readCssBundle(nestedPath, seen)
  })
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'coverage') {
      continue
    }

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walk(fullPath, files)
    } else {
      files.push(fullPath)
    }
  }

  return files
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const appCssPath = path.join(projectRoot, 'frontend/react/src/styles/app.css')
const designSystemPath = path.join(projectRoot, 'frontend/react/src/styles/design-system.css')
const cssIndex = read('frontend/react/src/styles/index.css')
const main = read('frontend/react/src/main.jsx')
const packageJson = JSON.parse(read('package.json'))
const applicationCss = readCssBundle('frontend/react/src/styles/components/application.css')
const productShellCss = readCssBundle('frontend/react/src/styles/components/product-shell.css')
const productPolishCss = readCssBundle('frontend/react/src/styles/components/product-polish.css')
const roleDashboardCss = readCssBundle('frontend/react/src/styles/components/role-dashboard.css')
const roleSelectorCss = readCssBundle('frontend/react/src/styles/components/role-selector.css')
const adminWorkspacesCss = readCssBundle('frontend/react/src/styles/components/admin-workspaces.css')
const operationsTimelineCss = read('frontend/react/src/styles/components/operations-timeline.css')
const operationsWorkspacesCss = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css')
const operationsQueuesCss = readCssBundle('frontend/react/src/styles/components/operations-queues.css')
const operationsCoverageCss = readCssBundle('frontend/react/src/styles/components/operations-coverage.css')
const readinessCentersCss = readCssBundle('frontend/react/src/styles/components/readiness-centers.css')
const operationsRoleSurfaceCss = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css')
const operationsDashboardDeleted = !fs.existsSync(path.join(projectRoot, 'frontend/react/src/styles/components/operations-dashboard.css'))
const operationsContinuityCss = readCssBundle('frontend/react/src/styles/components/operations-continuity.css')
const operationsReleaseCss = readCssBundle('frontend/react/src/styles/components/operations-release.css')
const operationsEvidenceCss = readCssBundle('frontend/react/src/styles/components/operations-evidence.css')
const cruiseLineOperationsCss = readCssBundle('frontend/react/src/styles/components/cruise-line-operations.css')

const projectFiles = walk(projectRoot)
  .filter((filePath) => /\.(js|jsx|css)$/.test(filePath))
  .filter((filePath) => !filePath.endsWith(path.join('scripts', 'verify-css-legacy-retirement.js')))
  .filter((filePath) => !filePath.endsWith(path.join('scripts', 'verify-css-foundation.js')))
  .filter((filePath) => !path.relative(projectRoot, filePath).startsWith('tests/'))
  .filter((filePath) => !path.relative(projectRoot, filePath).startsWith('scripts/'))

const appCssReferenceFiles = projectFiles.filter((filePath) => {
  const relativePath = path.relative(projectRoot, filePath)
  const content = fs.readFileSync(filePath, 'utf8')
  return relativePath !== 'frontend/react/src/styles/app.css' && (content.includes("@import './app.css';") || content.includes('styles/app.css') || content.includes('styles/app', 'css'))
})

const designSystemReferenceFiles = projectFiles.filter((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8')
  return content.includes("@import './design-system.css';") || content.includes('styles/design-system.css')
})

assert(
  main.includes("import './styles/index.css'"),
  'main.jsx must load the CSS architecture entrypoint'
)

assert(
  !main.includes("import './styles/app.css'") && !main.includes("import './styles/design-system.css'"),
  'main.jsx must not directly import retired CSS files'
)

assert(
  !cssIndex.includes("@import './app.css';") && !cssIndex.includes("@import './design-system.css';"),
  'index.css must not import retired app.css or design-system.css'
)

assert(
  cssIndex.includes("@import './foundation/tokens.css';") &&
    cssIndex.includes("@import './foundation/theme.css';") &&
    cssIndex.includes("@import './foundation/reset.css';") &&
    cssIndex.includes("@import './layout/index.css';") &&
    cssIndex.includes("@import './components/index.css';") &&
    cssIndex.includes("@import './utilities/index.css';"),
  'index.css must load the layered CSS architecture without retired compatibility imports'
)

assert(
  !fs.existsSync(appCssPath),
  'retired app.css must be deleted after Slice 34 removes the final shim import'
)

assert(
  !fs.existsSync(designSystemPath),
  'retired design-system.css must remain deleted'
)

assert(
  packageJson.scripts['css:legacy:audit'] === 'node scripts/verify-css-legacy-retirement.js',
  'package.json must expose css:legacy:audit as the retired-file guardrail'
)

assert(
  packageJson.scripts['css:foundation:audit'].includes('css:legacy:audit'),
  'css:foundation:audit must include the retired-file guardrail'
)

assert(
  appCssReferenceFiles.length === 0,
  `retired app.css references must be removed from runtime, scripts, and tests: ${appCssReferenceFiles.map((filePath) => path.relative(projectRoot, filePath)).join(', ')}`
)

assert(
  designSystemReferenceFiles.length === 0,
  `retired design-system.css references must be removed from runtime, scripts, and tests: ${designSystemReferenceFiles.map((filePath) => path.relative(projectRoot, filePath)).join(', ')}`
)

assert(
  applicationCss.includes('CSS Foundation Refactor - Slice 33') &&
    applicationCss.includes('.app-shell') &&
    applicationCss.includes('.query-status-card') &&
    applicationCss.includes('.quality-gate-card') &&
    applicationCss.includes('.launch-card') &&
    applicationCss.includes('.coverage-card') &&
    applicationCss.includes('.handoff-item'),
  'components/application.css must own final former app.css compatibility selectors'
)

assert(
  productPolishCss.includes('CSS Foundation Refactor - Slice 42') &&
    productPolishCss.includes('CSS Foundation Refactor - Slice 32') &&
    productPolishCss.includes('.platform-workspace-navigator.self-guided-overview') &&
    productPolishCss.includes('.react-admin-management-card') &&
    productPolishCss.includes('.presentation-scope-controls'),
  'components/product-polish.css must own retired product polish and reviewer-facing selector cleanup'
)

assert(
  roleDashboardCss.includes('CSS Foundation Refactor - Slice 22') &&
    roleDashboardCss.includes('.operational-task-detail-form') &&
    roleDashboardCss.includes('.operational-handoff-form textarea'),
  'components/role-dashboard.css must own retired operational workflow form/detail polish'
)

assert(
  roleSelectorCss.includes('CSS Foundation Refactor - Slice 23') &&
    roleSelectorCss.includes('.role-selector-grid') &&
    roleSelectorCss.includes('.passenger-finder-panel') &&
    roleSelectorCss.includes('.booking-guest-finder'),
  'components/role-selector.css must own retired role selector and passenger finder CSS'
)

const operationsWorkspaceLayerCss = `${operationsWorkspacesCss}\n${operationsQueuesCss}\n${operationsCoverageCss}`
const adminWorkspaceLayerCss = `${adminWorkspacesCss}\n${cruiseLineOperationsCss}`

assert(
  operationsWorkspaceLayerCss.includes('CSS Foundation Refactor - Slice 24') &&
    operationsWorkspaceLayerCss.includes('.operations-directory-panel') &&
    operationsWorkspaceLayerCss.includes('.operations-workspace-shell') &&
    operationsWorkspaceLayerCss.includes('.operations-role-brief-panel') &&
    operationsWorkspaceLayerCss.includes('CSS Foundation Refactor - Slice 25') &&
    operationsWorkspaceLayerCss.includes('.operations-task-workspace'),
  'layered operations workspace CSS must own retired operations workspace CSS'
)

assert(
  operationsReleaseCss.includes('CSS Foundation Refactor - Slice 36') &&
    operationsReleaseCss.includes('CSS Foundation Refactor - Slice 29') &&
    operationsContinuityCss.includes('CSS Foundation Refactor Slice 37') &&
    operationsContinuityCss.includes('.operations-scenario-plan') &&
    operationsEvidenceCss.includes('CSS Foundation Refactor Slice 30') &&
    operationsEvidenceCss.includes('CSS Foundation Refactor Slice 31') &&
    operationsReleaseCss.includes('.operations-release-board') &&
    operationsEvidenceCss.includes('.operations-after-action') &&
    operationsEvidenceCss.includes('.operations-go-live-center'),
  'components/operations-release.css, operations-continuity.css, and operations-evidence.css must own retired operations dashboard evidence CSS'
)

assert(
  operationsRoleSurfaceCss.includes('Build 464 - dark operational role dashboard motif') &&
    operationsRoleSurfaceCss.includes('Build 476 - role-operations panels unified to workspace-selection style') &&
    operationsDashboardDeleted,
  'operations-role-surface.css must own the former operations-dashboard role surface while operations-dashboard.css is deleted'
)

assert(
  readinessCentersCss.includes('Readiness centers aggregate.') &&
    readinessCentersCss.includes('.operations-control-board') &&
    !readinessCentersCss.includes('.data-architecture-readiness-center') &&
    !readinessCentersCss.includes('.production-hardening-center') &&
    !readinessCentersCss.includes('.deployment-readiness-center') &&
    !readinessCentersCss.includes('.public-launch-control-center'),
  'components/readiness-centers.css must retain live operational readiness CSS without retired standalone workspace styles'
)

console.log('CSS retired file audit passed.')
console.log(JSON.stringify({
  appCssDeleted: !fs.existsSync(appCssPath),
  designSystemDeleted: !fs.existsSync(designSystemPath),
  appCssReferenceFileCount: appCssReferenceFiles.length,
  designSystemReferenceFileCount: designSystemReferenceFiles.length,
}, null, 2))
