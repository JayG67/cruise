function normalizeDepartmentRole(value) {
  return String(value || 'Unassigned').trim() || 'Unassigned'
}

function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase()
}

function incidentSeverityWeight(severity = '', status = '') {
  const normalizedSeverity = normalizeStatus(severity)
  const normalizedStatus = normalizeStatus(status)

  if (normalizedStatus === 'BLOCKED' || normalizedSeverity === 'CRITICAL') return 4
  if (normalizedSeverity === 'HIGH' || normalizedSeverity === 'ACTION') return 3
  if (normalizedSeverity === 'WATCH' || normalizedStatus === 'OPEN') return 2
  return 1
}

function getIncidentStatus(score = 0) {
  if (score >= 70) return 'MAJOR_INCIDENT'
  if (score >= 40) return 'ACTIVE_INCIDENT'
  if (score >= 18) return 'WATCH'
  return 'STABLE'
}

function getIncidentSeverity(score = 0) {
  if (score >= 70) return 'CRITICAL'
  if (score >= 40) return 'HIGH'
  if (score >= 18) return 'WATCH'
  return 'LOW'
}

function buildIncidentKey(source, id, fallback) {
  return `${source}:${id || fallback}`
}

function addDepartmentRisk(risks, departmentRole, score) {
  const key = normalizeDepartmentRole(departmentRole)
  risks.set(key, Number(risks.get(key) || 0) + Number(score || 0))
}

function buildIncidentSignals({ tasks = [], dependencies = [], handoffs = [], escalations = [], staffing = [], signoffs = [] } = {}) {
  const signals = []
  const departmentRisks = new Map()

  for (const task of tasks || []) {
    if (normalizeStatus(task.status) !== 'BLOCKED') continue
    const score = 16
    addDepartmentRisk(departmentRisks, task.departmentRole, score)
    signals.push({
      id: buildIncidentKey('TASK', task.id, task.taskName),
      source: 'TASK',
      departmentRole: normalizeDepartmentRole(task.departmentRole),
      severity: 'HIGH',
      title: task.taskName || 'Blocked turnaround task',
      detail: task.blockerReason || task.location || 'Task is blocked and requires operational intervention.',
      ownerDisplayName: task.ownerDisplayName || task.ownerName || 'Owner pending',
      score
    })
  }

  for (const escalation of escalations || []) {
    if (normalizeStatus(escalation.status) === 'RESOLVED') continue
    const score = 10 + incidentSeverityWeight(escalation.severity, escalation.status) * 6
    addDepartmentRisk(departmentRisks, escalation.departmentRole, score)
    signals.push({
      id: buildIncidentKey('ESCALATION', escalation.id, escalation.title),
      source: 'ESCALATION',
      departmentRole: normalizeDepartmentRole(escalation.departmentRole),
      severity: normalizeStatus(escalation.severity) || 'WATCH',
      title: escalation.title || 'Open escalation',
      detail: escalation.resolutionNotes || 'Escalation is still open for command review.',
      ownerDisplayName: escalation.ownerDisplayName || escalation.ownerName || 'Owner pending',
      score
    })
  }

  for (const dependency of dependencies || []) {
    if (normalizeStatus(dependency.status) === 'CLEARED') continue
    const score = 12
    addDepartmentRisk(departmentRisks, dependency.departmentRole, score)
    signals.push({
      id: buildIncidentKey('DEPENDENCY', dependency.id, dependency.taskName),
      source: 'DEPENDENCY',
      departmentRole: normalizeDepartmentRole(dependency.departmentRole),
      severity: 'WATCH',
      title: dependency.taskName || 'Active dependency',
      detail: dependency.dependsOnTaskName ? `Waiting on ${dependency.dependsOnTaskName}` : 'Dependency must clear before release.',
      ownerDisplayName: 'Command center',
      score
    })
  }

  for (const handoff of handoffs || []) {
    if (normalizeStatus(handoff.status) === 'COMPLETE') continue
    const score = normalizeStatus(handoff.status) === 'BLOCKED' ? 14 : 8
    addDepartmentRisk(departmentRisks, handoff.departmentRole, score)
    signals.push({
      id: buildIncidentKey('HANDOFF', handoff.id, handoff.departmentRole),
      source: 'HANDOFF',
      departmentRole: normalizeDepartmentRole(handoff.departmentRole),
      severity: normalizeStatus(handoff.status) === 'BLOCKED' ? 'HIGH' : 'WATCH',
      title: `${normalizeDepartmentRole(handoff.departmentRole)} handoff`,
      detail: handoff.notes || (handoff.dueTime ? `Due ${handoff.dueTime}` : 'Handoff remains open.'),
      ownerDisplayName: handoff.ownerDisplayName || handoff.ownerName || 'Owner pending',
      score
    })
  }

  for (const row of staffing || []) {
    const planned = Number(row.plannedCount || 0)
    const checkedIn = Number(row.checkedInCount || 0)
    const gap = Math.max(planned - checkedIn, 0)
    if (gap <= 0) continue
    const score = Math.min(20, gap * 5)
    addDepartmentRisk(departmentRisks, row.departmentRole, score)
    signals.push({
      id: buildIncidentKey('STAFFING', row.id, row.departmentRole),
      source: 'STAFFING',
      departmentRole: normalizeDepartmentRole(row.departmentRole),
      severity: gap >= 3 ? 'HIGH' : 'WATCH',
      title: `${normalizeDepartmentRole(row.departmentRole)} staffing gap`,
      detail: `${checkedIn}/${planned} checked in${row.musterLocation ? ` at ${row.musterLocation}` : ''}.`,
      ownerDisplayName: row.leadDisplayName || row.leadName || 'Lead pending',
      score
    })
  }

  for (const signoff of signoffs || []) {
    if (normalizeStatus(signoff.status) === 'APPROVED') continue
    const score = normalizeStatus(signoff.status) === 'BLOCKED' ? 14 : 6
    addDepartmentRisk(departmentRisks, signoff.departmentRole, score)
    signals.push({
      id: buildIncidentKey('SIGNOFF', signoff.id, signoff.departmentRole),
      source: 'SIGNOFF',
      departmentRole: normalizeDepartmentRole(signoff.departmentRole),
      severity: normalizeStatus(signoff.status) === 'BLOCKED' ? 'HIGH' : 'WATCH',
      title: `${normalizeDepartmentRole(signoff.departmentRole)} readiness signoff`,
      detail: signoff.notes || 'Readiness approval is not complete.',
      ownerDisplayName: signoff.approverDisplayName || signoff.approverName || 'Approver pending',
      score
    })
  }

  return {
    signals: signals.sort((a, b) => b.score - a.score || a.departmentRole.localeCompare(b.departmentRole)).slice(0, 8),
    departmentRisks
  }
}

