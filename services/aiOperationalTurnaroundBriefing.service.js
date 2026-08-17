const { loadTurnaroundEvidence } = require('./aiTurnaroundEvidence.service')
const { generateTurnaroundBriefing } = require('./aiTurnaroundBriefing.service')

async function generateOperationalTurnaroundBriefing({
  operationId,
  question,
  requestedAt,
  actor,
  evidenceLoader = loadTurnaroundEvidence,
  briefingGenerator = generateTurnaroundBriefing,
  ...generationOptions
} = {}) {
  const evidenceBundle = await evidenceLoader(operationId)
  if (!evidenceBundle?.operation?.id) {
    const error = new Error('Operational turnaround briefing requires an existing operation.')
    error.code = 'TURNAROUND_OPERATION_NOT_FOUND'
    throw error
  }

  const result = await briefingGenerator({
    ...generationOptions,
    actor,
    input: {
      operationId,
      question: question || 'Summarize current turnaround readiness and the most important next actions.',
      evidence: evidenceBundle.evidence,
      ...(requestedAt ? { requestedAt } : {})
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
