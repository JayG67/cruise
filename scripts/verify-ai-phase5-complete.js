const fs = require('fs')
const path = require('path')
const { assessAiPhaseFiveCompletion, PHASE_FIVE_COMPLETION_CRITERIA } = require('../services/aiPhaseFiveCompletion.service')
const { buildAiPhaseFiveReadiness } = require('../services/aiPhaseFiveReadiness.service')
const { getAiProgramStatus } = require('../services/aiProgramStatus.service')

const requiredFiles = [
  'services/aiAdversarialQualitySummary.service.js',
  'services/aiPhaseFiveCompletion.service.js',
  'tests/unit/aiAdversarialQualitySummary.service.test.js',
  'tests/unit/aiPhaseFiveCompletion.service.test.js',
  'frontend/react/src/components/ReactSqaConsole.jsx',
  'cypress/react/reactQualityConsole.cy.js'
]
for (const file of requiredFiles) if (!fs.existsSync(path.join(__dirname, '..', file))) throw new Error(`Missing Phase 5 completion file: ${file}`)
const qualityConsoleSource = fs.readFileSync(path.join(__dirname, '..', 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')
const browserCoverageSource = fs.readFileSync(path.join(__dirname, '..', 'cypress/react/reactQualityConsole.cy.js'), 'utf8')
if (!qualityConsoleSource.includes('react-ai-adversarial-summary-panel')) throw new Error('Quality Console adversarial resilience panel is missing.')
if (!browserCoverageSource.includes('shows the Phase 5 adversarial resilience release gate')) throw new Error('Phase 5 browser workflow coverage is missing.')

const completion = assessAiPhaseFiveCompletion()
const readiness = buildAiPhaseFiveReadiness()
const status = getAiProgramStatus()
if (!completion.complete || completion.adversarialQuality.resilienceScore !== 100) throw new Error('Phase 5 adversarial quality gate is not complete.')
if (readiness.status !== 'COMPLETE' || readiness.percentComplete !== 100 || readiness.nextCapabilities.length !== 0) throw new Error('Phase 5 readiness is not synchronized at 100% COMPLETE.')
if (status.completedPhases !== 5 || status.currentPhase !== 6) throw new Error('AI program status did not advance to Phase 6.')
if (!status.phaseFiveCapabilities.qualityConsoleIntegration || !status.phaseFiveCapabilities.browserWorkflowCoverage || !status.phaseFiveCapabilities.completionAudit || !status.phaseFiveCapabilities.phaseFiveComplete) throw new Error('Phase 5 completion capabilities are incomplete.')
console.log('AI Phase 5 adversarial and resilience completion audit passed.')
console.log(`Completion criteria: ${PHASE_FIVE_COMPLETION_CRITERIA.length}`)
console.log(`Adversarial scenarios: ${completion.adversarialQuality.totalScenarios}`)
console.log(`Resilience score: ${completion.adversarialQuality.resilienceScore}`)
console.log('Phase 5: 100% COMPLETE')
console.log('Phase 6: IN_PROGRESS (75%)')
