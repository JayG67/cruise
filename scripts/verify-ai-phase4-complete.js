const fs = require('fs')
const path = require('path')
const { assessAiPhaseFourCompletion } = require('../services/aiPhaseFourCompletion.service')
const { getAiProgramStatus } = require('../services/aiProgramStatus.service')

const requiredFiles = [
  'services/aiPhaseFourCompletion.service.js',
  'services/aiEvaluationQualitySummary.service.js',
  'services/aiQualityConsoleReleasePolicy.service.js',
  'frontend/react/src/components/ReactSqaConsole.jsx',
  'frontend/react/src/api/client.js',
  'cypress/react/reactQualityConsoleFailureModes.cy.js',
  'tests/unit/aiPhaseFourCompletion.service.test.js',
  'tests/unit/sqaConsole.static.test.js'
]

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(__dirname, '..', relativePath))) {
    throw new Error(`Missing Phase 4 completion file: ${relativePath}`)
  }
}

const completion = assessAiPhaseFourCompletion()
const programStatus = getAiProgramStatus()

if (!completion.complete || completion.percentComplete !== 100 || completion.nextPhase.phase !== 5) {
  throw new Error('Phase 4 completion assessment is not synchronized.')
}

if (
  programStatus.currentPhase < 5 ||
  programStatus.completedPhases < 4 ||
  programStatus.phaseFourCapabilities.phaseFourComplete !== true ||
  programStatus.phases[3].status !== 'COMPLETE'
) {
  throw new Error('AI program status is not synchronized with Phase 4 completion.')
}

console.log('AI Phase 4 Quality Console completion audit passed.')
console.log(`Completion criteria: ${completion.completionCriteria.length}`)
console.log('Phase 4: 100% COMPLETE')
console.log(`Phase 5: ${programStatus.phases[4].status}${programStatus.phaseFiveCapabilities.phaseFiveComplete ? ' (100%)' : ''}`)
