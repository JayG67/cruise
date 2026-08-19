function asArray(value) {
  return Array.isArray(value) ? value : []
}

function clampScore(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 0
  return Math.max(0, Math.min(100, Math.round(numericValue)))
}

function normalizeCount(value) {
  const count = Number(value ?? 0)
  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0
}

function normalizeStatus(value, fallback = 'REVIEW') {
  return String(value || fallback).replace(/_/g, ' ').trim()
}

function normalizeStatusToken(value) {
  return String(value || '').trim().toUpperCase()
}

function isCompleteStatus(value) {
  return ['COMPLETE', 'COMPLETED', 'DONE', 'APPROVED', 'RESOLVED', 'CLEARED', 'CLOSED'].includes(normalizeStatusToken(value))
}

function isBlockedTask(task = {}) {
  const status = normalizeStatusToken(task.status)
  return status === 'BLOCKED' || status === 'AT_RISK' || Boolean(task.blockerReason)
}

function isOpenEscalation(escalation = {}) {
  return !['RESOLVED', 'CLOSED'].includes(normalizeStatusToken(escalation.status))
}

function getDepartmentRole(row = {}) {
  return row.departmentRole || row.role || row.ownerRole || row.team || 'Command'
}

function getPercent(part, total) {
  const normalizedTotal = Number(total)
  const normalizedPart = Number(part)
  if (!Number.isFinite(normalizedTotal) || normalizedTotal <= 0 || !Number.isFinite(normalizedPart)) return 0
  return clampScore((normalizedPart / normalizedTotal) * 100)
}

function buildTurnaroundCommandInputs({
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
  operationalMetrics = null,
  incidentCommand = null,
  managementStatus = null,
  closeoutPacket = null,
  passengerCount
} = {}) {
  const taskRows = asArray(tasks)
  const staffingRows = asArray(staffing)
  const signoffRows = asArray(signoffs)
  const escalationRows = asArray(escalations)
  const dependencyRows = asArray(dependencies)
  const handoffRows = asArray(handoffs)
  const auditRows = asArray(auditEvents)

  const completeTasks = taskRows.filter(task => isCompleteStatus(task.status)).length
  const blockedTasks = taskRows.filter(isBlockedTask)
  const activeDependencies = dependencyRows.filter(dependency => !isCompleteStatus(dependency.status))
  const openEscalations = escalationRows.filter(isOpenEscalation)
  const criticalEscalations = openEscalations.filter(escalation => normalizeStatusToken(escalation.severity) === 'CRITICAL')
  const completedHandoffs = handoffRows.filter(handoff => isCompleteStatus(handoff.status)).length
  const approvedSignoffs = signoffRows.filter(signoff => normalizeStatusToken(signoff.status) === 'APPROVED').length
  const blockedSignoffs = signoffRows.filter(signoff => normalizeStatusToken(signoff.status) === 'BLOCKED')
  const staffingGaps = staffingRows.filter(row => normalizeCount(row.plannedCount ?? row.requiredCount ?? row.required) > normalizeCount(row.checkedInCount ?? row.assignedCount ?? row.assigned))

  return {
    operationId: operation.id || null,
    operationTitle: operation.title || operation.operationName || 'Selected turnaround operation',
    shipName: operation.shipName || operation.ship?.name || 'Selected ship',
    cruiseLineName: operation.cruiseLineName || operation.cruiseLine?.name || 'Selected cruise line',
    turnaroundDate: operation.turnaroundDate || operation.date || 'Selected date',
    passengerCount: normalizeCount(passengerCount ?? operation.passengerCount),
    tasks: taskRows,
    staffing: staffingRows,
    signoffs: signoffRows,
    escalations: escalationRows,
    dependencies: dependencyRows,
    handoffs: handoffRows,
    auditEvents: auditRows,
    totalTasks: taskRows.length,
    completeTasks,
    taskCompletion: getPercent(completeTasks, taskRows.length),
    blockedTasks,
    activeDependencies,
    openEscalations,
    criticalEscalations,
    completedHandoffs,
    handoffCompletion: getPercent(completedHandoffs, handoffRows.length),
    approvedSignoffs,
    blockedSignoffs,
    signoffCompletion: getPercent(approvedSignoffs, signoffRows.length),
    staffingGaps,
    staffingCoverage: clampScore(operationalMetrics?.summary?.staffingCoverage ?? operation.staffingSummary?.checkInPercent ?? 0),
    lifecycleScore: clampScore(lifecycleState?.completionPercent ?? 0),
    releaseScore: clampScore(releasePacket?.releaseScore ?? releasePacket?.readinessScore ?? operationalMetrics?.summary?.releaseConfidence ?? 0),
    riskScore: clampScore(incidentCommand?.incidentScore ?? operationalMetrics?.summary?.riskIndex ?? 0),
    maturityScore: clampScore(managementStatus?.maturityScore ?? 0),
    closeoutScore: clampScore(closeoutPacket?.closeoutScore ?? 0)
  }
}

