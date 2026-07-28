const { buildAiPhaseFiveReadiness } = require('../../services/aiPhaseFiveReadiness.service')
const { getAiProgramStatus } = require('../../services/aiProgramStatus.service')

describe('AI Phase 5 readiness service', () => {
  test('reports the adversarial foundation in progress without completing Phase 5', () => {
    const readiness = buildAiPhaseFiveReadiness()
    const program = getAiProgramStatus()
    expect(readiness).toMatchObject({ phase: 5, status: 'IN_PROGRESS', percentComplete: 60 })
    expect(readiness.completedCapabilities).toContain('severity-weighted resilience scoring')
    expect(program.completedPhases).toBe(4)
    expect(program.phaseFiveCapabilities).toMatchObject({
      adversarialScenarioContract: true,
      adversarialSuiteRunner: true,
      architectureAudit: true,
      operationalEvidenceAttacks: true,
      tenantIsolationAttackCoverage: true,
      phaseFiveComplete: false
    })
    expect(program.phases.find(item => item.phase === 6).status).toBe('NOT_STARTED')
  })
})
