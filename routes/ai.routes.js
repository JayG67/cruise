const express = require('express')
const aiController = require('../controllers/ai.controller')
const validate = require('../middleware/validate.middleware')
const { turnaroundBriefingRequestSchema } = require('../validation/ai.validation')

const router = express.Router()

router.get('/program-status', aiController.getAiProgramStatus)
router.post('/turnaround-briefing', validate(turnaroundBriefingRequestSchema), aiController.generateTurnaroundBriefing)

module.exports = router