function buildCommandCenterKpis(inputs = {}) {
  return [
    {
      id: 'task-execution',
      label: 'Task execution',
      value: `${inputs.completeTasks || 0}/${inputs.totalTasks || 0}`,
      score: inputs.taskCompletion || 0,
      detail: inputs.blockedTasks?.length ? `${inputs.blockedTasks.length} blocked or at-risk task signal${inputs.blockedTasks.length === 1 ? '' : 's'}.` : 'Task queue is moving without visible blockers.'
    },
    {
      id: 'staffing-coverage',
      label: 'Staffing coverage',
      value: `${inputs.staffingCoverage || 0}%`,
      score: inputs.staffingCoverage || 0,
      detail: inputs.staffingGaps?.length ? `${inputs.staffingGaps.length} department staffing gap${inputs.staffingGaps.length === 1 ? '' : 's'} remain.` : 'Staffing coverage is aligned to the current plan.'
    },
    {
      id: 'readiness-signoffs',
      label: 'Readiness signoffs',
      value: `${inputs.approvedSignoffs || 0}/${inputs.signoffs?.length || 0}`,
      score: inputs.signoffCompletion || 0,
      detail: inputs.blockedSignoffs?.length ? `${inputs.blockedSignoffs.length} signoff${inputs.blockedSignoffs.length === 1 ? '' : 's'} are blocked.` : 'Readiness approvals are moving through department leads.'
    },
    {
      id: 'dependency-gates',
      label: 'Dependency gates',
      value: `${Math.max((inputs.dependencies?.length || 0) - (inputs.activeDependencies?.length || 0), 0)}/${inputs.dependencies?.length || 0}`,
      score: (inputs.dependencies?.length || 0) ? getPercent(Math.max((inputs.dependencies?.length || 0) - (inputs.activeDependencies?.length || 0), 0), inputs.dependencies?.length || 0) : 100,
      detail: inputs.activeDependencies?.length ? `${inputs.activeDependencies.length} dependency gate${inputs.activeDependencies.length === 1 ? '' : 's'} still need release evidence.` : 'Dependency gates are clear.'
    },
    {
      id: 'escalation-risk',
      label: 'Escalation risk',
      value: `${inputs.openEscalations?.length || 0} open`,
      score: clampScore(100 - ((inputs.openEscalations?.length || 0) * 14) - ((inputs.criticalEscalations?.length || 0) * 20)),
      detail: inputs.criticalEscalations?.length ? `${inputs.criticalEscalations.length} critical escalation${inputs.criticalEscalations.length === 1 ? '' : 's'} require command attention.` : 'No critical escalation is currently visible.'
    },
    {
      id: 'closeout-readiness',
      label: 'Closeout readiness',
      value: `${inputs.closeoutScore ?? inputs.maturityScore ?? 0}%`,
      score: inputs.closeoutScore ?? inputs.maturityScore ?? 0,
      detail: 'Closeout score summarizes workflow completion, release evidence, governance decisions, and after-action learning.'
    }
  ]
}

