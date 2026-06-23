const {
  buildTurnaroundManagementStatus,
  buildTurnaroundCapabilityMap,
  buildTurnaroundRemainingWork,
  buildTurnaroundNextSlices
} = require('../../services/turnaroundCompletion.service')

describe('turnaroundCompletion service', () => {
  const operation = {
    id: 'turnaround-1',
    shipName: 'Wonder of the Seas',
    cruiseLineName: 'Royal Caribbean International'
  }

  const tasks = [
    { status: 'COMPLETE' },
    { status: 'DONE' },
    { status: 'BLOCKED', blocker: 'Awaiting gangway clearance' }
  ]
  const staffing = [{ assignedCount: 8, requiredCount: 8 }]
  const signoffs = [{ status: 'APPROVED' }, { status: 'PENDING' }]
  const dependencies = [{ status: 'COMPLETE' }, { status: 'OPEN' }]
  const handoffs = [{ status: 'COMPLETE' }]
  const auditEvents = [{ id: 'audit-1' }, { id: 'audit-2' }]

  it('builds a continuation-ready management status summary from turnaround evidence', () => {
    const status = buildTurnaroundManagementStatus({
      operation,
      tasks,
      staffing,
      signoffs,
      dependencies,
      handoffs,
      auditEvents,
      releasePacket: { releaseScore: 86 },
      operationalTimeline: { summary: { totalEvents: 14 } },
      operationalMetrics: { summary: { releaseConfidence: 88, staffingCoverage: 100 } },
      playbookTemplate: { readinessScore: 82 },
      playbookVariance: { summary: { rehearsalScore: 84 } },
      incidentCommand: { incidentScore: 28, incidentSeverity: 'LOW' },
      afterActionReview: { summary: { reviewScore: 80 } },
      executiveBrief: { summary: { decisionScore: 87, releaseConfidence: 88, incidentScore: 28, reviewScore: 80 } },
      reviewerPacket: { readiness: { readinessScore: 86 }, dataQuality: { blockerCount: 1 } },
      outreachBoard: { readiness: { readinessScore: 84, dataQualityRisk: 1 } }
    })

    expect(status.maturityScore).toBeGreaterThanOrEqual(70)
    expect(status.completionLabel).toContain('turnaround management completion')
    expect(status.capabilities.map(capability => capability.id)).toEqual(expect.arrayContaining([
      'role-scoped-command',
      'workflow-crud',
      'release-readiness',
      'audit-timeline',
      'playbook-rehearsal',
      'incident-after-action',
      'reviewer-outreach'
    ]))
    expect(status.continuationSummary.currentState).toContain('role-scoped operations')
    expect(status.nextSlices).toEqual(expect.arrayContaining([
      expect.stringContaining('reviewer demo script')
    ]))
  })

  it('flags high-priority remaining work when evidence scores are weak', () => {
    const weakCapabilities = buildTurnaroundCapabilityMap({
      operation,
      tasks: [{ status: 'BLOCKED', blocker: 'Open' }],
      staffing: [],
      signoffs: [{ status: 'PENDING' }],
      dependencies: [{ status: 'OPEN' }],
      handoffs: [{ status: 'OPEN' }],
      incidentCommand: { incidentScore: 80 },
      reviewerPacket: { readiness: { readinessScore: 45 }, dataQuality: { blockerCount: 2 } },
      outreachBoard: { readiness: { readinessScore: 48, dataQualityRisk: 7 } }
    })

    const work = buildTurnaroundRemainingWork({
      capabilities: weakCapabilities,
      incidentCommand: { incidentScore: 80 },
      outreachBoard: { readiness: { dataQualityRisk: 7 } }
    })

    expect(work).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'reduce-incident-risk', priority: 'HIGH' }),
      expect.objectContaining({ id: 'clean-data-quality-watch-items', priority: 'HIGH' })
    ]))
  })

  it('keeps next slices focused on reviewer flow, architecture hardening, and portfolio scale', () => {
    const nextSlices = buildTurnaroundNextSlices({
      maturityScore: 91,
      remainingWork: [{ priority: 'MEDIUM' }]
    })

    expect(nextSlices).toEqual(expect.arrayContaining([
      expect.stringContaining('reviewer demo script'),
      expect.stringContaining('data architecture hardening'),
      expect.stringContaining('portfolio-level turnaround comparison')
    ]))
  })
})
