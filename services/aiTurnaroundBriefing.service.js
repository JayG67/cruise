const { randomUUID } = require('crypto')
const {
  turnaroundBriefingRequestSchema,
  turnaroundBriefingResponseSchema
} = require('../ai/contracts/turnaroundBriefing.contract')
const {
  TURNAROUND_BRIEFING_PROMPT_VERSION,
  buildTurnaroundBriefingPrompt
} = require('../ai/prompts/turnaroundBriefing.prompt')
const { createAiProvider } = require('./aiProvider.service')
const { executeAiProviderCall } = require('./aiProviderExecution.service')
const { getAiRuntimeConfig } = require('./aiRuntimeConfig.service')

class AiBriefingValidationError extends Error {
  constructor(message, code, issues = []) {
    super(message)
    this.name = 'AiBriefingValidationError'
    this.code = code
    this.issues = issues
  }
}

function assertContextWithinLimit(prompt, maxContextChars) {
  const contextChars = JSON.stringify(prompt).length
  if (contextChars > maxContextChars) {
    throw new AiBriefingValidationError(
      `AI briefing context exceeds the ${maxContextChars} character limit.`,
      'AI_CONTEXT_LIMIT_EXCEEDED',
      [{ contextChars, maxContextChars }]
    )
  }
  return contextChars
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

function buildAiAuditRecord({ actor, input, response, provider, usage, durationMs, requestId, execution, providerMetadata }) {
  const briefingId = requestId || randomUUID()
  return {
    briefingId,
    eventType: 'AI_TURNAROUND_BRIEFING_GENERATED',
    requestId: requestId || briefingId,
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
    execution: execution || null,
    providerMetadata: providerMetadata || null,
    generatedAt: response.generatedAt,
    question: input.question,
    briefing: response
  }
}

async function generateTurnaroundBriefing({
  input,
  actor,
  provider = createAiProvider(),
  now = () => new Date(),
  requestId,
  runtimeConfig = getAiRuntimeConfig(),
  auditRecorder = null,
  telemetryRecorder = null
} = {}) {
  const parsedInput = turnaroundBriefingRequestSchema.safeParse(input)
  if (!parsedInput.success) {
    throw new AiBriefingValidationError('AI briefing request is invalid.', 'AI_REQUEST_INVALID', parsedInput.error.issues)
  }

  const prompt = buildTurnaroundBriefingPrompt(parsedInput.data)
  const contextChars = assertContextWithinLimit(prompt, runtimeConfig.maxContextChars)
  const startedAt = Date.now()
  const providerResult = await executeAiProviderCall({
    provider,
    request: {
      prompt,
      responseSchema: turnaroundBriefingResponseSchema,
      metadata: {
        operationId: parsedInput.data.operationId,
        actorUserId: actor?.actorUserId || null,
        actorRole: actor?.actorRole || null,
        requestId: requestId || null
      }
    },
    timeoutMs: runtimeConfig.timeoutMs,
    maxAttempts: runtimeConfig.maxAttempts,
    retryDelayMs: runtimeConfig.retryDelayMs
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

  const audit = buildAiAuditRecord({
    actor,
    input: parsedInput.data,
    response: parsedResponse.data,
    provider,
    usage: {
      ...(providerResult.usage || {}),
      contextChars
    },
    execution: providerResult.execution,
    providerMetadata: providerResult.providerMetadata,
    durationMs: Math.max(0, Date.now() - startedAt),
    requestId
  })

  if (auditRecorder) {
    await auditRecorder({
      eventType: audit.eventType,
      entityType: 'TURNAROUND_OPERATION',
      entityId: parsedInput.data.operationId,
      actorUserId: actor?.actorUserId || null,
      actorDisplayName: actor?.actorDisplayName || null,
      operationId: parsedInput.data.operationId,
      source: 'AI',
      eventPayload: audit
    })
  }

  if (telemetryRecorder) {
    telemetryRecorder({
      eventType: audit.eventType,
      requestId: audit.requestId,
      operationId: audit.operationId,
      actorUserId: audit.actorUserId,
      actorRole: audit.actorRole,
      provider: audit.provider,
      model: audit.model,
      promptVersion: audit.promptVersion,
      outcome: 'SUCCESS',
      durationMs: audit.durationMs,
      attemptCount: audit.execution?.attemptCount,
      providerRequestId: audit.providerMetadata?.requestId,
      providerResponseId: audit.providerMetadata?.responseId,
      inputTokens: audit.usage?.inputTokens,
      outputTokens: audit.usage?.outputTokens,
      totalTokens: audit.usage?.totalTokens,
      estimatedCostUsd: audit.usage?.estimatedCostUsd
    })
  }

  return { briefing: parsedResponse.data, audit }
}

module.exports = {
  AiBriefingValidationError,
  assertContextWithinLimit,
  assertEvidenceGrounding,
  buildAiAuditRecord,
  generateTurnaroundBriefing
}
