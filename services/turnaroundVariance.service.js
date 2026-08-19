function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))))
}

function normalizeDepartmentRole(value) {
  return String(value || 'Unassigned').trim() || 'Unassigned'
}

function buildDepartmentActuals({ tasks = [], staffing = [], signoffs = [], escalations = [], handoffs = [], dependencies = [] } = {}) {
  const rows = new Map()

  function ensureDepartment(departmentRole = 'Unassigned') {
    const key = normalizeDepartmentRole(departmentRole)
    if (!rows.has(key)) {
      rows.set(key, {
        departmentRole: key,
        taskCount: 0,
        completeTaskCount: 0,
        blockedTaskCount: 0,
        plannedStaff: 0,
        checkedInStaff: 0,
        signoffStatus: 'PENDING',
        openEscalationCount: 0,
        openHandoffCount: 0,
        activeDependencyCount: 0
      })
    }
    return rows.get(key)
  }

  for (const task of tasks || []) {
    const row = ensureDepartment(task.departmentRole)
    row.taskCount += 1
    if (task.status === 'COMPLETE') row.completeTaskCount += 1
    if (task.status === 'BLOCKED') row.blockedTaskCount += 1
  }

  for (const row of staffing || []) {
    const department = ensureDepartment(row.departmentRole)
    department.plannedStaff += Number(row.plannedCount || 0)
    department.checkedInStaff += Number(row.checkedInCount || 0)
  }

  for (const signoff of signoffs || []) {
    ensureDepartment(signoff.departmentRole).signoffStatus = signoff.status || 'PENDING'
  }

  for (const escalation of escalations || []) {
    const row = ensureDepartment(escalation.departmentRole)
    if (escalation.status !== 'RESOLVED') row.openEscalationCount += 1
  }

  for (const handoff of handoffs || []) {
    const row = ensureDepartment(handoff.departmentRole)
    if (handoff.status !== 'COMPLETE') row.openHandoffCount += 1
  }

  for (const dependency of dependencies || []) {
    const row = ensureDepartment(dependency.departmentRole)
    if (dependency.status !== 'CLEARED') row.activeDependencyCount += 1
  }

  return rows
}

function scoreDepartmentVariance(actual = {}, baseline = {}) {
  const staffingGap = Math.max(Number(baseline.plannedStaff || 0) - Number(actual.checkedInStaff || 0), 0)
  const taskVariance = Math.max(Number(baseline.taskCount || 0) - Number(actual.completeTaskCount || 0), 0)
  const riskVariance = Number(actual.blockedTaskCount || 0) + Number(actual.openEscalationCount || 0) + Number(actual.openHandoffCount || 0) + Number(actual.activeDependencyCount || 0)
  const signoffPenalty = actual.signoffStatus === 'APPROVED' ? 0 : actual.signoffStatus === 'BLOCKED' ? 18 : 8
  return Math.min(100, taskVariance * 9 + staffingGap * 7 + riskVariance * 8 + signoffPenalty)
}

function getVarianceStatus(score) {
  if (score >= 55) return 'ACTION'
  if (score >= 25) return 'WATCH'
  return 'ON_TRACK'
}

function buildDepartmentVariances({ playbookTemplate = {}, tasks = [], staffing = [], signoffs = [], escalations = [], handoffs = [], dependencies = [] } = {}) {
  const actualsByDepartment = buildDepartmentActuals({ tasks, staffing, signoffs, escalations, handoffs, dependencies })
  const baselineRows = Array.isArray(playbookTemplate.departmentPlaybooks) ? playbookTemplate.departmentPlaybooks : []

  return baselineRows.map(baseline => {
    const departmentRole = normalizeDepartmentRole(baseline.departmentRole)
    const actual = actualsByDepartment.get(departmentRole) || { departmentRole, taskCount: 0, completeTaskCount: 0, checkedInStaff: 0, signoffStatus: 'PENDING' }
    const varianceScore = scoreDepartmentVariance(actual, baseline)

    return {
      departmentRole,
      status: getVarianceStatus(varianceScore),
      varianceScore,
      baselineTaskCount: Number(baseline.taskCount || 0),
      actualTaskCount: Number(actual.taskCount || 0),
      completeTaskCount: Number(actual.completeTaskCount || 0),
      baselinePlannedStaff: Number(baseline.plannedStaff || 0),
      checkedInStaff: Number(actual.checkedInStaff || 0),
      signoffStatus: actual.signoffStatus || 'PENDING',
      exceptionCount: Number(actual.blockedTaskCount || 0) + Number(actual.openEscalationCount || 0) + Number(actual.openHandoffCount || 0) + Number(actual.activeDependencyCount || 0),
      recommendedCadence: baseline.recommendedCadence || '30-minute readiness check'
    }
  }).sort((a, b) => b.varianceScore - a.varianceScore || a.departmentRole.localeCompare(b.departmentRole))
}

