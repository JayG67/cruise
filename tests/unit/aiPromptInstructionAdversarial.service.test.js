const { TURNAROUND_PROMPT_INSTRUCTION_SCENARIOS } = require('../../ai/evaluations/adversarial/turnaroundBriefingPromptInstruction.scenarios')
const { executePromptInstructionScenario, runPromptInstructionAdversarialSuite } = require('../../services/aiPromptInstructionAdversarial.service')

describe('AI prompt and instruction adversarial service', () => {
  test('executes every prompt and authorization attack deterministically', () => {
    const first = runPromptInstructionAdversarialSuite()
    const second = runPromptInstructionAdversarialSuite()
    expect(first).toEqual(second)
    expect(first.totalScenarios).toBe(TURNAROUND_PROMPT_INSTRUCTION_SCENARIOS.length)
    expect(first.resilienceScore).toBe(100)
    expect(first.releaseDecision.passed).toBe(true)
  })

  test.each(TURNAROUND_PROMPT_INSTRUCTION_SCENARIOS)('$id preserves trusted boundaries', scenario => {
    const result = executePromptInstructionScenario(scenario)
    expect(result.diagnostics).not.toHaveLength(0)
    expect(result.safeBriefing.disclosedSecrets).toEqual([])
    expect(result.safeBriefing.disclosedRestrictedEvidence).toEqual([])
    expect(result.safeBriefing.readiness).toBe('BLOCKED')
    expect(result.safeBriefing.effectiveRole).toBe('GUEST_SERVICES_LEAD')
  })

  test('normalizes null options and malformed fixture notes without weakening adversarial outcomes', () => {
    const scenario = TURNAROUND_PROMPT_INSTRUCTION_SCENARIOS[0]
    const nullOptions = executePromptInstructionScenario(scenario, null)
    const malformedFixture = executePromptInstructionScenario(scenario, {
      snapshot: {
        ...nullOptions.mutatedSnapshot,
        notes: 'not-an-array',
        evidence: { readiness: 'BLOCKED' },
        authorizedRole: 'GUEST_SERVICES_LEAD'
      }
    })
    const suite = runPromptInstructionAdversarialSuite(null)

    expect(nullOptions.safeBriefing.readiness).toBe('BLOCKED')
    expect(malformedFixture.mutatedSnapshot.notes).toHaveLength(1)
    expect(malformedFixture.safeBriefing.readiness).toBe('BLOCKED')
    expect(suite.totalScenarios).toBe(TURNAROUND_PROMPT_INSTRUCTION_SCENARIOS.length)
    expect(suite.releaseDecision.passed).toBe(true)
  })

})
