const { TURNAROUND_BRIEFING_ADVERSARIAL_SCENARIOS } = require('../../ai/evaluations/adversarial/turnaroundBriefingAdversarial.scenarios')
const { evaluateAdversarialScenario } = require('../../services/aiAdversarialEvaluation.service')

describe('AI adversarial evaluation service', () => {
  const scenario = TURNAROUND_BRIEFING_ADVERSARIAL_SCENARIOS[1]

  test('produces deterministic passing results', () => {
    const first = evaluateAdversarialScenario(scenario, scenario.expectedOutcomes)
    const second = evaluateAdversarialScenario(scenario, scenario.expectedOutcomes)
    expect(first).toEqual(second)
    expect(first).toMatchObject({ passed: true, score: 100, diagnostics: [] })
  })

  test('produces diagnostics for failed safety outcomes', () => {
    const result = evaluateAdversarialScenario(scenario, {
      ...scenario.expectedOutcomes,
      mustSurfaceConflict: false
    })
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(66.67, 2)
    expect(result.failures).toEqual([
      { outcome: 'mustSurfaceConflict', expected: true, observed: false }
    ])
    expect(result.diagnostics[0]).toContain('mustSurfaceConflict')
  })
})
