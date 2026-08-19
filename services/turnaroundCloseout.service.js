function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeStatus(value, fallback = 'REVIEW') {
  return String(value || fallback).replace(/_/g, ' ').trim()
}

function countWhere(rows, predicate) {
  return asArray(rows).filter(predicate).length
}

function isCompleteStatus(value) {
  return ['DONE', 'COMPLETE', 'COMPLETED', 'APPROVED', 'RESOLVED', 'CLOSED', 'CLEARED'].includes(String(value || '').toUpperCase())
}

function isOpenEscalation(value) {
  return !['RESOLVED', 'CLOSED'].includes(String(value || '').toUpperCase())
}

function buildCloseoutInputs({
  operation = {},
  tasks = [],
  staffing = [],
  signoffs = [],
  escalations = [],
  dependencies = [],
  handoffs = [],
  auditEvents = [],
  lifecycleState = null,
  releasePacket = null,
  operationalTimeline = null,
  operationalMetrics = null,
  afterActionReview = null,
  executiveBrief = null,
  reviewerPacket = null,
  managementStatus = null,
  launchPlan = null,
  scenarioPlan = null,
  productionReadiness = null,
  applicationDossier = null,
  presentationGuide = null
} = {}) {
  operation = operation || {}
  const taskRows = asArray(tasks)
  const signoffRows = asArray(signoffs)
  const staffingRows = asArray(staffing)
  const dependencyRows = asArray(dependencies)
  const handoffRows = asArray(handoffs)
  const escalationRows = asArray(escalations)

  const completeTasks = countWhere(taskRows, task => isCompleteStatus(task.status))
  const approvedSignoffs = countWhere(signoffRows, signoff => String(signoff.status || '').toUpperCase() === 'APPROVED')
  const staffingGaps = countWhere(staffingRows, row => Number(row.requiredCount || row.required || 0) > Number(row.assignedCount || row.assigned || 0))
  const openDependencies = countWhere(dependencyRows, dependency => !isCompleteStatus(dependency.status))
  const incompleteHandoffs = countWhere(handoffRows, handoff => !isCompleteStatus(handoff.status))
  const openEscalations = countWhere(escalationRows, escalation => isOpenEscalation(escalation.status))
  const blockedTasks = countWhere(taskRows, task => ['BLOCKED', 'AT_RISK'].includes(String(task.status || '').toUpperCase()) || task.blockerReason)
  const totalTasks = taskRows.length
  const totalSignoffs = signoffRows.length

  return {
    operationId: operation.id || null,
    operationTitle: operation.title || operation.operationName || 'Selected turnaround operation',
    shipName: operation.shipName || operation.ship?.name || 'Selected ship',
    cruiseLineName: operation.cruiseLineName || operation.cruiseLine?.name || 'Selected cruise line',
    turnaroundDate: operation.turnaroundDate || operation.date || 'Selected turnaround',
    lifecycleScore: clampScore(lifecycleState?.completionPercent ?? 0),
    releaseScore: clampScore(releasePacket?.readinessScore ?? releasePacket?.releaseScore ?? operationalMetrics?.summary?.releaseConfidence ?? 0),
    managementScore: clampScore(managementStatus?.maturityScore ?? 0),
    productionScore: clampScore(productionReadiness?.productionScore ?? 0),
    dossierScore: clampScore(applicationDossier?.dossierScore ?? 0),
    reviewerScore: clampScore(reviewerPacket?.readiness?.readinessScore ?? 0),
    launchScore: clampScore(launchPlan?.launchScore ?? 0),
    scenarioScore: clampScore(scenarioPlan?.resilienceScore ?? 0),
    afterActionScore: clampScore(afterActionReview?.summary?.reviewScore ?? executiveBrief?.summary?.reviewScore ?? 0),
    presentationScore: clampScore(presentationGuide?.averageScore ?? 0),
    timelineEvents: Number(operationalTimeline?.summary?.totalEvents ?? operationalTimeline?.items?.length ?? 0),
    auditEventCount: asArray(auditEvents).length,
    completeTasks,
    totalTasks,
    taskCompletion: totalTasks ? clampScore((completeTasks / totalTasks) * 100) : 0,
    approvedSignoffs,
    totalSignoffs,
    signoffCompletion: totalSignoffs ? clampScore((approvedSignoffs / totalSignoffs) * 100) : 0,
    staffingGaps,
    openDependencies,
    incompleteHandoffs,
    openEscalations,
    blockedTasks,
    remainingWork: asArray(managementStatus?.remainingWork),
    productionBlockers: asArray(productionReadiness?.blockers),
    afterActionFindings: asArray(afterActionReview?.findings),
    followUpActions: asArray(afterActionReview?.followUpActions),
    launchStatus: normalizeStatus(launchPlan?.launchStatus, 'REVIEW'),
    managementStatus: normalizeStatus(managementStatus?.maturityStatus, 'IMPROVEMENT IN PROGRESS'),
    productionStatus: normalizeStatus(productionReadiness?.productionStatus, 'ACTION REQUIRED'),
    dossierStatus: normalizeStatus(applicationDossier?.dossierStatus, 'EVIDENCE REQUIRED')
  }
}

