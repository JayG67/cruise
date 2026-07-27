const { assertEvaluationCase, EVALUATION_DIMENSIONS } = require('../ai/evaluations/turnaroundBriefingEvaluation.contract')
const { buildWeightedScore, buildEvaluationVerdict } = require('./aiEvaluationScoring.service')

function normalizeList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function evaluateTurnaroundBriefing(evaluationCase, candidate, options = {}) {
  assertEvaluationCase(evaluationCase)
  const briefing = candidate?.briefing || candidate || {}
  const findings = normalizeList(briefing.findings)
  const expected = evaluationCase.expected
  const citedEvidence = new Set(findings.flatMap(item => normalizeList(item.evidenceIds)))
  const availableEvidence = new Set(normalizeList(evaluationCase.input.evidenceIds))
  const requiredEvidence = normalizeList(expected.requiredEvidenceIds)
  const requiredCategories = normalizeList(expected.requiredFindingCategories)
  const unknownText = normalizeList(briefing.unknowns).join(' ').toLowerCase()

  const schemaCompliance = briefing.summary && briefing.riskLevel && Array.isArray(briefing.findings) && Array.isArray(briefing.unknowns) ? 1 : 0
  const requiredEvidenceHits = requiredEvidence.filter(id => citedEvidence.has(id)).length
  const unsupportedEvidence = [...citedEvidence].filter(id => !availableEvidence.has(id))
  const evidenceGrounding = requiredEvidence.length === 0
    ? (unsupportedEvidence.length === 0 ? 1 : 0)
    : Math.max(0, (requiredEvidenceHits / requiredEvidence.length) - (unsupportedEvidence.length * 0.25))
  const categoryHits = requiredCategories.filter(category => findings.some(item => item.category === category)).length
  const riskPrioritization = expected.riskLevel === briefing.riskLevel && (requiredCategories.length === 0 || categoryHits === requiredCategories.length) ? 1 : 0
  const actionableFindings = findings.filter(item => typeof item.recommendedAction === 'string' && item.recommendedAction.trim()).length
  const actionability = expected.minimumRecommendedActions === 0 ? 1 : Math.min(1, actionableFindings / expected.minimumRecommendedActions)
  const requiredUnknownTerms = normalizeList(expected.requiredUnknownTerms)
  const unknownsDiscipline = requiredUnknownTerms.length === 0
    ? 1
    : requiredUnknownTerms.filter(term => unknownText.includes(String(term).toLowerCase())).length / requiredUnknownTerms.length

  const dimensionScores = { schemaCompliance, evidenceGrounding, riskPrioritization, actionability, unknownsDiscipline }
  const score = buildWeightedScore(dimensionScores, options.weights)
  const verdict = buildEvaluationVerdict(score, options.passThreshold)

  return {
    evaluationCaseId: evaluationCase.id,
    evaluationCaseName: evaluationCase.name,
    dimensions: EVALUATION_DIMENSIONS.map(dimension => ({ dimension, score: dimensionScores[dimension] })),
    ...verdict,
    diagnostics: {
      missingRequiredEvidence: requiredEvidence.filter(id => !citedEvidence.has(id)),
      unsupportedEvidence,
      missingFindingCategories: requiredCategories.filter(category => !findings.some(item => item.category === category)),
      actionableFindingCount: actionableFindings
    }
  }
}

module.exports = { evaluateTurnaroundBriefing }
