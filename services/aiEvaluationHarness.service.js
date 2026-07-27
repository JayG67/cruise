const crypto = require('crypto')
const { assertEvaluationCase } = require('../ai/evaluations/turnaroundBriefingEvaluation.contract')
const { evaluateTurnaroundBriefing } = require('./aiTurnaroundBriefingEvaluator.service')

function runEvaluationSuite({ suiteId = 'turnaround-briefing-phase3', cases, generateCandidate, options = {}, metadata = {} }) {
  if (!Array.isArray(cases) || cases.length === 0) throw new TypeError('Evaluation suite requires at least one case.')
  if (typeof generateCandidate !== 'function') throw new TypeError('Evaluation suite requires generateCandidate.')

  const startedAt = new Date().toISOString()
  const results = cases.map(evaluationCase => {
    assertEvaluationCase(evaluationCase)
    const candidate = generateCandidate(evaluationCase.input, evaluationCase)
    return evaluateTurnaroundBriefing(evaluationCase, candidate, options)
  })
  const passedCases = results.filter(result => result.passed).length
  const averageScore = Math.round((results.reduce((sum, result) => sum + result.score, 0) / results.length) * 100) / 100

  return {
    runId: crypto.createHash('sha256').update(`${suiteId}:${startedAt}:${cases.map(item => item.id).join(',')}:${JSON.stringify(metadata)}`).digest('hex').slice(0, 16),
    suiteId,
    startedAt,
    completedAt: new Date().toISOString(),
    caseCount: results.length,
    passedCases,
    failedCases: results.length - passedCases,
    passRate: Math.round((passedCases / results.length) * 10000) / 100,
    averageScore,
    passed: passedCases === results.length,
    metadata: { ...metadata },
    results
  }
}

module.exports = { runEvaluationSuite }
