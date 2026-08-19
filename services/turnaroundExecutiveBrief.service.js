function asArray(value) {
  return Array.isArray(value) ? value : []
}

function clampScore(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 0
  return Math.max(0, Math.min(100, Math.round(numericValue)))
}

function normalizeCount(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) && numericValue > 0 ? Math.floor(numericValue) : 0
}

function getBriefStatus(score, incidentScore = 0, openActionCount = 0) {
  if (score >= 86 && incidentScore < 25 && openActionCount <= 1) return 'EXECUTIVE_READY'
  if (score >= 72 && incidentScore < 50) return 'READY_WITH_WATCH_ITEMS'
  if (score >= 58) return 'NEEDS_COMMAND_REVIEW'
  return 'NOT_READY'
}

function getBriefTone(status) {
  if (status === 'EXECUTIVE_READY') return 'ready'
  if (status === 'READY_WITH_WATCH_ITEMS') return 'watch'
  if (status === 'NEEDS_COMMAND_REVIEW') return 'review'
  return 'risk'
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return ''
}

function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase()
}

function normalizeNarrative(value) {
  return firstNonEmpty(value)
}

function buildExecutiveDecision({ operationalMetrics = null, incidentCommand = null, afterActionReview = null, releasePacket = null, playbookVariance = null } = {}) {
  const releaseConfidence = clampScore(operationalMetrics?.summary?.releaseConfidence ?? releasePacket?.releaseScore ?? 0)
  const incidentScore = clampScore(incidentCommand?.incidentScore ?? 0)
  const reviewScore = clampScore(afterActionReview?.summary?.reviewScore ?? 0)
  const rehearsalScore = clampScore(playbookVariance?.summary?.rehearsalScore ?? 0)
  const openActionCount = normalizeCount(afterActionReview?.summary?.actionCount)
  const decisionScore = clampScore((releaseConfidence * 0.36) + ((100 - incidentScore) * 0.24) + (reviewScore * 0.24) + (rehearsalScore * 0.16) - (openActionCount * 3))
  const status = getBriefStatus(decisionScore, incidentScore, openActionCount)

  return {
    decisionScore,
    decisionStatus: status,
    decisionTone: getBriefTone(status),
    releaseConfidence,
    incidentScore,
    reviewScore,
    rehearsalScore,
    openActionCount
  }
}

function buildExecutiveHighlights({ operation = {}, operationalMetrics = null, incidentCommand = null, afterActionReview = null, playbookTemplate = null, playbookVariance = null, releasePacket = null } = {}) {
  const signals = asArray(operationalMetrics?.signals)
  const highRiskSignal = signals.find(signal => ['ACTION', 'WATCH'].includes(normalizeStatus(signal.status)))
  const topIncident = asArray(incidentCommand?.incidentSignals)[0]
  const topLesson = afterActionReview?.departmentLessons?.[0]
  const findings = asArray(afterActionReview?.findings)
  const topFinding = findings.find(finding => ['ACTION', 'WATCH'].includes(normalizeStatus(finding.status))) || findings[0]

  return [
    {
      id: 'release-readiness',
      label: 'Release decision',
      status: releasePacket?.status || operationalMetrics?.summary?.releaseStatus || 'IN_REVIEW',
      detail: firstNonEmpty(releasePacket?.summary, highRiskSignal?.detail, `Release confidence ${operationalMetrics?.summary?.releaseConfidence || 0}%.`)
    },
    {
      id: 'incident-bridge',
      label: 'Exception bridge',
      status: incidentCommand?.incidentSeverity || 'LOW',
      detail: firstNonEmpty(topIncident?.detail, asArray(incidentCommand?.commandActions)[0], 'No critical exception bridge is required for the current operation.')
    },
    {
      id: 'playbook-readiness',
      label: 'Playbook promotion',
      status: playbookVariance?.status || playbookTemplate?.status || 'WATCH',
      detail: firstNonEmpty(asArray(playbookVariance?.rehearsalActions)[0], asArray(playbookTemplate?.recommendations)[0], 'Compare final variance before promoting this operation as a reusable baseline.')
    },
    {
      id: 'debrief-followup',
      label: 'Debrief follow-up',
      status: topFinding?.status || afterActionReview?.summary?.reviewStatus || 'FOLLOW_UP',
      detail: firstNonEmpty(topFinding?.detail, topLesson?.recommendation, `Capture final lessons for ${operation.shipName || operation.title || 'this turnaround'}.`)
    }
  ]
}

