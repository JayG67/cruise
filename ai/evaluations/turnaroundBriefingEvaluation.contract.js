const EVALUATION_DIMENSIONS = Object.freeze([
  'schemaCompliance',
  'evidenceGrounding',
  'riskPrioritization',
  'actionability',
  'unknownsDiscipline'
])

const DEFAULT_DIMENSION_WEIGHTS = Object.freeze({
  schemaCompliance: 0.25,
  evidenceGrounding: 0.25,
  riskPrioritization: 0.2,
  actionability: 0.2,
  unknownsDiscipline: 0.1
})

function assertEvaluationCase(evaluationCase) {
  if (!evaluationCase || typeof evaluationCase !== 'object') throw new TypeError('Evaluation case must be an object.')
  if (!evaluationCase.id || !evaluationCase.name) throw new TypeError('Evaluation case requires id and name.')
  if (!evaluationCase.input || typeof evaluationCase.input !== 'object') throw new TypeError('Evaluation case requires input.')
  if (!evaluationCase.expected || typeof evaluationCase.expected !== 'object') throw new TypeError('Evaluation case requires expected outcomes.')
  return evaluationCase
}

module.exports = {
  EVALUATION_DIMENSIONS,
  DEFAULT_DIMENSION_WEIGHTS,
  assertEvaluationCase
}
