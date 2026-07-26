const { AI_PROGRAM_PHASES, getAiProgramStatus } = require('../../services/aiProgramStatus.service')

describe('AI program status', () => {
  it('reports all six phases in stable order on every development step', () => {
    const status = getAiProgramStatus()
    expect(status.phases).toHaveLength(6)
    expect(status.phases.map(phase => phase.phase)).toEqual([1, 2, 3, 4, 5, 6])
    expect(status.currentPhase).toBe(1)
    expect(status.completedPhases).toBe(0)
    expect(status.phases[0]).toEqual({ phase: 1, name: 'AI foundation', status: 'IN_PROGRESS' })
    expect(status.phases.slice(1).every(phase => phase.status === 'NOT_STARTED')).toBe(true)
  })

  it('returns defensive phase copies and explicit phase-one capability status', () => {
    const first = getAiProgramStatus()
    first.phases[0].status = 'BROKEN'
    const second = getAiProgramStatus()

    expect(second.phases).toEqual(AI_PROGRAM_PHASES)
    expect(second.phaseOneCapabilities).toEqual(expect.objectContaining({
      providerAbstraction: true,
      structuredContracts: true,
      evidenceGroundingValidation: true,
      productionModelProvider: false,
      userInterface: false
    }))
  })
})
