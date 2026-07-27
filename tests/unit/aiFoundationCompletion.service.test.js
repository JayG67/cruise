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
      status: 'IN_PROGRESS'
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
})
