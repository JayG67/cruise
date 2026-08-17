function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function normalizeStatus(value, fallback = 'REVIEW') {
  return String(value || fallback).replace(/_/g, ' ').trim()
}

function firstNonEmpty(...values) {
  return values.find(value => String(value || '').trim().length > 0) || ''
}

function normalizeRiskCount(value) {
  const count = Number(value)
  if (!Number.isFinite(count)) return 0
  return Math.max(0, Math.trunc(count))
}

function getDataQualityRisk(dataQuality = {}) {
  dataQuality = dataQuality || {}
  return normalizeRiskCount(dataQuality.blockerCount) +
    normalizeRiskCount(dataQuality.openEscalations) +
    normalizeRiskCount(dataQuality.staffingGaps) +
    normalizeRiskCount(dataQuality.incompleteSignoffs) +
    normalizeRiskCount(dataQuality.openDependencies) +
    normalizeRiskCount(dataQuality.openHandoffs)
}

function buildBriefingReadiness({ operationalAssurancePacket = null, executiveBrief = null, afterActionReview = null, incidentCommand = null } = {}) {
  const assuranceScore = clampScore(operationalAssurancePacket?.readiness?.readinessScore ?? 0)
  const executiveScore = clampScore(executiveBrief?.summary?.decisionScore ?? assuranceScore)
  const reviewScore = clampScore(afterActionReview?.summary?.reviewScore ?? executiveBrief?.summary?.reviewScore ?? assuranceScore)
  const incidentScore = clampScore(incidentCommand?.incidentScore ?? executiveBrief?.summary?.incidentScore ?? 0)
  const dataQualityRisk = getDataQualityRisk(operationalAssurancePacket?.dataQuality || {})
  const dataQualityScore = clampScore(100 - (dataQualityRisk * 8))
  const readinessScore = clampScore((assuranceScore * 0.34) + (executiveScore * 0.28) + (reviewScore * 0.14) + ((100 - incidentScore) * 0.14) + (dataQualityScore * 0.1))

  let readinessStatus = 'READY_FOR_BRIEFING'
  if (readinessScore < 65 || incidentScore >= 70 || dataQualityRisk >= 8) readinessStatus = 'HOLD_FOR_FIXES'
  else if (readinessScore < 78 || incidentScore >= 45 || dataQualityRisk >= 5) readinessStatus = 'REVIEW_BEFORE_BRIEFING'
  else if (readinessScore < 88 || dataQualityRisk >= 2) readinessStatus = 'READY_WITH_NOTES'

  return {
    readinessScore,
    readinessStatus,
    assuranceScore,
    executiveScore,
    reviewScore,
    incidentScore,
    dataQualityRisk,
    dataQualityScore
  }
}

function buildBriefingNarrative({ operation = {}, readiness = {}, operationalAssurancePacket = null, executiveBrief = null } = {}) {
  operation = operation || {}
  const shipName = operation.shipName || 'Selected ship'
  const cruiseLineName = operation.cruiseLineName || 'selected cruise line'
  const status = normalizeStatus(readiness.readinessStatus)
  const packetAction = firstNonEmpty(
    operationalAssurancePacket?.narrative?.topAction,
    executiveBrief?.executiveActions?.[0],
    'Review the role-scoped dashboards, operational assurance packet, executive brief, and audit-backed evidence before the leadership briefing.'
  )

  return {
    headline: `${shipName} operational briefing is ${readiness.readinessScore || 0}% ready.`,
    positioning: `Use this board to prepare a concise operations briefing for ${cruiseLineName} leadership and cross-department command teams.`,
    statusLine: `Briefing status: ${status}.`,
    recommendedAction: packetAction
  }
}

