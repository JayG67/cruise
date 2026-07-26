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

function assertNoScript(packageJson, scriptName) {
  assert(!packageJson.scripts?.[scriptName], `package.json should not define retired script: ${scriptName}`)
}

const packageJson = readJson('package.json')
const app = readFile('app.js')
const cypressConfig = readFile('cypress.config.js')
const reactIndex = readFile('frontend/react/index.html')
const workflow = readFile('.github/workflows/ci.yml')
const render = readFile('render.yaml')

assertScriptIncludes(packageJson, 'react:production:complete', 'verify-react-production-complete.js')
assertScriptIncludes(packageJson, 'test:all', 'react:production:complete')
assertScriptIncludes(packageJson, 'uiTests', 'uiTests:react')
assertScriptIncludes(packageJson, 'uiTests:ci', 'uiTests:react')
assertScriptIncludes(packageJson, 'browserTests:react', 'browserTests:react:run')
assertScriptIncludes(packageJson, 'browserTests:react:run', 'cypress:run:react')
assertScriptIncludes(packageJson, 'browserTests:react:run', 'playwright:mobile:run')
assertScriptIncludes(packageJson, 'browserTests:react:run', 'playwright:responsive:run')

for (const retired of [
  'start:retired',
  'start:retired:ci',
  'uiTests:retired',
  'uiTests:retired:ci',
  'browserTests:retired',
  'retired:quarantine:audit',
  'retired:rollback:audit',
  'retired:rollback:audit:ci',
  'playwright:mobile:dom',
  'playwright:responsive:dom',
  'playwright:mobile:retired',
  'playwright:responsive:retired',
  'playwright:mobile:retired:ci',
  'playwright:responsive:retired:ci'
]) {
  assertNoScript(packageJson, retired)
}

assertIncludes(app, 'sendReactApp', 'Express app')
assertIncludes(app, "app.get('/', sendReactApp)", 'Express app')
assertIncludes(app, "app.use(express.static(reactBuildDir, { redirect: false", 'Express React static assets')
assertIncludes(app, "app.use('/images', express.static(publicImagesDir, { redirect: false", 'Express image assets')
assertExcludes(app, 'CRUISE_DEFAULT_EXPERIENCE', 'Express app')
assertExcludes(app, 'sendRetiredApp', 'Express app')
assertExcludes(app, "app.use('/retired'", 'Express app')
assertExcludes(app, 'retiredPublicDir', 'Express app')

assertIncludes(cypressConfig, 'cypress/react/**/*.cy.js', 'Cypress config')
assertExcludes(cypressConfig, 'cypress/e2e', 'Cypress config')
assertExcludes(reactIndex, ['React ', 'Historical Rollout'].join(''), 'React HTML title')
assertExcludes(reactIndex, 'implementation-history preview', 'React HTML noscript')
assertIncludes(render, 'npm run react:build', 'Render deploy config')
assertIncludes(workflow, 'Run React production Cypress tests', 'GitHub Actions workflow')
assertIncludes(workflow, 'Run React production mobile tests', 'GitHub Actions workflow')

console.log('React production completion audit passed.')

assertExcludes(app, "app.use('/retired-route-placeholder'", 'Express app')
