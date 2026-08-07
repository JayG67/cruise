import {
  OPERATIONAL_DIRECTORY_ROLES,
  getOperationalRoleLabel,
  normalizeOperationalRoleName
} from './operationalDashboardLabels.js'

export function buildOperationalDirectory(readinessOperations = []) {
  const entries = OPERATIONAL_DIRECTORY_ROLES.map(({ role, label }) => ({
    role,
    label,
    leadNames: new Set(),
    taskCount: 0,
    blockedTasks: 0,
    activeEscalations: 0,
    handoffCount: 0,
    blockedHandoffs: 0,
    plannedCount: 0,
    checkedInCount: 0,
    signoffStatuses: new Set(),
    musterLocations: new Set()
  }))

  const byRole = new Map(entries.map(entry => [entry.role, entry]))

  readinessOperations.forEach(operation => {
    ;(operation.staffing || []).forEach(staffing => {
      const entry = byRole.get(normalizeOperationalRoleName(staffing.departmentRole))
      if (!entry) return
      if (staffing.leadName) entry.leadNames.add(staffing.leadName)
      if (staffing.musterLocation) entry.musterLocations.add(staffing.musterLocation)
      entry.plannedCount += Number(staffing.plannedCount || 0)
      entry.checkedInCount += Number(staffing.checkedInCount || 0)
    })

    ;(operation.tasks || []).forEach(task => {
      const entry = byRole.get(normalizeOperationalRoleName(task.departmentRole))
      if (!entry) return
      if (task.ownerDisplayName || task.ownerName) entry.leadNames.add(task.ownerDisplayName || task.ownerName)
      entry.taskCount += 1
      if (String(task.status || '').toUpperCase() === 'BLOCKED') entry.blockedTasks += 1
    })

    ;(operation.escalations || []).forEach(escalation => {
      const entry = byRole.get(normalizeOperationalRoleName(escalation.departmentRole))
      if (!entry) return
      if (escalation.ownerDisplayName || escalation.ownerName) entry.leadNames.add(escalation.ownerDisplayName || escalation.ownerName)
      if (!['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase())) entry.activeEscalations += 1
    })

    ;(operation.handoffs || []).forEach(handoff => {
      [handoff.fromDepartmentRole, handoff.toDepartmentRole]
        .map(normalizeOperationalRoleName)
        .forEach(role => {
          const entry = byRole.get(role)
          if (!entry) return
          if (handoff.ownerDisplayName || handoff.ownerName) entry.leadNames.add(handoff.ownerDisplayName || handoff.ownerName)
          entry.handoffCount += 1
          if (String(handoff.status || '').toUpperCase() === 'BLOCKED') entry.blockedHandoffs += 1
        })
    })

    ;(operation.signoffs || []).forEach(signoff => {
      const entry = byRole.get(normalizeOperationalRoleName(signoff.departmentRole))
      if (!entry) return
      if (signoff.approverDisplayName || signoff.approverName) entry.leadNames.add(signoff.approverDisplayName || signoff.approverName)
      if (signoff.status) entry.signoffStatuses.add(signoff.status)
    })
  })

  return entries.map(entry => ({
    ...entry,
    leadNames: [...entry.leadNames].slice(0, 3),
    musterLocations: [...entry.musterLocations].slice(0, 2),
    signoffStatuses: [...entry.signoffStatuses],
    staffingPercent: entry.plannedCount > 0 ? Math.round((entry.checkedInCount / entry.plannedCount) * 100) : 0
  }))
}

export function getOperationReleaseMetrics(operation = {}) {
  const tasks = operation.tasks || []
  const staffing = operation.staffing || []
  const signoffs = operation.signoffs || []
  const dependencies = operation.taskDependencies || []
  const taskSummary = operation.taskSummary || {}
  const staffingSummary = operation.staffingSummary || {}
  const totalTasks = Number(taskSummary.totalTasks ?? tasks.length)
  const completeTasks = Number(taskSummary.completeTasks ?? tasks.filter(task => String(task.status || '').toUpperCase() === 'COMPLETE').length)
  const blockedTasks = Number(taskSummary.blockedTasks ?? tasks.filter(task => String(task.status || '').toUpperCase() === 'BLOCKED').length)
  const taskPercent = totalTasks > 0 ? Math.round((completeTasks / totalTasks) * 100) : 0
  const plannedCount = Number(staffingSummary.plannedCount ?? staffing.reduce((sum, item) => sum + Number(item.plannedCount || 0), 0))
  const checkedInCount = Number(staffingSummary.checkedInCount ?? staffing.reduce((sum, item) => sum + Number(item.checkedInCount || 0), 0))
  const staffingPercent = plannedCount > 0 ? Math.round((checkedInCount / plannedCount) * 100) : 0
  const totalSignoffs = signoffs.length
  const approvedSignoffs = signoffs.filter(signoff => String(signoff.status || '').toUpperCase() === 'APPROVED').length
  const readinessPercent = totalSignoffs > 0 ? Math.round((approvedSignoffs / totalSignoffs) * 100) : 0
  const clearedDependencies = dependencies.filter(dependency => String(dependency.status || '').toUpperCase() === 'CLEARED').length
  const dependencyPercent = dependencies.length > 0 ? Math.round((clearedDependencies / dependencies.length) * 100) : 100
  const openEscalations = (operation.escalations || []).filter(escalation => !['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase())).length

  return {
    totalTasks,
    completeTasks,
    blockedTasks,
    plannedCount,
    checkedInCount,
    openEscalations,
    releaseScore: Math.round((taskPercent + staffingPercent + readinessPercent + dependencyPercent) / 4)
  }
}

export function getTurnaroundReadinessTone(metrics = {}) {
  if (Number(metrics.blockedTasks || 0) > 0 || Number(metrics.openEscalations || 0) > 1) return 'attention'
  if (Number(metrics.releaseScore || 0) < 75 || Number(metrics.openEscalations || 0) > 0) return 'watch'
  return 'clear'
}

export function getTurnaroundReadinessStatus(metrics = {}) {
  const tone = getTurnaroundReadinessTone(metrics)
  if (tone === 'attention') return 'Needs attention'
  if (tone === 'watch') return 'Operational watch'
  return 'On track'
}

export function getDirectoryHealthStatus(entry = {}) {
  const blockedCount = Number(entry.blockedTasks || 0) + Number(entry.blockedHandoffs || 0)
  const escalationCount = Number(entry.activeEscalations || 0)
  const staffingPercent = Number(entry.staffingPercent || 0)
  if (escalationCount > 0 || blockedCount > 0) return { label: 'Needs attention', tone: 'attention' }
  if (staffingPercent < 90) return { label: 'Coverage watch', tone: 'watch' }
  return { label: 'On track', tone: 'clear' }
}

export function buildRoleOperationsBrief({ roleView, selectedOperation, selectedStaffing, selectedReadinessSignoff }) {
  const normalizedRole = normalizeOperationalRoleName(roleView)
  const roleTasks = (selectedOperation?.tasks || []).filter(task => normalizeOperationalRoleName(task.departmentRole) === normalizedRole)
  const roleHandoffs = (selectedOperation?.handoffs || []).filter(handoff => [handoff.fromDepartmentRole, handoff.toDepartmentRole].map(normalizeOperationalRoleName).includes(normalizedRole))
  const roleEscalations = (selectedOperation?.escalations || []).filter(escalation => normalizeOperationalRoleName(escalation.departmentRole) === normalizedRole)
  const openEscalations = roleEscalations.filter(escalation => !['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase())).length
  const blockedTasks = roleTasks.filter(task => String(task.status || '').toUpperCase() === 'BLOCKED').length
  const openHandoffs = roleHandoffs.filter(handoff => String(handoff.status || '').toUpperCase() !== 'COMPLETE').length
  const plannedCount = Number(selectedStaffing?.plannedCount || 0)
  const checkedInCount = Number(selectedStaffing?.checkedInCount || 0)
  const staffingGap = Math.max(plannedCount - checkedInCount, 0)
  const readinessStatus = selectedReadinessSignoff?.status || 'PENDING'
  const primaryTask = roleTasks.find(task => String(task.status || '').toUpperCase() !== 'COMPLETE') || roleTasks[0]
  const primaryEscalation = roleEscalations.find(escalation => !['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase()))
  const primaryHandoff = roleHandoffs.find(handoff => String(handoff.status || '').toUpperCase() !== 'COMPLETE')
  const actionCards = [
    { id: 'tasks', label: 'Task ownership', value: roleTasks.length, status: blockedTasks > 0 ? `${blockedTasks} blocked` : 'On track', description: primaryTask?.taskName || 'No active task ownership for this turnaround yet.', priority: blockedTasks > 0 ? 'attention' : 'normal' },
    { id: 'handoffs', label: 'Department handoffs', value: roleHandoffs.length, status: openHandoffs > 0 ? `${openHandoffs} open` : 'Clear', description: primaryHandoff?.handoffName || 'No active handoff ownership for this department yet.', priority: openHandoffs > 0 ? 'attention' : 'normal' },
    { id: 'escalations', label: 'Escalations', value: openEscalations, status: openEscalations > 0 ? 'Active' : 'None open', description: primaryEscalation?.title || 'No open escalations assigned to this department.', priority: openEscalations > 0 ? 'attention' : 'normal' },
    { id: 'staffing', label: 'Staffing coverage', value: plannedCount > 0 ? `${checkedInCount}/${plannedCount}` : 'N/A', status: staffingGap > 0 ? `${staffingGap} gap` : 'Covered', description: selectedStaffing?.musterLocation || 'Muster location pending.', priority: staffingGap > 0 ? 'attention' : 'normal' },
    { id: 'readiness', label: 'Readiness approval', value: readinessStatus, status: readinessStatus === 'APPROVED' ? 'Approved' : 'Needs review', description: selectedReadinessSignoff?.notes || 'Review final department readiness before release.', priority: readinessStatus === 'APPROVED' ? 'normal' : 'attention' }
  ]

  return { roleLabel: getOperationalRoleLabel(roleView), actionCards, attentionCount: actionCards.filter(card => card.priority === 'attention').length }
}
