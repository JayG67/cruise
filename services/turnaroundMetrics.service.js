function percent(numerator, denominator) {
  if (!denominator) return 0
  return Math.max(0, Math.min(100, Math.round((Number(numerator || 0) / Number(denominator || 0)) * 100)))
}

function countByStatus(rows = [], statusField = 'status') {
  return (rows || []).reduce((counts, row) => {
    const status = String(row?.[statusField] || 'UNKNOWN').toUpperCase()
    counts[status] = (counts[status] || 0) + 1
    return counts
  }, {})
}

function getDepartmentMetrics({ tasks = [], staffing = [], signoffs = [], escalations = [], handoffs = [], dependencies = [] } = {}) {
  const departments = new Map()

  function ensureDepartment(departmentRole = 'Unassigned') {
    const key = departmentRole || 'Unassigned'
    if (!departments.has(key)) {
      departments.set(key, {
        departmentRole: key,
        taskCount: 0,
        completeTaskCount: 0,
        blockedTaskCount: 0,
        openEscalationCount: 0,
        criticalEscalationCount: 0,
        staffingGap: 0,
        signoffStatus: 'PENDING',
        openHandoffCount: 0,
        activeDependencyCount: 0
      })
    }
    return departments.get(key)
  }

  for (const task of tasks || []) {
    const row = ensureDepartment(task.departmentRole)
    row.taskCount += 1
    if (task.status === 'COMPLETE') row.completeTaskCount += 1
    if (task.status === 'BLOCKED') row.blockedTaskCount += 1
  }

  for (const row of staffing || []) {
    const department = ensureDepartment(row.departmentRole)
    department.staffingGap += Math.max(Number(row.plannedCount || 0) - Number(row.checkedInCount || 0), 0)
  }

  for (const signoff of signoffs || []) {
    ensureDepartment(signoff.departmentRole).signoffStatus = signoff.status || 'PENDING'
  }

  for (const escalation of escalations || []) {
    const row = ensureDepartment(escalation.departmentRole)
    if (escalation.status !== 'RESOLVED') row.openEscalationCount += 1
    if (escalation.severity === 'CRITICAL' && escalation.status !== 'RESOLVED') row.criticalEscalationCount += 1
  }

  for (const handoff of handoffs || []) {
    const row = ensureDepartment(handoff.departmentRole)
    if (handoff.status !== 'COMPLETE') row.openHandoffCount += 1
  }

  for (const dependency of dependencies || []) {
    const row = ensureDepartment(dependency.departmentRole)
    if (dependency.status !== 'CLEARED') row.activeDependencyCount += 1
  }

  return [...departments.values()]
    .map(row => ({
      ...row,
      taskCompletionPercent: percent(row.completeTaskCount, row.taskCount),
      riskScore: row.blockedTaskCount * 18 + row.criticalEscalationCount * 25 + row.openEscalationCount * 12 + row.staffingGap * 8 + row.openHandoffCount * 6 + row.activeDependencyCount * 10 + (row.signoffStatus === 'BLOCKED' ? 20 : row.signoffStatus === 'APPROVED' ? 0 : 6)
    }))
    .sort((a, b) => b.riskScore - a.riskScore || a.departmentRole.localeCompare(b.departmentRole))
}

