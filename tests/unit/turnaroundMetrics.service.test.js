const {
  buildTurnaroundOperationalMetrics,
  getDepartmentMetrics,
  percent
} = require('../../services/turnaroundMetrics.service')

describe('turnaround operational metrics behavior', () => {
  it('clamps percentages and handles missing denominators safely', () => {
    expect(percent(1, 2)).toBe(50)
    expect(percent(8, 4)).toBe(100)
    expect(percent(-1, 4)).toBe(0)
    expect(percent(3, 0)).toBe(0)
    expect(percent(undefined, 4)).toBe(0)
  })

  it('builds department risk from tasks, staffing, signoffs, escalations, handoffs, and dependencies', () => {
    const rows = getDepartmentMetrics({
      tasks: [
        { departmentRole: 'Engineering', status: 'BLOCKED' },
        { departmentRole: 'Engineering', status: 'COMPLETE' },
        { departmentRole: '', status: 'OPEN' }
      ],
      staffing: [{ departmentRole: 'Engineering', plannedCount: 5, checkedInCount: 3 }],
      signoffs: [
        { departmentRole: 'Engineering', status: 'BLOCKED' },
        { departmentRole: 'Guest Services', status: 'APPROVED' }
      ],
      escalations: [
        { departmentRole: 'Engineering', status: 'OPEN', severity: 'CRITICAL' },
        { departmentRole: 'Engineering', status: 'RESOLVED', severity: 'CRITICAL' }
      ],
      handoffs: [{ departmentRole: 'Engineering', status: 'OPEN' }],
      dependencies: [{ departmentRole: 'Engineering', status: 'ACTIVE' }]
    })

    expect(rows[0]).toEqual(expect.objectContaining({
      departmentRole: 'Engineering',
      taskCount: 2,
      completeTaskCount: 1,
      blockedTaskCount: 1,
      staffingGap: 2,
      openEscalationCount: 1,
      criticalEscalationCount: 1,
      openHandoffCount: 1,
      activeDependencyCount: 1,
      signoffStatus: 'BLOCKED',
      taskCompletionPercent: 50
    }))
    expect(rows.find(row => row.departmentRole === 'Guest Services')).toEqual(expect.objectContaining({ signoffStatus: 'APPROVED' }))
    expect(rows.find(row => row.departmentRole === 'Unassigned')).toEqual(expect.objectContaining({ taskCount: 1 }))
  })

  it('uses an explicit zero timeline event count instead of replacing it with audit-event volume', () => {
    const metrics = buildTurnaroundOperationalMetrics({
      operation: { id: 'op-1' },
      operationalTimeline: { summary: { totalEvents: 0 } },
      auditEvents: [{ id: 'audit-1' }, { id: 'audit-2' }]
    })

    expect(metrics.summary.eventVelocity).toBe(0)
  })

  it('falls back to audit-event volume only when timeline event count is absent', () => {
    const metrics = buildTurnaroundOperationalMetrics({
      auditEvents: [{ id: 'audit-1' }, { id: 'audit-2' }, { id: 'audit-3' }],
      operationalTimeline: { summary: {} }
    })

    expect(metrics.summary.eventVelocity).toBe(3)
  })

  it('honors release readiness while calculating risk, confidence, counts, and signal states', () => {
    const metrics = buildTurnaroundOperationalMetrics({
      operation: { id: 'op-risk' },
      tasks: [
        { departmentRole: 'Engineering', status: 'BLOCKED' },
        { departmentRole: 'Engineering', status: 'COMPLETE' }
      ],
      staffing: [{ departmentRole: 'Engineering', plannedCount: 4, checkedInCount: 2 }],
      signoffs: [{ departmentRole: 'Engineering', status: 'BLOCKED' }],
      escalations: [{ departmentRole: 'Engineering', status: 'OPEN', severity: 'CRITICAL' }],
      dependencies: [{ departmentRole: 'Engineering', status: 'ACTIVE' }],
      handoffs: [{ departmentRole: 'Engineering', status: 'OPEN' }],
      releasePacket: { readinessScore: 90 },
      passengerCount: 2100
    })

    expect(metrics.summary).toEqual(expect.objectContaining({
      readinessScore: 90,
      riskIndex: 59,
      releaseConfidence: 58,
      taskCompletionPercent: 50,
      signoffApprovalPercent: 0,
      staffingCoveragePercent: 50,
      passengerCount: 2100,
      bottleneckDepartment: 'Engineering'
    }))
    // Risk weights: blocked task 12 + critical escalation 20 + open escalation 8
    // + active dependency 6 + open handoff 5 + staffing gap (2 * 4) = 59.
    // Release confidence: 90 - round(59 * 0.55) = 58.
    expect(metrics.summary.riskIndex).toBe(12 + 20 + 8 + 6 + 5 + 8)
    expect(metrics.summary.releaseConfidence).toBe(90 - Math.round(59 * 0.55))

    expect(metrics.counts).toEqual(expect.objectContaining({
      totalTasks: 2,
      completedTasks: 1,
      blockedTasks: 1,
      openEscalations: 1,
      criticalEscalations: 1,
      activeDependencies: 1,
      openHandoffs: 1,
      plannedStaff: 4,
      checkedInStaff: 2,
      staffingGap: 2
    }))
    expect(metrics.signals).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'release-confidence', status: 'ACTION' }),
      expect.objectContaining({ id: 'staffing-coverage', status: 'WATCH' }),
      expect.objectContaining({ id: 'risk-index', status: 'ACTION' }),
      expect.objectContaining({ id: 'department-bottleneck', status: 'WATCH' })
    ]))
  })

  it('produces PASS signals and calculated readiness for a clean operation', () => {
    const metrics = buildTurnaroundOperationalMetrics({
      tasks: [{ departmentRole: 'Guest Services', status: 'COMPLETE' }],
      staffing: [{ departmentRole: 'Guest Services', plannedCount: 2, checkedInCount: 2 }],
      signoffs: [{ departmentRole: 'Guest Services', status: 'APPROVED' }],
      escalations: [{ departmentRole: 'Guest Services', status: 'RESOLVED', severity: 'CRITICAL' }],
      dependencies: [{ departmentRole: 'Guest Services', status: 'CLEARED' }],
      handoffs: [{ departmentRole: 'Guest Services', status: 'COMPLETE' }]
    })

    expect(metrics.summary).toEqual(expect.objectContaining({
      readinessScore: 100,
      riskIndex: 0,
      releaseConfidence: 100,
      bottleneckDepartment: 'None'
    }))
    expect(metrics.signals.every(signal => signal.status === 'PASS')).toBe(true)
  })
})
