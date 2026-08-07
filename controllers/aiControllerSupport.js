const { normalizeActorRole } = require('../services/requestAuthorization.service')

const AI_ALLOWED_ROLES = new Set([
  'ADMIN',
  'TURNAROUND_MANAGER',
  'HOUSEKEEPING_LEAD',
  'GUEST_SERVICES_LEAD',
  'FOOD_BEVERAGE_LEAD',
  'ENGINEERING_LEAD'
])

function providerHttpStatus(error) {
  if (['AI_PROVIDER_NOT_CONFIGURED', 'AI_PROVIDER_TEMPORARILY_UNAVAILABLE', 'AI_PROVIDER_CREDENTIALS_MISSING'].includes(error.code)) return 503
  if (error.code === 'AI_PROVIDER_TIMEOUT') return 504
  if (error.code === 'AI_PROVIDER_RATE_LIMITED') return 429
  if (error.code === 'AI_PROVIDER_CREDENTIALS_INVALID') return 502
  if (error.code === 'AI_RUNTIME_CONFIG_INVALID' || error.code === 'AI_PROVIDER_UNSUPPORTED') return 500
  return 502
}

function canGenerateAiBriefing(actor = {}) {
  return AI_ALLOWED_ROLES.has(normalizeActorRole(actor.actorRole))
}

function canManageAiEvaluations(actor = {}) {
  return normalizeActorRole(actor.actorRole) === 'ADMIN'
}

module.exports = { AI_ALLOWED_ROLES, providerHttpStatus, canGenerateAiBriefing, canManageAiEvaluations }
