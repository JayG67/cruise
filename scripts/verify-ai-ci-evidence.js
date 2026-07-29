const fs = require('fs')
const path = require('path')
const { evaluateAiCiReleasePolicy } = require('../services/aiCiEvidencePolicy.service')

const projectRoot = path.resolve(__dirname, '..')
const artifactPath = path.join(projectRoot, 'ai-quality-evidence', 'phase6-ci-evidence.json')

if (!fs.existsSync(artifactPath)) {
  console.error('AI CI release decision: BLOCKED')
  console.error('Evidence artifact is missing: ai-quality-evidence/phase6-ci-evidence.json')
  process.exit(1)
}

let evidence
try {
  evidence = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
} catch (error) {
  console.error('AI CI release decision: BLOCKED')
  console.error(`Evidence artifact is not valid JSON: ${error.message}`)
  process.exit(1)
}

const policy = evaluateAiCiReleasePolicy(evidence)
console.log(`AI CI release decision: ${policy.decision}`)
console.log(policy.reason)

if (policy.issues.length > 0) {
  for (const issue of policy.issues) console.error(`- ${issue}`)
}

if (!policy.allowed) process.exitCode = 1
