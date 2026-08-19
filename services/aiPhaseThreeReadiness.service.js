const { getAiProgramStatus } = require('./aiProgramStatus.service')

const PHASE_THREE_COMPLETED_CAPABILITIES = Object.freeze([
  'versioned reusable evaluation cases',
  'weighted scoring contract',
  'deterministic briefing evaluator',
  'suite-level evaluation runner',
  'case diagnostics and pass/fail verdicts',
  'unit and architecture audit coverage',
  'persistent evaluation run storage through AI audit events',
  'provider and prompt regression baseline comparison',
  'administrator evaluation run, history, and comparison API',
  'expanded golden turnaround briefing dataset',
  'provider, model, and prompt version matrix execution',
  'configurable release regression policies and gate decisions',
  'Quality Console evaluation history and release-readiness integration',
  'Phase 3 completion audit'
])

function buildAiPhaseThreeReadiness() {
  const status = getAiProgramStatus()
  const phaseStatus = status.phases.find(item => item.phase === 3)?.status || 'NOT_STARTED'
  const phaseComplete = phaseStatus === 'COMPLETE'
  const percentComplete = phaseComplete ? 100 : (status.currentPhase === 3 ? Number(status.currentPhasePercentComplete || 0) : 0)
  return {
    phase: 3,
    name: 'Evaluation harness',
    status: phaseStatus,
    percentComplete: Math.max(0, Math.min(100, Number.isFinite(percentComplete) ? percentComplete : 0)),
    completedCapabilities: [...PHASE_THREE_COMPLETED_CAPABILITIES],
    nextCapabilities: [
      'Phase 4 trend visualization and filtering',
      'Phase 4 interactive baseline selection'
    ]
  }
}

module.exports = { PHASE_THREE_COMPLETED_CAPABILITIES, buildAiPhaseThreeReadiness }
