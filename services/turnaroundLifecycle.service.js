const COMPLETE_TASK_STATUSES = new Set(['COMPLETE', 'COMPLETED', 'DONE', 'APPROVED'])
const CLEARED_DEPENDENCY_STATUSES = new Set(['CLEARED', 'COMPLETE', 'COMPLETED', 'DONE'])
const CLOSED_ESCALATION_STATUSES = new Set(['RESOLVED', 'CLOSED', 'COMPLETE'])
const COMPLETE_HANDOFF_STATUSES = new Set(['COMPLETE', 'COMPLETED', 'DONE'])
const APPROVED_SIGNOFF_STATUSES = new Set(['APPROVED', 'SIGNED_OFF', 'COMPLETE'])

const TURNAROUND_LIFECYCLE_PHASES = [
  {
    id: 'setup',
    label: 'Setup',
    weight: 10,
    description: 'The ship, sailing, command context, role assignments, staffing plan, and operating checklist are established.',
    guidance: 'Confirm admin-created operational roles, ship scope, command owner, and baseline workstream coverage.'
  },
  {
    id: 'pre-arrival',
    label: 'Pre-arrival',
    weight: 12,
    description: 'Departments verify that required staff, prerequisites, and ownership are in place before the ship arrives.',
    guidance: 'Clear prerequisite gaps, staffing shortfalls, and missing owners before disembarkation starts.'
  },
  {
    id: 'disembarkation',
    label: 'Disembarkation',
    weight: 12,
    description: 'Guest departure, baggage flow, port coordination, and terminal readiness work must avoid early blockers.',
    guidance: 'Prioritize guest-services, port, and security issues that can delay terminal reset.'
  },
  {
    id: 'cleaning-reset',
    label: 'Cleaning / reset',
    weight: 16,
    description: 'Cabins, public areas, defects, and ship reset tasks move from active work to completion.',
    guidance: 'Drive housekeeping and engineering tasks to complete, especially blocked cabin-readiness work.'
  },
  {
    id: 'provisioning',
    label: 'Provisioning',
    weight: 12,
    description: 'Food, beverage, hotel stores, and operational replenishment work is checked in and reconciled.',
    guidance: 'Close provisioning dependencies and food-and-beverage staffing gaps before embarkation.'
  },
  {
    id: 'embarkation',
    label: 'Embarkation',
    weight: 14,
    description: 'Passenger boarding, guest-support desks, and final service readiness move into live execution.',
    guidance: 'Resolve open escalations, incomplete handoffs, and guest-facing work before final readiness.'
  },
  {
    id: 'final-readiness',
    label: 'Final readiness',
    weight: 14,
    description: 'Department signoffs, release confidence, handoffs, and unresolved risks determine whether the turnaround can be released.',
    guidance: 'Approve all department signoffs, complete handoffs, and remove blockers before marking complete.'
  },
  {
    id: 'completed',
    label: 'Completed',
    weight: 10,
    description: 'All critical workstreams are complete and the operation is ready for executive operational review.',
    guidance: 'Publish the completed lifecycle record for executive operational review and repeatable closeout.'
  }
]

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function percent(part, total) {
  if (!total) return 0
  return clampPercent((Number(part || 0) / Number(total || 1)) * 100)
}

function normalize(value) {
  return String(value || '').trim().toUpperCase()
}

function isCompleteTask(task) {
  return COMPLETE_TASK_STATUSES.has(normalize(task?.status))
}

function isBlockedTask(task) {
  return normalize(task?.status) === 'BLOCKED' || Boolean(String(task?.blocker || '').trim())
}

function isDependencyCleared(dependency) {
  return CLEARED_DEPENDENCY_STATUSES.has(normalize(dependency?.status))
}

function isEscalationClosed(escalation) {
  return CLOSED_ESCALATION_STATUSES.has(normalize(escalation?.status))
}

function isHandoffComplete(handoff) {
  return COMPLETE_HANDOFF_STATUSES.has(normalize(handoff?.status))
}

function isSignoffApproved(signoff) {
  return APPROVED_SIGNOFF_STATUSES.has(normalize(signoff?.status))
}

function hasCommandPlan(operation = {}) {
  return Boolean(
    String(operation.commanderIntent || operation.commandPlan || operation.managerNotes || '').trim() ||
    String(operation.status || '').trim() ||
    String(operation.readinessLevel || '').trim()
  )
}

function getDepartmentRole(row = {}) {
  return String(row.departmentRole || row.role || row.ownerRole || 'Unassigned')
}

