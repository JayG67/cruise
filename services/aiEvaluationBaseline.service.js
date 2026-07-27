const DEFAULT_REGRESSION_POLICY = Object.freeze({
  minimumPassRateDelta: 0,
  minimumAverageScoreDelta: 0,
  allowNewFailedCases: false
})

function failedCaseIds(run = {}) {
  return new Set((run.results || []).filter(result => !result.passed).map(result => result.evaluationCaseId))
}

function compareEvaluationRuns({ currentRun, baselineRun, policy = DEFAULT_REGRESSION_POLICY } = {}) {
  if (!currentRun?.runId || !baselineRun?.runId) throw new TypeError('Current and baseline evaluation runs are required.')
  if (currentRun.suiteId !== baselineRun.suiteId) throw new TypeError('Evaluation runs must belong to the same suite.')

  const baselineFailures = failedCaseIds(baselineRun)
  const currentFailures = failedCaseIds(currentRun)
  const newFailedCases = [...currentFailures].filter(caseId => !baselineFailures.has(caseId))
  const recoveredCases = [...baselineFailures].filter(caseId => !currentFailures.has(caseId))
  const passRateDelta = Math.round((currentRun.passRate - baselineRun.passRate) * 100) / 100
  const averageScoreDelta = Math.round((currentRun.averageScore - baselineRun.averageScore) * 100) / 100
  const reasons = []

  if (passRateDelta < policy.minimumPassRateDelta) reasons.push('pass-rate-regression')
  if (averageScoreDelta < policy.minimumAverageScoreDelta) reasons.push('average-score-regression')
  if (!policy.allowNewFailedCases && newFailedCases.length > 0) reasons.push('new-failed-cases')

  return {
    suiteId: currentRun.suiteId,
    currentRunId: currentRun.runId,
    baselineRunId: baselineRun.runId,
    passRateDelta,
    averageScoreDelta,
    newFailedCases,
    recoveredCases,
    regressed: reasons.length > 0,
    reasons,
    policy: { ...policy }
  }
}

module.exports = { DEFAULT_REGRESSION_POLICY, compareEvaluationRuns }
