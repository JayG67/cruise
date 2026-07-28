const { buildAiPhaseSixReadiness } = require('../../services/aiPhaseSixReadiness.service')
const { getAiProgramStatus } = require('../../services/aiProgramStatus.service')

describe('AI Phase 6 readiness service', () => {
  it('reports the first CI integration slice in progress', () => {
    const readiness = buildAiPhaseSixReadiness()
    const status = getAiProgramStatus()

    expect(readiness).toMatchObject({
      phase: 6,
      name: 'CI integration',
      status: 'IN_PROGRESS',
      percentComplete: 25,
      evidenceArtifact: 'ai-quality-evidence/phase6-ci-evidence.json',
      qualityGateCommand: 'npm run ai:ci:gate'
    })
    expect(readiness.completedCapabilities).toContain('machine-readable CI evidence artifact')
    expect(readiness.nextCapabilities).toContain('release-blocking branch protection contract')
    expect(status.currentPhase).toBe(6)
    expect(status.completedPhases).toBe(5)
    expect(status.currentPhasePercentComplete).toBe(25)
  })
})
