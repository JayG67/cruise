const {
  buildTurnaroundAfterActionReview,
  buildDepartmentLessons,
  buildAfterActionFindings,
  buildFollowUpActions
} = require('../../services/turnaroundAfterAction.service')

describe('turnaroundAfterAction service', () => {
  it('prioritizes blocked tasks, escalations, staffing, dependencies, handoffs, completion, and stable baselines in department recommendations', () => {
    const lessons = buildDepartmentLessons({
      tasks: [
        { departmentRole: 'Blocked', status: 'BLOCKED' },
        { departmentRole: 'Escalation', status: 'COMPLETE' },
        { departmentRole: 'Staffing', status: 'COMPLETE' },
        { departmentRole: 'Dependency', status: 'COMPLETE' },
        { departmentRole: 'Handoff', status: 'COMPLETE' },
        { departmentRole: 'Sequence', status: 'OPEN' },
        { departmentRole: 'Stable', status: 'COMPLETE' }
      ],
      staffing: [
        { departmentRole: 'Staffing', plannedCount: 2, checkedInCount: 1 },
        { departmentRole: 'Stable', plannedCount: 1, checkedInCount: 1 }
      ],
      signoffs: [
        { departmentRole: 'Blocked', status: 'BLOCKED' },
        { departmentRole: 'Escalation', status: 'APPROVED' },
        { departmentRole: 'Staffing', status: 'APPROVED' },
        { departmentRole: 'Dependency', status: 'APPROVED' },
        { departmentRole: 'Handoff', status: 'APPROVED' },
        { departmentRole: 'Sequence', status: 'APPROVED' },
        { departmentRole: 'Stable', status: 'APPROVED' }
      ],
      escalations: [{ departmentRole: 'Escalation', status: 'OPEN' }],
      dependencies: [{ departmentRole: 'Dependency', status: 'ACTIVE' }],
      handoffs: [{ departmentRole: 'Handoff', status: 'OPEN' }]
    })

    const byRole = Object.fromEntries(lessons.map(row => [row.departmentRole, row]))
    expect(byRole.Blocked.recommendation).toMatch(/blocked task/)
    expect(byRole.Escalation.recommendation).toMatch(/escalation resolution/)
    expect(byRole.Staffing.recommendation).toMatch(/staffing baseline/)
    expect(byRole.Dependency.recommendation).toMatch(/dependency confirmation/)
    expect(byRole.Handoff.recommendation).toMatch(/handoff timing/)
    expect(byRole.Sequence.recommendation).toMatch(/task sequencing/)
    expect(byRole.Stable.recommendation).toMatch(/Baseline appears stable/)
  })

  it('builds strength, watch, and action findings from real operational exceptions', () => {
    const findings = buildAfterActionFindings({
      tasks: [{ status: 'BLOCKED' }],
      staffing: [{ plannedCount: 3, checkedInCount: 2 }],
      signoffs: [{ status: 'BLOCKED' }],
      escalations: [{ status: 'OPEN', severity: 'CRITICAL' }, { status: 'RESOLVED', severity: 'CRITICAL' }],
      dependencies: [{ status: 'ACTIVE' }, { status: 'CLEARED' }],
      handoffs: [{ status: 'OPEN' }, { status: 'COMPLETE' }],
      operationalMetrics: { summary: { releaseConfidence: 90 } },
      playbookVariance: { summary: { rehearsalScore: 88 } },
      incidentCommand: { incidentScore: 20 }
    })

    expect(findings.find(item => item.id === 'release-confidence-review').status).toBe('STRENGTH')
    expect(findings.find(item => item.id === 'blocked-task-review')).toEqual(expect.objectContaining({ status: 'ACTION' }))
    expect(findings.find(item => item.id === 'escalation-review')).toEqual(expect.objectContaining({ status: 'ACTION' }))
    expect(findings.find(item => item.id === 'staffing-baseline-review')).toEqual(expect.objectContaining({ status: 'WATCH' }))
    expect(findings.find(item => item.id === 'release-gate-review').detail).toContain('1 active dependencies')
    expect(findings.find(item => item.id === 'playbook-rehearsal-review').status).toBe('STRENGTH')
  })

  it('covers release confidence and rehearsal watch thresholds', () => {
    const findings = buildAfterActionFindings({
      operationalMetrics: { summary: { releaseConfidence: 70 } },
      playbookVariance: { summary: { rehearsalScore: 75 } },
      incidentCommand: { incidentScore: 60 }
    })

    expect(findings).toEqual([
      expect.objectContaining({ id: 'release-confidence-review', status: 'WATCH' }),
      expect.objectContaining({ id: 'playbook-rehearsal-review', status: 'WATCH' })
    ])
  })

  it('handles explicit null collections without throwing', () => {
    expect(buildAfterActionFindings({ tasks: null, staffing: null, signoffs: null, escalations: null, dependencies: null, handoffs: null })).toHaveLength(2)
  })

  it('builds follow-up actions for blockers, escalations, department lessons, playbook promotion, and commander guidance', () => {
    const actions = buildFollowUpActions({
      departmentLessons: [
        { departmentRole: 'Engineering', lessonScore: 80 },
        { departmentRole: 'Guest Services', lessonScore: 20 },
        { departmentRole: 'Stable', lessonScore: 0 }
      ],
      findings: [{ id: 'blocked-task-review' }, { id: 'escalation-review' }],
      playbookTemplate: { summary: { templateReadinessScore: 85 } },
      incidentCommand: { commandActions: ['Close technical blocker'] }
    })

    expect(actions).toEqual([
      'Document root cause and unblock criteria for every blocked task before the next sailing-day rehearsal.',
      'Convert unresolved escalations into accountable follow-up tasks with owners and due times.',
      'Run department debrief for Engineering, Guest Services.',
      'Promote stable task timing, staffing targets, and handoff gates into the reusable turnaround playbook draft.',
      'Commander follow-up: Close technical blocker'
    ])
  })

  it('keeps an operation in rehearsal when the playbook is below the promotion threshold', () => {
    expect(buildFollowUpActions({ playbookTemplate: { summary: { templateReadinessScore: 79 } } })).toEqual([
      'Keep this operation in rehearsal status until playbook readiness reaches the promotion threshold.'
    ])
  })

  it('preserves an authoritative zero timeline event count instead of replacing it with audit-event count', () => {
    const review = buildTurnaroundAfterActionReview({
      operation: { id: 'op-zero-events' },
      auditEvents: [{ id: 'audit-1' }, { id: 'audit-2' }],
      operationalTimeline: { summary: { totalEvents: 0 } },
      operationalMetrics: { summary: { releaseConfidence: 90 } },
      playbookVariance: { summary: { rehearsalScore: 90 } },
      incidentCommand: { incidentScore: 10 }
    })

    expect(review.summary.timelineEvents).toBe(0)
    expect(review.summary.reviewScore).toBe(90)
  })

  it('falls back to audit event count only when timeline count is absent', () => {
    const review = buildTurnaroundAfterActionReview({
      auditEvents: [{ id: 'audit-1' }, { id: 'audit-2' }],
      operationalTimeline: { summary: {} }
    })
    expect(review.summary.timelineEvents).toBe(2)
  })

  it('handles a null operation and null audit collection safely', () => {
    const review = buildTurnaroundAfterActionReview({ operation: null, auditEvents: null })
    expect(review.operationId).toBeNull()
    expect(review.summary.timelineEvents).toBe(0)
  })

  it('selects NEEDS_DEBRIEF, FOLLOW_UP, and READY_TO_PROMOTE review states', () => {
    const debrief = buildTurnaroundAfterActionReview({
      tasks: [{ status: 'BLOCKED' }],
      escalations: [{ status: 'OPEN', severity: 'CRITICAL' }]
    })
    expect(debrief.summary.reviewStatus).toBe('NEEDS_DEBRIEF')

    const followUp = buildTurnaroundAfterActionReview({
      staffing: [{ plannedCount: 2, checkedInCount: 1 }],
      dependencies: [{ status: 'ACTIVE' }],
      operationalMetrics: { summary: { releaseConfidence: 70 } },
      playbookVariance: { summary: { rehearsalScore: 75 } },
      incidentCommand: { incidentScore: 60 }
    })
    expect(followUp.summary.reviewStatus).toBe('FOLLOW_UP')

    const promote = buildTurnaroundAfterActionReview({
      operationalMetrics: { summary: { releaseConfidence: 95 } },
      playbookVariance: { summary: { rehearsalScore: 95 } },
      incidentCommand: { incidentScore: 0 }
    })
    expect(promote.summary.reviewStatus).toBe('READY_TO_PROMOTE')
    expect(promote.summary.topLessonDepartment).toBe('None')
  })
})
