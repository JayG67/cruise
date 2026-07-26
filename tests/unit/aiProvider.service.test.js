const {
  AiProviderError,
  createAiProvider,
  createDeterministicAiProvider,
  createDisabledAiProvider,
  severityForEvidence
} = require('../../services/aiProvider.service')

describe('AI provider foundation', () => {
  it('keeps production generation disabled unless a provider is explicitly configured', async () => {
    const provider = createAiProvider({ providerName: '' })
    expect(provider).toEqual(expect.objectContaining({ name: 'disabled', model: 'not-configured' }))
    await expect(provider.generateStructured()).rejects.toEqual(expect.objectContaining({
      code: 'AI_PROVIDER_NOT_CONFIGURED'
    }))
  })

  it('rejects unsupported providers before any request is attempted', () => {
    expect(() => createAiProvider({ providerName: 'invented-provider' })).toThrow(AiProviderError)
    expect(() => createAiProvider({ providerName: 'invented-provider' })).toThrow('Unsupported AI provider')
  })


  it('creates the production OpenAI adapter without exposing its credential', () => {
    const provider = createAiProvider({
      providerName: 'openai',
      env: {
        OPENAI_API_KEY: 'private-key',
        OPENAI_MODEL: 'gpt-test',
        OPENAI_BASE_URL: 'https://example.test/v1'
      },
      fetchImpl: jest.fn()
    })

    expect(provider).toEqual(expect.objectContaining({
      name: 'openai',
      model: 'gpt-test',
      credentialConfigured: true
    }))
    expect(JSON.stringify(provider)).not.toContain('private-key')
  })

  it('classifies operational evidence deterministically', () => {
    expect(severityForEvidence({ status: 'CRITICAL' })).toBe('critical')
    expect(severityForEvidence({ status: 'BLOCKED' })).toBe('high')
    expect(severityForEvidence({ details: 'Staffing shortfall remains' })).toBe('medium')
    expect(severityForEvidence({ status: 'COMPLETE' })).toBe('low')
  })

  it('creates grounded findings without executing or inventing actions', async () => {
    const provider = createDeterministicAiProvider({ now: () => new Date('2026-07-26T15:00:00.000Z') })
    const result = await provider.generateStructured({
      prompt: {
        user: {
          evidence: [
            { id: 'task-1', type: 'task', title: 'Cabin inspection', status: 'BLOCKED', owner: 'Avery' },
            { id: 'task-2', type: 'task', title: 'Fuel paperwork', status: 'COMPLETE' }
          ]
        }
      }
    })

    expect(result.output).toEqual(expect.objectContaining({
      riskLevel: 'high',
      generatedAt: '2026-07-26T15:00:00.000Z'
    }))
    expect(result.output.findings).toEqual([
      expect.objectContaining({
        title: 'Cabin inspection',
        evidenceIds: ['task-1'],
        recommendedAction: expect.stringContaining('Review task-1')
      })
    ])
    expect(JSON.stringify(result.output)).not.toMatch(/marked complete|executed successfully/i)
  })

  it('reports insufficient evidence without hallucinating findings', async () => {
    const provider = createDisabledAiProvider()
    expect(provider.name).toBe('disabled')

    const deterministic = createDeterministicAiProvider({ now: () => new Date('2026-07-26T15:00:00.000Z') })
    const result = await deterministic.generateStructured({ prompt: { user: { evidence: [] } } })
    expect(result.output.findings).toEqual([])
    expect(result.output.unknowns).toEqual(['No operational evidence was supplied.'])
    expect(result.output.riskLevel).toBe('low')
  })
})
