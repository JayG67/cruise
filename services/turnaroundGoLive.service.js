function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function normalizeStatus(value = '') {
  return String(value || '').replace(/_/g, ' ').trim().toUpperCase()
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function scoreFrom(value, fallback = 0) {
  return clampScore(value === undefined || value === null ? fallback : value)
}

function buildGoLiveReadinessInputs(input = {}) {
  const tasks = asArray(input.tasks)
  const signoffs = asArray(input.signoffs)
  const escalations = asArray(input.escalations)
  const dependencies = asArray(input.dependencies)
  const handoffs = asArray(input.handoffs)
  const staffing = asArray(input.staffing)

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => normalizeStatus(task.status) === 'COMPLETE').length
  const blockedTasks = tasks.filter(task => ['BLOCKED', 'AT RISK', 'AT_RISK'].includes(normalizeStatus(task.status))).length
  const approvedSignoffs = signoffs.filter(signoff => normalizeStatus(signoff.status) === 'APPROVED').length
  const openEscalations = escalations.filter(escalation => normalizeStatus(escalation.status) !== 'RESOLVED').length
  const activeDependencies = dependencies.filter(dependency => normalizeStatus(dependency.status) !== 'CLEARED').length
  const openHandoffs = handoffs.filter(handoff => normalizeStatus(handoff.status) !== 'COMPLETE').length
  const staffingGaps = staffing.filter(row => Number(row.checkedInCount || 0) < Number(row.plannedCount || 0)).length

  return {
    operationId: input.operation?.id || null,
    operationTitle: input.operation?.title || 'Turnaround operation',
    cruiseLineName: input.operation?.cruiseLineName || input.operation?.cruiseLine?.name || 'Cruise line pending',
    shipName: input.operation?.shipName || input.operation?.ship?.name || 'Ship pending',
    turnaroundDate: input.operation?.turnaroundDate || input.operation?.sailingDate || 'Date pending',
    totalTasks,
    completedTasks,
    taskCompletion: totalTasks ? clampScore((completedTasks / totalTasks) * 100) : 0,
    blockedTasks,
    signoffCompletion: signoffs.length ? clampScore((approvedSignoffs / signoffs.length) * 100) : 0,
    openEscalations,
    activeDependencies,
    openHandoffs,
    staffingGaps,
    commandScore: scoreFrom(input.commandCenter?.summary?.commandScore ?? input.commandCenter?.commandScore, 72),
    continuityScore: scoreFrom(input.continuityCenter?.continuityScore ?? input.continuityCenter?.summary?.continuityScore, 72),
    shiftScore: scoreFrom(input.shiftBriefing?.summary?.briefingScore, 72),
    closeoutScore: scoreFrom(input.closeoutPacket?.closeoutScore ?? input.closeoutPacket?.summary?.closeoutScore, 72),
    productionScore: scoreFrom(input.productionReadiness?.readinessScore ?? input.productionReadiness?.summary?.readinessScore, 72),
    launchScore: scoreFrom(input.launchPlan?.launchScore ?? input.launchPlan?.summary?.launchScore, 72),
    dossierScore: scoreFrom(input.applicationDossier?.dossierScore ?? input.applicationDossier?.summary?.dossierScore, 72),
    releaseScore: scoreFrom(input.releasePacket?.summary?.releaseScore ?? input.operationalMetrics?.summary?.releaseConfidence, 72),
    lifecycleScore: scoreFrom(input.lifecycleState?.completionPercent ?? input.lifecycleState?.summary?.completionPercent, 72)
  }
}

function buildGoLiveGates(inputs = {}) {
  const gates = [
    {
      id: 'workflow-complete',
      label: 'Workflow completeness',
      owner: 'Turnaround Manager',
      score: Math.round((inputs.taskCompletion + inputs.signoffCompletion + inputs.lifecycleScore) / 3),
      detail: `${inputs.completedTasks}/${inputs.totalTasks} tasks complete with ${inputs.signoffCompletion}% signoff completion.`
    },
    {
      id: 'risk-controlled',
      label: 'Risk controlled',
      owner: 'Incident Commander',
      score: clampScore(100 - (inputs.blockedTasks * 12) - (inputs.openEscalations * 15) - (inputs.activeDependencies * 8)),
      detail: `${inputs.blockedTasks} blocked tasks, ${inputs.openEscalations} open escalations, and ${inputs.activeDependencies} active dependencies remain.`
    },
    {
      id: 'shift-handoff',
      label: 'Shift handoff ready',
      owner: 'Operations Lead',
      score: inputs.shiftScore,
      detail: `Shift briefing score is ${inputs.shiftScore}% with next-shift handoff evidence available.`
    },
    {
      id: 'continuity-ready',
      label: 'Continuity ready',
      owner: 'Continuity Lead',
      score: inputs.continuityScore,
      detail: `Continuity score is ${inputs.continuityScore}% for exception recovery and passenger-impact control.`
    },
    {
      id: 'production-ready',
      label: 'Production surface ready',
      owner: 'Engineering Lead',
      score: Math.round((inputs.productionScore + inputs.releaseScore + inputs.commandScore) / 3),
      detail: `${inputs.productionScore}% production readiness, ${inputs.releaseScore}% release signal, and ${inputs.commandScore}% command center score.`
    },
    {
      id: 'release-governance-ready',
      label: 'Release evidence ready',
      owner: 'Release Governance Lead',
      score: Math.round((inputs.dossierScore + inputs.launchScore + inputs.closeoutScore) / 3),
      detail: `${inputs.dossierScore}% operational release dossier, ${inputs.launchScore}% launch plan, and ${inputs.closeoutScore}% closeout packet.`
    }
  ]

  return gates.map(gate => {
    const score = clampScore(gate.score)
    return {
      ...gate,
      score,
      status: score >= 90 ? 'GO' : score >= 78 ? 'WATCH' : 'NO_GO'
    }
  })
}

