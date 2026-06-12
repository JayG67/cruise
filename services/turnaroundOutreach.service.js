function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function normalizeStatus(value, fallback = 'REVIEW') {
  return String(value || fallback).replace(/_/g, ' ').trim()
}

function firstNonEmpty(...values) {
  return values.find(value => String(value || '').trim().length > 0) || ''
}

function getDataQualityRisk(dataQuality = {}) {
  return Number(dataQuality.blockerCount || 0) +
    Number(dataQuality.openEscalations || 0) +
    Number(dataQuality.staffingGaps || 0) +
    Number(dataQuality.incompleteSignoffs || 0) +
    Number(dataQuality.openDependencies || 0) +
    Number(dataQuality.openHandoffs || 0)
}

function buildOutreachReadiness({ reviewerPacket = null, executiveBrief = null, afterActionReview = null, incidentCommand = null } = {}) {
  const reviewerScore = clampScore(reviewerPacket?.readiness?.readinessScore || 0)
  const executiveScore = clampScore(executiveBrief?.summary?.decisionScore || reviewerScore)
  const reviewScore = clampScore(afterActionReview?.summary?.reviewScore || executiveBrief?.summary?.reviewScore || reviewerScore)
  const incidentScore = clampScore(incidentCommand?.incidentScore || executiveBrief?.summary?.incidentScore || 0)
  const dataQualityRisk = getDataQualityRisk(reviewerPacket?.dataQuality || {})
  const dataQualityScore = clampScore(100 - (dataQualityRisk * 8))
  const readinessScore = clampScore((reviewerScore * 0.34) + (executiveScore * 0.28) + (reviewScore * 0.14) + ((100 - incidentScore) * 0.14) + (dataQualityScore * 0.1))

  let readinessStatus = 'READY_TO_SEND'
  if (readinessScore < 65 || incidentScore >= 70 || dataQualityRisk >= 8) readinessStatus = 'HOLD_FOR_FIXES'
  else if (readinessScore < 78 || incidentScore >= 45 || dataQualityRisk >= 5) readinessStatus = 'REVIEW_BEFORE_SEND'
  else if (readinessScore < 88 || dataQualityRisk >= 2) readinessStatus = 'READY_WITH_NOTES'

  return {
    readinessScore,
    readinessStatus,
    reviewerScore,
    executiveScore,
    reviewScore,
    incidentScore,
    dataQualityRisk,
    dataQualityScore
  }
}

function buildOutreachNarrative({ operation = {}, readiness = {}, reviewerPacket = null, executiveBrief = null } = {}) {
  const shipName = operation.shipName || 'Selected ship'
  const cruiseLineName = operation.cruiseLineName || 'selected cruise line'
  const status = normalizeStatus(readiness.readinessStatus)
  const packetAction = firstNonEmpty(
    reviewerPacket?.narrative?.topAction,
    executiveBrief?.executiveActions?.[0],
    'Review the role-scoped dashboards, reviewer packet, executive brief, and audit-backed operations evidence before sending.'
  )

  return {
    headline: `${shipName} outreach packet is ${readiness.readinessScore || 0}% ready for cruise-line review.`,
    positioning: `Use this board to prepare a reviewer-facing application narrative for ${cruiseLineName} and similar cruise lines without changing demo-mode role assumption.`,
    statusLine: `Outreach status: ${status}.`,
    recommendedAction: packetAction
  }
}

function buildApplicationChecklist({ reviewerPacket = null, executiveBrief = null, afterActionReview = null, incidentCommand = null } = {}) {
  const dataQuality = reviewerPacket?.dataQuality || {}
  const checklist = [
    {
      id: 'reviewer-packet',
      label: 'Reviewer packet',
      status: reviewerPacket?.readiness?.readinessScore >= 78 ? 'READY' : 'REVIEW',
      detail: `${reviewerPacket?.readiness?.readinessScore || 0}% reviewer packet readiness with ${normalizeStatus(reviewerPacket?.readiness?.readinessStatus, 'review status')}.`
    },
    {
      id: 'executive-brief',
      label: 'Executive brief',
      status: executiveBrief?.summary?.decisionScore >= 78 ? 'READY' : 'REVIEW',
      detail: `${executiveBrief?.summary?.decisionScore || 0}% executive decision score with ${normalizeStatus(executiveBrief?.summary?.decisionStatus, 'decision status')}.`
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
      status: Number(incidentCommand?.incidentScore || 0) < 35 ? 'READY' : Number(incidentCommand?.incidentScore || 0) < 65 ? 'WATCH' : 'FIX',
      detail: `Incident command score ${incidentCommand?.incidentScore || 0}; severity ${normalizeStatus(incidentCommand?.incidentSeverity, 'stable')}.`
    },
    {
      id: 'learning-loop',
      label: 'After-action learning loop',
      status: afterActionReview?.summary?.reviewScore >= 75 ? 'READY' : 'REVIEW',
      detail: `${afterActionReview?.summary?.reviewScore || 0}% after-action review score with ${normalizeStatus(afterActionReview?.summary?.reviewStatus, 'follow up')}.`
    }
  ]

  return checklist
}

