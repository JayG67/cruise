const express = require('express')
const aiController = require('../controllers/ai.controller')
const validate = require('../middleware/validate.middleware')
const {
  requireGlobalAdminAccess,
  requireTurnaroundOperationReadAccess
} = require('../middleware/authorization.middleware')
const {
  evaluationComparisonQuerySchema,
  evaluationRunsQuerySchema,
  qualityConsoleReleasePolicyRequestSchema,
  runEvaluationMatrixRequestSchema,
  runEvaluationRequestSchema,
  operationalTurnaroundBriefingRequestSchema,
  turnaroundBriefingHistoryQuerySchema,
  turnaroundBriefingRequestSchema,
  turnaroundBriefingReviewRequestSchema
} = require('../validation/ai.validation')

const router = express.Router()

router.get('/program-status', requireGlobalAdminAccess, aiController.getAiProgramStatus)
router.get('/ci-evidence/summary', requireGlobalAdminAccess, aiController.getAiCiEvidenceSummary)
router.get('/adversarial/quality-summary', requireGlobalAdminAccess, aiController.getAdversarialQualitySummary)
router.get('/evaluations/turnaround-briefing/quality-summary', requireGlobalAdminAccess, validate(evaluationRunsQuerySchema, 'query'), aiController.getTurnaroundBriefingEvaluationQualitySummary)
router.post('/evaluations/turnaround-briefing/release-policy/preview', requireGlobalAdminAccess, validate(qualityConsoleReleasePolicyRequestSchema), aiController.previewTurnaroundBriefingReleasePolicy)
router.get('/evaluations/turnaround-briefing/runs', requireGlobalAdminAccess, validate(evaluationRunsQuerySchema, 'query'), aiController.listTurnaroundBriefingEvaluationRuns)
router.get('/evaluations/turnaround-briefing/runs/:runId/compare', requireGlobalAdminAccess, validate(evaluationComparisonQuerySchema, 'query'), aiController.compareTurnaroundBriefingEvaluationRun)
router.post('/evaluations/turnaround-briefing/matrix', requireGlobalAdminAccess, validate(runEvaluationMatrixRequestSchema), aiController.runTurnaroundBriefingEvaluationMatrix)
router.post('/evaluations/turnaround-briefing/runs', requireGlobalAdminAccess, validate(runEvaluationRequestSchema), aiController.runTurnaroundBriefingEvaluation)
router.get('/turnaround-operations/:operationId/briefings', requireTurnaroundOperationReadAccess('operationId'), validate(turnaroundBriefingHistoryQuerySchema, 'query'), aiController.listOperationalTurnaroundBriefingHistory)
router.post('/turnaround-operations/:operationId/briefings/:briefingId/review', requireTurnaroundOperationReadAccess('operationId'), validate(turnaroundBriefingReviewRequestSchema), aiController.reviewOperationalTurnaroundBriefing)
router.post('/turnaround-operations/:operationId/briefing', requireTurnaroundOperationReadAccess('operationId'), validate(operationalTurnaroundBriefingRequestSchema), aiController.generateOperationalTurnaroundBriefing)
router.post('/turnaround-briefing', requireGlobalAdminAccess, validate(turnaroundBriefingRequestSchema), aiController.generateTurnaroundBriefing)

module.exports = router