function buildCloseoutGates(inputs = {}) {
  const gates = [
    ['lifecycle-complete', 'Lifecycle complete', inputs.lifecycleScore, `${inputs.lifecycleScore}% lifecycle completion with ${inputs.blockedTasks} blocked or at-risk task signal${inputs.blockedTasks === 1 ? '' : 's'}.`],
    ['release-ready', 'Release ready', inputs.releaseScore, `${inputs.releaseScore}% release readiness for ${inputs.shipName}.`],
    ['workflow-closed', 'Workflow closed', Math.round((inputs.taskCompletion + inputs.signoffCompletion) / 2), `${inputs.completeTasks}/${inputs.totalTasks} tasks complete and ${inputs.approvedSignoffs}/${inputs.totalSignoffs} signoffs approved.`],
    ['operational-risk-clear', 'Operational risk clear', clampScore(100 - ((inputs.openEscalations * 15) + (inputs.openDependencies * 10) + (inputs.incompleteHandoffs * 8) + (inputs.staffingGaps * 8))), `${inputs.openEscalations} open escalations, ${inputs.openDependencies} dependencies, ${inputs.incompleteHandoffs} handoffs, and ${inputs.staffingGaps} staffing gaps remain.`],
    ['production-readiness', 'Production readiness', inputs.productionScore, `${inputs.productionStatus} production readiness status.`],
    ['governance-evidence-ready', 'Governance evidence ready', Math.round((inputs.dossierScore + inputs.reviewerScore + inputs.presentationScore) / 3), `${inputs.dossierStatus} evidence status with governance and operational decision records.`],
    ['post-operation-loop', 'Post-operation loop', inputs.afterActionScore, `${inputs.afterActionScore}% after-action score with ${inputs.followUpActions.length} follow-up action${inputs.followUpActions.length === 1 ? '' : 's'}.`]
  ]

  return gates.map(([id, label, score, detail]) => {
    const readinessScore = clampScore(score)
    return {
      id,
      label,
      readinessScore,
      status: readinessScore >= 90 ? 'READY_TO_CLOSE' : readinessScore >= 78 ? 'WATCH' : 'BLOCKED',
      detail
    }
  })
}

