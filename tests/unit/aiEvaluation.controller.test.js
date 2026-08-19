jest.mock('../../services/requestAuthorization.service', () => ({ resolveRequestActor: jest.fn() }))
jest.mock('../../services/aiEvaluationHarness.service', () => ({ runEvaluationSuite: jest.fn() }))
jest.mock('../../services/aiEvaluationBaseline.service', () => ({ compareEvaluationRuns: jest.fn() }))
jest.mock('../../services/aiEvaluationMatrix.service', () => ({ runEvaluationMatrix: jest.fn() }))
jest.mock('../../services/aiEvaluationRun.service', () => ({
  getEvaluationRun: jest.fn(),
  listEvaluationRuns: jest.fn(),
  recordEvaluationRun: jest.fn()
}))
jest.mock('../../services/aiEvaluationQualitySummary.service', () => ({ buildAiEvaluationQualitySummary: jest.fn() }))
jest.mock('../../services/aiQualityConsoleReleasePolicy.service', () => ({ assessQualityConsoleReleasePolicy: jest.fn() }))
jest.mock('../../services/aiAdversarialQualitySummary.service', () => ({ buildAiAdversarialQualitySummary: jest.fn() }))
jest.mock('../../controllers/aiControllerSupport', () => ({ canManageAiEvaluations: jest.fn() }))

const { resolveRequestActor } = require('../../services/requestAuthorization.service')
const { runEvaluationSuite } = require('../../services/aiEvaluationHarness.service')
const { compareEvaluationRuns } = require('../../services/aiEvaluationBaseline.service')
const { runEvaluationMatrix } = require('../../services/aiEvaluationMatrix.service')
const { getEvaluationRun, listEvaluationRuns, recordEvaluationRun } = require('../../services/aiEvaluationRun.service')
const { buildAiEvaluationQualitySummary } = require('../../services/aiEvaluationQualitySummary.service')
const { assessQualityConsoleReleasePolicy } = require('../../services/aiQualityConsoleReleasePolicy.service')
const { buildAiAdversarialQualitySummary } = require('../../services/aiAdversarialQualitySummary.service')
const { canManageAiEvaluations } = require('../../controllers/aiControllerSupport')
const { TURNAROUND_BRIEFING_EVALUATION_CASES } = require('../../ai/evaluations/cases/turnaroundBriefing.cases')
const controller = require('../../controllers/aiEvaluation.controller')

function responseHarness() {
  const json = jest.fn()
  const status = jest.fn(() => ({ json }))
  return { res: { status }, status, json }
}

function adminActor() {
  return { actorUserId: 'admin-1', actorRole: 'ADMIN' }
}

function candidate(caseId = TURNAROUND_BRIEFING_EVALUATION_CASES[0].id) {
  return { caseId, briefing: { riskLevel: 'low', findings: [], recommendedActions: [] } }
}

