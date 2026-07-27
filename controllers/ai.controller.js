const { getAiProgramStatus } = require('../services/aiProgramStatus.service')
const { createAiProvider, AiProviderError } = require('../services/aiProvider.service')
const { AiBriefingValidationError, generateTurnaroundBriefing } = require('../services/aiTurnaroundBriefing.service')
const { AiTurnaroundEvidenceError, loadTurnaroundEvidence } = require('../services/aiTurnaroundEvidence.service')
const { generateOperationalTurnaroundBriefing } = require('../services/aiOperationalTurnaroundBriefing.service')
const { canAccessTurnaroundOperationForRequest, sendTurnaroundOperationForbidden } = require('../services/turnaroundScope.service')
const { normalizeActorRole, resolveRequestActor } = require('../services/requestAuthorization.service')
const { recordAuditEvent } = require('../services/auditEvent.service')
const {
  AiTurnaroundBriefingReviewError,
  listTurnaroundBriefingHistory,
  reviewTurnaroundBriefing
} = require('../services/aiTurnaroundBriefingReview.service')
const { describeAiRuntimeConfig, getAiRuntimeConfig } = require('../services/aiRuntimeConfig.service')
const { describeAiPricingConfig, getAiPricingConfig } = require('../services/aiCostEstimation.service')
const { recordAiTelemetry } = require('../services/aiTelemetry.service')
const { assessAiFoundationReadiness } = require('../services/aiFoundationReadiness.service')
const { TURNAROUND_BRIEFING_EVALUATION_CASES } = require('../ai/evaluations/cases/turnaroundBriefing.cases')
const { runEvaluationSuite } = require('../services/aiEvaluationHarness.service')
const { compareEvaluationRuns } = require('../services/aiEvaluationBaseline.service')
const { runEvaluationMatrix } = require('../services/aiEvaluationMatrix.service')
const { getEvaluationRun, listEvaluationRuns, recordEvaluationRun } = require('../services/aiEvaluationRun.service')
const { buildAiEvaluationQualitySummary } = require('../services/aiEvaluationQualitySummary.service')

const AI_ALLOWED_ROLES = new Set([
  'ADMIN',
  'TURNAROUND_MANAGER',
  'HOUSEKEEPING_LEAD',
  'GUEST_SERVICES_LEAD',
  'FOOD_BEVERAGE_LEAD',
  'ENGINEERING_LEAD'
])


function providerHttpStatus(error) {
  if (['AI_PROVIDER_NOT_CONFIGURED', 'AI_PROVIDER_TEMPORARILY_UNAVAILABLE', 'AI_PROVIDER_CREDENTIALS_MISSING'].includes(error.code)) return 503
  if (error.code === 'AI_PROVIDER_TIMEOUT') return 504
  if (error.code === 'AI_PROVIDER_RATE_LIMITED') return 429
  if (error.code === 'AI_PROVIDER_CREDENTIALS_INVALID') return 502
  if (error.code === 'AI_RUNTIME_CONFIG_INVALID' || error.code === 'AI_PROVIDER_UNSUPPORTED') return 500
  return 502
}

function canGenerateAiBriefing(actor = {}) {
  return AI_ALLOWED_ROLES.has(normalizeActorRole(actor.actorRole))
}

exports.getAiProgramStatus = (req, res) => {
  const runtimeConfig = getAiRuntimeConfig()
  const provider = createAiProvider({ providerName: runtimeConfig.providerName })
  return res.status(200).json({
    ...getAiProgramStatus(),
    runtime: {
      provider: provider.name,
      model: provider.model,
      generationEnabled: provider.name !== 'disabled',
      credentialConfigured: provider.credentialConfigured !== false,
      executionPolicy: describeAiRuntimeConfig(runtimeConfig),
      pricing: describeAiPricingConfig(getAiPricingConfig()),
      foundationReadiness: assessAiFoundationReadiness()
    }
  })
}

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


function canManageAiEvaluations(actor = {}) {
  return normalizeActorRole(actor.actorRole) === 'ADMIN'
}

