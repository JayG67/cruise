const { listEvaluationRuns } = require('./aiEvaluationRun.service')
const { describeQualityConsoleReleasePolicy } = require('./aiQualityConsoleReleasePolicy.service')

function numeric(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function summarizeFailedCase(result = {}) {
  const diagnostics = result.diagnostics || {}
  const dimensions = Array.isArray(result.dimensions) ? result.dimensions : []
  const weakestDimensions = dimensions
    .filter(item => numeric(item.score) < 1)
    .sort((left, right) => numeric(left.score) - numeric(right.score))
    .map(item => ({ dimension: item.dimension, score: numeric(item.score) }))

  return {
    evaluationCaseId: result.evaluationCaseId || null,
    evaluationCaseName: result.evaluationCaseName || result.evaluationCaseId || 'Unnamed evaluation case',
    score: numeric(result.score),
    passThreshold: numeric(result.passThreshold),
    weakestDimensions,
    diagnostics: {
      missingRequiredEvidence: Array.isArray(diagnostics.missingRequiredEvidence) ? diagnostics.missingRequiredEvidence : [],
      unsupportedEvidence: Array.isArray(diagnostics.unsupportedEvidence) ? diagnostics.unsupportedEvidence : [],
      missingFindingCategories: Array.isArray(diagnostics.missingFindingCategories) ? diagnostics.missingFindingCategories : [],
      actionableFindingCount: numeric(diagnostics.actionableFindingCount)
    }
  }
}

function summarizeRun(run = {}) {
  const metadata = run.metadata || {}
  const results = Array.isArray(run.results) ? run.results : []
  const failedCases = results.filter(result => result.passed !== true).map(summarizeFailedCase)
  return {
    runId: run.runId || null,
    suiteId: run.suiteId || null,
    completedAt: run.completedAt || run.recordedAt || null,
    passRate: numeric(run.passRate),
    averageScore: numeric(run.averageScore),
    passed: run.passed === true,
    durationMs: numeric(run.durationMs),
    provider: metadata.provider || run.provider || 'unknown',
    model: metadata.model || run.model || 'unknown',
    promptVersion: metadata.promptVersion || run.promptVersion || 'unknown',
    variantId: metadata.variantId || run.variantId || null,
    caseCount: results.length || numeric(run.caseCount),
    failedCaseIds: failedCases.map(result => result.evaluationCaseId),
    failedCases
  }
}

function buildFailureSummary(runs = []) {
  const failuresByCase = new Map()
  runs.forEach(run => {
    const failedCases = Array.isArray(run.failedCases) ? run.failedCases : []
    failedCases.forEach(failedCase => {
      const current = failuresByCase.get(failedCase.evaluationCaseId) || {
        evaluationCaseId: failedCase.evaluationCaseId,
        evaluationCaseName: failedCase.evaluationCaseName,
        failureCount: 0,
        latestScore: failedCase.score
      }
      current.failureCount += 1
      failuresByCase.set(failedCase.evaluationCaseId, current)
    })
  })
  return [...failuresByCase.values()].sort((left, right) => right.failureCount - left.failureCount || left.evaluationCaseName.localeCompare(right.evaluationCaseName))
}

function round(value) {
  return Math.round(value * 100) / 100
}

function buildTrend(runs = []) {
  if (!runs.length) {
    return {
      direction: 'NO_DATA',
      passRateDelta: 0,
      averageScoreDelta: 0,
      averagePassRate: 0,
      averageScore: 0
    }
  }

  const latest = runs[0]
  const previous = runs[1] || latest
  const averagePassRate = runs.reduce((total, run) => total + run.passRate, 0) / runs.length
  const averageScore = runs.reduce((total, run) => total + run.averageScore, 0) / runs.length
  const passRateDelta = round(latest.passRate - previous.passRate)
  const averageScoreDelta = round(latest.averageScore - previous.averageScore)
  const direction = passRateDelta > 0 || averageScoreDelta > 0
    ? 'IMPROVING'
    : passRateDelta < 0 || averageScoreDelta < 0
      ? 'REGRESSING'
      : 'STABLE'

  return {
    direction,
    passRateDelta,
    averageScoreDelta,
    averagePassRate: round(averagePassRate),
    averageScore: round(averageScore)
  }
}

async function buildAiEvaluationQualitySummary({ suiteId = 'turnaround-briefing-phase3', limit = 20, runLister = listEvaluationRuns } = {}) {
  const history = await runLister({ suiteId, limit })
  const runs = (history.runs || []).map(summarizeRun)
  const latestRun = runs[0] || null
  const passingRuns = runs.filter(run => run.passed).length

  return {
    suiteId,
    generatedAt: new Date().toISOString(),
    runCount: runs.length,
    passingRuns,
    failingRuns: runs.length - passingRuns,
    latestRun,
    releaseReadiness: latestRun ? (latestRun.passed ? 'READY' : 'BLOCKED') : 'NO_DATA',
    releasePolicy: describeQualityConsoleReleasePolicy(),
    trend: buildTrend(runs),
    failureSummary: buildFailureSummary(runs),
    runs
  }
}

module.exports = { buildAiEvaluationQualitySummary, buildFailureSummary, buildTrend, summarizeFailedCase, summarizeRun }
