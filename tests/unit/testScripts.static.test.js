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

  it('runs only React browser regression scripts after DOM retirement', () => {
    expect(packageJson.scripts['cypress:run']).toContain('cypress/react/**/*.cy.js')
    expect(packageJson.scripts['cypress:run:react']).toContain('cypress/react/**/*.cy.js')
    expect(packageJson.scripts['uiTests']).toContain('uiTests:react')
    expect(packageJson.scripts['uiTests:ci']).toContain('uiTests:react')
    expect(packageJson.scripts['uiTests:react']).toContain('http://localhost:8000')
    expect(packageJson.scripts['playwright:mobile:react']).toContain('react-app-next-mobile.spec.js')
    expect(packageJson.scripts['playwright:responsive:react']).toContain('react-app-next-responsive.spec.js')
    expect(packageJson.scripts['browserTests:react']).toContain('uiTests:react')
    expect(packageJson.scripts['test:react:all']).toContain('browserTests:react')
    expect(packageJson.scripts['react:production:complete']).toContain('verify-react-production-complete.js')
  })

  it('removes legacy rollback and DOM test wiring from package scripts', () => {
    for (const retired of [
      'start:legacy',
      'start:legacy:ci',
      'uiTests:legacy',
      'uiTests:legacy:ci',
      'browserTests:legacy',
      'legacy:quarantine:audit',
      'legacy:rollback:audit',
      'legacy:rollback:audit:ci',
      'playwright:mobile:dom',
      'playwright:responsive:dom',
      'playwright:mobile:legacy',
      'playwright:responsive:legacy',
      'playwright:mobile:legacy:ci',
      'playwright:responsive:legacy:ci'
    ]) {
      expect(packageJson.scripts[retired]).toBeUndefined()
    }

    expect(packageJson.scripts['test:all']).not.toContain('legacy')
    expect(packageJson.scripts['portfolio:audit']).not.toContain('legacy')
  })

  it('keeps test all focused on the production React application gate', () => {
    expect(packageJson.scripts['test:all']).toContain('npm run test:inventory:audit')
    expect(packageJson.scripts['test:all']).toContain('npm run react:production:complete')
    expect(packageJson.scripts['test:all']).toContain('npm run jest:coverage:all')
    expect(packageJson.scripts['test:all']).toContain('npm run browserTests:react')
    expect(packageJson.scripts['test:all']).toContain('npm run perf:smoke:local')
    expect(packageJson.scripts['test:all']).toContain('npm run lighthouse:ci:local')
    expect(packageJson.scripts['test:all']).not.toContain('npm run test &&')
  })

  it('keeps Cypress configured for React specs only', () => {
    const cypressConfig = fs.readFileSync(path.join(projectRoot, 'cypress.config.js'), 'utf8')

    expect(cypressConfig).toContain('cypress/react/**/*.cy.js')
    expect(cypressConfig).not.toContain('cypress/e2e')
    expect(packageJson.scripts['cypress:run']).toContain('cypress/react/**/*.cy.js')
    expect(packageJson.scripts['cypress:run:react']).toContain('cypress/react/**/*.cy.js')
    expect(packageJson.scripts['uiTests:react']).toContain('cypress:run:react')
  })

  it('builds React assets before Playwright suites that exercise the production app', () => {
    expect(packageJson.scripts['playwright:mobile:local']).toContain('playwright:mobile:react')
    expect(packageJson.scripts['playwright:mobile:ci']).toContain('npm run react:build &&')
    expect(packageJson.scripts['playwright:responsive:local']).toContain('playwright:responsive:react')
    expect(packageJson.scripts['playwright:responsive:ci']).toContain('npm run react:build &&')
    expect(packageJson.scripts['playwright:mobile:react']).toContain('react-app-next-mobile.spec.js')
    expect(packageJson.scripts['playwright:responsive:react']).toContain('react-app-next-responsive.spec.js')
  })

  it('audits test all against the React-only project test inventory before running the full gate', () => {
    const inventoryScriptPath = path.join(projectRoot, 'scripts/verify-test-all-inventory.js')
    const inventoryScript = fs.readFileSync(inventoryScriptPath, 'utf8')

    expect(packageJson.scripts['test:inventory:audit']).toContain('scripts/verify-test-all-inventory.js')
    expect(packageJson.scripts['test:all']).toContain('npm run test:inventory:audit')
    expect(inventoryScript).toContain('cypress/react')
    expect(inventoryScript).toContain('playwright/mobile/react-app-next-mobile.spec.js')
    expect(inventoryScript).toContain('playwright/responsive/react-app-next-responsive.spec.js')
    expect(inventoryScript).toContain('Legacy Cypress specs: 0')
  })
})
