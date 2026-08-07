const { createAiProvider, AiProviderError } = require('../services/aiProvider.service')
const { AiBriefingValidationError, generateTurnaroundBriefing } = require('../services/aiTurnaroundBriefing.service')
const { AiTurnaroundEvidenceError, loadTurnaroundEvidence } = require('../services/aiTurnaroundEvidence.service')
const { generateOperationalTurnaroundBriefing } = require('../services/aiOperationalTurnaroundBriefing.service')
const { canAccessTurnaroundOperationForRequest, sendTurnaroundOperationForbidden } = require('../services/turnaroundScope.service')
const { resolveRequestActor } = require('../services/requestAuthorization.service')
const { recordAuditEvent } = require('../services/auditEvent.service')
const { AiTurnaroundBriefingReviewError, listTurnaroundBriefingHistory, reviewTurnaroundBriefing } = require('../services/aiTurnaroundBriefingReview.service')
const { getAiRuntimeConfig } = require('../services/aiRuntimeConfig.service')
const { recordAiTelemetry } = require('../services/aiTelemetry.service')
const { providerHttpStatus, canGenerateAiBriefing } = require('./aiControllerSupport')

exports.generateOperationalTurnaroundBriefing = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canGenerateAiBriefing(actor)) {
      return res.status(403).json({
        message: 'AI turnaround briefings require an administrator or assigned turnaround operational role.'
      })
    }

    const evidenceBundle = await loadTurnaroundEvidence(req.params.operationId)
    if (!(await canAccessTurnaroundOperationForRequest(req, evidenceBundle.operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    const result = await generateOperationalTurnaroundBriefing({
      operationId: req.params.operationId,
      question: req.body.question,
      requestedAt: req.body.requestedAt,
      actor,
      evidenceLoader: async () => evidenceBundle,
      provider: createAiProvider(),
      runtimeConfig: getAiRuntimeConfig(),
      auditRecorder: recordAuditEvent,
      telemetryRecorder: recordAiTelemetry,
      requestId: req.get('X-Request-Id') || null
    })

    return res.status(200).json(result)
  } catch (error) {
    if (error instanceof AiTurnaroundEvidenceError) {
      const status = error.code === 'AI_TURNAROUND_OPERATION_NOT_FOUND' ? 404 : 400
      return res.status(status).json({ message: error.message, code: error.code })
    }
    if (error instanceof AiProviderError) {
      return res.status(providerHttpStatus(error)).json({ message: error.message, code: error.code })
    }
    if (error instanceof AiBriefingValidationError) {
      const status = error.code === 'AI_CONTEXT_LIMIT_EXCEEDED' ? 413 : 502
      return res.status(status).json({ message: error.message, code: error.code, issues: error.issues })
    }
    return next(error)
  }
}

exports.generateTurnaroundBriefing = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canGenerateAiBriefing(actor)) {
      return res.status(403).json({
        message: 'AI turnaround briefings require an administrator or assigned turnaround operational role.'
      })
    }

    const result = await generateTurnaroundBriefing({
      input: req.body,
      actor,
      provider: createAiProvider(),
      runtimeConfig: getAiRuntimeConfig(),
      auditRecorder: recordAuditEvent,
      telemetryRecorder: recordAiTelemetry,
      requestId: req.get('X-Request-Id') || null
    })

    return res.status(200).json(result)
  } catch (error) {
    if (error instanceof AiProviderError) {
      return res.status(providerHttpStatus(error)).json({
        message: error.message,
        code: error.code
      })
    }
    if (error instanceof AiBriefingValidationError) {
      const status = error.code === 'AI_CONTEXT_LIMIT_EXCEEDED' ? 413 : 502
      return res.status(status).json({ message: error.message, code: error.code, issues: error.issues })
    }
    return next(error)
  }
}


exports.listOperationalTurnaroundBriefingHistory = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canGenerateAiBriefing(actor)) {
      return res.status(403).json({ message: 'AI turnaround briefing history requires an administrator or assigned turnaround operational role.' })
    }

    const evidenceBundle = await loadTurnaroundEvidence(req.params.operationId)
    if (!(await canAccessTurnaroundOperationForRequest(req, evidenceBundle.operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    const result = await listTurnaroundBriefingHistory(req.params.operationId, { limit: req.query.limit })
    return res.status(200).json({
      ...result,
      operation: {
        id: evidenceBundle.operation.id,
        title: evidenceBundle.operation.title,
        status: evidenceBundle.operation.status,
        readinessLevel: evidenceBundle.operation.readinessLevel
      }
    })
  } catch (error) {
    if (error instanceof AiTurnaroundEvidenceError) {
      const status = error.code === 'AI_TURNAROUND_OPERATION_NOT_FOUND' ? 404 : 400
      return res.status(status).json({ message: error.message, code: error.code })
    }
    return next(error)
  }
}

exports.reviewOperationalTurnaroundBriefing = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canGenerateAiBriefing(actor)) {
      return res.status(403).json({ message: 'AI turnaround briefing review requires an administrator or assigned turnaround operational role.' })
    }

    const evidenceBundle = await loadTurnaroundEvidence(req.params.operationId)
    if (!(await canAccessTurnaroundOperationForRequest(req, evidenceBundle.operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    const result = await reviewTurnaroundBriefing({
      operationId: req.params.operationId,
      briefingId: req.params.briefingId,
      disposition: req.body.disposition,
      notes: req.body.notes,
      actor,
      auditRecorder: recordAuditEvent
    })
    return res.status(201).json(result)
  } catch (error) {
    if (error instanceof AiTurnaroundEvidenceError) {
      const status = error.code === 'AI_TURNAROUND_OPERATION_NOT_FOUND' ? 404 : 400
      return res.status(status).json({ message: error.message, code: error.code })
    }
    if (error instanceof AiTurnaroundBriefingReviewError) {
      return res.status(404).json({ message: error.message, code: error.code })
    }
    return next(error)
  }
}

