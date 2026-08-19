const {
  PHASE_ONE_COMPLETION_CRITERIA,
  buildAiFoundationCompletion,
  assertAiFoundationComplete
} = require('../../services/aiFoundationCompletion.service')

describe('AI Phase 1 foundation completion', () => {
  it('closes Phase 1 at exactly 100% while Phase 2 proceeds independently', () => {
    const completion = buildAiFoundationCompletion({ env: {} })

    expect(completion).toEqual(expect.objectContaining({
      phase: 1,
      name: 'AI foundation',
      status: 'COMPLETE',
      percentComplete: 100,
      completed: true,
      phaseTwoStarted: true
    }))
    expect(completion.completionCriteria).toEqual(PHASE_ONE_COMPLETION_CRITERIA)
    expect(completion.nextPhase).toEqual({
      phase: 2,
      name: 'Turnaround briefing',
      status: 'COMPLETE'
    })
  })

  it('returns defensive completion criteria copies', () => {
    const first = buildAiFoundationCompletion({ env: {} })
    first.completionCriteria.push('invalid')
    const second = buildAiFoundationCompletion({ env: {} })

    expect(second.completionCriteria).toEqual(PHASE_ONE_COMPLETION_CRITERIA)
  })

  it('blocks completion when deployment readiness fails', () => {
    const completion = buildAiFoundationCompletion({ env: { AI_TIMEOUT_MS: 'invalid' } })

    expect(completion.status).toBe('BLOCKED')
    expect(completion.percentComplete).toBe(0)
    expect(completion.completed).toBe(false)
    expect(() => assertAiFoundationComplete({ env: { AI_TIMEOUT_MS: 'invalid' } }))
      .toThrow(expect.objectContaining({ code: 'AI_FOUNDATION_INCOMPLETE' }))
  })

  it('returns the completed foundation from the assertion helper', () => {
    const completion = assertAiFoundationComplete({ env: {} })

    expect(completion.completed).toBe(true)
    expect(completion.status).toBe('COMPLETE')
    expect(completion.percentComplete).toBe(100)
  })

  it('blocks completion when pricing configuration is invalid and preserves the readiness issue', () => {
    const env = { OPENAI_INPUT_USD_PER_MILLION_TOKENS: 'not-a-number' }
    const completion = buildAiFoundationCompletion({ env })

    expect(completion.completed).toBe(false)
    expect(completion.readiness.pricingConfigValid).toBe(false)
    expect(completion.readiness.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'AI_RUNTIME_CONFIG_INVALID' })
    ]))
    expect(() => assertAiFoundationComplete({ env })).toThrow(expect.objectContaining({
      code: 'AI_FOUNDATION_INCOMPLETE'
    }))
  })

})

describe('AI foundation completion options hardening', () => {
  it('accepts an explicit null options object without leaking a destructuring TypeError', () => {
    expect(() => buildAiFoundationCompletion(null)).not.toThrow()
    expect(buildAiFoundationCompletion(null)).toEqual(expect.objectContaining({ phase: 1, percentComplete: 100 }))
  })
})
