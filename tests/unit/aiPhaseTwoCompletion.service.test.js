const {
  PHASE_TWO_COMPLETION_CRITERIA,
  buildAiPhaseTwoCompletion,
  assertAiPhaseTwoComplete
} = require('../../services/aiPhaseTwoCompletion.service')

describe('AI Phase 2 completion', () => {
  it('keeps Phase 2 complete after Phase 3 completes', () => {
    const completion = buildAiPhaseTwoCompletion()
    expect(completion).toEqual(expect.objectContaining({
      phase: 2,
      status: 'COMPLETE',
      percentComplete: 100,
      completed: true,
      phaseThreeStarted: true
    }))
    expect(completion.nextPhase).toEqual({ phase: 3, name: 'Evaluation harness', status: 'COMPLETE' })
  })

  it('publishes defensive completion criteria and passes the completion assertion', () => {
    const completion = assertAiPhaseTwoComplete()
    completion.completionCriteria.push('mutated')
    expect(PHASE_TWO_COMPLETION_CRITERIA).not.toContain('mutated')
    expect(Object.isFrozen(PHASE_TWO_COMPLETION_CRITERIA)).toBe(true)
  })
})
