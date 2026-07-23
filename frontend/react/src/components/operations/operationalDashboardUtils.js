export const COMMAND_READINESS_OPTIONS = [
  'Standard coordination',
  'High coordination',
  'Boarding ready',
  'Department handoff watch',
  'Blocked by dependency',
  'Final inspection required'
]


export const OPERATIONAL_DIRECTORY_ROLES = [
  { role: 'turnaround-manager', label: 'Turnaround Manager' },
  { role: 'housekeeping-lead', label: 'Housekeeping Lead' },
  { role: 'guest-services-lead', label: 'Guest Services Lead' },
  { role: 'food-beverage-lead', label: 'Food & Beverage Lead' },
  { role: 'engineering-lead', label: 'Engineering Lead' },
  { role: 'security-lead', label: 'Security Lead' },
  { role: 'port-operations-lead', label: 'Port Operations Lead' }
]

export function normalizeOperationalRoleName(role = '') {
  return String(role).toLowerCase().replaceAll('_', '-')
}

export function getOperationalRoleLabel(role = '') {
  const normalizedRole = normalizeOperationalRoleName(role)
  return OPERATIONAL_DIRECTORY_ROLES.find(item => item.role === normalizedRole)?.label || role
}

export function getOperationalOwnerDisplay(item = {}) {
  return item.ownerDisplayName || item.ownerName || 'Owner pending'
}

export function getOperationalAuthorDisplay(item = {}) {
  return item.authorDisplayName || item.authorName || 'Operational update'
}

export function getOperationalApproverDisplay(item = {}) {
  return item.approverDisplayName || item.approverName || 'Approver pending'
}

