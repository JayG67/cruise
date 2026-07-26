const {
  turnaroundBriefingRequestSchema,
  turnaroundBriefingResponseSchema
} = require('../ai/contracts/turnaroundBriefing.contract')
const {
  TURNAROUND_BRIEFING_PROMPT_VERSION,
  buildTurnaroundBriefingPrompt
} = require('../ai/prompts/turnaroundBriefing.prompt')
const { createAiProvider } = require('./aiProvider.service')

class AiBriefingValidationError extends Error {
  constructor(message, code, issues = []) {
    super(message)
    this.name = 'AiBriefingValidationError'
    this.code = code
    this.issues = issues
  }
}

function assertEvidenceGrounding(response, evidence) {
  const allowedEvidenceIds = new Set(evidence.map(record => record.id))
  const invalidEvidenceIds = response.findings
    .flatMap(finding => finding.evidenceIds)
    .filter(evidenceId => !allowedEvidenceIds.has(evidenceId))

  if (invalidEvidenceIds.length) {
    throw new AiBriefingValidationError(
      'AI response referenced evidence that was not supplied.',
      'AI_UNGROUNDED_EVIDENCE',
      [...new Set(invalidEvidenceIds)]
    )
  }
}

function buildAiAuditRecord({ actor, input, response, provider, usage, durationMs, requestId }) {
  return {
    eventType: 'AI_TURNAROUND_BRIEFING_GENERATED',
    requestId: requestId || null,
    operationId: input.operationId,
    actorUserId: actor?.actorUserId || null,
    actorRole: actor?.actorRole || null,
    provider: provider.name,
    model: response.model,
    promptVersion: response.promptVersion,
    evidenceCount: input.evidence.length,
    findingCount: response.findings.length,
    riskLevel: response.riskLevel,
    durationMs,
    usage: usage || null,
    generatedAt: response.generatedAt
  }
}

async function generateTurnaroundBriefing({ input, actor, provider = createAiProvider(), now = () => new Date(), requestId } = {}) {
  const parsedInput = turnaroundBriefingRequestSchema.safeParse(input)
  if (!parsedInput.success) {
    throw new AiBriefingValidationError('AI briefing request is invalid.', 'AI_REQUEST_INVALID', parsedInput.error.issues)
  }

  const prompt = buildTurnaroundBriefingPrompt(parsedInput.data)
  const startedAt = Date.now()
  const providerResult = await provider.generateStructured({
    prompt,
    responseSchema: turnaroundBriefingResponseSchema,
    metadata: {
      operationId: parsedInput.data.operationId,
      actorUserId: actor?.actorUserId || null,
      actorRole: actor?.actorRole || null,
      requestId: requestId || null
    }
  })

  const candidate = {
    ...providerResult.output,
    generatedAt: providerResult.output?.generatedAt || now().toISOString(),
    model: providerResult.output?.model || provider.model,
    promptVersion: providerResult.output?.promptVersion || TURNAROUND_BRIEFING_PROMPT_VERSION
  }

  const parsedResponse = turnaroundBriefingResponseSchema.safeParse(candidate)
  if (!parsedResponse.success) {
    throw new AiBriefingValidationError('AI briefing response failed schema validation.', 'AI_RESPONSE_INVALID', parsedResponse.error.issues)
  }

  assertEvidenceGrounding(parsedResponse.data, parsedInput.data.evidence)

  return {
    briefing: parsedResponse.data,
    audit: buildAiAuditRecord({
      actor,
      input: parsedInput.data,
      response: parsedResponse.data,
      provider,
      usage: providerResult.usage,
      durationMs: Math.max(0, Date.now() - startedAt),
      requestId
    })
  }
}

module.exports = {
  AiBriefingValidationError,
  assertEvidenceGrounding,
  buildAiAuditRecord,
  generateTurnaroundBriefing
}
