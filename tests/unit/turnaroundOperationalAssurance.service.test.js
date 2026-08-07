const {
  buildTurnaroundOperationalAssurance,
  buildAssuranceReadiness,
  buildAssuranceDataQuality
} = require('../../services/turnaroundOperationalAssurance.service')

describe('turnaroundOperationalAssurance service', () => {
  it('builds a operational assurance packet from executive and operational signals', () => {
    const packet = buildTurnaroundOperationalAssurance({
      operation: {
        id: 'turnaround-1',
        shipName: 'Wonder of the Seas',
        cruiseLineName: 'Royal Caribbean International',
        turnaroundDate: '2026-08-06'
      },
      tasks: [{ status: 'COMPLETE' }, { status: 'BLOCKED', blocker: 'Port delay' }],
      staffing: [{ requiredCount: 10, assignedCount: 8 }],
      signoffs: [{ status: 'APPROVED' }, { status: 'PENDING' }],
      dependencies: [{ status: 'WAITING' }],
      handoffs: [{ status: 'COMPLETE' }],
      escalations: [{ status: 'OPEN' }],
      auditEvents: [{ id: 'audit-1' }],
      releasePacket: { releaseScore: 82, status: 'READY_WITH_WATCH_ITEMS', summary: 'Release is tracking with watch items.' },
      operationalTimeline: { summary: { totalEvents: 12 } },
      operationalMetrics: { summary: { releaseConfidence: 84 } },
      playbookTemplate: { status: 'WATCH', nextBestActions: ['Promote after variance review.'] },
      playbookVariance: { summary: { rehearsalScore: 78, status: 'WATCH' }, rehearsalActions: ['Rehearse housekeeping variance.'] },
      incidentCommand: { incidentScore: 32, incidentSeverity: 'MEDIUM', commandActions: ['Monitor gangway dependency.'] },
      afterActionReview: { summary: { reviewScore: 76, reviewStatus: 'FOLLOW_UP' }, followUpActions: ['Close lesson owner.'] },
      executiveBrief: { summary: { decisionScore: 84, releaseConfidence: 84, incidentScore: 32, reviewScore: 76, rehearsalScore: 78 }, executiveActions: ['Publish with watch items.'] }
    })

    expect(packet.header.title).toContain('Wonder of the Seas operational assurance packet')
    expect(packet.readiness.readinessScore).toBeGreaterThan(70)
    expect(packet.proofPoints.map(point => point.id)).toEqual([
      'role-scoped-operations',
      'release-readiness',
      'timeline-depth',
      'playbook-promotion',
      'incident-command',
      'after-action-review'
    ])
    expect(packet.dataQuality).toMatchObject({
      taskCount: 2,
      blockerCount: 1,
      openEscalations: 1,
      staffingGaps: 1,
      incompleteSignoffs: 1,
      openDependencies: 1,
      auditEventCount: 1,
      status: 'WATCH'
    })
    expect(packet.nextSteps[0]).toBe('Resolve the top watch items before advancing this operation to executive operational review.')
  })

  it('marks high scoring operations ready for cruise-line review', () => {
    const readiness = buildAssuranceReadiness({
      executiveBrief: { summary: { decisionScore: 94 } },
      releasePacket: { releaseScore: 92 },
      incidentCommand: { incidentScore: 8 },
      afterActionReview: { summary: { reviewScore: 90 } },
      playbookVariance: { summary: { rehearsalScore: 91 } }
    })

    expect(readiness.readinessStatus).toBe('READY_FOR_OPERATIONAL_REVIEW')
    expect(readiness.readinessScore).toBeGreaterThanOrEqual(88)
  })

  it('summarizes clean data quality when no operational watch items are open', () => {
    expect(buildAssuranceDataQuality({
      tasks: [{ status: 'COMPLETE' }],
      staffing: [{ requiredCount: 2, assignedCount: 2 }],
      signoffs: [{ status: 'APPROVED' }],
      dependencies: [{ status: 'COMPLETE' }],
      handoffs: [{ status: 'COMPLETE' }],
      escalations: [{ status: 'RESOLVED' }],
      auditEvents: []
    }).status).toBe('CLEAN')
  })
})
