const { normalizeAdversarialReleasePolicy } = require('../ai/evaluations/adversarial/turnaroundBriefingAdversarial.contract')
const { validateAdversarialScenarioCatalog } = require('./aiAdversarialScenario.service')
const { evaluateAdversarialScenario } = require('./aiAdversarialEvaluation.service')

function summarizeBy(results, key, allowedValues) {
  return Object.fromEntries(allowedValues.map(value => {
    const matching = results.filter(result => result[key] === value)
    const passed = matching.filter(result => result.passed).length
    return [value, {
      total: matching.length,
      passed,
      failed: matching.length - passed,
      passRate: matching.length === 0 ? 0 : Math.round((passed / matching.length) * 10000) / 100
    }]
  }))
}

function assessAdversarialRelease(results, passRate, resilienceScore, policy = {}) {
  const normalizedPolicy = normalizeAdversarialReleasePolicy(policy)
  const failures = []
  if (passRate < normalizedPolicy.minimumPassRate) failures.push({ reason: 'minimum-pass-rate', actual: passRate, required: normalizedPolicy.minimumPassRate })
  if (resilienceScore < normalizedPolicy.minimumResilienceScore) failures.push({ reason: 'minimum-resilience-score', actual: resilienceScore, required: normalizedPolicy.minimumResilienceScore })
  if (normalizedPolicy.blockOnCriticalFailure && results.some(result => !result.passed && result.severity === 'CRITICAL')) failures.push({ reason: 'critical-scenario-failure' })
  if (normalizedPolicy.blockOnHighFailure && results.some(result => !result.passed && result.severity === 'HIGH')) failures.push({ reason: 'high-scenario-failure' })
  return { passed: failures.length === 0, decision: failures.length === 0 ? 'APPROVED' : 'BLOCKED', policy: normalizedPolicy, failures }
}

function runAdversarialSuite({ suiteId = 'turnaround-briefing-phase5-adversarial', scenarios, executeScenario, policy = {}, metadata = {} } = {}) {
  const validatedScenarios = validateAdversarialScenarioCatalog(scenarios)
  if (typeof executeScenario !== 'function') throw new TypeError('Adversarial suite requires executeScenario.')
  const results = validatedScenarios.map(scenario => evaluateAdversarialScenario(scenario, executeScenario(scenario), metadata))
  const passedScenarios = results.filter(result => result.passed).length
  const passRate = Math.round((passedScenarios / results.length) * 10000) / 100
  const totalWeight = results.reduce((sum, result) => sum + result.severityWeight, 0)
  const resilienceScore = Math.round((results.reduce((sum, result) => sum + (result.score * result.severityWeight), 0) / totalWeight) * 100) / 100
  const releaseDecision = assessAdversarialRelease(results, passRate, resilienceScore, policy)
  const categories = [...new Set(validatedScenarios.map(item => item.category))]
  const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

  return {
    suiteId,
    totalScenarios: results.length,
    passedScenarios,
    failedScenarios: results.length - passedScenarios,
    passRate,
    resilienceScore,
    severitySummary: summarizeBy(results, 'severity', severities),
    categorySummary: summarizeBy(results, 'category', categories),
    releaseDecision,
    metadata: { ...metadata },
    results
  }
}

module.exports = { assessAdversarialRelease, runAdversarialSuite, summarizeBy }
