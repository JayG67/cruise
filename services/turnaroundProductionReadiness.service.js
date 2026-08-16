function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeStatus(value, fallback = 'REVIEW') {
  return String(value || fallback).replace(/_/g, ' ').trim()
}

function countItems(rows, predicate) {
  return asArray(rows).filter(predicate).length
}

function buildReadinessInputs({
  operation = {},
  tasks = [],
  staffing = [],
  signoffs = [],
  escalations = [],
  dependencies = [],
  handoffs = [],
  releasePacket = null,
  operationalMetrics = null,
  playbookVariance = null,
  incidentCommand = null,
  afterActionReview = null,
  executiveBrief = null,
  reviewerPacket = null,
  outreachBoard = null,
  managementStatus = null,
  launchPlan = null,
  scenarioPlan = null
} = {}) {
  const operationDetails = operation || {}
  const totalTasks = asArray(tasks).length
  const completedTasks = countItems(tasks, task => String(task.status || '').toUpperCase() === 'COMPLETED')
  const blockedTasks = countItems(tasks, task => ['BLOCKED', 'AT_RISK'].includes(String(task.status || '').toUpperCase()))
  const unresolvedEscalations = countItems(escalations, escalation => !['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase()))
  const openDependencies = countItems(dependencies, dependency => !['CLEARED', 'COMPLETE', 'COMPLETED'].includes(String(dependency.status || '').toUpperCase()))
  const incompleteHandoffs = countItems(handoffs, handoff => !['COMPLETE', 'COMPLETED'].includes(String(handoff.status || '').toUpperCase()))
  const staffingGaps = countItems(staffing, row => Number(row.requiredCount || row.required || 0) > Number(row.assignedCount || row.assigned || 0))
  const approvedSignoffs = countItems(signoffs, signoff => String(signoff.status || '').toUpperCase() === 'APPROVED')
  const taskCompletion = totalTasks ? clampScore((completedTasks / totalTasks) * 100) : 0
  const signoffCompletion = asArray(signoffs).length ? clampScore((approvedSignoffs / asArray(signoffs).length) * 100) : 0

  return {
    operationId: operationDetails.id,
    shipName: operationDetails.shipName || operationDetails.ship?.name || 'Selected ship',
    cruiseLineName: operationDetails.cruiseLineName || operationDetails.cruiseLine?.name || 'Selected cruise line',
    turnaroundDate: operationDetails.turnaroundDate || operationDetails.date || 'Selected turnaround',
    releaseScore: clampScore(releasePacket?.releaseScore ?? operationalMetrics?.summary?.releaseConfidence ?? executiveBrief?.summary?.releaseConfidence ?? 0),
    launchScore: clampScore(launchPlan?.launchScore ?? 0),
    scenarioScore: clampScore(scenarioPlan?.resilienceScore ?? 0),
    managementScore: clampScore(managementStatus?.maturityScore ?? 0),
    reviewerScore: clampScore(reviewerPacket?.readiness?.readinessScore ?? 0),
    outreachScore: clampScore(outreachBoard?.readiness?.readinessScore ?? 0),
    afterActionScore: clampScore(afterActionReview?.summary?.reviewScore ?? 0),
    incidentScore: clampScore(incidentCommand?.incidentScore ?? executiveBrief?.summary?.incidentScore ?? 0),
    varianceScore: clampScore(100 - Number(playbookVariance?.varianceScore ?? 0)),
    taskCompletion,
    signoffCompletion,
    blockedTasks,
    unresolvedEscalations,
    openDependencies,
    incompleteHandoffs,
    staffingGaps,
    totalTasks,
    completedTasks,
    launchStatus: normalizeStatus(launchPlan?.launchStatus, 'REVIEW'),
    scenarioStatus: normalizeStatus(scenarioPlan?.scenarioStatus, 'REVIEW'),
    managementStatus: normalizeStatus(managementStatus?.maturityStatus, 'IMPROVEMENT IN PROGRESS'),
    releaseStatus: normalizeStatus(releasePacket?.releaseStatus, 'REVIEW'),
    incidentSeverity: normalizeStatus(incidentCommand?.incidentSeverity, 'STABLE')
  }
}

function buildProductionGates(inputs = {}) {
  const gateDefinitions = [
    ['release-certification', 'Release certification', inputs.releaseScore, `${inputs.releaseStatus} release state with ${inputs.blockedTasks} blocked or at-risk tasks.`],
    ['workflow-completion', 'Workflow completion', inputs.taskCompletion, `${inputs.completedTasks} of ${inputs.totalTasks} turnaround tasks completed.`],
    ['department-signoff', 'Department signoff', inputs.signoffCompletion, `${inputs.signoffCompletion}% of department signoffs are approved.`],
    ['incident-control', 'Incident control', clampScore(100 - inputs.incidentScore), `${inputs.incidentSeverity} incident command state with score ${inputs.incidentScore}.`],
    ['launch-plan', 'Launch plan', inputs.launchScore, `${inputs.launchStatus} launch gate readiness.`],
    ['scenario-resilience', 'Scenario resilience', inputs.scenarioScore, `${inputs.scenarioStatus} drill and contingency coverage.`],
    ['management-maturity', 'Management maturity', inputs.managementScore, `${inputs.managementStatus} continuation state.`],
    ['governance-evidence', 'Governance evidence', Math.round((inputs.reviewerScore + inputs.outreachScore) / 2), 'Executive evidence and stakeholder coordination records are ready for operational governance review.']
  ]

  return gateDefinitions.map(([id, label, score, detail]) => {
    const readinessScore = clampScore(score)
    return {
      id,
      label,
      readinessScore,
      status: readinessScore >= 90 ? 'READY' : readinessScore >= 78 ? 'WATCH' : 'BLOCKED',
      detail
    }
  })
}

function buildProductionBlockers(inputs = {}) {
  const blockers = []

  if (inputs.blockedTasks > 0) blockers.push({ id: 'blocked-tasks', severity: 'HIGH', owner: 'Turnaround Manager', detail: `${inputs.blockedTasks} tasks are blocked or at risk before operational release signoff.` })
  if (inputs.unresolvedEscalations > 0) blockers.push({ id: 'open-escalations', severity: 'HIGH', owner: 'Incident Commander', detail: `${inputs.unresolvedEscalations} escalation items need closure or a documented risk acceptance decision.` })
  if (inputs.openDependencies > 0) blockers.push({ id: 'open-dependencies', severity: 'MEDIUM', owner: 'Department Leads', detail: `${inputs.openDependencies} dependencies still need release-gate evidence.` })
  if (inputs.incompleteHandoffs > 0) blockers.push({ id: 'handoff-gaps', severity: 'MEDIUM', owner: 'Shift Leads', detail: `${inputs.incompleteHandoffs} handoffs are not yet complete.` })
  if (inputs.staffingGaps > 0) blockers.push({ id: 'staffing-gaps', severity: 'MEDIUM', owner: 'Staffing Coordinator', detail: `${inputs.staffingGaps} staffing plans are under target.` })
  if (inputs.launchScore < 78) blockers.push({ id: 'launch-plan-watch', severity: 'HIGH', owner: 'Launch Lead', detail: 'Launch plan is below the minimum operational release threshold.' })
  if (inputs.scenarioScore < 78) blockers.push({ id: 'scenario-watch', severity: 'MEDIUM', owner: 'Operations Lead', detail: 'Scenario plan needs stronger contingency evidence before operational release signoff.' })

  if (!blockers.length) {
    blockers.push({ id: 'no-critical-blockers', severity: 'INFO', owner: 'Turnaround Manager', detail: 'No critical operational release blockers are present; keep monitoring watch items.' })
  }

  return blockers.slice(0, 8)
}

function buildProductionRunbook(inputs = {}, gates = [], blockers = []) {
  const weakestGate = [...gates].sort((a, b) => a.readinessScore - b.readinessScore)[0]
  const firstBlocker = blockers.find(blocker => blocker.severity !== 'INFO')

  return [
    { id: 'reset-baseline', label: 'Reset baseline', owner: 'Admin', detail: 'Restore the verified baseline, confirm fleet hierarchy, and open the selected turnaround operation from a clean state.' },
    { id: 'prove-admin-crud', label: 'Prove admin CRUD', owner: 'Admin', detail: 'Create or update cruise line, ship, sailing, customer, booking, itinerary day, and activity data through the UI.' },
    { id: 'prove-passenger-path', label: 'Prove passenger path', owner: 'Passenger', detail: 'Use passenger search, booking filters, profile update, favorites, and visible booking details.' },
    { id: 'prove-command-path', label: 'Prove command path', owner: 'Turnaround Manager', detail: `Drive ${inputs.shipName} command plan, task creation, release gates, metrics, timeline, and incident review.` },
    { id: 'prove-lead-paths', label: 'Prove department lead paths', owner: 'Operational Leads', detail: 'Update task status, blockers, staffing, dependencies, handoffs, escalation log, shift notes, and readiness signoffs.' },
    { id: 'confirm-governance-path', label: 'Confirm governance path', owner: 'Operations Governance', detail: 'Finish with the executive brief, assurance evidence, stakeholder coordination, release plan, scenario plan, and production readiness cockpit.' },
    { id: 'handle-weakest-gate', label: 'Handle weakest gate', owner: weakestGate?.label || 'Turnaround Manager', detail: weakestGate ? `Call out ${weakestGate.label.toLowerCase()} at ${weakestGate.readinessScore}% and explain mitigation.` : 'Confirm no weak gate is hidden.' },
    { id: 'handle-first-blocker', label: 'Handle first blocker', owner: firstBlocker?.owner || 'Turnaround Manager', detail: firstBlocker?.detail || 'Confirm no critical blocker is omitted from the release decision.' }
  ]
}

function buildProductionTestingContract(inputs = {}) {
  return [
    { id: 'cypress-long-workflow', layer: 'Cypress', coverage: 'Full soup-to-nuts role workflow CRUD from admin setup through operational execution.', status: 'PRIMARY' },
    { id: 'playwright-responsive', layer: 'Playwright', coverage: 'Responsive layout, overflow, reachability, and selector stability only.', status: 'STABILITY_GUARD' },
    { id: 'playwright-mobile', layer: 'Playwright', coverage: 'Mobile reachability and viewport safety for existing role workflows.', status: 'RESPONSIVE_GUARD' },
    { id: 'jest-integration', layer: 'Jest integration', coverage: `${inputs.cruiseLineName} API and database-backed turnaround operations remain scoped and auditable.`, status: 'CONTRACT_GUARD' }
  ]
}

function buildTurnaroundProductionReadiness(input = {}) {
  const inputs = buildReadinessInputs(input)
  const gates = buildProductionGates(inputs)
  const blockers = buildProductionBlockers(inputs)
  const productionScore = clampScore(Math.round(gates.reduce((total, gate) => total + gate.readinessScore, 0) / Math.max(gates.length, 1)))
  const productionStatus = productionScore >= 90 && blockers.every(blocker => blocker.severity !== 'HIGH')
    ? 'OPERATIONALLY_READY'
    : productionScore >= 78
      ? 'READY_WITH_WATCH_ITEMS'
      : 'ACTION_REQUIRED'

  return {
    productionScore,
    productionStatus,
    headline: `${inputs.shipName} turnaround production readiness is ${productionScore}%`,
    summary: `${inputs.cruiseLineName} production readiness consolidates release, scenario, management, governance, workflow, signoff, incident, and testing evidence for ${inputs.turnaroundDate}.`,
    nextAction: productionStatus === 'OPERATIONALLY_READY'
      ? 'Use the runbook to complete the operational governance review while preserving focused browser-test ownership.'
      : 'Resolve high-severity blockers first, then rerun Cypress lifecycle and responsive Playwright guards.',
    evidence: inputs,
    gates,
    blockers,
    runbook: buildProductionRunbook(inputs, gates, blockers),
    testingContract: buildProductionTestingContract(inputs)
  }
}

module.exports = {
  buildTurnaroundProductionReadiness,
  buildReadinessInputs,
  buildProductionGates,
  buildProductionBlockers,
  buildProductionRunbook,
  buildProductionTestingContract
}
