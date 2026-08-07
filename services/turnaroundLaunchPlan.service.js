function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeStatus(value, fallback = 'REVIEW') {
  return String(value || fallback).replace(/_/g, ' ').trim()
}

function buildLaunchGate({ id, label, score = 0, detail = '', status = null, evidence = [] }) {
  const normalizedScore = clampScore(score)
  let gateStatus = status
  if (!gateStatus) gateStatus = normalizedScore >= 90 ? 'GREEN' : normalizedScore >= 78 ? 'YELLOW' : 'RED'

  return {
    id,
    label,
    score: normalizedScore,
    status: gateStatus,
    detail,
    evidence: asArray(evidence).filter(Boolean).slice(0, 5)
  }
}

function buildCertificationGates({
  operation = {},
  releasePacket = null,
  operationalMetrics = null,
  incidentCommand = null,
  afterActionReview = null,
  executiveBrief = null,
  reviewerPacket = null,
  outreachBoard = null,
  managementStatus = null
} = {}) {
  const releaseScore = clampScore(releasePacket?.releaseScore || operationalMetrics?.summary?.releaseConfidence || executiveBrief?.summary?.releaseConfidence || 0)
  const incidentSafety = clampScore(100 - Number(incidentCommand?.incidentScore || executiveBrief?.summary?.incidentScore || 0))
  const reviewScore = clampScore(afterActionReview?.summary?.reviewScore || executiveBrief?.summary?.reviewScore || 0)
  const reviewerScore = clampScore(reviewerPacket?.readiness?.readinessScore || 0)
  const outreachScore = clampScore(outreachBoard?.readiness?.readinessScore || 0)
  const maturityScore = clampScore(managementStatus?.maturityScore || 0)

  return [
    buildLaunchGate({
      id: 'operational-release-confidence',
      label: 'Operational release confidence',
      score: releaseScore,
      detail: `Release confidence is ${releaseScore}% for ${operation.shipName || 'the selected ship'} on ${operation.turnaroundDate || 'the selected turnaround'}.`,
      evidence: ['Release packet', 'Readiness metrics', 'Department blocker rollup']
    }),
    buildLaunchGate({
      id: 'incident-risk-contained',
      label: 'Incident risk contained',
      score: incidentSafety,
      detail: `Incident command severity is ${normalizeStatus(incidentCommand?.incidentSeverity, 'stable')} with a risk score of ${Number(incidentCommand?.incidentScore || 0)}.`,
      evidence: ['Incident command bridge', 'Escalation severity', 'Open dependency review']
    }),
    buildLaunchGate({
      id: 'after-action-loop-ready',
      label: 'After-action loop ready',
      score: reviewScore,
      detail: 'After-action review turns operational execution into department lessons and follow-up actions.',
      evidence: ['Findings', 'Department lessons', 'Follow-up action plan']
    }),
    buildLaunchGate({
      id: 'governance-evidence-ready',
      label: 'Governance evidence ready',
      score: reviewerScore,
      detail: 'Governance evidence converts operational state into decision records, data-quality checks, and accountable next steps.',
      evidence: ['Governance evidence', 'Decision records', 'Data-quality snapshot']
    }),
    buildLaunchGate({
      id: 'stakeholder-coordination-ready',
      label: 'Stakeholder coordination ready',
      score: outreachScore,
      detail: 'Stakeholder coordination records organize recommendations, accountable owners, and required operational follow-through.',
      evidence: ['Coordination checklist', 'Stakeholder records', 'Action recommendations']
    }),
    buildLaunchGate({
      id: 'management-continuation-ready',
      label: 'Management continuation ready',
      score: maturityScore,
      detail: managementStatus?.continuationSummary?.headline || 'Management status map is available for continuation planning.',
      evidence: ['Capability map', 'Remaining work', 'Recommended next slices']
    })
  ]
}

function buildDemoRunbook({ operation = {}, gates = [], managementStatus = null } = {}) {
  const ship = operation.shipName || 'selected ship'
  const cruiseLine = operation.cruiseLineName || 'selected cruise line'
  const weakGate = gates.find(gate => gate.score < 78)

  const steps = [
    {
      id: 'admin-data-verification',
      label: 'Administrative data verification',
      role: 'Administrator',
      detail: `Verify fleet, ship, sailing, customer, booking, and quality workflows for ${cruiseLine} using the current operational data baseline.`
    },
    {
      id: 'passenger-booking-verification',
      label: 'Passenger booking verification',
      role: 'Passenger',
      detail: 'Verify the cascading cruise-line, ship, sailing, destination, departure, length, and ship-aware fare filters against the current operating data.'
    },
    {
      id: 'group-leader-verification',
      label: 'Group leader verification',
      role: 'Group Leader',
      detail: 'Verify group-visible bookings and passenger manifests without administrator-only operations.'
    },
    {
      id: 'turnaround-command-verification',
      label: 'Turnaround command verification',
      role: 'Turnaround Manager',
      detail: `Select ${ship}, review the command plan, release board, metrics, timeline, incident command, after-action review, and release gates.`
    },
    {
      id: 'department-lead-verification',
      label: 'Department lead verification',
      role: 'Department Lead',
      detail: 'Verify housekeeping, guest services, engineering, and food and beverage role-specific task, staffing, dependency, handoff, and signoff workflows.'
    },
    {
      id: 'governance-closeout',
      label: 'Governance closeout',
      role: 'Operational Governance',
      detail: 'Finish with the executive brief, governance evidence, stakeholder coordination records, and management status to support an accountable release decision.'
    }
  ]

  if (weakGate) {
    steps.push({
      id: 'watch-item-response',
      label: 'Watch-item response',
      role: 'Turnaround Manager',
      detail: `Call out the ${weakGate.label.toLowerCase()} gate as an explicit watch item instead of hiding it.`
    })
  }

  if (managementStatus?.nextSlices?.length) {
    steps.push({
      id: 'continuation-planning',
      label: 'Continuation planning',
      role: 'Engineering Lead',
      detail: `Use the next-slice recommendation: ${managementStatus.nextSlices[0]}`
    })
  }

  return steps.slice(0, 8)
}

