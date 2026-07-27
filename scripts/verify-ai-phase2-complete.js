const fs = require('fs')
const path = require('path')
const { assertAiPhaseTwoComplete } = require('../services/aiPhaseTwoCompletion.service')

const root = path.join(__dirname, '..')
const requiredFiles = [
  'cypress/react/reactAiTurnaroundBriefing.cy.js',
  'services/aiPhaseTwoCompletion.service.js',
  'tests/unit/aiPhaseTwoCompletion.service.test.js'
]

requiredFiles.forEach(relativePath => {
  if (!fs.existsSync(path.join(root, relativePath))) throw new Error(`Missing Phase 2 completion file: ${relativePath}`)
})

const completion = assertAiPhaseTwoComplete()

console.log('AI Phase 2 turnaround briefing completion audit passed.')
console.log(`Completion criteria: ${completion.completionCriteria.length}`)
console.log('Phase 2: 100% COMPLETE')
console.log(`Phase 3: ${completion.nextPhase.status}`)
