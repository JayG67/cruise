const fs = require('fs')
const path = require('path')
const { compareAiCiEvidence } = require('../services/aiCiEvidenceComparison.service')

const projectRoot = path.resolve(__dirname, '..')
const evidenceDirectory = path.join(projectRoot, 'ai-quality-evidence')
const currentPath = path.join(evidenceDirectory, 'phase6-ci-evidence.json')
const baselinePath = path.join(evidenceDirectory, 'baseline', 'phase6-ci-evidence.json')
const comparisonPath = path.join(evidenceDirectory, 'phase6-ci-comparison.json')

function readJson(filePath, required) {
  if (!fs.existsSync(filePath)) {
    if (required) throw new Error(`Required evidence file is missing: ${path.relative(projectRoot, filePath)}`)
    return null
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    if (required) throw new Error(`Evidence file is not valid JSON: ${error.message}`)
    return { invalidBaselineJson: true, error: error.message }
  }
}

try {
  const currentEvidence = readJson(currentPath, true)
  const baselineEvidence = readJson(baselinePath, false)
  const comparison = compareAiCiEvidence(currentEvidence, baselineEvidence)
  const output = {
    schemaVersion: 1,
    phase: 6,
    generatedAt: new Date().toISOString(),
    ...comparison
  }

  fs.mkdirSync(evidenceDirectory, { recursive: true })
  fs.writeFileSync(comparisonPath, `${JSON.stringify(output, null, 2)}\n`)

  console.log(`AI CI evidence comparison written to ${path.relative(projectRoot, comparisonPath)}`)
  console.log(`Comparison outcome: ${output.outcome}`)
  console.log(`New failures: ${output.newFailures.length}`)
  console.log(`Resolved failures: ${output.resolvedFailures.length}`)

  if (!output.valid) process.exitCode = 1
} catch (error) {
  console.error(`AI CI evidence comparison failed: ${error.message}`)
  process.exitCode = 1
}
