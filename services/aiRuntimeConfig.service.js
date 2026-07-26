const { AI_PROVIDER_NAMES, AiProviderError } = require('./aiProvider.service')

const DEFAULT_AI_RUNTIME_CONFIG = Object.freeze({
  providerName: AI_PROVIDER_NAMES.DISABLED,
  timeoutMs: 5000,
  maxAttempts: 2,
  retryDelayMs: 100,
  maxContextChars: 120000
})

function parseBoundedInteger(value, { name, fallback, min, max }) {
  if (value === undefined || value === null || String(value).trim() === '') return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new AiProviderError(
      `${name} must be an integer between ${min} and ${max}.`,
      'AI_RUNTIME_CONFIG_INVALID',
      { name, value }
    )
  }
  return parsed
}

function getAiRuntimeConfig(env = process.env) {
  const providerName = String(env.AI_PROVIDER || DEFAULT_AI_RUNTIME_CONFIG.providerName).trim().toLowerCase()

  return Object.freeze({
    providerName,
    timeoutMs: parseBoundedInteger(env.AI_TIMEOUT_MS, {
      name: 'AI_TIMEOUT_MS',
      fallback: DEFAULT_AI_RUNTIME_CONFIG.timeoutMs,
      min: 100,
      max: 60000
    }),
    maxAttempts: parseBoundedInteger(env.AI_MAX_ATTEMPTS, {
      name: 'AI_MAX_ATTEMPTS',
      fallback: DEFAULT_AI_RUNTIME_CONFIG.maxAttempts,
      min: 1,
      max: 4
    }),
    retryDelayMs: parseBoundedInteger(env.AI_RETRY_DELAY_MS, {
      name: 'AI_RETRY_DELAY_MS',
      fallback: DEFAULT_AI_RUNTIME_CONFIG.retryDelayMs,
      min: 0,
      max: 5000
    }),
    maxContextChars: parseBoundedInteger(env.AI_MAX_CONTEXT_CHARS, {
      name: 'AI_MAX_CONTEXT_CHARS',
      fallback: DEFAULT_AI_RUNTIME_CONFIG.maxContextChars,
      min: 1000,
      max: 500000
    })
  })
}

function describeAiRuntimeConfig(config = getAiRuntimeConfig()) {
  return {
    providerName: config.providerName,
    timeoutMs: config.timeoutMs,
    maxAttempts: config.maxAttempts,
    retryDelayMs: config.retryDelayMs,
    maxContextChars: config.maxContextChars
  }
}

module.exports = {
  DEFAULT_AI_RUNTIME_CONFIG,
  describeAiRuntimeConfig,
  getAiRuntimeConfig,
  parseBoundedInteger
}
