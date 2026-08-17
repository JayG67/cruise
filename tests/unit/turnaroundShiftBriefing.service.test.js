const {
  buildTurnaroundShiftBriefing,
  buildBriefingCriticalItems,
  buildDepartmentBriefs,
  buildShiftChecklist
} = require('../../services/turnaroundShiftBriefing.service')

describe('turnaroundShiftBriefing service', () => {
  const tasks = [
    { id: 'task-1', departmentRole: 'HOUSEKEEPING_LEAD', taskName: 'Cabin reset', status: 'COMPLETE', ownerDisplayName: 'Avery Lead' },
    { id: 'task-2', departmentRole: 'ENGINEERING_LEAD', taskName: 'Shore power transfer', status: 'BLOCKED', ownerDisplayName: 'Morgan Power', blockerNotes: 'Terminal power confirmation missing.' },
    { id: 'task-3', departmentRole: 'GUEST_SERVICES_LEAD', taskName: 'Embarkation queue setup', status: 'NOT_STARTED', location: 'Terminal B' }
  ]

  it('builds a next-shift briefing from live operational blockers, owners, and checklist gates', () => {
    const briefing = buildTurnaroundShiftBriefing({
      operation: { id: 'turnaround-briefing-1' },
      tasks,
      staffing: [
        { departmentRole: 'ENGINEERING_LEAD', plannedCount: 6, checkedInCount: 4 },
        { departmentRole: 'HOUSEKEEPING_LEAD', plannedCount: 34, checkedInCount: 34 }
      ],
      signoffs: [
        { departmentRole: 'ENGINEERING_LEAD', status: 'BLOCKED', notes: 'Power proof pending.' },
        { departmentRole: 'HOUSEKEEPING_LEAD', status: 'APPROVED' }
      ],
      escalations: [{ id: 'esc-1', departmentRole: 'ENGINEERING_LEAD', severity: 'CRITICAL', status: 'OPEN', summary: 'Shore power risk', ownerDisplayName: 'Morgan Power' }],
      dependencies: [{ id: 'dep-1', departmentRole: 'GUEST_SERVICES_LEAD', taskName: 'Open check-in lanes', dependsOnTaskName: 'Shore power transfer', status: 'BLOCKED' }],
      handoffs: [{ id: 'handoff-1', departmentRole: 'HOUSEKEEPING_LEAD', handoffName: 'Deck release', status: 'PENDING', ownerDisplayName: 'Avery Lead', acceptanceCriteria: 'Decks 8-12 released.' }],
      operationalMetrics: { summary: { releaseConfidence: 82 } },
      commandCenter: { summary: { decisionQueueCount: 1 } },
      continuityCenter: { summary: { watchlistCount: 1 } },
      closeoutPacket: { summary: { closeoutScore: 76 } }
    })

    expect(briefing.summary.handoffStatus).toBe('COMMAND_REVIEW')
    expect(briefing.summary.actionCount).toBeGreaterThan(0)
    expect(briefing.summary.nextShiftFocus).toBe('ENGINEERING_LEAD')
    expect(briefing.criticalItems[0]).toEqual(expect.objectContaining({ type: 'CRITICAL_ESCALATION', owner: 'Morgan Power' }))
    expect(briefing.departmentBriefs).toEqual(expect.arrayContaining([
      expect.objectContaining({ departmentRole: 'ENGINEERING_LEAD', briefingFocus: expect.stringContaining('Unblock') })
    ]))
    expect(briefing.checklist).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'decision-queue', status: 'ACTION' }),
      expect.objectContaining({ id: 'continuity-watchlist', status: 'WATCH' })
    ]))
  })

  it('prioritizes critical handoff items ahead of routine watch items', () => {
    const criticalItems = buildBriefingCriticalItems({
      tasks,
      escalations: [{ id: 'esc-2', departmentRole: 'SECURITY_LEAD', severity: 'CRITICAL', status: 'OPEN', summary: 'Gangway crowding' }]
    })

    expect(criticalItems[0]).toEqual(expect.objectContaining({ type: 'CRITICAL_ESCALATION' }))
    expect(criticalItems.map(item => item.type)).toEqual(expect.arrayContaining(['BLOCKER', 'START_READY']))
  })


  it('preserves zero release confidence and authoritative zero queue counts', () => {
    const briefing = buildTurnaroundShiftBriefing({
      operation: null,
      operationalMetrics: { summary: { releaseConfidence: 0 } },
      commandCenter: { summary: { decisionQueueCount: 0 }, decisionQueue: [{ id: 'stale-command' }] },
      continuityCenter: { summary: { watchlistCount: 0 }, watchlist: [{ id: 'stale-watch' }] },
      closeoutPacket: { summary: { closeoutScore: 90 } }
    })

    expect(briefing.operationId).toBeNull()
    expect(briefing.summary.briefingScore).toBe(0)
    expect(briefing.summary.handoffStatus).toBe('READY_HANDOFF')
    expect(briefing.checklist).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'decision-queue', status: 'READY' }),
      expect.objectContaining({ id: 'continuity-watchlist', status: 'READY' }),
      expect.objectContaining({ id: 'release-confidence', status: 'WATCH' })
    ]))
  })

  it('falls back to queue arrays only when summary counts are absent', () => {
    const checklist = buildShiftChecklist({
      operationalMetrics: { summary: { releaseConfidence: 90 } },
      commandCenter: { decisionQueue: [{ id: 'command-1' }, { id: 'command-2' }] },
      continuityCenter: { watchlist: [{ id: 'watch-1' }] },
      closeoutPacket: { summary: { closeoutScore: 90 } }
    })

    expect(checklist).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'decision-queue', status: 'ACTION', detail: expect.stringContaining('2 command decisions') }),
      expect.objectContaining({ id: 'continuity-watchlist', status: 'WATCH', detail: expect.stringContaining('1 continuity watch item') })
    ]))
  })

  it('uses the neutral briefing baseline only when release confidence is absent', () => {
    const briefing = buildTurnaroundShiftBriefing({
      operation: { id: 'turnaround-neutral' },
      closeoutPacket: { summary: { closeoutScore: 90 } }
    })

    expect(briefing.summary.briefingScore).toBe(72)
    expect(briefing.summary.handoffStatus).toBe('READY_HANDOFF')
  })

  it('summarizes department focus and checklist readiness for clean handoffs', () => {
    const departmentBriefs = buildDepartmentBriefs({
      tasks: [{ id: 'task-4', departmentRole: 'FOOD_BEVERAGE_LEAD', taskName: 'Provision stores', status: 'COMPLETE' }],
      staffing: [{ departmentRole: 'FOOD_BEVERAGE_LEAD', plannedCount: 12, checkedInCount: 12 }],
      signoffs: [{ departmentRole: 'FOOD_BEVERAGE_LEAD', status: 'APPROVED' }],
      escalations: []
    })
    const checklist = buildShiftChecklist({ operationalMetrics: { summary: { releaseConfidence: 90 } }, commandCenter: { summary: { decisionQueueCount: 0 } }, continuityCenter: { summary: { watchlistCount: 0 } }, closeoutPacket: { summary: { closeoutScore: 90 } } })

    expect(departmentBriefs[0]).toEqual(expect.objectContaining({ completionPercent: 100, briefingFocus: expect.stringContaining('Keep pace') }))
    expect(checklist.every(item => item.status === 'READY')).toBe(true)
  })
})

