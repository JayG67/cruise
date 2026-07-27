const { DEFAULT_DIMENSION_WEIGHTS } = require('../ai/evaluations/turnaroundBriefingEvaluation.contract')

function clampScore(value) {
  const score = Number(value)
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(1, score))
}

function buildWeightedScore(dimensionScores, weights = DEFAULT_DIMENSION_WEIGHTS) {
  const entries = Object.entries(weights)
  const totalWeight = entries.reduce((sum, [, weight]) => sum + Number(weight || 0), 0)
  if (totalWeight <= 0) throw new TypeError('Evaluation weights must have a positive total.')

  const weightedTotal = entries.reduce((sum, [dimension, weight]) => {
    return sum + clampScore(dimensionScores[dimension]) * Number(weight || 0)
  }, 0)

  return Math.round((weightedTotal / totalWeight) * 10000) / 100
}

function buildEvaluationVerdict(score, passThreshold = 80) {
  return {
    score,
    passThreshold,
    passed: score >= passThreshold,
    grade: score >= 95 ? 'EXCELLENT' : score >= 80 ? 'PASS' : score >= 60 ? 'NEEDS_REVIEW' : 'FAIL'
  }
}

module.exports = { clampScore, buildWeightedScore, buildEvaluationVerdict }
