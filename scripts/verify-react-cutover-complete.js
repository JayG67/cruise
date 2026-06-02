const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

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
  const script = packageJson.scripts?.[scriptName]

  assert(typeof script === 'string', `package.json must define ${scriptName}`)
  assertIncludes(script, expected, `${scriptName} script`)
}

function assertScriptExcludes(packageJson, scriptName, unexpected) {
  const script = packageJson.scripts?.[scriptName]

  assert(typeof script === 'string', `package.json must define ${scriptName}`)
  assertExcludes(script, unexpected, `${scriptName} script`)
}

const packageJson = readJson('package.json')
const app = readFile('app.js')
const reactCypress = readFile('cypress/react/reactApp.cy.js')
const reactMobile = readFile('playwright/mobile/react-app-next-mobile.spec.js')
const reactResponsive = readFile('playwright/responsive/react-app-next-responsive.spec.js')
const legacyQuarantine = readFile('scripts/verify-legacy-quarantine.js')
const readiness = readFile('scripts/verify-react-readiness.js')
const workflow = readFile('.github/workflows/ci.yml')
const render = readFile('render.yaml')
const readme = readFile('README.md')
const checklist = readFile('docs/react-cutover-checklist.md')

assertScriptIncludes(packageJson, 'react:cutover:complete', 'verify-react-cutover-complete.js')
assertScriptIncludes(packageJson, 'test:all', 'react:cutover:complete')
assertScriptIncludes(packageJson, 'react:production:audit', 'react:cutover:complete')
assertScriptIncludes(packageJson, 'react:default:audit', 'react:cutover:complete')
assertScriptIncludes(packageJson, 'uiTests', 'uiTests:react')
assertScriptIncludes(packageJson, 'uiTests:ci', 'uiTests:react')
assertScriptIncludes(packageJson, 'browserTests:react', 'uiTests:react')
assertScriptIncludes(packageJson, 'browserTests:react', 'playwright:mobile:react')
assertScriptIncludes(packageJson, 'browserTests:react', 'playwright:responsive:react')
assertScriptExcludes(packageJson, 'test:all', 'legacy:rollback:audit')
assertScriptExcludes(packageJson, 'test:all', 'browserTests:legacy')
assertScriptExcludes(packageJson, 'uiTests', 'uiTests:legacy')
assertScriptExcludes(packageJson, 'uiTests:ci', 'uiTests:legacy')

assertIncludes(app, 'sendDefaultExperience', 'Express app')
assertIncludes(app, 'isReactDefaultExperienceEnabled', 'Express app')
assertIncludes(app, "app.get('/', sendDefaultExperience)", 'Express app')
assertIncludes(app, "app.use('/legacy', express.static(legacyPublicDir, { redirect: false }))", 'Express app')
assertIncludes(app, "app.get(/^\\/legacy(?:\\/.*)?$/, sendLegacyApp)", 'Express app')
assertIncludes(app, "app.use('/app-next', express.static(reactBuildDir, { redirect: false }))", 'Express compatibility alias')
assertExcludes(app, "app.use(express.static(legacyPublicDir", 'Express production root')

assertIncludes(reactCypress, "cy.visit('/')", 'React Cypress production spec')
assertExcludes(reactCypress, "cy.visit('/app-next')", 'React Cypress production spec')
assertIncludes(reactMobile, "page.goto('/')", 'React mobile production spec')
assertIncludes(reactResponsive, "page.goto('/')", 'React responsive production spec')
assertExcludes(reactMobile, "page.goto('/app-next')", 'React mobile production spec')
assertExcludes(reactResponsive, "page.goto('/app-next')", 'React responsive production spec')

assertIncludes(legacyQuarantine, 'react:cutover:complete', 'Legacy quarantine audit')
assertIncludes(readiness, 'react:cutover:complete', 'React readiness audit')
assertIncludes(workflow, 'React Cutover Completion Audit', 'GitHub Actions workflow')
assertIncludes(workflow, 'npm run react:cutover:complete', 'GitHub Actions workflow')
assertIncludes(workflow, 'Run React production Cypress tests', 'GitHub Actions workflow')
assertIncludes(workflow, 'Run React production mobile tests', 'GitHub Actions workflow')
assertIncludes(render, 'npm run react:build', 'Render deploy config')

assertIncludes(readme, 'React cutover completion audit', 'README')
assertIncludes(checklist, 'React cutover completion audit', 'React cutover checklist')
assertExcludes(readme, 'The legacy DOM application remains available at `/` until the React experience reaches full parity.', 'README')
assertExcludes(checklist, 'The legacy DOM app remains available at `/` until `/app-next` reaches functional, visual, accessibility, and mobile parity.', 'React cutover checklist')
assertExcludes(readme, 'React app is still a preview path, not the production UI', 'README')

console.log('React cutover completion audit passed.')
