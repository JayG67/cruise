const {
  REQUIRED_CHECK_IDS,
  validateAiCiEvidence,
  evaluateAiCiReleasePolicy
} = require('../../services/aiCiEvidencePolicy.service')

function buildEvidence(overrides = {}) {
  const checks = REQUIRED_CHECK_IDS.map(id => ({
    id,
    command: `npm run ${id}`,
    status: 'PASSED',
    exitCode: 0,
    startedAt: '2026-07-28T12:00:00.000Z',
    completedAt: '2026-07-28T12:00:01.000Z',
    stdout: '',
    stderr: ''
  }))

  return {
    schemaVersion: 1,
    phase: 6,
    gate: 'AI CI quality gate',
    generatedAt: '2026-07-28T12:00:01.000Z',
    git: { sha: 'abc123', ref: 'refs/heads/main', runId: '1', runAttempt: '1' },
    status: 'PASSED',
    releaseDecision: 'APPROVED',
    totalChecks: checks.length,
    passedChecks: checks.length,
    failedChecks: 0,
    checks,
    ...overrides
  }
}

describe('AI CI evidence release policy', () => {
  it('approves complete, internally consistent passing evidence', () => {
    const evidence = buildEvidence()
    expect(validateAiCiEvidence(evidence)).toEqual({ valid: true, issues: [] })
    expect(evaluateAiCiReleasePolicy(evidence)).toMatchObject({
      allowed: true,
      decision: 'APPROVED'
    })
  })

  it('blocks evidence that omits a required check', () => {
    const evidence = buildEvidence()
    evidence.checks = evidence.checks.slice(1)
    evidence.totalChecks = evidence.checks.length
    evidence.passedChecks = evidence.checks.length

    const policy = evaluateAiCiReleasePolicy(evidence)
    expect(policy.allowed).toBe(false)
    expect(policy.decision).toBe('BLOCKED')
    expect(policy.issues).toContain(`Required check is missing: ${REQUIRED_CHECK_IDS[0]}.`)
  })

  it('blocks a failed quality gate even when its evidence is valid', () => {
    const evidence = buildEvidence()
    evidence.checks[0] = { ...evidence.checks[0], status: 'FAILED', exitCode: 1 }
    evidence.status = 'FAILED'
    evidence.releaseDecision = 'BLOCKED'
    evidence.passedChecks -= 1
    evidence.failedChecks = 1

    expect(validateAiCiEvidence(evidence)).toEqual({ valid: true, issues: [] })
    expect(evaluateAiCiReleasePolicy(evidence)).toMatchObject({
      allowed: false,
      decision: 'BLOCKED',
      reason: 'One or more required AI quality checks failed.'
    })
  })
})
