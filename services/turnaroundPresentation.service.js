function clampScore(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function normalizeStatus(value = '', fallback = 'NEEDS REVIEW') {
  return String(value || fallback).replace(/_/g, ' ')
}

function firstNonEmpty(...values) {
  return values.find(value => String(value || '').trim()) || ''
}

function countOpen(items = [], closedStatuses = []) {
  const closed = new Set(closedStatuses.map(status => String(status).toUpperCase()))
  return items.filter(item => !closed.has(String(item.status || '').toUpperCase())).length
}

function buildPresentationScores({ lifecycleState = null, releasePacket = null, executiveBrief = null, reviewerPacket = null, launchPlan = null, productionReadiness = null, applicationDossier = null } = {}) {
  return {
    lifecycleScore: clampScore(lifecycleState?.completionPercent),
    releaseScore: clampScore(releasePacket?.readinessScore),
    executiveScore: clampScore(executiveBrief?.readiness?.readinessScore),
    reviewerScore: clampScore(reviewerPacket?.readiness?.readinessScore),
    launchScore: clampScore(launchPlan?.launchReadiness?.launchScore),
    productionScore: clampScore(productionReadiness?.readiness?.readinessScore),
    dossierScore: clampScore(applicationDossier?.readiness?.readinessScore)
  }
}

function buildDemoStoryline({ operation = {}, lifecycleState = null, releasePacket = null, reviewerPacket = null, managementStatus = null } = {}) {
  const operationTitle = operation.title || `${operation.ship?.name || 'Selected ship'} turnaround`
  const blockers = lifecycleState?.finalBlockers || []
  const firstBlocker = blockers[0]
  const nextSlice = managementStatus?.nextSlices?.[0]

  return [
    {
      id: 'admin-setup',
      label: 'Admin sets up operations',
      duration: '0:00-1:00',
      status: 'READY',
      detail: `Open the admin setup board, show scoped people and assignment rules, then select ${operationTitle}.`
    },
    {
      id: 'role-work',
      label: 'Roles execute the turnaround',
      duration: '1:00-2:30',
      status: blockers.length > 0 ? 'WATCH' : 'READY',
      detail: firstBlocker
        ? `Drive the first blocker live: ${firstBlocker.type} - ${firstBlocker.label}.`
        : 'Show department tasks, staffing, handoffs, dependencies, and signoffs moving toward completion.'
    },
    {
      id: 'manager-command',
      label: 'Manager sees progress',
      duration: '2:30-3:30',
      status: releasePacket?.releaseStatus === 'READY' ? 'READY' : 'WATCH',
      detail: `${clampScore(lifecycleState?.completionPercent)}% lifecycle completion and ${clampScore(releasePacket?.readinessScore)}% release readiness tell the command story.`
    },
    {
      id: 'readiness-proof',
      label: 'Readiness becomes provable',
      duration: '3:30-4:30',
      status: reviewerPacket?.readiness?.readinessScore >= 80 ? 'READY' : 'WATCH',
      detail: firstNonEmpty(reviewerPacket?.narrative?.summary, lifecycleState?.completionLanguage, 'Reviewer packet converts operational state into proof points.')
    },
    {
      id: 'portfolio-close',
      label: 'Close with employer value',
      duration: '4:30-5:00',
      status: managementStatus?.maturityScore >= 80 ? 'READY' : 'WATCH',
      detail: firstNonEmpty(nextSlice, managementStatus?.continuationSummary?.recommendedNext, 'Explain that Cypress owns the complete workflow and Playwright stays focused on responsive smoke coverage.')
    }
  ]
}

function buildPresentationFocus({ tasks = [], escalations = [], dependencies = [], handoffs = [], signoffs = [], staffing = [], lifecycleState = null } = {}) {
  const blockedTasks = tasks.filter(task => String(task.status || '').toUpperCase() === 'BLOCKED' || task.blocker || task.blockerReason)
  const openEscalations = escalations.filter(escalation => String(escalation.status || '').toUpperCase() !== 'RESOLVED')
  const openDependencies = countOpen(dependencies, ['CLEARED', 'COMPLETE', 'RESOLVED'])
  const openHandoffs = countOpen(handoffs, ['COMPLETE', 'COMPLETED', 'CLEARED'])
  const pendingSignoffs = countOpen(signoffs, ['APPROVED', 'SIGNED'])
  const staffingGaps = staffing.reduce((sum, row) => sum + Math.max(Number(row.plannedCount || 0) - Number(row.checkedInCount || 0), 0), 0)

  const priority = blockedTasks[0]
    ? `Resolve blocked task: ${blockedTasks[0].taskName}.`
    : openEscalations[0]
      ? `Resolve escalation: ${openEscalations[0].title}.`
      : lifecycleState?.nextBestAction || 'Keep the current role workflow moving toward final readiness.'

  return {
    priority,
    talkingPoints: [
      `${blockedTasks.length} blocked task${blockedTasks.length === 1 ? '' : 's'}`,
      `${openEscalations.length} open escalation${openEscalations.length === 1 ? '' : 's'}`,
      `${openDependencies} open dependenc${openDependencies === 1 ? 'y' : 'ies'}`,
      `${openHandoffs} open handoff${openHandoffs === 1 ? '' : 's'}`,
      `${pendingSignoffs} pending signoff${pendingSignoffs === 1 ? '' : 's'}`,
      `${staffingGaps} staffing gap${staffingGaps === 1 ? '' : 's'}`
    ],
    showFirst: [
      'Role selector scoped to cruise line and ship',
      'Lifecycle phase board',
      'Release board and next best action',
      'Reviewer packet proof points',
      'Cypress lifecycle contract'
    ]
  }
}

function buildPresentationRisks({ lifecycleState = null, reviewerPacket = null, productionReadiness = null, managementStatus = null } = {}) {
  const risks = []

  if ((lifecycleState?.finalBlockers || []).length > 0) {
    risks.push({
      id: 'lifecycle-blockers',
      label: 'Lifecycle blockers remain',
      mitigation: lifecycleState.nextBestAction || 'Use the role dashboard to resolve the first blocker.'
    })
  }

  if ((reviewerPacket?.dataQuality?.blockerCount || 0) > 0) {
    risks.push({
      id: 'reviewer-data-quality',
      label: 'Reviewer data quality needs cleanup',
      mitigation: 'Use the reviewer packet quality snapshot before presenting the demo.'
    })
  }

  if ((productionReadiness?.blockers || []).length > 0) {
    risks.push({
      id: 'production-readiness',
      label: 'Production readiness blockers exist',
      mitigation: productionReadiness.blockers[0]?.detail || 'Address the highest priority production readiness blocker.'
    })
  }

  if ((managementStatus?.remainingWork || []).some(item => String(item.priority || '').toUpperCase() === 'HIGH')) {
    const highPriority = managementStatus.remainingWork.find(item => String(item.priority || '').toUpperCase() === 'HIGH')
    risks.push({
      id: 'management-work',
      label: highPriority?.label || 'High-priority management work remains',
      mitigation: highPriority?.detail || 'Finish the next hardening item before freezing turnaround management.'
    })
  }

  return risks.length > 0 ? risks : [{
    id: 'presentation-ready',
    label: 'No critical demo risks surfaced',
    mitigation: 'Use the five-minute run of show and then freeze turnaround expansion.'
  }]
}

function buildTurnaroundPresentationGuide(input = {}) {
  const scores = buildPresentationScores(input)
  const averageScore = clampScore(Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length)
  const risks = buildPresentationRisks(input)
  const status = averageScore >= 85 && risks.length === 1 && risks[0].id === 'presentation-ready'
    ? 'DEMO_READY'
    : averageScore >= 70
      ? 'PRESENTATION_HARDENING'
      : 'NEEDS_FOCUS'

  return {
    status,
    averageScore,
    headline: status === 'DEMO_READY'
      ? 'Turnaround management is ready for the five-minute employer demo.'
      : status === 'PRESENTATION_HARDENING'
        ? 'Turnaround management is close; use this guide to keep the demo tight.'
        : 'Turnaround management needs focused workflow progress before a demo.',
    positioning: 'Show a realistic cruise-line operating system: admin setup, scoped role execution, lifecycle progress, and reviewer-ready proof.',
    scores,
    storyline: buildDemoStoryline(input),
    focus: buildPresentationFocus(input),
    risks,
    freezeRecommendation: status === 'DEMO_READY'
      ? 'Freeze turnaround feature expansion and begin cross-app UX cleanup.'
      : 'Finish the listed risks, rerun the Cypress lifecycle workflow, then freeze turnaround expansion.'
  }
}

module.exports = {
  buildTurnaroundPresentationGuide,
  buildPresentationScores,
  buildDemoStoryline,
  buildPresentationFocus,
  buildPresentationRisks,
  clampScore,
  normalizeStatus
}