function buildIncidentCommandPlan({ incidentStatus, incidentSeverity, signals = [], releasePacket = null, playbookVariance = null } = {}) {
  const topSignal = signals[0]
  const actions = []

  if (topSignal) {
    actions.push(`Assign command follow-up for ${topSignal.departmentRole}: ${topSignal.title}.`)
  }

  if (incidentSeverity === 'CRITICAL' || incidentStatus === 'MAJOR_INCIDENT') {
    actions.push('Hold final embarkation release until critical incident signals are resolved or accepted by command.')
  } else if (incidentSeverity === 'HIGH') {
    actions.push('Run a department lead standup before advancing release readiness.')
  } else if (incidentSeverity === 'WATCH') {
    actions.push('Keep watch items on the command board and confirm owners before boarding begins.')
  } else {
    actions.push('No active incident bridge is required; continue normal readiness cadence.')
  }

  if (releasePacket?.releaseStatus === 'NOT_READY') {
    actions.push('Tie incident closure to release-packet blockers before marking the operation ready.')
  }

  if (playbookVariance?.summary?.highVarianceCount > 0) {
    actions.push('Compare incident actions with playbook variance before promoting this operation as a reusable baseline.')
  }

  return actions.slice(0, 4)
}

function buildTurnaroundIncidentCommand({ operation = {}, tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [], releasePacket = null, operationalMetrics = null, operationalTimeline = null, playbookVariance = null } = {}) {
  const { signals, departmentRisks } = buildIncidentSignals({ tasks, staffing, signoffs, escalations, dependencies, handoffs })
  const timelineCriticalCount = Number(operationalTimeline?.summary?.criticalCount || 0)
  const riskIndex = Number(operationalMetrics?.summary?.riskIndex || 0)
  const releaseScore = Number(releasePacket?.readinessScore || operationalMetrics?.summary?.readinessScore || 0)
  const rawIncidentScore = signals.reduce((sum, signal) => sum + Number(signal.score || 0), 0) + timelineCriticalCount * 5 + Math.round(riskIndex * 0.25) - Math.round(releaseScore * 0.08)
  const incidentScore = Math.max(0, Math.min(100, Math.round(rawIncidentScore)))
  const incidentStatus = getIncidentStatus(incidentScore)
  const incidentSeverity = getIncidentSeverity(incidentScore)
  const topDepartments = [...departmentRisks.entries()]
    .map(([departmentRole, riskScore]) => ({ departmentRole, riskScore }))
    .sort((a, b) => b.riskScore - a.riskScore || a.departmentRole.localeCompare(b.departmentRole))
    .slice(0, 4)

  return {
    operationId: operation.id || null,
    generatedAt: new Date().toISOString(),
    incidentScore,
    incidentStatus,
    incidentSeverity,
    summary: {
      activeSignalCount: signals.length,
      timelineCriticalCount,
      topIncidentDepartment: topDepartments[0]?.departmentRole || 'None',
      releaseReadinessScore: releaseScore,
      riskIndex
    },
    incidentSignals: signals,
    incidentDepartments: topDepartments,
    commandActions: buildIncidentCommandPlan({ incidentStatus, incidentSeverity, signals, releasePacket, playbookVariance })
  }
}

module.exports = {
  buildTurnaroundIncidentCommand,
  buildIncidentSignals,
  buildIncidentCommandPlan
}
