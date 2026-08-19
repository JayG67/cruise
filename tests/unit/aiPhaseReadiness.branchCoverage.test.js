describe('AI phase readiness alternate-state branch coverage', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('Phase 2 reports blocked when the briefing phase is incomplete and Phase 3 has not started', () => {
    jest.doMock('../../services/aiProgramStatus.service', () => ({
      getAiProgramStatus: () => ({
        phases: [{ phase: 2, status: 'IN_PROGRESS' }, { phase: 3, status: 'NOT_STARTED' }]
      })
    }))
    const { buildAiPhaseTwoCompletion, assertAiPhaseTwoComplete } = require('../../services/aiPhaseTwoCompletion.service')

    const completion = buildAiPhaseTwoCompletion()
    expect(completion).toEqual(expect.objectContaining({
      status: 'BLOCKED', percentComplete: 0, completed: false, phaseThreeStarted: false
    }))
    expect(completion.nextPhase.status).toBe('NOT_STARTED')
    let error
    try { assertAiPhaseTwoComplete() } catch (caught) { error = caught }
    expect(error).toEqual(expect.objectContaining({ code: 'AI_PHASE_TWO_INCOMPLETE' }))
  })

  test('Phase 2 tolerates missing phase metadata with fail-closed defaults', () => {
    jest.doMock('../../services/aiProgramStatus.service', () => ({ getAiProgramStatus: () => ({ phases: [] }) }))
    const { buildAiPhaseTwoCompletion } = require('../../services/aiPhaseTwoCompletion.service')
    expect(buildAiPhaseTwoCompletion()).toEqual(expect.objectContaining({
      status: 'BLOCKED', phaseThreeStarted: true,
      nextPhase: expect.objectContaining({ status: 'NOT_STARTED' })
    }))
  })

  test('Phase 5 reports current progress when incomplete but active', () => {
    jest.doMock('../../services/aiProgramStatus.service', () => ({
      getAiProgramStatus: () => ({
        phases: [{ phase: 5, status: 'IN_PROGRESS' }],
        phaseFiveCapabilities: { phaseFiveComplete: false },
        currentPhase: 5,
        currentPhasePercentComplete: 64
      })
    }))
    const { buildAiPhaseFiveReadiness } = require('../../services/aiPhaseFiveReadiness.service')
    expect(buildAiPhaseFiveReadiness()).toEqual(expect.objectContaining({ status: 'IN_PROGRESS', percentComplete: 64 }))
  })

  test('Phase 5 reports zero progress and a safe status when inactive or absent', () => {
    jest.doMock('../../services/aiProgramStatus.service', () => ({
      getAiProgramStatus: () => ({ phases: [], phaseFiveCapabilities: { phaseFiveComplete: false }, currentPhase: 4, currentPhasePercentComplete: 80 })
    }))
    const { buildAiPhaseFiveReadiness } = require('../../services/aiPhaseFiveReadiness.service')
    expect(buildAiPhaseFiveReadiness()).toEqual(expect.objectContaining({ status: 'NOT_STARTED', percentComplete: 0 }))
  })
})
