const fs = require('fs')
const path = require('path')
const { buildAiPhaseSixReadiness } = require('../services/aiPhaseSixReadiness.service')
const { getAiProgramStatus } = require('../services/aiProgramStatus.service')

const projectRoot = path.resolve(__dirname, '..')
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
const workflow = fs.readFileSync(path.join(projectRoot, '.github/workflows/ci.yml'), 'utf8')
const gateScript = fs.readFileSync(path.join(projectRoot, 'scripts/run-ai-ci-quality-gate.js'), 'utf8')
const evidenceVerifier = fs.readFileSync(path.join(projectRoot, 'scripts/verify-ai-ci-evidence.js'), 'utf8')
const evidencePolicy = fs.readFileSync(path.join(projectRoot, 'services/aiCiEvidencePolicy.service.js'), 'utf8')
const comparisonScript = fs.readFileSync(path.join(projectRoot, 'scripts/compare-ai-ci-evidence.js'), 'utf8')
const comparisonService = fs.readFileSync(path.join(projectRoot, 'services/aiCiEvidenceComparison.service.js'), 'utf8')

const requiredWorkflowTokens = [
  'ai-quality-gate:',
  'name: AI Quality Gate',
  'npm run ai:ci:gate',
  'continue-on-error: true',
  'name: Enforce AI release evidence policy',
  'npm run ai:ci:evidence:verify',
  'name: ai-quality-evidence',
  'ai-quality-evidence/phase6-ci-evidence.json',
  'if: always()',
  'GITHUB_STEP_SUMMARY',
  'name: Find previous AI quality evidence run',
  'actions/download-artifact@v4',
  'npm run ai:ci:evidence:compare',
  'phase6-ci-comparison.json',
  'retention-days: 30'
]
for (const token of requiredWorkflowTokens) {
  if (!workflow.includes(token)) throw new Error(`Phase 6 CI workflow token is missing: ${token}`)
}

if (packageJson.scripts['ai:ci:gate'] !== 'node scripts/run-ai-ci-quality-gate.js') throw new Error('AI CI gate package script is missing.')
if (packageJson.scripts['ai:ci:evidence:verify'] !== 'node scripts/verify-ai-ci-evidence.js') throw new Error('AI CI evidence verification package script is missing.')
if (packageJson.scripts['ai:ci:evidence:compare'] !== 'node scripts/compare-ai-ci-evidence.js') throw new Error('AI CI evidence comparison package script is missing.')
if (packageJson.scripts['ai:phase6:audit'] !== 'node scripts/verify-ai-phase6-ci.js') throw new Error('Phase 6 audit package script is missing.')
if (!packageJson.scripts['test:all'].includes('npm run ai:phase6:audit')) throw new Error('test:all does not include the Phase 6 CI architecture audit.')
if (!gateScript.includes("releaseDecision: failedChecks.length === 0 ? 'APPROVED' : 'BLOCKED'")) throw new Error('AI CI evidence does not include a release decision.')
if (!gateScript.includes('phase6-ci-evidence.json')) throw new Error('AI CI evidence artifact path is missing.')
if (!evidenceVerifier.includes('evaluateAiCiReleasePolicy')) throw new Error('AI CI evidence verifier does not enforce the release policy.')
if (!evidencePolicy.includes('REQUIRED_CHECK_IDS')) throw new Error('AI CI evidence policy does not define required checks.')
if (!evidencePolicy.includes("decision: 'BLOCKED'")) throw new Error('AI CI evidence policy does not define a blocking decision.')
if (!comparisonScript.includes('phase6-ci-comparison.json')) throw new Error('AI CI comparison artifact path is missing.')
if (!comparisonService.includes('newFailures') || !comparisonService.includes('resolvedFailures')) throw new Error('AI CI historical comparison does not classify regressions and improvements.')

const readiness = buildAiPhaseSixReadiness()
const status = getAiProgramStatus()
if (readiness.status !== 'COMPLETE' || readiness.percentComplete !== 100) throw new Error('Phase 6 readiness is not synchronized at 100%.')
if (status.currentPhase !== 6 || status.completedPhases !== 6 || status.currentPhasePercentComplete !== 100) throw new Error('AI program status is not synchronized with Phase 6 CI integration.')
if (!status.phaseSixCapabilities.ciQualityGate || !status.phaseSixCapabilities.machineReadableEvidence || !status.phaseSixCapabilities.alwaysPublishEvidence) throw new Error('Phase 6 foundational capability flags are incomplete.')
if (!status.phaseSixCapabilities.evidenceSchemaValidation || !status.phaseSixCapabilities.releaseBlockingPolicy) throw new Error('Phase 6 release enforcement capability flags are incomplete.')
if (!status.phaseSixCapabilities.historicalEvidenceComparison) throw new Error('Phase 6 historical evidence comparison capability is incomplete.')
if (!status.phaseSixCapabilities.qualityConsoleEvidenceIngestion || !status.phaseSixCapabilities.completionAudit || !status.phaseSixCapabilities.phaseSixComplete) throw new Error('Phase 6 Quality Console ingestion and completion flags are incomplete.')

console.log('AI Phase 6 CI integration architecture audit passed.')
console.log('Dedicated AI CI quality gate: configured')
console.log('Machine-readable evidence artifact: configured')
console.log('Strict evidence schema validation: configured')
console.log('Release-blocking evidence policy: configured')
console.log('Failure-safe artifact publishing: configured')
console.log('Historical evidence retention and comparison: configured')
console.log('Quality Console CI evidence ingestion: configured')
console.log('Phase 6: COMPLETE (100%)')
