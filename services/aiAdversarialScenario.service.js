const { assertAdversarialScenario } = require('../ai/evaluations/adversarial/turnaroundBriefingAdversarial.contract')

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]))
  }
  return value
}

function validateAdversarialScenarioCatalog(scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    throw new TypeError('Adversarial scenario catalog requires at least one scenario.')
  }
  const ids = new Set()
  for (const scenario of scenarios) {
    assertAdversarialScenario(scenario)
    if (ids.has(scenario.id)) throw new TypeError(`Duplicate adversarial scenario id: ${scenario.id}`)
    ids.add(scenario.id)
  }
  return scenarios.map(cloneValue)
}

function getAdversarialScenario(scenarios, scenarioId) {
  const validated = validateAdversarialScenarioCatalog(scenarios)
  const scenario = validated.find(item => item.id === scenarioId)
  if (!scenario) throw new TypeError(`Unknown adversarial scenario: ${scenarioId}`)
  return scenario
}

module.exports = { cloneValue, getAdversarialScenario, validateAdversarialScenarioCatalog }
