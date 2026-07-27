jest.mock('../../services/requestAuthorization.service', () => ({
  normalizeActorRole: role => String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_'),
  resolveRequestActor: jest.fn()
}))

jest.mock('../../services/aiProvider.service', () => {
  class AiProviderError extends Error {
    constructor(message, code) {
      super(message)
      this.code = code
    }
  }
  return {
    AiProviderError,
    createAiProvider: jest.fn()
  }
})

jest.mock('../../services/auditEvent.service', () => ({ recordAuditEvent: jest.fn() }))
jest.mock('../../services/aiTelemetry.service', () => ({ recordAiTelemetry: jest.fn() }))
jest.mock('../../services/aiFoundationReadiness.service', () => ({
  assessAiFoundationReadiness: jest.fn(() => ({
    phase: 1,
    foundationReady: true,
    deploymentSafe: true,
    generationReady: true,
    issues: []
  }))
}))

jest.mock('../../services/aiCostEstimation.service', () => ({
  getAiPricingConfig: jest.fn(() => ({ inputUsdPerMillionTokens: 0, outputUsdPerMillionTokens: 0 })),
  describeAiPricingConfig: jest.fn(() => ({ inputUsdPerMillionTokens: 0, outputUsdPerMillionTokens: 0, estimationEnabled: false }))
}))

jest.mock('../../services/aiRuntimeConfig.service', () => ({
  getAiRuntimeConfig: jest.fn(() => ({ providerName: 'deterministic', timeoutMs: 1000, maxAttempts: 2, retryDelayMs: 0, maxContextChars: 120000 })),
  describeAiRuntimeConfig: jest.fn(config => ({ ...config }))
}))

jest.mock('../../services/turnaroundScope.service', () => ({
  canAccessTurnaroundOperationForRequest: jest.fn().mockResolvedValue(true),
  sendTurnaroundOperationForbidden: jest.fn(res => res.status(403).json({ message: 'forbidden' }))
}))

jest.mock('../../services/aiTurnaroundEvidence.service', () => {
  class AiTurnaroundEvidenceError extends Error {
    constructor(message, code) { super(message); this.code = code }
  }
  return { AiTurnaroundEvidenceError, loadTurnaroundEvidence: jest.fn() }
})

jest.mock('../../services/aiOperationalTurnaroundBriefing.service', () => ({
  generateOperationalTurnaroundBriefing: jest.fn()
}))

jest.mock('../../services/aiTurnaroundBriefing.service', () => {
  class AiBriefingValidationError extends Error {
    constructor(message, code, issues = []) {
      super(message)
      this.code = code
      this.issues = issues
    }
  }
  return {
    AiBriefingValidationError,
    generateTurnaroundBriefing: jest.fn()
  }
})

const { resolveRequestActor } = require('../../services/requestAuthorization.service')
const { AiProviderError, createAiProvider } = require('../../services/aiProvider.service')
const { generateTurnaroundBriefing } = require('../../services/aiTurnaroundBriefing.service')
const { loadTurnaroundEvidence } = require('../../services/aiTurnaroundEvidence.service')
const { generateOperationalTurnaroundBriefing } = require('../../services/aiOperationalTurnaroundBriefing.service')
const controller = require('../../controllers/ai.controller')

function responseHarness() {
  const json = jest.fn()
  const status = jest.fn(() => ({ json }))
  return { res: { status }, status, json }
}

