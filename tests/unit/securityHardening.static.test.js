const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('production HTTP security hardening contracts', () => {
  it('wires request correlation, defense headers, bounded JSON parsing and tiered API rate limits', () => {
    const app = read('app.js')

    expect(app).toContain("require('./middleware/security.middleware')")
    expect(app).toContain("app.disable('x-powered-by')")
    expect(app).toContain('app.use(attachRequestContext)')
    expect(app).toContain('app.use(securityHeaders)')
    expect(app).toContain("express.json({ limit: '512kb' })")
    expect(app).toContain("app.use('/cruise', apiNoStore, generalApiRateLimit, mutationRateLimitWhenNeeded, cruiseRouter)")
    expect(app).toContain("app.use('/admin', apiNoStore, generalApiRateLimit, mutationRateLimitWhenNeeded, adminRouter)")
    expect(app).toContain("app.use('/ai', apiNoStore, generalApiRateLimit, aiRateLimitWhenNeeded, aiRouter)")
    expect(app).toContain("app.set('trust proxy', 1)")
    expect(app).toContain('app.use(errorHandler)')
    expect(app).not.toContain('error: err.message')
  })

  it('keeps the limiter production-enforced, principal-scoped and shared-store backed', () => {
    const security = read('middleware/security.middleware.js')
    const store = read('services/rateLimitStore.service.js')

    expect(security).toContain("if (isProduction()) return true")
    expect(security).toContain('req.requestIdentity?.principal?.userId')
    expect(security).toContain("return `user:${principalId}`")
    expect(security).toContain("return `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`")
    expect(security).toContain('storeProvider = getRateLimitStore')
    expect(store).toContain("type: 'database'")
    expect(store).toContain('ON CONFLICT ("bucketKey") DO UPDATE')
    expect(security).toContain("res.setHeader('Retry-After'")
    expect(security).toContain("message: 'Too many requests'")
    expect(security).toContain('CRUISE_API_RATE_LIMIT')
    expect(security).toContain('CRUISE_MUTATION_RATE_LIMIT')
    expect(security).toContain('CRUISE_AI_RATE_LIMIT')
  })

  it('keeps production exceptions generic while returning request correlation metadata', () => {
    const security = read('middleware/security.middleware.js')

    expect(security).toContain("if (isProduction()) return undefined")
    expect(security).toContain("message: 'Internal server error', requestId")
    expect(security).toContain("message: 'Request payload too large', requestId")
    expect(security).toContain("res.setHeader('X-Request-Id', requestId)")
  })

  it('deploys rate limiting explicitly and documents every tuning control', () => {
    const render = read('render.yaml')
    const envExample = read('.env.example')

    for (const expected of [
      'CRUISE_RATE_LIMIT_MODE',
      'CRUISE_API_RATE_LIMIT',
      'CRUISE_MUTATION_RATE_LIMIT',
      'CRUISE_AI_RATE_LIMIT'
    ]) {
      expect(render).toContain(expected)
      expect(envExample).toContain(expected)
    }

    expect(render).toContain('value: enabled')
  })

  it('logs request ids, status and latency without logging query strings or bodies', () => {
    const logger = read('middleware/loggers.js')

    expect(logger).toContain('requestId=${requestId}')
    expect(logger).toContain('status=${res.statusCode}')
    expect(logger).toContain('durationMs=${elapsedMs.toFixed(1)}')
    expect(logger).toContain('path=${req.path}')
    expect(logger).not.toContain('req.originalUrl')
    expect(logger).not.toContain('req.body')
  })

  it('keeps complete coverage evidence and global floors in GitHub CI', () => {
    const workflow = read('.github/workflows/ci.yml')
    const verifier = read('scripts/verify-coverage-artifacts.js')
    const jestConfig = read('jest.config.js')

    expect(workflow).toContain('name: jest-coverage-report')
    expect(workflow).toContain('node scripts/build-coverage-evidence.js')
    expect(workflow).toContain('node scripts/verify-coverage-artifacts.js')
    expect(workflow).toContain('node scripts/verify-coverage-artifacts.js --published')
    expect(workflow).toContain('coverage\n            github-pages/coverage')

    for (const artifact of [
      'coverage-evidence.json',
      'cobertura-coverage.xml',
      'clover.xml',
      'coverage-final.json',
      'coverage-summary.json',
      'lcov.info'
    ]) {
      expect(verifier).toContain(`'${artifact}'`)
    }

    expect(verifier).toContain("path.join('lcov-report', 'index.html')")
    expect(jestConfig).toContain('coverageReporters')
    expect(jestConfig).toContain('coverageThreshold')
  })
})
