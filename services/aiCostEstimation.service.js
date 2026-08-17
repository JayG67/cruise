const { AiProviderError } = require('./aiProvider.service')

const DEFAULT_AI_PRICING = Object.freeze({
  inputUsdPerMillionTokens: 0,
  outputUsdPerMillionTokens: 0
})

function parseNonNegativeDecimal(value, { name, fallback = 0, max = 1000 } = {}) {
  if (value === undefined || value === null || String(value).trim() === '') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) {
    throw new AiProviderError(
      `${name} must be a number between 0 and ${max}.`,
      'AI_RUNTIME_CONFIG_INVALID',
      { name, value }
    )
  }
  return parsed
}

function getAiPricingConfig(env = process.env) {
  return Object.freeze({
    inputUsdPerMillionTokens: parseNonNegativeDecimal(env.OPENAI_INPUT_USD_PER_MILLION_TOKENS, {
      name: 'OPENAI_INPUT_USD_PER_MILLION_TOKENS',
      fallback: DEFAULT_AI_PRICING.inputUsdPerMillionTokens
    }),
    outputUsdPerMillionTokens: parseNonNegativeDecimal(env.OPENAI_OUTPUT_USD_PER_MILLION_TOKENS, {
      name: 'OPENAI_OUTPUT_USD_PER_MILLION_TOKENS',
      fallback: DEFAULT_AI_PRICING.outputUsdPerMillionTokens
    })
  })
}

function normalizeTokenCount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

function estimateUsageCostUsd(usage = {}, pricing = DEFAULT_AI_PRICING) {
  const inputTokens = normalizeTokenCount(usage.inputTokens)
  const outputTokens = normalizeTokenCount(usage.outputTokens)
  const inputCost = inputTokens * Number(pricing.inputUsdPerMillionTokens || 0) / 1000000
  const outputCost = outputTokens * Number(pricing.outputUsdPerMillionTokens || 0) / 1000000
  return Number((inputCost + outputCost).toFixed(8))
}

function describeAiPricingConfig(pricing = getAiPricingConfig()) {
  return {
    inputUsdPerMillionTokens: pricing.inputUsdPerMillionTokens,
    outputUsdPerMillionTokens: pricing.outputUsdPerMillionTokens,
    estimationEnabled: pricing.inputUsdPerMillionTokens > 0 || pricing.outputUsdPerMillionTokens > 0
  }
}

module.exports = {
  DEFAULT_AI_PRICING,
  describeAiPricingConfig,
  estimateUsageCostUsd,
  getAiPricingConfig,
  normalizeTokenCount,
  parseNonNegativeDecimal
}
