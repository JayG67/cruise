const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }

function main() {
  const auth = read('services/authentication.service.js')
  const index = read('index.js')
  const render = read('render.yaml')
  const workflow = read('.github/workflows/ci.yml')
  const coverageVerifier = read('scripts/verify-coverage-artifacts.js')
  const audit = read('services/auditEvent.service.js')
  const requestAuthorization = read('services/requestAuthorization.service.js')
  const platformAudit = read('services/platformAudit.service.js')
  const turnaroundScope = read('services/turnaroundScope.service.js')
  const security = read('middleware/security.middleware.js')
  const rateLimitStore = read('services/rateLimitStore.service.js')
  const rateLimitMigration = read('services/databaseRateLimitStoreMigration.service.js')
  const cruiseRoutes = read('routes/cruise.routes.js')

  for (const required of [
    'CRUISE_JWT_SECRET',
    'CRUISE_JWT_ISSUER',
    'CRUISE_JWT_AUDIENCE'
  ]) {
    assert(render.includes(`key: ${required}`), `render.yaml must declare ${required}.`)
  }

  assert(auth.includes('validateJwtConfiguration'), 'JWT configuration validation must exist.')
  assert(rateLimitStore.includes("type: 'database'"), 'A database-backed rate limiter store must exist.')
  assert(rateLimitStore.includes("=== 'production'"), 'Production must select the shared database rate limiter store.')
  assert(rateLimitStore.includes('ON CONFLICT ("bucketKey") DO UPDATE'), 'Shared rate limiting must use atomic PostgreSQL upserts.')
  assert(rateLimitMigration.includes('CREATE TABLE IF NOT EXISTS rate_limit_buckets'), 'The shared rate limiter schema must be provisioned.')
  assert(rateLimitMigration.includes('idx_rate_limit_buckets_reset_at'), 'The shared rate limiter reset index must be provisioned.')
  assert(security.includes('storeProvider = getRateLimitStore'), 'HTTP rate limiting must resolve through the shared-store abstraction.')
  assert(!security.includes("'unsafe-inline'"), 'Production CSP must not permit unsafe-inline styles or scripts.')
  assert(security.includes("\"style-src 'self'\""), 'CSP must restrict stylesheets to same-origin resources.')
  assert(security.includes("\"style-src-attr 'none'\""), 'CSP must reject inline style attributes.')
  assert(security.includes("\"script-src-attr 'none'\""), 'CSP must reject inline script attributes.')
  assert(audit.includes('assertAuditEventIntegrity'), 'Audit event integrity validation must exist.')
  assert(audit.includes("endsWith(INTERACTIVE_AUDIT_SOURCE_SUFFIX)"), 'Interactive API audit sources must be classified explicitly.')
  assert(audit.includes('AUDIT_ACTOR_USER_ID_REQUIRED'), 'Production interactive audit events must require a server-attributed user id.')
  assert(requestAuthorization.includes('async function resolveRequestAuditActor(req = {})'), 'Audit actor resolution must have a dedicated demo-safe identity bridge.')
  assert(requestAuthorization.includes('if (getAuthenticationMode() !== AUTH_MODES.DEMO) return actor'), 'Synthetic audit actors must be restricted to demo authentication mode.')
  assert(platformAudit.includes('resolveRequestAuditActor(req)'), 'Platform audit writes must use the dedicated audit actor bridge.')
  assert(turnaroundScope.includes('resolveRequestAuditActor(req)'), 'Turnaround audit writes must use the dedicated audit actor bridge.')
  for (const [method, routePath] of [
    ['post', '/turnaround-admin/people'],
    ['patch', '/turnaround-admin/people/:id'],
    ['delete', '/turnaround-admin/people/:id']
  ]) {
    const signature = `router.${method}(\n  '${routePath}'`
    const routeIndex = cruiseRoutes.indexOf(signature)
    assert(routeIndex >= 0, `Turnaround admin route ${method.toUpperCase()} ${routePath} must exist.`)
    assert(
      cruiseRoutes.slice(routeIndex, routeIndex + 260).includes('requireGlobalAdminMutation'),
      `Turnaround admin route ${method.toUpperCase()} ${routePath} must require GLOBAL admin mutation access.`
    )
  }
  assert(index.includes('validateJwtConfiguration(process.env)'), 'Startup must validate JWT configuration before database initialization.')
  assert(workflow.includes('jest-coverage-report'), 'CI must publish the Jest coverage artifact.')
  for (const artifact of ['coverage-summary.json', 'coverage-final.json', 'cobertura-coverage.xml', 'clover.xml', 'coverage-evidence.json']) {
    assert(coverageVerifier.includes(artifact), `Coverage verifier must require ${artifact}.`)
  }

  console.log('Security closeout audit passed.')
  console.log('Production JWT secret, issuer, and audience are required by deployment/startup contracts.')
  console.log('Interactive API audit events require attributable actors; production API events require actor user ids.')
  console.log('Production rate limiting uses atomic PostgreSQL-backed counters shared across application instances.')
  console.log('Content Security Policy no longer permits unsafe-inline styles or scripts.')
  console.log('Turnaround administration setup mutations require GLOBAL administrator scope.')
  console.log('Coverage artifact publication contract remains enforced.')
}

try { main() } catch (error) {
  console.error(`Security closeout audit failed: ${error.message}`)
  process.exitCode = 1
}
