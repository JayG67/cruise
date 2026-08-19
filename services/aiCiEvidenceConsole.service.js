const fs = require('fs')
const path = require('path')

const DEFAULT_EVIDENCE_DIR = path.resolve(__dirname, '..', 'ai-quality-evidence')

function readJson(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { state: 'INVALID', data: null, error: 'Evidence JSON must contain an object.' }
    return { state: 'AVAILABLE', data }
  } catch (error) {
    if (error.code === 'ENOENT') return { state: 'NO_DATA', data: null }
    return { state: 'INVALID', data: null, error: error.message }
  }
}

function buildAiCiEvidenceConsoleSummary({ evidenceDir = DEFAULT_EVIDENCE_DIR } = {}) {
  const evidence = readJson(path.join(evidenceDir, 'phase6-ci-evidence.json'))
  const comparison = readJson(path.join(evidenceDir, 'phase6-ci-comparison.json'))
  const releaseDecision = typeof evidence.data?.releaseDecision === 'string' && evidence.data.releaseDecision.trim() ? evidence.data.releaseDecision.trim() : 'NO_DATA'
  const checks = Array.isArray(evidence.data?.checks) ? evidence.data.checks.filter(item => item && typeof item === 'object' && !Array.isArray(item)) : []
  const passed = checks.filter(item => item.status === 'PASSED').length
  return {
    state: evidence.state,
    releaseDecision,
    generatedAt: typeof evidence.data?.generatedAt === 'string' && evidence.data.generatedAt.trim() ? evidence.data.generatedAt : null,
    totals: { checks: checks.length, passed, failed: checks.length - passed },
    checks,
    comparison: {
      state: comparison.state,
      outcome: typeof comparison.data?.outcome === 'string' && comparison.data.outcome.trim()
        ? comparison.data.outcome.trim()
        : comparison.state === 'NO_DATA' ? 'NO_BASELINE' : 'INVALID',
      newFailures: Array.isArray(comparison.data?.newFailures) ? comparison.data.newFailures : [],
      resolvedFailures: Array.isArray(comparison.data?.resolvedFailures) ? comparison.data.resolvedFailures : [],
      unchangedFailures: Array.isArray(comparison.data?.unchangedFailures) ? comparison.data.unchangedFailures : []
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