function buildDepartmentLifecycleRows({ tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [] } = {}) {
  const departments = new Map()

  function ensure(departmentRole) {
    const key = departmentRole || 'Unassigned'
    if (!departments.has(key)) {
      departments.set(key, {
        departmentRole: key,
        totalTasks: 0,
        completedTasks: 0,
        blockedTasks: 0,
        openDependencies: 0,
        openEscalations: 0,
        openHandoffs: 0,
        approvedSignoffs: 0,
        totalSignoffs: 0,
        plannedStaff: 0,
        checkedInStaff: 0
      })
    }
    return departments.get(key)
  }

  for (const task of tasks || []) {
    const row = ensure(getDepartmentRole(task))
    row.totalTasks += 1
    if (isCompleteTask(task)) row.completedTasks += 1
    if (isBlockedTask(task)) row.blockedTasks += 1
  }

  for (const dependency of dependencies || []) {
    const row = ensure(getDepartmentRole(dependency))
    if (!isDependencyCleared(dependency)) row.openDependencies += 1
  }

  for (const escalation of escalations || []) {
    const row = ensure(getDepartmentRole(escalation))
    if (!isEscalationClosed(escalation)) row.openEscalations += 1
  }

  for (const handoff of handoffs || []) {
    const row = ensure(getDepartmentRole(handoff))
    if (!isHandoffComplete(handoff)) row.openHandoffs += 1
  }

  for (const signoff of signoffs || []) {
    const row = ensure(getDepartmentRole(signoff))
    row.totalSignoffs += 1
    if (isSignoffApproved(signoff)) row.approvedSignoffs += 1
  }

  for (const staff of staffing || []) {
    const row = ensure(getDepartmentRole(staff))
    row.plannedStaff += Number(staff.plannedCount || staff.requiredCount || staff.assignedCount || 0)
    row.checkedInStaff += Number(staff.checkedInCount || staff.assignedCount || 0)
  }

  return [...departments.values()]
    .map(row => {
      const taskCompletionPercent = percent(row.completedTasks, row.totalTasks)
      const signoffPercent = percent(row.approvedSignoffs, row.totalSignoffs)
      const staffingPercent = percent(row.checkedInStaff, row.plannedStaff)
      const riskScore = row.blockedTasks * 18 + row.openEscalations * 14 + row.openDependencies * 12 + row.openHandoffs * 8 + Math.max(row.plannedStaff - row.checkedInStaff, 0) * 5 + (row.totalSignoffs && row.approvedSignoffs < row.totalSignoffs ? 10 : 0)

      return {
        ...row,
        taskCompletionPercent,
        signoffPercent,
        staffingPercent,
        staffingGap: Math.max(row.plannedStaff - row.checkedInStaff, 0),
        ready: taskCompletionPercent === 100 && row.blockedTasks === 0 && row.openDependencies === 0 && row.openEscalations === 0 && row.openHandoffs === 0 && (!row.totalSignoffs || signoffPercent === 100),
        riskScore
      }
    })
    .sort((a, b) => b.riskScore - a.riskScore || a.departmentRole.localeCompare(b.departmentRole))
}

function scorePhase(phaseId, context) {
  const {
    operation,
    tasks,
    staffing,
    signoffs,
    escalations,
    dependencies,
    handoffs,
    completedTasks,
    totalTasks,
    blockedTasks,
    openDependencies,
    openEscalations,
    openHandoffs,
    approvedSignoffs,
    totalSignoffs,
    staffingGap,
    staffingCoveragePercent,
    releaseConfidence
  } = context

  const taskCompletion = percent(completedTasks, totalTasks)
  const signoffCompletion = percent(approvedSignoffs, totalSignoffs)
  const dependencyCompletion = percent((dependencies || []).length - openDependencies, (dependencies || []).length)
  const handoffCompletion = percent((handoffs || []).length - openHandoffs, (handoffs || []).length)
  const blockerPenalty = Math.min(blockedTasks * 12 + openEscalations * 8 + openDependencies * 6 + openHandoffs * 5, 65)

  switch (phaseId) {
    case 'setup':
      return clampPercent((operation?.id ? 25 : 0) + (operation?.sailingId ? 15 : 0) + (hasCommandPlan(operation) ? 15 : 0) + (tasks?.length ? 15 : 0) + (staffing?.length ? 15 : 0) + (signoffs?.length ? 15 : 0))
    case 'pre-arrival':
      if (staffingGap === 0 && openDependencies === 0 && tasks?.length) return 100
      return clampPercent((staffingCoveragePercent * 0.4) + (dependencyCompletion * 0.35) + (tasks?.length ? 20 : 0) - Math.min(openDependencies * 8, 28))
    case 'disembarkation':
      return clampPercent(taskCompletion * 0.45 + dependencyCompletion * 0.25 + Math.max(0, 100 - blockerPenalty) * 0.3)
    case 'cleaning-reset':
      return clampPercent(taskCompletion * 0.7 + Math.max(0, 100 - blockedTasks * 18) * 0.3)
    case 'provisioning':
      return clampPercent(taskCompletion * 0.45 + staffingCoveragePercent * 0.25 + dependencyCompletion * 0.3)
    case 'embarkation':
      return clampPercent(taskCompletion * 0.35 + handoffCompletion * 0.3 + Math.max(0, 100 - openEscalations * 14) * 0.35)
    case 'final-readiness':
      if (signoffCompletion === 100 && handoffCompletion === 100 && blockedTasks === 0 && openEscalations === 0 && openDependencies === 0) return 100
      return clampPercent(signoffCompletion * 0.45 + handoffCompletion * 0.2 + Math.max(0, releaseConfidence) * 0.35 - Math.min((openEscalations + openDependencies + blockedTasks) * 5, 30))
    case 'completed':
      return blockedTasks === 0 && openDependencies === 0 && openEscalations === 0 && openHandoffs === 0 && taskCompletion === 100 && (!totalSignoffs || signoffCompletion === 100) ? 100 : 0
    default:
      return 0
  }
}

