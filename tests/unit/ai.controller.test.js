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


jest.mock('../../services/aiCiEvidenceConsole.service', () => ({
  buildAiCiEvidenceConsoleSummary: jest.fn(() => ({ status: 'ready', latestEvidence: null }))
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
const { buildAiCiEvidenceConsoleSummary } = require('../../services/aiCiEvidenceConsole.service')
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

  it('restricts CI evidence to administrators', async () => {
    resolveRequestActor.mockResolvedValue({ actorUserId: 'passenger-1', actorRole: 'PASSENGER' })
    const { res, status, json } = responseHarness()

    await controller.getAiCiEvidenceSummary({}, res, jest.fn())

    expect(status).toHaveBeenCalledWith(403)
    expect(json).toHaveBeenCalledWith({ message: 'AI CI evidence requires an administrator.' })
    expect(buildAiCiEvidenceConsoleSummary).not.toHaveBeenCalled()
  })

  it('returns CI evidence to an administrator', async () => {
    resolveRequestActor.mockResolvedValue({ actorUserId: 'admin-1', actorRole: 'ADMIN' })
    const { res, status, json } = responseHarness()

    await controller.getAiCiEvidenceSummary({}, res, jest.fn())

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ status: 'ready', latestEvidence: null })
  })

  it('returns the six-phase program status and runtime configuration', () => {
    const { res, status, json } = responseHarness()
    controller.getAiProgramStatus({}, res)
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      currentPhase: 6,
      currentPhasePercentComplete: 100,
      completedPhases: 6,
      phases: expect.arrayContaining([
        expect.objectContaining({ phase: 3, status: 'COMPLETE' }),
        expect.objectContaining({ phase: 4, status: 'COMPLETE' }),
        expect.objectContaining({ phase: 6 })
      ]),
      phaseThreeCapabilities: expect.objectContaining({
        reusableEvaluationCases: true,
        deterministicBriefingEvaluator: true,
        evaluationSuiteRunner: true,
        persistentRunStorage: true,
        baselineComparison: true,
        evaluationApi: true,
        expandedGoldenDataset: true,
        providerPromptMatrix: true,
        configurableReleasePolicy: true,
        architectureAudit: true,
        qualityConsoleIntegration: true,
        completionAudit: true,
        phaseThreeComplete: true
      }),
      phaseFourCapabilities: expect.objectContaining({
        releaseReadinessSummary: true,
        evaluationHistoryTable: true,
        trendAnalysis: true,
        providerModelPromptMetadata: true,
        failedCaseDrilldown: true,
        recurringFailureSummary: true,
        baselineSelection: true,
        runComparison: true,
        releasePolicyControls: true,
        historyFiltering: true,
        historySorting: true,
        phaseFourComplete: true
      }),
      phaseFiveCapabilities: expect.objectContaining({
        adversarialScenarioContract: true,
        reusableScenarioCatalog: true,
        deterministicScenarioExecution: true,
        resilienceScoring: true,
        diagnosticFindings: true,
        adversarialSuiteRunner: true,
        architectureAudit: true,
        qualityConsoleIntegration: true,
        browserWorkflowCoverage: true,
        completionAudit: true,
        phaseFiveComplete: true
      }),
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
    const req = { body: { operationId: 'op-1' }, requestId: 'request-1', get: jest.fn() }

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
    const req = { params: { operationId: 'op-1' }, body: { question: 'What is at risk?' }, requestId: 'request-2', get: jest.fn() }

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

describe('AI controller coverage boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createAiProvider.mockReturnValue({ name: 'deterministic', model: 'test-model', credentialConfigured: true })
  })

  it.each([
    ['AI_RUNTIME_CONFIG_INVALID', 500],
    ['AI_PROVIDER_UNSUPPORTED', 500],
    ['AI_PROVIDER_BAD_RESPONSE', 502]
  ])('maps %s through the provider status helper', (code, status) => {
    expect(controller.providerHttpStatus({ code })).toBe(status)
  })

  it('restricts evaluation management to administrators', () => {
    expect(controller.canManageAiEvaluations({ actorRole: 'admin' })).toBe(true)
    expect(controller.canManageAiEvaluations({ actorRole: 'turnaround_manager' })).toBe(false)
    expect(controller.canManageAiEvaluations()).toBe(false)
  })

  it.each([
    ['AI_CONTEXT_LIMIT_EXCEEDED', 413],
    ['AI_BRIEFING_INVALID', 502]
  ])('maps %s briefing validation failures', async (code, expectedStatus) => {
    const { AiBriefingValidationError } = require('../../services/aiTurnaroundBriefing.service')
    resolveRequestActor.mockResolvedValue({ actorUserId: 'admin-1', actorRole: 'ADMIN' })
    generateTurnaroundBriefing.mockRejectedValue(new AiBriefingValidationError('invalid briefing', code, ['issue']))
    const { res, status, json } = responseHarness()
    await controller.generateTurnaroundBriefing({ body: {}, get: jest.fn() }, res, jest.fn())
    expect(status).toHaveBeenCalledWith(expectedStatus)
    expect(json).toHaveBeenCalledWith({ message: 'invalid briefing', code, issues: ['issue'] })
  })

  it('denies operational generation for non-operational roles', async () => {
    resolveRequestActor.mockResolvedValue({ actorUserId: 'guest-1', actorRole: 'PASSENGER' })
    const { res, status } = responseHarness()
    await controller.generateOperationalTurnaroundBriefing({ params: { operationId: 'op-1' }, body: {}, get: jest.fn() }, res, jest.fn())
    expect(status).toHaveBeenCalledWith(403)
    expect(loadTurnaroundEvidence).not.toHaveBeenCalled()
  })

  it('blocks operational generation when the actor cannot access the operation', async () => {
    const scope = require('../../services/turnaroundScope.service')
    resolveRequestActor.mockResolvedValue({ actorUserId: 'manager-1', actorRole: 'TURNAROUND_MANAGER' })
    loadTurnaroundEvidence.mockResolvedValue({ operation: { id: 'op-1' } })
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValueOnce(false)
    const { res } = responseHarness()
    await controller.generateOperationalTurnaroundBriefing({ params: { operationId: 'op-1' }, body: {}, get: jest.fn() }, res, jest.fn())
    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(res)
    expect(generateOperationalTurnaroundBriefing).not.toHaveBeenCalled()
  })

  it.each([
    ['AI_TURNAROUND_OPERATION_NOT_FOUND', 404],
    ['AI_TURNAROUND_EVIDENCE_INVALID', 400]
  ])('maps %s evidence failures', async (code, expectedStatus) => {
    const { AiTurnaroundEvidenceError } = require('../../services/aiTurnaroundEvidence.service')
    resolveRequestActor.mockResolvedValue({ actorUserId: 'admin-1', actorRole: 'ADMIN' })
    loadTurnaroundEvidence.mockRejectedValue(new AiTurnaroundEvidenceError('evidence failure', code))
    const { res, status, json } = responseHarness()
    await controller.generateOperationalTurnaroundBriefing({ params: { operationId: 'op-1' }, body: {}, get: jest.fn() }, res, jest.fn())
    expect(status).toHaveBeenCalledWith(expectedStatus)
    expect(json).toHaveBeenCalledWith({ message: 'evidence failure', code })
  })

  it('passes unexpected operational failures to Express', async () => {
    resolveRequestActor.mockRejectedValue(new Error('actor failure'))
    const next = jest.fn()
    await controller.generateOperationalTurnaroundBriefing({ params: {}, body: {}, get: jest.fn() }, responseHarness().res, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'actor failure' }))
  })
})