function buildGoLiveActions(inputs = {}, gates = []) {
  const actions = []

  gates.filter(gate => gate.status !== 'GO').forEach(gate => {
    actions.push({
      id: `gate-${gate.id}`,
      owner: gate.owner,
      priority: gate.status === 'NO_GO' ? 'HIGH' : 'MEDIUM',
      action: `${gate.label}: ${gate.detail}`
    })
  })

  if (inputs.openHandoffs > 0) {
    actions.push({ id: 'open-handoffs', owner: 'Shift Leads', priority: 'MEDIUM', action: `${inputs.openHandoffs} handoff${inputs.openHandoffs === 1 ? '' : 's'} still need completion evidence before release authorization.` })
  }
  if (inputs.staffingGaps > 0) {
    actions.push({ id: 'staffing-gaps', owner: 'Staffing Coordinator', priority: 'MEDIUM', action: `${inputs.staffingGaps} staffing gap${inputs.staffingGaps === 1 ? '' : 's'} should be closed or documented as a workaround.` })
  }

  if (!actions.length) {
    actions.push({ id: 'launch-freeze', owner: 'Project Lead', priority: 'LOW', action: 'Approve the release baseline, record final smoke-test evidence, and proceed with production deployment.' })
  }

  return actions.slice(0, 8)
}

function buildGoLiveEvidence(inputs = {}, gates = []) {
  return [
    { id: 'workflow-evidence', label: 'Workflow evidence', status: gates.find(gate => gate.id === 'workflow-complete')?.status || 'WATCH', detail: `${inputs.taskCompletion}% task completion and ${inputs.signoffCompletion}% signoff completion.` },
    { id: 'risk-evidence', label: 'Risk evidence', status: gates.find(gate => gate.id === 'risk-controlled')?.status || 'WATCH', detail: `${inputs.openEscalations} open escalations and ${inputs.activeDependencies} active dependencies visible.` },
    { id: 'handoff-evidence', label: 'Handoff evidence', status: gates.find(gate => gate.id === 'shift-handoff')?.status || 'WATCH', detail: `Shift briefing score ${inputs.shiftScore}% with closeout score ${inputs.closeoutScore}%.` },
    { id: 'production-evidence', label: 'Production evidence', status: gates.find(gate => gate.id === 'production-ready')?.status || 'WATCH', detail: `Release ${inputs.releaseScore}%, production ${inputs.productionScore}%, command ${inputs.commandScore}%.` },
    { id: 'release-governance-evidence', label: 'Release governance evidence', status: gates.find(gate => gate.id === 'release-governance-ready')?.status || 'WATCH', detail: `Dossier ${inputs.dossierScore}%, launch ${inputs.launchScore}%, closeout ${inputs.closeoutScore}%.` }
  ]
}

function buildTurnaroundGoLiveCenter(input = {}) {
  const inputs = buildGoLiveReadinessInputs(input)
  const gates = buildGoLiveGates(inputs)
  const actions = buildGoLiveActions(inputs, gates)
  const evidence = buildGoLiveEvidence(inputs, gates)
  const goLiveScore = clampScore(Math.round(gates.reduce((total, gate) => total + gate.score, 0) / Math.max(gates.length, 1)))
  const noGoCount = gates.filter(gate => gate.status === 'NO_GO').length
  const watchCount = gates.filter(gate => gate.status === 'WATCH').length
  const goLiveStatus = noGoCount > 0 ? 'NO_GO' : watchCount > 0 ? 'GO_WITH_WATCH' : 'READY_TO_LAUNCH'

  return {
    operationId: inputs.operationId,
    generatedAt: new Date().toISOString(),
    summary: {
      goLiveScore,
      goLiveStatus,
      goGateCount: gates.filter(gate => gate.status === 'GO').length,
      watchCount,
      noGoCount,
      actionCount: actions.filter(action => action.priority !== 'LOW').length,
      launchRecommendation: goLiveStatus === 'READY_TO_LAUNCH'
        ? 'Deploy after the final smoke test and release-evidence review.'
        : goLiveStatus === 'GO_WITH_WATCH'
          ? 'Deploy after resolving watch items or documenting them in the launch notes.'
          : 'Do not deploy until no-go gates are cleared.'
    },
    headline: `${inputs.shipName} turnaround go-live is ${goLiveScore}% ready.`,
    context: `${inputs.cruiseLineName} · ${inputs.turnaroundDate} · ${inputs.operationTitle}`,
    gates,
    actions,
    evidence,
    remainingScope: [
      { id: 'service-assurance', label: 'Service assurance', status: inputs.productionScore >= 90 ? 'DONE' : 'REMAINING', detail: 'Deployment settings, error states, and environment readiness.' },
      { id: 'data-architecture-assurance', label: 'Data architecture assurance', status: inputs.lifecycleScore >= 90 ? 'READY_TO_START' : 'REMAINING', detail: 'Confirm normalized, durable data contracts and controlled operational data flows.' },
      { id: 'release-evidence', label: 'Release evidence package', status: inputs.dossierScore >= 90 ? 'DONE' : 'REMAINING', detail: 'Release notes, operating guidance, ownership records, and final live-service smoke evidence.' }
    ]
  }
}

module.exports = {
  buildTurnaroundGoLiveCenter,
  buildGoLiveReadinessInputs,
  buildGoLiveGates,
  buildGoLiveActions,
  buildGoLiveEvidence
}