function buildTurnaroundOperationalMetrics({ operation = {}, tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [], auditEvents = [], operationalTimeline = null, releasePacket = null, passengerCount = 0 } = {}) {
  const taskStatusCounts = countByStatus(tasks)
  const signoffStatusCounts = countByStatus(signoffs)
  const escalationStatusCounts = countByStatus(escalations)
  const handoffStatusCounts = countByStatus(handoffs)
  const dependencyStatusCounts = countByStatus(dependencies)

  const totalTasks = tasks.length
  const completedTasks = taskStatusCounts.COMPLETE || 0
  const blockedTasks = taskStatusCounts.BLOCKED || 0
  const openEscalations = (escalations || []).filter(row => row.status !== 'RESOLVED').length
  const criticalEscalations = (escalations || []).filter(row => row.severity === 'CRITICAL' && row.status !== 'RESOLVED').length
  const totalSignoffs = signoffs.length
  const approvedSignoffs = signoffStatusCounts.APPROVED || 0
  const activeDependencies = (dependencies || []).filter(row => row.status !== 'CLEARED').length
  const openHandoffs = (handoffs || []).filter(row => row.status !== 'COMPLETE').length
  const plannedStaff = (staffing || []).reduce((sum, row) => sum + Number(row.plannedCount || 0), 0)
  const checkedInStaff = (staffing || []).reduce((sum, row) => sum + Number(row.checkedInCount || 0), 0)
  const staffingGap = Math.max(plannedStaff - checkedInStaff, 0)
  const departmentMetrics = getDepartmentMetrics({ tasks, staffing, signoffs, escalations, handoffs, dependencies })

  const readinessScore = releasePacket?.readinessScore ?? Math.round((percent(completedTasks, totalTasks) + percent(approvedSignoffs, totalSignoffs) + percent(checkedInStaff, plannedStaff)) / 3)
  const riskIndex = Math.min(100, blockedTasks * 12 + criticalEscalations * 20 + openEscalations * 8 + activeDependencies * 6 + openHandoffs * 5 + staffingGap * 4)
  const releaseConfidence = Math.max(0, Math.min(100, readinessScore - Math.round(riskIndex * 0.55)))
  const bottleneckDepartment = departmentMetrics[0]?.riskScore > 0 ? departmentMetrics[0] : null
  const eventVelocity = operationalTimeline?.summary?.totalEvents ?? auditEvents.length ?? 0

  return {
    operationId: operation.id || null,
    generatedAt: new Date().toISOString(),
    summary: {
      readinessScore,
      riskIndex,
      releaseConfidence,
      taskCompletionPercent: percent(completedTasks, totalTasks),
      signoffApprovalPercent: percent(approvedSignoffs, totalSignoffs),
      staffingCoveragePercent: percent(checkedInStaff, plannedStaff),
      passengerCount: Number(passengerCount || 0),
      eventVelocity,
      bottleneckDepartment: bottleneckDepartment?.departmentRole || 'None'
    },
    counts: {
      totalTasks,
      completedTasks,
      blockedTasks,
      totalSignoffs,
      approvedSignoffs,
      openEscalations,
      criticalEscalations,
      activeDependencies,
      openHandoffs,
      plannedStaff,
      checkedInStaff,
      staffingGap,
      taskStatusCounts,
      signoffStatusCounts,
      escalationStatusCounts,
      handoffStatusCounts,
      dependencyStatusCounts
    },
    departmentMetrics: departmentMetrics.slice(0, 6),
    signals: [
      {
        id: 'release-confidence',
        label: 'Release confidence',
        value: `${releaseConfidence}%`,
        status: releaseConfidence >= 85 ? 'PASS' : releaseConfidence >= 65 ? 'WATCH' : 'ACTION',
        detail: 'Readiness adjusted for active blockers, staffing gaps, escalations, dependencies, and handoffs.'
      },
      {
        id: 'staffing-coverage',
        label: 'Staffing coverage',
        value: `${percent(checkedInStaff, plannedStaff)}%`,
        status: staffingGap === 0 ? 'PASS' : 'WATCH',
        detail: `${checkedInStaff}/${plannedStaff} staff checked in${staffingGap ? `, gap of ${staffingGap}` : ''}.`
      },
      {
        id: 'risk-index',
        label: 'Risk index',
        value: `${riskIndex}`,
        status: riskIndex <= 15 ? 'PASS' : riskIndex <= 45 ? 'WATCH' : 'ACTION',
        detail: `${blockedTasks} blocked tasks, ${openEscalations} open escalations, ${activeDependencies} active dependencies.`
      },
      {
        id: 'department-bottleneck',
        label: 'Department bottleneck',
        value: bottleneckDepartment?.departmentRole || 'None',
        status: bottleneckDepartment ? 'WATCH' : 'PASS',
        detail: bottleneckDepartment ? `Risk score ${bottleneckDepartment.riskScore} with ${bottleneckDepartment.blockedTaskCount} blocked tasks.` : 'No department bottleneck currently detected.'
      }
    ]
  }
}

module.exports = {
  buildTurnaroundOperationalMetrics,
  getDepartmentMetrics,
  percent
}
