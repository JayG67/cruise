const {
  TURNAROUND_LIFECYCLE_PHASES,
  buildTurnaroundLifecycleState,
  buildDepartmentLifecycleRows,
  percent
} = require('../../services/turnaroundLifecycle.service')

describe('turnaroundLifecycle service', () => {
  it('builds an eight-phase lifecycle with blockers, departments, and next action language', () => {
    const lifecycle = buildTurnaroundLifecycleState({
      operation: { id: 'turnaround-1', sailingId: 'sailing-1', status: 'ACTIVE', commanderIntent: 'Release on time' },
      tasks: [
        { id: 'task-1', taskName: 'Cabin inspection', departmentRole: 'Housekeeping Lead', status: 'COMPLETE' },
        { id: 'task-2', taskName: 'Gangway alignment', departmentRole: 'Engineering Lead', status: 'BLOCKED', blocker: 'Awaiting port authority' },
        { id: 'task-3', taskName: 'Provisioning count', departmentRole: 'Food & Beverage Lead', status: 'IN_PROGRESS' }
      ],
      staffing: [
        { departmentRole: 'Housekeeping Lead', plannedCount: 8, checkedInCount: 8 },
        { departmentRole: 'Food & Beverage Lead', plannedCount: 6, checkedInCount: 4 }
      ],
      signoffs: [
        { id: 'signoff-1', departmentRole: 'Housekeeping Lead', status: 'APPROVED' },
        { id: 'signoff-2', departmentRole: 'Engineering Lead', status: 'PENDING' }
      ],
      escalations: [{ id: 'esc-1', departmentRole: 'Engineering Lead', title: 'Gangway clearance', status: 'OPEN', severity: 'HIGH' }],
      dependencies: [{ id: 'dep-1', departmentRole: 'Engineering Lead', taskName: 'Gangway alignment', status: 'OPEN', dependsOnTaskName: 'Port authority inspection' }],
      handoffs: [{ id: 'handoff-1', departmentRole: 'Guest Services Lead', title: 'Terminal handoff', status: 'OPEN' }],
      releasePacket: { readinessScore: 54 },
      operationalMetrics: { summary: { releaseConfidence: 48 } }
    })

    expect(lifecycle.phases.map(phase => phase.id)).toEqual(TURNAROUND_LIFECYCLE_PHASES.map(phase => phase.id))
    expect(lifecycle.currentPhaseId).not.toBe('completed')
    expect(lifecycle.completed).toBe(false)
    expect(lifecycle.finalBlockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'Task blocker', label: 'Gangway alignment' }),
      expect.objectContaining({ type: 'Dependency', label: 'Gangway alignment' }),
      expect.objectContaining({ type: 'Escalation', label: 'Gangway clearance' }),
      expect.objectContaining({ type: 'Handoff', label: 'Terminal handoff' })
    ]))
    expect(lifecycle.summary.departmentsNotReady).toBeGreaterThan(0)
    expect(lifecycle.nextBestAction).toBeTruthy()
    expect(lifecycle.storyBeats.join(' ')).toContain('tasks complete')
  })

  it('marks the lifecycle completed when tasks, dependencies, handoffs, escalations, staffing, and signoffs are done', () => {
    const lifecycle = buildTurnaroundLifecycleState({
      operation: { id: 'turnaround-2', sailingId: 'sailing-2', status: 'COMPLETE', commanderIntent: 'Complete' },
      tasks: [
        { id: 'task-1', taskName: 'Cabins released', departmentRole: 'Housekeeping Lead', status: 'COMPLETE' },
        { id: 'task-2', taskName: 'Provisions loaded', departmentRole: 'Food & Beverage Lead', status: 'DONE' }
      ],
      staffing: [{ departmentRole: 'Housekeeping Lead', plannedCount: 4, checkedInCount: 4 }],
      signoffs: [
        { departmentRole: 'Housekeeping Lead', status: 'APPROVED' },
        { departmentRole: 'Food & Beverage Lead', status: 'APPROVED' }
      ],
      escalations: [{ departmentRole: 'Engineering Lead', status: 'RESOLVED' }],
      dependencies: [{ departmentRole: 'Food & Beverage Lead', status: 'CLEARED' }],
      handoffs: [{ departmentRole: 'Guest Services Lead', status: 'COMPLETE' }],
      operationalMetrics: { summary: { releaseConfidence: 96 } }
    })

    expect(lifecycle.completed).toBe(true)
    expect(lifecycle.status).toBe('COMPLETED')
    expect(lifecycle.currentPhaseId).toBe('completed')
    expect(lifecycle.completionPercent).toBe(100)
    expect(lifecycle.finalBlockers).toEqual([])
    expect(lifecycle.nextBestAction).toContain('verified reference')
    expect(lifecycle.nextBestAction).toContain('executive operational review')
    expect(lifecycle.nextBestAction).not.toMatch(/flagship|demo|reviewer/i)
  })

  it('summarizes department readiness without hiding open risks', () => {
    const rows = buildDepartmentLifecycleRows({
      tasks: [
        { departmentRole: 'Guest Services Lead', status: 'COMPLETE' },
        { departmentRole: 'Guest Services Lead', status: 'BLOCKED' }
      ],
      signoffs: [{ departmentRole: 'Guest Services Lead', status: 'PENDING' }],
      escalations: [{ departmentRole: 'Guest Services Lead', status: 'OPEN' }],
      dependencies: [{ departmentRole: 'Guest Services Lead', status: 'OPEN' }],
      handoffs: [{ departmentRole: 'Guest Services Lead', status: 'OPEN' }],
      staffing: [{ departmentRole: 'Guest Services Lead', plannedCount: 5, checkedInCount: 3 }]
    })

    expect(rows[0]).toEqual(expect.objectContaining({
      departmentRole: 'Guest Services Lead',
      ready: false,
      blockedTasks: 1,
      openEscalations: 1,
      openDependencies: 1,
      openHandoffs: 1,
      staffingGap: 2
    }))
  })

  it('keeps percent calculations bounded', () => {
    expect(percent(1, 2)).toBe(50)
    expect(percent(10, 0)).toBe(0)
  })
})

