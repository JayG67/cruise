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

describe('turnaroundOperationalBriefingBoard authoritative evidence and resilience', () => {
  it('preserves explicit zero executive, review, and incident scores instead of replacing them with fallbacks', () => {
    const readiness = buildBriefingReadiness({
      operationalAssurancePacket: {
        readiness: { readinessScore: 90 },
        dataQuality: {}
      },
      executiveBrief: {
        summary: { decisionScore: 0, reviewScore: 85, incidentScore: 80 }
      },
      afterActionReview: {
        summary: { reviewScore: 0 }
      },
      incidentCommand: { incidentScore: 0 }
    })

    expect(readiness).toMatchObject({
      assuranceScore: 90,
      executiveScore: 0,
      reviewScore: 0,
      incidentScore: 0
    })
    expect(readiness.readinessStatus).toBe('HOLD_FOR_FIXES')
  })

  it('uses fallback evidence only when authoritative values are absent', () => {
    const readiness = buildBriefingReadiness({
      operationalAssurancePacket: {
        readiness: { readinessScore: 80 },
        dataQuality: {}
      },
      executiveBrief: {
        summary: { reviewScore: 72, incidentScore: 18 }
      }
    })

    expect(readiness).toMatchObject({
      assuranceScore: 80,
      executiveScore: 80,
      reviewScore: 72,
      incidentScore: 18
    })
  })

  it('builds a safe briefing board from explicit null operation and collection inputs', () => {
    const board = buildTurnaroundOperationalBriefingBoard({
      operation: null,
      operationalAssurancePacket: {
        readiness: { readinessScore: 0 },
        dataQuality: null,
        proofPoints: null,
        nextSteps: null
      },
      executiveBrief: {
        summary: { decisionScore: 0, reviewScore: 0, incidentScore: 0 },
        highlights: null,
        decisionHighlights: null,
        executiveActions: null
      },
      afterActionReview: {
        summary: { reviewScore: 0 },
        departmentLessons: null,
        followUpActions: null
      },
      incidentCommand: { incidentScore: 0 }
    })

    expect(board.narrative.headline).toBe('Selected ship operational briefing is 24% ready.')
    expect(board.audienceRecommendations[0].label).toBe('Current cruise line leadership')
    expect(board.assets.find(asset => asset.id === 'proof-points')).toMatchObject({ status: '0 READY' })
    expect(board.assets.find(asset => asset.id === 'lessons')).toMatchObject({ status: '0 TRACKED' })
    expect(board.readiness.incidentScore).toBe(0)
  })

  it('keeps explicit zero values visible in briefing checklist details', () => {
    const checklist = buildBriefingChecklist({
      operationalAssurancePacket: { readiness: { readinessScore: 0 }, dataQuality: null },
      executiveBrief: { summary: { decisionScore: 0 } },
      afterActionReview: { summary: { reviewScore: 0 } },
      incidentCommand: { incidentScore: 0, incidentSeverity: 'STABLE' }
    })

    expect(checklist.find(item => item.id === 'operational-assurance').detail).toContain('0% assurance readiness')
    expect(checklist.find(item => item.id === 'executive-brief').detail).toContain('0% executive decision score')
    expect(checklist.find(item => item.id === 'incident-risk').detail).toContain('Incident command score 0')
    expect(checklist.find(item => item.id === 'learning-loop').detail).toContain('0% after-action review score')
  })
})