export function formatReleaseStatusLabel(status = '') {
  return String(status || 'REVIEW')
    .toLowerCase()
    .split(/[_-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Review'
}

export function getReleasePacketStatusLabel(status = '') {
  const normalizedStatus = String(status || '').toUpperCase()

  if (normalizedStatus === 'APPROVED_FOR_RELEASE') return 'Approved for release'
  if (normalizedStatus === 'READY_TO_RELEASE') return 'Ready to release'
  if (normalizedStatus === 'RELEASE_READY') return 'Release ready'
  if (normalizedStatus === 'HOLD_FOR_REVIEW') return 'Hold for review'
  if (normalizedStatus === 'BLOCKED') return 'Blocked'

  return formatReleaseStatusLabel(status || 'REVIEW')
}

export function getReleaseChecklistStatusLabel(status = '') {
  const normalizedStatus = String(status || '').toUpperCase()

  if (normalizedStatus === 'COMPLETE') return 'Complete'
  if (normalizedStatus === 'APPROVED') return 'Approved'
  if (normalizedStatus === 'READY') return 'Ready'
  if (normalizedStatus === 'WATCH') return 'Watch'
  if (normalizedStatus === 'BLOCKED') return 'Blocked'
  if (normalizedStatus === 'PENDING') return 'Pending'

  return formatReleaseStatusLabel(status || 'Review')
}

// Backward-compatible alias for operations workspaces that still refer to the
// older formatter name while the role-label helpers are being consolidated.
export const formatOperationalRoleLabel = getOperationalRoleLabel

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
      const role = normalizeOperationalRoleName(staffing.departmentRole)
      const entry = byRole.get(role)
      if (!entry) return

      if (staffing.leadName) entry.leadNames.add(staffing.leadName)
      if (staffing.musterLocation) entry.musterLocations.add(staffing.musterLocation)
      entry.plannedCount += Number(staffing.plannedCount || 0)
      entry.checkedInCount += Number(staffing.checkedInCount || 0)
    })

    ;(operation.tasks || []).forEach(task => {
      const role = normalizeOperationalRoleName(task.departmentRole)
      const entry = byRole.get(role)
      if (!entry) return

      if (task.ownerDisplayName || task.ownerName) entry.leadNames.add(task.ownerDisplayName || task.ownerName)
      entry.taskCount += 1
      if (String(task.status || '').toUpperCase() === 'BLOCKED') entry.blockedTasks += 1
    })

    ;(operation.escalations || []).forEach(escalation => {
      const role = normalizeOperationalRoleName(escalation.departmentRole)
      const entry = byRole.get(role)
      if (!entry) return

      if (escalation.ownerDisplayName || escalation.ownerName) entry.leadNames.add(escalation.ownerDisplayName || escalation.ownerName)
      if (!['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase())) {
        entry.activeEscalations += 1
      }
    })

    ;(operation.handoffs || []).forEach(handoff => {
      const roles = [
        normalizeOperationalRoleName(handoff.fromDepartmentRole),
        normalizeOperationalRoleName(handoff.toDepartmentRole)
      ]

      roles.forEach(role => {
        const entry = byRole.get(role)
        if (!entry) return

        if (handoff.ownerDisplayName || handoff.ownerName) entry.leadNames.add(handoff.ownerDisplayName || handoff.ownerName)
        entry.handoffCount += 1
        if (String(handoff.status || '').toUpperCase() === 'BLOCKED') entry.blockedHandoffs += 1
      })
    })

    ;(operation.signoffs || []).forEach(signoff => {
      const role = normalizeOperationalRoleName(signoff.departmentRole)
      const entry = byRole.get(role)
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

  const totalDependencies = dependencies.length
  const clearedDependencies = dependencies.filter(dependency => String(dependency.status || '').toUpperCase() === 'CLEARED').length
  const dependencyPercent = totalDependencies > 0 ? Math.round((clearedDependencies / totalDependencies) * 100) : 100

  const openEscalations = (operation.escalations || []).filter(escalation => !['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase())).length
  const releaseScore = Math.round((taskPercent + staffingPercent + readinessPercent + dependencyPercent) / 4)

  return {
    totalTasks,
    completeTasks,
    blockedTasks,
    plannedCount,
    checkedInCount,
    openEscalations,
    releaseScore
  }
}

export function getOperationPortfolioTone(metrics = {}) {
  if (Number(metrics.blockedTasks || 0) > 0 || Number(metrics.openEscalations || 0) > 1) return 'attention'
  if (Number(metrics.releaseScore || 0) < 75 || Number(metrics.openEscalations || 0) > 0) return 'watch'
  return 'clear'
}

export function getOperationPortfolioStatus(metrics = {}) {
  const tone = getOperationPortfolioTone(metrics)
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
  const roleHandoffs = (selectedOperation?.handoffs || []).filter(handoff => (
    normalizeOperationalRoleName(handoff.fromDepartmentRole) === normalizedRole ||
    normalizeOperationalRoleName(handoff.toDepartmentRole) === normalizedRole
  ))
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
    {
      id: 'tasks',
      label: 'Task ownership',
      value: roleTasks.length,
      status: blockedTasks > 0 ? `${blockedTasks} blocked` : 'On track',
      description: primaryTask?.taskName || 'No active task ownership for this turnaround yet.',
      priority: blockedTasks > 0 ? 'attention' : 'normal'
    },
    {
      id: 'handoffs',
      label: 'Department handoffs',
      value: roleHandoffs.length,
      status: openHandoffs > 0 ? `${openHandoffs} open` : 'Clear',
      description: primaryHandoff?.handoffName || 'No active handoff ownership for this department yet.',
      priority: openHandoffs > 0 ? 'attention' : 'normal'
    },
    {
      id: 'escalations',
      label: 'Escalations',
      value: openEscalations,
      status: openEscalations > 0 ? 'Active' : 'None open',
      description: primaryEscalation?.title || 'No open escalations assigned to this department.',
      priority: openEscalations > 0 ? 'attention' : 'normal'
    },
    {
      id: 'staffing',
      label: 'Staffing coverage',
      value: plannedCount > 0 ? `${checkedInCount}/${plannedCount}` : 'N/A',
      status: staffingGap > 0 ? `${staffingGap} gap` : 'Covered',
      description: selectedStaffing?.musterLocation || 'Muster location pending.',
      priority: staffingGap > 0 ? 'attention' : 'normal'
    },
    {
      id: 'readiness',
      label: 'Readiness approval',
      value: readinessStatus,
      status: readinessStatus === 'APPROVED' ? 'Approved' : 'Needs review',
      description: selectedReadinessSignoff?.notes || 'Review final department readiness before release.',
      priority: readinessStatus === 'APPROVED' ? 'normal' : 'attention'
    }
  ]

  return {
    roleLabel: getOperationalRoleLabel(roleView),
    actionCards,
    attentionCount: actionCards.filter(card => card.priority === 'attention').length
  }
}


export function formatAuditEventType(eventType = '') {
  return String(eventType || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Audit event'
}

export function formatAuditEventPayload(event = {}) {
  const payload = event.eventPayload
  if (!payload || typeof payload !== 'object') return ''

  const changedFields = Object.keys(payload.next || payload).filter(fieldName => !['id', 'operationId'].includes(fieldName))
  if (changedFields.length === 0) return ''

  return `Changed ${changedFields.slice(0, 4).join(', ')}${changedFields.length > 4 ? '…' : ''}`
}

export function formatOperationalTimelineSource(source = '') {
  return String(source || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Operation'
}

export function formatOperationalTimelineTime(item = {}) {
  if (item.dueTime) return `Due ${item.dueTime}`
  if (!item.occurredAt) return 'Time pending'
  const date = new Date(item.occurredAt)
  if (Number.isNaN(date.getTime())) return String(item.occurredAt)
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}


export function getOperationalMetricTone(status = '') {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'ACTION') return 'action'
  if (normalized === 'WATCH') return 'watch'
  return 'pass'
}

export function getOperationalTimelineTone(item = {}) {
  const severity = String(item.severity || '').toLowerCase()
  const status = String(item.status || '').toLowerCase()
  if (['critical', 'blocked'].includes(severity) || status === 'blocked') return 'critical'
  if (['action', 'watch'].includes(severity) || ['pending', 'open', 'gap', 'active'].includes(status)) return 'action'
  if (severity === 'success' || ['complete', 'approved', 'cleared', 'covered', 'resolved'].includes(status)) return 'success'
  return 'info'
}
