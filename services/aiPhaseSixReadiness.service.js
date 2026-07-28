const PHASE_SIX_CAPABILITIES = Object.freeze([
  'dedicated AI CI quality gate',
  'phase audit execution in CI',
  'targeted AI regression execution in CI',
  'machine-readable CI evidence artifact',
  'always-published CI evidence',
  'CI job summary reporting',
  'strict CI evidence schema validation',
  'release-blocking evidence policy',
  'historical CI evidence retention and comparison',
  'Quality Console CI evidence ingestion',
  'formal Phase 6 completion audit'
])

const PHASE_SIX_NEXT_CAPABILITIES = Object.freeze([])

function buildAiPhaseSixReadiness() {
  return {
    phase: 6,
    name: 'CI integration',
    status: 'COMPLETE',
    percentComplete: 100,
    completedCapabilities: [...PHASE_SIX_CAPABILITIES],
    nextCapabilities: [...PHASE_SIX_NEXT_CAPABILITIES],
    evidenceArtifact: 'ai-quality-evidence/phase6-ci-evidence.json',
    qualityGateCommand: 'npm run ai:ci:gate',
    evidenceVerificationCommand: 'npm run ai:ci:evidence:verify',
    evidenceComparisonCommand: 'npm run ai:ci:evidence:compare',
    comparisonArtifact: 'ai-quality-evidence/phase6-ci-comparison.json',
    evidenceRetentionDays: 30
  }
}

module.exports = {
  PHASE_SIX_CAPABILITIES,
  PHASE_SIX_NEXT_CAPABILITIES,
  buildAiPhaseSixReadiness
}