exports.runTurnaroundBriefingEvaluation = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canManageAiEvaluations(actor)) return res.status(403).json({ message: 'AI evaluation runs require an administrator.' })

    const candidates = new Map(req.body.candidates.map(item => [item.caseId, item.briefing]))
    const selectedCases = TURNAROUND_BRIEFING_EVALUATION_CASES.filter(item => candidates.has(item.id))
    if (selectedCases.length !== candidates.size) {
      return res.status(400).json({ message: 'One or more evaluation case identifiers are unknown.' })
    }

    const run = runEvaluationSuite({
      suiteId: req.body.suiteId,
      cases: selectedCases,
      generateCandidate: (_input, evaluationCase) => candidates.get(evaluationCase.id)
    })
    await recordEvaluationRun({ run, actor })
    return res.status(201).json(run)
  } catch (error) {
    return next(error)
  }
}



exports.runTurnaroundBriefingEvaluationMatrix = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canManageAiEvaluations(actor)) return res.status(403).json({ message: 'AI evaluation matrices require an administrator.' })

    const knownCaseIds = new Set(TURNAROUND_BRIEFING_EVALUATION_CASES.map(item => item.id))
    const requestedCaseIds = new Set(req.body.variants.flatMap(variant => variant.candidates.map(item => item.caseId)))
    const unknownCaseIds = [...requestedCaseIds].filter(caseId => !knownCaseIds.has(caseId))
    if (unknownCaseIds.length > 0) {
      return res.status(400).json({ message: 'One or more evaluation case identifiers are unknown.', unknownCaseIds })
    }

    const selectedCases = TURNAROUND_BRIEFING_EVALUATION_CASES.filter(item => requestedCaseIds.has(item.id))
    const incompleteVariants = req.body.variants
      .filter(variant => {
        const variantCaseIds = new Set(variant.candidates.map(item => item.caseId))
        return variantCaseIds.size !== requestedCaseIds.size || [...requestedCaseIds].some(caseId => !variantCaseIds.has(caseId))
      })
      .map(variant => variant.variantId)
    if (incompleteVariants.length > 0) {
      return res.status(400).json({
        message: 'Every evaluation matrix variant must provide the same evaluation cases.',
        incompleteVariants
      })
    }

    const variants = req.body.variants.map(variant => {
      const candidates = new Map(variant.candidates.map(item => [item.caseId, item.briefing]))
      return {
        variantId: variant.variantId,
        provider: variant.provider,
        model: variant.model,
        promptVersion: variant.promptVersion,
        generateCandidate: (_input, evaluationCase) => candidates.get(evaluationCase.id)
      }
    })

    const matrix = runEvaluationMatrix({
      suiteId: req.body.suiteId,
      cases: selectedCases,
      variants,
      baselineVariantId: req.body.baselineVariantId,
      policy: req.body.policy
    })

    await Promise.all(matrix.variants.map(variant => recordEvaluationRun({ run: variant.run, actor })))
    return res.status(201).json(matrix)
  } catch (error) {
    return next(error)
  }
}


exports.getTurnaroundBriefingEvaluationQualitySummary = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canManageAiEvaluations(actor)) return res.status(403).json({ message: 'AI evaluation quality summaries require an administrator.' })
    return res.status(200).json(await buildAiEvaluationQualitySummary({ suiteId: req.query.suiteId, limit: req.query.limit }))
  } catch (error) {
    return next(error)
  }
}

exports.listTurnaroundBriefingEvaluationRuns = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canManageAiEvaluations(actor)) return res.status(403).json({ message: 'AI evaluation history requires an administrator.' })
    return res.status(200).json(await listEvaluationRuns({ suiteId: req.query.suiteId, limit: req.query.limit }))
  } catch (error) {
    return next(error)
  }
}

exports.compareTurnaroundBriefingEvaluationRun = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canManageAiEvaluations(actor)) return res.status(403).json({ message: 'AI evaluation comparison requires an administrator.' })
    const currentRun = await getEvaluationRun(req.params.runId, { suiteId: req.query.suiteId })
    const baselineRun = await getEvaluationRun(req.query.baselineRunId, { suiteId: req.query.suiteId })
    if (!currentRun || !baselineRun) return res.status(404).json({ message: 'The requested evaluation run was not found.' })
    return res.status(200).json(compareEvaluationRuns({ currentRun, baselineRun }))
  } catch (error) {
    return next(error)
  }
}

module.exports.AI_ALLOWED_ROLES = AI_ALLOWED_ROLES
module.exports.providerHttpStatus = providerHttpStatus
module.exports.canGenerateAiBriefing = canGenerateAiBriefing

module.exports.canManageAiEvaluations = canManageAiEvaluations
