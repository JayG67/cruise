const ADVERSARIAL_CATEGORIES = Object.freeze([
  'MISSING_EVIDENCE',
  'CONTRADICTORY_EVIDENCE',
  'STALE_EVIDENCE',
  'MALFORMED_EVIDENCE',
  'PROMPT_INJECTION',
  'AUTHORIZATION_BYPASS',
  'TENANT_BOUNDARY',
  'PROVIDER_FAILURE',
  'STRUCTURED_OUTPUT_FAILURE',
  'CONTEXT_OVERFLOW'
])

const ADVERSARIAL_SEVERITIES = Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
const ADVERSARIAL_MUTATION_TYPES = Object.freeze([
  'REMOVE_EVIDENCE',
  'REPLACE_EVIDENCE',
  'APPEND_INSTRUCTION',
  'ALTER_SCOPE',
  'CORRUPT_STRUCTURE',
  'SIMULATE_PROVIDER_FAILURE'
])

const DEFAULT_ADVERSARIAL_RELEASE_POLICY = Object.freeze({
  minimumPassRate: 100,
  minimumResilienceScore: 85,
  blockOnCriticalFailure: true,
  blockOnHighFailure: true
})

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.values(value).forEach(deepFreeze)
  return Object.freeze(value)
}

function assertPlainObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(message)
}

function hasMeaningfulText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function assertAdversarialScenario(scenario) {
  assertPlainObject(scenario, 'Adversarial scenario must be an object.')
  if (!hasMeaningfulText(scenario.id) || !hasMeaningfulText(scenario.name) || !hasMeaningfulText(scenario.description)) {
    throw new TypeError('Adversarial scenario requires id, name, and description.')
  }
  if (!ADVERSARIAL_CATEGORIES.includes(scenario.category)) {
    throw new TypeError(`Unsupported adversarial category: ${scenario.category}`)
  }
  if (!ADVERSARIAL_SEVERITIES.includes(scenario.severity)) {
    throw new TypeError(`Unsupported adversarial severity: ${scenario.severity}`)
  }
  assertPlainObject(scenario.mutation, 'Adversarial scenario requires a mutation object.')
  if (!ADVERSARIAL_MUTATION_TYPES.includes(scenario.mutation.type)) {
    throw new TypeError(`Unsupported adversarial mutation type: ${scenario.mutation.type}`)
  }
  assertPlainObject(scenario.expectedOutcomes, 'Adversarial scenario requires expected outcomes.')
  if (Object.keys(scenario.expectedOutcomes).length === 0) {
    throw new TypeError('Adversarial scenario requires at least one expected outcome.')
  }
  return scenario
}

function normalizeAdversarialReleasePolicy(policy = {}) {
  const safePolicy = policy && typeof policy === 'object' && !Array.isArray(policy) ? policy : {}
  const numberWithinRange = (value, fallback) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : fallback
  }
  return {
    minimumPassRate: numberWithinRange(safePolicy.minimumPassRate, DEFAULT_ADVERSARIAL_RELEASE_POLICY.minimumPassRate),
    minimumResilienceScore: numberWithinRange(safePolicy.minimumResilienceScore, DEFAULT_ADVERSARIAL_RELEASE_POLICY.minimumResilienceScore),
    blockOnCriticalFailure: safePolicy.blockOnCriticalFailure !== false,
    blockOnHighFailure: safePolicy.blockOnHighFailure !== false
  }
}

module.exports = {
  ADVERSARIAL_CATEGORIES,
  ADVERSARIAL_SEVERITIES,
  ADVERSARIAL_MUTATION_TYPES,
  DEFAULT_ADVERSARIAL_RELEASE_POLICY,
  assertAdversarialScenario,
  deepFreeze,
  normalizeAdversarialReleasePolicy
}