function buildCommandDecisionQueue(inputs = {}) {
  const decisions = []

  inputs.blockedTasks.slice(0, 4).forEach(task => decisions.push({
    id: `task-${task.id || task.taskName}`,
    severity: normalizeStatusToken(task.status) === 'BLOCKED' ? 'HIGH' : 'MEDIUM',
    owner: task.ownerDisplayName || task.ownerUserId || getDepartmentRole(task),
    decision: `Resolve task blocker: ${task.taskName || 'Unnamed turnaround task'}`,
    action: task.blockerReason || task.notes || 'Confirm owner, next update, and unblock path.'
  }))

  inputs.criticalEscalations.slice(0, 3).forEach(escalation => decisions.push({
    id: `critical-escalation-${escalation.id || escalation.title}`,
    severity: 'CRITICAL',
    owner: escalation.ownerDisplayName || escalation.ownerUserId || 'Incident Commander',
    decision: `Command decision required: ${escalation.title || escalation.issue || 'Critical escalation'}`,
    action: escalation.resolutionNotes || escalation.description || 'Assign executive owner and resolution time.'
  }))

  inputs.activeDependencies.slice(0, 4).forEach(dependency => decisions.push({
    id: `dependency-${dependency.id || dependency.taskId}`,
    severity: normalizeStatusToken(dependency.status) === 'BLOCKED' ? 'HIGH' : 'MEDIUM',
    owner: getDepartmentRole(dependency),
    decision: `Clear dependency gate for ${dependency.taskName || 'turnaround task'}`,
    action: dependency.dependsOnTaskName ? `Confirm prerequisite: ${dependency.dependsOnTaskName}.` : 'Confirm prerequisite owner and completion evidence.'
  }))

  inputs.staffingGaps.slice(0, 3).forEach(row => decisions.push({
    id: `staffing-${getDepartmentRole(row)}`,
    severity: 'MEDIUM',
    owner: getDepartmentRole(row),
    decision: `Close staffing gap for ${getDepartmentRole(row)}`,
    action: `${normalizeCount(row.checkedInCount ?? row.assignedCount ?? row.assigned)}/${normalizeCount(row.plannedCount ?? row.requiredCount ?? row.required)} people checked in or assigned.`
  }))

  inputs.blockedSignoffs.slice(0, 3).forEach(signoff => decisions.push({
    id: `signoff-${getDepartmentRole(signoff)}`,
    severity: 'HIGH',
    owner: signoff.approverDisplayName || signoff.approverUserId || getDepartmentRole(signoff),
    decision: `Unblock readiness signoff for ${getDepartmentRole(signoff)}`,
    action: signoff.notes || 'Confirm acceptance criteria, evidence, and approver.'
  }))

  if (!decisions.length) {
    decisions.push({
      id: 'hold-command-cadence',
      severity: 'INFO',
      owner: 'Turnaround Manager',
      decision: 'Maintain command cadence and prepare closeout proof',
      action: 'No command-blocking signals are visible. Keep updates fresh and prepare final handoff evidence.'
    })
  }

  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 }
  return decisions.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5)).slice(0, 10)
}

function buildCommandCriticalPath(inputs = {}) {
  const taskCompletion = inputs.taskCompletion || 0
  const staffingCoverage = inputs.staffingCoverage || 0
  const dependencyCompletion = (inputs.dependencies?.length || 0) ? getPercent(Math.max((inputs.dependencies?.length || 0) - (inputs.activeDependencies?.length || 0), 0), inputs.dependencies?.length || 0) : 100
  const handoffCompletion = inputs.handoffCompletion || 0
  const signoffCompletion = inputs.signoffCompletion || 0
  const closeoutScore = inputs.closeoutScore ?? inputs.maturityScore ?? 0

  return [
    {
      id: 'command-setup',
      label: 'Command setup',
      status: inputs.operationId ? 'READY' : 'BLOCKED',
      score: inputs.operationId ? 100 : 0,
      evidence: `${inputs.cruiseLineName} / ${inputs.shipName} / ${inputs.turnaroundDate}`
    },
    {
      id: 'department-execution',
      label: 'Department execution',
      status: taskCompletion >= 90 ? 'READY' : taskCompletion >= 50 ? 'WATCH' : 'ACTIVE',
      score: taskCompletion,
      evidence: `${inputs.completeTasks}/${inputs.totalTasks} operational tasks complete.`
    },
    {
      id: 'coverage-and-gates',
      label: 'Coverage and gates',
      status: staffingCoverage >= 90 && dependencyCompletion >= 90 ? 'READY' : 'WATCH',
      score: Math.round((staffingCoverage + dependencyCompletion) / 2),
      evidence: `${staffingCoverage}% staffing coverage and ${dependencyCompletion}% dependency clearance.`
    },
    {
      id: 'handoff-release',
      label: 'Handoff release',
      status: handoffCompletion >= 90 ? 'READY' : 'WATCH',
      score: handoffCompletion,
      evidence: `${inputs.completedHandoffs}/${inputs.handoffs?.length || 0} handoffs complete.`
    },
    {
      id: 'readiness-approval',
      label: 'Readiness approval',
      status: signoffCompletion >= 100 ? 'READY' : signoffCompletion >= 50 ? 'WATCH' : 'ACTIVE',
      score: signoffCompletion,
      evidence: `${inputs.approvedSignoffs}/${inputs.signoffs?.length || 0} department signoffs approved.`
    },
    {
      id: 'management-closeout',
      label: 'Management closeout',
      status: closeoutScore >= 90 ? 'READY' : closeoutScore >= 75 ? 'WATCH' : 'ACTIVE',
      score: closeoutScore,
      evidence: `${closeoutScore}% closeout or management readiness.`
    }
  ]
}

