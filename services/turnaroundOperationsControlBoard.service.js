function numberFrom(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeStatus(value = '') {
  return String(value || '').trim().toUpperCase()
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(numberFrom(value, 0))))
}

function buildBoardSummary({ tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [], commandCenter = null, continuityCenter = null, shiftBriefing = null, goLiveCenter = null } = {}) {
  tasks = Array.isArray(tasks) ? tasks : []; staffing = Array.isArray(staffing) ? staffing : []; signoffs = Array.isArray(signoffs) ? signoffs : []; escalations = Array.isArray(escalations) ? escalations : []; dependencies = Array.isArray(dependencies) ? dependencies : []; handoffs = Array.isArray(handoffs) ? handoffs : []
  const totalTasks = tasks.length
  const completeTasks = tasks.filter(task => normalizeStatus(task.status) === 'COMPLETE').length
  const blockedTasks = tasks.filter(task => normalizeStatus(task.status) === 'BLOCKED').length
  const openDependencies = dependencies.filter(dependency => normalizeStatus(dependency.status) !== 'CLEARED').length
  const openHandoffs = handoffs.filter(handoff => normalizeStatus(handoff.status) !== 'COMPLETE').length
  const openEscalations = escalations.filter(escalation => !['RESOLVED', 'CLOSED'].includes(normalizeStatus(escalation.status))).length
  const criticalEscalations = escalations.filter(escalation => normalizeStatus(escalation.severity) === 'CRITICAL' && !['RESOLVED', 'CLOSED'].includes(normalizeStatus(escalation.status))).length
  const pendingSignoffs = signoffs.filter(signoff => normalizeStatus(signoff.status) !== 'APPROVED').length
  const staffingGap = staffing.reduce((sum, row) => sum + Math.max(numberFrom(row.plannedCount) - numberFrom(row.checkedInCount), 0), 0)
  const completionPercent = totalTasks ? Math.round((completeTasks / totalTasks) * 100) : 0
  const commandScore = clampScore(commandCenter?.summary?.commandScore ?? commandCenter?.commandScore ?? completionPercent)
  const continuityScore = clampScore(continuityCenter?.summary?.continuityScore ?? continuityCenter?.continuityScore ?? commandScore)
  const briefingScore = clampScore(shiftBriefing?.summary?.briefingScore ?? commandScore)
  const goLiveScore = clampScore(goLiveCenter?.summary?.goLiveScore ?? commandScore)
  const controlScore = clampScore((completionPercent + commandScore + continuityScore + briefingScore + goLiveScore) / 5 - (blockedTasks * 4) - (criticalEscalations * 5) - (openDependencies * 2) - Math.min(staffingGap, 10))
  const blockerCount = blockedTasks + openDependencies + criticalEscalations + pendingSignoffs + Math.min(staffingGap, 99)
  const goNoGoStatus = criticalEscalations > 0 || blockedTasks > 1 || goLiveScore < 60
    ? 'NO_GO'
    : blockerCount > 0 || controlScore < 85
      ? 'WATCH'
      : 'GO'

  return {
    controlScore,
    goNoGoStatus,
    totalTasks,
    completeTasks,
    blockedTasks,
    openDependencies,
    openHandoffs,
    openEscalations,
    criticalEscalations,
    pendingSignoffs,
    staffingGap,
    completionPercent,
    commandScore,
    continuityScore,
    briefingScore,
    goLiveScore,
    blockerCount
  }
}

function buildControlLanes({ summary = {}, commandCenter = null, continuityCenter = null, shiftBriefing = null, goLiveCenter = null } = {}) {
  return [
    {
      id: 'team-readiness',
      label: 'Team Readiness',
      score: Math.max(0, 100 - summary.staffingGap * 8 - summary.pendingSignoffs * 5),
      status: summary.staffingGap || summary.pendingSignoffs ? 'WATCH' : 'READY',
      evidence: `${summary.staffingGap} staffing gaps and ${summary.pendingSignoffs} pending signoffs remain.`
    },
    {
      id: 'critical-path',
      label: 'Critical Path',
      score: summary.commandScore,
      status: summary.openDependencies || summary.blockedTasks ? 'ACTIVE' : 'READY',
      evidence: `${summary.openDependencies} dependencies and ${summary.blockedTasks} blocked tasks are on the command path.`
    },
    {
      id: 'blockers',
      label: 'Blockers',
      score: Math.max(0, 100 - summary.blockerCount * 8),
      status: summary.blockerCount ? 'ACTION_REQUIRED' : 'CLEAR',
      evidence: `${summary.blockerCount} blockers need owner confirmation before final release.`
    },
    {
      id: 'continuity-events',
      label: 'Continuity Events',
      score: summary.continuityScore,
      status: continuityCenter?.commandStatus || continuityCenter?.summary?.commandStatus || 'CONTINUITY_WATCH',
      evidence: continuityCenter?.headline || continuityCenter?.summary?.headline || 'Continuity risks are being monitored through command center signals.'
    },
    {
      id: 'shift-priorities',
      label: 'Shift Briefing Priorities',
      score: summary.briefingScore,
      status: shiftBriefing?.summary?.handoffStatus || 'WATCH_HANDOFF',
      evidence: shiftBriefing?.summary?.nextShiftFocus || 'Next-shift focus remains all departments until the briefing is refreshed.'
    },
    {
      id: 'go-no-go',
      label: 'Go/No-Go Status',
      score: summary.goLiveScore,
      status: summary.goNoGoStatus,
      evidence: goLiveCenter?.summary?.launchRecommendation || 'Launch recommendation is derived from operational control signals.'
    }
  ]
}

