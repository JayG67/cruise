const {
  operationalTurnaroundBriefingRequestSchema,
  turnaroundBriefingHistoryQuerySchema,
  turnaroundBriefingRequestSchema,
  turnaroundBriefingReviewRequestSchema
} = require('../ai/contracts/turnaroundBriefing.contract')
const {
  evaluationComparisonQuerySchema,
  evaluationRunsQuerySchema,
  qualityConsoleReleasePolicyRequestSchema,
  runEvaluationMatrixRequestSchema,
  runEvaluationRequestSchema
} = require('../ai/contracts/aiEvaluation.contract')

module.exports = {
  evaluationComparisonQuerySchema,
  evaluationRunsQuerySchema,
  operationalTurnaroundBriefingRequestSchema,
  qualityConsoleReleasePolicyRequestSchema,
  runEvaluationMatrixRequestSchema,
  runEvaluationRequestSchema,
  turnaroundBriefingHistoryQuerySchema,
  turnaroundBriefingRequestSchema,
  turnaroundBriefingReviewRequestSchema
}
