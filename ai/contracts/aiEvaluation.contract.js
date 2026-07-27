const { z } = require('zod')
const { turnaroundBriefingResponseSchema } = require('./turnaroundBriefing.contract')

const evaluationCandidateSchema = z.object({
  caseId: z.string().trim().min(1).max(160),
  briefing: turnaroundBriefingResponseSchema
}).strict()

const runEvaluationRequestSchema = z.object({
  suiteId: z.string().trim().min(1).max(160).default('turnaround-briefing-phase3'),
  candidates: z.array(evaluationCandidateSchema).min(1).max(100)
}).strict()

const evaluationRunsQuerySchema = z.object({
  suiteId: z.string().trim().min(1).max(160).default('turnaround-briefing-phase3'),
  limit: z.coerce.number().int().min(1).max(100).default(20)
}).strict()

const evaluationComparisonQuerySchema = z.object({
  suiteId: z.string().trim().min(1).max(160).default('turnaround-briefing-phase3'),
  baselineRunId: z.string().trim().min(1).max(160)
}).strict()

module.exports = { evaluationComparisonQuerySchema, evaluationRunsQuerySchema, runEvaluationRequestSchema }