function buildPhaseBlockers(phaseId, context) {
  const blockers = []
  const { blockedTasks, openDependencies, openEscalations, openHandoffs, totalSignoffs, approvedSignoffs, staffingGap } = context

  if (['disembarkation', 'cleaning-reset', 'final-readiness', 'completed'].includes(phaseId) && blockedTasks > 0) {
    blockers.push(`${blockedTasks} blocked task${blockedTasks === 1 ? '' : 's'}`)
  }
  if (['pre-arrival', 'provisioning', 'final-readiness', 'completed'].includes(phaseId) && openDependencies > 0) {
    blockers.push(`${openDependencies} open dependenc${openDependencies === 1 ? 'y' : 'ies'}`)
  }
  if (['embarkation', 'final-readiness', 'completed'].includes(phaseId) && openEscalations > 0) {
    blockers.push(`${openEscalations} unresolved escalation${openEscalations === 1 ? '' : 's'}`)
  }
  if (['embarkation', 'final-readiness', 'completed'].includes(phaseId) && openHandoffs > 0) {
    blockers.push(`${openHandoffs} open handoff${openHandoffs === 1 ? '' : 's'}`)
  }
  if (['final-readiness', 'completed'].includes(phaseId) && totalSignoffs > approvedSignoffs) {
    blockers.push(`${totalSignoffs - approvedSignoffs} department signoff${totalSignoffs - approvedSignoffs === 1 ? '' : 's'} not approved`)
  }
  if (['setup', 'pre-arrival', 'provisioning'].includes(phaseId) && staffingGap > 0) {
    blockers.push(`${staffingGap} staffing gap${staffingGap === 1 ? '' : 's'}`)
  }

  return blockers.slice(0, 4)
}

