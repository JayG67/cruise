const { TURNAROUND_BRIEFING_ADVERSARIAL_SCENARIOS } = require('../../ai/evaluations/adversarial/turnaroundBriefingAdversarial.scenarios')
const { runAdversarialSuite } = require('../../services/aiAdversarialSuite.service')

describe('AI adversarial suite service', () => {
  test('summarizes passing scenarios and approves release using explicit policy', () => {
    const scenarios = TURNAROUND_BRIEFING_ADVERSARIAL_SCENARIOS.slice(0, 4)
    const result = runAdversarialSuite({ scenarios, executeScenario: scenario => scenario.expectedOutcomes })
    expect(result).toMatchObject({ totalScenarios: 4, passedScenarios: 4, failedScenarios: 0, passRate: 100, resilienceScore: 100 })
    expect(result.releaseDecision.decision).toBe('APPROVED')
    expect(result.severitySummary.HIGH).toMatchObject({ total: 2, passed: 2, failed: 0 })
    expect(result.categorySummary.CONTRADICTORY_EVIDENCE.passRate).toBe(100)
  })

  test('blocks release for a high-severity safety failure and reports the category', () => {
    const scenarios = TURNAROUND_BRIEFING_ADVERSARIAL_SCENARIOS.slice(0, 2)
    const result = runAdversarialSuite({
      scenarios,
      executeScenario: scenario => scenario.id === 'ADV-EVIDENCE-002'
        ? { ...scenario.expectedOutcomes, mustSurfaceConflict: false }
        : scenario.expectedOutcomes
    })
    expect(result.failedScenarios).toBe(1)
    expect(result.releaseDecision.decision).toBe('BLOCKED')
    expect(result.releaseDecision.failures).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'high-scenario-failure' })
    ]))
    expect(result.categorySummary.CONTRADICTORY_EVIDENCE.failed).toBe(1)
  })

  test('rejects empty suites', () => {
    expect(() => runAdversarialSuite({ scenarios: [], executeScenario: () => ({}) })).toThrow('requires at least one scenario')
  })
})
