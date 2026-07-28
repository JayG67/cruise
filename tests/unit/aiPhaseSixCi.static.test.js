const fs = require('fs')
const path = require('path')

describe('AI Phase 6 CI integration', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const workflow = fs.readFileSync(path.join(projectRoot, '.github/workflows/ci.yml'), 'utf8')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
  const gateScript = fs.readFileSync(path.join(projectRoot, 'scripts/run-ai-ci-quality-gate.js'), 'utf8')

  it('runs a dedicated AI quality gate in GitHub Actions', () => {
    expect(workflow).toContain('ai-quality-gate:')
    expect(workflow).toContain('name: AI Quality Gate')
    expect(workflow).toContain('npm run ai:ci:gate')
    expect(packageJson.scripts['ai:ci:gate']).toBe('node scripts/run-ai-ci-quality-gate.js')
  })

  it('publishes machine-readable evidence even when the gate fails', () => {
    expect(workflow).toContain('if: always()')
    expect(workflow).toContain('name: ai-quality-evidence')
    expect(workflow).toContain('ai-quality-evidence/phase6-ci-evidence.json')
    expect(gateScript).toContain("releaseDecision: failedChecks.length === 0 ? 'APPROVED' : 'BLOCKED'")
    expect(gateScript).toContain('GITHUB_RUN_ATTEMPT')
  })
})
