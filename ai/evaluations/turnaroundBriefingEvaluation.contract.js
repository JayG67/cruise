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

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasMeaningfulText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function assertEvaluationCase(evaluationCase) {
  if (!isPlainObject(evaluationCase)) throw new TypeError('Evaluation case must be an object.')
  if (!hasMeaningfulText(evaluationCase.id) || !hasMeaningfulText(evaluationCase.name)) throw new TypeError('Evaluation case requires id and name.')
  if (!isPlainObject(evaluationCase.input)) throw new TypeError('Evaluation case requires input.')
  if (!isPlainObject(evaluationCase.expected)) throw new TypeError('Evaluation case requires expected outcomes.')
  return evaluationCase
}

module.exports = {
  EVALUATION_DIMENSIONS,
  DEFAULT_DIMENSION_WEIGHTS,
  assertEvaluationCase
}
