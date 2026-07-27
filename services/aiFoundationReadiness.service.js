const { AI_PROVIDER_NAMES, AiProviderError, createAiProvider } = require('./aiProvider.service')
const { getAiRuntimeConfig } = require('./aiRuntimeConfig.service')
const { getAiPricingConfig } = require('./aiCostEstimation.service')

const PHASE_ONE_FOUNDATION_CHECKS = Object.freeze([
  'provider-abstraction',
  'structured-output-contract',
  'runtime-configuration',
  'timeout-and-retry-policy',
  'context-size-guard',
  'persistent-audit-events',
  'sanitized-correlated-telemetry',
  'configurable-cost-estimation',
  'server-only-provider-credentials',
  'architecture-audit'
])

function issue(message, code, severity = 'blocking') {
  return { code, message, severity }
}

function assessAiFoundationReadiness({ env = process.env, fetchImpl } = {}) {
  const issues = []
  let runtimeConfig = null
  let provider = null
  let pricing = null

  try {
    runtimeConfig = getAiRuntimeConfig(env)
  } catch (error) {
    issues.push(issue(error.message, error.code || 'AI_RUNTIME_CONFIG_INVALID'))
  }

  try {
    pricing = getAiPricingConfig(env)
  } catch (error) {
    issues.push(issue(error.message, error.code || 'AI_PRICING_CONFIG_INVALID'))
  }

  if (runtimeConfig) {
    try {
      provider = createAiProvider({
        providerName: runtimeConfig.providerName,
        env,
        fetchImpl
      })
    } catch (error) {
      issues.push(issue(error.message, error.code || 'AI_PROVIDER_INVALID'))
    }
  }

  const providerName = provider?.name || runtimeConfig?.providerName || null
  const generationEnabled = Boolean(provider && providerName !== AI_PROVIDER_NAMES.DISABLED)
  const credentialConfigured = provider?.credentialConfigured !== false

  if (providerName === AI_PROVIDER_NAMES.OPENAI && !credentialConfigured) {
    issues.push(issue(
      'OPENAI_API_KEY must be configured before OpenAI generation is enabled.',
      'AI_PROVIDER_CREDENTIALS_MISSING',
      'configuration'
    ))
  }

  const blockingIssues = issues.filter(item => item.severity === 'blocking')
  const configurationIssues = issues.filter(item => item.severity === 'configuration')

  return {
    phase: 1,
    foundationReady: blockingIssues.length === 0,
    deploymentSafe: blockingIssues.length === 0,
    generationReady: blockingIssues.length === 0 && generationEnabled && configurationIssues.length === 0,
    provider: {
      name: providerName,
      model: provider?.model || null,
      generationEnabled,
      credentialConfigured
    },
    runtimeConfigValid: Boolean(runtimeConfig),
    pricingConfigValid: Boolean(pricing),
    completedChecks: [...PHASE_ONE_FOUNDATION_CHECKS],
    issues,
    guidance: generationEnabled
      ? (configurationIssues.length ? 'Complete provider credential configuration before enabling AI generation.' : 'AI generation configuration is ready for provider calls.')
      : 'The application is safe to deploy with AI generation disabled. Configure a provider when generation should be enabled.'
  }
}

function assertAiFoundationDeploymentSafe(options = {}) {
  const readiness = assessAiFoundationReadiness(options)
  if (!readiness.deploymentSafe) {
    throw new AiProviderError(
      'AI foundation deployment readiness checks failed.',
      'AI_FOUNDATION_NOT_READY',
      { issues: readiness.issues }
    )
  }
  return readiness
}

module.exports = {
  PHASE_ONE_FOUNDATION_CHECKS,
  assessAiFoundationReadiness,
  assertAiFoundationDeploymentSafe
}
