const fs = require('fs')
const path = require('path')

describe('local test database script guardrails', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
  const waitScriptPath = path.join(projectRoot, 'scripts/wait-for-test-db.js')

  it('starts and waits for the local Docker PostgreSQL database before database-backed coverage and integration suites', () => {
    expect(packageJson.scripts['db:test:ready']).toContain('docker compose up -d')
    expect(packageJson.scripts['db:test:ready']).toContain('scripts/wait-for-test-db.js')
    expect(packageJson.scripts['jest:coverage:all']).toContain('npm run db:test:ready')
    expect(packageJson.scripts['jest:coverage:all']).toContain('jest --coverage')
    expect(packageJson.scripts.coverage).toContain('jest:coverage:all')
    expect(packageJson.scripts['coverage:all']).toContain('jest:coverage:all')
    expect(packageJson.scripts.integrationTests).toContain('npm run db:test:ready')
  })

  it('keeps a retrying database readiness script instead of assuming Postgres is already running', () => {
    const waitScript = fs.readFileSync(waitScriptPath, 'utf8')

    expect(waitScript).toContain('TEST_DB_READY_ATTEMPTS')
    expect(waitScript).toContain('TEST_DB_READY_DELAY_MS')
    expect(waitScript).toContain('SELECT')
    expect(waitScript).toContain('Test database is ready.')
    expect(waitScript).toContain('Test database did not become ready in time.')
  })

  it('keeps full Jest coverage while avoiding a duplicate integration pass in the default test script', () => {
    expect(packageJson.scripts['jest:coverage:all']).toContain('jest --coverage')
    expect(packageJson.scripts.coverage).not.toContain('tests/unit')
    expect(packageJson.scripts.coverage).not.toContain('tests/integration')
    expect(packageJson.scripts.test).toContain('npm run jest:coverage:all')
    expect(packageJson.scripts.test).toContain('npm run uiTests:react')
    expect(packageJson.scripts.test).not.toContain('npm run integrationTests')
    expect(packageJson.scripts.integrationTests).toContain('jest.integration.config.js')
  })

  it('adds explicit React browser regression scripts before DOM retirement', () => {
    expect(packageJson.scripts['uiTests:legacy']).toContain('start:legacy')
    expect(packageJson.scripts['uiTests:legacy']).toContain('cypress:run')
    expect(packageJson.scripts['cypress:run:react']).toContain('cypress/react/**/*.cy.js')
    expect(packageJson.scripts['uiTests:react']).toContain('http://localhost:8000')
    expect(packageJson.scripts['playwright:mobile:react']).toContain('react-app-next-mobile.spec.js')
    expect(packageJson.scripts['playwright:responsive:react']).toContain('react-app-next-responsive.spec.js')
    expect(packageJson.scripts['browserTests:react']).toContain('uiTests:react')
    expect(packageJson.scripts['test:react:all']).toContain('browserTests:react')
    expect(packageJson.scripts['react:cutover:audit']).toContain('react:production:audit')
  })


  it('keeps legacy browser suites pinned to legacy mode after React becomes the default live app', () => {
    expect(packageJson.scripts.start).toContain('npm run react:build')
    expect(packageJson.scripts['start:legacy']).toContain('CRUISE_DEFAULT_EXPERIENCE=legacy')
    expect(packageJson.scripts['start:legacy:ci']).toContain('CRUISE_DEFAULT_EXPERIENCE=legacy')
    expect(packageJson.scripts['uiTests']).toContain('uiTests:react')
    expect(packageJson.scripts['uiTests:ci']).toContain('uiTests:react')
    expect(packageJson.scripts['legacy:rollback:audit']).toContain('uiTests:legacy')
    expect(packageJson.scripts['legacy:rollback:audit']).toContain('browserTests:legacy')
    expect(packageJson.scripts['playwright:mobile:ci']).toContain('start:ci')
    expect(packageJson.scripts['playwright:mobile:ci']).toContain('react-app-next-mobile.spec.js')
    expect(packageJson.scripts['playwright:mobile:ci']).not.toContain('start:legacy:ci')
    expect(packageJson.scripts['playwright:responsive:ci']).toContain('start:ci')
    expect(packageJson.scripts['playwright:responsive:ci']).toContain('react-app-next-responsive.spec.js')
    expect(packageJson.scripts['playwright:responsive:ci']).not.toContain('start:legacy:ci')
    expect(packageJson.scripts['playwright:mobile:legacy:ci']).toContain('start:legacy:ci')
    expect(packageJson.scripts['playwright:responsive:legacy:ci']).toContain('start:legacy:ci')
    expect(packageJson.scripts['react:default:audit']).toContain('browserTests:react')
  })


  it('runs React browser suites first and keeps legacy DOM coverage in an explicit rollback audit', () => {
    expect(packageJson.scripts['test:all']).toContain('browserTests:react')
    expect(packageJson.scripts['browserTests:legacy']).not.toContain('npm run uiTests')
    expect(packageJson.scripts['browserTests:legacy']).toContain('playwright:mobile:legacy')
    expect(packageJson.scripts['browserTests:legacy']).toContain('playwright:responsive:legacy')
    expect(packageJson.scripts['browserTests:react']).toContain('uiTests:react')
    expect(packageJson.scripts['browserTests:react']).toContain('playwright:mobile:react')
    expect(packageJson.scripts['browserTests:react']).toContain('playwright:responsive:react')
    expect(packageJson.scripts['test:all']).not.toContain('legacy:rollback:audit')
    expect(packageJson.scripts['test:all']).toContain('legacy:quarantine:audit')
    expect(packageJson.scripts['test:all']).toContain('browserTests:react')
    expect(packageJson.scripts['test:all']).toContain('perf:smoke:local')
    expect(packageJson.scripts['test:all']).toContain('lighthouse:ci:local')
    expect(packageJson.scripts['react:cutover:audit']).toContain('legacy:rollback:audit')
    expect(packageJson.scripts['portfolio:audit']).toContain('legacy:rollback:audit')
  })


  it('react cutover audit uses the full combined gate', () => {
    expect(packageJson.scripts['react:production:audit']).toContain('react:readiness:audit')
    expect(packageJson.scripts['react:production:audit']).toContain('legacy:quarantine:audit')
    expect(packageJson.scripts['react:cutover:audit']).toContain('react:production:audit')
    expect(packageJson.scripts['test:all']).not.toContain('legacy:rollback:audit')
    expect(packageJson.scripts['test:all']).toContain('browserTests:react')
  })


  it('keeps legacy DOM quarantined behind explicit rollback scripts after React production cutover', () => {
    const quarantineScript = fs.readFileSync(path.join(projectRoot, 'scripts/verify-legacy-quarantine.js'), 'utf8')

    expect(packageJson.scripts['legacy:quarantine:audit']).toBe('node scripts/verify-legacy-quarantine.js')
    expect(packageJson.scripts['test:all']).toContain('legacy:quarantine:audit')
    expect(packageJson.scripts['react:production:audit']).toContain('legacy:quarantine:audit')
    expect(packageJson.scripts['react:default:audit']).toContain('legacy:quarantine:audit')
    expect(quarantineScript).toContain('serveLegacyRootStaticOnlyInRollbackMode')
    expect(quarantineScript).toContain("app.use('/legacy'")
    expect(quarantineScript).toContain("cy.visit('/')")
    expect(quarantineScript).toContain('test:all must not run the legacy rollback browser audit by default')
  })


  it('keeps React Cypress out of the legacy Cypress sweep', () => {
    expect(packageJson.scripts['cypress:run']).toContain('cypress run')
    expect(packageJson.scripts['cypress:run:react']).toContain('cypress/react/**/*.cy.js')
    expect(packageJson.scripts['uiTests:react']).toContain('cypress:run:react')
    expect(packageJson.scripts['test:all']).not.toContain('legacy:rollback:audit')
    expect(packageJson.scripts['test:all']).toContain('browserTests:react')
  })


  it('keeps legacy Cypress discovery explicit while React Cypress runs separately', () => {
    expect(packageJson.scripts['cypress:run']).toContain('cypress/e2e/**/*.cy.js')
    expect(packageJson.scripts['cypress:run:react']).toContain('cypress/react/**/*.cy.js')
    expect(packageJson.scripts['test:all']).not.toContain('legacy:rollback:audit')
    expect(packageJson.scripts['test:all']).toContain('browserTests:react')
  })


  it('builds React assets before Playwright suites that exercise the React default app', () => {
    expect(packageJson.scripts['playwright:mobile:local']).toContain('npm run react:build &&')
    expect(packageJson.scripts['playwright:mobile:ci']).toContain('npm run react:build &&')
    expect(packageJson.scripts['playwright:responsive:local']).toContain('npm run react:build &&')
    expect(packageJson.scripts['playwright:responsive:ci']).toContain('npm run react:build &&')
    expect(packageJson.scripts['browserTests:legacy']).toContain('playwright:mobile:legacy')
    expect(packageJson.scripts['browserTests:legacy']).toContain('playwright:responsive:legacy')
  })


  it('keeps legacy browser suite pointed at legacy Playwright wrappers', () => {
    expect(packageJson.scripts['browserTests:legacy']).toContain('playwright:mobile:legacy')
    expect(packageJson.scripts['browserTests:legacy']).toContain('playwright:responsive:legacy')
    expect(packageJson.scripts['playwright:mobile:local']).toContain('react:build')
    expect(packageJson.scripts['playwright:responsive:local']).toContain('react:build')
    expect(packageJson.scripts['playwright:responsive:legacy']).toContain('playwright:responsive:dom')
  })


  it('keeps legacy mobile Playwright from double-running React replacement specs', () => {
    expect(packageJson.scripts['playwright:mobile:dom']).toContain('playwright/mobile/mobile.spec.js')
    expect(packageJson.scripts['playwright:mobile:dom']).toContain('playwright/mobile/role-dashboard-mobile.spec.js')
    expect(packageJson.scripts['playwright:mobile:dom']).not.toContain('react-app-next-mobile.spec.js')
    expect(packageJson.scripts['playwright:mobile:legacy']).toContain('start:legacy')
    expect(packageJson.scripts['playwright:mobile:legacy']).toContain('playwright:mobile:dom')
    expect(packageJson.scripts['playwright:mobile:react']).toContain('react-app-next-mobile.spec.js')
    expect(packageJson.scripts['browserTests:legacy']).toContain('playwright:mobile:legacy')
    expect(packageJson.scripts['browserTests:react']).toContain('playwright:mobile:react')
  })


  it('keeps Cypress configured for both DOM and React spec roots', () => {
    const cypressConfig = fs.readFileSync(path.join(projectRoot, 'cypress.config.js'), 'utf8')

    expect(cypressConfig).toContain("'cypress/e2e/**/*.cy.js'")
    expect(cypressConfig).toContain("'cypress/react/**/*.cy.js'")
    expect(packageJson.scripts['cypress:run']).toContain('cypress/e2e/**/*.cy.js')
    expect(packageJson.scripts['cypress:run:react']).toContain('cypress/react/**/*.cy.js')
  })


  it('keeps test all from rerunning the same browser and Jest suites', () => {
    expect(packageJson.scripts['test:all']).not.toContain('npm run test &&')
    expect(packageJson.scripts['test:all']).toContain('npm run test:inventory:audit')
    expect(packageJson.scripts['test:all']).toContain('npm run jest:coverage:all')
    expect(packageJson.scripts['test:all']).toContain('npm run browserTests:react')
    expect(packageJson.scripts['test:all']).not.toContain('npm run legacy:rollback:audit')
    expect(packageJson.scripts['browserTests:legacy']).not.toContain('npm run uiTests')
    expect(packageJson.scripts['browserTests:legacy']).toContain('playwright:mobile:legacy')
    expect(packageJson.scripts['browserTests:legacy']).toContain('playwright:responsive:legacy')
    expect(packageJson.scripts['playwright:responsive:dom']).toContain('playwright/responsive/sailings-responsive.spec.js')
    expect(packageJson.scripts['playwright:responsive:legacy']).toContain('playwright:responsive:dom')
  })


  it('makes it explicit that test all runs unit tests through Jest coverage', () => {
    expect(packageJson.scripts['jest:coverage:all']).toContain('jest --coverage')
    expect(packageJson.scripts['jest:coverage:all']).not.toContain('tests/unit')
    expect(packageJson.scripts['test:all']).toContain('npm run test:inventory:audit')
    expect(packageJson.scripts['test:all']).toContain('npm run jest:coverage:all')
    expect(packageJson.scripts['test:all']).not.toContain('npm run unitTests')
    expect(packageJson.scripts['coverage']).toContain('jest:coverage:all')
  })


  it('audits test all against the project test inventory before running the full gate', () => {
    const inventoryScriptPath = path.join(projectRoot, 'scripts/verify-test-all-inventory.js')
    const inventoryScript = fs.readFileSync(inventoryScriptPath, 'utf8')

    expect(packageJson.scripts['test:inventory:audit']).toContain('scripts/verify-test-all-inventory.js')
    expect(packageJson.scripts['test:all']).toContain('npm run test:inventory:audit')
    expect(inventoryScript).toContain('tests')
    expect(inventoryScript).toContain('cypress/e2e')
    expect(inventoryScript).toContain('cypress/react')
    expect(inventoryScript).toContain('playwright/mobile')
    expect(inventoryScript).toContain('playwright/responsive')
    expect(inventoryScript).toContain('playwright/mobile/react-app-next-mobile.spec.js')
    expect(inventoryScript).toContain('playwright/responsive/react-app-next-responsive.spec.js')
  })

})
