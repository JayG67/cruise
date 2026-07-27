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
