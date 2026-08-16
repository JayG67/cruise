function asArray(value) {
  return Array.isArray(value) ? value : []
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function normalizeText(value, fallback = '') {
  return String(value || fallback).trim()
}

function normalizeStatus(value, fallback = 'OPEN') {
  return String(value || fallback).replace(/_/g, ' ').trim()
}

function isCompleteStatus(value) {
  return ['COMPLETE', 'COMPLETED', 'DONE', 'APPROVED', 'RESOLVED', 'CLEARED', 'CLOSED'].includes(String(value || '').toUpperCase())
}

function isBlockedStatus(value) {
  return ['BLOCKED', 'AT_RISK', 'CRITICAL', 'WATCH'].includes(String(value || '').toUpperCase())
}

function getDepartmentRole(row = {}) {
  return row.departmentRole || row.role || row.ownerRole || row.team || 'Command'
}

function getOwner(row = {}, fallback = 'Turnaround Manager') {
  return row.ownerDisplayName || row.ownerName || row.ownerUserId || row.approverDisplayName || row.approverUserId || getDepartmentRole(row) || fallback
}

function getPercent(part, total) {
  if (!Number(total || 0)) return 0
  return clampScore((Number(part || 0) / Number(total || 1)) * 100)
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))]
}

function buildContinuityInputs({
  operation = {},
  tasks = [],
  staffing = [],
  signoffs = [],
  escalations = [],
  dependencies = [],
  handoffs = [],
  lifecycleState = null,
  releasePacket = null,
  commandCenter = null,
  closeoutPacket = null,
  productionReadiness = null,
  passengerCount = 0
} = {}) {
  const operationDetails = operation || {}
  const taskRows = asArray(tasks)
  const staffingRows = asArray(staffing)
  const signoffRows = asArray(signoffs)
  const escalationRows = asArray(escalations)
  const dependencyRows = asArray(dependencies)
  const handoffRows = asArray(handoffs)

  const incompleteTasks = taskRows.filter(task => !isCompleteStatus(task.status))
  const blockedTasks = incompleteTasks.filter(task => isBlockedStatus(task.status) || Boolean(task.blockerReason))
  const openDependencies = dependencyRows.filter(dependency => !isCompleteStatus(dependency.status))
  const openHandoffs = handoffRows.filter(handoff => !isCompleteStatus(handoff.status))
  const openEscalations = escalationRows.filter(escalation => !isCompleteStatus(escalation.status))
  const criticalEscalations = openEscalations.filter(escalation => String(escalation.severity || '').toUpperCase() === 'CRITICAL')
  const pendingSignoffs = signoffRows.filter(signoff => String(signoff.status || '').toUpperCase() !== 'APPROVED')
  const staffingGaps = staffingRows.filter(row => Number(row.plannedCount || row.requiredCount || row.required || 0) > Number(row.checkedInCount || row.assignedCount || row.assigned || 0))
  const completedTasks = taskRows.length - incompleteTasks.length

  return {
    operationId: operationDetails.id || null,
    operationTitle: operationDetails.title || operationDetails.operationName || 'Selected turnaround',
    shipName: operationDetails.shipName || operationDetails.ship?.name || 'Selected ship',
    port: operationDetails.port || operationDetails.arrivalPort || operationDetails.sailing?.arrivalPort || 'Selected port',
    passengerCount: Number(passengerCount ?? operationDetails.passengerCount ?? 0),
    tasks: taskRows,
    staffing: staffingRows,
    signoffs: signoffRows,
    escalations: escalationRows,
    dependencies: dependencyRows,
    handoffs: handoffRows,
    incompleteTasks,
    blockedTasks,
    openDependencies,
    openHandoffs,
    openEscalations,
    criticalEscalations,
    pendingSignoffs,
    staffingGaps,
    taskCompletion: getPercent(completedTasks, taskRows.length),
    signoffCompletion: getPercent(signoffRows.length - pendingSignoffs.length, signoffRows.length),
    handoffCompletion: getPercent(handoffRows.length - openHandoffs.length, handoffRows.length),
    hasTaskEvidence: taskRows.length > 0,
    hasSignoffEvidence: signoffRows.length > 0,
    hasHandoffEvidence: handoffRows.length > 0,
    hasLifecycleEvidence: lifecycleState?.completionPercent != null,
    hasReleaseEvidence: releasePacket?.releaseScore != null || releasePacket?.readinessScore != null,
    hasCommandEvidence: commandCenter?.commandScore != null,
    hasCloseoutEvidence: closeoutPacket?.closeoutScore != null,
    hasProductionEvidence: productionReadiness?.readinessScore != null || productionReadiness?.productionScore != null,
    lifecycleScore: lifecycleState?.completionPercent == null ? null : clampScore(lifecycleState.completionPercent),
    releaseScore: releasePacket?.releaseScore == null && releasePacket?.readinessScore == null ? null : clampScore(releasePacket?.releaseScore ?? releasePacket?.readinessScore),
    commandScore: commandCenter?.commandScore == null ? null : clampScore(commandCenter.commandScore),
    closeoutScore: closeoutPacket?.closeoutScore == null ? null : clampScore(closeoutPacket.closeoutScore),
    productionScore: productionReadiness?.readinessScore == null && productionReadiness?.productionScore == null ? null : clampScore(productionReadiness?.readinessScore ?? productionReadiness?.productionScore)
  }
}

