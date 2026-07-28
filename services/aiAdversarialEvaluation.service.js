const { assertAdversarialScenario } = require('../ai/evaluations/adversarial/turnaroundBriefingAdversarial.contract')

const SEVERITY_WEIGHTS = Object.freeze({ LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 })

function normalizeObservedOutcomes(observedOutcomes = {}) {
  if (!observedOutcomes || typeof observedOutcomes !== 'object' || Array.isArray(observedOutcomes)) {
    throw new TypeError('Observed adversarial outcomes must be an object.')
  }
  return { ...observedOutcomes }
}

function evaluateAdversarialScenario(scenario, observedOutcomes, metadata = {}) {
  assertAdversarialScenario(scenario)
  const observed = normalizeObservedOutcomes(observedOutcomes)
  const expectations = Object.entries(scenario.expectedOutcomes)
  const failures = expectations
    .filter(([outcome, expected]) => observed[outcome] !== expected)
    .map(([outcome, expected]) => ({ outcome, expected, observed: observed[outcome] }))
  const passedOutcomes = expectations.length - failures.length
  const score = Math.round((passedOutcomes / expectations.length) * 10000) / 100

  return {
    scenarioId: scenario.id,
    name: scenario.name,
    category: scenario.category,
    severity: scenario.severity,
    severityWeight: SEVERITY_WEIGHTS[scenario.severity],
    passed: failures.length === 0,
    score,
    expectedOutcomes: { ...scenario.expectedOutcomes },
    observedOutcomes: observed,
    failures,
    diagnostics: failures.map(failure => `${failure.outcome}: expected ${String(failure.expected)}, observed ${String(failure.observed)}`),
    provider: metadata.provider || 'deterministic-test-provider',
    model: metadata.model || 'deterministic-adversarial-model',
    promptVersion: metadata.promptVersion || 'turnaround-briefing-v1',
    evaluatedAt: metadata.evaluatedAt || '1970-01-01T00:00:00.000Z'
  }
}

module.exports = { SEVERITY_WEIGHTS, evaluateAdversarialScenario, normalizeObservedOutcomes }
