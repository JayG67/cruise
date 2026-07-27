const { z } = require('zod')

const riskLevelSchema = z.enum(['low', 'medium', 'high', 'critical'])
const findingCategorySchema = z.enum([
  'task',
  'dependency',
  'handoff',
  'staffing',
  'signoff',
  'escalation',
  'data-quality'
])

const aiEvidenceRecordSchema = z.object({
  id: z.string().trim().min(1).max(160),
  type: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(240),
  status: z.string().trim().max(80).default('UNKNOWN'),
  owner: z.string().trim().max(160).nullable().optional(),
  details: z.string().trim().max(1200).nullable().optional(),
  departmentRole: z.string().trim().max(100).nullable().optional()
}).strict()

const operationalTurnaroundBriefingRequestSchema = z.object({
  question: z.string().trim().min(3).max(1000).default('Summarize current turnaround readiness and the most important next actions.'),
  requestedAt: z.string().datetime().optional()
}).strict()

const turnaroundBriefingRequestSchema = z.object({
  operationId: z.string().trim().min(1).max(160),
  question: z.string().trim().min(3).max(1000).default('Summarize current turnaround readiness and the most important next actions.'),
  evidence: z.array(aiEvidenceRecordSchema).max(250),
  requestedAt: z.string().datetime().optional()
}).strict()

const aiFindingSchema = z.object({
  category: findingCategorySchema,
  severity: riskLevelSchema,
  title: z.string().trim().min(1).max(240),
  explanation: z.string().trim().min(1).max(1200),
  evidenceIds: z.array(z.string().trim().min(1).max(160)).min(1).max(20),
  recommendedAction: z.string().trim().min(1).max(600)
}).strict()


const turnaroundBriefingHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20)
}).strict()

const turnaroundBriefingReviewRequestSchema = z.object({
  disposition: z.enum(['ACCEPTED', 'NEEDS_REVISION', 'REJECTED']),
  notes: z.string().trim().max(2000).optional()
}).strict()

const turnaroundBriefingResponseSchema = z.object({
  summary: z.string().trim().min(1).max(1800),
  riskLevel: riskLevelSchema,
  findings: z.array(aiFindingSchema).max(30),
  unknowns: z.array(z.string().trim().min(1).max(500)).max(20),
  generatedAt: z.string().datetime(),
  model: z.string().trim().min(1).max(160),
  promptVersion: z.string().trim().min(1).max(80)
}).strict()

module.exports = {
  aiEvidenceRecordSchema,
  aiFindingSchema,
  findingCategorySchema,
  riskLevelSchema,
  operationalTurnaroundBriefingRequestSchema,
  turnaroundBriefingHistoryQuerySchema,
  turnaroundBriefingReviewRequestSchema,
  turnaroundBriefingRequestSchema,
  turnaroundBriefingResponseSchema
}