function buildContinuityScore(inputs = {}) {
  const operationalSignals = [
    inputs.hasTaskEvidence ? inputs.taskCompletion : null,
    inputs.hasSignoffEvidence ? inputs.signoffCompletion : null,
    inputs.hasHandoffEvidence ? inputs.handoffCompletion : null,
    inputs.hasLifecycleEvidence ? inputs.lifecycleScore : null,
    inputs.hasReleaseEvidence ? inputs.releaseScore : null,
    inputs.hasCommandEvidence ? inputs.commandScore : null,
    inputs.hasCloseoutEvidence ? inputs.closeoutScore : inputs.hasProductionEvidence ? inputs.productionScore : null
  ].filter(score => score != null)

  const baseScore = operationalSignals.length
    ? operationalSignals.reduce((sum, score) => sum + Number(score || 0), 0) / operationalSignals.length
    : 50

  const penalty =
    (inputs.criticalEscalations.length * 12) +
    (inputs.blockedTasks.length * 7) +
    (inputs.openDependencies.length * 5) +
    (inputs.openHandoffs.length * 4) +
    (inputs.staffingGaps.length * 4) +
    (inputs.pendingSignoffs.length * 3)

  return clampScore(baseScore - penalty)
}

function getContinuityStatus(score, inputs = {}) {
  if (inputs.criticalEscalations.length || inputs.blockedTasks.length >= 3) return 'CONTINUITY_AT_RISK'
  if (score >= 88) return 'CONTINUITY_READY'
  if (score >= 72) return 'CONTINUITY_WATCH'
  return 'CONTINUITY_AT_RISK'
}

