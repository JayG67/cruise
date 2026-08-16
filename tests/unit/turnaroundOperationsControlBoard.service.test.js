const {
  buildBoardSummary,
  buildControlActions,
  buildControlLanes,
  buildTurnaroundOperationsControlBoard
} = require('../../services/turnaroundOperationsControlBoard.service')

describe('turnaroundOperationsControlBoard.service', () => {
  it('builds a unified go/no-go summary from operations command signals', () => {
    const board = buildTurnaroundOperationsControlBoard({
      tasks: [
        { id: 'task-1', status: 'COMPLETE', title: 'Cabin release' },
        { id: 'task-2', status: 'BLOCKED', title: 'Provisioning dock', ownerName: 'F&B Lead', blockerReason: 'Vendor late' }
      ],
      staffing: [{ departmentRole: 'housekeeping-lead', plannedCount: 10, checkedInCount: 8 }],
      signoffs: [{ departmentRole: 'engineering-lead', status: 'PENDING' }],
      escalations: [{ id: 'esc-1', status: 'OPEN', severity: 'CRITICAL', ownerName: 'Ops Lead', title: 'Gangway issue' }],
      dependencies: [{ id: 'dep-1', status: 'ACTIVE', ownerName: 'Port Agent', title: 'Customs clearance' }],
      handoffs: [{ id: 'handoff-1', status: 'BLOCKED', ownerName: 'Guest Services', title: 'Manifest handoff' }],
      commandCenter: { commandScore: 72, decisionQueue: [{ id: 'decision-1', severity: 'HIGH', owner: 'Turnaround Manager', action: 'Clear customs dependency' }] },
      continuityCenter: { continuityScore: 68, watchlist: [{ id: 'watch-1', type: 'WATCH', owner: 'Continuity Lead', label: 'Passenger flow', detail: 'Extend lobby staffing.' }] },
      shiftBriefing: { summary: { briefingScore: 70, handoffStatus: 'WATCH_HANDOFF', nextShiftFocus: 'Guest Services' }, criticalItems: [{ id: 'brief-1', type: 'CRITICAL', departmentRole: 'guest-services-lead', owner: 'Guest Lead', label: 'Check-in queue', detail: 'Open overflow lanes.' }] },
      goLiveCenter: { summary: { goLiveScore: 58, launchRecommendation: 'Hold until blocker clearance.' }, actions: [{ id: 'go-1', priority: 'HIGH', owner: 'Launch Lead', action: 'Confirm release evidence.' }] }
    })

    expect(board.summary.goNoGoStatus).toBe('NO_GO')
    expect(board.summary.blockedTasks).toBe(1)
    expect(board.summary.openDependencies).toBe(1)
    expect(board.lanes.map(lane => lane.id)).toEqual(expect.arrayContaining([
      'team-readiness',
      'critical-path',
      'blockers',
      'continuity-events',
      'shift-priorities',
      'go-no-go'
    ]))
    expect(board.priorityActions.map(action => action.source)).toEqual(expect.arrayContaining([
      'Command center',
      'Shift briefing',
      'Continuity center',
      'Go/no-go',
      'Critical path',
      'Blockers',
      'Escalations',
      'Handoffs'
    ]))
    expect(board.commandRhythm).toContain('Validate continuity watchlist impact on passengers and crew.')
  })

  it('reports a go status when command signals are clear', () => {
    const summary = buildBoardSummary({
      tasks: [{ status: 'COMPLETE' }, { status: 'COMPLETE' }],
      staffing: [{ plannedCount: 4, checkedInCount: 4 }],
      signoffs: [{ status: 'APPROVED' }],
      escalations: [],
      dependencies: [],
      handoffs: [{ status: 'COMPLETE' }],
      commandCenter: { commandScore: 98 },
      continuityCenter: { continuityScore: 96 },
      shiftBriefing: { summary: { briefingScore: 95 } },
      goLiveCenter: { summary: { goLiveScore: 94 } }
    })

    expect(summary.goNoGoStatus).toBe('GO')
    expect(buildControlLanes({ summary })).toHaveLength(6)
    expect(buildControlActions({ tasks: [], escalations: [], dependencies: [], handoffs: [] })).toEqual([])
  })

  it('preserves explicit zero command scores instead of replacing them with task completion', () => {
    const summary = buildBoardSummary({
      tasks: [{ status: 'COMPLETE' }],
      commandCenter: { summary: { commandScore: 0 }, commandScore: 90 },
      continuityCenter: { summary: { continuityScore: 0 }, continuityScore: 80 },
      shiftBriefing: { summary: { briefingScore: 0 } },
      goLiveCenter: { summary: { goLiveScore: 0 } }
    })

    expect(summary.commandScore).toBe(0)
    expect(summary.continuityScore).toBe(0)
    expect(summary.briefingScore).toBe(0)
    expect(summary.goLiveScore).toBe(0)
    expect(summary.goNoGoStatus).toBe('NO_GO')
  })

  it('uses fallback scores only when command evidence is absent', () => {
    const summary = buildBoardSummary({
      tasks: [{ status: 'COMPLETE' }, { status: 'COMPLETE' }],
      commandCenter: { commandScore: 88 },
      continuityCenter: {},
      shiftBriefing: {},
      goLiveCenter: {}
    })

    expect(summary.commandScore).toBe(88)
    expect(summary.continuityScore).toBe(88)
    expect(summary.briefingScore).toBe(88)
    expect(summary.goLiveScore).toBe(88)
  })

  it('does not treat resolved critical escalations as active no-go blockers', () => {
    const summary = buildBoardSummary({
      tasks: [{ status: 'COMPLETE' }],
      staffing: [],
      signoffs: [{ status: 'APPROVED' }],
      escalations: [{ status: 'RESOLVED', severity: 'CRITICAL' }],
      dependencies: [],
      handoffs: [{ status: 'COMPLETE' }],
      commandCenter: { commandScore: 95 },
      continuityCenter: { continuityScore: 95 },
      shiftBriefing: { summary: { briefingScore: 95 } },
      goLiveCenter: { summary: { goLiveScore: 95 } }
    })

    expect(summary.openEscalations).toBe(0)
    expect(summary.criticalEscalations).toBe(0)
    expect(summary.goNoGoStatus).toBe('GO')
  })

  it('degrades explicit null operational collections to safe empty collections', () => {
    const summary = buildBoardSummary({
      tasks: null,
      staffing: null,
      signoffs: null,
      escalations: null,
      dependencies: null,
      handoffs: null
    })
    const actions = buildControlActions({ tasks: null, escalations: null, dependencies: null, handoffs: null })

    expect(summary).toEqual(expect.objectContaining({
      totalTasks: 0,
      blockerCount: 0,
      completionPercent: 0
    }))
    expect(actions).toEqual([])
  })

  it('reports watch status for noncritical blockers and exposes lane evidence fallbacks', () => {
    const board = buildTurnaroundOperationsControlBoard({
      tasks: [{ status: 'COMPLETE' }],
      staffing: [{ plannedCount: 2, checkedInCount: 1 }],
      signoffs: [{ status: 'APPROVED' }],
      escalations: [],
      dependencies: [],
      handoffs: [{ status: 'COMPLETE' }],
      commandCenter: { commandScore: 90 },
      continuityCenter: { continuityScore: 90 },
      shiftBriefing: { summary: { briefingScore: 90 } },
      goLiveCenter: { summary: { goLiveScore: 90 } }
    })

    expect(board.summary.goNoGoStatus).toBe('WATCH')
    expect(board.summary.headline).toContain('watch status')
    expect(board.lanes.find(lane => lane.id === 'continuity-events').status).toBe('CONTINUITY_WATCH')
    expect(board.lanes.find(lane => lane.id === 'shift-priorities').status).toBe('WATCH_HANDOFF')
    expect(board.summary.nextBestAction).toContain('Keep department readiness')
  })

  it('filters closed actions, applies owner/action fallbacks, and caps the command queue', () => {
    const actions = buildControlActions({
      commandCenter: { decisionQueue: Array.from({ length: 8 }, (_, index) => ({ id: `d${index}`, decision: `Decision ${index}` })) },
      dependencies: [{ taskName: 'Gate', status: 'ACTIVE', notes: 'Dependency note' }, { id: 'cleared', status: 'CLEARED', title: 'Ignore' }],
      tasks: [{ taskName: 'Blocked task', status: 'BLOCKED', notes: 'Task note' }],
      escalations: [{ id: 'open', status: 'OPEN', description: 'Escalation note' }, { id: 'closed', status: 'CLOSED', description: 'Ignore' }],
      handoffs: [{ id: 'handoff', status: 'BLOCKED', title: 'Handoff note' }, { id: 'done', status: 'COMPLETE', title: 'Ignore' }]
    })

    expect(actions).toHaveLength(12)
    expect(actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ owner: 'Command', action: 'Decision 0' }),
      expect.objectContaining({ owner: 'Dependency owner', action: 'Dependency note' }),
      expect.objectContaining({ owner: 'Task owner', action: 'Task note' }),
      expect.objectContaining({ owner: 'Escalation owner', action: 'Escalation note' })
    ]))
    expect(actions.some(action => action.id === 'escalation-closed')).toBe(false)
  })

})
