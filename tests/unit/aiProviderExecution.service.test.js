const { AiProviderError } = require('../../services/aiProvider.service')
const {
  executeAiProviderCall,
  isTransientProviderError,
  normalizeProviderError,
  withTimeout
} = require('../../services/aiProviderExecution.service')

describe('AI provider execution resilience', () => {
  it('returns attempt telemetry for a successful first request', async () => {
    const provider = {
      generateStructured: jest.fn().mockResolvedValue({ output: { summary: 'ok' }, usage: { inputTokens: 1 } })
    }

    const result = await executeAiProviderCall({
      provider,
      request: { prompt: 'test' },
      timeoutMs: 1000,
      maxAttempts: 2,
      retryDelayMs: 0
    })

    expect(provider.generateStructured).toHaveBeenCalledTimes(1)
    expect(result.execution).toEqual(expect.objectContaining({
      attemptCount: 1,
      retried: false,
      attempts: [expect.objectContaining({ attempt: 1, outcome: 'SUCCESS' })]
    }))
  })

  it('retries transient failures and records each attempt', async () => {
    const provider = {
      generateStructured: jest.fn()
        .mockRejectedValueOnce(new AiProviderError('busy', 'AI_PROVIDER_RATE_LIMITED'))
        .mockResolvedValueOnce({ output: { summary: 'recovered' } })
    }
    const wait = jest.fn().mockResolvedValue()

    const result = await executeAiProviderCall({
      provider,
      request: {},
      timeoutMs: 1000,
      maxAttempts: 3,
      retryDelayMs: 25,
      wait
    })

    expect(provider.generateStructured).toHaveBeenCalledTimes(2)
    expect(wait).toHaveBeenCalledWith(25)
    expect(result.execution).toEqual(expect.objectContaining({ attemptCount: 2, retried: true }))
    expect(result.execution.attempts.map(attempt => attempt.outcome)).toEqual(['FAILURE', 'SUCCESS'])
  })

  it('does not retry permanent provider or validation failures', async () => {
    const provider = {
      generateStructured: jest.fn().mockRejectedValue(new AiProviderError('bad request', 'AI_PROVIDER_BAD_REQUEST'))
    }

    await expect(executeAiProviderCall({
      provider,
      request: {},
      timeoutMs: 1000,
      maxAttempts: 4,
      retryDelayMs: 0
    })).rejects.toEqual(expect.objectContaining({
      code: 'AI_PROVIDER_BAD_REQUEST',
      details: expect.objectContaining({ attemptCount: 1 })
    }))
    expect(provider.generateStructured).toHaveBeenCalledTimes(1)
  })

  it('enforces timeouts and stops after the configured attempt count', async () => {
    const provider = { generateStructured: jest.fn(() => new Promise(() => {})) }

    await expect(executeAiProviderCall({
      provider,
      request: {},
      timeoutMs: 10,
      maxAttempts: 2,
      retryDelayMs: 0
    })).rejects.toEqual(expect.objectContaining({
      code: 'AI_PROVIDER_TIMEOUT',
      details: expect.objectContaining({ attemptCount: 2 })
    }))
    expect(provider.generateStructured).toHaveBeenCalledTimes(2)
  })

  it('normalizes unknown failures without leaking raw error messages', () => {
    const normalized = normalizeProviderError(new Error('secret provider stack detail'))
    expect(normalized.code).toBe('AI_PROVIDER_UNEXPECTED_FAILURE')
    expect(normalized.message).not.toContain('secret provider stack detail')
  })

  it('identifies only approved transient failure codes', () => {
    expect(isTransientProviderError({ code: 'AI_PROVIDER_NETWORK_ERROR' })).toBe(true)
    expect(isTransientProviderError({ code: 'AI_PROVIDER_BAD_REQUEST' })).toBe(false)
    expect(isTransientProviderError(null)).toBe(false)
  })

  it('clears timeout handles when the provider settles', async () => {
    const clearTimer = jest.fn()
    const setTimer = jest.fn(() => 'timer-id')
    await expect(withTimeout(Promise.resolve('done'), 50, { setTimer, clearTimer })).resolves.toBe('done')
    expect(clearTimer).toHaveBeenCalledWith('timer-id')
  })

  it('rejects invalid provider implementations before execution', async () => {
    await expect(executeAiProviderCall({
      provider: {}, request: {}, timeoutMs: 1000, maxAttempts: 1, retryDelayMs: 0
    })).rejects.toEqual(expect.objectContaining({ code: 'AI_PROVIDER_INVALID' }))
  })
})