describe('AI controller authorization and failure boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createAiProvider.mockReturnValue({ name: 'deterministic', model: 'test-model', credentialConfigured: true })
  })

  it('allows only administrator and operational roles to generate briefings', () => {
    expect(controller.canGenerateAiBriefing({ actorRole: 'admin' })).toBe(true)
    expect(controller.canGenerateAiBriefing({ actorRole: 'turnaround-manager' })).toBe(true)
    expect(controller.canGenerateAiBriefing({ actorRole: 'PASSENGER' })).toBe(false)
    expect(controller.canGenerateAiBriefing({ actorRole: 'GROUP_LEADER' })).toBe(false)
    expect(controller.canGenerateAiBriefing({})).toBe(false)
  })

  it('returns the six-phase program status and runtime configuration', () => {
    const { res, status, json } = responseHarness()
    controller.getAiProgramStatus({}, res)
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      currentPhase: 2,
      phases: expect.arrayContaining([expect.objectContaining({ phase: 6 })]),
      runtime: expect.objectContaining({
        provider: 'deterministic',
        model: 'test-model',
        generationEnabled: true,
        credentialConfigured: true,
        executionPolicy: expect.objectContaining({ timeoutMs: 1000, maxAttempts: 2 }),
        pricing: expect.objectContaining({ estimationEnabled: false }),
        foundationReadiness: expect.objectContaining({ deploymentSafe: true, generationReady: true })
      })
    }))
  })

  it('denies passenger requests before calling the provider orchestration', async () => {
    resolveRequestActor.mockResolvedValue({ actorUserId: 'passenger-1', actorRole: 'PASSENGER' })
    const { res, status, json } = responseHarness()

    await controller.generateTurnaroundBriefing({ body: {}, get: jest.fn() }, res, jest.fn())

    expect(status).toHaveBeenCalledWith(403)
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('operational role') }))
    expect(generateTurnaroundBriefing).not.toHaveBeenCalled()
  })

  it('returns structured briefing and audit metadata for an authorized role', async () => {
    const actor = { actorUserId: 'manager-1', actorRole: 'TURNAROUND_MANAGER' }
    const result = { briefing: { riskLevel: 'high' }, audit: { requestId: 'request-1' } }
    resolveRequestActor.mockResolvedValue(actor)
    generateTurnaroundBriefing.mockResolvedValue(result)
    const { res, status, json } = responseHarness()
    const req = { body: { operationId: 'op-1' }, get: jest.fn().mockReturnValue('request-1') }

    await controller.generateTurnaroundBriefing(req, res, jest.fn())

    expect(generateTurnaroundBriefing).toHaveBeenCalledWith(expect.objectContaining({
      input: req.body,
      actor,
      requestId: 'request-1'
    }))
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith(result)
  })


  it('generates a Phase 2 briefing from server-loaded operation evidence', async () => {
    const actor = { actorUserId: 'manager-1', actorRole: 'TURNAROUND_MANAGER' }
    const evidenceBundle = { operation: { id: 'op-1', sailingId: 'sailing-1' }, evidence: [], evidenceSummary: {} }
    const result = { briefing: { riskLevel: 'high' }, evidenceSummary: { included: 4 } }
    resolveRequestActor.mockResolvedValue(actor)
    loadTurnaroundEvidence.mockResolvedValue(evidenceBundle)
    generateOperationalTurnaroundBriefing.mockResolvedValue(result)
    const { res, status, json } = responseHarness()
    const req = { params: { operationId: 'op-1' }, body: { question: 'What is at risk?' }, get: jest.fn().mockReturnValue('request-2') }

    await controller.generateOperationalTurnaroundBriefing(req, res, jest.fn())

    expect(loadTurnaroundEvidence).toHaveBeenCalledWith('op-1')
    expect(generateOperationalTurnaroundBriefing).toHaveBeenCalledWith(expect.objectContaining({
      operationId: 'op-1', question: 'What is at risk?', actor, requestId: 'request-2'
    }))
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith(result)
  })

  it('maps disabled-provider failures to a reviewable 503 response', async () => {
    resolveRequestActor.mockResolvedValue({ actorUserId: 'admin-1', actorRole: 'ADMIN' })
    generateTurnaroundBriefing.mockRejectedValue(new AiProviderError('Provider unavailable', 'AI_PROVIDER_NOT_CONFIGURED'))
    const { res, status, json } = responseHarness()

    await controller.generateTurnaroundBriefing({ body: {}, get: jest.fn() }, res, jest.fn())

    expect(status).toHaveBeenCalledWith(503)
    expect(json).toHaveBeenCalledWith({ message: 'Provider unavailable', code: 'AI_PROVIDER_NOT_CONFIGURED' })
  })


  it.each([
    ['AI_PROVIDER_TIMEOUT', 504],
    ['AI_PROVIDER_RATE_LIMITED', 429],
    ['AI_PROVIDER_TEMPORARILY_UNAVAILABLE', 503],
    ['AI_PROVIDER_CREDENTIALS_MISSING', 503],
    ['AI_PROVIDER_CREDENTIALS_INVALID', 502],
    ['AI_PROVIDER_BAD_RESPONSE', 502]
  ])('maps %s provider failures to HTTP %i', async (code, expectedStatus) => {
    resolveRequestActor.mockResolvedValue({ actorUserId: 'admin-1', actorRole: 'ADMIN' })
    generateTurnaroundBriefing.mockRejectedValue(new AiProviderError('Provider failure', code))
    const { res, status, json } = responseHarness()

    await controller.generateTurnaroundBriefing({ body: {}, get: jest.fn() }, res, jest.fn())

    expect(status).toHaveBeenCalledWith(expectedStatus)
    expect(json).toHaveBeenCalledWith({ message: 'Provider failure', code })
  })

  it('passes unexpected failures to Express error handling', async () => {
    resolveRequestActor.mockResolvedValue({ actorUserId: 'admin-1', actorRole: 'ADMIN' })
    const error = new Error('unexpected')
    generateTurnaroundBriefing.mockRejectedValue(error)
    const next = jest.fn()
    const { res } = responseHarness()

    await controller.generateTurnaroundBriefing({ body: {}, get: jest.fn() }, res, next)
    expect(next).toHaveBeenCalledWith(error)
  })
})
