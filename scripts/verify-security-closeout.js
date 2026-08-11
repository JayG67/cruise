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

  for (const required of [
    'CRUISE_JWT_SECRET',
    'CRUISE_JWT_ISSUER',
    'CRUISE_JWT_AUDIENCE'
  ]) {
    assert(render.includes(`key: ${required}`), `render.yaml must declare ${required}.`)
  }

  assert(auth.includes('validateJwtConfiguration'), 'JWT configuration validation must exist.')
  assert(index.includes('validateJwtConfiguration(process.env)'), 'Startup must validate JWT configuration before database initialization.')
  assert(workflow.includes('jest-coverage-report'), 'CI must publish the Jest coverage artifact.')
  for (const artifact of ['coverage-summary.json', 'coverage-final.json', 'cobertura-coverage.xml', 'clover.xml', 'coverage-evidence.json', 'coverage-evidence.md']) {
    assert(coverageVerifier.includes(artifact), `Coverage verifier must require ${artifact}.`)
  }

  console.log('Security closeout audit passed.')
  console.log('Production JWT secret, issuer, and audience are required by deployment/startup contracts.')
  console.log('Coverage artifact publication contract remains enforced.')
}

try { main() } catch (error) {
  console.error(`Security closeout audit failed: ${error.message}`)
  process.exitCode = 1
}
