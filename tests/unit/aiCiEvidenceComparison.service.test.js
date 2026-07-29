const { compareAiCiEvidence } = require('../../services/aiCiEvidenceComparison.service')

function evidence(overrides = {}) {
  const checks = overrides.checks || [
    { id: 'phase-1-foundation', status: 'PASSED', exitCode: 0 },
    { id: 'phase-2-briefing', status: 'PASSED', exitCode: 0 },
    { id: 'phase-3-evaluation', status: 'PASSED', exitCode: 0 },
    { id: 'phase-4-quality-console', status: 'PASSED', exitCode: 0 },
    { id: 'phase-5-adversarial-audit', status: 'PASSED', exitCode: 0 },
    { id: 'phase-5-completion', status: 'PASSED', exitCode: 0 },
    { id: 'ai-regression-tests', status: 'PASSED', exitCode: 0 }
  ]
  const failedChecks = checks.filter(check => check.status === 'FAILED').length
  return {
    schemaVersion: 1,
    phase: 6,
    gate: 'AI CI quality gate',
    generatedAt: '2026-07-28T12:00:00.000Z',
    git: { sha: 'abc123' },
    status: failedChecks ? 'FAILED' : 'PASSED',
    releaseDecision: failedChecks ? 'BLOCKED' : 'APPROVED',
    totalChecks: checks.length,
    passedChecks: checks.length - failedChecks,
    failedChecks,
    checks,
    ...overrides
  }
}

describe('AI CI evidence comparison service', () => {
  it('treats a missing baseline as a valid first run', () => {
    const result = compareAiCiEvidence(evidence(), null)
    expect(result).toMatchObject({ valid: true, baselineStatus: 'UNAVAILABLE', outcome: 'FIRST_RUN' })
  })

  it('identifies newly failing checks as a regression', () => {
    const baseline = evidence()
    const current = evidence({ checks: baseline.checks.map(check => check.id === 'ai-regression-tests' ? { ...check, status: 'FAILED', exitCode: 1 } : check) })
    const result = compareAiCiEvidence(current, baseline)
    expect(result.outcome).toBe('REGRESSION')
    expect(result.newFailures).toEqual(['ai-regression-tests'])
  })

  it('identifies resolved failures as an improvement', () => {
    const current = evidence()
    const baseline = evidence({ checks: current.checks.map(check => check.id === 'phase-5-completion' ? { ...check, status: 'FAILED', exitCode: 1 } : check) })
    const result = compareAiCiEvidence(current, baseline)
    expect(result.outcome).toBe('IMPROVEMENT')
    expect(result.resolvedFailures).toEqual(['phase-5-completion'])
  })
})
