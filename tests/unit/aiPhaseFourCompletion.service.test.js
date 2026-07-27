const {
  PHASE_FOUR_COMPLETION_CRITERIA,
  assessAiPhaseFourCompletion
} = require('../../services/aiPhaseFourCompletion.service')

describe('AI Phase 4 completion', () => {
  it('marks the AI Quality Console complete and identifies Phase 5 as next', () => {
    expect(assessAiPhaseFourCompletion()).toEqual(expect.objectContaining({
      phase: 4,
      name: 'AI Quality Console',
      status: 'COMPLETE',
      percentComplete: 100,
      complete: true,
      completionCriteria: PHASE_FOUR_COMPLETION_CRITERIA,
      nextPhase: {
        phase: 5,
        name: 'Adversarial and resilience testing',
        status: 'NOT_STARTED',
        percentComplete: 0
      }
    }))
  })

  it('returns a defensive completion criteria copy', () => {
    const first = assessAiPhaseFourCompletion()
    first.completionCriteria.push('unexpected mutation')
    expect(assessAiPhaseFourCompletion().completionCriteria).toEqual(PHASE_FOUR_COMPLETION_CRITERIA)
  })
})
