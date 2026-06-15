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
    expect(lifecycle.nextBestAction).toContain('flagship')
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
