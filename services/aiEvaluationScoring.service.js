const { DEFAULT_DIMENSION_WEIGHTS } = require('../ai/evaluations/turnaroundBriefingEvaluation.contract')

function clampScore(value) {
  const score = Number(value)
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(1, score))
}

function normalizeWeight(value) {
  const weight = Number(value)
  return Number.isFinite(weight) && weight > 0 ? weight : 0
}

function buildWeightedScore(dimensionScores = {}, weights = DEFAULT_DIMENSION_WEIGHTS) {
  const entries = Object.entries(weights || {})
  const totalWeight = entries.reduce((sum, [, weight]) => sum + normalizeWeight(weight), 0)
  if (totalWeight <= 0) throw new TypeError('Evaluation weights must have a positive total.')

  const weightedTotal = entries.reduce((sum, [dimension, weight]) => {
    return sum + clampScore(dimensionScores[dimension]) * normalizeWeight(weight)
  }, 0)

  return Math.round((weightedTotal / totalWeight) * 10000) / 100
}

function buildEvaluationVerdict(score, passThreshold = 80) {
  const normalizedScore = Number.isFinite(Number(score)) ? Number(score) : 0
  const normalizedThreshold = Number.isFinite(Number(passThreshold)) ? Number(passThreshold) : 80
  return {
    score: normalizedScore,
    passThreshold: normalizedThreshold,
    passed: normalizedScore >= normalizedThreshold,
    grade: normalizedScore >= 95 ? 'EXCELLENT' : normalizedScore >= 80 ? 'PASS' : normalizedScore >= 60 ? 'NEEDS_REVIEW' : 'FAIL'
  }
}

module.exports = { clampScore, buildWeightedScore, buildEvaluationVerdict }