describe('AI evaluation controller coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resolveRequestActor.mockResolvedValue(adminActor())
    canManageAiEvaluations.mockReturnValue(true)
  })

  it('denies evaluation runs before orchestration for a non-admin actor', async () => {
    canManageAiEvaluations.mockReturnValue(false)
    const { res, status, json } = responseHarness()

    await controller.runTurnaroundBriefingEvaluation({ body: { candidates: [] } }, res, jest.fn())

    expect(status).toHaveBeenCalledWith(403)
    expect(json).toHaveBeenCalledWith({ message: 'AI evaluation runs require an administrator.' })
    expect(runEvaluationSuite).not.toHaveBeenCalled()
  })

  it('rejects unknown evaluation case identifiers', async () => {
    const { res, status, json } = responseHarness()

    await controller.runTurnaroundBriefingEvaluation({ body: { suiteId: 'suite', candidates: [candidate('unknown-case')] } }, res, jest.fn())

    expect(status).toHaveBeenCalledWith(400)
    expect(json).toHaveBeenCalledWith({ message: 'One or more evaluation case identifiers are unknown.' })
  })

  it('runs and records an authorized evaluation suite', async () => {
    const run = { id: 'run-1', suiteId: 'suite' }
    runEvaluationSuite.mockReturnValue(run)
    recordEvaluationRun.mockResolvedValue(undefined)
    const { res, status, json } = responseHarness()
    const selected = candidate()

    await controller.runTurnaroundBriefingEvaluation({ body: { suiteId: 'suite', candidates: [selected] } }, res, jest.fn())

    expect(runEvaluationSuite).toHaveBeenCalledWith(expect.objectContaining({ suiteId: 'suite', cases: [TURNAROUND_BRIEFING_EVALUATION_CASES[0]] }))
    const generateCandidate = runEvaluationSuite.mock.calls[0][0].generateCandidate
    expect(generateCandidate(null, TURNAROUND_BRIEFING_EVALUATION_CASES[0])).toEqual(selected.briefing)
    expect(recordEvaluationRun).toHaveBeenCalledWith({ run, actor: adminActor() })
    expect(status).toHaveBeenCalledWith(201)
    expect(json).toHaveBeenCalledWith(run)
  })

  it('rejects matrix variants containing unknown case identifiers', async () => {
    const { res, status, json } = responseHarness()
    const req = { body: { variants: [{ variantId: 'v1', candidates: [candidate('unknown-case')] }] } }

    await controller.runTurnaroundBriefingEvaluationMatrix(req, res, jest.fn())

    expect(status).toHaveBeenCalledWith(400)
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ unknownCaseIds: ['unknown-case'] }))
  })

  it('rejects incomplete matrix variants', async () => {
    const first = TURNAROUND_BRIEFING_EVALUATION_CASES[0].id
    const second = TURNAROUND_BRIEFING_EVALUATION_CASES[1].id
    const { res, status, json } = responseHarness()
    const req = {
      body: {
        variants: [
          { variantId: 'complete', candidates: [candidate(first), candidate(second)] },
          { variantId: 'incomplete', candidates: [candidate(first)] }
        ]
      }
    }

    await controller.runTurnaroundBriefingEvaluationMatrix(req, res, jest.fn())

    expect(status).toHaveBeenCalledWith(400)
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ incompleteVariants: ['incomplete'] }))
  })

  it('runs a complete matrix and records every variant run', async () => {
    const caseId = TURNAROUND_BRIEFING_EVALUATION_CASES[0].id
    const matrix = { variants: [{ run: { id: 'run-a' } }, { run: { id: 'run-b' } }] }
    runEvaluationMatrix.mockReturnValue(matrix)
    recordEvaluationRun.mockResolvedValue(undefined)
    const { res, status, json } = responseHarness()
    const req = {
      body: {
        suiteId: 'suite', baselineVariantId: 'v1', policy: { minimumScore: 90 },
        variants: [
          { variantId: 'v1', provider: 'a', model: 'm1', promptVersion: 'p1', candidates: [candidate(caseId)] },
          { variantId: 'v2', provider: 'b', model: 'm2', promptVersion: 'p2', candidates: [candidate(caseId)] }
        ]
      }
    }

    await controller.runTurnaroundBriefingEvaluationMatrix(req, res, jest.fn())

    expect(runEvaluationMatrix).toHaveBeenCalledWith(expect.objectContaining({ suiteId: 'suite', baselineVariantId: 'v1' }))
    const variants = runEvaluationMatrix.mock.calls[0][0].variants
    expect(variants[0].generateCandidate(null, TURNAROUND_BRIEFING_EVALUATION_CASES[0])).toEqual(candidate(caseId).briefing)
    expect(recordEvaluationRun).toHaveBeenCalledTimes(2)
    expect(status).toHaveBeenCalledWith(201)
    expect(json).toHaveBeenCalledWith(matrix)
  })

  it('returns adversarial and evaluation quality summaries', async () => {
    buildAiAdversarialQualitySummary.mockReturnValue({ score: 100 })
    buildAiEvaluationQualitySummary.mockResolvedValue({ suiteId: 'suite', score: 98 })

    const first = responseHarness()
    await controller.getAdversarialQualitySummary({}, first.res, jest.fn())
    expect(first.status).toHaveBeenCalledWith(200)
    expect(first.json).toHaveBeenCalledWith({ score: 100 })

    const second = responseHarness()
    await controller.getTurnaroundBriefingEvaluationQualitySummary({ query: { suiteId: 'suite', limit: '10' } }, second.res, jest.fn())
    expect(buildAiEvaluationQualitySummary).toHaveBeenCalledWith({ suiteId: 'suite', limit: '10' })
    expect(second.status).toHaveBeenCalledWith(200)
  })

  it('returns 404 when release-policy runs are incomplete and evaluates complete pairs', async () => {
    getEvaluationRun.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'baseline' })
    const missing = responseHarness()
    await controller.previewTurnaroundBriefingReleasePolicy({ body: { currentRunId: 'missing', baselineRunId: 'baseline', suiteId: 'suite' } }, missing.res, jest.fn())
    expect(missing.status).toHaveBeenCalledWith(404)

    getEvaluationRun.mockReset()
    getEvaluationRun.mockResolvedValueOnce({ id: 'current' }).mockResolvedValueOnce({ id: 'baseline' })
    assessQualityConsoleReleasePolicy.mockReturnValue({ releasable: true })
    const complete = responseHarness()
    await controller.previewTurnaroundBriefingReleasePolicy({ body: { currentRunId: 'current', baselineRunId: 'baseline', suiteId: 'suite', policy: { minimumScore: 90 } } }, complete.res, jest.fn())
    expect(assessQualityConsoleReleasePolicy).toHaveBeenCalledWith(expect.objectContaining({ currentRun: { id: 'current' }, baselineRun: { id: 'baseline' } }))
    expect(complete.status).toHaveBeenCalledWith(200)
  })

  it('lists evaluation history and compares complete run pairs', async () => {
    listEvaluationRuns.mockResolvedValue([{ id: 'run-1' }])
    const list = responseHarness()
    await controller.listTurnaroundBriefingEvaluationRuns({ query: { suiteId: 'suite', limit: '5' } }, list.res, jest.fn())
    expect(listEvaluationRuns).toHaveBeenCalledWith({ suiteId: 'suite', limit: '5' })
    expect(list.status).toHaveBeenCalledWith(200)

    getEvaluationRun.mockReset()
    getEvaluationRun.mockResolvedValueOnce({ id: 'current' }).mockResolvedValueOnce({ id: 'baseline' })
    compareEvaluationRuns.mockReturnValue({ delta: 2 })
    const compare = responseHarness()
    await controller.compareTurnaroundBriefingEvaluationRun({ params: { runId: 'current' }, query: { baselineRunId: 'baseline', suiteId: 'suite' } }, compare.res, jest.fn())
    expect(compareEvaluationRuns).toHaveBeenCalledWith({ currentRun: { id: 'current' }, baselineRun: { id: 'baseline' } })
    expect(compare.status).toHaveBeenCalledWith(200)
  })

  it('forwards service failures to error middleware', async () => {
    const error = new Error('storage failed')
    listEvaluationRuns.mockRejectedValue(error)
    const next = jest.fn()
    const { res } = responseHarness()

    await controller.listTurnaroundBriefingEvaluationRuns({ query: {} }, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('AI evaluation controller remaining authorization and not-found branches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resolveRequestActor.mockResolvedValue(adminActor())
    canManageAiEvaluations.mockReturnValue(false)
  })

  it.each([
    ['runTurnaroundBriefingEvaluationMatrix', { body: { variants: [] } }, 'AI evaluation matrices require an administrator.'],
    ['getAdversarialQualitySummary', {}, 'AI adversarial quality summaries require an administrator.'],
    ['getTurnaroundBriefingEvaluationQualitySummary', { query: {} }, 'AI evaluation quality summaries require an administrator.'],
    ['previewTurnaroundBriefingReleasePolicy', { body: {} }, 'AI release-policy previews require an administrator.'],
    ['listTurnaroundBriefingEvaluationRuns', { query: {} }, 'AI evaluation history requires an administrator.'],
    ['compareTurnaroundBriefingEvaluationRun', { params: {}, query: {} }, 'AI evaluation comparison requires an administrator.']
  ])('denies %s before service orchestration', async (method, req, message) => {
    const { res, status, json } = responseHarness()
    await controller[method](req, res, jest.fn())
    expect(status).toHaveBeenCalledWith(403)
    expect(json).toHaveBeenCalledWith({ message })
  })

  it('returns 404 when either evaluation comparison run is missing', async () => {
    canManageAiEvaluations.mockReturnValue(true)
    getEvaluationRun.mockResolvedValueOnce({ id: 'current' }).mockResolvedValueOnce(null)
    const { res, status, json } = responseHarness()

    await controller.compareTurnaroundBriefingEvaluationRun({
      params: { runId: 'current' }, query: { baselineRunId: 'missing', suiteId: 'suite' }
    }, res, jest.fn())

    expect(status).toHaveBeenCalledWith(404)
    expect(json).toHaveBeenCalledWith({ message: 'The requested evaluation run was not found.' })
    expect(compareEvaluationRuns).not.toHaveBeenCalled()
  })
})
