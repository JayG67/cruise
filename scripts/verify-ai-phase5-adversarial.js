const fs = require('fs')
const path = require('path')
const { ADVERSARIAL_CATEGORIES } = require('../ai/evaluations/adversarial/turnaroundBriefingAdversarial.contract')
const { TURNAROUND_BRIEFING_ADVERSARIAL_SCENARIOS } = require('../ai/evaluations/adversarial/turnaroundBriefingAdversarial.scenarios')
const { TURNAROUND_OPERATIONAL_EVIDENCE_SCENARIOS } = require('../ai/evaluations/adversarial/turnaroundBriefingOperationalEvidence.scenarios')
const { TURNAROUND_PROMPT_INSTRUCTION_SCENARIOS } = require('../ai/evaluations/adversarial/turnaroundBriefingPromptInstruction.scenarios')
const { validateAdversarialScenarioCatalog } = require('../services/aiAdversarialScenario.service')
const { runOperationalEvidenceAdversarialSuite } = require('../services/aiOperationalEvidenceAdversarial.service')
const { runPromptInstructionAdversarialSuite } = require('../services/aiPromptInstructionAdversarial.service')
const { buildAiPhaseFiveReadiness } = require('../services/aiPhaseFiveReadiness.service')
const { getAiProgramStatus } = require('../services/aiProgramStatus.service')

const requiredFiles = [
  'ai/evaluations/adversarial/turnaroundBriefingAdversarial.contract.js',
  'ai/evaluations/adversarial/turnaroundBriefingAdversarial.scenarios.js',
  'ai/evaluations/adversarial/turnaroundBriefingOperationalEvidence.scenarios.js',
  'ai/evaluations/adversarial/turnaroundBriefingPromptInstruction.scenarios.js',
  'services/aiAdversarialScenario.service.js',
  'services/aiAdversarialEvaluation.service.js',
  'services/aiAdversarialSuite.service.js',
  'services/aiOperationalEvidenceAdversarial.service.js',
  'services/aiPromptInstructionAdversarial.service.js',
  'services/aiPhaseFiveReadiness.service.js',
  'tests/unit/aiAdversarialScenario.service.test.js',
  'tests/unit/aiAdversarialEvaluation.service.test.js',
  'tests/unit/aiAdversarialSuite.service.test.js',
  'tests/unit/aiOperationalEvidenceAdversarial.service.test.js',
  'tests/unit/aiPromptInstructionAdversarial.service.test.js',
  'tests/unit/aiPhaseFiveReadiness.service.test.js'
]

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(__dirname, '..', relativePath))) throw new Error(`Missing Phase 5 adversarial file: ${relativePath}`)
}

const scenarios = validateAdversarialScenarioCatalog(TURNAROUND_BRIEFING_ADVERSARIAL_SCENARIOS)
if (scenarios.length === 0) throw new Error('Phase 5 adversarial scenario catalog is empty.')
const representedCategories = new Set(scenarios.map(item => item.category))
for (const category of ADVERSARIAL_CATEGORIES) {
  if (!representedCategories.has(category)) throw new Error(`Phase 5 adversarial category is not represented: ${category}`)
}

const operationalScenarios = validateAdversarialScenarioCatalog(TURNAROUND_OPERATIONAL_EVIDENCE_SCENARIOS)
if (operationalScenarios.length < 10) throw new Error('Operational evidence attack catalog must contain at least ten executable scenarios.')
const operationalSuite = runOperationalEvidenceAdversarialSuite()
if (operationalSuite.totalScenarios !== operationalScenarios.length) throw new Error('Operational evidence suite did not execute the complete catalog.')
if (!operationalSuite.releaseDecision.passed || operationalSuite.resilienceScore !== 100) {
  throw new Error('Operational evidence adversarial suite must deterministically satisfy all expected safety outcomes.')
}


const promptScenarios = validateAdversarialScenarioCatalog(TURNAROUND_PROMPT_INSTRUCTION_SCENARIOS)
if (promptScenarios.length < 8) throw new Error('Prompt and instruction attack catalog must contain at least eight executable scenarios.')
const promptSuite = runPromptInstructionAdversarialSuite()
if (promptSuite.totalScenarios !== promptScenarios.length) throw new Error('Prompt and instruction suite did not execute the complete catalog.')
if (!promptSuite.releaseDecision.passed || promptSuite.resilienceScore !== 100) {
  throw new Error('Prompt and instruction adversarial suite must deterministically satisfy all expected safety outcomes.')
}

const readiness = buildAiPhaseFiveReadiness()
const status = getAiProgramStatus()
if (readiness.status !== 'IN_PROGRESS' || readiness.percentComplete !== 60) throw new Error('Phase 5 readiness is not synchronized at 60% IN_PROGRESS.')
if (!status.phaseFiveCapabilities.operationalEvidenceAttacks) throw new Error('Operational evidence attacks must be reported complete.')
if (!status.phaseFiveCapabilities.tenantIsolationAttackCoverage) throw new Error('Tenant isolation attack coverage must be reported complete.')
if (!status.phaseFiveCapabilities.promptInjectionCoverage) throw new Error('Prompt injection coverage must be reported complete.')
if (!status.phaseFiveCapabilities.authorizationAttackCoverage) throw new Error('Authorization attack coverage must be reported complete.')
if (status.phases.find(item => item.phase === 4)?.status !== 'COMPLETE') throw new Error('Phase 4 must remain complete.')
if (status.phases.find(item => item.phase === 6)?.status !== 'NOT_STARTED') throw new Error('Phase 6 must remain not started.')
if (status.phaseFiveCapabilities.phaseFiveComplete !== false) throw new Error('Phase 5 must not be marked complete.')

console.log('AI Phase 5 adversarial and operational evidence architecture audit passed.')
console.log(`Required Phase 5 files: ${requiredFiles.length}`)
console.log(`Foundation scenarios: ${scenarios.length}`)
console.log(`Operational evidence scenarios: ${operationalScenarios.length}`)
console.log(`Operational resilience score: ${operationalSuite.resilienceScore}`)
console.log(`Prompt and instruction scenarios: ${promptScenarios.length}`)
console.log(`Prompt and instruction resilience score: ${promptSuite.resilienceScore}`)
console.log('Phase 5: IN_PROGRESS (60%)')
