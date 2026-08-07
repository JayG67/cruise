const { resolveRequestActor } = require('../services/requestAuthorization.service')
const { TURNAROUND_BRIEFING_EVALUATION_CASES } = require('../ai/evaluations/cases/turnaroundBriefing.cases')
const { runEvaluationSuite } = require('../services/aiEvaluationHarness.service')
const { compareEvaluationRuns } = require('../services/aiEvaluationBaseline.service')
const { runEvaluationMatrix } = require('../services/aiEvaluationMatrix.service')
const { getEvaluationRun, listEvaluationRuns, recordEvaluationRun } = require('../services/aiEvaluationRun.service')
const { buildAiEvaluationQualitySummary } = require('../services/aiEvaluationQualitySummary.service')
const { assessQualityConsoleReleasePolicy } = require('../services/aiQualityConsoleReleasePolicy.service')
const { buildAiAdversarialQualitySummary } = require('../services/aiAdversarialQualitySummary.service')
const { canManageAiEvaluations } = require('./aiControllerSupport')

exports.runTurnaroundBriefingEvaluation = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canManageAiEvaluations(actor)) return res.status(403).json({ message: 'AI evaluation runs require an administrator.' })

    const candidates = new Map(req.body.candidates.map(item => [item.caseId, item.briefing]))
    const selectedCases = TURNAROUND_BRIEFING_EVALUATION_CASES.filter(item => candidates.has(item.id))
    if (selectedCases.length !== candidates.size) {
      return res.status(400).json({ message: 'One or more evaluation case identifiers are unknown.' })
    }

    const run = runEvaluationSuite({
      suiteId: req.body.suiteId,
      cases: selectedCases,
      generateCandidate: (_input, evaluationCase) => candidates.get(evaluationCase.id)
    })
    await recordEvaluationRun({ run, actor })
    return res.status(201).json(run)
  } catch (error) {
    return next(error)
  }
}



exports.runTurnaroundBriefingEvaluationMatrix = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canManageAiEvaluations(actor)) return res.status(403).json({ message: 'AI evaluation matrices require an administrator.' })

    const knownCaseIds = new Set(TURNAROUND_BRIEFING_EVALUATION_CASES.map(item => item.id))
    const requestedCaseIds = new Set(req.body.variants.flatMap(variant => variant.candidates.map(item => item.caseId)))
    const unknownCaseIds = [...requestedCaseIds].filter(caseId => !knownCaseIds.has(caseId))
    if (unknownCaseIds.length > 0) {
      return res.status(400).json({ message: 'One or more evaluation case identifiers are unknown.', unknownCaseIds })
    }

    const selectedCases = TURNAROUND_BRIEFING_EVALUATION_CASES.filter(item => requestedCaseIds.has(item.id))
    const incompleteVariants = req.body.variants
      .filter(variant => {
        const variantCaseIds = new Set(variant.candidates.map(item => item.caseId))
        return variantCaseIds.size !== requestedCaseIds.size || [...requestedCaseIds].some(caseId => !variantCaseIds.has(caseId))
      })
      .map(variant => variant.variantId)
    if (incompleteVariants.length > 0) {
      return res.status(400).json({
        message: 'Every evaluation matrix variant must provide the same evaluation cases.',
        incompleteVariants
      })
    }

    const variants = req.body.variants.map(variant => {
      const candidates = new Map(variant.candidates.map(item => [item.caseId, item.briefing]))
      return {
        variantId: variant.variantId,
        provider: variant.provider,
        model: variant.model,
        promptVersion: variant.promptVersion,
        generateCandidate: (_input, evaluationCase) => candidates.get(evaluationCase.id)
      }
    })

    const matrix = runEvaluationMatrix({
      suiteId: req.body.suiteId,
      cases: selectedCases,
      variants,
      baselineVariantId: req.body.baselineVariantId,
      policy: req.body.policy
    })

    await Promise.all(matrix.variants.map(variant => recordEvaluationRun({ run: variant.run, actor })))
    return res.status(201).json(matrix)
  } catch (error) {
    return next(error)
  }
}



exports.getAdversarialQualitySummary = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canManageAiEvaluations(actor)) return res.status(403).json({ message: 'AI adversarial quality summaries require an administrator.' })
    return res.status(200).json(buildAiAdversarialQualitySummary())
  } catch (error) {
    return next(error)
  }
}

exports.getTurnaroundBriefingEvaluationQualitySummary = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canManageAiEvaluations(actor)) return res.status(403).json({ message: 'AI evaluation quality summaries require an administrator.' })
    return res.status(200).json(await buildAiEvaluationQualitySummary({ suiteId: req.query.suiteId, limit: req.query.limit }))
  } catch (error) {
    return next(error)
  }
}

exports.previewTurnaroundBriefingReleasePolicy = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canManageAiEvaluations(actor)) return res.status(403).json({ message: 'AI release-policy previews require an administrator.' })
    const currentRun = await getEvaluationRun(req.body.currentRunId, { suiteId: req.body.suiteId })
    const baselineRun = await getEvaluationRun(req.body.baselineRunId, { suiteId: req.body.suiteId })
    if (!currentRun || !baselineRun) return res.status(404).json({ message: 'The requested evaluation run was not found.' })
    return res.status(200).json(assessQualityConsoleReleasePolicy({
      currentRun,
      baselineRun,
      policy: req.body.policy
    }))
  } catch (error) {
    return next(error)
  }
}

exports.listTurnaroundBriefingEvaluationRuns = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canManageAiEvaluations(actor)) return res.status(403).json({ message: 'AI evaluation history requires an administrator.' })
    return res.status(200).json(await listEvaluationRuns({ suiteId: req.query.suiteId, limit: req.query.limit }))
  } catch (error) {
    return next(error)
  }
}

exports.compareTurnaroundBriefingEvaluationRun = async (req, res, next) => {
  try {
    const actor = await resolveRequestActor(req)
    if (!canManageAiEvaluations(actor)) return res.status(403).json({ message: 'AI evaluation comparison requires an administrator.' })
    const currentRun = await getEvaluationRun(req.params.runId, { suiteId: req.query.suiteId })
    const baselineRun = await getEvaluationRun(req.query.baselineRunId, { suiteId: req.query.suiteId })
    if (!currentRun || !baselineRun) return res.status(404).json({ message: 'The requested evaluation run was not found.' })
    return res.status(200).json(compareEvaluationRuns({ currentRun, baselineRun }))
  } catch (error) {
    return next(error)
  }
}
