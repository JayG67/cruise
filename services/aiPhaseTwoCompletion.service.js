const { getAiProgramStatus } = require('./aiProgramStatus.service')

const PHASE_TWO_COMPLETION_CRITERIA = Object.freeze([
  'operation-scoped evidence loading',
  'risk-prioritized evidence selection',
  'tenant-scoped authorization',
  'structured turnaround briefing generation',
  'persistent briefing history',
  'immutable human review events',
  'generation and regeneration workspace',
  'evidence summary and citations display',
  'responsive and accessible controls',
  'browser workflow coverage',
  'provider-disabled error handling',
  'phase completion audit'
])

function buildAiPhaseTwoCompletion() {
  const status = getAiProgramStatus()
  const phase = status.phases.find(item => item.phase === 2)
  const complete = phase?.status === 'COMPLETE' && status.currentPhasePercentComplete === 100

  return {
    phase: 2,
    name: 'Turnaround briefing',
    status: complete ? 'COMPLETE' : 'BLOCKED',
    percentComplete: complete ? 100 : status.currentPhasePercentComplete,
    completed: complete,
    completionCriteria: [...PHASE_TWO_COMPLETION_CRITERIA],
    phaseThreeStarted: status.phases.find(item => item.phase === 3)?.status !== 'NOT_STARTED',
    nextPhase: {
      phase: 3,
      name: 'Evaluation harness',
      status: status.phases.find(item => item.phase === 3)?.status || 'NOT_STARTED'
    }
  }
}

function assertAiPhaseTwoComplete() {
  const completion = buildAiPhaseTwoCompletion()
  if (!completion.completed) {
    const error = new Error('AI Phase 2 turnaround briefing is incomplete.')
    error.code = 'AI_PHASE_TWO_INCOMPLETE'
    error.completion = completion
    throw error
  }
  return completion
}

module.exports = {
  PHASE_TWO_COMPLETION_CRITERIA,
  buildAiPhaseTwoCompletion,
  assertAiPhaseTwoComplete
}
