const {
  DEFAULT_AI_RUNTIME_CONFIG,
  describeAiRuntimeConfig,
  getAiRuntimeConfig,
  parseBoundedInteger
} = require('../../services/aiRuntimeConfig.service')


describe('AI runtime configuration', () => {
  it('uses conservative disabled-by-default execution settings', () => {
    expect(getAiRuntimeConfig({})).toEqual(DEFAULT_AI_RUNTIME_CONFIG)
  })

  it('parses explicit bounded execution settings without exposing secrets', () => {
    const config = getAiRuntimeConfig({
      AI_PROVIDER: ' DETERMINISTIC ',
      AI_TIMEOUT_MS: '1200',
      AI_MAX_ATTEMPTS: '3',
      AI_RETRY_DELAY_MS: '25',
      AI_API_KEY: 'never-return-this'
    })

    expect(config).toEqual({
      providerName: 'deterministic',
      timeoutMs: 1200,
      maxAttempts: 3,
      retryDelayMs: 25
    })
    expect(JSON.stringify(describeAiRuntimeConfig(config))).not.toContain('never-return-this')
  })

  it.each([
    ['AI_TIMEOUT_MS', '99'],
    ['AI_TIMEOUT_MS', '60001'],
    ['AI_MAX_ATTEMPTS', '0'],
    ['AI_MAX_ATTEMPTS', '5'],
    ['AI_RETRY_DELAY_MS', '-1'],
    ['AI_RETRY_DELAY_MS', '5001'],
    ['AI_TIMEOUT_MS', 'not-a-number'],
    ['AI_TIMEOUT_MS', '100.5']
  ])('rejects invalid %s values before provider execution', (name, value) => {
    try {
      getAiRuntimeConfig({ [name]: value })
      throw new Error('Expected invalid runtime configuration to throw.')
    } catch (error) {
      expect(error).toEqual(expect.objectContaining({ code: 'AI_RUNTIME_CONFIG_INVALID' }))
    }
  })

  it('supports reusable bounded integer parsing', () => {
    expect(parseBoundedInteger('', { name: 'VALUE', fallback: 4, min: 1, max: 5 })).toBe(4)
    expect(parseBoundedInteger('5', { name: 'VALUE', fallback: 4, min: 1, max: 5 })).toBe(5)
  })
})
