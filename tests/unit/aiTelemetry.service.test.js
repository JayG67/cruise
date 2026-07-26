const { recordAiTelemetry, sanitizeAiTelemetryEvent } = require('../../services/aiTelemetry.service')

describe('AI telemetry', () => {
  it('keeps correlation and usage fields while excluding prompt and evidence content', () => {
    const event = sanitizeAiTelemetryEvent({
      requestId: 'app-request-1',
      providerRequestId: 'provider-request-1',
      providerResponseId: 'response-1',
      operationId: 'operation-1',
      provider: 'openai',
      model: 'gpt-test',
      inputTokens: 20,
      outputTokens: 10,
      totalTokens: 30,
      estimatedCostUsd: 0.001,
      prompt: 'secret prompt',
      evidence: [{ details: 'private evidence' }]
    })

    expect(event).toEqual(expect.objectContaining({
      requestId: 'app-request-1',
      providerRequestId: 'provider-request-1',
      providerResponseId: 'response-1',
      totalTokens: 30,
      estimatedCostUsd: 0.001
    }))
    expect(event).not.toHaveProperty('prompt')
    expect(event).not.toHaveProperty('evidence')
    expect(JSON.stringify(event)).not.toContain('private evidence')
  })

  it('writes one structured application-log record', () => {
    const logger = { info: jest.fn() }
    const result = recordAiTelemetry({ requestId: 'request-1', outcome: 'SUCCESS' }, { logger })
    expect(logger.info).toHaveBeenCalledTimes(1)
    expect(JSON.parse(logger.info.mock.calls[0][0])).toEqual(expect.objectContaining({
      channel: 'ai-telemetry',
      requestId: 'request-1',
      outcome: 'SUCCESS'
    }))
    expect(result.requestId).toBe('request-1')
  })
})
