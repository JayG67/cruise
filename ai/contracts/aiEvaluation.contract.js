const { z } = require('zod')
const { turnaroundBriefingResponseSchema } = require('./turnaroundBriefing.contract')

const evaluationCandidateSchema = z.object({
  caseId: z.string().trim().min(1).max(160),
  briefing: turnaroundBriefingResponseSchema
}).strict()


function hasUniqueCaseIds(candidates) {
  const caseIds = candidates.map(candidate => candidate.caseId)
  return new Set(caseIds).size === caseIds.length
}

function hasUniqueVariantIds(variants) {
  const variantIds = variants.map(variant => variant.variantId)
  return new Set(variantIds).size === variantIds.length
}

const regressionPolicySchema = z.object({
  minimumPassRate: z.coerce.number().min(0).max(100).optional(),
  minimumAverageScore: z.coerce.number().min(0).max(100).optional(),
  minimumPassRateDelta: z.coerce.number().min(-100).max(100).optional(),
  minimumAverageScoreDelta: z.coerce.number().min(-100).max(100).optional(),
  allowNewFailedCases: z.boolean().optional()
}).strict().optional()

const runEvaluationRequestSchema = z.object({
  suiteId: z.string().trim().min(1).max(160).default('turnaround-briefing-phase3'),
  candidates: z.array(evaluationCandidateSchema).min(1).max(100)
}).strict().refine(value => hasUniqueCaseIds(value.candidates), {
  message: 'Evaluation candidate case identifiers must be unique.',
  path: ['candidates']
})

const evaluationMatrixVariantSchema = z.object({
  variantId: z.string().trim().min(1).max(160),
  provider: z.string().trim().min(1).max(160),
  model: z.string().trim().min(1).max(160),
  promptVersion: z.string().trim().min(1).max(160),
  candidates: z.array(evaluationCandidateSchema).min(1).max(100)
}).strict()

const runEvaluationMatrixRequestSchema = z.object({
  suiteId: z.string().trim().min(1).max(160).default('turnaround-briefing-phase3'),
  baselineVariantId: z.string().trim().min(1).max(160).optional(),
  policy: regressionPolicySchema,
  variants: z.array(evaluationMatrixVariantSchema).min(2).max(12)
}).strict()
  .refine(value => hasUniqueVariantIds(value.variants), {
    message: 'Evaluation matrix variant identifiers must be unique.',
    path: ['variants']
  })
  .refine(value => value.variants.every(variant => hasUniqueCaseIds(variant.candidates)), {
    message: 'Evaluation matrix candidate case identifiers must be unique within each variant.',
    path: ['variants']
  })


const qualityConsoleReleasePolicyRequestSchema = z.object({
  suiteId: z.string().trim().min(1).max(160).default('turnaround-briefing-phase3'),
  currentRunId: z.string().trim().min(1).max(160),
  baselineRunId: z.string().trim().min(1).max(160),
  policy: regressionPolicySchema.unwrap()
}).strict().refine(value => value.currentRunId !== value.baselineRunId, {
  message: 'Current and baseline evaluation runs must be different.',
  path: ['baselineRunId']
})

const evaluationRunsQuerySchema = z.object({
  suiteId: z.string().trim().min(1).max(160).default('turnaround-briefing-phase3'),
  limit: z.coerce.number().int().min(1).max(100).default(20)
}).strict()

const evaluationComparisonQuerySchema = z.object({
  suiteId: z.string().trim().min(1).max(160).default('turnaround-briefing-phase3'),
  baselineRunId: z.string().trim().min(1).max(160)
}).strict()

module.exports = {
  evaluationComparisonQuerySchema,
  evaluationRunsQuerySchema,
  qualityConsoleReleasePolicyRequestSchema,
  regressionPolicySchema,
  runEvaluationMatrixRequestSchema,
  runEvaluationRequestSchema
}
