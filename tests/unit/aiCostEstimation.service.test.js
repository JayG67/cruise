const {
  DEFAULT_AI_PRICING,
  describeAiPricingConfig,
  estimateUsageCostUsd,
  getAiPricingConfig,
  normalizeTokenCount,
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

  it('covers nullish pricing defaults, custom maxima, and one-sided pricing enablement', () => {
    expect(parseNonNegativeDecimal(undefined, { name: 'PRICE', fallback: 3 })).toBe(3)
    expect(parseNonNegativeDecimal(null, { name: 'PRICE', fallback: 2 })).toBe(2)
    expect(parseNonNegativeDecimal('5', { name: 'PRICE', max: 5 })).toBe(5)
    expect(() => parseNonNegativeDecimal('6', { name: 'PRICE', max: 5 })).toThrow('PRICE must be a number between 0 and 5')
    expect(describeAiPricingConfig({ inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 0 }).estimationEnabled).toBe(true)
    expect(describeAiPricingConfig({ inputUsdPerMillionTokens: 0, outputUsdPerMillionTokens: 1 }).estimationEnabled).toBe(true)
  })

  it('normalizes missing, negative, and non-numeric usage/pricing inputs to safe zero-cost values', () => {
    expect(estimateUsageCostUsd()).toBe(0)
    expect(estimateUsageCostUsd({ inputTokens: 'bad', outputTokens: -10 }, {
      inputUsdPerMillionTokens: 5,
      outputUsdPerMillionTokens: 8
    })).toBe(0)
    expect(normalizeTokenCount(Infinity)).toBe(0)
    expect(normalizeTokenCount('250')).toBe(250)
    expect(estimateUsageCostUsd({ inputTokens: 1000, outputTokens: 1000 }, {
      inputUsdPerMillionTokens: null,
      outputUsdPerMillionTokens: undefined
    })).toBe(0)
  })

})
