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
})
