const { TURNAROUND_PROVIDER_RUNTIME_SCENARIOS } = require('../../ai/evaluations/adversarial/turnaroundBriefingProviderRuntime.scenarios')
const { createProviderRuntimeFixture, runProviderRuntimeAdversarialSuite, simulateProviderRuntimeScenario } = require('../../services/aiProviderRuntimeAdversarial.service')

describe('AI provider runtime adversarial service', () => {
  test('executes every provider and runtime resilience scenario deterministically', () => {
    const first = runProviderRuntimeAdversarialSuite({ metadata:{ evaluatedAt:'2026-07-28T00:00:00.000Z' } })
    const second = runProviderRuntimeAdversarialSuite({ metadata:{ evaluatedAt:'2026-07-28T00:00:00.000Z' } })
    expect(first).toEqual(second)
    expect(first.totalScenarios).toBe(11)
    expect(first.failedScenarios).toBe(0)
    expect(first.resilienceScore).toBe(100)
    expect(first.releaseDecision.decision).toBe('APPROVED')
  })

  test.each(TURNAROUND_PROVIDER_RUNTIME_SCENARIOS)('produces diagnostics for $id', scenario => {
    const result = simulateProviderRuntimeScenario(scenario)
    expect(result.diagnostics.length).toBeGreaterThan(0)
    expect(result.observedOutcomes.mustReturnDiagnostic).toBe(true)
  })

  test('does not mutate the supplied runtime fixture', () => {
    const fixture = createProviderRuntimeFixture()
    const before = JSON.parse(JSON.stringify(fixture))
    simulateProviderRuntimeScenario(TURNAROUND_PROVIDER_RUNTIME_SCENARIOS[0], { fixture })
    expect(fixture).toEqual(before)
  })
})
