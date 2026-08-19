const {
  buildTurnaroundOperationalAssurance,
  buildAssuranceReadiness,
  buildAssuranceHeader,
  buildAssuranceProofPoints,
  buildAssuranceNarrative,
  buildAssuranceDataQuality,
  buildAssuranceNextSteps
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

  it('detects live turnaround staffing gaps from planned and checked-in counts', () => {
    const quality = buildAssuranceDataQuality({
      staffing: [
        { plannedCount: 8, checkedInCount: 5 },
        { plannedCount: 3, checkedInCount: 3 }
      ]
    })

    expect(quality.staffingGaps).toBe(1)
    expect(quality.status).toBe('WATCH')
  })

  it('preserves compatibility staffing fields while treating explicit zero values as authoritative', () => {
    expect(buildAssuranceDataQuality({ staffing: [{ requiredCount: 4, assignedCount: 2 }] }).staffingGaps).toBe(1)
    expect(buildAssuranceDataQuality({ staffing: [{ plannedCount: 0, checkedInCount: 0, requiredCount: 9, assignedCount: 1 }] }).staffingGaps).toBe(0)
  })


  it('clamps malformed and out-of-range readiness inputs without inflating assurance', () => {
    const readiness = buildAssuranceReadiness({
      executiveBrief: { summary: { decisionScore: 140, releaseConfidence: -10, incidentScore: 'bad', reviewScore: 101, rehearsalScore: -4 } }
    })

    expect(readiness).toMatchObject({
      executiveScore: 100,
      releaseScore: 0,
      incidentScore: 0,
      debriefScore: 100,
      rehearsalScore: 0
    })
    expect(readiness.readinessStatus).toBe('ASSURANCE_WITH_WATCH_ITEMS')
  })

  it('builds header fallbacks from sparse operation metadata', () => {
    expect(buildAssuranceHeader({ operation: { title: 'Pier turnaround', embarkationPort: 'Miami' }, readiness: { readinessStatus: 'WATCH', readinessScore: 72 } })).toMatchObject({
      title: 'Pier turnaround operational assurance packet',
      subtitle: 'Cruise line · scheduled turnaround',
      portName: 'Miami',
      status: 'WATCH',
      score: 72
    })
    expect(buildAssuranceHeader({ operation: { departurePort: 'Seattle' } }).portName).toBe('Seattle')
  })

  it('uses proof-point fallbacks when specialized evidence packets are absent', () => {
    const points = buildAssuranceProofPoints({
      operation: { shipName: 'Explorer' },
      operationalMetrics: { summary: { releaseStatus: 'READY_WITH_NOTES', releaseConfidence: 83 } },
      executiveBrief: { summary: { timelineEvents: 7 } },
      playbookTemplate: { recommendations: ['Standardize gangway setup.'] },
      afterActionReview: { findings: [{ detail: 'Close staffing lesson.' }] }
    })

    expect(points.find(point => point.id === 'release-readiness')).toMatchObject({ status: 'READY WITH NOTES', detail: 'Release confidence 83%.' })
    expect(points.find(point => point.id === 'timeline-depth').status).toBe('7 EVENTS')
    expect(points.find(point => point.id === 'playbook-promotion').detail).toBe('Standardize gangway setup.')
    expect(points.find(point => point.id === 'incident-command').detail).toContain('No critical release-day exception bridge')
    expect(points.find(point => point.id === 'after-action-review').detail).toBe('Close staffing lesson.')
  })

  it('selects narrative actions by executive, incident, after-action, then default precedence', () => {
    expect(buildAssuranceNarrative({ executiveBrief: { executiveActions: ['Executive action'] } }).topAction).toBe('Executive action')
    expect(buildAssuranceNarrative({ incidentCommand: { commandActions: ['Incident action'] } }).topAction).toBe('Incident action')
    expect(buildAssuranceNarrative({ afterActionReview: { followUpActions: ['Debrief action'] } }).topAction).toBe('Debrief action')
    expect(buildAssuranceNarrative().topAction).toContain('Continue operational assurance validation')
  })

  it('counts blocker text and only treats resolved escalation states as closed', () => {
    const quality = buildAssuranceDataQuality({
      tasks: [{ status: 'IN_PROGRESS', blocker: 'Awaiting inspection' }],
      staffing: [],
      signoffs: [{ status: 'approved' }],
      dependencies: [{ status: 'complete' }],
      handoffs: [{ status: 'complete' }],
      escalations: [{ status: 'closed' }, { status: 'MONITORING' }]
    })

    expect(quality).toMatchObject({ blockerCount: 1, openEscalations: 1, incompleteSignoffs: 0, openDependencies: 0, openHandoffs: 0, status: 'WATCH' })
  })

  it('deduplicates assurance next steps and caps the published action list', () => {
    const duplicate = 'Resolve shared issue.'
    const steps = buildAssuranceNextSteps({
      readiness: { readinessStatus: 'READY_FOR_OPERATIONAL_REVIEW' },
      executiveBrief: { executiveActions: [duplicate, duplicate, 'E2', 'E3'] },
      incidentCommand: { commandActions: ['I1', 'I2'] },
      afterActionReview: { followUpActions: ['A1', 'A2'] },
      playbookVariance: { rehearsalActions: ['P1', 'P2'] }
    })

    expect(steps[0]).toContain('primary evidence set')
    expect(steps.filter(step => step === `Executive: ${duplicate}`)).toHaveLength(1)
    expect(steps).toHaveLength(8)
  })


  it('fails non-finite assurance scores safe instead of promoting them to 100 percent', () => {
    const readiness = buildAssuranceReadiness({
      executiveBrief: { summary: { decisionScore: Infinity, releaseConfidence: Infinity, incidentScore: Infinity, reviewScore: Infinity, rehearsalScore: Infinity } }
    })

    expect(readiness).toMatchObject({
      executiveScore: 0,
      releaseScore: 0,
      incidentScore: 0,
      debriefScore: 0,
      rehearsalScore: 0,
      readinessScore: 18,
      readinessStatus: 'HOLD_FOR_COMMAND_ASSURANCE'
    })
  })

  it('normalizes malformed staffing counts before detecting assurance gaps', () => {
    const quality = buildAssuranceDataQuality({
      staffing: [
        { plannedCount: 5, checkedInCount: 'bad' },
        { plannedCount: Infinity, checkedInCount: 0 },
        { plannedCount: 3.9, checkedInCount: 2.1 },
        { plannedCount: -4, checkedInCount: 0 }
      ]
    })

    expect(quality.staffingGaps).toBe(2)
    expect(quality.status).toBe('WATCH')
  })

  it('does not iterate malformed action collections character by character', () => {
    const packet = buildTurnaroundOperationalAssurance({
      executiveBrief: { executiveActions: 'BAD' },
      incidentCommand: { commandActions: 'BAD' },
      afterActionReview: { followUpActions: 'BAD', findings: 'BAD' },
      playbookVariance: { rehearsalActions: 'BAD' },
      playbookTemplate: { nextBestActions: 'BAD', recommendations: 'BAD' }
    })

    expect(packet.nextSteps).toEqual(['Resolve the top watch items before advancing this operation to executive operational review.'])
    expect(packet.proofPoints.find(point => point.id === 'playbook-promotion').detail).toContain('Review variance before promotion')
    expect(packet.proofPoints.find(point => point.id === 'incident-command').detail).toContain('No critical release-day exception bridge')
    expect(packet.proofPoints.find(point => point.id === 'after-action-review').detail).toContain('Capture final lessons')
  })

})