function buildControlActions({ tasks = [], escalations = [], dependencies = [], handoffs = [], commandCenter = null, continuityCenter = null, shiftBriefing = null, goLiveCenter = null } = {}) {
  tasks = Array.isArray(tasks) ? tasks : []; escalations = Array.isArray(escalations) ? escalations : []; dependencies = Array.isArray(dependencies) ? dependencies : []; handoffs = Array.isArray(handoffs) ? handoffs : []
  return [
    ...(commandCenter?.decisionQueue || []).map(item => ({ id: `decision-${item.id}`, priority: item.severity || 'NORMAL', owner: item.owner || 'Command', action: item.action || item.decision, source: 'Command center' })),
    ...(shiftBriefing?.criticalItems || []).map(item => ({ id: `briefing-${item.id}`, priority: item.type || 'WATCH', owner: item.owner || item.departmentRole || 'Shift lead', action: `${item.label}: ${item.detail}`, source: 'Shift briefing' })),
    ...(continuityCenter?.watchlist || []).map(item => ({ id: `continuity-${item.id}`, priority: item.type || 'WATCH', owner: item.owner || 'Continuity lead', action: `${item.label}: ${item.detail}`, source: 'Continuity center' })),
    ...(goLiveCenter?.actions || []).map(item => ({ id: `golive-${item.id}`, priority: item.priority || 'WATCH', owner: item.owner || 'Launch owner', action: item.action, source: 'Go/no-go' })),
    ...dependencies.filter(item => normalizeStatus(item.status) !== 'CLEARED').map(item => ({ id: `dependency-${item.id || item.taskName}`, priority: 'HIGH', owner: item.ownerName || 'Dependency owner', action: item.blockerReason || item.notes || item.title || item.taskName, source: 'Critical path' })),
    ...tasks.filter(item => normalizeStatus(item.status) === 'BLOCKED').map(item => ({ id: `task-${item.id || item.taskName}`, priority: 'HIGH', owner: item.ownerName || 'Task owner', action: item.blockerReason || item.notes || item.title || item.taskName, source: 'Blockers' })),
    ...escalations.filter(item => !['RESOLVED', 'CLOSED'].includes(normalizeStatus(item.status))).map(item => ({ id: `escalation-${item.id}`, priority: item.severity || 'MEDIUM', owner: item.ownerName || 'Escalation owner', action: item.resolutionNotes || item.description || item.title, source: 'Escalations' })),
    ...handoffs.filter(item => normalizeStatus(item.status) !== 'COMPLETE').map(item => ({ id: `handoff-${item.id}`, priority: normalizeStatus(item.status) === 'BLOCKED' ? 'HIGH' : 'NORMAL', owner: item.ownerName || 'Handoff owner', action: item.notes || item.title, source: 'Handoffs' }))
  ].filter(item => item.action).slice(0, 12)
}

function buildTurnaroundOperationsControlBoard(input = {}) {
  const summary = buildBoardSummary(input)
  const lanes = buildControlLanes({ ...input, summary })
  const priorityActions = buildControlActions(input)
  const topPriority = priorityActions[0]

  return {
    summary: {
      ...summary,
      headline: summary.goNoGoStatus === 'GO'
        ? 'Turnaround is cleared for controlled release.'
        : summary.goNoGoStatus === 'NO_GO'
          ? 'Turnaround requires command intervention before release.'
          : 'Turnaround is in watch status until remaining control items clear.',
      nextBestAction: topPriority?.action || 'Keep department readiness, command decisions, and release evidence synchronized.'
    },
    lanes,
    priorityActions,
    commandRhythm: [
      'Open with the highest-priority blocker and owner.',
      'Confirm critical-path dependencies before department signoff.',
      'Validate continuity watchlist impact on passengers and crew.',
      'Close the shift briefing with go/no-go evidence and next owner.'
    ]
  }
}

module.exports = {
  buildBoardSummary,
  buildControlActions,
  buildControlLanes,
  buildTurnaroundOperationsControlBoard
}
