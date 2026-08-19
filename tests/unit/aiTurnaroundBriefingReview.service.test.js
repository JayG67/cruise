const {
  AiTurnaroundBriefingReviewError,
  listTurnaroundBriefingHistory,
  reviewTurnaroundBriefing
} = require('../../services/aiTurnaroundBriefingReview.service')

describe('Phase 2 briefing history and review service', () => {
  it('returns generated briefings with the latest matching review', async () => {
    const auditEventLister = jest.fn()
      .mockResolvedValueOnce([{
        id: 'event-1', operationId: 'op-1', actorUserId: 'manager-1', createdAt: '2026-08-01T10:00:00.000Z',
        eventPayload: { briefingId: 'brief-1', question: 'What is at risk?', briefing: { riskLevel: 'high' }, model: 'test-model', generatedAt: '2026-08-01T10:00:00.000Z' }
      }])
      .mockResolvedValueOnce([{
        id: 'review-1', operationId: 'op-1', actorUserId: 'admin-1', createdAt: '2026-08-01T10:05:00.000Z',
        eventPayload: { briefingId: 'brief-1', disposition: 'ACCEPTED', notes: 'Grounded and useful.' }
      }])

    const result = await listTurnaroundBriefingHistory('op-1', { auditEventLister })

    expect(result.count).toBe(1)
    expect(result.briefings[0]).toEqual(expect.objectContaining({
      briefingId: 'brief-1',
      question: 'What is at risk?',
      briefing: { riskLevel: 'high' },
      review: expect.objectContaining({ disposition: 'ACCEPTED' })
    }))
  })

  it('records reviewer disposition against an existing briefing', async () => {
    const auditEventLister = jest.fn().mockResolvedValue([{
      id: 'event-1', operationId: 'op-1', eventPayload: { briefingId: 'brief-1' }
    }])
    const auditRecorder = jest.fn().mockResolvedValue(undefined)
    const actor = { actorUserId: 'admin-1', actorDisplayName: 'Admin User' }

    const result = await reviewTurnaroundBriefing({
      operationId: 'op-1', briefingId: 'brief-1', disposition: 'NEEDS_REVISION', notes: 'Clarify staffing risk.', actor,
      now: () => new Date('2026-08-01T11:00:00.000Z'), auditEventLister, auditRecorder
    })

    expect(auditRecorder).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'AI_TURNAROUND_BRIEFING_REVIEWED',
      operationId: 'op-1',
      entityId: 'brief-1',
      eventPayload: expect.objectContaining({ disposition: 'NEEDS_REVISION' })
    }))
    expect(result).toEqual(expect.objectContaining({ briefingId: 'brief-1', reviewerUserId: 'admin-1' }))
  })

  it('rejects feedback for a briefing outside the operation history', async () => {
    await expect(reviewTurnaroundBriefing({
      operationId: 'op-1', briefingId: 'missing', disposition: 'REJECTED',
      auditEventLister: jest.fn().mockResolvedValue([]), auditRecorder: jest.fn()
    })).rejects.toEqual(expect.objectContaining({
      code: 'AI_TURNAROUND_BRIEFING_NOT_FOUND',
      name: 'AiTurnaroundBriefingReviewError'
    }))
  })
})

describe('Phase 2 briefing history branch hardening', () => {
  const { mapGeneratedBriefingEvent, mapReviewEvent } = require('../../services/aiTurnaroundBriefingReview.service')

  it('maps request-id and event-id fallbacks without inventing optional evidence', () => {
    expect(mapGeneratedBriefingEvent({
      id: 'event-id',
      actorDisplayName: 'Operator',
      createdAt: '2026-08-01T10:00:00.000Z',
      eventPayload: { requestId: 'request-id', operationId: 'op-fallback' }
    })).toEqual(expect.objectContaining({
      briefingId: 'request-id',
      operationId: 'op-fallback',
      question: null,
      briefing: null,
      evidenceCount: 0,
      actorUserId: null,
      generatedAt: '2026-08-01T10:00:00.000Z'
    }))

    expect(mapGeneratedBriefingEvent({ id: 'event-only' }).briefingId).toBe('event-only')
  })

  it('maps review fallbacks and keeps missing reviewer metadata nullable', () => {
    expect(mapReviewEvent({
      id: 'review-2',
      createdAt: '2026-08-01T12:00:00.000Z',
      eventPayload: { briefingId: 'brief-2', disposition: 'ACCEPTED' }
    })).toEqual({
      reviewId: 'review-2',
      briefingId: 'brief-2',
      disposition: 'ACCEPTED',
      notes: null,
      reviewerUserId: null,
      reviewerDisplayName: null,
      reviewedAt: '2026-08-01T12:00:00.000Z'
    })
  })

  it('keeps the first returned review for a briefing and ignores malformed review rows', async () => {
    const auditEventLister = jest.fn()
      .mockResolvedValueOnce([{ id: 'generated', operationId: 'op-1', eventPayload: { briefingId: 'brief-1' } }])
      .mockResolvedValueOnce([
        { id: 'latest', createdAt: '2026-08-01T12:00:00.000Z', eventPayload: { briefingId: 'brief-1', disposition: 'ACCEPTED' } },
        { id: 'older', createdAt: '2026-08-01T11:00:00.000Z', eventPayload: { briefingId: 'brief-1', disposition: 'REJECTED' } },
        { id: 'malformed', createdAt: '2026-08-01T10:00:00.000Z', eventPayload: { disposition: 'REJECTED' } }
      ])

    const result = await listTurnaroundBriefingHistory('op-1', { limit: 7, auditEventLister })

    expect(auditEventLister).toHaveBeenNthCalledWith(1,
      { operationId: 'op-1', source: 'AI', eventType: 'AI_TURNAROUND_BRIEFING_GENERATED' },
      { limit: 7 })
    expect(result.briefings[0].review).toEqual(expect.objectContaining({ reviewId: 'latest', disposition: 'ACCEPTED' }))
  })

  it('records nullable notes and reviewer identity when the actor is absent', async () => {
    const auditEventLister = jest.fn().mockResolvedValue([{ id: 'generated', eventPayload: { requestId: 'brief-3' } }])
    const auditRecorder = jest.fn().mockResolvedValue(undefined)

    const result = await reviewTurnaroundBriefing({
      operationId: 'op-1', briefingId: 'brief-3', disposition: 'ACCEPTED', notes: '', actor: null,
      now: () => new Date('2026-08-01T13:00:00.000Z'), auditEventLister, auditRecorder
    })

    expect(auditRecorder).toHaveBeenCalledWith(expect.objectContaining({
      actorUserId: null,
      actorDisplayName: null,
      eventPayload: expect.objectContaining({ notes: null, reviewedAt: '2026-08-01T13:00:00.000Z' })
    }))
    expect(result).toEqual(expect.objectContaining({ notes: null, reviewerUserId: null, reviewerDisplayName: null }))
  })
})
