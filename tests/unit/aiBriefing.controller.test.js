jest.mock('../../services/requestAuthorization.service', () => ({ resolveRequestActor: jest.fn() }))
jest.mock('../../services/aiProvider.service', () => {
  class AiProviderError extends Error { constructor(message, code) { super(message); this.code = code } }
  return { AiProviderError, createAiProvider: jest.fn(() => ({ provider: 'test' })) }
})
jest.mock('../../services/auditEvent.service', () => ({ recordAuditEvent: jest.fn() }))
jest.mock('../../services/aiTelemetry.service', () => ({ recordAiTelemetry: jest.fn() }))
jest.mock('../../services/aiRuntimeConfig.service', () => ({ getAiRuntimeConfig: jest.fn(() => ({ providerName: 'test' })) }))
jest.mock('../../services/turnaroundScope.service', () => ({
  canAccessTurnaroundOperationForRequest: jest.fn().mockResolvedValue(true),
  sendTurnaroundOperationForbidden: jest.fn(res => res.status(403).json({ message: 'forbidden' }))
}))
jest.mock('../../services/aiTurnaroundEvidence.service', () => {
  class AiTurnaroundEvidenceError extends Error { constructor(message, code) { super(message); this.code = code } }
  return { AiTurnaroundEvidenceError, loadTurnaroundEvidence: jest.fn() }
})
jest.mock('../../services/aiOperationalTurnaroundBriefing.service', () => ({ generateOperationalTurnaroundBriefing: jest.fn() }))
jest.mock('../../services/aiTurnaroundBriefing.service', () => {
  class AiBriefingValidationError extends Error { constructor(message, code, issues = []) { super(message); this.code = code; this.issues = issues } }
  return { AiBriefingValidationError, generateTurnaroundBriefing: jest.fn() }
})
jest.mock('../../services/aiTurnaroundBriefingReview.service', () => {
  class AiTurnaroundBriefingReviewError extends Error { constructor(message, code) { super(message); this.code = code } }
  return {
    AiTurnaroundBriefingReviewError,
    listTurnaroundBriefingHistory: jest.fn(),
    reviewTurnaroundBriefing: jest.fn()
  }
})
jest.mock('../../controllers/aiControllerSupport', () => ({
  canGenerateAiBriefing: jest.fn(actor => ['ADMIN', 'TURNAROUND_MANAGER'].includes(actor?.actorRole)),
  providerHttpStatus: jest.fn(() => 503)
}))

const { resolveRequestActor } = require('../../services/requestAuthorization.service')
const { loadTurnaroundEvidence, AiTurnaroundEvidenceError } = require('../../services/aiTurnaroundEvidence.service')
const { generateOperationalTurnaroundBriefing } = require('../../services/aiOperationalTurnaroundBriefing.service')
const { generateTurnaroundBriefing, AiBriefingValidationError } = require('../../services/aiTurnaroundBriefing.service')
const { AiProviderError } = require('../../services/aiProvider.service')
const scope = require('../../services/turnaroundScope.service')
const {
  AiTurnaroundBriefingReviewError,
  listTurnaroundBriefingHistory,
  reviewTurnaroundBriefing
} = require('../../services/aiTurnaroundBriefingReview.service')
const controller = require('../../controllers/aiBriefing.controller')

function responseHarness() {
  const json = jest.fn()
  const status = jest.fn(() => ({ json }))
  return { res: { status }, status, json }
}

const actor = { actorUserId: 'admin-1', actorRole: 'ADMIN', actorDisplayName: 'Admin' }
const operation = { id: 'op-1', title: 'Turnaround', status: 'ACTIVE', readinessLevel: 'WATCH' }

