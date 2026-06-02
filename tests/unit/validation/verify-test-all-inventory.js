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

const packageJson = readJson('package.json')
const jestTests = walkFiles(path.join(projectRoot, 'tests'), file => file.endsWith('.test.js'))
const legacyCypressSpecs = walkFiles(path.join(projectRoot, 'cypress/e2e'), file => file.endsWith('.cy.js'))
const reactCypressSpecs = walkFiles(path.join(projectRoot, 'cypress/react'), file => file.endsWith('.cy.js'))
const mobilePlaywrightSpecs = walkFiles(path.join(projectRoot, 'playwright/mobile'), file => file.endsWith('.spec.js'))
const responsivePlaywrightSpecs = walkFiles(path.join(projectRoot, 'playwright/responsive'), file => file.endsWith('.spec.js'))

assert(jestTests.length > 0, 'No Jest tests were found under tests/**/*.test.js.')
assert(legacyCypressSpecs.length > 0, 'No legacy Cypress specs were found under cypress/e2e/**/*.cy.js.')
assert(reactCypressSpecs.length > 0, 'No React Cypress specs were found under cypress/react/**/*.cy.js.')
assert(mobilePlaywrightSpecs.length > 0, 'No Playwright mobile specs were found.')
assert(responsivePlaywrightSpecs.length > 0, 'No Playwright responsive specs were found.')

assertScriptIncludes(packageJson, 'test:all', 'npm run test:inventory:audit')
assertScriptIncludes(packageJson, 'test:all', 'npm run legacy:quarantine:audit')
assertScriptIncludes(packageJson, 'test:all', 'npm run jest:coverage:all')
assertScriptIncludes(packageJson, 'test:all', 'npm run browserTests:react')
assert(!packageJson.scripts['test:all'].includes('legacy:rollback:audit'), 'test:all must keep legacy rollback audit out of the default React production gate.')
assertScriptIncludes(packageJson, 'uiTests', 'uiTests:react')
assertScriptIncludes(packageJson, 'uiTests:ci', 'uiTests:react')
assertScriptIncludes(packageJson, 'legacy:rollback:audit', 'uiTests:legacy')
assertScriptIncludes(packageJson, 'legacy:rollback:audit', 'browserTests:legacy')
assertScriptIncludes(packageJson, 'legacy:rollback:audit:ci', 'uiTests:legacy:ci')
assertScriptIncludes(packageJson, 'legacy:rollback:audit:ci', 'playwright:mobile:legacy:ci')
assertScriptIncludes(packageJson, 'legacy:rollback:audit:ci', 'playwright:responsive:legacy:ci')
assertScriptIncludes(packageJson, 'react:production:audit', 'legacy:quarantine:audit')
assertScriptIncludes(packageJson, 'react:production:audit', 'browserTests:react')
assertScriptIncludes(packageJson, 'legacy:quarantine:audit', 'verify-legacy-quarantine.js')
assertScriptIncludes(packageJson, 'test:all', 'npm run perf:smoke:local')
assertScriptIncludes(packageJson, 'test:all', 'npm run lighthouse:ci:local')

assertScriptIncludes(packageJson, 'jest:coverage:all', 'jest --coverage')
assertScriptIncludes(packageJson, 'cypress:run', 'cypress/e2e/**/*.cy.js')
assertScriptIncludes(packageJson, 'cypress:run:react', 'cypress/react/**/*.cy.js')

for (const spec of ['playwright/mobile/mobile.spec.js', 'playwright/mobile/role-dashboard-mobile.spec.js']) {
  assertScriptIncludes(packageJson, 'playwright:mobile:dom', spec)
}

assertScriptIncludes(packageJson, 'playwright:mobile:react', 'playwright/mobile/react-app-next-mobile.spec.js')
assertScriptIncludes(packageJson, 'playwright:mobile:ci', 'playwright/mobile/react-app-next-mobile.spec.js')
assertScriptIncludes(packageJson, 'playwright:mobile:ci', 'start:ci')
assert(!packageJson.scripts['playwright:mobile:ci'].includes('start:legacy'), 'playwright:mobile:ci must run the React default mobile gate, not the legacy rollback app.')
assertScriptIncludes(packageJson, 'playwright:responsive:dom', 'playwright/responsive/sailings-responsive.spec.js')
assertScriptIncludes(packageJson, 'playwright:responsive:react', 'playwright/responsive/react-app-next-responsive.spec.js')
assertScriptIncludes(packageJson, 'playwright:responsive:ci', 'playwright/responsive/react-app-next-responsive.spec.js')
assertScriptIncludes(packageJson, 'playwright:responsive:ci', 'start:ci')
assert(!packageJson.scripts['playwright:responsive:ci'].includes('start:legacy'), 'playwright:responsive:ci must run the React default responsive gate, not the legacy rollback app.')

assertScriptIncludes(packageJson, 'browserTests:legacy', 'playwright:mobile:legacy')
assertScriptIncludes(packageJson, 'start:legacy', 'CRUISE_DEFAULT_EXPERIENCE=legacy')
assertScriptIncludes(packageJson, 'browserTests:legacy', 'playwright:responsive:legacy')
assertScriptIncludes(packageJson, 'browserTests:react', 'uiTests:react')
assertScriptIncludes(packageJson, 'browserTests:react', 'playwright:mobile:react')
assertScriptIncludes(packageJson, 'browserTests:react', 'playwright:responsive:react')

assert(!packageJson.scripts['browserTests:legacy'].includes('uiTests'), 'browserTests:legacy must not rerun legacy Cypress.')
assert(!packageJson.scripts['test:all'].includes('npm run test &&'), 'test:all must not call npm run test and rerun suites.')

console.log('Test-all inventory audit passed.')
console.log(`Jest files: ${jestTests.length}`)
console.log(`Legacy Cypress specs: ${legacyCypressSpecs.length}`)
console.log(`React Cypress specs: ${reactCypressSpecs.length}`)
console.log(`Playwright mobile specs: ${mobilePlaywrightSpecs.length}`)
console.log(`Playwright responsive specs: ${responsivePlaywrightSpecs.length}`)
