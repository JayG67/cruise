function normalizeStatus(status = '') {
  return String(status || '').trim().toUpperCase()
}

function normalizeRole(role = '') {
  return String(role || 'Unassigned').trim() || 'Unassigned'
}

function finiteCount(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0
}

function getOwner(row = {}) {
  return row.ownerDisplayName || row.ownerName || row.approverDisplayName || row.approverName || row.authorDisplayName || row.authorName || 'Owner pending'
}

function buildBriefingCriticalItems({ tasks = [], dependencies = [], handoffs = [], escalations = [], signoffs = [] } = {}) {
  const items = []

  for (const task of tasks || []) {
    const status = normalizeStatus(task.status)
    if (status === 'BLOCKED' || status === 'NOT_STARTED') {
      items.push({
        id: `task-${task.id || task.taskName}`,
        type: status === 'BLOCKED' ? 'BLOCKER' : 'START_READY',
        departmentRole: normalizeRole(task.departmentRole),
        owner: getOwner(task),
        label: task.taskName || 'Turnaround task',
        detail: task.blockerNotes || task.location || task.plannedTime || 'Task needs command attention.',
        priority: status === 'BLOCKED' ? 90 : 45
      })
    }
  }

  for (const escalation of escalations || []) {
    if (normalizeStatus(escalation.status) !== 'RESOLVED') {
      const severity = normalizeStatus(escalation.severity)
      items.push({
        id: `escalation-${escalation.id || escalation.summary}`,
        type: severity === 'CRITICAL' ? 'CRITICAL_ESCALATION' : 'ESCALATION',
        departmentRole: normalizeRole(escalation.departmentRole),
        owner: getOwner(escalation),
        label: escalation.summary || 'Open escalation',
        detail: escalation.resolutionPlan || escalation.status || 'Escalation needs an owner update.',
        priority: severity === 'CRITICAL' ? 100 : 80
      })
    }
  }

  for (const dependency of dependencies || []) {
    if (normalizeStatus(dependency.status) !== 'CLEARED') {
      items.push({
        id: `dependency-${dependency.id || dependency.taskId || dependency.taskName}`,
        type: 'DEPENDENCY',
        departmentRole: normalizeRole(dependency.departmentRole),
        owner: dependency.ownerDisplayName || 'Gate owner pending',
        label: dependency.taskName || 'Dependency gate',
        detail: dependency.dependsOnTaskName ? `Waiting on ${dependency.dependsOnTaskName}` : 'Dependency still active.',
        priority: 70
      })
    }
  }

  for (const handoff of handoffs || []) {
    if (normalizeStatus(handoff.status) !== 'COMPLETE') {
      items.push({
        id: `handoff-${handoff.id || handoff.handoffName}`,
        type: 'HANDOFF',
        departmentRole: normalizeRole(handoff.departmentRole),
        owner: getOwner(handoff),
        label: handoff.handoffName || 'Operational handoff',
        detail: handoff.acceptanceCriteria || handoff.dueTime || 'Handoff needs acceptance criteria.',
        priority: normalizeStatus(handoff.status) === 'BLOCKED' ? 85 : 55
      })
    }
  }

  for (const signoff of signoffs || []) {
    if (normalizeStatus(signoff.status) !== 'APPROVED') {
      items.push({
        id: `signoff-${signoff.id || signoff.departmentRole}`,
        type: normalizeStatus(signoff.status) === 'BLOCKED' ? 'BLOCKED_SIGNOFF' : 'SIGNOFF',
        departmentRole: normalizeRole(signoff.departmentRole),
        owner: getOwner(signoff),
        label: `${normalizeRole(signoff.departmentRole)} readiness signoff`,
        detail: signoff.notes || 'Readiness signoff is not approved yet.',
        priority: normalizeStatus(signoff.status) === 'BLOCKED' ? 88 : 50
      })
    }
  }

  return items
    .sort((a, b) => b.priority - a.priority || a.departmentRole.localeCompare(b.departmentRole))
    .slice(0, 8)
}

function buildDepartmentBriefs({ tasks = [], staffing = [], signoffs = [], escalations = [] } = {}) {
  const departments = new Map()

  function ensure(role) {
    const key = normalizeRole(role)
    if (!departments.has(key)) {
      departments.set(key, {
        departmentRole: key,
        totalTasks: 0,
        completedTasks: 0,
        blockedTasks: 0,
        staffingGap: 0,
        openEscalations: 0,
        signoffStatus: 'PENDING',
        briefingFocus: 'Maintain assigned turnaround rhythm.'
      })
    }
    return departments.get(key)
  }

  for (const task of tasks || []) {
    const row = ensure(task.departmentRole)
    row.totalTasks += 1
    if (normalizeStatus(task.status) === 'COMPLETE') row.completedTasks += 1
    if (normalizeStatus(task.status) === 'BLOCKED') row.blockedTasks += 1
  }

  for (const staff of staffing || []) {
    ensure(staff.departmentRole).staffingGap += Math.max(finiteCount(staff.plannedCount) - finiteCount(staff.checkedInCount), 0)
  }

  for (const escalation of escalations || []) {
    if (normalizeStatus(escalation.status) !== 'RESOLVED') ensure(escalation.departmentRole).openEscalations += 1
  }

  for (const signoff of signoffs || []) {
    ensure(signoff.departmentRole).signoffStatus = signoff.status || 'PENDING'
  }

  return [...departments.values()]
    .map(row => {
      const completionPercent = row.totalTasks ? Math.round((row.completedTasks / row.totalTasks) * 100) : 0
      let briefingFocus = 'Keep pace and report exceptions before the next command check.'
      if (row.blockedTasks > 0) briefingFocus = 'Unblock task ownership before any release gate is promoted.'
      else if (row.openEscalations > 0) briefingFocus = 'Resolve or reassign escalation ownership before shift turnover.'
      else if (row.staffingGap > 0) briefingFocus = 'Close staffing gap or document coverage workaround.'
      else if (normalizeStatus(row.signoffStatus) !== 'APPROVED') briefingFocus = 'Prepare readiness evidence for signoff approval.'

      return {
        ...row,
        completionPercent,
        briefingFocus
      }
    })
    .sort((a, b) => b.blockedTasks - a.blockedTasks || b.openEscalations - a.openEscalations || a.departmentRole.localeCompare(b.departmentRole))
    .slice(0, 6)
}

