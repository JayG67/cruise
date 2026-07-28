const fs = require('fs')
const path = require('path')

const DEFAULT_EVIDENCE_DIR = path.resolve(__dirname, '..', 'ai-quality-evidence')

function readJson(filePath) {
  try {
    return { state: 'AVAILABLE', data: JSON.parse(fs.readFileSync(filePath, 'utf8')) }
  } catch (error) {
    if (error.code === 'ENOENT') return { state: 'NO_DATA', data: null }
    return { state: 'INVALID', data: null, error: error.message }
  }
}

function buildAiCiEvidenceConsoleSummary({ evidenceDir = DEFAULT_EVIDENCE_DIR } = {}) {
  const evidence = readJson(path.join(evidenceDir, 'phase6-ci-evidence.json'))
  const comparison = readJson(path.join(evidenceDir, 'phase6-ci-comparison.json'))
  const releaseDecision = evidence.data?.releaseDecision || 'NO_DATA'
  const checks = Array.isArray(evidence.data?.checks) ? evidence.data.checks : []
  return {
    state: evidence.state,
    releaseDecision,
    generatedAt: evidence.data?.generatedAt || null,
    totals: evidence.data?.totals || { checks: checks.length, passed: checks.filter(item => item.status === 'PASSED').length, failed: checks.filter(item => item.status !== 'PASSED').length },
    checks,
    comparison: {
      state: comparison.state,
      outcome: comparison.data?.outcome || (comparison.state === 'NO_DATA' ? 'NO_BASELINE' : 'INVALID'),
      newFailures: comparison.data?.newFailures || [],
      resolvedFailures: comparison.data?.resolvedFailures || [],
      unchangedFailures: comparison.data?.unchangedFailures || []
    },
    message: evidence.state === 'AVAILABLE'
      ? 'Current CI evidence is available.'
      : evidence.state === 'NO_DATA'
        ? 'No CI evidence artifact is available in this runtime.'
        : 'The CI evidence artifact could not be parsed.',
    error: evidence.error || comparison.error || null
  }
}

module.exports = { DEFAULT_EVIDENCE_DIR, buildAiCiEvidenceConsoleSummary }
