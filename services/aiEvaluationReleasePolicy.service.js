const DEFAULT_RELEASE_REGRESSION_POLICY = Object.freeze({
  minimumPassRate: 100,
  minimumAverageScore: 80,
  minimumPassRateDelta: 0,
  minimumAverageScoreDelta: 0,
  allowNewFailedCases: false
})

function numberOrDefault(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeReleaseRegressionPolicy(policy = {}) {
  return {
    minimumPassRate: Math.max(0, Math.min(100, numberOrDefault(policy.minimumPassRate, DEFAULT_RELEASE_REGRESSION_POLICY.minimumPassRate))),
    minimumAverageScore: Math.max(0, Math.min(100, numberOrDefault(policy.minimumAverageScore, DEFAULT_RELEASE_REGRESSION_POLICY.minimumAverageScore))),
    minimumPassRateDelta: numberOrDefault(policy.minimumPassRateDelta, DEFAULT_RELEASE_REGRESSION_POLICY.minimumPassRateDelta),
    minimumAverageScoreDelta: numberOrDefault(policy.minimumAverageScoreDelta, DEFAULT_RELEASE_REGRESSION_POLICY.minimumAverageScoreDelta),
    allowNewFailedCases: policy.allowNewFailedCases === true
  }
}

function assessEvaluationRelease({ matrix, policy = {} } = {}) {
  if (!matrix || !Array.isArray(matrix.variants) || matrix.variants.length === 0) {
    throw new TypeError('An evaluation matrix with at least one variant is required.')
  }

  const normalizedPolicy = normalizeReleaseRegressionPolicy(policy)
  const failures = []

  for (const variant of matrix.variants) {
    if (variant.passRate < normalizedPolicy.minimumPassRate) {
      failures.push({ variantId: variant.variantId, reason: 'minimum-pass-rate', actual: variant.passRate, required: normalizedPolicy.minimumPassRate })
    }
    if (variant.averageScore < normalizedPolicy.minimumAverageScore) {
      failures.push({ variantId: variant.variantId, reason: 'minimum-average-score', actual: variant.averageScore, required: normalizedPolicy.minimumAverageScore })
    }
  }

  for (const comparison of matrix.comparisons || []) {
    if (comparison.passRateDelta < normalizedPolicy.minimumPassRateDelta) {
      failures.push({ variantId: comparison.variantId, reason: 'pass-rate-regression', actual: comparison.passRateDelta, required: normalizedPolicy.minimumPassRateDelta })
    }
    if (comparison.averageScoreDelta < normalizedPolicy.minimumAverageScoreDelta) {
      failures.push({ variantId: comparison.variantId, reason: 'average-score-regression', actual: comparison.averageScoreDelta, required: normalizedPolicy.minimumAverageScoreDelta })
    }
    if (!normalizedPolicy.allowNewFailedCases && comparison.newFailedCases.length > 0) {
      failures.push({ variantId: comparison.variantId, reason: 'new-failed-cases', caseIds: [...comparison.newFailedCases] })
    }
  }

  return {
    passed: failures.length === 0,
    decision: failures.length === 0 ? 'APPROVED' : 'BLOCKED',
    policy: normalizedPolicy,
    failureCount: failures.length,
    failures
  }
}

module.exports = {
  DEFAULT_RELEASE_REGRESSION_POLICY,
  assessEvaluationRelease,
  normalizeReleaseRegressionPolicy
}
