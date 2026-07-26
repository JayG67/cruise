function sanitizeAiTelemetryEvent(event = {}) {
  return {
    eventType: event.eventType || 'AI_PROVIDER_EXECUTION',
    timestamp: event.timestamp || new Date().toISOString(),
    requestId: event.requestId || null,
    operationId: event.operationId || null,
    actorUserId: event.actorUserId || null,
    actorRole: event.actorRole || null,
    provider: event.provider || null,
    model: event.model || null,
    promptVersion: event.promptVersion || null,
    outcome: event.outcome || 'SUCCESS',
    durationMs: Number.isFinite(event.durationMs) ? event.durationMs : null,
    attemptCount: Number.isFinite(event.attemptCount) ? event.attemptCount : null,
    providerRequestId: event.providerRequestId || null,
    providerResponseId: event.providerResponseId || null,
    inputTokens: Number.isFinite(event.inputTokens) ? event.inputTokens : null,
    outputTokens: Number.isFinite(event.outputTokens) ? event.outputTokens : null,
    totalTokens: Number.isFinite(event.totalTokens) ? event.totalTokens : null,
    estimatedCostUsd: Number.isFinite(event.estimatedCostUsd) ? event.estimatedCostUsd : null
  }
}

function recordAiTelemetry(event, { logger = console } = {}) {
  const sanitized = sanitizeAiTelemetryEvent(event)
  logger.info(JSON.stringify({ channel: 'ai-telemetry', ...sanitized }))
  return sanitized
}

module.exports = { recordAiTelemetry, sanitizeAiTelemetryEvent }
