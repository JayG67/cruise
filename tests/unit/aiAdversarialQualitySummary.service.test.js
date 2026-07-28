const { buildAiAdversarialQualitySummary } = require('../../services/aiAdversarialQualitySummary.service')

describe('AI adversarial Quality Console summary', () => {
  test('aggregates all Phase 5 suites into an approved release gate', () => {
    const summary = buildAiAdversarialQualitySummary()
    expect(summary).toMatchObject({ phase: 5, status: 'READY', totalSuites: 3, totalScenarios: 31, passedScenarios: 31, failedScenarios: 0, resilienceScore: 100, releaseDecision: 'APPROVED' })
    expect(summary.suites).toHaveLength(3)
    expect(summary.suites.every(suite => suite.resilienceScore === 100)).toBe(true)
  })
})
