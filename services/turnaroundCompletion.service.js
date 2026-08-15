function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function normalizeStatus(value, fallback = 'REVIEW') {
  return String(value || fallback).replace(/_/g, ' ').trim()
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function getPercent(part, total) {
  if (!total) return 0
  return clampScore((Number(part || 0) / Number(total || 1)) * 100)
}

function buildCapabilityStatus({ id, label, score = 0, status = 'REVIEW', detail = '', evidence = [] }) {
  const normalizedScore = clampScore(score)
  let normalizedStatus = status
  if (!normalizedStatus || normalizedStatus === 'REVIEW') {
    normalizedStatus = normalizedScore >= 90 ? 'COMPLETE' : normalizedScore >= 78 ? 'OPERATIONALLY_READY' : normalizedScore >= 62 ? 'IMPROVEMENT_IN_PROGRESS' : 'ACTION_REQUIRED'
  }

  return {
    id,
    label,
    score: normalizedScore,
    status: normalizedStatus,
    detail,
    evidence: asArray(evidence).filter(Boolean).slice(0, 5)
  }
}

function buildTurnaroundCapabilityMap({
  operation = {},
  tasks = [],
  staffing = [],
  signoffs = [],
  escalations = [],
  dependencies = [],
  handoffs = [],
  auditEvents = [],
  releasePacket = null,
  operationalTimeline = null,
  operationalMetrics = null,
  playbookTemplate = null,
  playbookVariance = null,
  incidentCommand = null,
  afterActionReview = null,
  executiveBrief = null,
  reviewerPacket = null,
  outreachBoard = null
} = {}) {
  const taskRows = asArray(tasks)
  const staffingRows = asArray(staffing)
  const signoffRows = asArray(signoffs)
  const dependencyRows = asArray(dependencies)
  const handoffRows = asArray(handoffs)
  const auditRows = asArray(auditEvents)
  const completedTasks = taskRows.filter(task => ['DONE', 'COMPLETE', 'COMPLETED', 'APPROVED'].includes(String(task.status || '').toUpperCase())).length
  const taskCompletion = getPercent(completedTasks, taskRows.length)
  const approvedSignoffs = signoffRows.filter(signoff => String(signoff.status || '').toUpperCase() === 'APPROVED').length
  const signoffCompletion = getPercent(approvedSignoffs, signoffRows.length)
  const closedDependencies = dependencyRows.filter(dependency => String(dependency.status || '').toUpperCase() === 'COMPLETE').length
  const dependencyCompletion = getPercent(closedDependencies, dependencyRows.length)
  const closedHandoffs = handoffRows.filter(handoff => String(handoff.status || '').toUpperCase() === 'COMPLETE').length
  const handoffCompletion = getPercent(closedHandoffs, handoffRows.length)
  const staffingCoverage = clampScore(operationalMetrics?.summary?.staffingCoverage ?? operationalMetrics?.staffingCoverage ?? 0)
  const releaseScore = clampScore(releasePacket?.releaseScore ?? operationalMetrics?.summary?.releaseConfidence ?? executiveBrief?.summary?.releaseConfidence ?? 0)
  const incidentSafety = clampScore(100 - Number(incidentCommand?.incidentScore ?? executiveBrief?.summary?.incidentScore ?? 0))
  const playbookScore = clampScore(playbookVariance?.summary?.rehearsalScore ?? playbookTemplate?.readinessScore ?? 0)
  const reviewScore = clampScore(afterActionReview?.summary?.reviewScore ?? executiveBrief?.summary?.reviewScore ?? 0)
  const reviewerScore = clampScore(reviewerPacket?.readiness?.readinessScore ?? 0)
  const outreachScore = clampScore(outreachBoard?.readiness?.readinessScore ?? 0)
  const timelineEvents = Number(operationalTimeline?.summary?.totalEvents ?? operationalTimeline?.items?.length ?? 0)

  return [
    buildCapabilityStatus({
      id: 'role-scoped-command',
      label: 'Role-scoped command center',
      score: operation?.id ? 95 : 70,
      detail: 'Turnaround managers and department leads can assume assigned operating roles while operational data remains scoped to the selected assignment.',
      evidence: ['Assigned-role access remains enabled', 'Selected operation drives command context', 'Operational users do not receive admin CRUD controls']
    }),
    buildCapabilityStatus({
      id: 'workflow-crud',
      label: 'Operational workflow CRUD',
      score: Math.round((taskCompletion * 0.35) + (staffingCoverage * 0.2) + (dependencyCompletion * 0.15) + (handoffCompletion * 0.15) + (signoffCompletion * 0.15)),
      detail: 'Tasks, staffing, dependencies, handoffs, escalations, and signoffs are live workflow objects rather than static presentation content.',
      evidence: [`${taskRows.length} tasks`, `${staffingRows.length} staffing rows`, `${dependencyRows.length} dependencies`, `${handoffRows.length} handoffs`, `${signoffRows.length} signoffs`]
    }),
    buildCapabilityStatus({
      id: 'release-readiness',
      label: 'Release readiness and metrics',
      score: releaseScore,
      detail: `Release confidence is ${releaseScore}% with metrics, bottleneck, staffing, signoff, and risk signals consolidated for command review.`,
      evidence: ['Operational release packet', 'Risk index', 'Department bottleneck ranking', 'Readiness score']
    }),
    buildCapabilityStatus({
      id: 'audit-timeline',
      label: 'Audit and timeline evidence',
      score: clampScore((Math.min(timelineEvents, 24) / 24) * 70 + (Math.min(auditRows.length, 10) / 10) * 30),
      detail: 'Timeline and audit evidence provide governance-ready proof that operations are tracked across command, department, and release workflows.',
      evidence: [`${timelineEvents} timeline events`, `${auditRows.length} audit events`, 'Task updates', 'Escalation history']
    }),
    buildCapabilityStatus({
      id: 'playbook-rehearsal',
      label: 'Playbooks and rehearsal variance',
      score: playbookScore,
      detail: 'Reusable playbook templates and live variance scoring show whether the selected turnaround can be promoted into a repeatable ship or port operating pattern.',
      evidence: ['Playbook template bridge', 'Department baseline comparison', 'Rehearsal actions']
    }),
    buildCapabilityStatus({
      id: 'incident-after-action',
      label: 'Incident command and after-action loop',
      score: Math.round((incidentSafety * 0.55) + (reviewScore * 0.45)),
      detail: 'Incident command and after-action review close the loop from release-day exceptions to debrief lessons and follow-up actions.',
      evidence: [`Incident severity ${normalizeStatus(incidentCommand?.incidentSeverity, 'stable')}`, `After-action score ${reviewScore}%`, 'Department lessons']
    }),
    buildCapabilityStatus({
      id: 'governance-communications',
      label: 'Governance and stakeholder readiness',
      score: Math.round((reviewerScore * 0.45) + (clampScore(executiveBrief?.summary?.decisionScore ?? 0) * 0.25) + (outreachScore * 0.3)),
      detail: 'Governance evidence, executive briefing, and stakeholder coordination turn operational state into an accountable decision path.',
      evidence: [`Governance evidence ${reviewerScore}%`, `Stakeholder coordination ${outreachScore}%`, 'Executive highlights', 'Governance next steps']
    })
  ]
}

function buildTurnaroundRemainingWork({ capabilities = [], incidentCommand = null, reviewerPacket = null, outreachBoard = null } = {}) {
  const weakCapabilities = capabilities.filter(capability => capability.score < 82)
  const work = weakCapabilities.map(capability => ({
    id: `improve-${capability.id}`,
    label: `Harden ${capability.label.toLowerCase()}`,
    priority: capability.score < 65 ? 'HIGH' : 'MEDIUM',
    detail: capability.detail
  }))

  const incidentScore = Number(incidentCommand?.incidentScore || 0)
  if (incidentScore >= 45) {
    work.unshift({
      id: 'reduce-incident-risk',
      label: 'Reduce incident risk before operational release',
      priority: incidentScore >= 70 ? 'HIGH' : 'MEDIUM',
      detail: `Incident command score is ${incidentScore}; resolve blockers, open dependencies, and staffing/signoff gaps before designating this operation as the verified operating baseline.`
    })
  }

  const dataQualityRisk = Number(outreachBoard?.readiness?.dataQualityRisk || reviewerPacket?.dataQuality?.blockerCount || 0)
  if (dataQualityRisk > 0) {
    work.unshift({
      id: 'clean-data-quality-watch-items',
      label: 'Clean remaining operational data watch items',
      priority: dataQualityRisk >= 5 ? 'HIGH' : 'MEDIUM',
      detail: `${dataQualityRisk} data-quality watch item${dataQualityRisk === 1 ? '' : 's'} remain in the release-governance path.`
    })
  }

  if (work.length === 0) {
    work.push({
      id: 'prepare-operational-review-route',
      label: 'Prepare the operational review route',
      priority: 'MEDIUM',
      detail: 'Core turnaround operations are ready for a role-by-role operational review across stakeholder perspectives.'
    })
  }

  return work.slice(0, 7)
}

function buildTurnaroundNextSlices({ maturityScore = 0, remainingWork = [] } = {}) {
  const highPriority = remainingWork.filter(item => item.priority === 'HIGH')
  const nextSlices = []

  if (highPriority.length > 0) {
    nextSlices.push('Resolve high-priority operational watch items so the selected operation can serve as the reference operating scenario.')
  }

  nextSlices.push('Document an operational review route across Admin, Passenger, Group Leader, Turnaround Manager, and department lead perspectives.')
  nextSlices.push('Complete data architecture assurance behind turnaround operations: durable IDs, constrained statuses, indexed lookups, and controlled seed-data dependencies.')
  nextSlices.push('Add cross-fleet turnaround comparison so leadership can evaluate operating performance across ships and cruise lines.')

  if (maturityScore >= 88) {
    nextSlices.push('Approve the core turnaround release baseline and shift to operating guidance, service evidence, and controlled maintenance.')
  }

  return [...new Set(nextSlices)].slice(0, 5)
}

function buildContinuationSummary({ maturityScore = 0, maturityStatus = 'REVIEW', capabilities = [], remainingWork = [], nextSlices = [] } = {}) {
  return {
    headline: `Turnaround management readiness is ${maturityScore}% with status ${normalizeStatus(maturityStatus)}.`,
    currentState: 'The module covers role-scoped operations, command planning, tasks, staffing, dependencies, handoffs, escalations, signoffs, release readiness, audit and timeline evidence, metrics, playbooks, variance, incident command, after-action review, executive briefing, release evidence, and stakeholder coordination.',
    strongestAreas: capabilities.filter(capability => capability.score >= 85).map(capability => capability.label).slice(0, 5),
    needsAttention: remainingWork.map(item => item.label).slice(0, 5),
    recommendedNext: nextSlices[0] || 'Continue service-assurance review and data architecture governance.'
  }
}

function buildTurnaroundManagementStatus(input = {}) {
  const capabilities = buildTurnaroundCapabilityMap(input)
  const maturityScore = clampScore(capabilities.reduce((sum, capability) => sum + capability.score, 0) / Math.max(capabilities.length, 1))
  let maturityStatus = 'OPERATIONALLY_READY'
  if (maturityScore < 65) maturityStatus = 'ACTION_REQUIRED'
  else if (maturityScore < 78) maturityStatus = 'IMPROVEMENT_IN_PROGRESS'
  else if (maturityScore < 88) maturityStatus = 'OPERATIONALLY_READY_WITH_WATCH_ITEMS'
  else if (maturityScore >= 94) maturityStatus = 'REFERENCE_BASELINE_READY'

  const remainingWork = buildTurnaroundRemainingWork({
    capabilities,
    incidentCommand: input.incidentCommand,
    reviewerPacket: input.reviewerPacket,
    outreachBoard: input.outreachBoard
  })
  const nextSlices = buildTurnaroundNextSlices({ maturityScore, remainingWork })

  return {
    maturityScore,
    maturityStatus,
    completionLabel: `${maturityScore}% turnaround management completion`,
    capabilities,
    remainingWork,
    nextSlices,
    continuationSummary: buildContinuationSummary({ maturityScore, maturityStatus, capabilities, remainingWork, nextSlices })
  }
}

module.exports = {
  buildTurnaroundManagementStatus,
  buildTurnaroundCapabilityMap,
  buildTurnaroundRemainingWork,
  buildTurnaroundNextSlices,
  buildContinuationSummary
}
