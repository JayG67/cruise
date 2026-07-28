const REQUIRED_CHECK_IDS = Object.freeze([
  'phase-1-foundation',
  'phase-2-briefing',
  'phase-3-evaluation',
  'phase-4-quality-console',
  'phase-5-adversarial-audit',
  'phase-5-completion',
  'ai-regression-tests'
])

function validateAiCiEvidence(evidence) {
  const issues = []

  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    return { valid: false, issues: ['Evidence must be a JSON object.'] }
  }

  if (evidence.schemaVersion !== 1) issues.push('schemaVersion must equal 1.')
  if (evidence.phase !== 6) issues.push('phase must equal 6.')
  if (evidence.gate !== 'AI CI quality gate') issues.push('gate must identify the AI CI quality gate.')
  if (!['PASSED', 'FAILED'].includes(evidence.status)) issues.push('status must be PASSED or FAILED.')
  if (!['APPROVED', 'BLOCKED'].includes(evidence.releaseDecision)) issues.push('releaseDecision must be APPROVED or BLOCKED.')
  if (!Array.isArray(evidence.checks)) issues.push('checks must be an array.')

  const checks = Array.isArray(evidence.checks) ? evidence.checks : []
  const checkIds = new Set(checks.map(check => check && check.id))
  for (const requiredId of REQUIRED_CHECK_IDS) {
    if (!checkIds.has(requiredId)) issues.push(`Required check is missing: ${requiredId}.`)
  }

  for (const check of checks) {
    if (!check || typeof check !== 'object') {
      issues.push('Every check must be an object.')
      continue
    }
    if (typeof check.id !== 'string' || check.id.length === 0) issues.push('Every check must have an id.')
    if (!['PASSED', 'FAILED'].includes(check.status)) issues.push(`Check ${check.id || 'unknown'} has an invalid status.`)
    if (!Number.isInteger(check.exitCode) || check.exitCode < 0) issues.push(`Check ${check.id || 'unknown'} has an invalid exitCode.`)
  }

  const passedChecks = checks.filter(check => check && check.status === 'PASSED').length
  const failedChecks = checks.filter(check => check && check.status === 'FAILED').length

  if (evidence.totalChecks !== checks.length) issues.push('totalChecks does not match the checks array.')
  if (evidence.passedChecks !== passedChecks) issues.push('passedChecks does not match the checks array.')
  if (evidence.failedChecks !== failedChecks) issues.push('failedChecks does not match the checks array.')

  const expectedStatus = failedChecks === 0 ? 'PASSED' : 'FAILED'
  const expectedDecision = failedChecks === 0 ? 'APPROVED' : 'BLOCKED'
  if (evidence.status !== expectedStatus) issues.push(`status must be ${expectedStatus} for the recorded checks.`)
  if (evidence.releaseDecision !== expectedDecision) issues.push(`releaseDecision must be ${expectedDecision} for the recorded checks.`)

  return { valid: issues.length === 0, issues }
}

function evaluateAiCiReleasePolicy(evidence) {
  const validation = validateAiCiEvidence(evidence)
  if (!validation.valid) {
    return {
      allowed: false,
      decision: 'BLOCKED',
      reason: 'AI CI evidence is missing or invalid.',
      issues: validation.issues
    }
  }

  if (evidence.releaseDecision !== 'APPROVED') {
    return {
      allowed: false,
      decision: 'BLOCKED',
      reason: 'One or more required AI quality checks failed.',
      issues: []
    }
  }

  return {
    allowed: true,
    decision: 'APPROVED',
    reason: 'All required AI quality checks passed with valid evidence.',
    issues: []
  }
}

module.exports = {
  REQUIRED_CHECK_IDS,
  validateAiCiEvidence,
  evaluateAiCiReleasePolicy
}
