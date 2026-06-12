const {
  buildTurnaroundOutreachBoard,
  buildOutreachReadiness,
  buildApplicationChecklist,
  buildTargetRecommendations
} = require('../../services/turnaroundOutreach.service')

describe('turnaroundOutreach service', () => {
  it('builds a cruise-line outreach board from reviewer and executive evidence', () => {
    const board = buildTurnaroundOutreachBoard({
      operation: {
        shipName: 'Wonder of the Seas',
        cruiseLineName: 'Royal Caribbean International'
      },
      reviewerPacket: {
        readiness: { readinessScore: 86, readinessStatus: 'READY_WITH_NOTES' },
        narrative: { summary: 'Reviewer packet is strong.', topAction: 'Send after final review.' },
        dataQuality: { blockerCount: 1, openEscalations: 0, staffingGaps: 1, incompleteSignoffs: 0, openDependencies: 0, openHandoffs: 0 },
        proofPoints: [{ id: 'role-scoped-operations', label: 'Role-scoped operations' }],
        nextSteps: ['Resolve final watch item.']
      },
      executiveBrief: {
        summary: { decisionScore: 88, decisionStatus: 'READY_WITH_NOTES', incidentScore: 22, reviewScore: 82 },
        executiveActions: ['Publish executive brief.'],
        highlights: ['Release confidence is high.']
      },
      afterActionReview: {
        summary: { reviewScore: 82, reviewStatus: 'READY' },
        followUpActions: ['Close debrief item.'],
        departmentLessons: [{ departmentRole: 'Guest Services', lesson: 'Stagger embarkation desks.' }]
      },
      incidentCommand: { incidentScore: 22, incidentSeverity: 'LOW' }
    })

    expect(board.readiness.readinessScore).toBeGreaterThan(80)
    expect(board.narrative.headline).toContain('Wonder of the Seas outreach packet')
    expect(board.checklist.map(item => item.id)).toEqual([
      'reviewer-packet',
      'executive-brief',
      'data-quality',
      'incident-risk',
      'learning-loop'
    ])
    expect(board.assets.map(asset => asset.id)).toEqual([
      'packet-summary',
      'proof-points',
      'executive-highlights',
      'lessons'
    ])
    expect(board.targetRecommendations[0].label).toBe('Royal Caribbean International')
    expect(board.actionPlan).toContain('Keep demo role assumption enabled so reviewers can inspect admin, passenger, group leader, turnaround manager, and department-lead perspectives without a login wall.')
  })

  it('holds outreach when incident risk or data quality risk is high', () => {
    const readiness = buildOutreachReadiness({
      reviewerPacket: {
        readiness: { readinessScore: 91 },
        dataQuality: { blockerCount: 3, openEscalations: 2, staffingGaps: 2, incompleteSignoffs: 1 }
      },
      executiveBrief: { summary: { decisionScore: 90 } },
      afterActionReview: { summary: { reviewScore: 88 } },
      incidentCommand: { incidentScore: 74 }
    })

    expect(readiness.readinessStatus).toBe('HOLD_FOR_FIXES')
    expect(readiness.dataQualityRisk).toBe(8)
  })

  it('marks checklist data quality clean when no watch items are open', () => {
    const checklist = buildApplicationChecklist({
      reviewerPacket: {
        readiness: { readinessScore: 90 },
        dataQuality: { blockerCount: 0, openEscalations: 0, staffingGaps: 0, incompleteSignoffs: 0, openDependencies: 0, openHandoffs: 0 }
      },
      executiveBrief: { summary: { decisionScore: 90 } },
      afterActionReview: { summary: { reviewScore: 88 } },
      incidentCommand: { incidentScore: 10 }
    })

    expect(checklist.find(item => item.id === 'data-quality')).toMatchObject({ status: 'READY' })
  })

  it('targets current line, large ship operators, premium lines, and technology reviewers', () => {
    const targets = buildTargetRecommendations({
      operation: { cruiseLineName: 'Disney Cruise Line', shipName: 'Disney Dream' },
      readiness: { readinessScore: 88, readinessStatus: 'READY_TO_SEND', dataQualityRisk: 0 },
      reviewerPacket: { proofPoints: [{ label: 'Role-scoped operations' }] }
    })

    expect(targets.map(target => target.id)).toEqual([
      'current-line',
      'large-ship-operators',
      'premium-family-lines',
      'operations-tech-reviewers'
    ])
    expect(targets[0]).toMatchObject({ label: 'Disney Cruise Line', status: 'SEND_READY' })
  })
})