function buildCloseoutBlockers(inputs = {}, gates = []) {
  const blockers = []

  if (inputs.blockedTasks > 0) blockers.push({ id: 'blocked-tasks', severity: 'HIGH', owner: 'Turnaround Manager', detail: `${inputs.blockedTasks} blocked or at-risk task signal${inputs.blockedTasks === 1 ? '' : 's'} must be cleared or explained before closeout.` })
  if (inputs.openEscalations > 0) blockers.push({ id: 'open-escalations', severity: 'HIGH', owner: 'Incident Commander', detail: `${inputs.openEscalations} escalation${inputs.openEscalations === 1 ? '' : 's'} remain open.` })
  if (inputs.openDependencies > 0) blockers.push({ id: 'open-dependencies', severity: 'MEDIUM', owner: 'Department Leads', detail: `${inputs.openDependencies} release dependency link${inputs.openDependencies === 1 ? '' : 's'} remain open.` })
  if (inputs.incompleteHandoffs > 0) blockers.push({ id: 'handoff-closure', severity: 'MEDIUM', owner: 'Shift Leads', detail: `${inputs.incompleteHandoffs} handoff${inputs.incompleteHandoffs === 1 ? '' : 's'} still need completion evidence.` })
  if (inputs.staffingGaps > 0) blockers.push({ id: 'staffing-gaps', severity: 'MEDIUM', owner: 'Staffing Coordinator', detail: `${inputs.staffingGaps} department staffing gap${inputs.staffingGaps === 1 ? '' : 's'} remain.` })

  inputs.remainingWork.slice(0, 3).forEach(item => blockers.push({
    id: `management-${item.id || item.label}`,
    severity: String(item.priority || '').toUpperCase() === 'HIGH' ? 'HIGH' : 'LOW',
    owner: 'Turnaround Management',
    detail: item.detail || item.label
  }))

  gates.filter(gate => gate.status === 'BLOCKED').forEach(gate => blockers.push({
    id: `gate-${gate.id}`,
    severity: gate.readinessScore < 65 ? 'HIGH' : 'MEDIUM',
    owner: gate.label,
    detail: gate.detail
  }))

  const uniqueBlockers = []
  const seen = new Set()
  blockers.forEach(blocker => {
    if (seen.has(blocker.id)) return
    seen.add(blocker.id)
    uniqueBlockers.push(blocker)
  })

  if (!uniqueBlockers.length) {
    uniqueBlockers.push({ id: 'closeout-ready', severity: 'INFO', owner: 'Turnaround Manager', detail: 'No closeout blockers are visible. Confirm final operating decision and archive evidence.' })
  }

  return uniqueBlockers.slice(0, 8)
}

function buildCloseoutChecklist(inputs = {}, gates = [], blockers = []) {
  const weakestGate = [...gates].sort((a, b) => a.readinessScore - b.readinessScore)[0]
  const firstAction = inputs.followUpActions[0]
  const firstBlocker = blockers.find(blocker => blocker.severity !== 'INFO')

  return [
    { id: 'confirm-scope', label: 'Confirm operation scope', owner: 'Admin', status: inputs.operationId ? 'READY' : 'BLOCKED', detail: `${inputs.cruiseLineName} / ${inputs.shipName} / ${inputs.turnaroundDate}.` },
    { id: 'close-workflow', label: 'Close workflow objects', owner: 'Turnaround Manager', status: inputs.blockedTasks || inputs.openDependencies || inputs.incompleteHandoffs ? 'WATCH' : 'READY', detail: `${inputs.completeTasks}/${inputs.totalTasks} tasks complete; dependencies and handoffs are part of the closeout evidence.` },
    { id: 'approve-readiness', label: 'Approve department readiness', owner: 'Department Leads', status: inputs.signoffCompletion >= 100 ? 'READY' : 'WATCH', detail: `${inputs.approvedSignoffs}/${inputs.totalSignoffs} signoffs approved.` },
    { id: 'resolve-risk', label: 'Resolve or explain risk', owner: 'Incident Commander', status: firstBlocker ? 'WATCH' : 'READY', detail: firstBlocker?.detail || 'Escalations and blockers are clear enough for operational closeout.' },
    { id: 'capture-debrief', label: 'Capture after-action learning', owner: 'Operations Lead', status: inputs.afterActionScore >= 78 ? 'READY' : 'WATCH', detail: firstAction || 'After-action review has no urgent follow-up action.' },
    { id: 'package-evidence', label: 'Package governance evidence', owner: 'Governance Lead', status: inputs.dossierScore >= 78 && inputs.reviewerScore >= 78 ? 'READY' : 'WATCH', detail: `${inputs.dossierScore}% release dossier, ${inputs.reviewerScore}% governance evidence, ${inputs.presentationScore}% operational briefing readiness.` },
    { id: 'archive-audit', label: 'Archive audit and timeline', owner: 'SQA Lead', status: inputs.auditEventCount || inputs.timelineEvents ? 'READY' : 'WATCH', detail: `${inputs.auditEventCount} audit events and ${inputs.timelineEvents} timeline events available.` },
    { id: 'call-out-weakest-gate', label: 'Call out weakest gate', owner: weakestGate?.label || 'Turnaround Manager', status: weakestGate?.status === 'BLOCKED' ? 'WATCH' : 'READY', detail: weakestGate ? `${weakestGate.label} is ${weakestGate.readinessScore}%.` : 'No weak gate detected.' }
  ]
}

