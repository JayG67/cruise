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
const controller = require('../../controllers/ai.controller')

function responseHarness() {
  const json = jest.fn()
  const status = jest.fn(() => ({ json }))
  return { res: { status }, status, json }
}

describe('AI controller authorization and failure boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createAiProvider.mockReturnValue({ name: 'deterministic', model: 'test-model' })
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
      currentPhase: 1,
      phases: expect.arrayContaining([expect.objectContaining({ phase: 6 })]),
      runtime: { provider: 'deterministic', model: 'test-model', generationEnabled: true }
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

  it('maps disabled-provider failures to a reviewable 503 response', async () => {
    resolveRequestActor.mockResolvedValue({ actorUserId: 'admin-1', actorRole: 'ADMIN' })
    generateTurnaroundBriefing.mockRejectedValue(new AiProviderError('Provider unavailable', 'AI_PROVIDER_NOT_CONFIGURED'))
    const { res, status, json } = responseHarness()

    await controller.generateTurnaroundBriefing({ body: {}, get: jest.fn() }, res, jest.fn())

    expect(status).toHaveBeenCalledWith(503)
    expect(json).toHaveBeenCalledWith({ message: 'Provider unavailable', code: 'AI_PROVIDER_NOT_CONFIGURED' })
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