function buildContinuityScenarios(inputs = {}) {
  const scenarios = []

  if (inputs.blockedTasks.length || inputs.openDependencies.length) {
    const task = inputs.blockedTasks[0] || inputs.incompleteTasks[0] || {}
    const dependency = inputs.openDependencies[0] || {}
    scenarios.push({
      id: 'critical-path-delay',
      label: 'Critical path delay',
      severity: inputs.blockedTasks.length ? 'HIGH' : 'MEDIUM',
      trigger: task.taskName || task.title || dependency.taskName || 'Operational dependency remains open',
      impact: 'Turnaround phase completion can slip if the prerequisite does not clear before the next command huddle.',
      owner: getOwner(task, getOwner(dependency)),
      recoveryWindow: 'Next 30 minutes',
      play: 'Split blocked work into an unblock owner, a workaround owner, and a verification owner.'
    })
  }

  if (inputs.staffingGaps.length) {
    const gap = inputs.staffingGaps[0]
    const planned = Number(gap.plannedCount || gap.requiredCount || gap.required || 0)
    const checkedIn = Number(gap.checkedInCount || gap.assignedCount || gap.assigned || 0)
    scenarios.push({
      id: 'staffing-shortfall',
      label: 'Staffing shortfall',
      severity: planned - checkedIn > 2 ? 'HIGH' : 'MEDIUM',
      trigger: `${getDepartmentRole(gap)} coverage is ${checkedIn}/${planned}.`,
      impact: 'Crew gap can delay cabin reset, provisioning, or terminal support windows.',
      owner: getOwner(gap),
      recoveryWindow: 'Next shift checkpoint',
      play: 'Borrow cross-trained staff, protect guest-facing roles, and confirm replacement ETA.'
    })
  }

  if (inputs.openEscalations.length) {
    const escalation = inputs.criticalEscalations[0] || inputs.openEscalations[0]
    scenarios.push({
      id: 'active-escalation',
      label: 'Active escalation',
      severity: String(escalation.severity || 'MEDIUM').toUpperCase(),
      trigger: escalation.title || escalation.issue || 'Escalation remains unresolved',
      impact: escalation.description || 'Unresolved operational risk can block final readiness confidence.',
      owner: getOwner(escalation, 'Incident Commander'),
      recoveryWindow: 'Immediate command review',
      play: escalation.resolutionNotes || 'Assign one accountable owner, publish next update time, and keep evidence attached to the closeout packet.'
    })
  }

  if (inputs.openHandoffs.length) {
    const handoff = inputs.openHandoffs[0]
    scenarios.push({
      id: 'handoff-miss',
      label: 'Handoff acceptance miss',
      severity: String(handoff.status || '').toUpperCase() === 'BLOCKED' ? 'HIGH' : 'MEDIUM',
      trigger: handoff.title || handoff.notes || 'Department handoff remains open',
      impact: 'The next department may start with stale assumptions or missing release evidence.',
      owner: getOwner(handoff),
      recoveryWindow: handoff.dueTime || 'Before next department handoff',
      play: 'Require sender, receiver, acceptance time, and proof link before marking release ready.'
    })
  }

  if (inputs.pendingSignoffs.length) {
    const signoff = inputs.pendingSignoffs[0]
    scenarios.push({
      id: 'readiness-signoff-gap',
      label: 'Readiness signoff gap',
      severity: String(signoff.status || '').toUpperCase() === 'BLOCKED' ? 'HIGH' : 'MEDIUM',
      trigger: `${getDepartmentRole(signoff)} signoff is ${normalizeStatus(signoff.status, 'PENDING')}.`,
      impact: 'Final readiness cannot be presented as complete until the approving role confirms evidence.',
      owner: getOwner(signoff),
      recoveryWindow: 'Before final readiness call',
      play: 'Reconfirm acceptance criteria, evidence owner, and final approval timestamp.'
    })
  }

  if (!scenarios.length) {
    scenarios.push({
      id: 'steady-state-continuity',
      label: 'Steady-state continuity',
      severity: 'INFO',
      trigger: 'No blocking continuity scenario is visible.',
      impact: 'Team can focus on preserving cadence, evidence freshness, and clean closeout.',
      owner: 'Turnaround Manager',
      recoveryWindow: 'Continuous command cadence',
      play: 'Keep check-ins active, protect final signoff evidence, and prepare after-action notes.'
    })
  }

  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 }
  return scenarios.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5)).slice(0, 6)
}

