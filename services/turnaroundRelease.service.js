function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase()
}

function percent(numerator, denominator, fallback = 0) {
  const total = Number(denominator || 0)
  if (total <= 0) return fallback
  return Math.round((Number(numerator || 0) / total) * 100)
}

function getOpenEscalations(escalations = []) {
  return (escalations || []).filter(escalation => !['RESOLVED', 'CLOSED'].includes(normalizeStatus(escalation.status)))
}

function getBlockedTasks(tasks = []) {
  return (tasks || []).filter(task => normalizeStatus(task.status) === 'BLOCKED')
}

function getIncompleteHandoffs(handoffs = []) {
  return (handoffs || []).filter(handoff => normalizeStatus(handoff.status) !== 'COMPLETE')
}

function getPendingSignoffs(signoffs = []) {
  return (signoffs || []).filter(signoff => normalizeStatus(signoff.status) !== 'APPROVED')
}

function getActiveDependencies(dependencies = []) {
  return (dependencies || []).filter(dependency => normalizeStatus(dependency.status) !== 'CLEARED')
}

function buildTurnaroundReleasePacket({ operation = {}, tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [], auditEvents = [] } = {}) {
  const blockedTasks = getBlockedTasks(tasks)
  const pendingSignoffs = getPendingSignoffs(signoffs)
  const activeDependencies = getActiveDependencies(dependencies)
  const openEscalations = getOpenEscalations(escalations)
  const incompleteHandoffs = getIncompleteHandoffs(handoffs)

  const totalTasks = tasks.length
  const completeTasks = tasks.filter(task => normalizeStatus(task.status) === 'COMPLETE').length
  const plannedStaff = staffing.reduce((sum, row) => sum + Number(row.plannedCount || 0), 0)
  const checkedInStaff = staffing.reduce((sum, row) => sum + Number(row.checkedInCount || 0), 0)
  const approvedSignoffs = signoffs.filter(signoff => normalizeStatus(signoff.status) === 'APPROVED').length
  const clearedDependencies = dependencies.filter(dependency => normalizeStatus(dependency.status) === 'CLEARED').length
  const completedHandoffs = handoffs.filter(handoff => normalizeStatus(handoff.status) === 'COMPLETE').length

  const taskPercent = percent(completeTasks, totalTasks)
  const staffingPercent = percent(checkedInStaff, plannedStaff)
  const signoffPercent = percent(approvedSignoffs, signoffs.length)
  const dependencyPercent = percent(clearedDependencies, dependencies.length, 100)
  const handoffPercent = percent(completedHandoffs, handoffs.length, 100)
  const readinessScore = Math.round((taskPercent + staffingPercent + signoffPercent + dependencyPercent + handoffPercent) / 5)

  const blockers = [
    ...blockedTasks.map(task => ({ type: 'TASK', label: task.taskName, owner: task.ownerDisplayName || task.ownerName || null, detail: task.blockerReason || 'Task is blocked.' })),
    ...pendingSignoffs.map(signoff => ({ type: 'SIGNOFF', label: signoff.departmentRole, owner: signoff.approverDisplayName || signoff.approverName || null, detail: `Readiness signoff is ${signoff.status || 'pending'}.` })),
    ...activeDependencies.map(dependency => ({ type: 'DEPENDENCY', label: dependency.taskName || dependency.taskId, owner: null, detail: `Waiting on ${dependency.dependsOnTaskName || dependency.dependsOnTaskId || 'prerequisite task'}.` })),
    ...openEscalations.map(escalation => ({ type: 'ESCALATION', label: escalation.title, owner: escalation.ownerDisplayName || escalation.ownerName || null, detail: `${escalation.severity || 'WATCH'} escalation is ${escalation.status || 'open'}.` })),
    ...incompleteHandoffs.map(handoff => ({ type: 'HANDOFF', label: handoff.title, owner: handoff.ownerDisplayName || handoff.ownerName || null, detail: `Handoff is ${handoff.status || 'pending'}.` }))
  ]

  const releaseStatus = blockers.length > 0 || readinessScore < 100 ? 'NOT_READY' : 'READY'
  const releaseRecommendation = releaseStatus === 'READY'
    ? 'Ready for embarkation release once the command team confirms final port clearance.'
    : 'Hold release until blockers, pending signoffs, active dependencies, open escalations, and incomplete handoffs are resolved.'

  return {
    operationId: operation.id || null,
    generatedAt: new Date().toISOString(),
    releaseStatus,
    readinessScore,
    releaseRecommendation,
    counters: {
      totalTasks,
      completeTasks,
      blockedTasks: blockedTasks.length,
      plannedStaff,
      checkedInStaff,
      staffingGaps: Math.max(plannedStaff - checkedInStaff, 0),
      totalSignoffs: signoffs.length,
      approvedSignoffs,
      pendingSignoffs: pendingSignoffs.length,
      totalDependencies: dependencies.length,
      activeDependencies: activeDependencies.length,
      totalHandoffs: handoffs.length,
      incompleteHandoffs: incompleteHandoffs.length,
      openEscalations: openEscalations.length,
      recentAuditEvents: auditEvents.length
    },
    percentages: {
      tasks: taskPercent,
      staffing: staffingPercent,
      signoffs: signoffPercent,
      dependencies: dependencyPercent,
      handoffs: handoffPercent
    },
    blockers: blockers.slice(0, 12),
    checklist: [
      { id: 'tasks', label: 'All critical turnaround tasks complete', status: blockedTasks.length === 0 && completeTasks === totalTasks ? 'PASS' : 'ACTION_REQUIRED', percent: taskPercent },
      { id: 'staffing', label: 'Staffing check-in meets plan', status: plannedStaff > 0 && checkedInStaff >= plannedStaff ? 'PASS' : 'ACTION_REQUIRED', percent: staffingPercent },
      { id: 'signoffs', label: 'Department readiness signoffs approved', status: pendingSignoffs.length === 0 && signoffs.length > 0 ? 'PASS' : 'ACTION_REQUIRED', percent: signoffPercent },
      { id: 'dependencies', label: 'Operational dependencies cleared', status: activeDependencies.length === 0 ? 'PASS' : 'ACTION_REQUIRED', percent: dependencyPercent },
      { id: 'handoffs', label: 'Department handoffs complete', status: incompleteHandoffs.length === 0 ? 'PASS' : 'ACTION_REQUIRED', percent: handoffPercent },
      { id: 'escalations', label: 'No open escalation watch items', status: openEscalations.length === 0 ? 'PASS' : 'ACTION_REQUIRED', percent: openEscalations.length === 0 ? 100 : 0 },
      { id: 'audit', label: 'Recent operational audit trail available', status: auditEvents.length > 0 ? 'PASS' : 'WATCH', percent: auditEvents.length > 0 ? 100 : 0 }
    ]
  }
}

module.exports = {
  buildTurnaroundReleasePacket,
  normalizeStatus
}
