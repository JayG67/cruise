function percent(numerator, denominator) {
  if (!denominator) return 0
  return Math.max(0, Math.min(100, Math.round((Number(numerator || 0) / Number(denominator || 0)) * 100)))
}

function normalizeRole(role = '') {
  return String(role || 'Unassigned').trim() || 'Unassigned'
}

function getOpenRows(rows = [], closedStatuses = []) {
  const closed = new Set(closedStatuses.map(status => String(status).toUpperCase()))
  return (rows || []).filter(row => !closed.has(String(row.status || '').toUpperCase()))
}

function buildDepartmentLessons({ tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [] } = {}) {
  const departments = new Map()

  function ensureDepartment(role) {
    const key = normalizeRole(role)
    if (!departments.has(key)) {
      departments.set(key, {
        departmentRole: key,
        totalTasks: 0,
        completedTasks: 0,
        blockedTasks: 0,
        staffingGap: 0,
        signoffStatus: 'PENDING',
        openEscalations: 0,
        activeDependencies: 0,
        openHandoffs: 0
      })
    }
    return departments.get(key)
  }

  for (const task of tasks || []) {
    const department = ensureDepartment(task.departmentRole)
    department.totalTasks += 1
    if (String(task.status || '').toUpperCase() === 'COMPLETE') department.completedTasks += 1
    if (String(task.status || '').toUpperCase() === 'BLOCKED') department.blockedTasks += 1
  }

  for (const row of staffing || []) {
    const department = ensureDepartment(row.departmentRole)
    department.staffingGap += Math.max(Number(row.plannedCount || 0) - Number(row.checkedInCount || 0), 0)
  }

  for (const signoff of signoffs || []) {
    ensureDepartment(signoff.departmentRole).signoffStatus = signoff.status || 'PENDING'
  }

  for (const escalation of escalations || []) {
    const department = ensureDepartment(escalation.departmentRole)
    if (String(escalation.status || '').toUpperCase() !== 'RESOLVED') department.openEscalations += 1
  }

  for (const dependency of dependencies || []) {
    const department = ensureDepartment(dependency.departmentRole)
    if (String(dependency.status || '').toUpperCase() !== 'CLEARED') department.activeDependencies += 1
  }

  for (const handoff of handoffs || []) {
    const department = ensureDepartment(handoff.departmentRole)
    if (String(handoff.status || '').toUpperCase() !== 'COMPLETE') department.openHandoffs += 1
  }

  return [...departments.values()]
    .map(department => {
      const completionPercent = percent(department.completedTasks, department.totalTasks)
      const lessonScore = Math.min(100,
        department.blockedTasks * 18 +
        department.staffingGap * 10 +
        department.openEscalations * 16 +
        department.activeDependencies * 10 +
        department.openHandoffs * 8 +
        (String(department.signoffStatus).toUpperCase() === 'BLOCKED' ? 20 : String(department.signoffStatus).toUpperCase() === 'APPROVED' ? 0 : 8) +
        (completionPercent < 75 ? 12 : 0)
      )

      return {
        ...department,
        completionPercent,
        lessonScore,
        recommendation: buildDepartmentRecommendation({ ...department, completionPercent, lessonScore })
      }
    })
    .sort((a, b) => b.lessonScore - a.lessonScore || a.departmentRole.localeCompare(b.departmentRole))
}

function buildDepartmentRecommendation(department = {}) {
  if (department.blockedTasks > 0) return `Review ${department.blockedTasks} blocked task${department.blockedTasks === 1 ? '' : 's'} before promoting this operation as a clean baseline.`
  if (department.openEscalations > 0) return `Capture escalation resolution notes and owner follow-up for ${department.departmentRole}.`
  if (department.staffingGap > 0) return `Adjust staffing baseline by ${department.staffingGap} role${department.staffingGap === 1 ? '' : 's'} for this ship and port pattern.`
  if (department.activeDependencies > 0) return 'Add earlier dependency confirmation gates to the reusable playbook.'
  if (department.openHandoffs > 0) return 'Clarify handoff timing, owner accountability, and acceptance criteria.'
  if (department.completionPercent < 75) return 'Review task sequencing and timing assumptions before next turnaround.'
  return 'Baseline appears stable; preserve task cadence and owner model for the reusable playbook.'
}