function buildContinuityDepartments(inputs = {}) {
  const departmentRoles = uniq([
    ...inputs.tasks.map(getDepartmentRole),
    ...inputs.staffing.map(getDepartmentRole),
    ...inputs.signoffs.map(getDepartmentRole),
    ...inputs.escalations.map(getDepartmentRole),
    ...inputs.dependencies.map(getDepartmentRole),
    ...inputs.handoffs.map(getDepartmentRole)
  ])

  return (departmentRoles.length ? departmentRoles : ['Turnaround Manager']).map(departmentRole => {
    const departmentTasks = inputs.tasks.filter(task => getDepartmentRole(task) === departmentRole)
    const completeTasks = departmentTasks.filter(task => isCompleteStatus(task.status)).length
    const departmentEscalations = inputs.openEscalations.filter(escalation => getDepartmentRole(escalation) === departmentRole)
    const departmentDependencies = inputs.openDependencies.filter(dependency => getDepartmentRole(dependency) === departmentRole)
    const departmentSignoffs = inputs.signoffs.filter(signoff => getDepartmentRole(signoff) === departmentRole)
    const approvedSignoffs = departmentSignoffs.filter(signoff => String(signoff.status || '').toUpperCase() === 'APPROVED').length
    const staffingGap = inputs.staffingGaps.find(row => getDepartmentRole(row) === departmentRole)
    const score = clampScore(((departmentTasks.length ? getPercent(completeTasks, departmentTasks.length) : 75) * 0.4) + ((departmentSignoffs.length ? getPercent(approvedSignoffs, departmentSignoffs.length) : 75) * 0.3) + (staffingGap ? 45 : 85) * 0.3)

    return {
      departmentRole,
      score,
      status: score >= 85 ? 'READY' : score >= 65 ? 'WATCH' : 'AT_RISK',
      openTasks: Math.max(departmentTasks.length - completeTasks, 0),
      openEscalations: departmentEscalations.length,
      openDependencies: departmentDependencies.length,
      staffingGap: Boolean(staffingGap),
      nextAction: departmentEscalations[0]?.title || departmentDependencies[0]?.taskName || departmentTasks.find(task => !isCompleteStatus(task.status))?.taskName || 'Protect readiness cadence and keep evidence current.'
    }
  }).sort((a, b) => a.score - b.score).slice(0, 8)
}

function buildContinuityRunbook(inputs = {}, scenarios = []) {
  const primaryScenario = scenarios[0] || {}
  return [
    {
      id: 'declare-command-window',
      label: 'Declare command window',
      owner: 'Turnaround Manager',
      evidence: `${inputs.shipName} at ${inputs.port}`,
      action: 'Confirm current phase, next checkpoint, and who has authority to clear exceptions.'
    },
    {
      id: 'protect-critical-path',
      label: 'Protect critical path',
      owner: primaryScenario.owner || 'Department leads',
      evidence: primaryScenario.trigger || 'Top continuity scenario',
      action: primaryScenario.play || 'Move blockers into owned recovery plays with timestamps.'
    },
    {
      id: 'reconcile-department-board',
      label: 'Reconcile department board',
      owner: 'Operations coordinator',
      evidence: `${inputs.incompleteTasks.length} open tasks, ${inputs.pendingSignoffs.length} pending signoffs`,
      action: 'Update every department owner and confirm the next visible proof point.'
    },
    {
      id: 'publish-recovery-update',
      label: 'Publish recovery update',
      owner: 'Command scribe',
      evidence: `${inputs.openEscalations.length} open escalations, ${inputs.openDependencies.length} open dependencies`,
      action: 'Capture the current decision, timebox, owner, and expected impact to closeout.'
    },
    {
      id: 'close-readiness-loop',
      label: 'Close readiness loop',
      owner: 'Readiness approvers',
      evidence: `${inputs.signoffCompletion}% signoff completion`,
      action: 'Verify final signoff evidence before releasing the closeout packet.'
    }
  ]
}