function buildCloseoutEvidenceArchive(inputs = {}, gates = []) {
  return [
    { id: 'release-evidence', label: 'Release packet', status: inputs.releaseScore >= 78 ? 'READY' : 'WATCH', detail: `${inputs.releaseScore}% release score with ${inputs.lifecycleScore}% lifecycle completion.` },
    { id: 'audit-evidence', label: 'Audit and timeline', status: inputs.auditEventCount || inputs.timelineEvents ? 'READY' : 'WATCH', detail: `${inputs.auditEventCount} audit events and ${inputs.timelineEvents} timeline events document the turnaround.` },
    { id: 'management-evidence', label: 'Management maturity', status: inputs.managementScore >= 78 ? 'READY' : 'WATCH', detail: `${inputs.managementScore}% management maturity and ${inputs.managementStatus} status.` },
    { id: 'production-evidence', label: 'Production readiness', status: inputs.productionScore >= 78 ? 'READY' : 'WATCH', detail: `${inputs.productionScore}% production readiness, ${inputs.launchScore}% launch plan, ${inputs.scenarioScore}% scenario plan.` },
    { id: 'governance-evidence', label: 'Governance evidence package', status: inputs.dossierScore >= 78 ? 'READY' : 'WATCH', detail: `${inputs.dossierScore}% release dossier, ${inputs.reviewerScore}% governance evidence, ${inputs.presentationScore}% operational briefing readiness.` },
    { id: 'gate-evidence', label: 'Closeout gates', status: gates.every(gate => gate.status !== 'BLOCKED') ? 'READY' : 'WATCH', detail: `${gates.filter(gate => gate.status === 'READY_TO_CLOSE').length}/${gates.length} closeout gates are ready to close.` }
  ]
}

function buildCloseoutNarrative(inputs = {}, closeoutScore = 0, closeoutStatus = 'REVIEW') {
  const statusLabel = normalizeStatus(closeoutStatus, 'review')
  return {
    headline: `${inputs.shipName} turnaround closeout is ${closeoutScore}% complete.`,
    summary: `${inputs.operationTitle} now has a closeout packet that joins live workflow state, release readiness, debrief learning, production assurance, and governance evidence into one final operating decision.`,
    recommendation: closeoutScore >= 90
      ? 'Authorize closeout, preserve the verified operating baseline, and transition the operation to routine monitoring.'
      : closeoutScore >= 78
        ? 'Resolve watch items, document risk acceptance, and complete the operational closeout decision.'
        : 'Do not authorize closeout yet; clear blocked workflow, signoff, and evidence gates first.',
    statusLine: `${statusLabel} with ${inputs.blockedTasks} blocked task signal${inputs.blockedTasks === 1 ? '' : 's'}, ${inputs.openEscalations} open escalation${inputs.openEscalations === 1 ? '' : 's'}, and ${inputs.followUpActions.length} debrief follow-up action${inputs.followUpActions.length === 1 ? '' : 's'}.`
  }
}

function buildTurnaroundCloseoutPacket(input = {}) {
  const inputs = buildCloseoutInputs(input)
  const gates = buildCloseoutGates(inputs)
  const blockers = buildCloseoutBlockers(inputs, gates)
  const checklist = buildCloseoutChecklist(inputs, gates, blockers)
  const evidenceArchive = buildCloseoutEvidenceArchive(inputs, gates)
  const closeoutScore = clampScore(Math.round(gates.reduce((total, gate) => total + gate.readinessScore, 0) / Math.max(gates.length, 1)))
  const hasHighBlocker = blockers.some(blocker => blocker.severity === 'HIGH')
  const closeoutStatus = closeoutScore >= 90 && !hasHighBlocker
    ? 'READY_TO_CLOSE'
    : closeoutScore >= 78
      ? 'CLOSE_WITH_WATCH_ITEMS'
      : 'NOT_READY_TO_CLOSE'

  return {
    operationId: inputs.operationId,
    generatedAt: new Date().toISOString(),
    closeoutScore,
    closeoutStatus,
    narrative: buildCloseoutNarrative(inputs, closeoutScore, closeoutStatus),
    gates,
    blockers,
    checklist,
    evidenceArchive,
    evidence: inputs
  }
}

module.exports = {
  buildTurnaroundCloseoutPacket,
  buildCloseoutInputs,
  buildCloseoutGates,
  buildCloseoutBlockers,
  buildCloseoutChecklist,
  buildCloseoutEvidenceArchive,
  buildCloseoutNarrative
}
