const { getAiProgramStatus } = require('../services/aiProgramStatus.service')
const { createAiProvider } = require('../services/aiProvider.service')
const { describeAiRuntimeConfig, getAiRuntimeConfig } = require('../services/aiRuntimeConfig.service')
const { describeAiPricingConfig, getAiPricingConfig } = require('../services/aiCostEstimation.service')
const { assessAiFoundationReadiness } = require('../services/aiFoundationReadiness.service')
const { resolveRequestActor } = require('../services/requestAuthorization.service')
const { buildAiCiEvidenceConsoleSummary } = require('../services/aiCiEvidenceConsole.service')
const { canManageAiEvaluations } = require('./aiControllerSupport')

exports.getAiCiEvidenceSummary = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canManageAiEvaluations(actor)) return res.status(403).json({ message: 'AI CI evidence requires an administrator.' })
    return res.status(200).json(buildAiCiEvidenceConsoleSummary())
  } catch (error) {
    return next(error)
  }
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
      pricing: describeAiPricingConfig(getAiPricingConfig()),
      foundationReadiness: assessAiFoundationReadiness()
    }
  })
}
