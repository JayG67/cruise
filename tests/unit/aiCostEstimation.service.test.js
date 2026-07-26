const {
  DEFAULT_AI_PRICING,
  describeAiPricingConfig,
  estimateUsageCostUsd,
  getAiPricingConfig,
  parseNonNegativeDecimal
} = require('../../services/aiCostEstimation.service')

describe('AI cost estimation', () => {
  it('is disabled by default instead of hard-coding provider prices', () => {
    expect(getAiPricingConfig({})).toEqual(DEFAULT_AI_PRICING)
    expect(describeAiPricingConfig(DEFAULT_AI_PRICING)).toEqual({
      inputUsdPerMillionTokens: 0,
      outputUsdPerMillionTokens: 0,
      estimationEnabled: false
    })
  })

  it('estimates input and output token cost from explicit pricing', () => {
    const pricing = getAiPricingConfig({
      OPENAI_INPUT_USD_PER_MILLION_TOKENS: '2.50',
      OPENAI_OUTPUT_USD_PER_MILLION_TOKENS: '10'
    })
    expect(estimateUsageCostUsd({ inputTokens: 1000, outputTokens: 500 }, pricing)).toBe(0.0075)
    expect(describeAiPricingConfig(pricing).estimationEnabled).toBe(true)
  })

  it.each(['-1', 'not-a-number', '1001'])('rejects invalid price %s', value => {
    expect(() => getAiPricingConfig({ OPENAI_INPUT_USD_PER_MILLION_TOKENS: value })).toThrow(
      expect.objectContaining({ code: 'AI_RUNTIME_CONFIG_INVALID' })
    )
  })

  it('supports reusable decimal parsing and non-negative token normalization', () => {
    expect(parseNonNegativeDecimal('', { name: 'PRICE', fallback: 4 })).toBe(4)
    expect(estimateUsageCostUsd({ inputTokens: -100, outputTokens: 100 }, {
      inputUsdPerMillionTokens: 1,
      outputUsdPerMillionTokens: 1
    })).toBe(0.0001)
  })
})
