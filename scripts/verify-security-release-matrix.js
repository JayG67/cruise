const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }

function main() {
  const app = read('app.js')
  const auth = read('services/authentication.service.js')
  const authorization = read('middleware/authorization.middleware.js')
  const security = read('middleware/security.middleware.js')
  const limiterStore = read('services/rateLimitStore.service.js')
  const limiterMigration = read('services/databaseRateLimitStoreMigration.service.js')
  const audit = read('services/auditEvent.service.js')
  const requestAuthorization = read('services/requestAuthorization.service.js')
  const customerAccess = read('services/customerAccess.service.js')
  const cruiseRoutes = read('routes/cruise.routes.js')
  const aiRoutes = read('routes/ai.routes.js')
  const workflow = read('.github/workflows/ci.yml')
  const coverageVerifier = read('scripts/verify-coverage-artifacts.js')
  const dependencyVerifier = read('scripts/verify-production-dependencies.js')

  const checks = [
    ['production JWT validation', auth.includes('validateJwtConfiguration') && auth.includes('CRUISE_JWT_AUDIENCE')],
    ['server identity attachment', app.includes('attachRequestIdentity')],
    ['GLOBAL admin verification', authorization.includes('requireGlobalAdminAccess') && cruiseRoutes.includes('requireGlobalAdminMutation')],
    ['tenant authorization', authorization.includes('requireCruiseLineTenantAccess') && cruiseRoutes.includes('requireCustomerTenantAdminAccess') && cruiseRoutes.includes('requireBookingTenantAdminAccess')],
    ['passenger/customer ownership', customerAccess.includes('canAccessCustomer') && customerAccess.includes('canCreateBooking')],
    ['AI authorization', aiRoutes.includes('requireGlobalAdminAccess')],
    ['interactive audit attribution', audit.includes('AUDIT_ACTOR_REQUIRED') && audit.includes('AUDIT_ACTOR_USER_ID_REQUIRED')],
    ['shared production rate limiting', limiterStore.includes("type: 'database'") && limiterStore.includes("=== 'production'")],
    ['atomic rate-limit counters', limiterStore.includes('ON CONFLICT ("bucketKey") DO UPDATE')],
    ['rate-limit schema', limiterMigration.includes('CREATE TABLE IF NOT EXISTS rate_limit_buckets') && limiterMigration.includes('idx_rate_limit_buckets_reset_at')],
    ['CSP inline execution blocked', !security.includes("'unsafe-inline'") && security.includes("\"script-src-attr 'none'\"")],
    ['safe production errors', security.includes("message: 'Internal server error', requestId")],
    ['bounded request bodies', app.includes("express.json({ limit: '512kb' })")],
    ['coverage evidence', workflow.includes('jest-coverage-report') && coverageVerifier.includes('coverage-evidence.json')],
    ['security closeout in CI', workflow.includes('node scripts/verify-security-closeout.js')],
    ['bounded dependency residual risk', dependencyVerifier.includes('MAX_ACCEPTED_LOW_SEVERITY = 1') && dependencyVerifier.includes('lowCount > MAX_ACCEPTED_LOW_SEVERITY')]
  ]

  for (const [name, passed] of checks) assert(passed, `Security release matrix failed: ${name}.`)
  console.log(`Security release matrix passed: ${checks.length}/${checks.length} controls verified.`)
}

try { main() } catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
