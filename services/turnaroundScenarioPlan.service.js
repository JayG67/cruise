function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeStatus(value, fallback = 'REVIEW') {
  return String(value || fallback).replace(/_/g, ' ').trim()
}

function getCount(value) {
  return Math.max(0, Number(value) || 0)
}

function buildStressCase({ id, label, severity = 'MEDIUM', score = 75, trigger = '', impact = '', response = '', owner = 'Turnaround Manager', evidence = [] }) {
  const normalizedScore = clampScore(score)
  return {
    id,
    label,
    severity,
    resilienceScore: normalizedScore,
    status: normalizedScore >= 86 ? 'READY' : normalizedScore >= 70 ? 'WATCH' : 'ACTION_REQUIRED',
    trigger,
    impact,
    response,
    owner,
    evidence: asArray(evidence).filter(Boolean).slice(0, 5)
  }
}

function buildStressCases({
  operation = {},
  releasePacket = null,
  operationalMetrics = null,
  incidentCommand = null,
  playbookVariance = null,
  afterActionReview = null,
  launchPlan = null
} = {}) {
  const releaseScore = clampScore(releasePacket?.releaseScore || operationalMetrics?.summary?.releaseConfidence || 0)
  const incidentScore = getCount(incidentCommand?.incidentScore)
  const staffingCoverage = clampScore(operationalMetrics?.summary?.staffingCoverage || 0)
  const taskCompletion = clampScore(operationalMetrics?.summary?.taskCompletion || 0)
  const varianceScore = clampScore(playbookVariance?.summary?.rehearsalScore || 0)
  const reviewScore = clampScore(afterActionReview?.summary?.reviewScore || 0)
  const launchScore = clampScore(launchPlan?.launchScore || 0)

  const blockerCount = getCount(releasePacket?.blockers?.length || operationalMetrics?.summary?.blockerCount)
  const ship = operation.shipName || 'selected ship'
  const port = operation.portName || operation.turnaroundPort || 'turnaround port'

  return [
    buildStressCase({
      id: 'late-cabin-release',
      label: 'Late cabin release',
      severity: blockerCount > 0 ? 'HIGH' : 'MEDIUM',
      score: Math.min(releaseScore, taskCompletion) - blockerCount * 4,
      trigger: `Cabin readiness for ${ship} falls behind boarding release timing.`,
      impact: 'Boarding pressure increases and guest services must absorb a queue spike.',
      response: 'Use readiness approvals, housekeeping blockers, and release packet watch items to hold or phase boarding.',
      owner: 'Housekeeping Lead',
      evidence: ['Release blockers', 'Task completion', 'Department signoffs']
    }),
    buildStressCase({
      id: 'staffing-shortfall',
      label: 'Department staffing shortfall',
      severity: staffingCoverage < 80 ? 'HIGH' : 'MEDIUM',
      score: staffingCoverage,
      trigger: `Coverage drops below plan for ${port}.`,
      impact: 'Critical handoffs and guest-facing workflows lose execution margin.',
      response: 'Escalate staffing gaps, rebalance owners, and move low-priority tasks behind release-critical work.',
      owner: 'Turnaround Manager',
      evidence: ['Staffing coverage', 'Role coverage', 'Handoff queue']
    }),
    buildStressCase({
      id: 'technical-blocker',
      label: 'Technical blocker before release',
      severity: incidentScore >= 45 ? 'HIGH' : 'MEDIUM',
      score: 100 - incidentScore,
      trigger: 'Engineering blocker or dependency creates release uncertainty.',
      impact: 'Operations center must decide whether to hold release, partially release, or escalate.',
      response: 'Use incident command severity, dependency queue, and engineering signoff status to drive the decision.',
      owner: 'Engineering Lead',
      evidence: ['Incident command', 'Dependencies', 'Engineering signoff']
    }),
    buildStressCase({
      id: 'playbook-drift',
      label: 'Playbook drift during live execution',
      severity: varianceScore < 75 ? 'HIGH' : 'LOW',
      score: varianceScore,
      trigger: 'Live execution diverges from reusable turnaround playbook baselines.',
      impact: 'Operational leaders may see inconsistency between template intent and actual readiness evidence.',
      response: 'Use variance actions and after-action lessons to explain how drift becomes a controlled improvement loop.',
      owner: 'Turnaround Manager',
      evidence: ['Playbook variance', 'After-action findings', 'Template baselines']
    }),
    buildStressCase({
      id: 'unplanned-evidence-request',
      label: 'Unplanned evidence request',
      severity: launchScore < 82 ? 'MEDIUM' : 'LOW',
      score: Math.min(launchScore || 75, reviewScore || 75),
      trigger: 'An operational leader requests evidence outside the planned resilience-drill sequence.',
      impact: 'The review can drift into disconnected evidence browsing instead of role-based operational decision support.',
      response: 'Use release gates, governance evidence, and the role-by-role runbook to restore a decision-focused review.',
      owner: 'Operational Governance Lead',
      evidence: ['Launch plan', 'Reviewer packet', 'Management status']
    })
  ]
}

