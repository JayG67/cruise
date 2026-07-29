const { buildAiPhaseFiveReadiness } = require('../../services/aiPhaseFiveReadiness.service')
const { getAiProgramStatus } = require('../../services/aiProgramStatus.service')

describe('AI Phase 5 readiness service', () => {
  test('reports Phase 5 complete after console and browser integration', () => {
    const readiness = buildAiPhaseFiveReadiness()
    const program = getAiProgramStatus()
    expect(readiness).toMatchObject({ phase: 5, status: 'COMPLETE', percentComplete: 100 })
    expect(readiness.completedCapabilities).toContain('severity-weighted resilience scoring')
    expect(program.completedPhases).toBe(6)
    expect(program.phaseFiveCapabilities).toMatchObject({
      adversarialScenarioContract: true,
      adversarialSuiteRunner: true,
      architectureAudit: true,
      operationalEvidenceAttacks: true,
      tenantIsolationAttackCoverage: true,
      qualityConsoleIntegration: true,
      browserWorkflowCoverage: true,
      completionAudit: true,
      phaseFiveComplete: true
    })
    expect(program.phases.find(item => item.phase === 6).status).toBe('COMPLETE')
    expect(program.currentPhasePercentComplete).toBe(100)
  })
})
