const {
  buildProductionHardeningReadiness,
  buildDeploymentGate,
  buildEnvironmentGate
} = require('../../services/productionHardeningReadiness.service')

describe('productionHardeningReadiness service', () => {
  it('scores environment, error handling, logging, observability, deployment, and security gates', () => {
    const readiness = buildProductionHardeningReadiness({
      env: {
        DATABASE_URL: 'postgres://postgres:password@localhost:5432/cruise',
        NODE_ENV: 'production',
        PORT: '8000',
        SUPPRESS_DB_LOGS: 'true',
        VITE_API_BASE_URL: '/api',
        LHCI_GITHUB_APP_TOKEN: 'token'
      },
      packageJson: {
        scripts: {
          'start:prod': 'node index.js',
          'react:build': 'vite build',
          'perf:smoke:local': 'k6 run performance/cruise-api-smoke.js',
          'lighthouse:ci:local': 'node scripts/run-lighthouse-ci.js',
          'jest:coverage:all': 'jest --coverage'
        },
        dependencies: {
          compression: '^1.0.0',
          express: '^5.0.0',
          zod: '^4.0.0'
        }
      },
      files: {
        '.env.example': true,
        '.github/workflows': true,
        'Dockerfile': false,
        'docker-compose.yml': true,
        'dist': true,
        'logs': true,
        'middleware/loggers.js': true,
        'middleware/requestIdentity.middleware.js': true,
        'middleware/validate.middleware.js': true,
        'performance/cruise-api-smoke.js': true,
        'services/requestAuthorization.service.js': true,
        'tests/unit/app.security.test.js': true
      },
      appSource: 'app.use(express.json()) app.use(requestLogger) function errorHandler(err, req, res, next) {}',
      controllerSource: 'try {} catch (err) { next(err) }',
      loggerSource: 'SUPPRESS_DB_LOGS requestLogger'
    })

    expect(readiness.title).toBe('Production Hardening Center')
    expect(readiness.gates.map(gate => gate.id)).toEqual([
      'environment',
      'error-handling',
      'logging',
      'observability',
      'deployment',
      'security'
    ])
    expect(readiness.overallScore).toBeGreaterThanOrEqual(80)
    expect(readiness.launchSequence).toContain('Run Jest, Cypress, Playwright mobile/responsive, k6 smoke, and Lighthouse CI before release.')
  })

  it('flags missing deployment documentation as a launch hardening gap', () => {
    const gate = buildDeploymentGate({
      packageJson: {
        scripts: {
          'start:prod': 'node index.js',
          'react:build': 'vite build'
        }
      },
      files: {
        'docker-compose.yml': true,
        public: true
      }
    })

    expect(gate.id).toBe('deployment')
    expect(gate.status).toBe('ready')
    expect(gate.recommendations[0]).toContain('docs/deployment.md')
  })

  it('identifies missing environment variables before production deployment', () => {
    const gate = buildEnvironmentGate({
      env: { DATABASE_URL: 'postgres://localhost/cruise' },
      files: {}
    })

    expect(gate.status).toBe('needs-hardening')
    expect(gate.summary).toContain('1 of 3 required environment values')
  })
})
