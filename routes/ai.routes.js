const express = require('express')
const aiController = require('../controllers/ai.controller')
const validate = require('../middleware/validate.middleware')
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

router.get('/program-status', aiController.getAiProgramStatus)
router.get('/adversarial/quality-summary', aiController.getAdversarialQualitySummary)
router.get('/evaluations/turnaround-briefing/quality-summary', validate(evaluationRunsQuerySchema, 'query'), aiController.getTurnaroundBriefingEvaluationQualitySummary)
router.post('/evaluations/turnaround-briefing/release-policy/preview', validate(qualityConsoleReleasePolicyRequestSchema), aiController.previewTurnaroundBriefingReleasePolicy)
router.get('/evaluations/turnaround-briefing/runs', validate(evaluationRunsQuerySchema, 'query'), aiController.listTurnaroundBriefingEvaluationRuns)
router.get('/evaluations/turnaround-briefing/runs/:runId/compare', validate(evaluationComparisonQuerySchema, 'query'), aiController.compareTurnaroundBriefingEvaluationRun)
router.post('/evaluations/turnaround-briefing/matrix', validate(runEvaluationMatrixRequestSchema), aiController.runTurnaroundBriefingEvaluationMatrix)
router.post('/evaluations/turnaround-briefing/runs', validate(runEvaluationRequestSchema), aiController.runTurnaroundBriefingEvaluation)
router.get('/turnaround-operations/:operationId/briefings', validate(turnaroundBriefingHistoryQuerySchema, 'query'), aiController.listOperationalTurnaroundBriefingHistory)
router.post('/turnaround-operations/:operationId/briefings/:briefingId/review', validate(turnaroundBriefingReviewRequestSchema), aiController.reviewOperationalTurnaroundBriefing)
router.post('/turnaround-operations/:operationId/briefing', validate(operationalTurnaroundBriefingRequestSchema), aiController.generateOperationalTurnaroundBriefing)
router.post('/turnaround-briefing', validate(turnaroundBriefingRequestSchema), aiController.generateTurnaroundBriefing)

module.exports = router
