function normalizeStatus(value) {
  return String(value || '').toUpperCase()
}

function countByStatus(items, status) {
  return items.filter(item => normalizeStatus(item.status) === status).length
}

function dependencyKey(dependency) {
  return dependency?.id || (dependency ? `${dependency.taskName}:${dependency.dependsOnTaskName}` : '')
}

function taskKey(task) {
  return task?.id || task?.taskName || ''
}

function buildDependencySummary(dependencies) {
  return {
    totalDependencies: dependencies.length,
    activeDependencies: dependencies.filter(dependency => normalizeStatus(dependency.status) !== 'CLEARED').length,
    clearedDependencies: countByStatus(dependencies, 'CLEARED')
  }
}

function buildHandoffSummary(handoffs) {
  return {
    totalHandoffs: handoffs.length,
    completedHandoffs: countByStatus(handoffs, 'COMPLETE'),
    blockedHandoffs: countByStatus(handoffs, 'BLOCKED'),
    pendingHandoffs: handoffs.filter(handoff => normalizeStatus(handoff.status) !== 'COMPLETE').length
  }
}

function buildReadinessSummary(signoffs) {
  return {
    totalSignoffs: signoffs.length,
    approvedSignoffs: countByStatus(signoffs, 'APPROVED'),
    pendingSignoffs: countByStatus(signoffs, 'PENDING'),
    blockedSignoffs: countByStatus(signoffs, 'BLOCKED')
  }
}

function buildStaffingSummary(staffing) {
  const plannedCount = staffing.reduce((sum, item) => sum + Number(item.plannedCount || 0), 0)
  const checkedInCount = staffing.reduce((sum, item) => sum + Number(item.checkedInCount || 0), 0)

  return {
    totalDepartments: staffing.length,
    plannedCount,
    checkedInCount,
    gapCount: staffing.reduce((sum, item) => sum + Math.max(Number(item.plannedCount || 0) - Number(item.checkedInCount || 0), 0), 0),
    checkInPercent: plannedCount > 0 ? Math.round((checkedInCount / plannedCount) * 100) : 0
  }
}

function buildEscalationSummary(escalations) {
  return {
    totalEscalations: escalations.length,
    openEscalations: countByStatus(escalations, 'OPEN'),
    monitoringEscalations: countByStatus(escalations, 'MONITORING'),
    criticalEscalations: escalations.filter(escalation => normalizeStatus(escalation.severity) === 'CRITICAL').length
  }
}

function buildTaskSummary(tasks) {
  const completeTasks = countByStatus(tasks, 'COMPLETE')

  return {
    totalTasks: tasks.length,
    completeTasks,
    blockedTasks: countByStatus(tasks, 'BLOCKED'),
    completionPercent: tasks.length > 0 ? Math.round((completeTasks / tasks.length) * 100) : 0
  }
}

function buildOperationReleaseScore({ taskSummary, staffingSummary, readinessSummary, dependencySummary }) {
  const readinessPercent = readinessSummary.totalSignoffs > 0
    ? Math.round((readinessSummary.approvedSignoffs / readinessSummary.totalSignoffs) * 100)
    : 0
  const dependencyPercent = dependencySummary.totalDependencies > 0
    ? Math.round((dependencySummary.clearedDependencies / dependencySummary.totalDependencies) * 100)
    : 100

  return Math.round((
    Number(taskSummary.completionPercent || 0) +
    Number(staffingSummary.checkInPercent || 0) +
    readinessPercent +
    dependencyPercent
  ) / 4)
}