describe('turnaroundOperationalBriefingBoard malformed evidence hardening', () => {
  it('does not let negative or malformed data-quality counts make briefing evidence look healthier', () => {
    const readiness = buildBriefingReadiness({
      operationalAssurancePacket: {
        readiness: { readinessScore: 92 },
        dataQuality: {
          blockerCount: -4,
          openEscalations: '2.9',
          staffingGaps: 'not-a-number',
          incompleteSignoffs: -1,
          openDependencies: 1,
          openHandoffs: 0
        }
      },
      executiveBrief: { summary: { decisionScore: 92 } },
      afterActionReview: { summary: { reviewScore: 92 } },
      incidentCommand: { incidentScore: 0 }
    })

    expect(readiness.dataQualityRisk).toBe(3)
    expect(readiness.dataQualityScore).toBe(76)
    expect(readiness.readinessStatus).toBe('READY_WITH_NOTES')
  })

  it('covers review and ready status thresholds without relying on malformed evidence', () => {
    expect(buildBriefingReadiness({
      operationalAssurancePacket: { readiness: { readinessScore: 70 }, dataQuality: {} },
      executiveBrief: { summary: { decisionScore: 70 } },
      afterActionReview: { summary: { reviewScore: 70 } },
      incidentCommand: { incidentScore: 20 }
    }).readinessStatus).toBe('REVIEW_BEFORE_BRIEFING')

    expect(buildBriefingReadiness({
      operationalAssurancePacket: { readiness: { readinessScore: 98 }, dataQuality: {} },
      executiveBrief: { summary: { decisionScore: 98 } },
      afterActionReview: { summary: { reviewScore: 98 } },
      incidentCommand: { incidentScore: 0 }
    }).readinessStatus).toBe('READY_FOR_BRIEFING')
  })
})


