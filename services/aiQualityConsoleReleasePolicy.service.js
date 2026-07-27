const { compareEvaluationRuns } = require('./aiEvaluationBaseline.service')
const {
  DEFAULT_RELEASE_REGRESSION_POLICY,
  normalizeReleaseRegressionPolicy
} = require('./aiEvaluationReleasePolicy.service')

function assessQualityConsoleReleasePolicy({ currentRun, baselineRun, policy = {} } = {}) {
  if (!currentRun || !baselineRun) {
    throw new TypeError('Current and baseline evaluation runs are required.')
  }

  const normalizedPolicy = normalizeReleaseRegressionPolicy(policy)
  const comparison = compareEvaluationRuns({ currentRun, baselineRun })
  const failures = []

  if (Number(currentRun.passRate) < normalizedPolicy.minimumPassRate) {
    failures.push({ reason: 'minimum-pass-rate', actual: Number(currentRun.passRate), required: normalizedPolicy.minimumPassRate })
  }
  if (Number(currentRun.averageScore) < normalizedPolicy.minimumAverageScore) {
    failures.push({ reason: 'minimum-average-score', actual: Number(currentRun.averageScore), required: normalizedPolicy.minimumAverageScore })
  }
  if (Number(comparison.passRateDelta) < normalizedPolicy.minimumPassRateDelta) {
    failures.push({ reason: 'pass-rate-regression', actual: Number(comparison.passRateDelta), required: normalizedPolicy.minimumPassRateDelta })
  }
  if (Number(comparison.averageScoreDelta) < normalizedPolicy.minimumAverageScoreDelta) {
    failures.push({ reason: 'average-score-regression', actual: Number(comparison.averageScoreDelta), required: normalizedPolicy.minimumAverageScoreDelta })
  }
  if (!normalizedPolicy.allowNewFailedCases && comparison.newFailedCases.length > 0) {
    failures.push({ reason: 'new-failed-cases', caseIds: [...comparison.newFailedCases] })
  }

  return {
    currentRunId: comparison.currentRunId,
    baselineRunId: comparison.baselineRunId,
    decision: failures.length === 0 ? 'APPROVED' : 'BLOCKED',
    passed: failures.length === 0,
    policy: normalizedPolicy,
    comparison,
    failureCount: failures.length,
    failures
  }
}

function describeQualityConsoleReleasePolicy() {
  return { ...DEFAULT_RELEASE_REGRESSION_POLICY }
}

module.exports = {
  assessQualityConsoleReleasePolicy,
  describeQualityConsoleReleasePolicy
}
