const { compareAiCiEvidence } = require('../../services/aiCiEvidenceComparison.service')

const baseChecks = () => [
  'phase-1-foundation', 'phase-2-briefing', 'phase-3-evaluation', 'phase-4-quality-console',
  'phase-5-adversarial-audit', 'phase-5-completion', 'ai-regression-tests'
].map(id => ({ id, status: 'PASSED', exitCode: 0 }))

function evidence(overrides = {}) {
  const checks = overrides.checks || baseChecks()
  const failedChecks = checks.filter(check => check && check.status === 'FAILED').length
  return {
    schemaVersion: 1,
    phase: 6,
    gate: 'AI CI quality gate',
    generatedAt: '2026-07-28T12:00:00.000Z',
    git: { sha: 'abc123' },
    status: failedChecks ? 'FAILED' : 'PASSED',
    releaseDecision: failedChecks ? 'BLOCKED' : 'APPROVED',
    totalChecks: checks.length,
    passedChecks: checks.filter(check => check && check.status === 'PASSED').length,
    failedChecks,
    checks,
    ...overrides
  }
}

const fail = (checks, id) => checks.map(check => check.id === id ? { ...check, status: 'FAILED', exitCode: 1 } : check)

describe('AI CI evidence comparison service', () => {
  it('fails closed for invalid current evidence', () => {
    const result = compareAiCiEvidence(null, evidence())
    expect(result).toMatchObject({ valid: false, baselineStatus: 'UNAVAILABLE', outcome: 'INVALID_CURRENT_EVIDENCE' })
    expect(result.issues).toContain('Evidence must be a JSON object.')
  })

  it('treats a missing baseline as a first run and preserves current check status', () => {
    const current = evidence()
    const result = compareAiCiEvidence(current, null)
    expect(result).toMatchObject({ valid: true, baselineStatus: 'UNAVAILABLE', outcome: 'FIRST_RUN', decisionChanged: false })
    expect(result.current).toMatchObject({ releaseDecision: 'APPROVED', totalChecks: 7, git: { sha: 'abc123' } })
    expect(result.checkComparisons).toHaveLength(7)
    expect(result.checkComparisons[0]).toEqual(expect.objectContaining({ baselineStatus: 'NOT_AVAILABLE', change: 'NOT_COMPARABLE' }))
  })

  it('treats malformed baseline evidence as unavailable without blocking valid current evidence', () => {
    const result = compareAiCiEvidence(evidence(), { schemaVersion: 1 })
    expect(result).toMatchObject({ valid: true, baselineStatus: 'INVALID', outcome: 'BASELINE_INVALID', baseline: null })
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it('identifies newly failing checks as a regression', () => {
    const baseline = evidence()
    const current = evidence({ checks: fail(baseline.checks, 'ai-regression-tests') })
    const result = compareAiCiEvidence(current, baseline)
    expect(result.outcome).toBe('REGRESSION')
    expect(result.newFailures).toEqual(['ai-regression-tests'])
    expect(result.resolvedFailures).toEqual([])
    expect(result.decisionChanged).toBe(true)
    expect(result.checkComparisons.find(item => item.id === 'ai-regression-tests').change).toBe('PASSED_TO_FAILED')
  })

  it('identifies resolved failures as an improvement', () => {
    const current = evidence()
    const baseline = evidence({ checks: fail(current.checks, 'phase-5-completion') })
    const result = compareAiCiEvidence(current, baseline)
    expect(result.outcome).toBe('IMPROVEMENT')
    expect(result.resolvedFailures).toEqual(['phase-5-completion'])
    expect(result.decisionChanged).toBe(true)
  })

  it('classifies persistent failures and newly introduced checks without false regressions', () => {
    const baselineChecks = fail(baseChecks(), 'phase-3-evaluation')
    const currentChecks = [...fail(baseChecks(), 'phase-3-evaluation'), { id: 'optional-new-check', status: 'PASSED', exitCode: 0 }]
    const baseline = evidence({ checks: baselineChecks })
    const current = evidence({ checks: currentChecks })
    const result = compareAiCiEvidence(current, baseline)

    expect(result).toMatchObject({ outcome: 'STABLE', decisionChanged: false })
    expect(result.unchangedFailures).toEqual(['phase-3-evaluation'])
    expect(result.checkComparisons.find(item => item.id === 'optional-new-check')).toEqual({
      id: 'optional-new-check', baselineStatus: 'NOT_AVAILABLE', currentStatus: 'PASSED', change: 'NEW_CHECK'
    })
  })

  it('prioritizes regression when failures are both introduced and resolved', () => {
    const baseline = evidence({ checks: fail(baseChecks(), 'phase-2-briefing') })
    const current = evidence({ checks: fail(baseChecks(), 'phase-5-completion') })
    const result = compareAiCiEvidence(current, baseline)

    expect(result.outcome).toBe('REGRESSION')
    expect(result.newFailures).toEqual(['phase-5-completion'])
    expect(result.resolvedFailures).toEqual(['phase-2-briefing'])
    expect(result.decisionChanged).toBe(false)
  })

  it('rejects duplicate current check ids instead of allowing ambiguous comparison', () => {
    const current = evidence()
    current.checks.push({ ...current.checks[0] })
    current.totalChecks += 1
    current.passedChecks += 1

    const result = compareAiCiEvidence(current, evidence())
    expect(result).toMatchObject({ valid: false, outcome: 'INVALID_CURRENT_EVIDENCE' })
    expect(result.issues).toContain('Check ids must be unique.')
  })
})