describe('turnaroundOperationalAssurance normalized operational evidence', () => {
  it('trims status tokens before deciding whether operational evidence is closed', () => {
    const quality = buildAssuranceDataQuality({
      signoffs: [{ status: ' approved ' }],
      dependencies: [{ status: ' completed ' }],
      handoffs: [{ status: ' complete ' }],
      escalations: [{ status: ' resolved ' }, { status: ' closed ' }]
    })

    expect(quality).toMatchObject({
      openEscalations: 0,
      incompleteSignoffs: 0,
      openDependencies: 0,
      openHandoffs: 0,
      status: 'CLEAN'
    })
  })

  it('does not publish object-valued narrative evidence as assurance actions or proof text', () => {
    const narrative = buildAssuranceNarrative({
      executiveBrief: { executiveActions: [{ bad: true }] },
      incidentCommand: { commandActions: ['  Valid incident action  '] }
    })
    const points = buildAssuranceProofPoints({
      releasePacket: { summary: { bad: true } },
      operationalMetrics: { summary: { releaseConfidence: 82 } },
      incidentCommand: { commandActions: [{ bad: true }] }
    })

    expect(narrative.topAction).toBe('Valid incident action')
    expect(points.find(point => point.id === 'release-readiness').detail).toBe('Release confidence 82%.')
    expect(points.find(point => point.id === 'incident-command').detail).toContain('No critical release-day exception bridge')
  })
})

describe('turnaroundOperationalAssurance action text hardening', () => {
  it('skips malformed action objects when building assurance next steps', () => {
    const steps = buildAssuranceNextSteps({
      readiness: { readinessStatus: 'READY_FOR_OPERATIONAL_REVIEW' },
      executiveBrief: { executiveActions: [{ bad: true }, '  Publish brief  '] },
      incidentCommand: { commandActions: [{ bad: true }] },
      afterActionReview: { followUpActions: [null, 'Close lesson'] },
      playbookVariance: { rehearsalActions: [{ bad: true }] }
    })

    expect(steps).toEqual(expect.arrayContaining(['Executive: Publish brief', 'After action: Close lesson']))
    expect(JSON.stringify(steps)).not.toContain('[object Object]')
  })
})
