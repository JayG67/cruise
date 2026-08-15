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

  it('preserves authoritative zero scores instead of inflating them from executive fallbacks', () => {
    const readiness = buildAssuranceReadiness({
      executiveBrief: {
        summary: {
          decisionScore: 80,
          releaseConfidence: 95,
          incidentScore: 65,
          reviewScore: 92,
          rehearsalScore: 90
        }
      },
      releasePacket: { releaseScore: 0 },
      incidentCommand: { incidentScore: 0 },
      afterActionReview: { summary: { reviewScore: 0 } },
      playbookVariance: { summary: { rehearsalScore: 0 } }
    })

    expect(readiness).toMatchObject({
      executiveScore: 80,
      releaseScore: 0,
      incidentScore: 0,
      debriefScore: 0,
      rehearsalScore: 0,
      readinessScore: 45,
      readinessStatus: 'HOLD_FOR_COMMAND_ASSURANCE'
    })
  })

  it('preserves zero-valued release confidence and timeline evidence in proof points', () => {
    const packet = buildTurnaroundOperationalAssurance({
      operationalMetrics: { summary: { releaseConfidence: 0 } },
      operationalTimeline: { summary: { totalEvents: 0 } },
      executiveBrief: { summary: { releaseConfidence: 91, timelineEvents: 18 } }
    })

    const releasePoint = packet.proofPoints.find(point => point.id === 'release-readiness')
    const timelinePoint = packet.proofPoints.find(point => point.id === 'timeline-depth')

    expect(releasePoint.detail).toBe('Release confidence 0%.')
    expect(timelinePoint.status).toBe('0 EVENTS')
  })

  it('degrades explicit null operational inputs to an empty assurance packet instead of throwing', () => {
    const packet = buildTurnaroundOperationalAssurance({
      operation: null,
      tasks: null,
      staffing: null,
      signoffs: null,
      dependencies: null,
      handoffs: null,
      escalations: null,
      auditEvents: null
    })

    expect(packet.header).toMatchObject({
      title: 'Turnaround operation operational assurance packet',
      subtitle: 'Cruise line · scheduled turnaround'
    })
    expect(packet.dataQuality).toEqual(expect.objectContaining({
      taskCount: 0,
      blockerCount: 0,
      openEscalations: 0,
      staffingGaps: 0,
      incompleteSignoffs: 0,
      openDependencies: 0,
      openHandoffs: 0,
      auditEventCount: 0,
      status: 'CLEAN'
    }))
  })

  it('covers hold, watch, ready-with-notes, and fully-ready assurance thresholds', () => {
    const hold = buildAssuranceReadiness({
      executiveBrief: { summary: { decisionScore: 100, releaseConfidence: 100, reviewScore: 100, rehearsalScore: 100 } },
      incidentCommand: { incidentScore: 70 }
    })
    const watch = buildAssuranceReadiness({
      executiveBrief: { summary: { decisionScore: 100, releaseConfidence: 100, reviewScore: 100, rehearsalScore: 100 } },
      incidentCommand: { incidentScore: 45 }
    })
    const notes = buildAssuranceReadiness({
      executiveBrief: { summary: { decisionScore: 82, releaseConfidence: 82, incidentScore: 10, reviewScore: 82, rehearsalScore: 82 } }
    })
    const ready = buildAssuranceReadiness({
      executiveBrief: { summary: { decisionScore: 100, releaseConfidence: 100, incidentScore: 0, reviewScore: 100, rehearsalScore: 100 } }
    })

    expect(hold.readinessStatus).toBe('HOLD_FOR_COMMAND_ASSURANCE')
    expect(watch.readinessStatus).toBe('ASSURANCE_WITH_WATCH_ITEMS')
    expect(notes.readinessStatus).toBe('ASSURANCE_READY_WITH_NOTES')
    expect(ready.readinessStatus).toBe('READY_FOR_OPERATIONAL_REVIEW')
  })
})
