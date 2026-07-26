const {
  AiBriefingValidationError,
  assertEvidenceGrounding,
  buildAiAuditRecord,
  generateTurnaroundBriefing
} = require('../../services/aiTurnaroundBriefing.service')
const { createDeterministicAiProvider } = require('../../services/aiProvider.service')

describe('AI turnaround briefing orchestration', () => {
  const input = {
    operationId: 'operation-1',
    question: 'What could delay departure?',
    evidence: [
      {
        id: 'dependency-1',
        type: 'dependency',
        title: 'Cabin release inspection',
        status: 'BLOCKED',
        owner: 'Housekeeping Lead',
        details: 'Deck 9 inspection remains incomplete.',
        departmentRole: 'HOUSEKEEPING_LEAD'
      }
    ]
  }
  const actor = { actorUserId: 'manager-1', actorDisplayName: 'Morgan Manager', actorRole: 'TURNAROUND_MANAGER' }
  const runtimeConfig = { timeoutMs: 1000, maxAttempts: 2, retryDelayMs: 0 }

  it('validates request and response contracts, prompt version, evidence, and audit metadata', async () => {
    const provider = createDeterministicAiProvider({ now: () => new Date('2026-07-26T16:00:00.000Z') })
    const result = await generateTurnaroundBriefing({ input, actor, provider, requestId: 'request-123', runtimeConfig })

    expect(result.briefing).toEqual(expect.objectContaining({
      riskLevel: 'high',
      model: 'deterministic-rule-engine-v1',
      promptVersion: 'turnaround-briefing-v1.0.0'
    }))
    expect(result.briefing.findings[0]).toEqual(expect.objectContaining({
      category: 'dependency',
      evidenceIds: ['dependency-1']
    }))
    expect(result.audit).toEqual(expect.objectContaining({
      eventType: 'AI_TURNAROUND_BRIEFING_GENERATED',
      requestId: 'request-123',
      operationId: 'operation-1',
      actorUserId: 'manager-1',
      evidenceCount: 1,
      findingCount: 1,
      riskLevel: 'high'
    }))
  })

  it('rejects malformed requests before calling the provider', async () => {
    const provider = { generateStructured: jest.fn() }
    await expect(generateTurnaroundBriefing({
      input: { operationId: '', question: 'x', evidence: [] },
      actor,
      provider,
      runtimeConfig
    })).rejects.toEqual(expect.objectContaining({ code: 'AI_REQUEST_INVALID' }))
    expect(provider.generateStructured).not.toHaveBeenCalled()
  })

  it('rejects malformed model output instead of sending unsafe partial data to the UI', async () => {
    const provider = {
      name: 'test-provider',
      model: 'bad-model',
      generateStructured: jest.fn().mockResolvedValue({
        output: { summary: '', riskLevel: 'extreme', findings: 'not-an-array' }
      })
    }

    await expect(generateTurnaroundBriefing({ input, actor, provider, runtimeConfig })).rejects.toEqual(expect.objectContaining({
      code: 'AI_RESPONSE_INVALID'
    }))
  })

  it('rejects hallucinated evidence references even when the model response otherwise matches the schema', async () => {
    const provider = {
      name: 'test-provider',
      model: 'test-model',
      generateStructured: jest.fn().mockResolvedValue({
        output: {
          summary: 'One issue requires review.',
          riskLevel: 'high',
          findings: [{
            category: 'dependency',
            severity: 'high',
            title: 'Unsupported issue',
            explanation: 'This claim has no supplied evidence.',
            evidenceIds: ['invented-record'],
            recommendedAction: 'Review the source record.'
          }],
          unknowns: [],
          generatedAt: '2026-07-26T16:00:00.000Z'
        }
      })
    }

    await expect(generateTurnaroundBriefing({ input, actor, provider, runtimeConfig })).rejects.toEqual(expect.objectContaining({
      code: 'AI_UNGROUNDED_EVIDENCE',
      issues: ['invented-record']
    }))
  })

  it('detects duplicate and unknown evidence references through a reusable grounding guard', () => {
    expect(() => assertEvidenceGrounding({
      findings: [{ evidenceIds: ['known', 'unknown', 'unknown'] }]
    }, [{ id: 'known' }])).toThrow(AiBriefingValidationError)
  })


  it('persists privacy-conscious AI audit evidence through the injected audit recorder', async () => {
    const provider = createDeterministicAiProvider({ now: () => new Date('2026-07-26T16:00:00.000Z') })
    const auditRecorder = jest.fn().mockResolvedValue()

    const result = await generateTurnaroundBriefing({
      input,
      actor,
      provider,
      runtimeConfig,
      auditRecorder,
      requestId: 'request-audit'
    })

    expect(auditRecorder).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'AI_TURNAROUND_BRIEFING_GENERATED',
      entityType: 'TURNAROUND_OPERATION',
      entityId: 'operation-1',
      actorUserId: 'manager-1',
      actorDisplayName: 'Morgan Manager',
      operationId: 'operation-1',
      source: 'AI',
      eventPayload: expect.objectContaining({
        requestId: 'request-audit',
        execution: expect.objectContaining({ attemptCount: 1, retried: false })
      })
    }))
    expect(JSON.stringify(auditRecorder.mock.calls[0][0])).not.toContain('Deck 9 inspection')
    expect(result.audit.execution).toEqual(expect.objectContaining({ attemptCount: 1 }))
  })

  it('fails closed when required audit persistence fails', async () => {
    const provider = createDeterministicAiProvider()
    const auditRecorder = jest.fn().mockRejectedValue(new Error('database unavailable'))

    await expect(generateTurnaroundBriefing({
      input,
      actor,
      provider,
      runtimeConfig,
      auditRecorder
    })).rejects.toThrow('database unavailable')
  })

  it('builds privacy-conscious audit records without storing prompts or evidence content', () => {
    const record = buildAiAuditRecord({
      actor,
      input,
      response: {
        model: 'model-1', promptVersion: 'prompt-1', findings: [], riskLevel: 'low', generatedAt: '2026-07-26T16:00:00.000Z'
      },
      provider: { name: 'provider-1' },
      usage: { inputTokens: 10, outputTokens: 5 },
      durationMs: 12,
      requestId: 'request-1'
    })

    expect(record).not.toHaveProperty('question')
    expect(record).not.toHaveProperty('evidence')
    expect(JSON.stringify(record)).not.toContain('Deck 9 inspection')
  })
})