function buildBriefingChecklist({ operationalAssurancePacket = null, executiveBrief = null, afterActionReview = null, incidentCommand = null } = {}) {
  const dataQuality = operationalAssurancePacket?.dataQuality || {}
  return [
    {
      id: 'operational-assurance',
      label: 'Operational assurance',
      status: operationalAssurancePacket?.readiness?.readinessScore >= 78 ? 'READY' : 'REVIEW',
      detail: `${operationalAssurancePacket?.readiness?.readinessScore ?? 0}% assurance readiness with ${normalizeStatus(operationalAssurancePacket?.readiness?.readinessStatus, 'assurance status')}.`
    },
    {
      id: 'executive-brief',
      label: 'Executive brief',
      status: executiveBrief?.summary?.decisionScore >= 78 ? 'READY' : 'REVIEW',
      detail: `${executiveBrief?.summary?.decisionScore ?? 0}% executive decision score with ${normalizeStatus(executiveBrief?.summary?.decisionStatus, 'decision status')}.`
    },
    {
      id: 'data-quality',
      label: 'Operational data quality',
      status: getDataQualityRisk(dataQuality) === 0 ? 'READY' : getDataQualityRisk(dataQuality) <= 3 ? 'WATCH' : 'FIX',
      detail: `${getDataQualityRisk(dataQuality)} open data-quality watch item${getDataQualityRisk(dataQuality) === 1 ? '' : 's'} across blockers, escalations, staffing, signoffs, dependencies, and handoffs.`
    },
    {
      id: 'incident-risk',
      label: 'Incident risk',
      status: Number(incidentCommand?.incidentScore ?? 0) < 35 ? 'READY' : Number(incidentCommand?.incidentScore ?? 0) < 65 ? 'WATCH' : 'FIX',
      detail: `Incident command score ${incidentCommand?.incidentScore ?? 0}; severity ${normalizeStatus(incidentCommand?.incidentSeverity, 'stable')}.`
    },
    {
      id: 'learning-loop',
      label: 'After-action learning loop',
      status: afterActionReview?.summary?.reviewScore >= 75 ? 'READY' : 'REVIEW',
      detail: `${afterActionReview?.summary?.reviewScore ?? 0}% after-action review score with ${normalizeStatus(afterActionReview?.summary?.reviewStatus, 'follow up')}.`
    }
  ]
}

function buildBriefingAssets({ operationalAssurancePacket = null, executiveBrief = null, afterActionReview = null } = {}) {
  const proofPoints = Array.isArray(operationalAssurancePacket?.proofPoints) ? operationalAssurancePacket.proofPoints : []
  const executiveHighlights = Array.isArray(executiveBrief?.highlights) ? executiveBrief.highlights : (Array.isArray(executiveBrief?.decisionHighlights) ? executiveBrief.decisionHighlights : [])
  const lessons = Array.isArray(afterActionReview?.departmentLessons) ? afterActionReview.departmentLessons : []

  return [
    {
      id: 'assurance-summary',
      label: 'Assurance summary',
      status: 'READY',
      detail: firstNonEmpty(operationalAssurancePacket?.narrative?.summary, 'Operational assurance summary is available from current evidence.')
    },
    {
      id: 'proof-points',
      label: 'Operational proof points',
      status: `${proofPoints.length} READY`,
      detail: proofPoints.slice(0, 3).map(point => point.label).join(', ') || 'Role-scoped operations, release readiness, and audit evidence are ready.'
    },
    {
      id: 'executive-highlights',
      label: 'Executive highlights',
      status: `${executiveHighlights.length} READY`,
      detail: executiveHighlights.slice(0, 2).join(' ') || firstNonEmpty(executiveBrief?.narrative?.summary, 'Executive brief is ready for leadership discussion.')
    },
    {
      id: 'lessons',
      label: 'Lessons and follow-ups',
      status: `${lessons.length} TRACKED`,
      detail: lessons.slice(0, 2).map(lesson => `${lesson.departmentRole}: ${lesson.lesson}`).join(' ') || firstNonEmpty(afterActionReview?.followUpActions?.[0], 'After-action follow-ups are tracked for the selected operation.')
    }
  ]
}