function buildTurnaroundLifecycleState({ operation = {}, tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [], releasePacket = null, operationalMetrics = null } = {}) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(isCompleteTask).length
  const blockedTasks = tasks.filter(isBlockedTask).length
  const openDependencies = dependencies.filter(dependency => !isDependencyCleared(dependency)).length
  const openEscalations = escalations.filter(escalation => !isEscalationClosed(escalation)).length
  const openHandoffs = handoffs.filter(handoff => !isHandoffComplete(handoff)).length
  const totalSignoffs = signoffs.length
  const approvedSignoffs = signoffs.filter(isSignoffApproved).length
  const plannedStaff = staffing.reduce((sum, row) => sum + Number(row.plannedCount || row.requiredCount || row.assignedCount || 0), 0)
  const checkedInStaff = staffing.reduce((sum, row) => sum + Number(row.checkedInCount || row.assignedCount || 0), 0)
  const staffingGap = Math.max(plannedStaff - checkedInStaff, 0)
  const staffingCoveragePercent = percent(checkedInStaff, plannedStaff)
  const releaseConfidence = clampPercent(operationalMetrics?.summary?.releaseConfidence ?? releasePacket?.releaseConfidence ?? releasePacket?.readinessScore ?? 0)

  const context = {
    operation,
    tasks,
    staffing,
    signoffs,
    escalations,
    dependencies,
    handoffs,
    completedTasks,
    totalTasks,
    blockedTasks,
    openDependencies,
    openEscalations,
    openHandoffs,
    approvedSignoffs,
    totalSignoffs,
    staffingGap,
    staffingCoveragePercent,
    releaseConfidence
  }

  const phases = TURNAROUND_LIFECYCLE_PHASES.map((phase, index) => {
    const percentComplete = scorePhase(phase.id, context)
    const blockers = buildPhaseBlockers(phase.id, context)
    const status = percentComplete === 100 ? 'COMPLETE' : percentComplete >= 75 ? 'IN_PROGRESS' : percentComplete > 0 ? 'AT_RISK' : 'NOT_STARTED'

    return {
      ...phase,
      sequence: index + 1,
      percentComplete,
      status,
      blockers,
      blocked: blockers.length > 0
    }
  })

  const weightedProgress = phases.reduce((sum, phase) => sum + (phase.percentComplete * phase.weight), 0)
  const totalWeight = phases.reduce((sum, phase) => sum + phase.weight, 0)
  const completionPercent = clampPercent(weightedProgress / totalWeight)
  const firstIncompletePhase = phases.find(phase => phase.status !== 'COMPLETE') || phases[phases.length - 1]
  const completed = phases.every(phase => phase.status === 'COMPLETE')
  const currentPhase = completed ? phases[phases.length - 1] : firstIncompletePhase
  const departmentReadiness = buildDepartmentLifecycleRows({ tasks, staffing, signoffs, escalations, dependencies, handoffs })
  const departmentsNotReady = departmentReadiness.filter(row => !row.ready)
  const finalBlockers = [
    ...tasks.filter(isBlockedTask).slice(0, 4).map(task => ({ id: `task-${task.id || task.taskName}`, type: 'Task blocker', label: task.taskName || 'Blocked task', detail: task.blocker || task.status || 'Task is blocked' })),
    ...dependencies.filter(dependency => !isDependencyCleared(dependency)).slice(0, 4).map(dependency => ({ id: `dependency-${dependency.id || dependency.taskName}`, type: 'Dependency', label: dependency.taskName || 'Open dependency', detail: dependency.dependsOnTaskName ? `Waiting on ${dependency.dependsOnTaskName}` : dependency.status || 'Dependency is open' })),
    ...escalations.filter(escalation => !isEscalationClosed(escalation)).slice(0, 4).map(escalation => ({ id: `escalation-${escalation.id || escalation.title}`, type: 'Escalation', label: escalation.title || escalation.departmentRole || 'Open escalation', detail: escalation.severity || escalation.status || 'Escalation is unresolved' })),
    ...handoffs.filter(handoff => !isHandoffComplete(handoff)).slice(0, 4).map(handoff => ({ id: `handoff-${handoff.id || handoff.title}`, type: 'Handoff', label: handoff.title || handoff.departmentRole || 'Open handoff', detail: handoff.dueTime || handoff.status || 'Handoff is open' })),
    ...signoffs.filter(signoff => !isSignoffApproved(signoff)).slice(0, 4).map(signoff => ({ id: `signoff-${signoff.id || signoff.departmentRole}`, type: 'Signoff', label: signoff.departmentRole || 'Department signoff', detail: signoff.status || 'Awaiting approval' }))
  ].slice(0, 8)

  const storyBeats = [
    completed ? 'Turnaround is complete and ready for executive operational review.' : `Current phase: ${currentPhase.label}.`,
    `${completedTasks}/${totalTasks} tasks complete with ${blockedTasks} blocked.`,
    `${approvedSignoffs}/${totalSignoffs} department signoffs approved.`,
    `${openDependencies} dependencies, ${openHandoffs} handoffs, and ${openEscalations} escalations remain open.`
  ]

  return {
    operationId: operation.id || null,
    generatedAt: new Date().toISOString(),
    currentPhaseId: currentPhase.id,
    currentPhaseLabel: currentPhase.label,
    completionPercent,
    completed,
    status: completed ? 'COMPLETED' : finalBlockers.length ? 'BLOCKED' : completionPercent >= 82 ? 'FINAL_READINESS' : 'IN_PROGRESS',
    summary: {
      totalTasks,
      completedTasks,
      blockedTasks,
      openDependencies,
      openEscalations,
      openHandoffs,
      totalSignoffs,
      approvedSignoffs,
      departmentsNotReady: departmentsNotReady.length,
      staffingCoveragePercent,
      staffingGap,
      releaseConfidence
    },
    phases,
    finalBlockers,
    departmentReadiness: departmentReadiness.slice(0, 8),
    storyBeats,
    nextBestAction: completed
      ? 'Use this completed turnaround as the verified reference for executive operational review and future closeout planning.'
      : finalBlockers[0]?.detail || currentPhase.guidance,
    completionLanguage: completed
      ? 'All lifecycle gates are complete.'
      : `${currentPhase.label} is the next lifecycle gate to finish before the operation can be marked complete.`
  }
}

module.exports = {
  TURNAROUND_LIFECYCLE_PHASES,
  buildTurnaroundLifecycleState,
  buildDepartmentLifecycleRows,
  percent
}
