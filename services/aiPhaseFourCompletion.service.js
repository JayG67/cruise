const PHASE_FOUR_COMPLETION_CRITERIA = Object.freeze([
  'release readiness summary',
  'evaluation history table',
  'quality trend analysis',
  'provider model and prompt metadata',
  'failed case drilldown',
  'recurring failure summary',
  'interactive baseline selection',
  'run comparison',
  'release policy controls',
  'history filtering and sorting',
  'Quality Console browser workflow coverage',
  'Phase 4 completion audit'
])

function assessAiPhaseFourCompletion() {
  return {
    phase: 4,
    name: 'AI Quality Console',
    status: 'COMPLETE',
    percentComplete: 100,
    complete: true,
    completionCriteria: [...PHASE_FOUR_COMPLETION_CRITERIA],
    nextPhase: {
      phase: 5,
      name: 'Adversarial and resilience testing',
      status: 'NOT_STARTED',
      percentComplete: 0
    }
  }
}

module.exports = { PHASE_FOUR_COMPLETION_CRITERIA, assessAiPhaseFourCompletion }