function buildAudienceRecommendations({ operation = {}, readiness = {}, operationalAssurancePacket = null } = {}) {
  operation = operation || {}
  const cruiseLineName = operation.cruiseLineName || 'Current cruise line'
  const shipName = operation.shipName || 'selected ship'
  const readinessStatus = readiness.readinessStatus || 'REVIEW_BEFORE_BRIEFING'
  const proofPoint = operationalAssurancePacket?.proofPoints?.[0]?.label || 'role-scoped turnaround operations'
  const briefingStatus = readinessStatus === 'READY_FOR_BRIEFING' ? 'READY' : readinessStatus === 'READY_WITH_NOTES' ? 'READY_WITH_NOTES' : 'HOLD'

  return [
    {
      id: 'line-leadership',
      label: `${cruiseLineName} leadership`,
      status: briefingStatus,
      detail: `${shipName} briefing should lead with ${String(proofPoint).toLowerCase()} and assurance readiness ${readiness.readinessScore ?? 0}%.`
    },
    {
      id: 'ship-command',
      label: 'Ship command team',
      status: readiness.readinessScore >= 78 ? 'READY' : 'WAIT',
      detail: 'Focus on command-center status, department signoffs, staffing coverage, incident response, and release readiness.'
    },
    {
      id: 'department-leads',
      label: 'Department leads',
      status: readiness.dataQualityRisk <= 3 ? 'READY' : 'WAIT',
      detail: 'Lead with assigned tasks, handoffs, staffing gaps, dependency gates, and department readiness approvals.'
    },
    {
      id: 'operations-technology',
      label: 'Operations technology team',
      status: 'READY',
      detail: 'Cover audit-backed workflows, scoped API data, role-specific dashboards, quality controls, automated tests, and data governance and assurance.'
    }
  ]
}

function buildBriefingActionPlan({ readiness = {}, operationalAssurancePacket = null, executiveBrief = null, afterActionReview = null } = {}) {
  const actions = []

  if (readiness.readinessStatus === 'HOLD_FOR_FIXES') {
    actions.push('Resolve hold-level data-quality, incident, or readiness issues before the leadership briefing.')
  } else if (readiness.readinessStatus === 'REVIEW_BEFORE_BRIEFING') {
    actions.push('Review watch items and add short command notes before the briefing.')
  } else {
    actions.push('Prepare the operational assurance packet and executive brief for leadership review.')
  }

  actions.push(firstNonEmpty(operationalAssurancePacket?.nextSteps?.[0], executiveBrief?.executiveActions?.[0], 'Open the operational assurance packet, executive brief, and role dashboards before the briefing.'))
  actions.push(firstNonEmpty(afterActionReview?.followUpActions?.[0], 'Use after-action lessons to improve repeated turnarounds.'))
  actions.push('Confirm role-scoped access and current operational data before briefing each command audience.')

  return actions
}

function buildTurnaroundOperationalBriefingBoard({ operation = {}, operationalAssurancePacket = null, executiveBrief = null, afterActionReview = null, incidentCommand = null } = {}) {
  const readiness = buildBriefingReadiness({ operationalAssurancePacket, executiveBrief, afterActionReview, incidentCommand })

  return {
    readiness,
    narrative: buildBriefingNarrative({ operation, readiness, operationalAssurancePacket, executiveBrief }),
    checklist: buildBriefingChecklist({ operationalAssurancePacket, executiveBrief, afterActionReview, incidentCommand }),
    assets: buildBriefingAssets({ operationalAssurancePacket, executiveBrief, afterActionReview }),
    audienceRecommendations: buildAudienceRecommendations({ operation, readiness, operationalAssurancePacket }),
    actionPlan: buildBriefingActionPlan({ readiness, operationalAssurancePacket, executiveBrief, afterActionReview })
  }
}

module.exports = {
  buildTurnaroundOperationalBriefingBoard,
  buildBriefingReadiness,
  buildBriefingChecklist,
  buildAudienceRecommendations
}
