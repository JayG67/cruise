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
})
