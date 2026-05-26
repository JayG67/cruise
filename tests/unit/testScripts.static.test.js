const fs = require('fs')
const path = require('path')

describe('local test database script guardrails', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
  const waitScriptPath = path.join(projectRoot, 'scripts/wait-for-test-db.js')

  it('starts and waits for the local Docker PostgreSQL database before database-backed coverage and integration suites', () => {
    expect(packageJson.scripts['db:test:ready']).toContain('docker compose up -d')
    expect(packageJson.scripts['db:test:ready']).toContain('scripts/wait-for-test-db.js')
    expect(packageJson.scripts.coverage).toContain('npm run db:test:ready')
    expect(packageJson.scripts.coverage).toContain('jest --coverage')
    expect(packageJson.scripts['coverage:all']).toContain('npm run db:test:ready')
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
    expect(packageJson.scripts.coverage).toContain('jest --coverage')
    expect(packageJson.scripts.coverage).not.toContain('tests/unit')
    expect(packageJson.scripts.coverage).not.toContain('tests/integration')
    expect(packageJson.scripts.test).toContain('npm run coverage')
    expect(packageJson.scripts.test).not.toContain('npm run integrationTests')
    expect(packageJson.scripts.integrationTests).toContain('jest.integration.config.js')
  })
})