function buildDepartmentCommandBoard(inputs = {}) {
  const departments = new Map()

  function ensureDepartment(role) {
    const key = role || 'Command'
    if (!departments.has(key)) {
      departments.set(key, {
        departmentRole: key,
        tasks: [],
        staffing: [],
        signoffs: [],
        escalations: [],
        handoffs: []
      })
    }
    return departments.get(key)
  }

  inputs.tasks.forEach(task => ensureDepartment(getDepartmentRole(task)).tasks.push(task))
  inputs.staffing.forEach(row => ensureDepartment(getDepartmentRole(row)).staffing.push(row))
  inputs.signoffs.forEach(signoff => ensureDepartment(getDepartmentRole(signoff)).signoffs.push(signoff))
  inputs.escalations.forEach(escalation => ensureDepartment(getDepartmentRole(escalation)).escalations.push(escalation))
  inputs.handoffs.forEach(handoff => ensureDepartment(getDepartmentRole(handoff)).handoffs.push(handoff))

  return [...departments.values()].map(department => {
    const taskCompletion = getPercent(department.tasks.filter(task => isCompleteStatus(task.status)).length, department.tasks.length)
    const staffingCoverage = department.staffing.length
      ? getPercent(
        department.staffing.reduce((sum, row) => sum + normalizeCount(row.checkedInCount ?? row.assignedCount ?? row.assigned), 0),
        department.staffing.reduce((sum, row) => sum + normalizeCount(row.plannedCount ?? row.requiredCount ?? row.required), 0)
      )
      : 100
    const signoffCompletion = getPercent(department.signoffs.filter(signoff => normalizeStatusToken(signoff.status) === 'APPROVED').length, department.signoffs.length)
    const openEscalations = department.escalations.filter(isOpenEscalation).length
    const blockedTasks = department.tasks.filter(isBlockedTask).length
    const readinessScore = clampScore((taskCompletion * 0.35) + (staffingCoverage * 0.25) + (signoffCompletion * 0.25) + (clampScore(100 - (openEscalations * 18) - (blockedTasks * 14)) * 0.15))

    return {
      departmentRole: department.departmentRole,
      readinessScore,
      status: readinessScore >= 90 ? 'READY' : readinessScore >= 72 ? 'WATCH' : 'COMMAND_REVIEW',
      taskCount: department.tasks.length,
      blockedTasks,
      staffingCoverage,
      signoffCompletion,
      openEscalations,
      nextAction: blockedTasks > 0
        ? 'Clear task blockers and update the command board.'
        : openEscalations > 0
          ? 'Resolve or monitor open escalation before release.'
          : signoffCompletion < 100
            ? 'Complete department readiness approval.'
            : 'Maintain cadence and prepare handoff evidence.'
    }
  }).sort((a, b) => a.readinessScore - b.readinessScore || String(a.departmentRole).localeCompare(String(b.departmentRole))).slice(0, 12)
}

