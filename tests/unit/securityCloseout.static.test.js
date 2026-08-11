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
    for (const artifact of ['coverage-summary.json', 'coverage-final.json', 'cobertura-coverage.xml', 'clover.xml', 'coverage-evidence.json', 'coverage-evidence.md']) {
      expect(verifier).toContain(artifact)
    }
    expect(read('.github/workflows/ci.yml')).toContain('jest-coverage-report')
  })

  it('runs the security closeout audit in the full project gate', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.scripts['security:closeout:audit']).toBeUndefined()
    expect(pkg.scripts['test:all']).toContain('node scripts/verify-security-closeout.js')
  })
})