function buildReleaseBoardItems({ taskSummary, dependencySummary, staffingSummary, readinessSummary }) {
  return [
    {
      id: 'tasks',
      label: 'Task execution',
      value: `${taskSummary.completeTasks || 0}/${taskSummary.totalTasks || 0}`,
      detail: taskSummary.blockedTasks > 0 ? `${taskSummary.blockedTasks} blocked` : 'Active workstream',
      tone: taskSummary.blockedTasks > 0 ? 'attention' : 'steady'
    },
    {
      id: 'dependencies',
      label: 'Dependency gates',
      value: `${dependencySummary.clearedDependencies || 0}/${dependencySummary.totalDependencies || 0}`,
      detail: dependencySummary.activeDependencies > 0 ? `${dependencySummary.activeDependencies} active` : 'Gates clear',
      tone: dependencySummary.activeDependencies > 0 ? 'watch' : 'clear'
    },
    {
      id: 'staffing',
      label: 'Staffing coverage',
      value: `${staffingSummary.checkInPercent || 0}%`,
      detail: staffingSummary.gapCount > 0 ? `${staffingSummary.gapCount} open positions` : 'Coverage aligned',
      tone: staffingSummary.gapCount > 0 ? 'watch' : 'clear'
    },
    {
      id: 'readiness',
      label: 'Readiness approvals',
      value: `${readinessSummary.approvedSignoffs || 0}/${readinessSummary.totalSignoffs || 0}`,
      detail: readinessSummary.blockedSignoffs > 0 ? `${readinessSummary.blockedSignoffs} blocked` : 'Department signoffs',
      tone: readinessSummary.blockedSignoffs > 0 ? 'attention' : 'steady'
    }
  ]
}

export function buildOperationalWorkspaceModel({
  selectedOperation,
  roleView,
  selectedTaskId = '',
  selectedDependencyId = '',
  selectedHandoffId = '',
  selectedEscalationId = '',
  selectedStaffingRole = '',
  selectedReadinessRole = ''
}) {
  const tasks = selectedOperation?.tasks || []
  const dependencies = selectedOperation?.taskDependencies || []
  const handoffs = selectedOperation?.handoffs || []
  const staffing = selectedOperation?.staffing || []
  const signoffs = selectedOperation?.signoffs || []
  const escalations = selectedOperation?.escalations || []

  const selectedTask = tasks.find(task => taskKey(task) === selectedTaskId) || tasks[0]
  const selectedDependency = dependencies.find(dependency => dependencyKey(dependency) === selectedDependencyId) || dependencies[0]
  const selectedHandoff = handoffs.find(handoff => handoff.id === selectedHandoffId) || handoffs[0]
  const selectedEscalation = escalations.find(escalation => escalation.id === selectedEscalationId) || escalations[0]
  const selectedStaffing = staffing.find(item => item.departmentRole === selectedStaffingRole) || staffing.find(item => item.departmentRole === roleView) || staffing[0]
  const selectedReadinessSignoff = signoffs.find(signoff => signoff.departmentRole === selectedReadinessRole) || signoffs.find(signoff => signoff.departmentRole === roleView) || signoffs[0]

  const dependencySummary = selectedOperation?.dependencySummary || buildDependencySummary(dependencies)
  const handoffSummary = selectedOperation?.handoffSummary || buildHandoffSummary(handoffs)
  const readinessSummary = buildReadinessSummary(signoffs)
  const staffingSummary = selectedOperation?.staffingSummary || buildStaffingSummary(staffing)
  const escalationSummary = selectedOperation?.escalationSummary || buildEscalationSummary(escalations)
  const taskSummary = selectedOperation?.taskSummary || buildTaskSummary(tasks)

  return {
    tasks,
    dependencies,
    handoffs,
    staffing,
    signoffs,
    escalations,
    selectedTask,
    selectedTaskKey: taskKey(selectedTask),
    selectedDependency,
    selectedDependencyKey: dependencyKey(selectedDependency),
    selectedHandoff,
    selectedHandoffKey: selectedHandoff?.id || '',
    selectedEscalation,
    selectedEscalationKey: selectedEscalation?.id || '',
    selectedStaffing,
    selectedStaffingKey: selectedStaffing?.departmentRole || '',
    selectedReadinessSignoff,
    selectedReadinessKey: selectedReadinessSignoff?.departmentRole || '',
    dependencySummary,
    handoffSummary,
    readinessSummary,
    staffingSummary,
    escalationSummary,
    taskSummary,
    operationReleaseScore: buildOperationReleaseScore({ taskSummary, staffingSummary, readinessSummary, dependencySummary }),
    releaseBoardItems: buildReleaseBoardItems({ taskSummary, dependencySummary, staffingSummary, readinessSummary })
  }
}
