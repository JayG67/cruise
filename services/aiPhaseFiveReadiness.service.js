const { getAiProgramStatus } = require('./aiProgramStatus.service')

const PHASE_FIVE_COMPLETED_CAPABILITIES = Object.freeze([
  'formal adversarial scenario contract',
  'immutable reusable adversarial scenario catalog',
  'deterministic scenario execution and outcome evaluation',
  'severity-weighted resilience scoring',
  'diagnostic failure findings',
  'suite-level category and severity summaries',
  'explicit adversarial release policy',
  'Phase 5 adversarial architecture audit',
  'executable operational evidence mutation strategies',
  'contradictory readiness and staffing detection',
  'stale, malformed, and duplicate evidence detection',
  'cross-sailing, cross-ship, and cross-tenant evidence rejection',
  'incomplete signoff and hidden escalation detection',
  'prompt injection and instruction override detection',
  'hidden prompt and credential disclosure protection',
  'fabricated status and evidence suppression rejection',
  'role impersonation and authorization bypass protection'
])

function buildAiPhaseFiveReadiness() {
  const status = getAiProgramStatus()
  return {
    phase: 5,
    name: 'Adversarial and resilience testing',
    status: status.phases.find(item => item.phase === 5)?.status || 'NOT_STARTED',
    percentComplete: status.currentPhase === 5 ? status.currentPhasePercentComplete : 0,
    completedCapabilities: [...PHASE_FIVE_COMPLETED_CAPABILITIES],
    nextCapabilities: [
      'provider and runtime resilience coverage',
      'malformed structured output resilience coverage'
    ]
  }
}

module.exports = { PHASE_FIVE_COMPLETED_CAPABILITIES, buildAiPhaseFiveReadiness }
