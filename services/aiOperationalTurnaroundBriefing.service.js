const { loadTurnaroundEvidence } = require('./aiTurnaroundEvidence.service')
const { generateTurnaroundBriefing } = require('./aiTurnaroundBriefing.service')

async function generateOperationalTurnaroundBriefing(options = {}) {
  const {
    operationId,
    question,
    requestedAt,
    actor,
    evidenceLoader = loadTurnaroundEvidence,
    briefingGenerator = generateTurnaroundBriefing,
    ...generationOptions
  } = options || {}
  const normalizedOperationId = String(operationId || '').trim()
  if (!normalizedOperationId) {
    const error = new Error('Operational turnaround briefing requires an operation identifier.')
    error.code = 'TURNAROUND_OPERATION_ID_REQUIRED'
    throw error
  }

  const normalizedQuestion = typeof question === 'string' && question.trim()
    ? question.trim()
    : 'Summarize current turnaround readiness and the most important next actions.'
  const normalizedRequestedAt = typeof requestedAt === 'string' ? requestedAt.trim() : ''
  const evidenceBundle = await evidenceLoader(normalizedOperationId)
  if (!evidenceBundle?.operation?.id) {
    const error = new Error('Operational turnaround briefing requires an existing operation.')
    error.code = 'TURNAROUND_OPERATION_NOT_FOUND'
    throw error
  }

  const result = await briefingGenerator({
    ...generationOptions,
    actor,
    input: {
      operationId: normalizedOperationId,
      question: normalizedQuestion,
      evidence: Array.isArray(evidenceBundle.evidence) ? evidenceBundle.evidence : [],
      ...(normalizedRequestedAt ? { requestedAt: normalizedRequestedAt } : {})
    }
  })

  return {
    ...result,
    evidenceSummary: evidenceBundle.evidenceSummary,
    operation: {
      id: evidenceBundle.operation.id,
      title: evidenceBundle.operation.title,
      status: evidenceBundle.operation.status,
      readinessLevel: evidenceBundle.operation.readinessLevel,
      turnaroundDate: evidenceBundle.operation.turnaroundDate,
      port: evidenceBundle.operation.port
    }
  }
}

module.exports = { generateOperationalTurnaroundBriefing }
