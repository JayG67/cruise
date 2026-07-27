const PHASE_THREE_COMPLETION_CRITERIA = Object.freeze([
  'versioned reusable evaluation cases',
  'weighted deterministic scoring',
  'diagnostic suite runner',
  'persistent evaluation history',
  'baseline regression comparison',
  'provider model and prompt matrix execution',
  'configurable release quality gate',
  'administrator evaluation APIs',
  'Quality Console integration',
  'Phase 3 architecture audit',
  'Phase 3 completion audit'
])

function assessAiPhaseThreeCompletion() {
  return {
    phase: 3,
    name: 'Evaluation harness',
    status: 'COMPLETE',
    percentComplete: 100,
    complete: true,
    completionCriteria: [...PHASE_THREE_COMPLETION_CRITERIA],
    nextPhase: {
      phase: 4,
      name: 'AI Quality Console',
      status: 'IN_PROGRESS',
      percentComplete: 15
    }
  }
}

module.exports = { PHASE_THREE_COMPLETION_CRITERIA, assessAiPhaseThreeCompletion }