function buildContinuityWatchlist(inputs = {}) {
  return [
    ...inputs.blockedTasks.map(task => ({
      id: `task-${task.id || task.taskName}`,
      type: 'Task',
      label: task.taskName || task.title || 'Blocked task',
      owner: getOwner(task),
      detail: task.blockerReason || task.notes || 'Blocked or at-risk task requires recovery path.'
    })),
    ...inputs.openDependencies.map(dependency => ({
      id: `dependency-${dependency.id || dependency.taskId}`,
      type: 'Dependency',
      label: dependency.taskName || 'Open dependency',
      owner: getOwner(dependency),
      detail: dependency.dependsOnTaskName ? `Waiting on ${dependency.dependsOnTaskName}.` : 'Dependency still needs release evidence.'
    })),
    ...inputs.openEscalations.map(escalation => ({
      id: `escalation-${escalation.id || escalation.title}`,
      type: 'Escalation',
      label: escalation.title || escalation.issue || 'Open escalation',
      owner: getOwner(escalation, 'Incident Commander'),
      detail: escalation.resolutionNotes || escalation.description || 'Escalation needs command owner and next update.'
    })),
    ...inputs.openHandoffs.map(handoff => ({
      id: `handoff-${handoff.id || handoff.title}`,
      type: 'Handoff',
      label: handoff.title || 'Open handoff',
      owner: getOwner(handoff),
      detail: handoff.notes || 'Handoff needs acceptance evidence.'
    })),
    ...inputs.pendingSignoffs.map(signoff => ({
      id: `signoff-${signoff.id || getDepartmentRole(signoff)}`,
      type: 'Signoff',
      label: `${getDepartmentRole(signoff)} readiness`,
      owner: getOwner(signoff),
      detail: signoff.notes || `Status: ${normalizeStatus(signoff.status, 'PENDING')}.`
    }))
  ].slice(0, 10)
}

function buildTurnaroundContinuityCenter(input = {}) {
  const inputs = buildContinuityInputs(input)
  const continuityScore = buildContinuityScore(inputs)
  const scenarios = buildContinuityScenarios(inputs)
  const departmentContinuity = buildContinuityDepartments(inputs)
  const runbook = buildContinuityRunbook(inputs, scenarios)
  const watchlist = buildContinuityWatchlist(inputs)
  const commandStatus = getContinuityStatus(continuityScore, inputs)

  return {
    operationId: inputs.operationId,
    headline: `${inputs.shipName} continuity and recovery control`,
    summary: `${inputs.operationTitle} has ${inputs.openEscalations.length} open escalations, ${inputs.openDependencies.length} open dependencies, ${inputs.openHandoffs.length} open handoffs, and ${inputs.pendingSignoffs.length} pending signoffs under command review.`,
    continuityScore,
    commandStatus,
    passengerImpact: inputs.passengerCount ? `${inputs.passengerCount} passengers protected by continuity checks.` : 'Passenger impact is tracked through the selected sailing.',
    scenarioCount: scenarios.length,
    scenarios,
    departmentContinuity,
    runbook,
    watchlist,
    executivePrompt: commandStatus === 'CONTINUITY_READY'
      ? 'Continuity is ready for final closeout. Keep evidence fresh and monitor cadence until release.'
      : 'Continuity requires active command attention before the turnaround can be presented as fully controlled.',
    evidenceChecklist: [
      { id: 'scenario-owners', label: 'Scenario owners assigned', complete: scenarios.every(scenario => Boolean(scenario.owner)) },
      { id: 'critical-path-watchlist', label: 'Critical path watchlist current', complete: watchlist.length <= 4 },
      { id: 'department-readiness', label: 'Department readiness above watch floor', complete: departmentContinuity.every(department => department.score >= 65) },
      { id: 'signoff-path', label: 'Final signoff path visible', complete: inputs.pendingSignoffs.length === 0 },
      { id: 'closeout-score', label: 'Closeout score supports release story', complete: inputs.closeoutScore >= 80 || continuityScore >= 85 }
    ]
  }
}

module.exports = {
  buildTurnaroundContinuityCenter,
  buildContinuityInputs,
  buildContinuityScore,
  buildContinuityScenarios,
  buildContinuityDepartments,
  buildContinuityRunbook,
  buildContinuityWatchlist
}