function buildTriggerMatrix({ stressCases = [] } = {}) {
  return stressCases.map((stressCase, index) => ({
    id: `trigger-${stressCase.id}`,
    sequence: index + 1,
    trigger: stressCase.trigger,
    owner: stressCase.owner,
    severity: stressCase.severity,
    response: stressCase.response,
    status: stressCase.status
  }))
}

function buildContingencyActions({ stressCases = [], launchPlan = null, managementStatus = null } = {}) {
  const actions = stressCases
    .filter(stressCase => stressCase.status !== 'READY')
    .map(stressCase => ({
      id: `action-${stressCase.id}`,
      priority: stressCase.severity === 'HIGH' ? 'P1' : 'P2',
      label: `${stressCase.label} contingency`,
      detail: stressCase.response,
      owner: stressCase.owner
    }))

  if (launchPlan?.launchRisks?.length) {
    actions.push({
      id: 'action-launch-risk-briefing',
      priority: 'P2',
      label: 'Operational risk briefing',
      detail: launchPlan.launchRisks[0].mitigation,
      owner: 'Operational Governance Lead'
    })
  }

  if (managementStatus?.remainingWork?.length) {
    actions.push({
      id: 'action-management-follow-through',
      priority: 'P3',
      label: 'Management assurance follow-through',
      detail: managementStatus.remainingWork[0].detail || managementStatus.remainingWork[0].label,
      owner: 'Engineering Lead'
    })
  }

  if (actions.length === 0) {
    actions.push({
      id: 'action-keep-governance-evidence-current',
      priority: 'P3',
      label: 'Keep governance evidence current',
      detail: 'Refresh operational evidence, verify release-runbook order, and keep governance proof points current.',
      owner: 'Turnaround Manager'
    })
  }

  return actions.slice(0, 7)
}

function buildDrillRunbook({ operation = {}, stressCases = [], launchPlan = null } = {}) {
  const topStressCase = stressCases.find(stressCase => stressCase.status !== 'READY') || stressCases[0]
  const ship = operation.shipName || 'selected ship'

  const steps = [
    {
      id: 'drill-open-command-center',
      label: 'Open command center',
      detail: `Start from ${ship} turnaround command center and identify release status, blocker count, and incident severity.`
    },
    {
      id: 'drill-apply-scenario',
      label: 'Apply highest-risk scenario',
      detail: topStressCase ? `Run the ${topStressCase.label.toLowerCase()} drill and confirm the owner response path.` : 'Run the highest-risk stress case and confirm ownership.'
    },
    {
      id: 'drill-check-role-leads',
      label: 'Check role-specific leads',
      detail: 'Move through housekeeping, guest services, engineering, and food and beverage to show each lead sees only relevant operational work.'
    },
    {
      id: 'drill-close-loop',
      label: 'Close the loop',
      detail: 'Use after-action review, executive brief, governance evidence, and release gates to explain how the operation improves after disruption.'
    }
  ]

  if (launchPlan?.demoRunbook?.length) {
    steps.push({
      id: 'drill-return-to-release-runbook',
      label: 'Return to release runbook',
      detail: `Resume the operational release runbook at: ${launchPlan.demoRunbook[0].label}.`
    })
  }

  return steps.slice(0, 6)
}

function buildTurnaroundScenarioPlan(input = {}) {
  const stressCases = buildStressCases(input)
  const readyCount = stressCases.filter(stressCase => stressCase.status === 'READY').length
  const actionCount = stressCases.filter(stressCase => stressCase.status === 'ACTION_REQUIRED').length
  const resilienceScore = clampScore(stressCases.reduce((total, stressCase) => total + stressCase.resilienceScore, 0) / Math.max(1, stressCases.length))
  const scenarioStatus = actionCount > 0 ? 'NEEDS_CONTINGENCY_REVIEW' : readyCount >= stressCases.length - 1 ? 'DRILL_READY' : 'WATCH_ITEMS_PRESENT'

  return {
    resilienceScore,
    scenarioStatus,
    headline: scenarioStatus === 'DRILL_READY'
      ? 'Turnaround operation is ready for operational resilience drills.'
      : 'Turnaround operation has scenario watch items that should be rehearsed before the next resilience exercise.',
    summary: `Scenario plan converts ${input.operation?.shipName || 'the selected ship'} operational evidence into stress cases, triggers, contingency actions, and an operational resilience runbook.`,
    stressCases,
    triggerMatrix: buildTriggerMatrix({ stressCases }),
    contingencyActions: buildContingencyActions({ stressCases, launchPlan: input.launchPlan, managementStatus: input.managementStatus }),
    drillRunbook: buildDrillRunbook({ operation: input.operation, stressCases, launchPlan: input.launchPlan }),
    evidence: {
      releaseStatus: normalizeStatus(input.releasePacket?.status, 'release review'),
      incidentSeverity: normalizeStatus(input.incidentCommand?.incidentSeverity, 'stable'),
      launchStatus: normalizeStatus(input.launchPlan?.launchStatus, 'watch items'),
      managementStatus: normalizeStatus(input.managementStatus?.maturityStatus, 'assurance review in progress')
    }
  }
}

module.exports = {
  buildTurnaroundScenarioPlan,
  buildStressCases,
  buildTriggerMatrix,
  buildContingencyActions,
  buildDrillRunbook
}
