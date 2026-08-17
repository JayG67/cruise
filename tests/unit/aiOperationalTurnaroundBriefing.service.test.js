const { generateOperationalTurnaroundBriefing } = require('../../services/aiOperationalTurnaroundBriefing.service')

describe('Phase 2 operation-scoped briefing orchestration', () => {
  it('loads trusted operation evidence and delegates to the Phase 1 generation boundary', async () => {
    const evidenceLoader = jest.fn().mockResolvedValue({
      operation: { id: 'op-1', title: 'Turnaround', status: 'IN_PROGRESS', readinessLevel: 'AT_RISK', turnaroundDate: '2026-08-01', port: 'Miami' },
      evidence: [{ id: 'task:1', type: 'task', title: 'Cabin release', status: 'BLOCKED' }],
      evidenceSummary: { totalAvailable: 1, included: 1, truncated: false, countsByType: { task: 1 } }
    })
    const briefingGenerator = jest.fn().mockResolvedValue({ briefing: { riskLevel: 'high' }, audit: { operationId: 'op-1' } })
    const actor = { actorUserId: 'manager-1', actorRole: 'TURNAROUND_MANAGER' }

    const result = await generateOperationalTurnaroundBriefing({
      operationId: 'op-1', question: 'What could delay departure?', actor, evidenceLoader, briefingGenerator,
      provider: { name: 'deterministic' }, runtimeConfig: { timeoutMs: 1000 }
    })

    expect(evidenceLoader).toHaveBeenCalledWith('op-1')
    expect(briefingGenerator).toHaveBeenCalledWith(expect.objectContaining({
      actor,
      input: expect.objectContaining({ operationId: 'op-1', evidence: expect.arrayContaining([expect.objectContaining({ id: 'task:1' })]) })
    }))
    expect(result).toEqual(expect.objectContaining({
      briefing: { riskLevel: 'high' },
      evidenceSummary: expect.objectContaining({ included: 1 }),
      operation: expect.objectContaining({ id: 'op-1', port: 'Miami' })
    }))
  })

  it('uses the default briefing question and includes requestedAt only when supplied', async () => {
    const evidenceLoader = jest.fn().mockResolvedValue({
      operation: { id: 'op-2', title: 'Turnaround 2', status: 'PLANNED', readinessLevel: 'PLANNING', turnaroundDate: '2026-09-01', port: 'Nassau' },
      evidence: [],
      evidenceSummary: { totalAvailable: 0, included: 0, truncated: false, countsByType: {} }
    })
    const briefingGenerator = jest.fn().mockResolvedValue({ briefing: { riskLevel: 'low' } })

    await generateOperationalTurnaroundBriefing({
      operationId: 'op-2', requestedAt: '2026-08-14T12:00:00.000Z', evidenceLoader, briefingGenerator
    })

    expect(briefingGenerator).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({
        question: 'Summarize current turnaround readiness and the most important next actions.',
        requestedAt: '2026-08-14T12:00:00.000Z'
      })
    }))
  })

})

describe('Phase 2 operational briefing fail-closed behavior', () => {
  it('does not invoke generation when trusted evidence no longer resolves an operation', async () => {
    const evidenceLoader = jest.fn().mockResolvedValue({ operation: null, evidence: [], evidenceSummary: {} })
    const briefingGenerator = jest.fn()

    await expect(generateOperationalTurnaroundBriefing({ operationId: 'deleted-op', evidenceLoader, briefingGenerator }))
      .rejects.toMatchObject({ code: 'TURNAROUND_OPERATION_NOT_FOUND' })
    expect(briefingGenerator).not.toHaveBeenCalled()
  })

  it('preserves an explicit question and omits requestedAt when it is absent', async () => {
    const evidenceLoader = jest.fn().mockResolvedValue({
      operation: { id: 'op-3', title: 'Turnaround 3', status: 'ACTIVE', readinessLevel: 'WATCH', turnaroundDate: '2026-10-01', port: 'Miami' },
      evidence: [], evidenceSummary: { included: 0 }
    })
    const briefingGenerator = jest.fn().mockResolvedValue({ briefing: {} })

    await generateOperationalTurnaroundBriefing({ operationId: 'op-3', question: 'Only show active blockers.', evidenceLoader, briefingGenerator })

    const call = briefingGenerator.mock.calls[0][0]
    expect(call.input.question).toBe('Only show active blockers.')
    expect(call.input).not.toHaveProperty('requestedAt')
  })
})
