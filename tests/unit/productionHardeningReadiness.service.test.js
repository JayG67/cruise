const {
  buildProductionHardeningReadiness,
  buildDeploymentGate,
  buildEnvironmentGate,
  buildErrorHandlingGate,
  buildLoggingGate,
  buildObservabilityGate,
  buildSecurityGate
} = require('../../services/productionHardeningReadiness.service')

describe('productionHardeningReadiness service', () => {
  const completePackage = {
    scripts: {
      'start:prod': 'node index.js',
      'react:build': 'vite build',
      'perf:smoke:ci': 'k6 run performance/cruise-api-smoke.js',
      'lighthouse:ci:ci': 'node scripts/run-lighthouse-ci.js',
      'coverage:ci': 'jest --coverage'
    },
    dependencies: { compression: '^1.0.0', express: '^5.0.0', zod: '^4.0.0' }
  }

  const completeFiles = {
    '.env.example': true,
    '.github/workflows': true,
    'docker-compose.yml': true,
    dist: true,
    'render.yaml': true,
    logs: true,
    'middleware/loggers.js': true,
    'middleware/requestIdentity.middleware.js': true,
    'middleware/validate.middleware.js': true,
    'performance/cruise-api-smoke.js': true,
    'services/requestAuthorization.service.js': true,
    'tests/unit/app.security.test.js': true
  }

  it('scores environment, error handling, logging, observability, deployment, and security gates', () => {
    const readiness = buildProductionHardeningReadiness({
      env: {
        DATABASE_URL: 'postgres://postgres:password@localhost:5432/cruise',
        NODE_ENV: 'production', PORT: '8000', SUPPRESS_DB_LOGS: 'true', VITE_API_BASE_URL: '/api', LHCI_GITHUB_APP_TOKEN: 'token'
      },
      packageJson: completePackage,
      files: completeFiles,
      appSource: 'app.use(express.json()) app.use(requestLogger) function errorHandler(err, req, res, next) {} trust proxy',
      controllerSource: 'try {} catch (err) { next(err) }',
      loggerSource: 'SUPPRESS_DB_LOGS requestLogger'
    })

    expect(readiness.status).toBe('ready')
    expect(readiness.overallScore).toBe(100)
    expect(readiness.gates.map(gate => gate.id)).toEqual(['environment', 'error-handling', 'logging', 'observability', 'deployment', 'security'])
  })

  it('uses platform configuration as the deployment readiness signal', () => {
    const gate = buildDeploymentGate({ packageJson: completePackage, files: completeFiles })
    expect(gate.status).toBe('ready')
    expect(gate.recommendations[0]).toContain('synchronized')
  })

  it('identifies missing environment variables before production deployment', () => {
    const gate = buildEnvironmentGate({ env: { DATABASE_URL: 'postgres://localhost/cruise' }, files: {} })
    expect(gate.status).toBe('needs-hardening')
    expect(gate.summary).toContain('1 of 3 required environment values')
    expect(gate.recommendations[0]).toContain('.env.example')
  })

  it('supports custom empty environment requirements without dividing by zero', () => {
    const gate = buildEnvironmentGate({ env: {}, files: {}, requiredEnv: [], recommendedEnv: [] })
    expect(gate.score).toBe(0)
    expect(gate.evidence).toContain('0 required variables present: none')
  })

  it.each([
    [{ dependencies: { express: '5' } }, { 'middleware/validate.middleware.js': true, 'tests/unit/app.security.test.js': true }, 'errorHandler(err, req, res, next)', 'catch (err) { next(err) }', 'ready'],
    [{ devDependencies: { express: '5' } }, { 'middleware/validate.middleware.js': true }, '', 'catch (error) { next(error) }', 'watch'],
    [{}, {}, '', '', 'needs-hardening']
  ])('classifies error handling coverage', (packageJson, files, appSource, controllerSource, expectedStatus) => {
    const gate = buildErrorHandlingGate({ packageJson, files, appSource, controllerSource })
    expect(gate.status).toBe(expectedStatus)
  })

  it('covers complete and missing logging signals', () => {
    const ready = buildLoggingGate({
      packageJson: { dependencies: { compression: '1' } },
      files: { 'middleware/loggers.js': true, logs: true },
      appSource: 'requestLogger SUPPRESS_DB_LOGS',
      loggerSource: ''
    })
    const missing = buildLoggingGate({ packageJson: [], files: [], appSource: '', loggerSource: '' })

    expect(ready.status).toBe('ready')
    expect(missing.status).toBe('needs-hardening')
    expect(missing.evidence).toContain('Compression dependency is missing.')
  })

  it('uses either local or CI scripts for observability checks', () => {
    const ready = buildObservabilityGate({ packageJson: completePackage, files: completeFiles })
    const watch = buildObservabilityGate({ packageJson: { scripts: { 'perf:smoke:local': 'run' } }, files: { 'performance/cruise-api-smoke.js': true } })
    const missing = buildObservabilityGate({ packageJson: {}, files: {} })

    expect(ready.status).toBe('ready')
    expect(watch.status).toBe('needs-hardening')
    expect(missing.recommendations[0]).toContain('Wire smoke')
  })

  it('covers alternate deployment artifacts and missing deployment configuration', () => {
    const railway = buildDeploymentGate({
      packageJson: { scripts: { 'start:prod': 'run', 'react:build': 'run' } },
      files: { Dockerfile: true, public: true, 'railway.json': true }
    })
    const fly = buildDeploymentGate({ packageJson: {}, files: { 'fly.toml': true } })
    const missing = buildDeploymentGate({ packageJson: null, files: null })

    expect(railway.score).toBe(100)
    expect(fly.recommendations[0]).toContain('synchronized')
    expect(missing.status).toBe('needs-hardening')
  })

  it('recognizes security middleware and dev dependencies, and reports missing controls', () => {
    const ready = buildSecurityGate({
      packageJson: { devDependencies: { zod: '4' } },
      files: {
        'tests/unit/app.security.test.js': true,
        'services/requestAuthorization.service.js': true,
        'middleware/requestIdentity.middleware.js': true
      },
      appSource: 'app.use(cors())'
    })
    const missing = buildSecurityGate({ packageJson: {}, files: {}, appSource: '' })

    expect(ready.status).toBe('ready')
    expect(missing.status).toBe('needs-hardening')
    expect(missing.recommendations[0]).toContain('Harden request identity')
  })

  it('summarizes watch-only and blocked readiness states with malformed optional input safely normalized', () => {
    const watch = buildProductionHardeningReadiness({
      packageJson: { scripts: { 'start:prod': 'run', 'react:build': 'run', 'perf:smoke:local': 'run', 'coverage:ci': 'run' }, dependencies: { express: '5', zod: '4', compression: '1' } },
      files: { 'docker-compose.yml': true, dist: true, 'render.yaml': true, 'middleware/validate.middleware.js': true, 'tests/unit/app.security.test.js': true, 'services/requestAuthorization.service.js': true, 'middleware/requestIdentity.middleware.js': true, 'middleware/loggers.js': true, logs: true, 'performance/cruise-api-smoke.js': true, '.github/workflows': true },
      env: { DATABASE_URL: 'x', NODE_ENV: 'production', PORT: '1', SUPPRESS_DB_LOGS: 'true' },
      appSource: 'express.json() errorHandler(err, req, res, next) requestLogger SUPPRESS_DB_LOGS',
      controllerSource: 'catch (err) { next(err) }'
    })
    const blocked = buildProductionHardeningReadiness({ packageJson: [], files: [], env: [], appSource: null })

    expect(watch.status).toBe('watch')
    expect(watch.summary).toContain('watchlist')
    expect(blocked.status).toBe('needs-hardening')
    expect(blocked.summary).toContain('need attention')
  })
})
