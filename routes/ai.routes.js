const express = require('express')
const aiController = require('../controllers/ai.controller')
const validate = require('../middleware/validate.middleware')
const {
  operationalTurnaroundBriefingRequestSchema,
  turnaroundBriefingHistoryQuerySchema,
  turnaroundBriefingRequestSchema,
  turnaroundBriefingReviewRequestSchema
} = require('../validation/ai.validation')

const router = express.Router()

router.get('/program-status', aiController.getAiProgramStatus)
router.get('/turnaround-operations/:operationId/briefings', validate(turnaroundBriefingHistoryQuerySchema, 'query'), aiController.listOperationalTurnaroundBriefingHistory)
router.post('/turnaround-operations/:operationId/briefings/:briefingId/review', validate(turnaroundBriefingReviewRequestSchema), aiController.reviewOperationalTurnaroundBriefing)
router.post('/turnaround-operations/:operationId/briefing', validate(operationalTurnaroundBriefingRequestSchema), aiController.generateOperationalTurnaroundBriefing)
router.post('/turnaround-briefing', validate(turnaroundBriefingRequestSchema), aiController.generateTurnaroundBriefing)

module.exports = router
