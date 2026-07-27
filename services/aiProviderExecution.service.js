const { AiProviderError } = require('./aiProvider.service')

const TRANSIENT_PROVIDER_CODES = new Set([
  'AI_PROVIDER_RATE_LIMITED',
  'AI_PROVIDER_TEMPORARILY_UNAVAILABLE',
  'AI_PROVIDER_NETWORK_ERROR',
  'AI_PROVIDER_TIMEOUT'
])

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isTransientProviderError(error) {
  return Boolean(error && TRANSIENT_PROVIDER_CODES.has(error.code))
}

function normalizeProviderError(error) {
  if (error instanceof AiProviderError) return error

  return new AiProviderError(
    'AI provider request failed unexpectedly.',
    'AI_PROVIDER_UNEXPECTED_FAILURE',
    { causeName: error?.name || 'Error' }
  )
}

function withTimeout(promise, timeoutMs, { setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimer(() => {
      reject(new AiProviderError(
        `AI provider request exceeded the ${timeoutMs} ms timeout.`,
        'AI_PROVIDER_TIMEOUT',
        { timeoutMs }
      ))
    }, timeoutMs)

    Promise.resolve(promise).then(
      value => {
        clearTimer(timer)
        resolve(value)
      },
      error => {
        clearTimer(timer)
        reject(error)
      }
    )
  })
}

async function executeAiProviderCall({
  provider,
  request,
  timeoutMs,
  maxAttempts,
  retryDelayMs,
  wait = sleep,
  now = () => Date.now()
}) {
  if (!provider || typeof provider.generateStructured !== 'function') {
    throw new AiProviderError('AI provider does not implement generateStructured.', 'AI_PROVIDER_INVALID')
  }

  const startedAt = now()
  const attempts = []
  let lastError

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const attemptStartedAt = now()
    try {
      const result = await withTimeout(provider.generateStructured(request), timeoutMs)
      attempts.push({ attempt, outcome: 'SUCCESS', durationMs: Math.max(0, now() - attemptStartedAt) })
      return {
        ...result,
        execution: {
          attempts,
          attemptCount: attempt,
          retried: attempt > 1,
          durationMs: Math.max(0, now() - startedAt)
        }
      }
    } catch (error) {
      lastError = normalizeProviderError(error)
      attempts.push({
        attempt,
        outcome: 'FAILURE',
        code: lastError.code,
        durationMs: Math.max(0, now() - attemptStartedAt)
      })

      const shouldRetry = attempt < maxAttempts && isTransientProviderError(lastError)
      if (!shouldRetry) break
      if (retryDelayMs > 0) await wait(retryDelayMs)
    }
  }

  lastError.details = {
    ...(lastError.details || {}),
    attemptCount: attempts.length,
    attempts,
    durationMs: Math.max(0, now() - startedAt)
  }
  throw lastError
}

module.exports = {
  TRANSIENT_PROVIDER_CODES,
  executeAiProviderCall,
  isTransientProviderError,
  normalizeProviderError,
  sleep,
  withTimeout
}
