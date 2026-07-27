const { assessAiFoundationReadiness } = require('./aiFoundationReadiness.service')

const PHASE_ONE_COMPLETION_CRITERIA = Object.freeze([
  'provider-abstraction',
  'deterministic-test-provider',
  'production-provider-adapter',
  'structured-output-contract',
  'prompt-versioning',
  'evidence-grounding-validation',
  'role-authorization-boundary',
  'validated-runtime-configuration',
  'timeout-and-retry-policy',
  'context-size-guard',
  'persistent-audit-events',
  'sanitized-correlated-telemetry',
  'normalized-usage-telemetry',
  'configurable-cost-estimation',
  'server-only-provider-credentials',
  'deployment-readiness-assessment',
  'architecture-audit',
  'completion-audit'
])

function buildAiFoundationCompletion({ env = process.env, fetchImpl } = {}) {
  const readiness = assessAiFoundationReadiness({ env, fetchImpl })
  const completed = readiness.foundationReady && readiness.deploymentSafe

  return {
    phase: 1,
    name: 'AI foundation',
    status: completed ? 'COMPLETE' : 'BLOCKED',
    percentComplete: completed ? 100 : 0,
    completed,
    completionCriteria: [...PHASE_ONE_COMPLETION_CRITERIA],
    readiness,
    phaseTwoStarted: true,
    nextPhase: {
      phase: 2,
      name: 'Turnaround briefing',
      status: 'COMPLETE'
    }
  }
}

function assertAiFoundationComplete(options = {}) {
  const completion = buildAiFoundationCompletion(options)
  if (!completion.completed) {
    const error = new Error('AI Phase 1 foundation completion checks failed.')
    error.code = 'AI_FOUNDATION_INCOMPLETE'
    error.details = { issues: completion.readiness.issues }
    throw error
  }
  return completion
}

module.exports = {
  PHASE_ONE_COMPLETION_CRITERIA,
  buildAiFoundationCompletion,
  assertAiFoundationComplete
}
