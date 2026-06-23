const {
  buildTurnaroundLaunchPlan,
  buildCertificationGates,
  buildDemoRunbook,
  buildLaunchRisks,
  buildQualityGates
} = require('../../services/turnaroundLaunchPlan.service')

describe('turnaroundLaunchPlan service', () => {
  const operation = {
    id: 'turnaround-1',
    shipName: 'Wonder of the Seas',
    cruiseLineName: 'Royal Caribbean International',
    turnaroundDate: '2026-06-18'
  }

  it('builds reviewer launch gates, runbook steps, risks, and quality gates from turnaround evidence', () => {
    const plan = buildTurnaroundLaunchPlan({
      operation,
      releasePacket: { releaseScore: 91 },
      operationalMetrics: { summary: { releaseConfidence: 89 } },
      incidentCommand: { incidentScore: 20, incidentSeverity: 'LOW' },
      afterActionReview: { summary: { reviewScore: 88 } },
      executiveBrief: { summary: { releaseConfidence: 89, incidentScore: 20, reviewScore: 88 } },
      reviewerPacket: { readiness: { readinessScore: 90 }, dataQuality: { blockerCount: 0 } },
      outreachBoard: { readiness: { readinessScore: 86, dataQualityRisk: 0 } },
      managementStatus: {
        maturityScore: 90,
        continuationSummary: { headline: 'Turnaround management is 90% complete.' },
        remainingWork: [],
        nextSlices: ['Add a final reviewer demo script.']
      }
    })

    expect(plan.launchScore).toBeGreaterThanOrEqual(85)
    expect(plan.launchStatus).toMatch(/READY/)
    expect(plan.certificationGates.map(gate => gate.id)).toEqual(expect.arrayContaining([
      'operational-release-confidence',
      'incident-risk-contained',
      'after-action-loop-ready',
      'reviewer-evidence-ready',
      'outreach-package-ready',
      'management-continuation-ready'
    ]))
    expect(plan.demoRunbook.map(step => step.role)).toEqual(expect.arrayContaining([
      'Admin',
      'Passenger',
      'Group Leader',
      'Turnaround Manager',
      'Department Lead',
      'Reviewer'
    ]))
    expect(plan.qualityGates).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'automated-suite' }),
      expect.objectContaining({ id: 'mobile-scope' })
    ]))
    expect(plan.nextAction).toContain('runbook')
  })

  it('surfaces red and high-risk launch items when reviewer evidence is weak', () => {
    const gates = buildCertificationGates({
      operation,
      releasePacket: { releaseScore: 55 },
      incidentCommand: { incidentScore: 80, incidentSeverity: 'CRITICAL' },
      afterActionReview: { summary: { reviewScore: 52 } },
      reviewerPacket: { readiness: { readinessScore: 50 }, dataQuality: { blockerCount: 3 } },
      outreachBoard: { readiness: { readinessScore: 48, dataQualityRisk: 6 } },
      managementStatus: { maturityScore: 58 }
    })
    const risks = buildLaunchRisks({
      gates,
      reviewerPacket: { dataQuality: { blockerCount: 3 } },
      outreachBoard: { readiness: { dataQualityRisk: 6 } },
      incidentCommand: { incidentScore: 80 }
    })
    const qualityGates = buildQualityGates({ gates, managementStatus: { remainingWork: [{ priority: 'HIGH' }] } })

    expect(gates.some(gate => gate.status === 'RED')).toBe(true)
    expect(risks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'risk-incident-score', severity: 'HIGH' }),
      expect.objectContaining({ id: 'risk-data-quality-watch-items', severity: 'HIGH' })
    ]))
    expect(qualityGates).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'launch-gates', status: 'BLOCKED' }),
      expect.objectContaining({ id: 'data-hardening', status: 'WATCH' })
    ]))
  })

  it('adds watch-item and continuation steps to the demo runbook when needed', () => {
    const runbook = buildDemoRunbook({
      operation,
      gates: [{ id: 'reviewer-evidence-ready', label: 'Reviewer evidence ready', score: 60 }],
      managementStatus: { nextSlices: ['Add portfolio-level turnaround comparison.'] }
    })

    expect(runbook.map(step => step.id)).toEqual(expect.arrayContaining([
      'watch-item-proof',
      'continuation-proof'
    ]))
  })
})