describe('AI briefing controller history and review boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resolveRequestActor.mockResolvedValue(actor)
    loadTurnaroundEvidence.mockResolvedValue({ operation })
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(true)
  })

  it('denies briefing history before loading operation evidence for an unauthorized role', async () => {
    resolveRequestActor.mockResolvedValue({ actorRole: 'PASSENGER' })
    const { res, status } = responseHarness()

    await controller.listOperationalTurnaroundBriefingHistory({ params: { operationId: 'op-1' }, query: {} }, res, jest.fn())

    expect(status).toHaveBeenCalledWith(403)
    expect(loadTurnaroundEvidence).not.toHaveBeenCalled()
    expect(listTurnaroundBriefingHistory).not.toHaveBeenCalled()
  })

  it('returns operation metadata with authorized briefing history and forwards the requested limit', async () => {
    listTurnaroundBriefingHistory.mockResolvedValue({ operationId: 'op-1', count: 1, briefings: [{ briefingId: 'b-1' }] })
    const { res, status, json } = responseHarness()

    await controller.listOperationalTurnaroundBriefingHistory({ params: { operationId: 'op-1' }, query: { limit: 7 } }, res, jest.fn())

    expect(listTurnaroundBriefingHistory).toHaveBeenCalledWith('op-1', { limit: 7 })
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      count: 1,
      operation: { id: 'op-1', title: 'Turnaround', status: 'ACTIVE', readinessLevel: 'WATCH' }
    }))
  })

  it('fails closed when history scope authorization denies the loaded operation', async () => {
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(false)
    const { res } = responseHarness()

    await controller.listOperationalTurnaroundBriefingHistory({ params: { operationId: 'op-1' }, query: {} }, res, jest.fn())

    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(res)
    expect(listTurnaroundBriefingHistory).not.toHaveBeenCalled()
  })

  it.each([
    ['AI_TURNAROUND_OPERATION_NOT_FOUND', 404],
    ['AI_TURNAROUND_EVIDENCE_INVALID', 400]
  ])('maps history evidence error %s to %i', async (code, expectedStatus) => {
    loadTurnaroundEvidence.mockRejectedValue(new AiTurnaroundEvidenceError('bad evidence', code))
    const { res, status, json } = responseHarness()

    await controller.listOperationalTurnaroundBriefingHistory({ params: { operationId: 'op-1' }, query: {} }, res, jest.fn())

    expect(status).toHaveBeenCalledWith(expectedStatus)
    expect(json).toHaveBeenCalledWith({ message: 'bad evidence', code })
  })

  it('passes unexpected history errors to Express', async () => {
    const error = new Error('history database unavailable')
    listTurnaroundBriefingHistory.mockRejectedValue(error)
    const next = jest.fn()

    await controller.listOperationalTurnaroundBriefingHistory({ params: { operationId: 'op-1' }, query: {} }, responseHarness().res, next)

    expect(next).toHaveBeenCalledWith(error)
  })

  it('reviews an authorized briefing with the server-resolved actor and audit recorder', async () => {
    reviewTurnaroundBriefing.mockResolvedValue({ briefingId: 'b-1', disposition: 'APPROVED' })
    const { res, status, json } = responseHarness()
    const req = { params: { operationId: 'op-1', briefingId: 'b-1' }, body: { disposition: 'APPROVED', notes: 'Reviewed' } }

    await controller.reviewOperationalTurnaroundBriefing(req, res, jest.fn())

    expect(reviewTurnaroundBriefing).toHaveBeenCalledWith(expect.objectContaining({
      operationId: 'op-1', briefingId: 'b-1', disposition: 'APPROVED', notes: 'Reviewed', actor
    }))
    expect(status).toHaveBeenCalledWith(201)
    expect(json).toHaveBeenCalledWith({ briefingId: 'b-1', disposition: 'APPROVED' })
  })

  it('denies review before evidence lookup when the actor lacks AI briefing access', async () => {
    resolveRequestActor.mockResolvedValue({ actorRole: 'GROUP_LEADER' })
    const { res, status } = responseHarness()

    await controller.reviewOperationalTurnaroundBriefing({ params: {}, body: {} }, res, jest.fn())

    expect(status).toHaveBeenCalledWith(403)
    expect(loadTurnaroundEvidence).not.toHaveBeenCalled()
    expect(reviewTurnaroundBriefing).not.toHaveBeenCalled()
  })

  it('fails closed when review scope authorization denies the operation', async () => {
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(false)
    const { res } = responseHarness()

    await controller.reviewOperationalTurnaroundBriefing({ params: { operationId: 'op-1', briefingId: 'b-1' }, body: {} }, res, jest.fn())

    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(res)
    expect(reviewTurnaroundBriefing).not.toHaveBeenCalled()
  })

  it('maps missing review targets to a 404 response', async () => {
    reviewTurnaroundBriefing.mockRejectedValue(new AiTurnaroundBriefingReviewError('missing briefing', 'AI_TURNAROUND_BRIEFING_NOT_FOUND'))
    const { res, status, json } = responseHarness()

    await controller.reviewOperationalTurnaroundBriefing({ params: { operationId: 'op-1', briefingId: 'missing' }, body: {} }, res, jest.fn())

    expect(status).toHaveBeenCalledWith(404)
    expect(json).toHaveBeenCalledWith({ message: 'missing briefing', code: 'AI_TURNAROUND_BRIEFING_NOT_FOUND' })
  })

  it('maps review evidence errors and forwards unexpected review failures', async () => {
    loadTurnaroundEvidence.mockRejectedValueOnce(new AiTurnaroundEvidenceError('not found', 'AI_TURNAROUND_OPERATION_NOT_FOUND'))
    const first = responseHarness()
    await controller.reviewOperationalTurnaroundBriefing({ params: { operationId: 'op-1' }, body: {} }, first.res, jest.fn())
    expect(first.status).toHaveBeenCalledWith(404)

    loadTurnaroundEvidence.mockResolvedValue({ operation })
    const error = new Error('audit write failed')
    reviewTurnaroundBriefing.mockRejectedValueOnce(error)
    const next = jest.fn()
    await controller.reviewOperationalTurnaroundBriefing({ params: { operationId: 'op-1' }, body: {} }, responseHarness().res, next)
    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('AI briefing controller generation error branches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resolveRequestActor.mockResolvedValue(actor)
    loadTurnaroundEvidence.mockResolvedValue({ operation })
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(true)
  })

  it('uses a null request id when operational generation has no correlation id', async () => {
    generateOperationalTurnaroundBriefing.mockResolvedValue({ briefing: {} })
    const { res, status } = responseHarness()
    await controller.generateOperationalTurnaroundBriefing({ params: { operationId: 'op-1' }, body: {} }, res, jest.fn())
    expect(generateOperationalTurnaroundBriefing).toHaveBeenCalledWith(expect.objectContaining({ requestId: null }))
    expect(status).toHaveBeenCalledWith(200)
  })

  it('maps provider and validation failures during operational generation', async () => {
    generateOperationalTurnaroundBriefing.mockRejectedValueOnce(new AiProviderError('provider down', 'AI_PROVIDER_TIMEOUT'))
    const providerResponse = responseHarness()
    await controller.generateOperationalTurnaroundBriefing({ params: { operationId: 'op-1' }, body: {} }, providerResponse.res, jest.fn())
    expect(providerResponse.status).toHaveBeenCalledWith(503)

    generateOperationalTurnaroundBriefing.mockRejectedValueOnce(new AiBriefingValidationError('context too large', 'AI_CONTEXT_LIMIT_EXCEEDED', ['limit']))
    const validationResponse = responseHarness()
    await controller.generateOperationalTurnaroundBriefing({ params: { operationId: 'op-1' }, body: {} }, validationResponse.res, jest.fn())
    expect(validationResponse.status).toHaveBeenCalledWith(413)
    expect(validationResponse.json).toHaveBeenCalledWith(expect.objectContaining({ issues: ['limit'] }))
  })

  it('uses a null request id for legacy briefing generation and forwards unexpected errors', async () => {
    generateTurnaroundBriefing.mockResolvedValueOnce({ briefing: {} })
    const success = responseHarness()
    await controller.generateTurnaroundBriefing({ body: {} }, success.res, jest.fn())
    expect(generateTurnaroundBriefing).toHaveBeenCalledWith(expect.objectContaining({ requestId: null }))

    const error = new Error('unexpected')
    generateTurnaroundBriefing.mockRejectedValueOnce(error)
    const next = jest.fn()
    await controller.generateTurnaroundBriefing({ body: {} }, responseHarness().res, next)
    expect(next).toHaveBeenCalledWith(error)
  })
})
