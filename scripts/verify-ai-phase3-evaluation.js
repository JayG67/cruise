const fs = require('fs')
const path = require('path')
const { buildAiPhaseThreeReadiness } = require('../services/aiPhaseThreeReadiness.service')

const requiredFiles = [
  'ai/evaluations/turnaroundBriefingEvaluation.contract.js',
  'ai/evaluations/cases/turnaroundBriefing.cases.js',
  'ai/contracts/aiEvaluation.contract.js',
  'services/aiEvaluationScoring.service.js',
  'services/aiTurnaroundBriefingEvaluator.service.js',
  'services/aiEvaluationHarness.service.js',
  'services/aiEvaluationRun.service.js',
  'services/aiEvaluationBaseline.service.js',
  'services/aiEvaluationMatrix.service.js',
  'services/aiEvaluationReleasePolicy.service.js',
  'services/aiPhaseThreeReadiness.service.js',
  'tests/unit/aiEvaluationScoring.service.test.js',
  'tests/unit/aiTurnaroundBriefingEvaluator.service.test.js',
  'tests/unit/aiEvaluationHarness.service.test.js',
  'tests/unit/aiEvaluationRun.service.test.js',
  'tests/unit/aiEvaluationBaseline.service.test.js',
  'tests/unit/aiEvaluationMatrix.service.test.js',
  'tests/unit/aiEvaluationReleasePolicy.service.test.js',
  'tests/unit/aiPhaseThreeReadiness.service.test.js'
]

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(__dirname, '..', relativePath))) throw new Error(`Missing Phase 3 evaluation file: ${relativePath}`)
}

const readiness = buildAiPhaseThreeReadiness()
if (readiness.status !== 'COMPLETE' || readiness.percentComplete !== 100) throw new Error('Phase 3 evaluation harness status is not synchronized.')
console.log('AI Phase 3 evaluation harness evaluation architecture audit passed.')
console.log(`Required Phase 3 files: ${requiredFiles.length}`)
console.log('Phase 3: COMPLETE (100%)')
