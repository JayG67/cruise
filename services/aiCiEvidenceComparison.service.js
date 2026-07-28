const { validateAiCiEvidence } = require('./aiCiEvidencePolicy.service')

function getFailedCheckIds(evidence) {
  return new Set((evidence.checks || [])
    .filter(check => check && check.status === 'FAILED')
    .map(check => check.id))
}

function summarizeEvidence(evidence) {
  return {
    generatedAt: evidence.generatedAt || null,
    releaseDecision: evidence.releaseDecision,
    status: evidence.status,
    totalChecks: evidence.totalChecks,
    passedChecks: evidence.passedChecks,
    failedChecks: evidence.failedChecks,
    git: evidence.git || {}
  }
}

function compareAiCiEvidence(currentEvidence, baselineEvidence) {
  const currentValidation = validateAiCiEvidence(currentEvidence)
  if (!currentValidation.valid) {
    return {
      valid: false,
      baselineStatus: 'UNAVAILABLE',
      outcome: 'INVALID_CURRENT_EVIDENCE',
      issues: currentValidation.issues,
      newFailures: [],
      resolvedFailures: [],
      unchangedFailures: [],
      checkComparisons: []
    }
  }

  if (!baselineEvidence) {
    return {
      valid: true,
      baselineStatus: 'UNAVAILABLE',
      outcome: 'FIRST_RUN',
      issues: [],
      current: summarizeEvidence(currentEvidence),
      baseline: null,
      decisionChanged: false,
      newFailures: [],
      resolvedFailures: [],
      unchangedFailures: [],
      checkComparisons: currentEvidence.checks.map(check => ({
        id: check.id,
        baselineStatus: 'NOT_AVAILABLE',
        currentStatus: check.status,
        change: 'NOT_COMPARABLE'
      }))
    }
  }

  const baselineValidation = validateAiCiEvidence(baselineEvidence)
  if (!baselineValidation.valid) {
    return {
      valid: true,
      baselineStatus: 'INVALID',
      outcome: 'BASELINE_INVALID',
      issues: baselineValidation.issues,
      current: summarizeEvidence(currentEvidence),
      baseline: null,
      decisionChanged: false,
      newFailures: [],
      resolvedFailures: [],
      unchangedFailures: [],
      checkComparisons: []
    }
  }

  const currentFailures = getFailedCheckIds(currentEvidence)
  const baselineFailures = getFailedCheckIds(baselineEvidence)
  const newFailures = [...currentFailures].filter(id => !baselineFailures.has(id)).sort()
  const resolvedFailures = [...baselineFailures].filter(id => !currentFailures.has(id)).sort()
  const unchangedFailures = [...currentFailures].filter(id => baselineFailures.has(id)).sort()
  const baselineById = new Map(baselineEvidence.checks.map(check => [check.id, check]))
  const checkComparisons = currentEvidence.checks.map(check => {
    const baselineCheck = baselineById.get(check.id)
    return {
      id: check.id,
      baselineStatus: baselineCheck ? baselineCheck.status : 'NOT_AVAILABLE',
      currentStatus: check.status,
      change: !baselineCheck
        ? 'NEW_CHECK'
        : baselineCheck.status === check.status
          ? 'UNCHANGED'
          : `${baselineCheck.status}_TO_${check.status}`
    }
  })

  let outcome = 'STABLE'
  if (newFailures.length > 0) outcome = 'REGRESSION'
  else if (resolvedFailures.length > 0) outcome = 'IMPROVEMENT'
  else if (currentEvidence.releaseDecision !== baselineEvidence.releaseDecision) outcome = 'DECISION_CHANGED'

  return {
    valid: true,
    baselineStatus: 'AVAILABLE',
    outcome,
    issues: [],
    current: summarizeEvidence(currentEvidence),
    baseline: summarizeEvidence(baselineEvidence),
    decisionChanged: currentEvidence.releaseDecision !== baselineEvidence.releaseDecision,
    newFailures,
    resolvedFailures,
    unchangedFailures,
    checkComparisons
  }
}

module.exports = { compareAiCiEvidence }
