const { assessAiPhaseThreeCompletion } = require('../../services/aiPhaseThreeCompletion.service')

describe('AI Phase 3 completion', () => {
  it('marks the evaluation harness complete and advances Phase 4', () => {
    expect(assessAiPhaseThreeCompletion()).toEqual(expect.objectContaining({
      phase: 3,
      status: 'COMPLETE',
      percentComplete: 100,
      complete: true,
      nextPhase: expect.objectContaining({ phase: 4, status: 'IN_PROGRESS', percentComplete: 15 })
    }))
  })
})
