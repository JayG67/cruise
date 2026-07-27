const {
  operationalTurnaroundBriefingRequestSchema,
  turnaroundBriefingHistoryQuerySchema,
  turnaroundBriefingRequestSchema,
  turnaroundBriefingReviewRequestSchema
} = require('../ai/contracts/turnaroundBriefing.contract')
const {
  evaluationComparisonQuerySchema,
  evaluationRunsQuerySchema,
  runEvaluationMatrixRequestSchema,
  runEvaluationRequestSchema
} = require('../ai/contracts/aiEvaluation.contract')

module.exports = {
  evaluationComparisonQuerySchema,
  evaluationRunsQuerySchema,
  operationalTurnaroundBriefingRequestSchema,
  runEvaluationMatrixRequestSchema,
  runEvaluationRequestSchema,
  turnaroundBriefingHistoryQuerySchema,
  turnaroundBriefingRequestSchema,
  turnaroundBriefingReviewRequestSchema
}
