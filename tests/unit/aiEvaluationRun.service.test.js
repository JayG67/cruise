const { getEvaluationRun, listEvaluationRuns, recordEvaluationRun } = require('../../services/aiEvaluationRun.service')

describe('AI evaluation run persistence', () => {
  test('records a completed run as an AI audit event', async () => {
    const auditRecorder = jest.fn()
    const run = { runId: 'run-1', suiteId: 'suite-1', passed: true }
    await expect(recordEvaluationRun({ run, actor: { actorUserId: 'admin-1', actorDisplayName: 'Admin' }, auditRecorder })).resolves.toBe(run)
    expect(auditRecorder).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'AI_EVALUATION_RUN_RECORDED', entityId: 'suite-1', source: 'AI', eventPayload: run }))
  })

  test('lists and locates persisted runs', async () => {
    const auditEventLister = jest.fn().mockResolvedValue([
      { id: 'event-1', createdAt: '2026-07-27T10:00:00.000Z', eventPayload: { runId: 'run-1', suiteId: 'suite-1' } }
    ])
    const listed = await listEvaluationRuns({ suiteId: 'suite-1', auditEventLister })
    expect(listed.runs[0]).toEqual(expect.objectContaining({ runId: 'run-1', auditEventId: 'event-1' }))
    await expect(getEvaluationRun('run-1', { suiteId: 'suite-1', auditEventLister })).resolves.toEqual(expect.objectContaining({ runId: 'run-1' }))
  })

  test('rejects incomplete runs and records anonymous actors safely', async () => {
    await expect(recordEvaluationRun({ run: { runId: 'run-only' }, auditRecorder: jest.fn() })).rejects.toThrow(TypeError)

    const auditRecorder = jest.fn()
    const run = { runId: 'run-2', suiteId: 'suite-2' }
    await recordEvaluationRun({ run, auditRecorder })
    expect(auditRecorder).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: null, actorDisplayName: null }))
  })

  test('maps fallback timestamps and exercises default listing options', async () => {
    const auditEventLister = jest.fn().mockResolvedValue([
      { id: null, createdAt: null, eventPayload: { runId: 'run-3', suiteId: 'turnaround-briefing-phase3', completedAt: '2026-08-14T12:00:00Z' } }
    ])
    const listed = await listEvaluationRuns({ auditEventLister })
    expect(auditEventLister).toHaveBeenCalledWith(expect.objectContaining({
      entityId: 'turnaround-briefing-phase3', source: 'AI'
    }), { limit: 20 })
    expect(listed.runs[0]).toEqual(expect.objectContaining({ auditEventId: null, recordedAt: '2026-08-14T12:00:00Z' }))
  })

  test('returns null for missing or unknown run ids', async () => {
    await expect(getEvaluationRun()).resolves.toBeNull()
    const auditEventLister = jest.fn().mockResolvedValue([])
    await expect(getEvaluationRun('missing', { auditEventLister })).resolves.toBeNull()
    expect(auditEventLister).toHaveBeenCalledWith(expect.any(Object), { limit: 100 })
  })

})
