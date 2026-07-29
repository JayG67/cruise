const fs = require('fs')
const path = require('path')

describe('AI Phase 6 CI integration', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const workflow = fs.readFileSync(path.join(projectRoot, '.github/workflows/ci.yml'), 'utf8')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
  const gateScript = fs.readFileSync(path.join(projectRoot, 'scripts/run-ai-ci-quality-gate.js'), 'utf8')
  const verifierScript = fs.readFileSync(path.join(projectRoot, 'scripts/verify-ai-ci-evidence.js'), 'utf8')
  const comparisonScript = fs.readFileSync(path.join(projectRoot, 'scripts/compare-ai-ci-evidence.js'), 'utf8')

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

  it('enforces the evidence decision as the release-blocking CI step', () => {
    expect(workflow).toContain('continue-on-error: true')
    expect(workflow).toContain('name: Enforce AI release evidence policy')
    expect(workflow).toContain('npm run ai:ci:evidence:verify')
    expect(packageJson.scripts['ai:ci:evidence:verify']).toBe('node scripts/verify-ai-ci-evidence.js')
    expect(verifierScript).toContain('evaluateAiCiReleasePolicy')
    expect(verifierScript).toContain('process.exitCode = 1')
  })
  it('retains and compares evidence from the prior workflow run', () => {
    expect(workflow).toContain('name: Find previous AI quality evidence run')
    expect(workflow).toContain('actions/download-artifact@v4')
    expect(workflow).toContain('listWorkflowRunArtifacts')
    expect(workflow).toContain("artifact.name === 'ai-quality-evidence' && !artifact.expired")
    expect(workflow).toContain('comparison will use FIRST_RUN')
    expect(workflow).toContain('npm run ai:ci:evidence:compare')
    expect(workflow).toContain('phase6-ci-comparison.json')
    expect(workflow).toContain('retention-days: 30')
    expect(packageJson.scripts['ai:ci:evidence:compare']).toBe('node scripts/compare-ai-ci-evidence.js')
    expect(comparisonScript).toContain('compareAiCiEvidence')
  })

})
