function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function normalizeStatus(value, fallback = 'REVIEW') {
  return String(value || fallback).replace(/_/g, ' ').trim()
}

function firstNonEmpty(...values) {
  return values.find(value => String(value || '').trim().length > 0) || ''
}

function buildPacketReadiness({ executiveBrief = null, releasePacket = null, incidentCommand = null, afterActionReview = null, playbookVariance = null } = {}) {
  const executiveScore = clampScore(executiveBrief?.summary?.decisionScore || 0)
  const releaseScore = clampScore(releasePacket?.releaseScore || executiveBrief?.summary?.releaseConfidence || 0)
  const incidentScore = clampScore(incidentCommand?.incidentScore || executiveBrief?.summary?.incidentScore || 0)
  const debriefScore = clampScore(afterActionReview?.summary?.reviewScore || executiveBrief?.summary?.reviewScore || 0)
  const rehearsalScore = clampScore(playbookVariance?.summary?.rehearsalScore || executiveBrief?.summary?.rehearsalScore || 0)
  const readinessScore = clampScore((executiveScore * 0.34) + (releaseScore * 0.24) + ((100 - incidentScore) * 0.18) + (debriefScore * 0.14) + (rehearsalScore * 0.1))
  let status = 'READY_FOR_CRUISE_LINE_REVIEW'
  if (readinessScore < 62 || incidentScore >= 70) status = 'HOLD_FOR_COMMAND_REVIEW'
  else if (readinessScore < 78 || incidentScore >= 45) status = 'REVIEW_WITH_WATCH_ITEMS'
  else if (readinessScore < 88) status = 'READY_WITH_NOTES'

  return {
    readinessScore,
    readinessStatus: status,
    executiveScore,
    releaseScore,
    incidentScore,
    debriefScore,
    rehearsalScore
  }
}

function buildPacketHeader({ operation = {}, readiness = {} } = {}) {
  return {
    title: `${operation.shipName || operation.title || 'Turnaround operation'} reviewer packet`,
    subtitle: `${operation.cruiseLineName || 'Cruise line'} · ${operation.turnaroundDate || 'scheduled turnaround'}`,
    operationId: operation.id,
    shipName: operation.shipName,
    cruiseLineName: operation.cruiseLineName,
    turnaroundDate: operation.turnaroundDate,
    portName: operation.portName || operation.embarkationPort || operation.departurePort || 'Port operations',
    status: readiness.readinessStatus,
    score: readiness.readinessScore
  }
}

function buildReviewerProofPoints({ operation = {}, executiveBrief = null, releasePacket = null, operationalTimeline = null, operationalMetrics = null, playbookTemplate = null, playbookVariance = null, incidentCommand = null, afterActionReview = null } = {}) {
  const proofPoints = []

  proofPoints.push({
    id: 'role-scoped-operations',
    label: 'Role-scoped operations',
    status: 'DEMO_READY',
    detail: `${operation.shipName || 'The selected ship'} is reviewed through assigned turnaround, department lead, and command-center perspectives without exposing unrelated cruise-line data.`
  })

  proofPoints.push({
    id: 'release-readiness',
    label: 'Release readiness',
    status: normalizeStatus(releasePacket?.status || operationalMetrics?.summary?.releaseStatus, 'IN REVIEW'),
    detail: firstNonEmpty(releasePacket?.summary, `Release confidence ${operationalMetrics?.summary?.releaseConfidence || executiveBrief?.summary?.releaseConfidence || 0}%.`)
  })

  proofPoints.push({
    id: 'timeline-depth',
    label: 'Operational evidence trail',
    status: `${operationalTimeline?.summary?.totalEvents || executiveBrief?.summary?.timelineEvents || 0} EVENTS`,
    detail: 'Timeline combines command status, task activity, staffing, dependencies, handoffs, signoffs, escalations, and audit evidence into one operating record.'
  })

  proofPoints.push({
    id: 'playbook-promotion',
    label: 'Reusable playbook path',
    status: normalizeStatus(playbookVariance?.summary?.status || playbookTemplate?.status, 'WATCH'),
    detail: firstNonEmpty(playbookVariance?.rehearsalActions?.[0], playbookTemplate?.nextBestActions?.[0], playbookTemplate?.recommendations?.[0], 'Review variance before promotion to a repeatable ship or port playbook.')
  })

  proofPoints.push({
    id: 'incident-command',
    label: 'Incident command bridge',
    status: normalizeStatus(incidentCommand?.incidentSeverity, 'LOW'),
    detail: firstNonEmpty(incidentCommand?.commandActions?.[0], 'No critical release-day exception bridge is required for the current operation.')
  })

  proofPoints.push({
    id: 'after-action-review',
    label: 'After-action learning loop',
    status: normalizeStatus(afterActionReview?.summary?.reviewStatus, 'FOLLOW UP'),
    detail: firstNonEmpty(afterActionReview?.followUpActions?.[0], afterActionReview?.findings?.[0]?.detail, 'Capture final lessons and close remaining debrief follow-ups after operation completion.')
  })

  return proofPoints
}

