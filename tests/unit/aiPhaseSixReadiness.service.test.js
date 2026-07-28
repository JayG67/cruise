const { buildAiPhaseSixReadiness } = require('../../services/aiPhaseSixReadiness.service')
const { getAiProgramStatus } = require('../../services/aiProgramStatus.service')

describe('AI Phase 6 readiness service', () => {
  it('reports the historical CI evidence comparison slice in progress', () => {
    const readiness = buildAiPhaseSixReadiness()
    const status = getAiProgramStatus()

    expect(readiness).toMatchObject({
      phase: 6,
      name: 'CI integration',
      status: 'IN_PROGRESS',
      percentComplete: 75,
      evidenceArtifact: 'ai-quality-evidence/phase6-ci-evidence.json',
      qualityGateCommand: 'npm run ai:ci:gate',
      evidenceVerificationCommand: 'npm run ai:ci:evidence:verify',
      evidenceComparisonCommand: 'npm run ai:ci:evidence:compare',
      comparisonArtifact: 'ai-quality-evidence/phase6-ci-comparison.json',
      evidenceRetentionDays: 30
    })
    expect(readiness.completedCapabilities).toContain('machine-readable CI evidence artifact')
    expect(readiness.completedCapabilities).toContain('strict CI evidence schema validation')
    expect(readiness.completedCapabilities).toContain('release-blocking evidence policy')
    expect(readiness.completedCapabilities).toContain('historical CI evidence retention and comparison')
    expect(readiness.nextCapabilities).toContain('quality console CI evidence ingestion')
    expect(status.currentPhase).toBe(6)
    expect(status.completedPhases).toBe(5)
    expect(status.currentPhasePercentComplete).toBe(75)
    expect(status.phaseSixCapabilities.evidenceSchemaValidation).toBe(true)
    expect(status.phaseSixCapabilities.releaseBlockingPolicy).toBe(true)
    expect(status.phaseSixCapabilities.historicalEvidenceComparison).toBe(true)
  })
})
