const { getAiProgramStatus } = require('../services/aiProgramStatus.service')
const { createAiProvider, AiProviderError } = require('../services/aiProvider.service')
const { AiBriefingValidationError, generateTurnaroundBriefing } = require('../services/aiTurnaroundBriefing.service')
const { normalizeActorRole, resolveRequestActor } = require('../services/requestAuthorization.service')
const { recordAuditEvent } = require('../services/auditEvent.service')
const { describeAiRuntimeConfig, getAiRuntimeConfig } = require('../services/aiRuntimeConfig.service')
const { describeAiPricingConfig, getAiPricingConfig } = require('../services/aiCostEstimation.service')
const { recordAiTelemetry } = require('../services/aiTelemetry.service')

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

exports.getAiProgramStatus = (req, res) => {
  const runtimeConfig = getAiRuntimeConfig()
  const provider = createAiProvider({ providerName: runtimeConfig.providerName })
  return res.status(200).json({
    ...getAiProgramStatus(),
    runtime: {
      provider: provider.name,
      model: provider.model,
      generationEnabled: provider.name !== 'disabled',
      credentialConfigured: provider.credentialConfigured !== false,
      executionPolicy: describeAiRuntimeConfig(runtimeConfig),
      pricing: describeAiPricingConfig(getAiPricingConfig())
    }
  })
}

exports.generateTurnaroundBriefing = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canGenerateAiBriefing(actor)) {
      return res.status(403).json({
        message: 'AI turnaround briefings require an administrator or assigned turnaround operational role.'
      })
    }

    const result = await generateTurnaroundBriefing({
      input: req.body,
      actor,
      provider: createAiProvider(),
      runtimeConfig: getAiRuntimeConfig(),
      auditRecorder: recordAuditEvent,
      telemetryRecorder: recordAiTelemetry,
      requestId: req.get('X-Request-Id') || null
    })

    return res.status(200).json(result)
  } catch (error) {
    if (error instanceof AiProviderError) {
      return res.status(providerHttpStatus(error)).json({
        message: error.message,
        code: error.code
      })
    }
    if (error instanceof AiBriefingValidationError) {
      const status = error.code === 'AI_CONTEXT_LIMIT_EXCEEDED' ? 413 : 502
      return res.status(status).json({ message: error.message, code: error.code, issues: error.issues })
    }
    return next(error)
  }
}

module.exports.AI_ALLOWED_ROLES = AI_ALLOWED_ROLES
module.exports.providerHttpStatus = providerHttpStatus
module.exports.canGenerateAiBriefing = canGenerateAiBriefing
