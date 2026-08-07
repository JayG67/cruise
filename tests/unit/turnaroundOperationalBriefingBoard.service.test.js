const {
  buildTurnaroundOperationalBriefingBoard,
  buildBriefingReadiness,
  buildBriefingChecklist,
  buildAudienceRecommendations
} = require('../../services/turnaroundOperationalBriefingBoard.service')

describe('turnaroundOperationalBriefingBoard service', () => {
  it('builds an operational briefing board from assurance and executive evidence', () => {
    const board = buildTurnaroundOperationalBriefingBoard({
      operation: {
        shipName: 'Wonder of the Seas',
        cruiseLineName: 'Royal Caribbean International'
      },
      operationalAssurancePacket: {
        readiness: { readinessScore: 86, readinessStatus: 'ASSURANCE_READY_WITH_NOTES' },
        narrative: { summary: 'Operational assurance is strong.', topAction: 'Brief after final review.' },
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
    expect(board.narrative.headline).toContain('Wonder of the Seas operational briefing')
    expect(board.checklist.map(item => item.id)).toEqual([
      'operational-assurance',
      'executive-brief',
      'data-quality',
      'incident-risk',
      'learning-loop'
    ])
    expect(board.assets.map(asset => asset.id)).toEqual([
      'assurance-summary',
      'proof-points',
      'executive-highlights',
      'lessons'
    ])
    expect(board.audienceRecommendations[0].label).toBe('Royal Caribbean International leadership')
    expect(board.actionPlan).toContain('Confirm role-scoped access and current operational data before briefing each command audience.')
  })

  it('holds the briefing when incident risk or data quality risk is high', () => {
    const readiness = buildBriefingReadiness({
      operationalAssurancePacket: {
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
    const checklist = buildBriefingChecklist({
      operationalAssurancePacket: {
        readiness: { readinessScore: 90 },
        dataQuality: { blockerCount: 0, openEscalations: 0, staffingGaps: 0, incompleteSignoffs: 0, openDependencies: 0, openHandoffs: 0 }
      },
      executiveBrief: { summary: { decisionScore: 90 } },
      afterActionReview: { summary: { reviewScore: 88 } },
      incidentCommand: { incidentScore: 10 }
    })

    expect(checklist.find(item => item.id === 'data-quality')).toMatchObject({ status: 'READY' })
  })

  it('builds recommendations for leadership, command, departments, and operations technology', () => {
    const audiences = buildAudienceRecommendations({
      operation: { cruiseLineName: 'Disney Cruise Line', shipName: 'Disney Dream' },
      readiness: { readinessScore: 88, readinessStatus: 'READY_FOR_BRIEFING', dataQualityRisk: 0 },
      operationalAssurancePacket: { proofPoints: [{ label: 'Role-scoped operations' }] }
    })

    expect(audiences.map(audience => audience.id)).toEqual([
      'line-leadership',
      'ship-command',
      'department-leads',
      'operations-technology'
    ])
    expect(audiences[0]).toMatchObject({ label: 'Disney Cruise Line leadership', status: 'READY' })
  })
})
