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
  'administrator evaluation run, history, and comparison API'
])

function buildAiPhaseThreeReadiness() {
  const status = getAiProgramStatus()
  return {
    phase: 3,
    name: 'Evaluation harness',
    status: status.phases.find(item => item.phase === 3)?.status || 'NOT_STARTED',
    percentComplete: status.currentPhasePercentComplete,
    completedCapabilities: [...PHASE_THREE_COMPLETED_CAPABILITIES],
    nextCapabilities: [
      'expanded golden datasets',
      'provider and prompt version matrix execution',
      'configurable release regression policies',
      'Quality Console integration',
      'Phase 3 completion audit'
    ]
  }
}

module.exports = { PHASE_THREE_COMPLETED_CAPABILITIES, buildAiPhaseThreeReadiness }