function buildReviewerNarrative({ operation = {}, readiness = {}, executiveBrief = null, incidentCommand = null, afterActionReview = null } = {}) {
  const status = normalizeStatus(readiness.readinessStatus)
  const topAction = firstNonEmpty(executiveBrief?.executiveActions?.[0], incidentCommand?.commandActions?.[0], afterActionReview?.followUpActions?.[0], 'Continue reviewer validation with role-specific dashboards and operational audit evidence.')

  return {
    summary: `${operation.shipName || 'This ship'} is at ${readiness.readinessScore || 0}% reviewer readiness with status ${status}.`,
    reviewerPositioning: 'This packet is designed for cruise-line reviewers who need a fast, evidence-backed view of operational maturity without reading every dashboard panel.',
    topAction
  }
}

function buildReviewerDataQuality({ tasks = [], staffing = [], signoffs = [], dependencies = [], handoffs = [], escalations = [], auditEvents = [] } = {}) {
  const blockerCount = tasks.filter(task => String(task.status || '').toUpperCase() === 'BLOCKED' || String(task.blocker || '').trim()).length
  const openEscalations = escalations.filter(escalation => !['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase())).length
  const staffingGaps = staffing.filter(row => Number(row.assignedCount || row.assigned || 0) < Number(row.requiredCount || row.required || 0)).length
  const incompleteSignoffs = signoffs.filter(signoff => String(signoff.status || '').toUpperCase() !== 'APPROVED').length
  const openDependencies = dependencies.filter(dependency => String(dependency.status || '').toUpperCase() !== 'COMPLETE').length
  const openHandoffs = handoffs.filter(handoff => String(handoff.status || '').toUpperCase() !== 'COMPLETE').length

  return {
    taskCount: tasks.length,
    blockerCount,
    openEscalations,
    staffingGaps,
    incompleteSignoffs,
    openDependencies,
    openHandoffs,
    auditEventCount: auditEvents.length,
    status: blockerCount + openEscalations + staffingGaps + incompleteSignoffs + openDependencies + openHandoffs === 0 ? 'CLEAN' : 'WATCH'
  }
}

function buildReviewerNextSteps({ readiness = {}, executiveBrief = null, afterActionReview = null, incidentCommand = null, playbookVariance = null } = {}) {
  const steps = []

  if (readiness.readinessStatus === 'READY_FOR_CRUISE_LINE_REVIEW') {
    steps.push('Use the executive brief and reviewer packet as the lead demonstration path for cruise-line outreach.')
  } else {
    steps.push('Resolve the top watch items before presenting this operation as the primary cruise-line demonstration scenario.')
  }

  for (const action of executiveBrief?.executiveActions || []) steps.push(`Executive: ${action}`)
  for (const action of incidentCommand?.commandActions || []) steps.push(`Incident command: ${action}`)
  for (const action of afterActionReview?.followUpActions || []) steps.push(`After action: ${action}`)
  for (const action of playbookVariance?.rehearsalActions || []) steps.push(`Playbook variance: ${action}`)

  return [...new Set(steps)].slice(0, 8)
}

function buildTurnaroundReviewerPacket({ operation = {}, tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [], auditEvents = [], releasePacket = null, operationalTimeline = null, operationalMetrics = null, playbookTemplate = null, playbookVariance = null, incidentCommand = null, afterActionReview = null, executiveBrief = null } = {}) {
  const readiness = buildPacketReadiness({ executiveBrief, releasePacket, incidentCommand, afterActionReview, playbookVariance })

  return {
    header: buildPacketHeader({ operation, readiness }),
    narrative: buildReviewerNarrative({ operation, readiness, executiveBrief, incidentCommand, afterActionReview }),
    readiness,
    proofPoints: buildReviewerProofPoints({ operation, executiveBrief, releasePacket, operationalTimeline, operationalMetrics, playbookTemplate, playbookVariance, incidentCommand, afterActionReview }),
    dataQuality: buildReviewerDataQuality({ tasks, staffing, signoffs, dependencies, handoffs, escalations, auditEvents }),
    nextSteps: buildReviewerNextSteps({ readiness, executiveBrief, afterActionReview, incidentCommand, playbookVariance })
  }
}

module.exports = {
  buildTurnaroundReviewerPacket,
  buildPacketReadiness,
  buildPacketHeader,
  buildReviewerProofPoints,
  buildReviewerNarrative,
  buildReviewerDataQuality,
  buildReviewerNextSteps
}
