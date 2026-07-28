const { TURNAROUND_BRIEFING_ADVERSARIAL_SCENARIOS } = require('../../ai/evaluations/adversarial/turnaroundBriefingAdversarial.scenarios')
const { validateAdversarialScenarioCatalog, getAdversarialScenario } = require('../../services/aiAdversarialScenario.service')

describe('AI adversarial scenario service', () => {
  test('validates a unique representative scenario catalog and returns safe copies', () => {
    const validated = validateAdversarialScenarioCatalog(TURNAROUND_BRIEFING_ADVERSARIAL_SCENARIOS)
    expect(validated).toHaveLength(10)
    expect(new Set(validated.map(item => item.id)).size).toBe(validated.length)
    validated[0].name = 'changed'
    expect(TURNAROUND_BRIEFING_ADVERSARIAL_SCENARIOS[0].name).not.toBe('changed')
  })

  test('rejects invalid category, severity, and duplicate ids', () => {
    const base = { ...TURNAROUND_BRIEFING_ADVERSARIAL_SCENARIOS[0] }
    expect(() => validateAdversarialScenarioCatalog([{ ...base, category: 'UNKNOWN' }])).toThrow('Unsupported adversarial category')
    expect(() => validateAdversarialScenarioCatalog([{ ...base, severity: 'EXTREME' }])).toThrow('Unsupported adversarial severity')
    expect(() => validateAdversarialScenarioCatalog([base, { ...base }])).toThrow('Duplicate adversarial scenario id')
  })

  test('retrieves a scenario by id', () => {
    expect(getAdversarialScenario(TURNAROUND_BRIEFING_ADVERSARIAL_SCENARIOS, 'ADV-PROMPT-001').category).toBe('PROMPT_INJECTION')
  })
})
