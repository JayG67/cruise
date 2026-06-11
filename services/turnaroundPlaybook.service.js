function percent(numerator, denominator) {
  if (!denominator) return 0
  return Math.max(0, Math.min(100, Math.round((Number(numerator || 0) / Number(denominator || 0)) * 100)))
}

function normalizeDepartmentRole(value) {
  return String(value || 'Unassigned').trim() || 'Unassigned'
}

function uniqueSorted(values = []) {
  return [...new Set(values.filter(Boolean).map(value => String(value).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

function getTemplateProfile({ operation = {}, tasks = [], staffing = [], signoffs = [], escalations = [], handoffs = [], dependencies = [], passengerCount = 0 } = {}) {
  const departments = uniqueSorted([
    ...tasks.map(task => normalizeDepartmentRole(task.departmentRole)),
    ...staffing.map(row => normalizeDepartmentRole(row.departmentRole)),
    ...signoffs.map(row => normalizeDepartmentRole(row.departmentRole)),
    ...escalations.map(row => normalizeDepartmentRole(row.departmentRole)),
    ...handoffs.map(row => normalizeDepartmentRole(row.departmentRole)),
    ...dependencies.map(row => normalizeDepartmentRole(row.departmentRole))
  ])

  const plannedStaff = staffing.reduce((sum, row) => sum + Number(row.plannedCount || 0), 0)
  const checkedInStaff = staffing.reduce((sum, row) => sum + Number(row.checkedInCount || 0), 0)
  const openEscalations = escalations.filter(row => row.status !== 'RESOLVED').length
  const activeDependencies = dependencies.filter(row => row.status !== 'CLEARED').length
  const openHandoffs = handoffs.filter(row => row.status !== 'COMPLETE').length
  const blockedTasks = tasks.filter(task => task.status === 'BLOCKED').length
  const approvedSignoffs = signoffs.filter(signoff => signoff.status === 'APPROVED').length

  return {
    operationId: operation.id || null,
    port: operation.port || null,
    turnaroundDate: operation.turnaroundDate || null,
    taskCount: tasks.length,
    departmentCount: departments.length,
    departments,
    plannedStaff,
    checkedInStaff,
    passengerCount: Number(passengerCount || 0),
    openEscalations,
    activeDependencies,
    openHandoffs,
    blockedTasks,
    signoffApprovalPercent: percent(approvedSignoffs, signoffs.length),
    staffingCoveragePercent: percent(checkedInStaff, plannedStaff)
  }
}

function buildTemplateReadinessChecks(profile = {}, releasePacket = null, operationalMetrics = null) {
  const releaseScore = Number(releasePacket?.readinessScore || 0)
  const riskIndex = Number(operationalMetrics?.summary?.riskIndex || 0)
  const checks = [
    {
      id: 'workstream-coverage',
      label: 'Workstream coverage',
      status: profile.departmentCount >= 5 && profile.taskCount >= 10 ? 'PASS' : 'WATCH',
      detail: `${profile.departmentCount} departments and ${profile.taskCount} tasks are available for template extraction.`
    },
    {
      id: 'staffing-baseline',
      label: 'Staffing baseline',
      status: profile.plannedStaff > 0 ? 'PASS' : 'ACTION',
      detail: `${profile.plannedStaff} planned staff with ${profile.staffingCoveragePercent}% checked in.`
    },
    {
      id: 'release-quality',
      label: 'Release quality',
      status: releaseScore >= 85 ? 'PASS' : releaseScore >= 65 ? 'WATCH' : 'ACTION',
      detail: `Current release packet score is ${releaseScore}%.`
    },
    {
      id: 'risk-reuse',
      label: 'Risk reuse safety',
      status: riskIndex <= 20 && profile.blockedTasks === 0 ? 'PASS' : riskIndex <= 50 ? 'WATCH' : 'ACTION',
      detail: `Risk index ${riskIndex}; ${profile.blockedTasks} blocked tasks and ${profile.openEscalations} open escalations.`
    }
  ]

  const passCount = checks.filter(check => check.status === 'PASS').length
  const actionCount = checks.filter(check => check.status === 'ACTION').length

  return {
    checks,
    templateReadinessScore: percent(passCount, checks.length),
    templateReadinessStatus: actionCount > 0 ? 'NEEDS_REVIEW' : passCount === checks.length ? 'READY' : 'REVIEW'
  }
}

function buildTemplateTasks(tasks = []) {
  return [...tasks]
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || String(a.taskName || '').localeCompare(String(b.taskName || '')))
    .slice(0, 12)
    .map((task, index) => ({
      id: `template-task-${index + 1}`,
      departmentRole: normalizeDepartmentRole(task.departmentRole),
      taskName: task.taskName || `Turnaround task ${index + 1}`,
      dueTime: task.dueTime || null,
      location: task.location || null,
      suggestedOwnerRole: normalizeDepartmentRole(task.departmentRole),
      sourceTaskId: task.id || null
    }))
}

function buildDepartmentPlaybooks({ staffing = [], signoffs = [], escalations = [], handoffs = [], tasks = [] } = {}) {
  const departmentNames = uniqueSorted([
    ...tasks.map(task => normalizeDepartmentRole(task.departmentRole)),
    ...staffing.map(row => normalizeDepartmentRole(row.departmentRole)),
    ...signoffs.map(row => normalizeDepartmentRole(row.departmentRole))
  ])

  return departmentNames.map(departmentRole => {
    const departmentTasks = tasks.filter(task => normalizeDepartmentRole(task.departmentRole) === departmentRole)
    const staffingRow = staffing.find(row => normalizeDepartmentRole(row.departmentRole) === departmentRole)
    const signoffRow = signoffs.find(row => normalizeDepartmentRole(row.departmentRole) === departmentRole)
    const openEscalations = escalations.filter(row => normalizeDepartmentRole(row.departmentRole) === departmentRole && row.status !== 'RESOLVED').length
    const openHandoffs = handoffs.filter(row => normalizeDepartmentRole(row.departmentRole) === departmentRole && row.status !== 'COMPLETE').length

    return {
      departmentRole,
      taskCount: departmentTasks.length,
      plannedStaff: Number(staffingRow?.plannedCount || 0),
      defaultMusterLocation: staffingRow?.musterLocation || null,
      signoffRequired: Boolean(signoffRow),
      openRiskCount: openEscalations + openHandoffs,
      recommendedCadence: openEscalations + openHandoffs > 0 ? '15-minute exception review' : '30-minute readiness check'
    }
  })
}

function buildTurnaroundPlaybookTemplate({ operation = {}, tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [], releasePacket = null, operationalMetrics = null, passengerCount = 0 } = {}) {
  const profile = getTemplateProfile({ operation, tasks, staffing, signoffs, escalations, dependencies, handoffs, passengerCount })
  const readiness = buildTemplateReadinessChecks(profile, releasePacket, operationalMetrics)
  const templateTasks = buildTemplateTasks(tasks)
  const departmentPlaybooks = buildDepartmentPlaybooks({ staffing, signoffs, escalations, handoffs, tasks })
  const blockedTasks = tasks.filter(task => task.status === 'BLOCKED')
  const criticalEscalations = escalations.filter(row => row.severity === 'CRITICAL' && row.status !== 'RESOLVED')

  return {
    operationId: operation.id || null,
    generatedAt: new Date().toISOString(),
    templateName: `${operation.port || 'Port'} turnaround operating playbook`,
    templateType: profile.passengerCount >= 5000 ? 'MEGA_SHIP_TURNAROUND' : profile.passengerCount >= 2500 ? 'LARGE_SHIP_TURNAROUND' : 'STANDARD_TURNAROUND',
    summary: {
      templateReadinessScore: readiness.templateReadinessScore,
      templateReadinessStatus: readiness.templateReadinessStatus,
      taskCount: templateTasks.length,
      departmentCount: departmentPlaybooks.length,
      plannedStaff: profile.plannedStaff,
      staffingCoveragePercent: profile.staffingCoveragePercent,
      signoffApprovalPercent: profile.signoffApprovalPercent
    },
    checks: readiness.checks,
    templateTasks,
    departmentPlaybooks,
    exceptionRules: [
      {
        id: 'blocked-task-review',
        label: 'Blocked task review',
        trigger: 'Any task remains BLOCKED inside the release window.',
        action: 'Escalate to turnaround manager and add blocker reason before release review.',
        currentMatches: blockedTasks.length
      },
      {
        id: 'critical-escalation-review',
        label: 'Critical escalation review',
        trigger: 'Any CRITICAL escalation is unresolved.',
        action: 'Hold release packet approval until the escalation is resolved or commander override is documented.',
        currentMatches: criticalEscalations.length
      },
      {
        id: 'staffing-gap-review',
        label: 'Staffing gap review',
        trigger: 'Checked-in staff is below planned coverage.',
        action: 'Require department lead staffing note and updated muster location before final signoff.',
        currentMatches: Math.max(profile.plannedStaff - profile.checkedInStaff, 0)
      }
    ],
    nextBestActions: readiness.templateReadinessStatus === 'READY'
      ? ['Reuse this operation as the baseline playbook for similar ships and ports.', 'Promote department cadence and staffing baselines into future template seed data.']
      : ['Resolve action-level template readiness checks before reusing this as a playbook.', 'Review blocked tasks, critical escalations, staffing gaps, and signoff coverage before promotion.']
  }
}

module.exports = {
  buildTurnaroundPlaybookTemplate,
  buildDepartmentPlaybooks,
  buildTemplateReadinessChecks,
  getTemplateProfile
}