describe('turnaroundOperationalBriefingBoard evidence-count and branch hardening', () => {
  it('does not invent executive highlight counts when only fallback narrative exists', () => {
    const board = buildTurnaroundOperationalBriefingBoard({
      executiveBrief: { narrative: { summary: 'Leadership summary is available.' } }
    })

    expect(board.assets.find(asset => asset.id === 'executive-highlights')).toMatchObject({
      status: '0 READY',
      detail: 'Leadership summary is available.'
    })
  })

  it('counts decision highlights only when they are actually present', () => {
    const board = buildTurnaroundOperationalBriefingBoard({
      executiveBrief: { decisionHighlights: ['First decision.', 'Second decision.'] }
    })

    expect(board.assets.find(asset => asset.id === 'executive-highlights')).toMatchObject({
      status: '2 READY',
      detail: 'First decision. Second decision.'
    })
  })

  it('covers checklist watch and fix thresholds with singular data-quality wording', () => {
    const watchChecklist = buildBriefingChecklist({
      operationalAssurancePacket: { readiness: { readinessScore: 77, readinessStatus: 'NEEDS_REVIEW' }, dataQuality: { blockerCount: 1 } },
      executiveBrief: { summary: { decisionScore: 77, decisionStatus: 'NEEDS_REVIEW' } },
      afterActionReview: { summary: { reviewScore: 74, reviewStatus: 'FOLLOW_UP' } },
      incidentCommand: { incidentScore: 40, incidentSeverity: 'WATCH' }
    })
    expect(watchChecklist.find(item => item.id === 'data-quality')).toMatchObject({ status: 'WATCH' })
    expect(watchChecklist.find(item => item.id === 'data-quality').detail).toContain('1 open data-quality watch item across')
    expect(watchChecklist.find(item => item.id === 'incident-risk')).toMatchObject({ status: 'WATCH' })
    expect(watchChecklist.find(item => item.id === 'operational-assurance')).toMatchObject({ status: 'REVIEW' })
    expect(watchChecklist.find(item => item.id === 'executive-brief')).toMatchObject({ status: 'REVIEW' })
    expect(watchChecklist.find(item => item.id === 'learning-loop')).toMatchObject({ status: 'REVIEW' })

    const fixChecklist = buildBriefingChecklist({
      operationalAssurancePacket: { readiness: { readinessScore: 90 }, dataQuality: { blockerCount: 4 } },
      executiveBrief: { summary: { decisionScore: 90 } },
      afterActionReview: { summary: { reviewScore: 90 } },
      incidentCommand: { incidentScore: 70 }
    })
    expect(fixChecklist.find(item => item.id === 'data-quality')).toMatchObject({ status: 'FIX' })
    expect(fixChecklist.find(item => item.id === 'incident-risk')).toMatchObject({ status: 'FIX' })
  })

  it('covers ready-with-notes readiness and audience gating', () => {
    const readiness = buildBriefingReadiness({
      operationalAssurancePacket: { readiness: { readinessScore: 90 }, dataQuality: { blockerCount: 2 } },
      executiveBrief: { summary: { decisionScore: 90 } },
      afterActionReview: { summary: { reviewScore: 90 } },
      incidentCommand: { incidentScore: 10 }
    })
    expect(readiness.readinessStatus).toBe('READY_WITH_NOTES')

    const audiences = buildAudienceRecommendations({
      operation: null,
      readiness: { readinessScore: 77, readinessStatus: 'READY_WITH_NOTES', dataQualityRisk: 4 },
      operationalAssurancePacket: null
    })
    expect(audiences[0]).toMatchObject({ label: 'Current cruise line leadership', status: 'READY_WITH_NOTES' })
    expect(audiences[0].detail).toContain('role-scoped turnaround operations')
    expect(audiences.find(item => item.id === 'ship-command')).toMatchObject({ status: 'WAIT' })
    expect(audiences.find(item => item.id === 'department-leads')).toMatchObject({ status: 'WAIT' })
  })

  it('selects hold, review, and ready action-plan guidance from authoritative evidence', () => {
    const holdBoard = buildTurnaroundOperationalBriefingBoard({
      operationalAssurancePacket: { readiness: { readinessScore: 40 }, dataQuality: {}, nextSteps: [] },
      executiveBrief: { summary: { decisionScore: 40 }, executiveActions: ['Executive fallback action.'] },
      afterActionReview: { summary: { reviewScore: 40 }, followUpActions: [] },
      incidentCommand: { incidentScore: 80 }
    })
    expect(holdBoard.actionPlan[0]).toContain('Resolve hold-level')
    expect(holdBoard.actionPlan[1]).toBe('Executive fallback action.')
    expect(holdBoard.actionPlan[2]).toBe('Use after-action lessons to improve repeated turnarounds.')

    const reviewBoard = buildTurnaroundOperationalBriefingBoard({
      operationalAssurancePacket: { readiness: { readinessScore: 72 }, dataQuality: {}, nextSteps: ['Packet action.'] },
      executiveBrief: { summary: { decisionScore: 72 } },
      afterActionReview: { summary: { reviewScore: 72 }, followUpActions: ['Review lesson.'] },
      incidentCommand: { incidentScore: 10 }
    })
    expect(reviewBoard.actionPlan[0]).toContain('Review watch items')
    expect(reviewBoard.actionPlan.slice(1, 3)).toEqual(['Packet action.', 'Review lesson.'])

    const readyBoard = buildTurnaroundOperationalBriefingBoard({
      operationalAssurancePacket: { readiness: { readinessScore: 98 }, dataQuality: {} },
      executiveBrief: { summary: { decisionScore: 98 } },
      afterActionReview: { summary: { reviewScore: 98 } },
      incidentCommand: { incidentScore: 0 }
    })
    expect(readyBoard.actionPlan[0]).toContain('Prepare the operational assurance packet')
  })

  it('normalizes non-finite and fractional risk counts without reducing briefing safety', () => {
    const readiness = buildBriefingReadiness({
      operationalAssurancePacket: {
        readiness: { readinessScore: 90 },
        dataQuality: { blockerCount: Infinity, openEscalations: 2.9, staffingGaps: null, incompleteSignoffs: undefined, openDependencies: '1.8', openHandoffs: -2 }
      },
      executiveBrief: { summary: { decisionScore: 90 } },
      afterActionReview: { summary: { reviewScore: 90 } },
      incidentCommand: { incidentScore: 10 }
    })
    expect(readiness.dataQualityRisk).toBe(3)
    expect(readiness.dataQualityScore).toBe(76)
  })
})
