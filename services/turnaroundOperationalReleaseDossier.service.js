function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeStatus(value, fallback = 'REVIEW') {
  return String(value || fallback).replace(/_/g, ' ').trim()
}

function averageScores(scores = []) {
  const safeScores = asArray(scores).map(clampScore)
  if (!safeScores.length) return 0
  return clampScore(safeScores.reduce((total, score) => total + score, 0) / safeScores.length)
}

function countItems(rows, predicate) {
  return asArray(rows).filter(predicate).length
}

function buildReleaseDossierInputs({
  operation = {},
  tasks = [],
  staffing = [],
  signoffs = [],
  escalations = [],
  dependencies = [],
  handoffs = [],
  auditEvents = [],
  releasePacket = null,
  operationalMetrics = null,
  playbookVariance = null,
  incidentCommand = null,
  afterActionReview = null,
  executiveBrief = null,
  operationalAssurancePacket = null,
  operationalBriefingBoard = null,
  managementStatus = null,
  launchPlan = null,
  scenarioPlan = null,
  productionReadiness = null
} = {}) {
  const safeOperation = operation && typeof operation === 'object' ? operation : {}
  const completedTasks = countItems(tasks, task => String(task.status || '').toUpperCase() === 'COMPLETED')
  const totalTasks = asArray(tasks).length
  const approvedSignoffs = countItems(signoffs, signoff => String(signoff.status || '').toUpperCase() === 'APPROVED')
  const openEscalations = countItems(escalations, escalation => !['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase()))
  const openDependencies = countItems(dependencies, dependency => !['CLEARED', 'COMPLETE', 'COMPLETED'].includes(String(dependency.status || '').toUpperCase()))
  const incompleteHandoffs = countItems(handoffs, handoff => !['COMPLETE', 'COMPLETED'].includes(String(handoff.status || '').toUpperCase()))
  const staffingGaps = countItems(staffing, row => Number(row.requiredCount || row.required || 0) > Number(row.assignedCount || row.assigned || 0))

  return {
    operationId: safeOperation.id,
    shipName: safeOperation.shipName || safeOperation.ship?.name || 'Selected ship',
    cruiseLineName: safeOperation.cruiseLineName || safeOperation.cruiseLine?.name || 'Selected cruise line',
    turnaroundDate: safeOperation.turnaroundDate || safeOperation.date || 'Selected turnaround',
    productionScore: clampScore(productionReadiness?.productionScore || 0),
    releaseScore: clampScore(releasePacket?.releaseScore ?? operationalMetrics?.summary?.releaseConfidence ?? 0),
    executiveScore: clampScore(executiveBrief?.summary?.decisionScore || 0),
    assuranceScore: clampScore(operationalAssurancePacket?.readiness?.readinessScore || 0),
    briefingScore: clampScore(operationalBriefingBoard?.readiness?.readinessScore || 0),
    launchScore: clampScore(launchPlan?.launchScore || 0),
    scenarioScore: clampScore(scenarioPlan?.resilienceScore || 0),
    managementScore: clampScore(managementStatus?.maturityScore || 0),
    afterActionScore: clampScore(afterActionReview?.summary?.reviewScore || 0),
    incidentScore: clampScore(incidentCommand?.incidentScore || 0),
    varianceScore: clampScore(100 - Number(playbookVariance?.varianceScore || 0)),
    taskCompletion: totalTasks ? clampScore((completedTasks / totalTasks) * 100) : 0,
    signoffCompletion: asArray(signoffs).length ? clampScore((approvedSignoffs / asArray(signoffs).length) * 100) : 0,
    totalTasks,
    completedTasks,
    approvedSignoffs,
    openEscalations,
    openDependencies,
    incompleteHandoffs,
    staffingGaps,
    auditEventCount: asArray(auditEvents).length,
    productionStatus: normalizeStatus(productionReadiness?.productionStatus, 'NEEDS HARDENING'),
    launchStatus: normalizeStatus(launchPlan?.launchStatus, 'REVIEW'),
    scenarioStatus: normalizeStatus(scenarioPlan?.scenarioStatus, 'REVIEW'),
    managementStatus: normalizeStatus(managementStatus?.maturityStatus, 'HARDENING IN PROGRESS'),
    releaseStatus: normalizeStatus(releasePacket?.releaseStatus, 'REVIEW')
  }
}

function buildEvidenceSections(inputs = {}) {
  return [
    {
      id: 'production-readiness-proof',
      label: 'Production readiness proof',
      score: inputs.productionScore,
      status: inputs.productionStatus,
      detail: `${inputs.shipName} has consolidated production readiness controls with release, workflow, signoff, scenario, and testing evidence.`
    },
    {
      id: 'workflow-proof',
      label: 'Workflow proof',
      score: averageScores([inputs.taskCompletion, inputs.signoffCompletion, inputs.releaseScore]),
      status: `${inputs.completedTasks}/${inputs.totalTasks} tasks complete`,
      detail: `Turnaround tasks, department signoffs, release gates, dependencies, handoffs, and staffing coverage are tied to visible operational workflows.`
    },
    {
      id: 'leadership-assurance-proof',
      label: 'Leadership assurance proof',
      score: averageScores([inputs.executiveScore, inputs.assuranceScore, inputs.briefingScore]),
      status: 'Leadership assurance ready',
      detail: `Executive brief, operational assurance packet, and leadership briefing board are assembled for ${inputs.cruiseLineName} command review.`
    },
    {
      id: 'resilience-proof',
      label: 'Resilience proof',
      score: averageScores([inputs.launchScore, inputs.scenarioScore, inputs.managementScore, inputs.varianceScore]),
      status: `${inputs.launchStatus} / ${inputs.scenarioStatus}`,
      detail: 'Launch plan, scenario plan, management status, and playbook variance create the operational assurance trail.'
    },
    {
      id: 'audit-proof',
      label: 'Audit proof',
      score: clampScore(Math.min(100, inputs.auditEventCount * 8) + (inputs.openEscalations ? -15 : 10)),
      status: `${inputs.auditEventCount} audit events`,
      detail: 'Database-backed events and visible UI verification show that release claims are traceable, not just static copy.'
    }
  ].map(section => ({
    ...section,
    score: clampScore(section.score),
    readiness: clampScore(section.score) >= 90 ? 'READY' : clampScore(section.score) >= 78 ? 'WATCH' : 'HARDEN'
  }))
}

function buildOperationalNarrative(inputs = {}, sections = []) {
  const weakest = [...sections].sort((a, b) => a.score - b.score)[0]
  const strongest = [...sections].sort((a, b) => b.score - a.score)[0]

  return {
    headline: `${inputs.cruiseLineName} operational release dossier is ${averageScores(sections.map(section => section.score))}% ready`,
    opener: `${inputs.shipName} on ${inputs.turnaroundDate} is the current proof case for a multi-cruise-line turnaround management release review.` ,
    strongestProof: strongest ? `${strongest.label} is strongest at ${strongest.score}%: ${strongest.detail}` : 'No strongest proof has been calculated yet.',
    weakestProof: weakest ? `${weakest.label} needs the most attention at ${weakest.score}%: ${weakest.detail}` : 'No weak proof has been calculated yet.',
    close: 'The release review should cover admin setup, passenger booking flow, operational role execution, assurance evidence, and production readiness without expanding brittle browser-test depth.'
  }
}

function buildReleaseChecklist(inputs = {}) {
  const checklistLabel = 'Release checklist'
  void checklistLabel
  const checklist = [
    ['admin-crud-proof', 'Admin CRUD proof', inputs.totalTasks >= 1, 'Show cruise line, ship, sailing, customer, booking, itinerary, and activity setup through the UI.'],
    ['turnaround-role-proof', 'Turnaround role proof', inputs.completedTasks > 0, 'Show manager and department lead workflows using database-backed task changes.'],
    ['signoff-proof', 'Signoff proof', inputs.approvedSignoffs > 0, 'Show department readiness signoffs and explain remaining signoff gaps.'],
    ['escalation-proof', 'Escalation proof', inputs.openEscalations === 0, 'Resolve open escalations or present them as explicit risk-watch items.'],
    ['dependency-proof', 'Dependency proof', inputs.openDependencies === 0, 'Clear release dependencies or show ownership and due timing.'],
    ['handoff-proof', 'Handoff proof', inputs.incompleteHandoffs === 0, 'Complete handoffs or show why they are controlled.'],
    ['staffing-proof', 'Staffing proof', inputs.staffingGaps === 0, 'Close staffing gaps or show the mitigation plan.'],
    ['testing-proof', 'Testing proof', inputs.productionScore >= 78, 'Use Cypress for full lifecycle evidence and Playwright for responsive stability evidence.']
  ]

  return checklist.map(([id, label, complete, detail]) => ({
    id,
    label,
    complete: Boolean(complete),
    status: complete ? 'READY' : 'WATCH',
    detail
  }))
}

function buildNextReleaseSteps(inputs = {}, sections = [], checklist = []) {
  const watchItems = checklist.filter(item => !item.complete)
  const weakestSections = [...sections].sort((a, b) => a.score - b.score).slice(0, 2)

  return [
    { id: 'freeze-playwright-scope', owner: 'Engineering', priority: 'HIGH', detail: 'Keep Playwright limited to responsive reachability, overflow, and selector stability so app work can move forward.' },
    { id: 'expand-cypress-lifecycle', owner: 'Engineering', priority: 'HIGH', detail: 'Continue expanding Cypress soup-to-nuts lifecycle coverage around admin-created data and full operational CRUD.' },
    { id: 'polish-release-story', owner: 'Operations Product', priority: 'MEDIUM', detail: `Lead with ${inputs.shipName} as the proof case and connect each panel to an operational release decision.` },
    { id: 'close-release-watch-items', owner: 'Turnaround Manager', priority: watchItems.length ? 'HIGH' : 'LOW', detail: watchItems.length ? `Close ${watchItems.length} release checklist watch items before operational approval.` : 'No release checklist watch items are currently blocking approval.' },
    { id: 'strengthen-weakest-evidence', owner: weakestSections[0]?.label || 'Product', priority: 'MEDIUM', detail: weakestSections.length ? `Improve ${weakestSections.map(section => `${section.label} (${section.score}%)`).join(' and ')} before the next operational review.` : 'No weak evidence section is currently available.' }
  ]
}

function buildTurnaroundOperationalReleaseDossier(input = {}) {
  const inputs = buildReleaseDossierInputs(input)
  const evidenceSections = buildEvidenceSections(inputs)
  const checklist = buildReleaseChecklist(inputs)
  const dossierScore = averageScores(evidenceSections.map(section => section.score))
  const hasIncompleteChecklist = checklist.some(item => !item.complete)
  const dossierStatus = dossierScore >= 90 && !hasIncompleteChecklist
    ? 'RELEASE_READY'
    : dossierScore >= 78 && !hasIncompleteChecklist
      ? 'READY_WITH_WATCH_ITEMS'
      : 'NEEDS_RELEASE_HARDENING'

  return {
    dossierScore,
    dossierStatus,
    summary: `${inputs.cruiseLineName} operational release dossier consolidates turnaround evidence, leadership assurance, production readiness, and testing ownership for ${inputs.shipName}.`,
    nextAction: dossierStatus === 'RELEASE_READY'
      ? 'Use this dossier as the command-facing route into operational release approval.'
      : 'Close release watch items and keep extending Cypress lifecycle evidence before operational approval.',
    evidence: inputs,
    evidenceSections,
    operationalNarrative: buildOperationalNarrative(inputs, evidenceSections),
    checklist,
    nextReleaseSteps: buildNextReleaseSteps(inputs, evidenceSections, checklist)
  }
}

module.exports = {
  buildTurnaroundOperationalReleaseDossier,
  buildReleaseDossierInputs,
  buildEvidenceSections,
  buildOperationalNarrative,
  buildReleaseChecklist,
  buildNextReleaseSteps
}