describe('turnaroundShiftBriefing numeric evidence hardening', () => {
  it('normalizes malformed staffing counts without NaN department evidence', () => {
    const briefs = buildDepartmentBriefs({
      staffing: [
        { departmentRole: 'HOTEL_LEAD', plannedCount: 'bad', checkedInCount: Infinity },
        { departmentRole: 'ENGINEERING_LEAD', plannedCount: 4.9, checkedInCount: 2.2 }
      ]
    })

    expect(briefs).toEqual(expect.arrayContaining([
      expect.objectContaining({ departmentRole: 'HOTEL_LEAD', staffingGap: 0 }),
      expect.objectContaining({ departmentRole: 'ENGINEERING_LEAD', staffingGap: 2 })
    ]))
    expect(briefs.every(row => Number.isFinite(row.staffingGap))).toBe(true)
  })

  it('normalizes malformed queue and readiness counts instead of rendering NaN checklist text', () => {
    const checklist = buildShiftChecklist({
      operationalMetrics: { summary: { releaseConfidence: 'bad' } },
      commandCenter: { summary: { decisionQueueCount: 'bad' } },
      continuityCenter: { summary: { watchlistCount: Infinity } },
      closeoutPacket: { summary: { closeoutScore: 'bad' } }
    })

    expect(checklist).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'release-confidence', status: 'WATCH' }),
      expect.objectContaining({ id: 'decision-queue', status: 'READY' }),
      expect.objectContaining({ id: 'continuity-watchlist', status: 'READY' }),
      expect.objectContaining({ id: 'closeout-readiness', status: 'WATCH' })
    ]))
    expect(checklist.map(item => item.detail).join(' ')).not.toContain('NaN')
    expect(checklist.map(item => item.detail).join(' ')).not.toContain('Infinity')
  })

  it('keeps briefing scores finite when release-confidence evidence is malformed', () => {
    const briefing = buildTurnaroundShiftBriefing({
      operation: { id: 'malformed-release' },
      operationalMetrics: { summary: { releaseConfidence: Infinity } }
    })

    expect(briefing.summary.briefingScore).toBe(0)
    expect(Number.isFinite(briefing.summary.briefingScore)).toBe(true)
  })
})
