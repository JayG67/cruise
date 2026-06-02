const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')

function readFile(relativePath) {
  const fullPath = path.join(projectRoot, relativePath)

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Expected file to exist: ${relativePath}`)
  }

  return fs.readFileSync(fullPath, 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath))
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertIncludes(content, expected, label) {
  assert(content.includes(expected), `${label} must include: ${expected}`)
}

function assertExcludes(content, unexpected, label) {
  assert(!content.includes(unexpected), `${label} must not include: ${unexpected}`)
}

function assertScriptIncludes(packageJson, scriptName, expected) {
  const script = packageJson.scripts && packageJson.scripts[scriptName]

  assert(typeof script === 'string', `package.json must define ${scriptName}`)
  assertIncludes(script, expected, `${scriptName} script`)
}

const packageJson = readJson('package.json')
const app = readFile('app.js')
const reactCypress = readFile('cypress/react/reactApp.cy.js')
const testInventory = readFile('scripts/verify-test-all-inventory.js')
const readiness = readFile('scripts/verify-react-readiness.js')
const cutoverChecklist = readFile('docs/react-cutover-checklist.md')
const readme = readFile('README.md')

assertIncludes(app, 'legacyPublicDir', 'Express app')
assertIncludes(app, 'legacyRootStatic', 'Express app')
assertIncludes(app, 'serveLegacyRootStaticOnlyInRollbackMode', 'Express app')
assertIncludes(app, "app.use('/legacy', express.static(legacyPublicDir, { redirect: false }))", 'Express app')
assertIncludes(app, "app.get(/^\\/legacy(?:\\/.*)?$/, sendLegacyApp)", 'Express app')
assertIncludes(app, "app.get('/', sendDefaultExperience)", 'Express app')
assertIncludes(app, 'isReactDefaultExperienceEnabled', 'Express app')
assertIncludes(app, 'isLegacyDefaultExperienceEnabled', 'Express app')
assertIncludes(app, "app.use('/images', express.static(legacyImagesDir, { redirect: false }))", 'Express app')

const rootStaticIndex = app.indexOf('app.use(serveLegacyRootStaticOnlyInRollbackMode)')
const jsonIndex = app.indexOf('app.use(express.json())')
assert(rootStaticIndex !== -1 && jsonIndex !== -1 && rootStaticIndex < jsonIndex, 'Legacy root static rollback middleware must stay before API middleware so rollback assets still work intentionally.')
assertExcludes(app, "app.use(express.static(legacyPublicDir", 'Express production root')

assertScriptIncludes(packageJson, 'test:all', 'legacy:quarantine:audit')
assertScriptIncludes(packageJson, 'test:all', 'react:cutover:complete')
assertScriptIncludes(packageJson, 'react:production:audit', 'legacy:quarantine:audit')
assertScriptIncludes(packageJson, 'react:production:audit', 'react:cutover:complete')
assertScriptIncludes(packageJson, 'react:default:audit', 'legacy:quarantine:audit')
assertScriptIncludes(packageJson, 'react:default:audit', 'react:cutover:complete')
assertScriptIncludes(packageJson, 'react:cutover:complete', 'verify-react-cutover-complete.js')
assertScriptIncludes(packageJson, 'legacy:rollback:audit', 'uiTests:legacy')
assertScriptIncludes(packageJson, 'legacy:rollback:audit', 'browserTests:legacy')
assertScriptIncludes(packageJson, 'start:legacy', 'CRUISE_DEFAULT_EXPERIENCE=legacy')
assertScriptIncludes(packageJson, 'start:legacy:ci', 'CRUISE_DEFAULT_EXPERIENCE=legacy')
assert(!packageJson.scripts['test:all'].includes('legacy:rollback:audit'), 'test:all must not run the legacy rollback browser audit by default.')
assert(!packageJson.scripts['uiTests'].includes('uiTests:legacy'), 'uiTests must target React production coverage, not legacy DOM coverage.')
assert(!packageJson.scripts['uiTests:ci'].includes('uiTests:legacy'), 'uiTests:ci must target React production coverage, not legacy DOM coverage.')

assertIncludes(reactCypress, "cy.visit('/')", 'React Cypress production spec')
assertExcludes(reactCypress, "cy.visit('/app-next')", 'React Cypress production spec')
assertIncludes(testInventory, 'legacy:quarantine:audit', 'test inventory audit')
assertIncludes(readiness, 'legacy:quarantine:audit', 'React readiness audit')
assertIncludes(readiness, 'react:cutover:complete', 'React readiness audit')
assertIncludes(cutoverChecklist, 'Legacy quarantine audit', 'React cutover checklist')
assertIncludes(cutoverChecklist, 'React cutover completion audit', 'React cutover checklist')
assertIncludes(readme, 'Legacy quarantine audit', 'README')
assertIncludes(readme, 'React cutover completion audit', 'README')

console.log('Legacy quarantine audit passed.')
