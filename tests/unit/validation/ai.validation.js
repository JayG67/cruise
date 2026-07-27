const { evaluationComparisonQuerySchema, evaluationRunsQuerySchema, runEvaluationRequestSchema } = require('../ai/contracts/aiEvaluation.contract')
const {
  operationalTurnaroundBriefingRequestSchema,
  turnaroundBriefingHistoryQuerySchema,
  turnaroundBriefingRequestSchema,
  turnaroundBriefingReviewRequestSchema
} = require('../ai/contracts/turnaroundBriefing.contract')

module.exports = {
  evaluationComparisonQuerySchema,
  evaluationRunsQuerySchema,
  runEvaluationRequestSchema,
  operationalTurnaroundBriefingRequestSchema,
  turnaroundBriefingHistoryQuerySchema,
  turnaroundBriefingRequestSchema,
  turnaroundBriefingReviewRequestSchema
}