function buildAfterActionFindings({ tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [], operationalMetrics = null, playbookVariance = null, incidentCommand = null } = {}) {
  const blockedTasks = getOpenRows(tasks.filter(task => String(task.status || '').toUpperCase() === 'BLOCKED'), [])
  const openEscalations = getOpenRows(escalations, ['RESOLVED'])
  const activeDependencies = getOpenRows(dependencies, ['CLEARED'])
  const openHandoffs = getOpenRows(handoffs, ['COMPLETE'])
  const staffingGap = (staffing || []).reduce((sum, row) => sum + Math.max(Number(row.plannedCount || 0) - Number(row.checkedInCount || 0), 0), 0)
  const blockedSignoffs = (signoffs || []).filter(row => String(row.status || '').toUpperCase() === 'BLOCKED')
  const releaseConfidence = Number(operationalMetrics?.summary?.releaseConfidence || 0)
  const rehearsalScore = Number(playbookVariance?.summary?.rehearsalScore || 0)
  const incidentScore = Number(incidentCommand?.incidentScore || 0)

  const findings = []

  findings.push({
    id: 'release-confidence-review',
    label: 'Release confidence review',
    status: releaseConfidence >= 85 ? 'STRENGTH' : releaseConfidence >= 65 ? 'WATCH' : 'ACTION',
    detail: releaseConfidence >= 85 ? 'Operation is trending as a strong reusable baseline.' : `Release confidence is ${releaseConfidence}%, so the operation should be reviewed before becoming a template.`
  })

  if (blockedTasks.length > 0) {
    findings.push({ id: 'blocked-task-review', label: 'Blocked task lessons', status: 'ACTION', detail: `${blockedTasks.length} blocked task${blockedTasks.length === 1 ? '' : 's'} require root-cause notes.` })
  }

  if (openEscalations.length > 0) {
    findings.push({ id: 'escalation-review', label: 'Escalation closure', status: openEscalations.some(row => String(row.severity || '').toUpperCase() === 'CRITICAL') ? 'ACTION' : 'WATCH', detail: `${openEscalations.length} open escalation${openEscalations.length === 1 ? '' : 's'} should be closed or converted into follow-up actions.` })
  }

  if (staffingGap > 0) {
    findings.push({ id: 'staffing-baseline-review', label: 'Staffing baseline adjustment', status: 'WATCH', detail: `${staffingGap} staffing gap${staffingGap === 1 ? '' : 's'} should feed the next port/ship staffing plan.` })
  }

  if (activeDependencies.length > 0 || openHandoffs.length > 0 || blockedSignoffs.length > 0) {
    findings.push({ id: 'release-gate-review', label: 'Release gate review', status: 'WATCH', detail: `${activeDependencies.length} active dependencies, ${openHandoffs.length} open handoffs, and ${blockedSignoffs.length} blocked signoffs need commander review.` })
  }

  findings.push({
    id: 'playbook-rehearsal-review',
    label: 'Playbook rehearsal review',
    status: rehearsalScore >= 85 && incidentScore < 35 ? 'STRENGTH' : rehearsalScore >= 70 ? 'WATCH' : 'ACTION',
    detail: `Rehearsal score ${rehearsalScore || 0}% with incident score ${incidentScore || 0}.`
  })

  return findings.slice(0, 6)
}

function buildFollowUpActions({ departmentLessons = [], findings = [], playbookTemplate = null, incidentCommand = null } = {}) {
  const actions = []
  const topDepartments = departmentLessons.filter(row => row.lessonScore > 0).slice(0, 3)

  if (findings.some(finding => finding.id === 'blocked-task-review')) {
    actions.push('Document root cause and unblock criteria for every blocked task before the next sailing-day rehearsal.')
  }

  if (findings.some(finding => finding.id === 'escalation-review')) {
    actions.push('Convert unresolved escalations into accountable follow-up tasks with owners and due times.')
  }

  if (topDepartments.length > 0) {
    actions.push(`Run department debrief for ${topDepartments.map(row => row.departmentRole).join(', ')}.`)
  }

  if (playbookTemplate?.summary?.templateReadinessScore >= 80) {
    actions.push('Promote stable task timing, staffing targets, and handoff gates into the reusable turnaround playbook draft.')
  } else {
    actions.push('Keep this operation in rehearsal status until playbook readiness reaches the promotion threshold.')
  }

  if (incidentCommand?.commandActions?.length > 0) {
    actions.push(`Commander follow-up: ${incidentCommand.commandActions[0]}`)
  }

  return [...new Set(actions)].slice(0, 5)
}

function buildTurnaroundAfterActionReview({ operation = {}, tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [], auditEvents = [], operationalTimeline = null, operationalMetrics = null, playbookTemplate = null, playbookVariance = null, incidentCommand = null } = {}) {
  const departmentLessons = buildDepartmentLessons({ tasks, staffing, signoffs, escalations, dependencies, handoffs })
  const findings = buildAfterActionFindings({ tasks, staffing, signoffs, escalations, dependencies, handoffs, operationalMetrics, playbookVariance, incidentCommand })
  const actionCount = findings.filter(finding => finding.status === 'ACTION').length
  const watchCount = findings.filter(finding => finding.status === 'WATCH').length
  const strengthCount = findings.filter(finding => finding.status === 'STRENGTH').length
  const releaseConfidence = Number(operationalMetrics?.summary?.releaseConfidence || 0)
  const rehearsalScore = Number(playbookVariance?.summary?.rehearsalScore || 0)
  const incidentScore = Number(incidentCommand?.incidentScore || 0)
  const timelineEvents = Number(operationalTimeline?.summary?.totalEvents || auditEvents.length || 0)
  const reviewScore = Math.max(0, Math.min(100, Math.round(((releaseConfidence || 0) + (rehearsalScore || 0) + Math.max(0, 100 - incidentScore)) / 3) - actionCount * 5))
  const reviewStatus = actionCount > 1 ? 'NEEDS_DEBRIEF' : watchCount > 1 ? 'FOLLOW_UP' : 'READY_TO_PROMOTE'

  return {
    operationId: operation.id || null,
    generatedAt: new Date().toISOString(),
    summary: {
      reviewScore,
      reviewStatus,
      actionCount,
      watchCount,
      strengthCount,
      releaseConfidence,
      rehearsalScore,
      incidentScore,
      timelineEvents,
      topLessonDepartment: departmentLessons[0]?.departmentRole || 'None'
    },
    findings,
    departmentLessons: departmentLessons.slice(0, 5),
    followUpActions: buildFollowUpActions({ departmentLessons, findings, playbookTemplate, incidentCommand })
  }
}

module.exports = {
  buildTurnaroundAfterActionReview,
  buildDepartmentLessons,
  buildAfterActionFindings,
  buildFollowUpActions
}