function buildLaunchRisks({ gates = [], reviewerPacket = null, outreachBoard = null, incidentCommand = null } = {}) {
  const risks = gates
    .filter(gate => gate.score < 82)
    .map(gate => ({
      id: `risk-${gate.id}`,
      severity: gate.score < 65 ? 'HIGH' : 'MEDIUM',
      label: `${gate.label} requires release review`,
      mitigation: gate.score < 65
        ? `Hold release authorization until the ${gate.label.toLowerCase()} evidence improves.`
        : 'Track the watch item with visible evidence, an accountable owner, and a dated next action.'
    }))

  const dataRisk = Number(outreachBoard?.readiness?.dataQualityRisk || reviewerPacket?.dataQuality?.blockerCount || 0)
  if (dataRisk > 0) {
    risks.unshift({
      id: 'risk-data-quality-watch-items',
      severity: dataRisk >= 5 ? 'HIGH' : 'MEDIUM',
      label: 'Data-quality watch items remain',
      mitigation: 'Use the governance data-quality snapshot to assign owners and clear the watch items before release authorization.'
    })
  }

  const incidentScore = Number(incidentCommand?.incidentScore || 0)
  if (incidentScore >= 45) {
    risks.unshift({
      id: 'risk-incident-score',
      severity: incidentScore >= 70 ? 'HIGH' : 'MEDIUM',
      label: 'Incident risk may block release confidence',
      mitigation: 'Resolve visible blockers or document an accountable risk decision before release authorization.'
    })
  }

  if (risks.length === 0) {
    risks.push({
      id: 'risk-release-scope-drift',
      severity: 'LOW',
      label: 'Release review may lose focus because the operational surface is broad',
      mitigation: 'Use the release runbook to keep governance review focused on role progression, operational evidence, and accountable decisions.'
    })
  }

  return risks.slice(0, 6)
}

function buildQualityGates({ gates = [], managementStatus = null } = {}) {
  const greenCount = gates.filter(gate => gate.status === 'GREEN').length
  const yellowCount = gates.filter(gate => gate.status === 'YELLOW').length
  const redCount = gates.filter(gate => gate.status === 'RED').length

  return [
    {
      id: 'automated-suite',
      label: 'Automated suite remains authoritative',
      status: redCount > 0 ? 'WATCH' : 'READY',
      detail: 'Continue using test:all as the release gate, including inventory audit, React production audit, Jest coverage, Cypress, Playwright, performance smoke, and Lighthouse.'
    },
    {
      id: 'mobile-scope',
      label: 'Mobile scope protected',
      status: 'READY',
      detail: 'Mobile checks should prove responsiveness and reachable workflows without reintroducing brittle selector-only paths.'
    },
    {
      id: 'data-assurance',
      label: 'Data assurance tracked',
      status: (managementStatus?.remainingWork || []).some(item => String(item.priority).toUpperCase() === 'HIGH') ? 'WATCH' : 'READY',
      detail: 'Remaining data-architecture work is explicit in management status and should be resolved or accepted before production integrations.'
    },
    {
      id: 'release-gates',
      label: 'Release gates summarized',
      status: redCount > 0 ? 'BLOCKED' : 'READY',
      detail: `${greenCount} green, ${yellowCount} yellow, and ${redCount} red release gates are visible for governance review.`
    }
  ]
}

function buildTurnaroundLaunchPlan(input = {}) {
  const gates = buildCertificationGates(input)
  const launchScore = clampScore(gates.reduce((sum, gate) => sum + gate.score, 0) / Math.max(gates.length, 1))
  let launchStatus = 'READY_WITH_WATCH_ITEMS'
  if (launchScore < 65) launchStatus = 'NOT_READY'
  else if (launchScore < 78) launchStatus = 'ACTION_REQUIRED'
  else if (launchScore >= 90) launchStatus = 'OPERATIONALLY_READY'

  const demoRunbook = buildDemoRunbook({ operation: input.operation, gates, managementStatus: input.managementStatus })
  const launchRisks = buildLaunchRisks({ gates, reviewerPacket: input.reviewerPacket, outreachBoard: input.outreachBoard, incidentCommand: input.incidentCommand })
  const qualityGates = buildQualityGates({ gates, managementStatus: input.managementStatus })

  return {
    launchScore,
    launchStatus,
    headline: `Turnaround release plan is ${launchScore}% ready with status ${normalizeStatus(launchStatus)}.`,
    summary: 'This release plan combines certification gates, role-by-role verification steps, risk mitigations, and quality controls into an accountable operational release decision.',
    certificationGates: gates,
    demoRunbook,
    launchRisks,
    qualityGates,
    nextAction: launchRisks.some(risk => risk.severity === 'HIGH')
      ? 'Resolve high-severity release risks before authorizing this operation.'
      : 'Use the runbook to complete the next operational governance review.'
  }
}

module.exports = {
  buildTurnaroundLaunchPlan,
  buildCertificationGates,
  buildDemoRunbook,
  buildLaunchRisks,
  buildQualityGates
}
