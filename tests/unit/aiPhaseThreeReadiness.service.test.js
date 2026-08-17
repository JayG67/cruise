const { buildAiPhaseThreeReadiness } = require('../../services/aiPhaseThreeReadiness.service')

describe('AI Phase 3 readiness', () => {
  afterEach(() => {
    jest.resetModules()
    jest.dontMock('../../services/aiProgramStatus.service')
  })
  it('reports the completed evaluation harness', () => {
    const readiness = buildAiPhaseThreeReadiness()
    expect(readiness).toEqual(expect.objectContaining({ phase: 3, name: 'Evaluation harness', status: 'COMPLETE', percentComplete: 100 }))
    expect(readiness.completedCapabilities).toHaveLength(14)
    expect(readiness.nextCapabilities).toContain('Phase 4 trend visualization and filtering')
  })

  it('reports active Phase 3 progress instead of claiming 100 percent', () => {
    jest.resetModules()
    jest.doMock('../../services/aiProgramStatus.service', () => ({
      getAiProgramStatus: () => ({
        phases: [{ phase: 3, status: 'IN_PROGRESS' }],
        currentPhase: 3,
        currentPhasePercentComplete: 42
      })
    }))
    const { buildAiPhaseThreeReadiness: buildReadiness } = require('../../services/aiPhaseThreeReadiness.service')
    expect(buildReadiness()).toEqual(expect.objectContaining({ status: 'IN_PROGRESS', percentComplete: 42 }))
  })

  it('fails closed for missing, malformed, or out-of-range Phase 3 progress', () => {
    const cases = [
      [{ phases: [], currentPhase: 2, currentPhasePercentComplete: 99 }, 'NOT_STARTED', 0],
      [{ phases: [{ phase: 3, status: 'IN_PROGRESS' }], currentPhase: 3, currentPhasePercentComplete: 'bad' }, 'IN_PROGRESS', 0],
      [{ phases: [{ phase: 3, status: 'IN_PROGRESS' }], currentPhase: 3, currentPhasePercentComplete: 140 }, 'IN_PROGRESS', 100],
      [{ phases: [{ phase: 3, status: 'IN_PROGRESS' }], currentPhase: 3, currentPhasePercentComplete: -8 }, 'IN_PROGRESS', 0]
    ]

    for (const [programStatus, expectedStatus, expectedPercent] of cases) {
      jest.resetModules()
      jest.doMock('../../services/aiProgramStatus.service', () => ({ getAiProgramStatus: () => programStatus }))
      const { buildAiPhaseThreeReadiness: buildReadiness } = require('../../services/aiPhaseThreeReadiness.service')
      expect(buildReadiness()).toEqual(expect.objectContaining({ status: expectedStatus, percentComplete: expectedPercent }))
    }
  })
})
