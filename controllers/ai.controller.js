const { getAiProgramStatus } = require('../services/aiProgramStatus.service')
const { createAiProvider, AiProviderError } = require('../services/aiProvider.service')
const { AiBriefingValidationError, generateTurnaroundBriefing } = require('../services/aiTurnaroundBriefing.service')
const { normalizeActorRole, resolveRequestActor } = require('../services/requestAuthorization.service')

const AI_ALLOWED_ROLES = new Set([
  'ADMIN',
  'TURNAROUND_MANAGER',
  'HOUSEKEEPING_LEAD',
  'GUEST_SERVICES_LEAD',
  'FOOD_BEVERAGE_LEAD',
  'ENGINEERING_LEAD'
])

function canGenerateAiBriefing(actor = {}) {
  return AI_ALLOWED_ROLES.has(normalizeActorRole(actor.actorRole))
}

exports.getAiProgramStatus = (req, res) => {
  const provider = createAiProvider()
  return res.status(200).json({
    ...getAiProgramStatus(),
    runtime: {
      provider: provider.name,
      model: provider.model,
      generationEnabled: provider.name !== 'disabled'
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
      requestId: req.get('X-Request-Id') || null
    })

    return res.status(200).json(result)
  } catch (error) {
    if (error instanceof AiProviderError) {
      return res.status(error.code === 'AI_PROVIDER_NOT_CONFIGURED' ? 503 : 500).json({
        message: error.message,
        code: error.code
      })
    }
    if (error instanceof AiBriefingValidationError) {
      return res.status(502).json({ message: error.message, code: error.code, issues: error.issues })
    }
    return next(error)
  }
}

module.exports.AI_ALLOWED_ROLES = AI_ALLOWED_ROLES
module.exports.canGenerateAiBriefing = canGenerateAiBriefing
