function clampScore(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function nonNegativeNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.max(numeric, 0) : 0
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeStatus(value = '', fallback = 'NEEDS REVIEW') {
  return String(value || fallback).trim().replace(/_/g, ' ')
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return ''
}

function countOpen(items = [], closedStatuses = []) {
  const closed = new Set(asArray(closedStatuses).map(status => String(status).trim().toUpperCase()))
  return asArray(items).filter(item => !closed.has(String(item?.status || '').trim().toUpperCase())).length
}

function buildOperationalReviewScores(options = {}) {
  const { lifecycleState = null, releasePacket = null, executiveBrief = null, operationalAssurancePacket = null, launchPlan = null, productionReadiness = null, operationalReleaseDossier = null } = asObject(options)
  return {
    lifecycleScore: clampScore(lifecycleState?.completionPercent),
    releaseScore: clampScore(releasePacket?.readinessScore),
    executiveScore: clampScore(executiveBrief?.readiness?.readinessScore),
    assuranceScore: clampScore(operationalAssurancePacket?.readiness?.readinessScore),
    launchScore: clampScore(launchPlan?.launchReadiness?.launchScore),
    productionScore: clampScore(productionReadiness?.readiness?.readinessScore),
    dossierScore: clampScore(operationalReleaseDossier?.readiness?.readinessScore)
  }
}

function buildOperationalReviewSequence(options = {}) {
  const { operation = {}, lifecycleState = null, releasePacket = null, operationalAssurancePacket = null, managementStatus = null } = asObject(options)
  const safeOperation = asObject(operation)
  const operationTitle = firstNonEmpty(safeOperation.title, safeOperation.ship?.name && `${safeOperation.ship.name} turnaround`, 'Selected ship turnaround')
  const blockers = asArray(lifecycleState?.finalBlockers)
  const firstBlocker = blockers[0]
  const nextSlice = asArray(managementStatus?.nextSlices)[0]
  const blockerType = firstNonEmpty(firstBlocker?.type, 'Operational blocker')
  const blockerLabel = firstNonEmpty(firstBlocker?.label, firstBlocker?.title, 'Review required')

  return [
    { id: 'admin-setup', label: 'Confirm operational setup', duration: 'Step 1', status: 'READY', detail: `Review scoped people, assignment rules, and ${operationTitle}.` },
    { id: 'role-work', label: 'Review department execution', duration: 'Step 2', status: blockers.length > 0 ? 'WATCH' : 'READY', detail: firstBlocker ? `Address ${blockerType}: ${blockerLabel}.` : 'Review department tasks, staffing, handoffs, dependencies, and signoffs.' },
    { id: 'manager-command', label: 'Assess command readiness', duration: 'Step 3', status: String(releasePacket?.releaseStatus || '').trim().toUpperCase() === 'READY' ? 'READY' : 'WATCH', detail: `${clampScore(lifecycleState?.completionPercent)}% lifecycle completion and ${clampScore(releasePacket?.readinessScore)}% release readiness summarize command status.` },
    { id: 'assurance-evidence', label: 'Validate assurance evidence', duration: 'Step 4', status: clampScore(operationalAssurancePacket?.readiness?.readinessScore) >= 80 ? 'READY' : 'WATCH', detail: firstNonEmpty(operationalAssurancePacket?.narrative?.summary, lifecycleState?.completionLanguage, 'Operational assurance converts current state into auditable evidence.') },
    { id: 'release-decision', label: 'Record the release decision', duration: 'Step 5', status: clampScore(managementStatus?.maturityScore) >= 80 ? 'READY' : 'WATCH', detail: firstNonEmpty(nextSlice, managementStatus?.continuationSummary?.recommendedNext, 'Confirm automated workflow coverage and record remaining watch items.') }
  ]
}

function buildOperationalReviewFocus(options = {}) {
  const { tasks = [], escalations = [], dependencies = [], handoffs = [], signoffs = [], staffing = [], lifecycleState = null } = asObject(options)
  const blockedTasks = asArray(tasks).filter(task => String(task?.status || '').trim().toUpperCase() === 'BLOCKED' || task?.blocker || task?.blockerReason)
  const openEscalations = asArray(escalations).filter(escalation => String(escalation?.status || '').trim().toUpperCase() !== 'RESOLVED')
  const openDependencies = countOpen(dependencies, ['CLEARED', 'COMPLETE', 'RESOLVED'])
  const openHandoffs = countOpen(handoffs, ['COMPLETE', 'COMPLETED', 'CLEARED'])
  const pendingSignoffs = countOpen(signoffs, ['APPROVED', 'SIGNED'])
  const staffingGaps = asArray(staffing).reduce((sum, row) => sum + Math.max(nonNegativeNumber(row?.plannedCount) - nonNegativeNumber(row?.checkedInCount), 0), 0)
  const blockedTaskName = firstNonEmpty(blockedTasks[0]?.taskName, blockedTasks[0]?.title, 'Blocked task')
  const escalationTitle = firstNonEmpty(openEscalations[0]?.title, 'Operational escalation')
  return {
    priority: blockedTasks[0] ? `Resolve blocked task: ${blockedTaskName}.` : openEscalations[0] ? `Resolve escalation: ${escalationTitle}.` : firstNonEmpty(lifecycleState?.nextBestAction, 'Continue toward final operational readiness.'),
    reviewSignals: [`${blockedTasks.length} blocked task${blockedTasks.length === 1 ? '' : 's'}`, `${openEscalations.length} open escalation${openEscalations.length === 1 ? '' : 's'}`, `${openDependencies} open dependenc${openDependencies === 1 ? 'y' : 'ies'}`, `${openHandoffs} open handoff${openHandoffs === 1 ? '' : 's'}`, `${pendingSignoffs} pending signoff${pendingSignoffs === 1 ? '' : 's'}`, `${staffingGaps} staffing gap${staffingGaps === 1 ? '' : 's'}`],
    reviewFirst: ['Role and assignment scope', 'Lifecycle phase board', 'Release board and next action', 'Operational assurance evidence', 'Automated lifecycle contract']
  }
}

function buildOperationalReviewRisks(options = {}) {
  const { lifecycleState = null, operationalAssurancePacket = null, productionReadiness = null, managementStatus = null } = asObject(options)
  const risks = []
  const lifecycleBlockers = asArray(lifecycleState?.finalBlockers)
  const productionBlockers = asArray(productionReadiness?.blockers)
  if (lifecycleBlockers.length > 0) risks.push({ id: 'lifecycle-blockers', label: 'Lifecycle blockers remain', mitigation: firstNonEmpty(lifecycleState?.nextBestAction, 'Resolve the first blocker.') })
  if (nonNegativeNumber(operationalAssurancePacket?.dataQuality?.blockerCount) > 0) risks.push({ id: 'assurance-data-quality', label: 'Assurance data quality needs cleanup', mitigation: 'Review the operational assurance quality snapshot before approval.' })
  if (productionBlockers.length > 0) risks.push({ id: 'production-readiness', label: 'Production readiness blockers exist', mitigation: firstNonEmpty(productionBlockers[0]?.detail, 'Address the highest-priority production blocker.') })
  const highPriority = asArray(managementStatus?.remainingWork).find(item => String(item?.priority || '').trim().toUpperCase() === 'HIGH')
  if (highPriority) risks.push({ id: 'management-work', label: firstNonEmpty(highPriority.label, 'High-priority management work remains'), mitigation: firstNonEmpty(highPriority.detail, 'Complete the next assurance action before release approval.') })
  return risks.length ? risks : [{ id: 'review-ready', label: 'No critical operational review risks surfaced', mitigation: 'Complete the review sequence and record the release decision.' }]
}

function buildTurnaroundOperationalReview(input = {}) {
  const normalizedInput = asObject(input)
  const scores = buildOperationalReviewScores(normalizedInput)
  const averageScore = clampScore(Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length)
  const risks = buildOperationalReviewRisks(normalizedInput)
  const status = averageScore >= 85 && risks.length === 1 && risks[0].id === 'review-ready' ? 'REVIEW_READY' : averageScore >= 70 ? 'REVIEW_HARDENING' : 'NEEDS_FOCUS'
  return {
    status,
    averageScore,
    headline: status === 'REVIEW_READY' ? 'Turnaround operations are ready for final operational review.' : status === 'REVIEW_HARDENING' ? 'Turnaround operations are close; complete the listed review items.' : 'Turnaround operations need focused workflow progress before approval.',
    purpose: 'Assess operational setup, role execution, lifecycle progress, assurance evidence, and release readiness.',
    scores,
    reviewSequence: buildOperationalReviewSequence(normalizedInput),
    focus: buildOperationalReviewFocus(normalizedInput),
    risks,
    recommendation: status === 'REVIEW_READY' ? 'Record the release decision and transition to routine maintenance.' : 'Resolve the listed risks, rerun the lifecycle workflow, and repeat the operational review.'
  }
}

module.exports = { buildTurnaroundOperationalReview, buildOperationalReviewScores, buildOperationalReviewSequence, buildOperationalReviewFocus, buildOperationalReviewRisks, clampScore, normalizeStatus }
