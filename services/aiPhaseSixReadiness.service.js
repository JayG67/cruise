const PHASE_SIX_CAPABILITIES = Object.freeze([
  'dedicated AI CI quality gate',
  'phase audit execution in CI',
  'targeted AI regression execution in CI',
  'machine-readable CI evidence artifact',
  'always-published CI evidence',
  'CI job summary reporting'
])

const PHASE_SIX_NEXT_CAPABILITIES = Object.freeze([
  'release-blocking branch protection contract',
  'historical CI evidence retention and comparison',
  'quality console CI evidence ingestion',
  'formal Phase 6 completion audit'
])

function buildAiPhaseSixReadiness() {
  return {
    phase: 6,
    name: 'CI integration',
    status: 'IN_PROGRESS',
    percentComplete: 25,
    completedCapabilities: [...PHASE_SIX_CAPABILITIES],
    nextCapabilities: [...PHASE_SIX_NEXT_CAPABILITIES],
    evidenceArtifact: 'ai-quality-evidence/phase6-ci-evidence.json',
    qualityGateCommand: 'npm run ai:ci:gate'
  }
}

module.exports = {
  PHASE_SIX_CAPABILITIES,
  PHASE_SIX_NEXT_CAPABILITIES,
  buildAiPhaseSixReadiness
}
