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
})
