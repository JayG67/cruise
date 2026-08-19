const {
  buildTurnaroundExecutiveBrief,
  buildExecutiveDecision,
  buildExecutiveDepartments,
  buildExecutiveActions
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

it('preserves explicit zero evidence instead of inflating executive decision scores from fallbacks', () => {
  const decision = buildExecutiveDecision({
    operationalMetrics: { summary: { releaseConfidence: 0 } },
    releasePacket: { releaseScore: 96 },
    incidentCommand: { incidentScore: 0 },
    afterActionReview: { summary: { reviewScore: 0, actionCount: 0 } },
    playbookVariance: { summary: { rehearsalScore: 0 } }
  })

  expect(decision).toMatchObject({
    releaseConfidence: 0,
    incidentScore: 0,
    reviewScore: 0,
    rehearsalScore: 0,
    openActionCount: 0,
    decisionScore: 24,
    decisionStatus: 'NOT_READY',
    decisionTone: 'risk'
  })
})

it('uses release-packet confidence only when operational confidence is absent', () => {
  const decision = buildExecutiveDecision({
    operationalMetrics: { summary: {} },
    releasePacket: { releaseScore: 94 },
    incidentCommand: { incidentScore: 12 },
    afterActionReview: { summary: { reviewScore: 91, actionCount: 0 } },
    playbookVariance: { summary: { rehearsalScore: 88 } }
  })

  expect(decision.releaseConfidence).toBe(94)
  expect(decision.decisionStatus).toBe('EXECUTIVE_READY')
})

it('preserves zero department risk values when secondary score fields are higher', () => {
  const departments = buildExecutiveDepartments({
    operationalMetrics: {
      departmentRisks: [
        { departmentRole: 'engineering-lead', riskScore: 0, score: 90, status: 'READY', driver: 'No active risk' }
      ]
    },
    incidentCommand: {
      incidentDepartments: [
        { departmentRole: 'guest-services-lead', score: 0, riskScore: 75, severity: 'LOW', title: 'No incident exposure' }
      ]
    },
    playbookVariance: {
      departments: [
        { departmentRole: 'housekeeping-lead', varianceScore: 0, recommendation: 'Maintain baseline.' }
      ]
    }
  })

  expect(departments.find(row => row.departmentRole === 'engineering-lead').riskScore).toBe(0)
  expect(departments.find(row => row.departmentRole === 'guest-services-lead').riskScore).toBe(0)
  expect(departments.find(row => row.departmentRole === 'housekeeping-lead').riskScore).toBe(0)
})

it('covers watch and command-review decision thresholds and deduplicates executive actions', () => {
  const watchDecision = buildExecutiveDecision({
    operationalMetrics: { summary: { releaseConfidence: 76 } },
    incidentCommand: { incidentScore: 30 },
    afterActionReview: { summary: { reviewScore: 76, actionCount: 1 } },
    playbookVariance: { summary: { rehearsalScore: 76 } }
  })
  const reviewDecision = buildExecutiveDecision({
    operationalMetrics: { summary: { releaseConfidence: 70 } },
    incidentCommand: { incidentScore: 50 },
    afterActionReview: { summary: { reviewScore: 70, actionCount: 1 } },
    playbookVariance: { summary: { rehearsalScore: 70 } }
  })

  expect(watchDecision.decisionStatus).toBe('READY_WITH_WATCH_ITEMS')
  expect(watchDecision.decisionTone).toBe('watch')
  expect(reviewDecision.decisionStatus).toBe('NEEDS_COMMAND_REVIEW')
  expect(reviewDecision.decisionTone).toBe('review')
})

it('builds a safe executive brief from null operation context and empty evidence', () => {
  const brief = buildTurnaroundExecutiveBrief({ operation: null })

  expect(brief.summary).toMatchObject({
    operationId: undefined,
    operationTitle: undefined,
    shipName: undefined,
    cruiseLineName: undefined,
    timelineEvents: 0,
    decisionStatus: 'NOT_READY'
  })
  expect(brief.highlights[3].detail).toContain('this turnaround')
  expect(brief.departmentBriefs).toEqual([])
  expect(brief.executiveActions[0]).toContain('Hold executive promotion')
})

it('normalizes malformed executive evidence counts instead of returning NaN', () => {
  const decision = buildExecutiveDecision({
    operationalMetrics: { summary: { releaseConfidence: 90 } },
    incidentCommand: { incidentScore: 10 },
    afterActionReview: { summary: { reviewScore: 90, actionCount: 'not-a-number' } },
    playbookVariance: { summary: { rehearsalScore: 90 } }
  })
  const brief = buildTurnaroundExecutiveBrief({
    operationalTimeline: { summary: { totalEvents: 'invalid' } },
    afterActionReview: { summary: { actionCount: Infinity } }
  })

  expect(decision.openActionCount).toBe(0)
  expect(Number.isFinite(decision.openActionCount)).toBe(true)
  expect(brief.summary.timelineEvents).toBe(0)
  expect(Number.isFinite(brief.summary.timelineEvents)).toBe(true)
})

it('floors positive fractional evidence counts and rejects negative counts', () => {
  const fractional = buildExecutiveDecision({ afterActionReview: { summary: { actionCount: 2.9 } } })
  const negative = buildExecutiveDecision({ afterActionReview: { summary: { actionCount: -4 } } })

  expect(fractional.openActionCount).toBe(2)
  expect(negative.openActionCount).toBe(0)
})

it('normalizes malformed department lesson and variance evidence before returning executive artifacts', () => {
  const departments = buildExecutiveDepartments({
    afterActionReview: {
      departmentLessons: [{ departmentRole: 'guest-services-lead', lessonScore: Infinity, recommendation: 'Review flow.' }]
    },
    playbookVariance: {
      departments: [{ departmentRole: 'housekeeping-lead', varianceScore: 'not-a-number', recommendation: 'Rehearse.' }]
    }
  })

  expect(departments.find(row => row.departmentRole === 'guest-services-lead').lessonScore).toBe(0)
  expect(departments.find(row => row.departmentRole === 'housekeeping-lead').varianceScore).toBe(0)
  expect(JSON.stringify(departments)).not.toContain('null')
  expect(departments.every(row => Number.isFinite(row.riskScore))).toBe(true)
})

it('fails non-finite executive scores safe instead of promoting malformed evidence to 100 percent', () => {
  const decision = buildExecutiveDecision({
    operationalMetrics: { summary: { releaseConfidence: Infinity } },
    incidentCommand: { incidentScore: -Infinity },
    afterActionReview: { summary: { reviewScore: NaN, actionCount: 0 } },
    playbookVariance: { summary: { rehearsalScore: Infinity } }
  })

  expect(decision).toMatchObject({ releaseConfidence: 0, incidentScore: 0, reviewScore: 0, rehearsalScore: 0 })
  expect(decision.decisionStatus).toBe('NOT_READY')
})

it('degrades malformed executive collections instead of throwing during brief composition', () => {
  const brief = buildTurnaroundExecutiveBrief({
    operationalMetrics: { summary: { releaseConfidence: 80 }, signals: { bad: true }, departmentRisks: { bad: true } },
    incidentCommand: { incidentScore: 20, commandActions: 'not-an-array', incidentDepartments: { bad: true } },
    afterActionReview: { summary: { reviewScore: 80 }, followUpActions: {}, departmentLessons: 'bad' },
    playbookVariance: { summary: { rehearsalScore: 80 }, rehearsalActions: 12, departments: { bad: true } }
  })

  expect(brief.departmentBriefs).toEqual([])
  expect(brief.executiveActions).toHaveLength(1)
  expect(brief.executiveActions[0]).toContain('Publish with watch items')
})

it('caps department evidence to the five highest-risk executive rows', () => {
  const departments = buildExecutiveDepartments({
    operationalMetrics: {
      departmentRisks: Array.from({ length: 7 }, (_, index) => ({
        departmentRole: `department-${index}`,
        riskScore: index * 10,
        status: 'WATCH'
      }))
    }
  })

  expect(departments).toHaveLength(5)
  expect(departments[0].riskScore).toBe(60)
  expect(departments.at(-1).riskScore).toBe(20)
})


it('treats lowercase metric watch statuses as actionable executive evidence', () => {
  const brief = buildTurnaroundExecutiveBrief({
    operationalMetrics: {
      summary: { releaseConfidence: 82, releaseStatus: 'WATCH' },
      signals: [{ status: ' watch ', label: 'Staffing', detail: 'One staffing watch item remains.' }]
    },
    incidentCommand: { incidentScore: 10 },
    afterActionReview: { summary: { reviewScore: 85, actionCount: 0 } },
    playbookVariance: { summary: { rehearsalScore: 85 } }
  })

  expect(brief.highlights[0].detail).toBe('One staffing watch item remains.')
  expect(brief.executiveActions).toContain('Metric watch: Staffing - One staffing watch item remains.')
})

it('does not publish object values or string-index artifacts from malformed narrative collections', () => {
  const brief = buildTurnaroundExecutiveBrief({
    operation: { title: 'Safe narrative' },
    releasePacket: { summary: { malformed: true } },
    operationalMetrics: { summary: { releaseConfidence: 80 }, signals: [] },
    incidentCommand: { incidentScore: 10, incidentSignals: 'not-an-array', commandActions: 'BAD' },
    afterActionReview: { summary: { reviewScore: 80, actionCount: 0 }, findings: { bad: true } },
    playbookTemplate: { recommendations: 'BAD' },
    playbookVariance: { summary: { rehearsalScore: 80 }, rehearsalActions: 'BAD' }
  })

  expect(brief.highlights[0].detail).toBe('Release confidence 80%.')
  expect(brief.highlights[1].detail).toBe('No critical exception bridge is required for the current operation.')
  expect(brief.highlights[2].detail).toBe('Compare final variance before promoting this operation as a reusable baseline.')
  expect(brief.highlights.every(highlight => typeof highlight.detail === 'string')).toBe(true)
})


it('drops malformed executive action values instead of stringifying objects into leadership evidence', () => {
  const actions = buildExecutiveActions({
    decision: { decisionStatus: 'NOT_READY' },
    incidentCommand: { commandActions: [{ bad: true }, '  Review bridge staffing.  '] },
    afterActionReview: { followUpActions: [null, { action: 'bad' }, 42] },
    playbookVariance: { rehearsalActions: [undefined, 'Run rehearsal.'] },
    operationalMetrics: {
      signals: [
        { status: 'WATCH', label: { bad: true }, detail: { bad: true } },
        { status: 'ACTION', label: 'Crew flow', detail: 'Reassign one checkpoint.' },
        { status: 'WATCH', label: '', detail: 'Monitor gangway queue.' }
      ]
    }
  })

  expect(actions).toEqual(expect.arrayContaining([
    'Exception bridge: Review bridge staffing.',
    'After-action: 42',
    'Playbook: Run rehearsal.',
    'Metric watch: Crew flow - Reassign one checkpoint.',
    'Metric watch: Operational signal - Monitor gangway queue.'
  ]))
  expect(actions.join(' ')).not.toContain('[object Object]')
})

it('covers executive action guidance for ready and watch decisions', () => {
  expect(buildExecutiveActions({ decision: { decisionStatus: 'EXECUTIVE_READY' } })[0]).toContain('Publish the executive turnaround brief')
  expect(buildExecutiveActions({ decision: { decisionStatus: 'READY_WITH_WATCH_ITEMS' } })[0]).toContain('Publish with watch items')
})
