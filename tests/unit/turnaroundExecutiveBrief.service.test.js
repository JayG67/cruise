const {
  buildTurnaroundExecutiveBrief,
  buildExecutiveDecision,
  buildExecutiveDepartments
} = require('../../services/turnaroundExecutiveBrief.service')

describe('turnaroundExecutiveBrief.service', () => {
  it('builds an executive-ready decision when release, debrief, incident, and rehearsal signals are strong', () => {
    const decision = buildExecutiveDecision({
      operationalMetrics: { summary: { releaseConfidence: 94 } },
      incidentCommand: { incidentScore: 12 },
      afterActionReview: { summary: { reviewScore: 91, actionCount: 0 } },
      playbookVariance: { summary: { rehearsalScore: 88 } }
    })

    expect(decision.decisionStatus).toBe('EXECUTIVE_READY')
    expect(decision.decisionTone).toBe('ready')
    expect(decision.decisionScore).toBeGreaterThanOrEqual(86)
  })

  it('aggregates department focus from metrics, incidents, lessons, and playbook variance', () => {
    const departments = buildExecutiveDepartments({
      operationalMetrics: { departmentRisks: [{ departmentRole: 'engineering-lead', riskScore: 24, status: 'WATCH', driver: 'Blocked task' }] },
      incidentCommand: { incidentDepartments: [{ departmentRole: 'engineering-lead', score: 68, severity: 'HIGH', title: 'Technical blocker' }] },
      afterActionReview: { departmentLessons: [{ departmentRole: 'guest-services-lead', lessonScore: 74, recommendation: 'Tighten embarkation checkpoint.' }] },
      playbookVariance: { departments: [{ departmentRole: 'housekeeping-lead', varianceScore: 51, recommendation: 'Rehearse cabin sweep.' }] }
    })

    expect(departments[0]).toMatchObject({ departmentRole: 'engineering-lead', riskScore: 68 })
    expect(departments.map(row => row.departmentRole)).toEqual(expect.arrayContaining(['guest-services-lead', 'housekeeping-lead']))
  })

  it('returns reviewer-ready highlights and action plan for the selected operation', () => {
    const brief = buildTurnaroundExecutiveBrief({
      operation: { id: 'turnaround-1', title: 'Harmony turnaround', shipName: 'Harmony of the Seas', cruiseLineName: 'Royal Caribbean International' },
      releasePacket: { status: 'READY', summary: 'Release packet is ready.' },
      operationalTimeline: { summary: { totalEvents: 12 } },
      operationalMetrics: { summary: { releaseConfidence: 82 }, signals: [{ id: 'staffing', label: 'Staffing', status: 'WATCH', detail: 'One role requires coverage.' }] },
      incidentCommand: { incidentScore: 34, incidentSeverity: 'WATCH', commandActions: ['Review bridge before boarding.'], incidentSignals: [] },
      afterActionReview: { summary: { reviewScore: 78, actionCount: 1, reviewStatus: 'FOLLOW_UP' }, findings: [], followUpActions: ['Assign debrief owner.'], departmentLessons: [] },
      playbookVariance: { summary: { rehearsalScore: 76 }, status: 'WATCH', rehearsalActions: ['Run one more rehearsal.'], departments: [] }
    })

    expect(brief.summary.operationId).toBe('turnaround-1')
    expect(brief.summary.timelineEvents).toBe(12)
    expect(brief.highlights).toHaveLength(4)
    expect(brief.executiveActions.join(' ')).toContain('After-action')
  })
})
