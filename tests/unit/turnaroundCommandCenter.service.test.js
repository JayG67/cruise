const {
  buildTurnaroundCommandCenter,
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
})
