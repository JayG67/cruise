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
  const safeScores = asArray(scores).map(clampScore).filter(score => score > 0)
  if (!safeScores.length) return 0
  return clampScore(safeScores.reduce((total, score) => total + score, 0) / safeScores.length)
}

function countItems(rows, predicate) {
  return asArray(rows).filter(predicate).length
}

function buildDossierInputs({
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
  reviewerPacket = null,
  outreachBoard = null,
  managementStatus = null,
  launchPlan = null,
  scenarioPlan = null,
  productionReadiness = null
} = {}) {
  const completedTasks = countItems(tasks, task => String(task.status || '').toUpperCase() === 'COMPLETED')
  const totalTasks = asArray(tasks).length
  const approvedSignoffs = countItems(signoffs, signoff => String(signoff.status || '').toUpperCase() === 'APPROVED')
  const openEscalations = countItems(escalations, escalation => !['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase()))
  const openDependencies = countItems(dependencies, dependency => !['CLEARED', 'COMPLETE', 'COMPLETED'].includes(String(dependency.status || '').toUpperCase()))
  const incompleteHandoffs = countItems(handoffs, handoff => !['COMPLETE', 'COMPLETED'].includes(String(handoff.status || '').toUpperCase()))
  const staffingGaps = countItems(staffing, row => Number(row.requiredCount || row.required || 0) > Number(row.assignedCount || row.assigned || 0))

  return {
    operationId: operation.id,
    shipName: operation.shipName || operation.ship?.name || 'Selected ship',
    cruiseLineName: operation.cruiseLineName || operation.cruiseLine?.name || 'Selected cruise line',
    turnaroundDate: operation.turnaroundDate || operation.date || 'Selected turnaround',
    productionScore: clampScore(productionReadiness?.productionScore || 0),
    releaseScore: clampScore(releasePacket?.releaseScore || operationalMetrics?.summary?.releaseConfidence || 0),
    executiveScore: clampScore(executiveBrief?.summary?.decisionScore || 0),
    reviewerScore: clampScore(reviewerPacket?.readiness?.readinessScore || 0),
    outreachScore: clampScore(outreachBoard?.readiness?.readinessScore || 0),
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
      id: 'production-demo-proof',
      label: 'Production demo proof',
      score: inputs.productionScore,
      status: inputs.productionStatus,
      detail: `${inputs.shipName} has a consolidated production readiness cockpit with release, workflow, signoff, scenario, and testing evidence.`
    },
    {
      id: 'workflow-proof',
      label: 'Workflow proof',
      score: averageScores([inputs.taskCompletion, inputs.signoffCompletion, inputs.releaseScore]),
      status: `${inputs.completedTasks}/${inputs.totalTasks} tasks complete`,
      detail: `Turnaround tasks, department signoffs, release gates, dependencies, handoffs, and staffing coverage are tied to visible operational workflows.`
    },
    {
      id: 'reviewer-proof',
      label: 'Reviewer proof',
      score: averageScores([inputs.executiveScore, inputs.reviewerScore, inputs.outreachScore]),
      status: 'Cruise-line reviewer ready',
      detail: `Executive brief, reviewer packet, and outreach board are assembled for ${inputs.cruiseLineName} conversations.`
    },
    {
      id: 'resilience-proof',
      label: 'Resilience proof',
      score: averageScores([inputs.launchScore, inputs.scenarioScore, inputs.managementScore, inputs.varianceScore]),
      status: `${inputs.launchStatus} / ${inputs.scenarioStatus}`,
      detail: 'Launch plan, scenario plan, management status, and playbook variance create the operational hardening trail.'
    },
    {
      id: 'audit-proof',
      label: 'Audit proof',
      score: clampScore(Math.min(100, inputs.auditEventCount * 8) + (inputs.openEscalations ? -15 : 10)),
      status: `${inputs.auditEventCount} audit events`,
      detail: 'Database-backed events and visible UI verification show that reviewer claims are traceable, not just static copy.'
    }
  ].map(section => ({
    ...section,
    score: clampScore(section.score),
    readiness: clampScore(section.score) >= 90 ? 'READY' : clampScore(section.score) >= 78 ? 'WATCH' : 'HARDEN'
  }))
}

function buildReviewerNarrative(inputs = {}, sections = []) {
  const weakest = [...sections].sort((a, b) => a.score - b.score)[0]
  const strongest = [...sections].sort((a, b) => b.score - a.score)[0]

  return {
    headline: `${inputs.cruiseLineName} application dossier is ${averageScores(sections.map(section => section.score))}% ready`,
    opener: `${inputs.shipName} on ${inputs.turnaroundDate} is the current proof case for a multi-cruise-line turnaround management demo.` ,
    strongestProof: strongest ? `${strongest.label} is strongest at ${strongest.score}%: ${strongest.detail}` : 'No strongest proof has been calculated yet.',
    weakestProof: weakest ? `${weakest.label} needs the most attention at ${weakest.score}%: ${weakest.detail}` : 'No weak proof has been calculated yet.',
    close: 'The demo should show admin setup, passenger booking flow, operational role execution, reviewer evidence, and production readiness without adding brittle Playwright workflow depth.'
  }
}

function buildApplicationChecklist(inputs = {}) {
  const checklistLabel = 'Application checklist'
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

function buildNextApplicationSteps(inputs = {}, sections = [], checklist = []) {
  const watchItems = checklist.filter(item => !item.complete)
  const weakestSections = [...sections].sort((a, b) => a.score - b.score).slice(0, 2)

  return [
    { id: 'freeze-playwright-scope', owner: 'Engineering', priority: 'HIGH', detail: 'Keep Playwright limited to responsive reachability, overflow, and selector stability so app work can move forward.' },
    { id: 'expand-cypress-lifecycle', owner: 'Engineering', priority: 'HIGH', detail: 'Continue expanding Cypress soup-to-nuts lifecycle coverage around admin-created data and full operational CRUD.' },
    { id: 'polish-reviewer-story', owner: 'Product', priority: 'MEDIUM', detail: `Lead with ${inputs.shipName} as the proof case and connect each panel to a cruise-line reviewer question.` },
    { id: 'close-watch-items', owner: 'Turnaround Manager', priority: watchItems.length ? 'HIGH' : 'LOW', detail: watchItems.length ? `Close ${watchItems.length} application checklist watch items before broad outreach.` : 'No application checklist watch items are currently blocking the story.' },
    { id: 'strengthen-weakest-proof', owner: weakestSections[0]?.label || 'Product', priority: 'MEDIUM', detail: weakestSections.length ? `Improve ${weakestSections.map(section => `${section.label} (${section.score}%)`).join(' and ')} before the next reviewer demo.` : 'No weak evidence section is currently available.' }
  ]
}

function buildTurnaroundApplicationDossier(input = {}) {
  const inputs = buildDossierInputs(input)
  const evidenceSections = buildEvidenceSections(inputs)
  const checklist = buildApplicationChecklist(inputs)
  const dossierScore = averageScores(evidenceSections.map(section => section.score))
  const hasIncompleteChecklist = checklist.some(item => !item.complete)
  const dossierStatus = dossierScore >= 90 && !hasIncompleteChecklist
    ? 'APPLICATION_READY'
    : dossierScore >= 78 && !hasIncompleteChecklist
      ? 'READY_WITH_WATCH_ITEMS'
      : 'NEEDS_PROOF_HARDENING'

  return {
    dossierScore,
    dossierStatus,
    summary: `${inputs.cruiseLineName} application dossier packages the turnaround proof story, reviewer narrative, production readiness, and testing ownership for ${inputs.shipName}.`,
    nextAction: dossierStatus === 'APPLICATION_READY'
      ? 'Use this dossier as the reviewer-facing route into additional cruise-line applications.'
      : 'Close watch items and keep extending Cypress lifecycle proof before broad outreach.',
    evidence: inputs,
    evidenceSections,
    reviewerNarrative: buildReviewerNarrative(inputs, evidenceSections),
    checklist,
    nextApplicationSteps: buildNextApplicationSteps(inputs, evidenceSections, checklist)
  }
}

module.exports = {
  buildTurnaroundApplicationDossier,
  buildDossierInputs,
  buildEvidenceSections,
  buildReviewerNarrative,
  buildApplicationChecklist,
  buildNextApplicationSteps
}
