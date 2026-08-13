const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')

describe('security remediation closeout contracts', () => {
  it('requires managed production JWT secret, issuer, and audience settings', () => {
    const render = read('render.yaml')
    for (const key of ['CRUISE_JWT_SECRET', 'CRUISE_JWT_ISSUER', 'CRUISE_JWT_AUDIENCE']) {
      expect(render).toContain(`key: ${key}`)
    }
    expect(read('index.js')).toContain('validateJwtConfiguration(process.env)')
  })

  it('keeps complete GitHub coverage evidence in the closeout gate', () => {
    const verifier = read('scripts/verify-coverage-artifacts.js')
    for (const artifact of ['coverage-summary.json', 'coverage-final.json', 'cobertura-coverage.xml', 'clover.xml', 'coverage-evidence.json']) {
      expect(verifier).toContain(artifact)
    }
    expect(read('.github/workflows/ci.yml')).toContain('jest-coverage-report')
  })

  it('keeps the browser content-security policy free of unsafe-inline allowances', () => {
    const security = read('middleware/security.middleware.js')
    const app = read('app.js')
    const lighthouseHtml = read('public/lighthouse-ci.html')

    expect(security).not.toContain("'unsafe-inline'")
    expect(security).toContain("\"style-src 'self'\"")
    expect(security).toContain("\"style-src-attr 'none'\"")
    expect(security).toContain("\"script-src-attr 'none'\"")
    expect(app).toContain("app.get('/lighthouse-ci.css'")
    expect(lighthouseHtml).toContain('rel="stylesheet" href="/lighthouse-ci.css"')
    expect(lighthouseHtml).not.toContain('<style')
  })

  it('requires atomic shared production rate limiting with a provisioned database store', () => {
    const security = read('middleware/security.middleware.js')
    const store = read('services/rateLimitStore.service.js')
    const migration = read('services/databaseRateLimitStoreMigration.service.js')
    expect(security).toContain('storeProvider = getRateLimitStore')
    expect(store).toContain("type: 'database'")
    expect(store).toContain("=== 'production'")
    expect(store).toContain('ON CONFLICT ("bucketKey") DO UPDATE')
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS rate_limit_buckets')
    expect(migration).toContain('idx_rate_limit_buckets_reset_at')
  })

  it('requires attributable actors for interactive audit sources', () => {
    const audit = read('services/auditEvent.service.js')
    expect(audit).toContain('assertAuditEventIntegrity')
    expect(audit).toContain('AUDIT_ACTOR_REQUIRED')
    expect(audit).toContain('AUDIT_ACTOR_USER_ID_REQUIRED')
  })

  it('keeps turnaround administration setup mutations GLOBAL-admin-only', () => {
    const routes = read('routes/cruise.routes.js')
    for (const [method, routePath] of [
      ['post', '/turnaround-admin/people'],
      ['patch', '/turnaround-admin/people/:id'],
      ['delete', '/turnaround-admin/people/:id']
    ]) {
      const signature = `router.${method}(\n  '${routePath}'`
      const routeIndex = routes.indexOf(signature)
      expect(routeIndex).toBeGreaterThanOrEqual(0)
      expect(routes.slice(routeIndex, routeIndex + 260)).toContain('requireGlobalAdminMutation')
    }
  })

  it('runs the security closeout audit in the full project gate and GitHub CI', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.scripts['security:closeout:audit']).toBeUndefined()
    expect(pkg.scripts['test:all']).toContain('node scripts/verify-security-closeout.js')
    expect(pkg.scripts['test:all']).toContain('node scripts/verify-security-release-matrix.js')
    const workflow = read('.github/workflows/ci.yml')
    expect(workflow).toContain('run: node scripts/verify-security-closeout.js')
    expect(workflow).toContain('run: node scripts/verify-security-release-matrix.js')
  })


})
