const { listEvaluationRuns } = require('./aiEvaluationRun.service')

function summarizeRun(run = {}) {
  return {
    runId: run.runId || null,
    suiteId: run.suiteId || null,
    completedAt: run.completedAt || run.recordedAt || null,
    passRate: Number(run.passRate || 0),
    averageScore: Number(run.averageScore || 0),
    passed: Boolean(run.passed),
    caseCount: Array.isArray(run.results) ? run.results.length : Number(run.caseCount || 0),
    failedCaseIds: (run.results || []).filter(result => !result.passed).map(result => result.evaluationCaseId)
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
    runs
  }
}

module.exports = { buildAiEvaluationQualitySummary, summarizeRun }
