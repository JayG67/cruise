const fs = require('fs')
const path = require('path')
const { buildAiPhaseSixReadiness } = require('../services/aiPhaseSixReadiness.service')
const { getAiProgramStatus } = require('../services/aiProgramStatus.service')

const projectRoot = path.resolve(__dirname, '..')
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
const workflow = fs.readFileSync(path.join(projectRoot, '.github/workflows/ci.yml'), 'utf8')
const gateScript = fs.readFileSync(path.join(projectRoot, 'scripts/run-ai-ci-quality-gate.js'), 'utf8')

const requiredWorkflowTokens = [
  'ai-quality-gate:',
  'name: AI Quality Gate',
  'npm run ai:ci:gate',
  'name: ai-quality-evidence',
  'ai-quality-evidence/phase6-ci-evidence.json',
  'if: always()',
  'GITHUB_STEP_SUMMARY'
]
for (const token of requiredWorkflowTokens) {
  if (!workflow.includes(token)) throw new Error(`Phase 6 CI workflow token is missing: ${token}`)
}

if (packageJson.scripts['ai:ci:gate'] !== 'node scripts/run-ai-ci-quality-gate.js') throw new Error('AI CI gate package script is missing.')
if (packageJson.scripts['ai:phase6:audit'] !== 'node scripts/verify-ai-phase6-ci.js') throw new Error('Phase 6 audit package script is missing.')
if (!packageJson.scripts['test:all'].includes('npm run ai:phase6:audit')) throw new Error('test:all does not include the Phase 6 CI architecture audit.')
if (!gateScript.includes("releaseDecision: failedChecks.length === 0 ? 'APPROVED' : 'BLOCKED'")) throw new Error('AI CI evidence does not include a release decision.')
if (!gateScript.includes('phase6-ci-evidence.json')) throw new Error('AI CI evidence artifact path is missing.')

const readiness = buildAiPhaseSixReadiness()
const status = getAiProgramStatus()
if (readiness.status !== 'IN_PROGRESS' || readiness.percentComplete !== 25) throw new Error('Phase 6 readiness is not synchronized at 25%.')
if (status.currentPhase !== 6 || status.completedPhases !== 5 || status.currentPhasePercentComplete !== 25) throw new Error('AI program status is not synchronized with Phase 6 CI integration.')
if (!status.phaseSixCapabilities.ciQualityGate || !status.phaseSixCapabilities.machineReadableEvidence || !status.phaseSixCapabilities.alwaysPublishEvidence) throw new Error('Phase 6 capability flags are incomplete.')

console.log('AI Phase 6 CI integration architecture audit passed.')
console.log('Dedicated AI CI quality gate: configured')
console.log('Machine-readable evidence artifact: configured')
console.log('Failure-safe artifact publishing: configured')
console.log('Phase 6: IN_PROGRESS (25%)')
