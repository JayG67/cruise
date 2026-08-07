function number(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function getSummary(operation, key, fallbackItems = []) {
  const summary = operation?.[key]
  if (summary && typeof summary === 'object') return summary
  return { total: Array.isArray(fallbackItems) ? fallbackItems.length : 0 }
}

function getTaskMetrics(operation = {}) {
  const tasks = Array.isArray(operation.tasks) ? operation.tasks : []
  const summary = getSummary(operation, 'taskSummary', tasks)
  const complete = number(summary.completeTasks ?? tasks.filter(task => String(task.status).toUpperCase() === 'COMPLETE').length)
  const blocked = number(summary.blockedTasks ?? tasks.filter(task => String(task.status).toUpperCase() === 'BLOCKED').length)
  const total = number(summary.totalTasks ?? tasks.length)
  return { total, complete, blocked, open: Math.max(total - complete, 0) }
}

function getOperationalRisk(operation = {}) {
  const tasks = getTaskMetrics(operation)
  const staffingGap = number(operation.staffingSummary?.gapCount)
  const openEscalations = number(operation.escalationSummary?.openEscalations)
  const criticalEscalations = number(operation.escalationSummary?.criticalEscalations)
  const blockedSignoffs = number(operation.signoffSummary?.blockedSignoffs)
  const pendingSignoffs = number(operation.signoffSummary?.pendingSignoffs)

  if (criticalEscalations > 0 || tasks.blocked > 0 || blockedSignoffs > 0) return 'ATTENTION'
  if (openEscalations > 0 || staffingGap > 0 || pendingSignoffs > 0) return 'WATCH'
  return 'ON_TRACK'
}

function buildPriorityActions(operation = {}) {
  const taskMetrics = getTaskMetrics(operation)
  const actions = []
  const openEscalations = number(operation.escalationSummary?.openEscalations)
  const staffingGap = number(operation.staffingSummary?.gapCount)
  const pendingSignoffs = number(operation.signoffSummary?.pendingSignoffs)
  const activeDependencies = number(operation.dependencySummary?.activeDependencies)
  const openHandoffs = number(operation.handoffSummary?.openHandoffs)

  if (taskMetrics.blocked > 0) actions.push({ id: 'blocked-tasks', label: `${taskMetrics.blocked} blocked task${taskMetrics.blocked === 1 ? '' : 's'}`, detail: 'Resolve blockers before they affect the departure sequence.', tone: 'attention' })
  if (openEscalations > 0) actions.push({ id: 'escalations', label: `${openEscalations} open escalation${openEscalations === 1 ? '' : 's'}`, detail: 'Confirm ownership, response timing, and resolution status.', tone: 'attention' })
  if (staffingGap > 0) actions.push({ id: 'staffing', label: `${staffingGap} staffing position${staffingGap === 1 ? '' : 's'} unfilled`, detail: 'Close department coverage gaps before operational release.', tone: 'watch' })
  if (pendingSignoffs > 0) actions.push({ id: 'signoffs', label: `${pendingSignoffs} readiness signoff${pendingSignoffs === 1 ? '' : 's'} pending`, detail: 'Obtain department approval before final departure clearance.', tone: 'watch' })
  if (activeDependencies > 0) actions.push({ id: 'dependencies', label: `${activeDependencies} active dependenc${activeDependencies === 1 ? 'y' : 'ies'}`, detail: 'Sequence dependent work so downstream teams are not delayed.', tone: 'watch' })
  if (openHandoffs > 0) actions.push({ id: 'handoffs', label: `${openHandoffs} open handoff${openHandoffs === 1 ? '' : 's'}`, detail: 'Confirm the receiving team has accepted each operational handoff.', tone: 'watch' })
  if (actions.length === 0) actions.push({ id: 'on-track', label: 'No immediate operational exceptions', detail: 'Continue monitoring task completion, staffing, and department signoffs.', tone: 'ready' })

  return actions
}

function buildOperationsIntelligence(operation = {}) {
  const taskMetrics = getTaskMetrics(operation)
  const risk = getOperationalRisk(operation)
  const shipName = operation.ship?.name || operation.shipName || 'Ship not assigned'
  const cruiseLineName = operation.cruiseLine?.name || operation.cruiseLineName || 'Cruise line not assigned'
  const departureDate = operation.sailing?.departureDate || operation.turnaroundDate || 'Date not assigned'
  const port = operation.port || operation.arrivalPort || operation.sailing?.departurePort || 'Port not assigned'

  return {
    id: operation.id || '',
    title: operation.title || `${shipName} turnaround`,
    shipName,
    cruiseLineName,
    departureDate,
    port,
    risk,
    riskLabel: risk === 'ON_TRACK' ? 'On track' : risk === 'ATTENTION' ? 'Immediate attention' : 'Watch closely',
    metrics: [
      { id: 'tasks', label: 'Open tasks', value: taskMetrics.open, detail: `${taskMetrics.complete} of ${taskMetrics.total} complete` },
      { id: 'staffing', label: 'Staffing gap', value: number(operation.staffingSummary?.gapCount), detail: `${number(operation.staffingSummary?.checkedInCount)} checked in` },
      { id: 'escalations', label: 'Open escalations', value: number(operation.escalationSummary?.openEscalations), detail: `${number(operation.escalationSummary?.criticalEscalations)} critical` },
      { id: 'signoffs', label: 'Pending signoffs', value: number(operation.signoffSummary?.pendingSignoffs), detail: `${number(operation.signoffSummary?.approvedSignoffs)} approved` }
    ],
    actions: buildPriorityActions(operation)
  }
}

function buildFleetIntelligence(operations = []) {
  const models = (Array.isArray(operations) ? operations : []).map(buildOperationsIntelligence)
  return {
    operationCount: models.length,
    attentionCount: models.filter(model => model.risk === 'ATTENTION').length,
    watchCount: models.filter(model => model.risk === 'WATCH').length,
    onTrackCount: models.filter(model => model.risk === 'ON_TRACK').length,
    models
  }
}

export { buildFleetIntelligence, buildOperationsIntelligence, buildPriorityActions, getOperationalRisk }
