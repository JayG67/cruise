const { listAuditEvents, recordAuditEvent } = require('./auditEvent.service')

const GENERATED_EVENT = 'AI_TURNAROUND_BRIEFING_GENERATED'
const REVIEWED_EVENT = 'AI_TURNAROUND_BRIEFING_REVIEWED'

class AiTurnaroundBriefingReviewError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'AiTurnaroundBriefingReviewError'
    this.code = code
  }
}

function mapGeneratedBriefingEvent(event = {}) {
  const payload = event.eventPayload || {}
  return {
    briefingId: payload.briefingId || payload.requestId || event.id,
    operationId: event.operationId || payload.operationId,
    question: payload.question || null,
    briefing: payload.briefing || null,
    provider: payload.provider || null,
    model: payload.model || null,
    promptVersion: payload.promptVersion || null,
    evidenceCount: payload.evidenceCount || 0,
    actorUserId: event.actorUserId || payload.actorUserId || null,
    actorDisplayName: event.actorDisplayName || null,
    generatedAt: payload.generatedAt || event.createdAt,
    createdAt: event.createdAt
  }
}

function mapReviewEvent(event = {}) {
  const payload = event.eventPayload || {}
  return {
    reviewId: event.id,
    briefingId: payload.briefingId,
    disposition: payload.disposition,
    notes: payload.notes || null,
    reviewerUserId: event.actorUserId || null,
    reviewerDisplayName: event.actorDisplayName || null,
    reviewedAt: payload.reviewedAt || event.createdAt
  }
}

async function listTurnaroundBriefingHistory(operationId, { limit = 20, auditEventLister = listAuditEvents } = {}) {
  const [generatedEvents, reviewEvents] = await Promise.all([
    auditEventLister({ operationId, source: 'AI', eventType: GENERATED_EVENT }, { limit }),
    auditEventLister({ operationId, source: 'AI', eventType: REVIEWED_EVENT }, { limit: 100 })
  ])

  const reviewsByBriefingId = new Map()
  for (const event of reviewEvents) {
    const review = mapReviewEvent(event)
    if (!review.briefingId || reviewsByBriefingId.has(review.briefingId)) continue
    reviewsByBriefingId.set(review.briefingId, review)
  }

  const briefings = generatedEvents.map(event => {
    const briefing = mapGeneratedBriefingEvent(event)
    return { ...briefing, review: reviewsByBriefingId.get(briefing.briefingId) || null }
  })

  return { operationId, briefings, count: briefings.length }
}

async function reviewTurnaroundBriefing({ operationId, briefingId, disposition, notes, actor, now = () => new Date(), auditEventLister = listAuditEvents, auditRecorder = recordAuditEvent } = {}) {
  const generated = await auditEventLister({ operationId, source: 'AI', eventType: GENERATED_EVENT }, { limit: 100 })
  const briefingEvent = generated.find(event => {
    const payload = event.eventPayload || {}
    return (payload.briefingId || payload.requestId || event.id) === briefingId
  })

  if (!briefingEvent) {
    throw new AiTurnaroundBriefingReviewError('AI turnaround briefing was not found for this operation.', 'AI_TURNAROUND_BRIEFING_NOT_FOUND')
  }

  const reviewedAt = now().toISOString()
  await auditRecorder({
    eventType: REVIEWED_EVENT,
    entityType: 'AI_TURNAROUND_BRIEFING',
    entityId: briefingId,
    actorUserId: actor?.actorUserId || null,
    actorDisplayName: actor?.actorDisplayName || null,
    operationId,
    source: 'AI',
    eventPayload: { briefingId, disposition, notes: notes || null, reviewedAt }
  })

  return {
    operationId,
    briefingId,
    disposition,
    notes: notes || null,
    reviewerUserId: actor?.actorUserId || null,
    reviewerDisplayName: actor?.actorDisplayName || null,
    reviewedAt
  }
}

module.exports = {
  AiTurnaroundBriefingReviewError,
  GENERATED_EVENT,
  REVIEWED_EVENT,
  listTurnaroundBriefingHistory,
  mapGeneratedBriefingEvent,
  mapReviewEvent,
  reviewTurnaroundBriefing
}
