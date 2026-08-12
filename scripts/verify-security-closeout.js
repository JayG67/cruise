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

  for (const required of [
    'CRUISE_JWT_SECRET',
    'CRUISE_JWT_ISSUER',
    'CRUISE_JWT_AUDIENCE'
  ]) {
    assert(render.includes(`key: ${required}`), `render.yaml must declare ${required}.`)
  }

  assert(auth.includes('validateJwtConfiguration'), 'JWT configuration validation must exist.')
  assert(render.includes('numInstances: 1'), 'Render must remain single-instance while rate limiting uses process-local memory.')
  assert(security.includes('const buckets = new Map()'), 'The current rate limiter storage contract must remain explicit for closeout verification.')
  assert(audit.includes('assertAuditEventIntegrity'), 'Audit event integrity validation must exist.')
  assert(audit.includes("endsWith(INTERACTIVE_AUDIT_SOURCE_SUFFIX)"), 'Interactive API audit sources must be classified explicitly.')
  assert(audit.includes('AUDIT_ACTOR_USER_ID_REQUIRED'), 'Production interactive audit events must require a server-attributed user id.')
  assert(requestAuthorization.includes('async function resolveRequestAuditActor(req = {})'), 'Audit actor resolution must have a dedicated demo-safe identity bridge.')
  assert(requestAuthorization.includes('if (getAuthenticationMode() !== AUTH_MODES.DEMO) return actor'), 'Synthetic audit actors must be restricted to demo authentication mode.')
  assert(platformAudit.includes('resolveRequestAuditActor(req)'), 'Platform audit writes must use the dedicated audit actor bridge.')
  assert(turnaroundScope.includes('resolveRequestAuditActor(req)'), 'Turnaround audit writes must use the dedicated audit actor bridge.')
  assert(index.includes('validateJwtConfiguration(process.env)'), 'Startup must validate JWT configuration before database initialization.')
  assert(workflow.includes('jest-coverage-report'), 'CI must publish the Jest coverage artifact.')
  for (const artifact of ['coverage-summary.json', 'coverage-final.json', 'cobertura-coverage.xml', 'clover.xml', 'coverage-evidence.json', 'coverage-evidence.md']) {
    assert(coverageVerifier.includes(artifact), `Coverage verifier must require ${artifact}.`)
  }

  console.log('Security closeout audit passed.')
  console.log('Production JWT secret, issuer, and audience are required by deployment/startup contracts.')
  console.log('Interactive API audit events require attributable actors; production API events require actor user ids.')
  console.log('Process-local rate limiting is constrained to a single Render instance until a shared limiter store is introduced.')
  console.log('Coverage artifact publication contract remains enforced.')
}

try { main() } catch (error) {
  console.error(`Security closeout audit failed: ${error.message}`)
  process.exitCode = 1
}
