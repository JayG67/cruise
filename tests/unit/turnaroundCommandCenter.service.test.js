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

describe('turnaroundCommandCenter staffing evidence hardening', () => {
  it('preserves authoritative zero staffing values instead of falling back to legacy nonzero counts', () => {
    const inputs = buildTurnaroundCommandInputs({
      staffing: [{
        departmentRole: 'ENGINEERING_LEAD',
        plannedCount: 0,
        requiredCount: 10,
        checkedInCount: 0,
        assignedCount: 8
      }]
    })

    expect(inputs.staffingGaps).toEqual([])

    const board = buildDepartmentCommandBoard({
      tasks: [],
      staffing: [{ departmentRole: 'ENGINEERING_LEAD', plannedCount: 0, requiredCount: 10, checkedInCount: 0, assignedCount: 8 }],
      signoffs: [],
      escalations: [],
      handoffs: []
    })

    expect(board[0].staffingCoverage).toBe(0)
  })

  it('normalizes malformed and negative staffing and passenger counts instead of emitting non-finite command evidence', () => {
    const inputs = buildTurnaroundCommandInputs({
      passengerCount: 'not-a-number',
      staffing: [
        { departmentRole: 'HOUSEKEEPING_LEAD', plannedCount: 'bad', checkedInCount: Infinity },
        { departmentRole: 'ENGINEERING_LEAD', plannedCount: 4.8, checkedInCount: -1 }
      ]
    })

    expect(inputs.passengerCount).toBe(0)
    expect(inputs.staffingGaps).toEqual([
      expect.objectContaining({ departmentRole: 'ENGINEERING_LEAD' })
    ])

    const queue = buildCommandDecisionQueue({
      blockedTasks: [], criticalEscalations: [], activeDependencies: [], blockedSignoffs: [],
      staffingGaps: inputs.staffingGaps
    })
    expect(queue[0].action).toContain('0/4 people')
    expect(JSON.stringify({ inputs, queue })).not.toMatch(/NaN|Infinity/)
  })

  it('uses legacy staffing fields only when modern counts are absent', () => {
    const inputs = buildTurnaroundCommandInputs({
      staffing: [{ departmentRole: 'SECURITY_LEAD', requiredCount: 5, assignedCount: 3 }]
    })
    expect(inputs.staffingGaps).toHaveLength(1)

    const board = buildDepartmentCommandBoard({
      tasks: [],
      staffing: [{ departmentRole: 'SECURITY_LEAD', requiredCount: 5, assignedCount: 3 }],
      signoffs: [], escalations: [], handoffs: []
    })
    expect(board[0].staffingCoverage).toBe(60)
  })
})

describe('turnaroundCommandCenter normalized command evidence', () => {
  it('fails non-finite command scores safe and normalizes padded operational statuses', () => {
    const inputs = buildTurnaroundCommandInputs({
      operation: { id: 'op-830' },
      tasks: [
        { status: ' complete ' },
        { status: ' at_risk ', blockerReason: '' }
      ],
      signoffs: [{ status: ' approved ' }, { status: ' blocked ' }],
      escalations: [
        { status: ' resolved ', severity: ' critical ' },
        { status: ' open ', severity: ' critical ' }
      ],
      dependencies: [{ status: ' cleared ' }, { status: ' blocked ' }],
      handoffs: [{ status: ' completed ' }],
      operationalMetrics: { summary: { staffingCoverage: Infinity, releaseConfidence: NaN } },
      lifecycleState: { completionPercent: Infinity },
      incidentCommand: { incidentScore: Infinity },
      managementStatus: { maturityScore: Infinity },
      closeoutPacket: { closeoutScore: Infinity }
    })

    expect(inputs).toMatchObject({
      completeTasks: 1,
      approvedSignoffs: 1,
      completedHandoffs: 1,
      staffingCoverage: 0,
      lifecycleScore: 0,
      releaseScore: 0,
      riskScore: 0,
      maturityScore: 0,
      closeoutScore: 0
    })
    expect(inputs.blockedTasks).toHaveLength(1)
    expect(inputs.activeDependencies).toHaveLength(1)
    expect(inputs.openEscalations).toHaveLength(1)
    expect(inputs.criticalEscalations).toHaveLength(1)
  })

  it('fails malformed percentage inputs safe instead of manufacturing perfect readiness', () => {
    const inputs = buildTurnaroundCommandInputs({
      tasks: 'bad',
      staffing: {},
      signoffs: null,
      dependencies: 'bad',
      handoffs: {},
      auditEvents: 'bad',
      passengerCount: Infinity
    })

    expect(inputs).toMatchObject({
      totalTasks: 0,
      taskCompletion: 0,
      handoffCompletion: 0,
      signoffCompletion: 0,
      passengerCount: 0
    })
    expect(buildCommandCenterKpis(inputs).find(kpi => kpi.id === 'dependency-gates')).toMatchObject({ score: 100, value: '0/0' })
  })

  it('covers command-center defaults and active critical-path states', () => {
    const center = buildTurnaroundCommandCenter({
      operation: {},
      tasks: [{ taskName: 'Unowned task', status: 'BLOCKED' }],
      dependencies: [{ taskName: 'Dependent task', status: 'BLOCKED' }],
      staffing: [{ role: 'Guest Services', plannedCount: 2, checkedInCount: 1 }],
      signoffs: [{ role: 'Guest Services', status: 'BLOCKED' }],
      escalations: [{ severity: 'CRITICAL', status: 'OPEN', title: 'Critical issue' }]
    })

    expect(center.commandStatus).toBe('ACTIVE_COMMAND')
    expect(center.decisionQueue.map(item => item.severity)).toEqual(expect.arrayContaining(['HIGH', 'CRITICAL', 'MEDIUM']))
    expect(center.criticalPath[0]).toMatchObject({ status: 'BLOCKED', score: 0 })
    expect(center.escalationProtocol.status).toBe('EXECUTIVE_ATTENTION')
  })
})