function buildShiftChecklist({ releasePacket = null, operationalMetrics = null, commandCenter = null, continuityCenter = null, closeoutPacket = null } = {}) {
  const releaseReady = finiteCount(operationalMetrics?.summary?.releaseConfidence) >= 80
  const commandOpen = finiteCount(commandCenter?.summary?.decisionQueueCount ?? commandCenter?.decisionQueue?.length)
  const continuityOpen = finiteCount(continuityCenter?.summary?.watchlistCount ?? continuityCenter?.watchlist?.length)
  const closeoutScore = finiteCount(closeoutPacket?.summary?.closeoutScore)

  return [
    {
      id: 'release-confidence',
      label: 'Release confidence',
      status: releaseReady ? 'READY' : 'WATCH',
      detail: releaseReady ? 'Release confidence is strong enough for shift handoff.' : 'Commander should review release confidence before shift turnover.'
    },
    {
      id: 'decision-queue',
      label: 'Decision queue',
      status: commandOpen === 0 ? 'READY' : 'ACTION',
      detail: commandOpen === 0 ? 'No command-center decisions are waiting.' : `${commandOpen} command decision${commandOpen === 1 ? '' : 's'} need owner acknowledgement.`
    },
    {
      id: 'continuity-watchlist',
      label: 'Continuity watchlist',
      status: continuityOpen === 0 ? 'READY' : 'WATCH',
      detail: continuityOpen === 0 ? 'No continuity watch items are open.' : `${continuityOpen} continuity watch item${continuityOpen === 1 ? '' : 's'} should be carried into the next shift.`
    },
    {
      id: 'closeout-readiness',
      label: 'Closeout readiness',
      status: closeoutScore >= 80 || releasePacket?.summary?.releaseStatus === 'READY' ? 'READY' : 'WATCH',
      detail: closeoutScore >= 80 ? 'Closeout packet is trending clean.' : 'Closeout evidence should stay visible during shift turnover.'
    }
  ]
}

function buildTurnaroundShiftBriefing({ operation = {}, tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [], releasePacket = null, operationalMetrics = null, commandCenter = null, continuityCenter = null, closeoutPacket = null } = {}) {
  operation = operation || {}
  const criticalItems = buildBriefingCriticalItems({ tasks, dependencies, handoffs, escalations, signoffs })
  const departmentBriefs = buildDepartmentBriefs({ tasks, staffing, signoffs, escalations })
  const checklist = buildShiftChecklist({ releasePacket, operationalMetrics, commandCenter, continuityCenter, closeoutPacket })
  const actionCount = criticalItems.filter(item => item.priority >= 80).length + checklist.filter(item => item.status === 'ACTION').length
  const watchCount = criticalItems.filter(item => item.priority < 80).length + checklist.filter(item => item.status === 'WATCH').length
  const handoffStatus = actionCount > 0 ? 'COMMAND_REVIEW' : watchCount > 1 ? 'WATCH_HANDOFF' : 'READY_HANDOFF'
  const releaseConfidenceSource = operationalMetrics?.summary?.releaseConfidence
  const releaseConfidence = releaseConfidenceSource == null ? 75 : finiteCount(releaseConfidenceSource)
  const briefingScore = Math.max(0, Math.min(100, Math.round(releaseConfidence) - actionCount * 7 - watchCount * 3))

  return {
    operationId: operation.id || null,
    generatedAt: new Date().toISOString(),
    summary: {
      briefingScore,
      handoffStatus,
      actionCount,
      watchCount,
      criticalItemCount: criticalItems.length,
      departmentCount: departmentBriefs.length,
      checklistReadyCount: checklist.filter(item => item.status === 'READY').length,
      nextShiftFocus: criticalItems[0]?.departmentRole || departmentBriefs[0]?.departmentRole || 'All departments'
    },
    criticalItems,
    departmentBriefs,
    checklist
  }
}

module.exports = {
  buildTurnaroundShiftBriefing,
  buildBriefingCriticalItems,
  buildDepartmentBriefs,
  buildShiftChecklist
}
