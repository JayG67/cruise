const {
  PHASE_TWO_COMPLETION_CRITERIA,
  buildAiPhaseTwoCompletion,
  assertAiPhaseTwoComplete
} = require('../../services/aiPhaseTwoCompletion.service')

describe('AI Phase 2 completion', () => {
  it('reports Phase 2 complete without starting Phase 3', () => {
    const completion = buildAiPhaseTwoCompletion()
    expect(completion).toEqual(expect.objectContaining({
      phase: 2,
      status: 'COMPLETE',
      percentComplete: 100,
      completed: true,
      phaseThreeStarted: false
    }))
    expect(completion.nextPhase).toEqual({ phase: 3, name: 'Evaluation harness', status: 'NOT_STARTED' })
  })

  it('publishes defensive completion criteria and passes the completion assertion', () => {
    const completion = assertAiPhaseTwoComplete()
    completion.completionCriteria.push('mutated')
    expect(PHASE_TWO_COMPLETION_CRITERIA).not.toContain('mutated')
    expect(Object.isFrozen(PHASE_TWO_COMPLETION_CRITERIA)).toBe(true)
  })
})