function buildVarianceScenario({ releasePacket = null, operationalMetrics = null, departmentVariances = [] } = {}) {
  const readinessScore = Number(releasePacket?.readinessScore ?? operationalMetrics?.summary?.readinessScore ?? 0)
  const riskIndex = Number(operationalMetrics?.summary?.riskIndex ?? 0)
  const varianceRows = Array.isArray(departmentVariances) ? departmentVariances : []
  const highVarianceCount = varianceRows.filter(row => row.status === 'ACTION').length
  const watchVarianceCount = varianceRows.filter(row => row.status === 'WATCH').length
  const rehearsalScore = clampPercent(readinessScore - Math.round(riskIndex * 0.35) - highVarianceCount * 8 - watchVarianceCount * 3)

  return {
    rehearsalScore,
    rehearsalStatus: rehearsalScore >= 85 ? 'GREEN' : rehearsalScore >= 65 ? 'AMBER' : 'RED',
    riskAdjustedReleaseDelta: clampPercent(readinessScore) - rehearsalScore,
    highVarianceCount,
    watchVarianceCount
  }
}

function buildTurnaroundPlaybookVariance({ operation = {}, tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [], releasePacket = null, operationalMetrics = null, playbookTemplate = null } = {}) {
  if (!playbookTemplate) {
    return {
      operationId: operation?.id || null,
      generatedAt: new Date().toISOString(),
      status: 'UNAVAILABLE',
      summary: {
        rehearsalScore: 0,
        rehearsalStatus: 'UNAVAILABLE',
        highVarianceCount: 0,
        watchVarianceCount: 0,
        riskAdjustedReleaseDelta: 0
      },
      departmentVariances: [],
      rehearsalActions: ['Generate a turnaround playbook template before comparing live execution variance.']
    }
  }

  const departmentVariances = buildDepartmentVariances({ playbookTemplate, tasks, staffing, signoffs, escalations, handoffs, dependencies })
  const scenario = buildVarianceScenario({ releasePacket, operationalMetrics, departmentVariances })
  const topVariance = departmentVariances[0]
  const templateReadinessScore = Number(playbookTemplate.summary?.templateReadinessScore || 0)

  return {
    operationId: operation?.id || null,
    generatedAt: new Date().toISOString(),
    status: scenario.rehearsalStatus,
    summary: {
      ...scenario,
      templateReadinessScore,
      comparedDepartmentCount: departmentVariances.length,
      topVarianceDepartment: topVariance?.departmentRole || 'None'
    },
    departmentVariances: departmentVariances.slice(0, 6),
    rehearsalActions: [
      scenario.highVarianceCount > 0
        ? `Stabilize ${scenario.highVarianceCount} department variance before treating the playbook as repeatable.`
        : 'No action-level department variance is blocking playbook rehearsal.',
      topVariance && topVariance.varianceScore > 0
        ? `Review ${topVariance.departmentRole} cadence: ${topVariance.completeTaskCount}/${topVariance.baselineTaskCount} tasks complete, ${topVariance.checkedInStaff}/${topVariance.baselinePlannedStaff} staff checked in.`
        : 'Baseline departments are tracking against current execution.',
      scenario.rehearsalScore >= 85
        ? 'Use this operation as a strong candidate for ship/port template promotion.'
        : 'Run another readiness review after blockers, staffing gaps, and open exceptions are cleared.'
    ]
  }
}

module.exports = {
  buildTurnaroundPlaybookVariance,
  buildDepartmentVariances,
  buildVarianceScenario,
  scoreDepartmentVariance
}
