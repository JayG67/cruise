const {
  buildOpenAiRequest,
  createOpenAiResponsesProvider,
  extractResponseText,
  mapOpenAiHttpError,
  normalizeOpenAiUsage
} = require('../../services/openAiResponsesProvider.service')

const prompt = {
  system: 'Use only supplied evidence.',
  user: { operationId: 'op-1', question: 'What is blocked?', evidence: [] }
}

function response({ ok = true, status = 200, payload = {}, requestId = 'req-provider-1' } = {}) {
  return {
    ok,
    status,
    headers: { get: name => name.toLowerCase() === 'x-request-id' ? requestId : null },
    json: jest.fn().mockResolvedValue(payload)
  }
}

describe('OpenAI Responses provider adapter', () => {
  it('requires credentials before making a network request', async () => {
    const fetchImpl = jest.fn()
    const provider = createOpenAiResponsesProvider({ apiKey: '', fetchImpl })

    expect(provider.credentialConfigured).toBe(false)
    await expect(provider.generateStructured({ prompt })).rejects.toEqual(expect.objectContaining({
      code: 'AI_PROVIDER_CREDENTIALS_MISSING'
    }))
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('sends strict structured output without exposing credentials in the body', async () => {
    const payload = {
      id: 'resp-1',
      status: 'completed',
      output_text: JSON.stringify({
        summary: 'No blockers.',
        riskLevel: 'low',
        findings: [],
        unknowns: [],
        generatedAt: '2026-07-26T15:00:00.000Z',
        model: 'gpt-test',
        promptVersion: 'turnaround-briefing-v1.0.0'
      }),
      usage: { input_tokens: 25, output_tokens: 15, total_tokens: 40 },
      service_tier: 'default'
    }
    const fetchImpl = jest.fn().mockResolvedValue(response({ payload }))
    const provider = createOpenAiResponsesProvider({
      apiKey: 'secret-key',
      model: 'gpt-test',
      baseUrl: 'https://example.test/v1/',
      fetchImpl,
      pricing: { inputUsdPerMillionTokens: 2, outputUsdPerMillionTokens: 8 }
    })

    const result = await provider.generateStructured({
      prompt,
      metadata: { operationId: 'op-1', actorRole: 'ADMIN', ignored: null }
    })

    expect(fetchImpl).toHaveBeenCalledWith('https://example.test/v1/responses', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer secret-key' })
    }))
    const requestBody = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(requestBody.text.format).toEqual(expect.objectContaining({
      type: 'json_schema',
      strict: true,
      name: 'turnaround_briefing'
    }))
    expect(requestBody.text.format.schema.additionalProperties).toBe(false)
    expect(requestBody.metadata).toEqual({ operationId: 'op-1', actorRole: 'ADMIN' })
    expect(JSON.stringify(requestBody)).not.toContain('secret-key')
    expect(result).toEqual(expect.objectContaining({
      output: expect.objectContaining({ riskLevel: 'low' }),
      usage: { inputTokens: 25, outputTokens: 15, totalTokens: 40, estimatedCostUsd: 0.00017 },
      providerMetadata: {
        responseId: 'resp-1',
        requestId: 'req-provider-1',
        serviceTier: 'default'
      }
    }))
  })

  it.each([
    [401, 'AI_PROVIDER_CREDENTIALS_INVALID'],
    [429, 'AI_PROVIDER_RATE_LIMITED'],
    [503, 'AI_PROVIDER_TEMPORARILY_UNAVAILABLE'],
    [400, 'AI_PROVIDER_REQUEST_REJECTED']
  ])('maps HTTP %i to %s', async (status, code) => {
    const fetchImpl = jest.fn().mockResolvedValue(response({
      ok: false,
      status,
      payload: { error: { message: 'provider detail' } }
    }))
    const provider = createOpenAiResponsesProvider({ apiKey: 'key', fetchImpl })
    await expect(provider.generateStructured({ prompt })).rejects.toEqual(expect.objectContaining({ code }))
  })

  it('normalizes network failures and malformed provider responses', async () => {
    const networkProvider = createOpenAiResponsesProvider({
      apiKey: 'key',
      fetchImpl: jest.fn().mockRejectedValue(new TypeError('offline'))
    })
    await expect(networkProvider.generateStructured({ prompt })).rejects.toEqual(expect.objectContaining({
      code: 'AI_PROVIDER_NETWORK_ERROR'
    }))

    const malformedProvider = createOpenAiResponsesProvider({
      apiKey: 'key',
      fetchImpl: jest.fn().mockResolvedValue(response({ payload: { status: 'completed', output_text: '{bad' } }))
    })
    await expect(malformedProvider.generateStructured({ prompt })).rejects.toEqual(expect.objectContaining({
      code: 'AI_PROVIDER_RESPONSE_INVALID'
    }))
  })

  it('rejects incomplete and empty provider output', async () => {
    const incomplete = createOpenAiResponsesProvider({
      apiKey: 'key',
      fetchImpl: jest.fn().mockResolvedValue(response({ payload: { status: 'incomplete' } }))
    })
    await expect(incomplete.generateStructured({ prompt })).rejects.toEqual(expect.objectContaining({
      code: 'AI_PROVIDER_RESPONSE_INCOMPLETE'
    }))

    const empty = createOpenAiResponsesProvider({
      apiKey: 'key',
      fetchImpl: jest.fn().mockResolvedValue(response({ payload: { status: 'completed', output: [] } }))
    })
    await expect(empty.generateStructured({ prompt })).rejects.toEqual(expect.objectContaining({
      code: 'AI_PROVIDER_RESPONSE_INVALID'
    }))
  })

  it('supports nested response output text and stable helper behavior', () => {
    expect(extractResponseText({ output: [{ content: [{ type: 'output_text', text: '{"ok":true}' }] }] })).toBe('{"ok":true}')
    expect(normalizeOpenAiUsage({ input_tokens: 2, output_tokens: 3 }, { inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 2 })).toEqual({
      inputTokens: 2,
      outputTokens: 3,
      totalTokens: 5,
      estimatedCostUsd: 0.000008
    })
    expect(mapOpenAiHttpError(429, {}, 'req-1')).toEqual(expect.objectContaining({ code: 'AI_PROVIDER_RATE_LIMITED' }))
    expect(buildOpenAiRequest({ model: 'gpt-test', prompt, metadata: {} }).model).toBe('gpt-test')
  })
})