function buildExecutiveDepartments({ operationalMetrics = null, incidentCommand = null, afterActionReview = null, playbookVariance = null } = {}) {
  const rowsByRole = new Map()

  for (const row of asArray(operationalMetrics?.departmentRisks)) {
    const key = row.departmentRole || row.role || 'department'
    rowsByRole.set(key, {
      departmentRole: key,
      riskScore: clampScore(row.riskScore ?? row.score ?? 0),
      status: row.status || 'WATCH',
      driver: row.driver || row.label || 'Operational signal'
    })
  }

  for (const row of asArray(incidentCommand?.incidentDepartments)) {
    const key = row.departmentRole || row.role || 'department'
    const current = rowsByRole.get(key) || { departmentRole: key, riskScore: 0, status: 'WATCH', driver: 'Incident signal' }
    current.riskScore = Math.max(current.riskScore, clampScore(row.score ?? row.riskScore ?? 0))
    current.status = row.severity || current.status
    current.driver = firstNonEmpty(row.title, row.driver, current.driver)
    rowsByRole.set(key, current)
  }

  for (const row of asArray(afterActionReview?.departmentLessons)) {
    const key = row.departmentRole || 'department'
    const current = rowsByRole.get(key) || { departmentRole: key, riskScore: 0, status: 'WATCH', driver: 'After-action lesson' }
    current.lessonScore = clampScore(row.lessonScore ?? 0)
    current.recommendation = row.recommendation
    rowsByRole.set(key, current)
  }

  for (const row of asArray(playbookVariance?.departments)) {
    const key = row.departmentRole || 'department'
    const current = rowsByRole.get(key) || { departmentRole: key, riskScore: 0, status: 'WATCH', driver: 'Playbook variance' }
    current.varianceScore = clampScore(row.varianceScore ?? 0)
    current.riskScore = Math.max(current.riskScore, current.varianceScore)
    current.recommendation = current.recommendation || row.recommendation
    rowsByRole.set(key, current)
  }

  return [...rowsByRole.values()]
    .sort((a, b) => Number(b.riskScore || 0) - Number(a.riskScore || 0) || String(a.departmentRole).localeCompare(String(b.departmentRole)))
    .slice(0, 5)
}

function buildExecutiveActions({ decision = {}, incidentCommand = null, afterActionReview = null, playbookVariance = null, operationalMetrics = null } = {}) {
  const actions = []

  if (decision.decisionStatus === 'EXECUTIVE_READY') {
    actions.push('Publish the executive turnaround brief for cruise-line leadership review and operational governance.')
  } else if (decision.decisionStatus === 'READY_WITH_WATCH_ITEMS') {
    actions.push('Publish with watch items and explicitly call out the remaining operational owner for each item.')
  } else {
    actions.push('Hold executive promotion until command review clears the top readiness and exception risks.')
  }

  for (const action of asArray(incidentCommand?.commandActions)) {
    const narrative = normalizeNarrative(action)
    if (narrative) actions.push(`Exception bridge: ${narrative}`)
  }
  for (const action of asArray(afterActionReview?.followUpActions)) {
    const narrative = normalizeNarrative(action)
    if (narrative) actions.push(`After-action: ${narrative}`)
  }
  for (const action of asArray(playbookVariance?.rehearsalActions)) {
    const narrative = normalizeNarrative(action)
    if (narrative) actions.push(`Playbook: ${narrative}`)
  }
  for (const signal of asArray(operationalMetrics?.signals)) {
    const label = normalizeNarrative(signal?.label)
    const detail = normalizeNarrative(signal?.detail)
    if (['ACTION', 'WATCH'].includes(normalizeStatus(signal?.status)) && (label || detail)) {
      actions.push(`Metric watch: ${label || 'Operational signal'}${detail ? ` - ${detail}` : ''}`)
    }
  }

  return [...new Set(actions)].slice(0, 7)
}

function buildTurnaroundExecutiveBrief({ operation = {}, releasePacket = null, operationalTimeline = null, operationalMetrics = null, playbookTemplate = null, playbookVariance = null, incidentCommand = null, afterActionReview = null } = {}) {
  const operationContext = operation || {}
  const decision = buildExecutiveDecision({ operationalMetrics, incidentCommand, afterActionReview, releasePacket, playbookVariance })
  const highlights = buildExecutiveHighlights({ operation: operationContext, operationalMetrics, incidentCommand, afterActionReview, playbookTemplate, playbookVariance, releasePacket })
  const departments = buildExecutiveDepartments({ operationalMetrics, incidentCommand, afterActionReview, playbookVariance })
  const executiveActions = buildExecutiveActions({ decision, incidentCommand, afterActionReview, playbookVariance, operationalMetrics })

  return {
    summary: {
      ...decision,
      operationId: operationContext.id,
      operationTitle: operationContext.title,
      shipName: operationContext.shipName,
      cruiseLineName: operationContext.cruiseLineName,
      timelineEvents: normalizeCount(operationalTimeline?.summary?.totalEvents),
      generatedFrom: ['releasePacket', 'operationalMetrics', 'incidentCommand', 'playbookVariance', 'afterActionReview']
    },
    highlights,
    departmentBriefs: departments,
    executiveActions
  }
}

module.exports = {
  buildTurnaroundExecutiveBrief,
  buildExecutiveDecision,
  buildExecutiveHighlights,
  buildExecutiveDepartments,
  buildExecutiveActions
}
