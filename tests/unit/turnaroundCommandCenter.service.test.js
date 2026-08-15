const {
  buildTurnaroundCommandCenter,
  buildTurnaroundCommandInputs,
  buildCommandCenterKpis,
  buildCommandDecisionQueue,
  buildDepartmentCommandBoard,
  buildCommandCriticalPath
} = require('../../services/turnaroundCommandCenter.service')

describe('turnaroundCommandCenter service', () => {
  const baseOperation = {
    id: 'turnaround-command-1',
    title: 'Wonder turnaround command',
    shipName: 'Wonder of the Seas',
    cruiseLineName: 'Royal Caribbean International',
    turnaroundDate: '2026-07-01'
  }

  it('builds a manager command center across KPIs, decisions, critical path, departments, and handoffs', () => {
    const commandCenter = buildTurnaroundCommandCenter({
      operation: baseOperation,
      passengerCount: 6200,
      tasks: [
        { id: 'task-1', departmentRole: 'HOUSEKEEPING_LEAD', taskName: 'Cabin reset', status: 'COMPLETE' },
        { id: 'task-2', departmentRole: 'ENGINEERING_LEAD', taskName: 'Shore power transfer', status: 'BLOCKED', blockerReason: 'Waiting on terminal power confirmation.' },
        { id: 'task-3', departmentRole: 'GUEST_SERVICES_LEAD', taskName: 'Embarkation queue setup', status: 'IN_PROGRESS' }
      ],
      staffing: [
        { departmentRole: 'HOUSEKEEPING_LEAD', plannedCount: 42, checkedInCount: 42 },
        { departmentRole: 'ENGINEERING_LEAD', plannedCount: 8, checkedInCount: 6 }
      ],
      signoffs: [
        { departmentRole: 'HOUSEKEEPING_LEAD', status: 'APPROVED' },
        { departmentRole: 'ENGINEERING_LEAD', status: 'BLOCKED', notes: 'Power transfer proof pending.' }
      ],
      escalations: [{ id: 'esc-1', departmentRole: 'ENGINEERING_LEAD', severity: 'CRITICAL', status: 'OPEN', title: 'Shore power delay' }],
      dependencies: [{ id: 'dep-1', taskName: 'Embarkation queue setup', dependsOnTaskName: 'Shore power transfer', status: 'BLOCKED' }],
      handoffs: [{ id: 'handoff-1', departmentRole: 'HOUSEKEEPING_LEAD', ownerDisplayName: 'Avery Ops', dueTime: '11:15', status: 'PENDING', notes: 'Release decks 8-12.' }],
      auditEvents: [{ id: 'audit-1' }],
      lifecycleState: { completionPercent: 66 },
      releasePacket: { releaseScore: 74 },
      operationalMetrics: { summary: { staffingCoverage: 88, riskIndex: 32 } },
      incidentCommand: { incidentScore: 48 },
      managementStatus: { maturityScore: 79 },
      closeoutPacket: { closeoutScore: 71 }
    })

    expect(commandCenter.commandStatus).toBe('ACTIVE_COMMAND')
    expect(commandCenter.kpis.map(kpi => kpi.id)).toEqual(expect.arrayContaining([
      'task-execution',
      'staffing-coverage',
      'readiness-signoffs',
      'dependency-gates',
      'escalation-risk',
      'closeout-readiness'
    ]))
    expect(commandCenter.decisionQueue[0]).toEqual(expect.objectContaining({ severity: 'CRITICAL' }))
    expect(commandCenter.criticalPath.map(phase => phase.id)).toEqual(expect.arrayContaining([
      'command-setup',
      'department-execution',
      'coverage-and-gates',
      'handoff-release',
      'readiness-approval',
      'management-closeout'
    ]))
    expect(commandCenter.departmentBoard).toEqual(expect.arrayContaining([
      expect.objectContaining({ departmentRole: 'ENGINEERING_LEAD', status: 'COMMAND_REVIEW' })
    ]))
    expect(commandCenter.handoffTimeline).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'handoff-1', owner: 'Avery Ops' })
    ]))
    expect(commandCenter.commanderBrief.presentationLine).toContain('single operational command workflow')
    expect(commandCenter.commanderBrief.presentationLine).toContain('accountable decisions')
    const visibleCommandCenterText = JSON.stringify(commandCenter).toLowerCase()
    expect(visibleCommandCenterText).not.toContain('reviewer')
    expect(visibleCommandCenterText).not.toContain('demo')
    expect(visibleCommandCenterText).not.toContain('employer')
    expect(commandCenter.kpis.find(kpi => kpi.id === 'closeout-readiness')?.detail).toContain('governance decisions')
  })

  it('returns an info decision when no command blockers are visible', () => {
    const queue = buildCommandDecisionQueue({
      blockedTasks: [],
      criticalEscalations: [],
      activeDependencies: [],
      staffingGaps: [],
      blockedSignoffs: []
    })

    expect(queue).toEqual([
      expect.objectContaining({ id: 'hold-command-cadence', severity: 'INFO' })
    ])
  })

  it('sorts department command board by readiness so weakest departments appear first', () => {
    const board = buildDepartmentCommandBoard({
      tasks: [
        { departmentRole: 'HOUSEKEEPING_LEAD', status: 'COMPLETE' },
        { departmentRole: 'ENGINEERING_LEAD', status: 'BLOCKED', blockerReason: 'Fuel window blocked.' }
      ],
      staffing: [
        { departmentRole: 'HOUSEKEEPING_LEAD', plannedCount: 4, checkedInCount: 4 },
        { departmentRole: 'ENGINEERING_LEAD', plannedCount: 4, checkedInCount: 1 }
      ],
      signoffs: [
        { departmentRole: 'HOUSEKEEPING_LEAD', status: 'APPROVED' },
        { departmentRole: 'ENGINEERING_LEAD', status: 'PENDING' }
      ],
      escalations: [{ departmentRole: 'ENGINEERING_LEAD', status: 'OPEN' }],
      handoffs: []
    })

    expect(board[0].departmentRole).toBe('ENGINEERING_LEAD')
    expect(board[0].nextAction).toContain('Clear task blockers')
  })

  it('builds a critical path from setup to closeout using stable phase ids', () => {
    const phases = buildCommandCriticalPath({
      operationId: 'turnaround-1',
      cruiseLineName: 'Celebrity Cruises',
      shipName: 'Celebrity Beyond',
      turnaroundDate: '2026-07-09',
      taskCompletion: 100,
      staffingCoverage: 100,
      dependencies: [{ status: 'CLEARED' }],
      activeDependencies: [],
      handoffCompletion: 100,
      completedHandoffs: 2,
      handoffs: [{}, {}],
      signoffCompletion: 100,
      approvedSignoffs: 3,
      signoffs: [{}, {}, {}],
      closeoutScore: 94
    })

    expect(phases.every(phase => phase.status === 'READY')).toBe(true)
    expect(phases[phases.length - 1]).toEqual(expect.objectContaining({ id: 'management-closeout' }))
  })

  it('preserves authoritative zero scores instead of substituting healthier fallback evidence', () => {
    const inputs = buildTurnaroundCommandInputs({
      operation: {
        ...baseOperation,
        passengerCount: 6200,
        staffingSummary: { checkInPercent: 94 }
      },
      passengerCount: 0,
      lifecycleState: { completionPercent: 88 },
      releasePacket: { releaseScore: 0, readinessScore: 91 },
      operationalMetrics: { summary: { staffingCoverage: 0, releaseConfidence: 93, riskIndex: 47 } },
      incidentCommand: { incidentScore: 0 },
      managementStatus: { maturityScore: 86 },
      closeoutPacket: { closeoutScore: 0 }
    })

    expect(inputs.passengerCount).toBe(0)
    expect(inputs.staffingCoverage).toBe(0)
    expect(inputs.releaseScore).toBe(0)
    expect(inputs.riskScore).toBe(0)
    expect(inputs.closeoutScore).toBe(0)

    const closeoutKpi = buildCommandCenterKpis(inputs).find(kpi => kpi.id === 'closeout-readiness')
    expect(closeoutKpi).toMatchObject({ value: '0%', score: 0 })

    const commandCenter = buildTurnaroundCommandCenter({
      operation: baseOperation,
      lifecycleState: { completionPercent: 88 },
      releasePacket: { releaseScore: 0, readinessScore: 91 },
      operationalMetrics: { summary: { staffingCoverage: 0, releaseConfidence: 93, riskIndex: 47 } },
      incidentCommand: { incidentScore: 0 },
      managementStatus: { maturityScore: 86 },
      closeoutPacket: { closeoutScore: 0 }
    })

    expect(commandCenter.commanderBrief.headline).toContain('is 0% release-oriented')
    expect(commandCenter.kpis.find(kpi => kpi.id === 'closeout-readiness')).toMatchObject({ value: '0%', score: 0 })
  })

  it('falls back only when authoritative command scores are absent', () => {
    const inputs = buildTurnaroundCommandInputs({
      operation: {
        ...baseOperation,
        passengerCount: 6100,
        staffingSummary: { checkInPercent: 83 }
      },
      operationalMetrics: { summary: { releaseConfidence: 77, riskIndex: 21 } },
      managementStatus: { maturityScore: 72 }
    })

    expect(inputs.passengerCount).toBe(6100)
    expect(inputs.staffingCoverage).toBe(83)
    expect(inputs.releaseScore).toBe(77)
    expect(inputs.riskScore).toBe(21)
    expect(inputs.closeoutScore).toBe(0)
  })


  it('reports watch and closeout-ready command states at the configured thresholds', () => {
    const watch = buildTurnaroundCommandCenter({
      operation: baseOperation,
      tasks: [{ status: 'COMPLETE' }],
      staffing: [{ plannedCount: 1, checkedInCount: 1 }],
      signoffs: [{ status: 'APPROVED' }],
      dependencies: [],
      handoffs: [{ status: 'COMPLETE' }],
      lifecycleState: { completionPercent: 82 },
      releasePacket: { releaseScore: 82 },
      operationalMetrics: { summary: { staffingCoverage: 82, riskIndex: 10 } },
      managementStatus: { maturityScore: 82 },
      closeoutPacket: { closeoutScore: 82 }
    })
    expect(watch.commandStatus).toBe('COMMAND_WATCH')
    expect(watch.escalationProtocol.status).toBe('STABLE')

    const ready = buildTurnaroundCommandCenter({
      operation: baseOperation,
      tasks: [{ status: 'COMPLETE' }],
      staffing: [{ plannedCount: 1, checkedInCount: 1 }],
      signoffs: [{ status: 'APPROVED' }],
      dependencies: [],
      handoffs: [{ status: 'COMPLETE' }],
      lifecycleState: { completionPercent: 100 },
      releasePacket: { releaseScore: 100 },
      operationalMetrics: { summary: { staffingCoverage: 100, riskIndex: 0 } },
      closeoutPacket: { closeoutScore: 100 }
    })
    expect(ready.commandStatus).toBe('READY_FOR_CLOSEOUT')
  })

  it('prioritizes critical, high, and medium decisions and caps the visible queue', () => {
    const queue = buildCommandDecisionQueue({
      blockedTasks: Array.from({ length: 5 }, (_, index) => ({ id: `task-${index}`, status: index === 0 ? 'BLOCKED' : 'AT_RISK', taskName: `Task ${index}` })),
      criticalEscalations: Array.from({ length: 4 }, (_, index) => ({ id: `esc-${index}`, title: `Escalation ${index}` })),
      activeDependencies: Array.from({ length: 5 }, (_, index) => ({ id: `dep-${index}`, status: index === 0 ? 'BLOCKED' : 'OPEN', taskName: `Dependency ${index}` })),
      staffingGaps: Array.from({ length: 4 }, (_, index) => ({ departmentRole: `TEAM_${index}`, plannedCount: 4, checkedInCount: 2 })),
      blockedSignoffs: Array.from({ length: 4 }, (_, index) => ({ departmentRole: `SIGNOFF_${index}` }))
    })

    expect(queue).toHaveLength(10)
    expect(queue.slice(0, 3).every(item => item.severity === 'CRITICAL')).toBe(true)
    expect(queue.findIndex(item => item.severity === 'MEDIUM')).toBeGreaterThan(queue.findIndex(item => item.severity === 'HIGH'))
  })

  it('uses department escalation and signoff states to choose the next command action', () => {
    const board = buildDepartmentCommandBoard({
      tasks: [{ departmentRole: 'GUEST_SERVICES_LEAD', status: 'COMPLETE' }],
      staffing: [{ departmentRole: 'GUEST_SERVICES_LEAD', plannedCount: 3, checkedInCount: 3 }],
      signoffs: [{ departmentRole: 'GUEST_SERVICES_LEAD', status: 'PENDING' }],
      escalations: [{ departmentRole: 'GUEST_SERVICES_LEAD', status: 'OPEN' }],
      handoffs: []
    })

    expect(board[0].nextAction).toContain('Resolve or monitor open escalation')

    const signoffOnly = buildDepartmentCommandBoard({
      tasks: [{ departmentRole: 'HOUSEKEEPING_LEAD', status: 'COMPLETE' }],
      staffing: [{ departmentRole: 'HOUSEKEEPING_LEAD', plannedCount: 3, checkedInCount: 3 }],
      signoffs: [{ departmentRole: 'HOUSEKEEPING_LEAD', status: 'PENDING' }],
      escalations: [],
      handoffs: []
    })
    expect(signoffOnly[0].nextAction).toContain('Complete department readiness approval')
  })

})
