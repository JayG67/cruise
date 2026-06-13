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
      id: 'reviewer-evidence-ready',
      label: 'Reviewer evidence ready',
      score: reviewerScore,
      detail: 'Reviewer packet converts operational state into proof points, data-quality checks, and next steps.',
      evidence: ['Reviewer packet', 'Proof points', 'Data-quality snapshot']
    }),
    buildLaunchGate({
      id: 'outreach-package-ready',
      label: 'Outreach package ready',
      score: outreachScore,
      detail: 'Outreach board organizes target recommendations and application assets for cruise-line review.',
      evidence: ['Outreach checklist', 'Reviewer assets', 'Target recommendations']
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
      id: 'admin-data-proof',
      label: 'Admin data proof',
      role: 'Admin',
      detail: `Open fleet, ship, sailing, customer, booking, and quality workflows to show ${cruiseLine} data is not a static mock.`
    },
    {
      id: 'passenger-booking-proof',
      label: 'Passenger booking proof',
      role: 'Passenger',
      detail: 'Use the cascading cruise-line, ship, sailing, destination, departure, length, and ship-aware fare filters to prove passenger booking UX is data driven.'
    },
    {
      id: 'group-leader-proof',
      label: 'Group leader proof',
      role: 'Group Leader',
      detail: 'Show group-visible bookings and passenger manifest without admin-only operations.'
    },
    {
      id: 'turnaround-command-proof',
      label: 'Turnaround command proof',
      role: 'Turnaround Manager',
      detail: `Select ${ship}, review the command plan, release board, metrics, timeline, incident command, after-action review, and launch gates.`
    },
    {
      id: 'department-lead-proof',
      label: 'Department lead proof',
      role: 'Department Lead',
      detail: 'Assume housekeeping, guest services, engineering, and food and beverage leads to show role-specific task, staffing, dependency, handoff, and signoff workflows.'
    },
    {
      id: 'reviewer-close-proof',
      label: 'Reviewer close proof',
      role: 'Reviewer',
      detail: 'Finish with executive brief, reviewer packet, outreach board, and management status to show how the app is ready for cruise-line conversations.'
    }
  ]

  if (weakGate) {
    steps.push({
      id: 'watch-item-proof',
      label: 'Watch-item handling proof',
      role: 'Turnaround Manager',
      detail: `Call out the ${weakGate.label.toLowerCase()} gate as an explicit watch item instead of hiding it.`
    })
  }

  if (managementStatus?.nextSlices?.length) {
    steps.push({
      id: 'continuation-proof',
      label: 'Continuation proof',
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
      label: `${gate.label} needs reviewer context`,
      mitigation: gate.score < 65
        ? `Do not lead with this gate until the ${gate.label.toLowerCase()} evidence improves.`
        : `Frame this as an active hardening area with visible evidence and next actions.`
    }))

  const dataRisk = Number(outreachBoard?.readiness?.dataQualityRisk || reviewerPacket?.dataQuality?.blockerCount || 0)
  if (dataRisk > 0) {
    risks.unshift({
      id: 'risk-data-quality-watch-items',
      severity: dataRisk >= 5 ? 'HIGH' : 'MEDIUM',
      label: 'Reviewer data-quality watch items remain',
      mitigation: 'Use reviewer packet data-quality snapshot to explain the watch items and clean them before a flagship recording.'
    })
  }

  const incidentScore = Number(incidentCommand?.incidentScore || 0)
  if (incidentScore >= 45) {
    risks.unshift({
      id: 'risk-incident-score',
      severity: incidentScore >= 70 ? 'HIGH' : 'MEDIUM',
      label: 'Incident score may distract from the demo story',
      mitigation: 'Resolve visible blockers or position incident command as the reason the platform is valuable during disruption.'
    })
  }

  if (risks.length === 0) {
    risks.push({
      id: 'risk-demo-drift',
      severity: 'LOW',
      label: 'Demo story may drift because the feature set is now broad',
      mitigation: 'Use the launch runbook to keep the walkthrough focused on role progression and operational evidence.'
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
      id: 'data-hardening',
      label: 'Data hardening tracked',
      status: (managementStatus?.remainingWork || []).some(item => String(item.priority).toUpperCase() === 'HIGH') ? 'WATCH' : 'READY',
      detail: 'Remaining data architecture work is explicit in the management status and should be handled before real integrations.'
    },
    {
      id: 'launch-gates',
      label: 'Launch gates summarized',
      status: redCount > 0 ? 'BLOCKED' : 'READY',
      detail: `${greenCount} green, ${yellowCount} yellow, and ${redCount} red launch gates are visible to the reviewer.`
    }
  ]
}

function buildTurnaroundLaunchPlan(input = {}) {
  const gates = buildCertificationGates(input)
  const launchScore = clampScore(gates.reduce((sum, gate) => sum + gate.score, 0) / Math.max(gates.length, 1))
  let launchStatus = 'READY_WITH_WATCH_ITEMS'
  if (launchScore < 65) launchStatus = 'NOT_READY'
  else if (launchScore < 78) launchStatus = 'NEEDS_HARDENING'
  else if (launchScore >= 90) launchStatus = 'READY_FOR_REVIEWER_DEMO'

  const demoRunbook = buildDemoRunbook({ operation: input.operation, gates, managementStatus: input.managementStatus })
  const launchRisks = buildLaunchRisks({ gates, reviewerPacket: input.reviewerPacket, outreachBoard: input.outreachBoard, incidentCommand: input.incidentCommand })
  const qualityGates = buildQualityGates({ gates, managementStatus: input.managementStatus })

  return {
    launchScore,
    launchStatus,
    headline: `Turnaround launch plan is ${launchScore}% ready with status ${normalizeStatus(launchStatus)}.`,
    summary: 'This launch plan turns the current turnaround module into a guided reviewer demo path with certification gates, role-by-role runbook steps, risk mitigations, and quality gates.',
    certificationGates: gates,
    demoRunbook,
    launchRisks,
    qualityGates,
    nextAction: launchRisks.some(risk => risk.severity === 'HIGH')
      ? 'Resolve high-severity launch risks before using this operation as the flagship external demo.'
      : 'Use the runbook to record or present the next cruise-line reviewer walkthrough.'
  }
}

module.exports = {
  buildTurnaroundLaunchPlan,
  buildCertificationGates,
  buildDemoRunbook,
  buildLaunchRisks,
  buildQualityGates
}