function buildOutreachAssets({ reviewerPacket = null, executiveBrief = null, afterActionReview = null } = {}) {
  const proofPoints = reviewerPacket?.proofPoints || []
  const executiveHighlights = executiveBrief?.highlights || executiveBrief?.decisionHighlights || []
  const lessons = afterActionReview?.departmentLessons || []

  return [
    {
      id: 'packet-summary',
      label: 'One-page packet summary',
      status: 'READY',
      detail: firstNonEmpty(reviewerPacket?.narrative?.summary, 'Reviewer packet summary is available from operational evidence.')
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
      status: `${executiveHighlights.length || 3} READY`,
      detail: executiveHighlights.slice(0, 2).join(' ') || firstNonEmpty(executiveBrief?.narrative?.summary, 'Executive brief is ready for reviewer discussion.')
    },
    {
      id: 'lessons',
      label: 'Lessons and follow-ups',
      status: `${lessons.length} TRACKED`,
      detail: lessons.slice(0, 2).map(lesson => `${lesson.departmentRole}: ${lesson.lesson}`).join(' ') || firstNonEmpty(afterActionReview?.followUpActions?.[0], 'After-action follow-ups are tracked for the selected operation.')
    }
  ]
}

function buildTargetRecommendations({ operation = {}, readiness = {}, reviewerPacket = null } = {}) {
  const cruiseLineName = operation.cruiseLineName || 'Current cruise line'
  const shipName = operation.shipName || 'selected ship'
  const readinessStatus = readiness.readinessStatus || 'REVIEW_BEFORE_SEND'
  const proofPoint = reviewerPacket?.proofPoints?.[0]?.label || 'role-scoped turnaround operations'

  const sendStatus = readinessStatus === 'READY_TO_SEND' ? 'SEND_READY' : readinessStatus === 'READY_WITH_NOTES' ? 'SEND_WITH_NOTES' : 'HOLD'

  return [
    {
      id: 'current-line',
      label: cruiseLineName,
      status: sendStatus,
      detail: `${shipName} packet should lead with ${proofPoint.toLowerCase()} and reviewer readiness ${readiness.readinessScore || 0}%.`
    },
    {
      id: 'large-ship-operators',
      label: 'Large-ship operators',
      status: readiness.readinessScore >= 78 ? 'TARGET_NEXT' : 'WAIT',
      detail: 'Position turnaround command center, department signoffs, staffing coverage, incident bridge, and release readiness as scalable fleet operations evidence.'
    },
    {
      id: 'premium-family-lines',
      label: 'Premium and family lines',
      status: readiness.dataQualityRisk <= 3 ? 'TARGET_NEXT' : 'WAIT',
      detail: 'Lead with passenger/group role assumption, booking visibility, itinerary context, and ship-aware booking filters alongside operations maturity.'
    },
    {
      id: 'operations-tech-reviewers',
      label: 'Operations technology reviewers',
      status: 'TARGET_NEXT',
      detail: 'Show audit-backed CRUD, scoped API data, role-specific dashboards, quality console checks, Cypress coverage, Playwright coverage, and data hardening roadmap.'
    }
  ]
}

function buildOutreachActionPlan({ readiness = {}, reviewerPacket = null, executiveBrief = null, afterActionReview = null } = {}) {
  const actions = []

  if (readiness.readinessStatus === 'HOLD_FOR_FIXES') {
    actions.push('Resolve hold-level data-quality, incident, or readiness issues before sending the packet externally.')
  } else if (readiness.readinessStatus === 'REVIEW_BEFORE_SEND') {
    actions.push('Review watch items and add short reviewer notes before sending outreach.')
  } else {
    actions.push('Prepare the reviewer packet and executive brief for cruise-line outreach.')
  }

  actions.push(firstNonEmpty(reviewerPacket?.nextSteps?.[0], executiveBrief?.executiveActions?.[0], 'Open the reviewer packet, executive brief, and role dashboards before outreach.'))
  actions.push(firstNonEmpty(afterActionReview?.followUpActions?.[0], 'Use after-action lessons to explain how the platform improves over repeated turnarounds.'))
  actions.push('Keep demo role assumption enabled so reviewers can inspect admin, passenger, group leader, turnaround manager, and department-lead perspectives without a login wall.')

  return actions
}

function buildTurnaroundOutreachBoard({ operation = {}, reviewerPacket = null, executiveBrief = null, afterActionReview = null, incidentCommand = null } = {}) {
  const readiness = buildOutreachReadiness({ reviewerPacket, executiveBrief, afterActionReview, incidentCommand })

  return {
    readiness,
    narrative: buildOutreachNarrative({ operation, readiness, reviewerPacket, executiveBrief }),
    checklist: buildApplicationChecklist({ reviewerPacket, executiveBrief, afterActionReview, incidentCommand }),
    assets: buildOutreachAssets({ reviewerPacket, executiveBrief, afterActionReview }),
    targetRecommendations: buildTargetRecommendations({ operation, readiness, reviewerPacket }),
    actionPlan: buildOutreachActionPlan({ readiness, reviewerPacket, executiveBrief, afterActionReview })
  }
}

module.exports = {
  buildTurnaroundOutreachBoard,
  buildOutreachReadiness,
  buildApplicationChecklist,
  buildTargetRecommendations
}
