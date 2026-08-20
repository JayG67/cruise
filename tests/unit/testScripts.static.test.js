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
    expect(packageJson.scripts.coverage).toBeUndefined()
    expect(packageJson.scripts['coverage:all']).toBeUndefined()
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

  it('keeps integration suites on the shared CI-safe timeout instead of lowering it locally', () => {
    const integrationConfig = fs.readFileSync(path.join(projectRoot, 'jest.integration.config.js'), 'utf8')
    const integrationSetup = fs.readFileSync(path.join(projectRoot, 'tests/integration/jest.integration.setup.js'), 'utf8')
    const integrationDirectory = path.join(projectRoot, 'tests/integration')
    const integrationFiles = fs.readdirSync(integrationDirectory)
      .filter(file => file.endsWith('.integration.test.js'))

    expect(integrationConfig).toContain('testTimeout: 120000')
    expect(integrationSetup).toContain('jest.setTimeout(120000)')

    for (const integrationFile of integrationFiles) {
      const source = fs.readFileSync(path.join(integrationDirectory, integrationFile), 'utf8')
      const explicitTimeouts = [...source.matchAll(/jest\.setTimeout\((\d+)\)/g)]
        .map(match => Number(match[1]))

      for (const timeout of explicitTimeouts) {
        expect(timeout).toBeGreaterThanOrEqual(120000)
      }
    }
  })

  it('keeps standalone integration cleanup registration aligned with the full Jest database lifecycle', () => {
    const integrationConfig = fs.readFileSync(path.join(projectRoot, 'jest.integration.config.js'), 'utf8')
    const integrationSetup = fs.readFileSync(path.join(projectRoot, 'tests/integration/jest.integration.setup.js'), 'utf8')

    expect(integrationConfig).toContain("setupFilesAfterEnv: ['<rootDir>/tests/integration/jest.integration.setup.js']")
    expect(integrationSetup).toContain('global.registerDatabaseCleanup = cleanup =>')
    expect(integrationSetup).toContain('databaseCleanupTasks.push(cleanup)')
    expect(integrationSetup).toContain('for (const cleanup of databaseCleanupTasks)')
    expect(integrationSetup.indexOf('for (const cleanup of databaseCleanupTasks)'))
      .toBeLessThan(integrationSetup.indexOf('await db.closePool()'))
    expect(integrationSetup).toContain("throw new TypeError('Database cleanup must be a function')")
  })

  it('keeps full Jest coverage while avoiding a duplicate integration pass in the default test script', () => {
    expect(packageJson.scripts['jest:coverage:all']).toContain('jest --coverage')
    expect(packageJson.scripts['jest:coverage:all']).not.toContain('tests/unit')
    expect(packageJson.scripts['jest:coverage:all']).not.toContain('tests/integration')
    expect(packageJson.scripts.test).toContain('npm run jest:coverage:all')
    expect(packageJson.scripts.test).toContain('npm run uiTests:react')
    expect(packageJson.scripts.test).not.toContain('npm run integrationTests')
    expect(packageJson.scripts.integrationTests).toContain('jest.integration.config.js')
  })

  it('runs only React browser regression scripts after pre-React retirement', () => {
    expect(packageJson.scripts['cypress:run']).toBeUndefined()
    expect(packageJson.scripts['cypress:run:react']).toContain('cypress/react/**/*.cy.js')
    expect(packageJson.scripts.uiTests).toBeUndefined()
    expect(packageJson.scripts['uiTests:ci']).toBeUndefined()
    expect(packageJson.scripts['uiTests:react']).toContain('http://localhost:8000')
    expect(packageJson.scripts['playwright:mobile:react']).toContain('react-production-mobile.spec.js')
    expect(packageJson.scripts['playwright:responsive:react']).toContain('react-production-responsive.spec.js')
    expect(packageJson.scripts['browserTests:react']).toContain('start:test')
    expect(packageJson.scripts['browserTests:react']).toContain('browserTests:react:run')
    expect(packageJson.scripts['browserTests:react:run']).toContain('cypress:run:react')
    expect(packageJson.scripts['browserTests:react:run']).toContain('playwright:mobile:run')
    expect(packageJson.scripts['browserTests:react:run']).toContain('playwright:responsive:run')
    expect(packageJson.scripts['test:react:all']).toBeUndefined()
    expect(packageJson.scripts['react:production:complete']).toContain('verify-react-production-complete.js')
  })

  it('removes retired rollback and pre-React test wiring from package scripts', () => {
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
      expect(packageJson.scripts[retired]).toBeUndefined()
    }

    expect(packageJson.scripts['test:all']).not.toContain('retired')
    expect(packageJson.scripts['portfolio:audit']).toBeUndefined()
  })

  it('keeps Render production startup resilient when dashboard build settings are stale', () => {
    const renderYaml = fs.readFileSync(path.join(projectRoot, 'render.yaml'), 'utf8')

    expect(packageJson.scripts['start:prod']).toBe('npm run db:bootstrap:render-demo && CRUISE_PUBLIC_DEMO_READ_MODE=enabled node index.js')
    expect(packageJson.dependencies.vite).toBeUndefined()
    expect(packageJson.dependencies['@vitejs/plugin-react']).toBeUndefined()
    expect(packageJson.devDependencies.vite).toBe('8.1.5')
    expect(packageJson.devDependencies['@vitejs/plugin-react']).toBeDefined()
    expect(renderYaml).toContain('buildCommand: npm ci --include=dev && npm run react:build')
    expect(renderYaml).toContain('startCommand: npm run start:prod')
  })

  it('keeps test all focused on the production React application gate', () => {
    expect(packageJson.scripts['test:all']).toContain('npm run test:inventory:audit')
    expect(packageJson.scripts['test:all']).toContain('npm run repo:repair')
    expect(packageJson.scripts['test:all']).toMatch(/^npm run repo:repair && npm run test:inventory:audit/)
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
    expect(packageJson.scripts['cypress:run']).toBeUndefined()
    expect(packageJson.scripts['cypress:run:react']).toContain('cypress/react/**/*.cy.js')
    expect(packageJson.scripts['uiTests:react']).toContain('cypress:run:react')
  })

  it('builds React assets before Playwright suites that exercise the production app', () => {
    expect(packageJson.scripts['playwright:mobile:local']).toBeUndefined()
    expect(packageJson.scripts['playwright:mobile:ci']).toContain('npm run react:build &&')
    expect(packageJson.scripts['playwright:responsive:local']).toBeUndefined()
    expect(packageJson.scripts['playwright:responsive:ci']).toContain('npm run react:build &&')
    expect(packageJson.scripts['playwright:mobile:react']).toContain('react-production-mobile.spec.js')
    expect(packageJson.scripts['playwright:responsive:react']).toContain('react-production-responsive.spec.js')
  })

  it('audits test all against the React-only project test inventory before running the full gate', () => {
    const inventoryScriptPath = path.join(projectRoot, 'scripts/verify-test-all-inventory.js')
    const inventoryScript = fs.readFileSync(inventoryScriptPath, 'utf8')

    expect(packageJson.scripts['test:inventory:audit']).toContain('scripts/verify-test-all-inventory.js')
    expect(packageJson.scripts['test:all']).toContain('npm run test:inventory:audit')
    expect(packageJson.scripts['test:all']).toMatch(/^npm run repo:repair && npm run test:inventory:audit/)
    expect(inventoryScript).toContain('must repair known obsolete files')
    expect(inventoryScript).toContain('cypress/react')
    expect(inventoryScript).toContain('playwright/mobile/react-production-mobile.spec.js')
    expect(inventoryScript).toContain('playwright/responsive/react-production-responsive.spec.js')
    expect(inventoryScript).toContain('retiredCypressSpecs.length === 0')
    expect(inventoryScript).toContain('retiredPlaywrightSpecs.length === 0')
    expect(inventoryScript).not.toContain("console.log('Retired Cypress specs: 0')")
  })


  it('keeps every GitHub Actions npm command backed by a package script', () => {
    const workflowsDirectory = path.join(projectRoot, '.github/workflows')
    const workflowFiles = fs.readdirSync(workflowsDirectory)
      .filter(file => /\.ya?ml$/.test(file))

    for (const workflowFile of workflowFiles) {
      const workflow = fs.readFileSync(path.join(workflowsDirectory, workflowFile), 'utf8')
      const referencedScripts = [...workflow.matchAll(/npm\s+run\s+([A-Za-z0-9:_-]+)/g)]
        .map(match => match[1])

      for (const scriptName of referencedScripts) {
        expect(packageJson.scripts[scriptName]).toEqual(expect.any(String))
      }
    }

    const ciWorkflow = fs.readFileSync(path.join(workflowsDirectory, 'ci.yml'), 'utf8')
    expect(ciWorkflow).toContain('npm run uiTests:react:ci')
    expect(ciWorkflow).not.toContain('npm run uiTests:ci')
  })

  it('keeps the GitHub workflow running an explicit Lighthouse mobile quality gate', () => {
    const workflow = fs.readFileSync(path.join(projectRoot, '.github/workflows/ci.yml'), 'utf8')
    const lighthouseConfig = fs.readFileSync(path.join(projectRoot, '.github/lighthouserc.json'), 'utf8')
    const robots = fs.readFileSync(path.join(projectRoot, 'public/robots.txt'), 'utf8')

    expect(workflow).toContain('lighthouse-mobile-audit:')
    expect(workflow).toContain('name: Mobile Quality & UX Gate')
    expect(workflow).toContain('Run Lighthouse mobile audit and quality gate')
    expect(workflow).toContain('npm run lighthouse:ci:ci')
    expect(workflow).toContain('Verify Lighthouse mobile report artifact')
    expect(workflow).toContain('npm run lighthouse:assert-report')
    expect(packageJson.scripts['lighthouse:assert-report']).toContain('scripts/assert-lighthouse-mobile-report.js')
    expect(lighthouseConfig).toContain('"formFactor": "mobile"')
    expect(lighthouseConfig).toContain('"mobile": true')
    expect(lighthouseConfig).toContain('http://localhost:8000/lighthouse-ci')
    expect(lighthouseConfig).toContain('\"robots-txt\"')
    expect(lighthouseConfig).toContain('\"minScore\": 1')
    expect(robots).toBe('User-agent: *\nAllow: /\n')
    expect(lighthouseConfig).toContain('"throttlingMethod": "provided"')
    expect(lighthouseConfig).toContain('"minScore": 0.85')
  })

  it('keeps the public command surface intentionally small and canonical', () => {
    expect(Object.keys(packageJson.scripts).length).toBeLessThanOrEqual(79)

    for (const redundantAlias of [
      'coverage',
      'coverage:all',
      'uiTests',
      'uiTests:ci',
      'cypress:run',
      'playwright:mobile',
      'playwright:mobile:local',
      'playwright:responsive',
      'playwright:responsive:local',
      'react:default:audit',
      'test:react:all',
      'portfolio:audit',
      'lighthouse:mobile',
      'lighthouse:mobile:local',
      'react:preview',
      'react:preview:local',
      'quality:runtime:run',
      'quality:runtime:local',
      'ai:phase3:test',
      'ai:phase4:test',
      'ai:phase6:test'
    ]) {
      expect(packageJson.scripts[redundantAlias]).toBeUndefined()
    }

    expect(packageJson.scripts['jest:coverage:all']).toContain('jest --coverage --runInBand')
    expect(packageJson.scripts['uiTests:react']).toContain('cypress:run:react')
    expect(packageJson.scripts['playwright:mobile:react']).toContain('react-production-mobile.spec.js')
    expect(packageJson.scripts['playwright:responsive:react']).toContain('react-production-responsive.spec.js')
  })

})
