const { buildAiAdversarialQualitySummary } = require('./aiAdversarialQualitySummary.service')

const PHASE_FIVE_COMPLETION_CRITERIA = Object.freeze([
  'adversarial scenario foundation', 'operational evidence attacks', 'prompt and instruction attacks',
  'authorization and tenant isolation attacks', 'provider and runtime resilience',
  'Quality Console resilience integration', 'browser workflow coverage', 'completion audit'
])

function assessAiPhaseFiveCompletion() {
  const summary = buildAiAdversarialQualitySummary()
  return { phase: 5, name: 'Adversarial and resilience testing', complete: summary.releaseDecision === 'APPROVED' && summary.resilienceScore === 100, completionCriteria: [...PHASE_FIVE_COMPLETION_CRITERIA], adversarialQuality: summary }
}
module.exports = { PHASE_FIVE_COMPLETION_CRITERIA, assessAiPhaseFiveCompletion }
