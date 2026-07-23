const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8'))
}

function walkFiles(directory, predicate, results = []) {
  if (!fs.existsSync(directory)) return results

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, results)
    } else if (predicate(fullPath)) {
      results.push(path.relative(projectRoot, fullPath).replace(/\\/g, '/'))
    }
  }

  return results.sort()
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertScriptIncludes(packageJson, scriptName, expected) {
  const script = packageJson.scripts?.[scriptName]

  assert(typeof script === 'string', `package.json must define script: ${scriptName}`)
  assert(script.includes(expected), `${scriptName} must include: ${expected}`)
}

function assertScriptExcludes(packageJson, scriptName, unexpected) {
  const script = packageJson.scripts?.[scriptName]

  assert(typeof script === 'string', `package.json must define script: ${scriptName}`)
  assert(!script.includes(unexpected), `${scriptName} must not include: ${unexpected}`)
}

const packageJson = readJson('package.json')
const jestTests = walkFiles(path.join(projectRoot, 'tests'), file => file.endsWith('.test.js'))
const retiredCypressSpecs = walkFiles(path.join(projectRoot, 'cypress/e2e'), file => file.endsWith('.cy.js'))
const reactCypressSpecs = walkFiles(path.join(projectRoot, 'cypress/react'), file => file.endsWith('.cy.js'))
const retiredPlaywrightSpecs = [
  ...walkFiles(path.join(projectRoot, 'playwright/mobile'), file => file.endsWith('.spec.js') && !file.endsWith('react-production-mobile.spec.js')),
  ...walkFiles(path.join(projectRoot, 'playwright/responsive'), file => file.endsWith('.spec.js') && !file.endsWith('react-production-responsive.spec.js'))
]
const reactMobileSpec = path.join(projectRoot, 'playwright/mobile/react-production-mobile.spec.js')
const reactResponsiveSpec = path.join(projectRoot, 'playwright/responsive/react-production-responsive.spec.js')

assert(jestTests.length > 0, 'No Jest tests were found under tests/**/*.test.js.')
assert(reactCypressSpecs.length >= 20, `React Cypress application coverage requires at least 20 specs under cypress/react/**/*.cy.js; found ${reactCypressSpecs.length}.`)
assert(fs.existsSync(reactMobileSpec), 'React mobile Playwright spec was not found.')
assert(fs.existsSync(reactResponsiveSpec), 'React responsive Playwright spec was not found.')
assert(retiredCypressSpecs.length === 0, `Retired Cypress specs should be removed from cypress/e2e; found ${retiredCypressSpecs.length}.`)
assert(retiredPlaywrightSpecs.length === 0, `Retired Playwright specs should be removed; found ${retiredPlaywrightSpecs.join(', ')}.`)

assertScriptIncludes(packageJson, 'test:all', 'npm run test:inventory:audit')
assertScriptIncludes(packageJson, 'test:all', 'npm run react:production:complete')
assertScriptIncludes(packageJson, 'test:all', 'npm run release:source:audit')
assertScriptIncludes(packageJson, 'test:all', 'npm run production:deployment:audit')
assertScriptIncludes(packageJson, 'test:all', 'npm run production:dependencies:audit')
assertScriptIncludes(packageJson, 'test:all', 'npm run jest:coverage:all')
assertScriptIncludes(packageJson, 'test:all', 'npm run browserTests:react')
assertScriptIncludes(packageJson, 'test:all', 'npm run perf:smoke:local')
assertScriptIncludes(packageJson, 'test:all', 'npm run lighthouse:ci:local')
assertScriptExcludes(packageJson, 'test:all', 'retired')
assertScriptExcludes(packageJson, 'test:all', 'production release')

assertScriptIncludes(packageJson, 'uiTests', 'uiTests:react')
assertScriptIncludes(packageJson, 'uiTests:ci', 'uiTests:react')
assertScriptIncludes(packageJson, 'cypress:run', 'cypress/react/**/*.cy.js')
assertScriptIncludes(packageJson, 'cypress:run:react', 'cypress/react/**/*.cy.js')
assertScriptIncludes(packageJson, 'playwright:mobile:react', 'playwright/mobile/react-production-mobile.spec.js')
assertScriptIncludes(packageJson, 'playwright:mobile:ci', 'playwright/mobile/react-production-mobile.spec.js')
assertScriptIncludes(packageJson, 'playwright:mobile:ci', 'start:ci')
assertScriptIncludes(packageJson, 'playwright:responsive:react', 'playwright/responsive/react-production-responsive.spec.js')
assertScriptIncludes(packageJson, 'playwright:responsive:ci', 'playwright/responsive/react-production-responsive.spec.js')
assertScriptIncludes(packageJson, 'playwright:responsive:ci', 'start:ci')
assertScriptIncludes(packageJson, 'browserTests:react', 'uiTests:react')
assertScriptIncludes(packageJson, 'browserTests:react', 'playwright:mobile:react')
assertScriptIncludes(packageJson, 'browserTests:react', 'playwright:responsive:react')
assertScriptIncludes(packageJson, 'react:production:complete', 'verify-react-production-complete.js')
assertScriptIncludes(packageJson, 'react:production:audit', 'react:production:complete')

for (const forbidden of [
  'retired:quarantine:audit',
  'retired:rollback:audit',
  'browserTests:retired',
  'start:retired',
  'playwright:mobile:dom',
  'playwright:responsive:dom',
  'uiTests:retired'
]) {
  assert(!packageJson.scripts?.[forbidden], `package.json should not define retired pre-React script: ${forbidden}`)
}

console.log('Test-all inventory audit passed.')
console.log(`Jest files: ${jestTests.length}`)
console.log(`React Cypress specs: ${reactCypressSpecs.length}`)