describe('turnaroundLifecycle resilience hardening', () => {
  it('preserves explicit zero release confidence instead of replacing it with a release-packet fallback', () => {
    const lifecycle = buildTurnaroundLifecycleState({
      operation: { id: 'turnaround-zero', status: 'ACTIVE' },
      tasks: [{ status: 'COMPLETE' }],
      signoffs: [{ status: 'APPROVED' }],
      operationalMetrics: { summary: { releaseConfidence: 0 } },
      releasePacket: { readinessScore: 95 }
    })

    expect(lifecycle.summary.releaseConfidence).toBe(0)
    expect(lifecycle.completed).toBe(false)
  })

  it('degrades safely when operation and operational collections are explicitly null', () => {
    const lifecycle = buildTurnaroundLifecycleState({
      operation: null,
      tasks: null,
      staffing: null,
      signoffs: null,
      escalations: null,
      dependencies: null,
      handoffs: null
    })

    expect(lifecycle.operationId).toBeNull()
    expect(lifecycle.summary.totalTasks).toBe(0)
    expect(lifecycle.summary.totalSignoffs).toBe(0)
    expect(lifecycle.completed).toBe(false)
    expect(lifecycle.phases).toHaveLength(TURNAROUND_LIFECYCLE_PHASES.length)
  })
})

describe('turnaroundLifecycle branch coverage', () => {
  it('uses the release-packet confidence only when operational confidence is absent', () => {
    const lifecycle = buildTurnaroundLifecycleState({
      operation: { id: 'fallback', commanderIntent: 'Release safely' },
      tasks: [{ status: 'COMPLETE' }],
      staffing: [{ plannedCount: 2, checkedInCount: 2 }],
      signoffs: [{ status: 'APPROVED' }],
      releasePacket: { readinessScore: 88 }
    })
    expect(lifecycle.summary.releaseConfidence).toBe(88)
  })

  it('keeps department ordering deterministic when risk scores tie', () => {
    const rows = buildDepartmentLifecycleRows({
      tasks: [
        { departmentRole: 'Zulu', status: 'COMPLETE' },
        { departmentRole: 'Alpha', status: 'COMPLETE' }
      ]
    })
    expect(rows.map(row => row.departmentRole)).toEqual(['Alpha', 'Zulu'])
    expect(rows.every(row => row.ready)).toBe(true)
  })
})

describe('turnaroundLifecycle numeric evidence hardening', () => {
  it('preserves explicit zero modern staffing values over stale legacy counts', () => {
    const rows = buildDepartmentLifecycleRows({
      staffing: [{ departmentRole: 'Hotel', plannedCount: 0, requiredCount: 7, checkedInCount: 0, assignedCount: 5 }]
    })

    expect(rows[0]).toEqual(expect.objectContaining({
      plannedStaff: 0,
      checkedInStaff: 0,
      staffingGap: 0,
      staffingPercent: 0
    }))
  })

  it('normalizes malformed staffing and release confidence instead of emitting non-finite lifecycle evidence', () => {
    const lifecycle = buildTurnaroundLifecycleState({
      operation: { id: 'malformed-lifecycle', status: 'ACTIVE' },
      tasks: [{ status: 'COMPLETE' }],
      staffing: [
        { departmentRole: 'Hotel', plannedCount: Infinity, checkedInCount: 'bad' },
        { departmentRole: 'Engineering', plannedCount: 4.9, checkedInCount: 2.8 },
        { departmentRole: 'Security', plannedCount: -5, checkedInCount: -2 }
      ],
      operationalMetrics: { summary: { releaseConfidence: Infinity } }
    })

    expect(lifecycle.summary).toEqual(expect.objectContaining({
      staffingGap: 2,
      staffingCoveragePercent: 50,
      releaseConfidence: 0
    }))
    expect(lifecycle.departmentReadiness.every(row => Number.isFinite(row.riskScore) && Number.isFinite(row.staffingGap))).toBe(true)
    expect(lifecycle.phases.every(phase => Number.isFinite(phase.percentComplete))).toBe(true)
  })
})