function buildCommandHandoffTimeline(inputs = {}) {
  const handoffs = [...inputs.handoffs]
    .sort((a, b) => String(a.dueTime || '').localeCompare(String(b.dueTime || '')))
    .slice(0, 8)

  if (!handoffs.length) {
    return [{ id: 'no-handoffs', dueTime: 'TBD', owner: 'Turnaround Manager', status: 'WATCH', detail: 'No handoff rows are visible yet. Confirm cross-department release owners.' }]
  }

  return handoffs.map(handoff => ({
    id: handoff.id || `${handoff.departmentRole || 'handoff'}-${handoff.dueTime || 'tbd'}`,
    dueTime: handoff.dueTime || 'TBD',
    owner: handoff.ownerDisplayName || handoff.ownerUserId || getDepartmentRole(handoff),
    status: normalizeStatus(handoff.status, 'PENDING'),
    detail: handoff.notes || handoff.handoffName || handoff.taskName || 'Department handoff requires update.'
  }))
}

function buildCommanderBrief(inputs = {}, kpis = [], decisions = [], criticalPath = []) {
  const weakestKpi = [...kpis].sort((a, b) => a.score - b.score)[0]
  const nextDecision = decisions[0]
  const activePhase = criticalPath.find(phase => phase.status !== 'READY') || criticalPath[criticalPath.length - 1]

  return {
    headline: `${inputs.shipName} command center is ${inputs.releaseScore ?? inputs.lifecycleScore ?? 0}% release-oriented with ${decisions.length} decision item${decisions.length === 1 ? '' : 's'}.`,
    summary: `${inputs.operationTitle} now has a single manager view for KPIs, decisions, critical path, department readiness, handoffs, and closeout proof.`,
    weakestSignal: weakestKpi ? `${weakestKpi.label}: ${weakestKpi.detail}` : 'No weak KPI signal is visible.',
    nextDecision: nextDecision ? `${nextDecision.owner}: ${nextDecision.decision}` : 'Maintain command cadence.',
    activePhase: activePhase ? `${activePhase.label}: ${activePhase.evidence}` : 'Critical path is ready.',
    presentationLine: 'Use this board to maintain a single operational command workflow from assignment through closeout, with accountable decisions, release evidence, and management visibility.'
  }
}

function buildTurnaroundCommandCenter(input = {}) {
  const inputs = buildTurnaroundCommandInputs(input)
  const kpis = buildCommandCenterKpis(inputs)
  const decisionQueue = buildCommandDecisionQueue(inputs)
  const criticalPath = buildCommandCriticalPath(inputs)
  const departmentBoard = buildDepartmentCommandBoard(inputs)
  const handoffTimeline = buildCommandHandoffTimeline(inputs)
  const commanderBrief = buildCommanderBrief(inputs, kpis, decisionQueue, criticalPath)
  const commandScore = clampScore((
    (inputs.releaseScore * 0.22) +
    (inputs.lifecycleScore * 0.18) +
    (inputs.taskCompletion * 0.18) +
    (inputs.staffingCoverage * 0.12) +
    (inputs.signoffCompletion * 0.12) +
    (clampScore(100 - inputs.riskScore) * 0.1) +
    ((inputs.closeoutScore ?? inputs.maturityScore ?? 0) * 0.08)
  ))

  return {
    commandScore,
    commandStatus: commandScore >= 90 ? 'READY_FOR_CLOSEOUT' : commandScore >= 78 ? 'COMMAND_WATCH' : 'ACTIVE_COMMAND',
    commanderBrief,
    kpis,
    decisionQueue,
    criticalPath,
    departmentBoard,
    handoffTimeline,
    escalationProtocol: {
      status: inputs.criticalEscalations.length ? 'EXECUTIVE_ATTENTION' : inputs.openEscalations.length ? 'WATCH' : 'STABLE',
      detail: `${inputs.openEscalations.length} open escalation${inputs.openEscalations.length === 1 ? '' : 's'} and ${inputs.criticalEscalations.length} critical signal${inputs.criticalEscalations.length === 1 ? '' : 's'} are visible.`,
      owner: inputs.criticalEscalations[0]?.ownerDisplayName || inputs.criticalEscalations[0]?.ownerUserId || 'Turnaround Manager'
    }
  }
}

module.exports = {
  buildTurnaroundCommandCenter,
  buildTurnaroundCommandInputs,
  buildCommandCenterKpis,
  buildCommandDecisionQueue,
  buildCommandCriticalPath,
  buildDepartmentCommandBoard,
  buildCommandHandoffTimeline
}
