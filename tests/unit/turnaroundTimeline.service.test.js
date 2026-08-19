const {
  buildTurnaroundOperationalTimeline,
  normalizeTimelineDate,
  normalizeTimelineStatus
} = require('../../services/turnaroundTimeline.service')

describe('turnaround operational timeline behavior', () => {
  test('normalizes valid, invalid, and missing dates and statuses', () => {
    expect(normalizeTimelineDate('2026-08-14T12:30:00Z')).toBe('2026-08-14T12:30:00.000Z')
    expect(normalizeTimelineDate('not-a-date', 'fallback')).toBe('fallback')
    expect(normalizeTimelineDate('', 'fallback')).toBe('fallback')
    expect(normalizeTimelineStatus(' blocked ')).toBe('BLOCKED')
    expect(normalizeTimelineStatus('', 'pending')).toBe('PENDING')
  })

  test('treats a resolved critical escalation as success instead of an active critical', () => {
    const timeline = buildTurnaroundOperationalTimeline({
      operation: { id: 'op-1', port: 'Miami', turnaroundDate: '2026-08-14', status: 'ACTIVE' },
      escalations: [{
        id: 'esc-1',
        severity: 'CRITICAL',
        status: 'RESOLVED',
        title: 'Gangway outage',
        resolutionNotes: 'Restored',
        createdAt: '2026-08-14T09:00:00Z'
      }]
    })

    const escalation = timeline.items.find(item => item.source === 'ESCALATION')
    expect(escalation).toEqual(expect.objectContaining({ severity: 'SUCCESS', status: 'RESOLVED' }))
    expect(timeline.summary.criticalCount).toBe(0)
    expect(timeline.summary.successCount).toBe(1)
  })

  test('keeps unresolved critical escalation in the active critical count', () => {
    const timeline = buildTurnaroundOperationalTimeline({
      operation: { id: 'op-1' },
      escalations: [{ id: 'esc-1', severity: 'CRITICAL', status: 'OPEN', title: 'Fuel delay' }]
    })

    expect(timeline.summary.criticalCount).toBe(1)
    expect(timeline.summary.actionCount).toBe(1)
    expect(timeline.summary.successCount).toBe(0)
  })

  test('builds task and task-update evidence with actor and detail fallbacks', () => {
    const timeline = buildTurnaroundOperationalTimeline({
      operation: { id: 'op-1', turnaroundDate: '2026-08-14' },
      tasks: [
        {
          id: 't1', taskName: 'Cabin sweep', status: 'BLOCKED', blockerReason: 'Deck access',
          ownerDisplayName: '  ', ownerName: 'Morgan', updatedAt: '2026-08-14T10:00:00Z', departmentRole: 'HOUSEKEEPING',
          updates: [{ id: 'u1', updateType: 'BLOCKER', authorName: 'Casey', message: 'Awaiting clearance', createdAt: '2026-08-14T10:30:00Z' }]
        },
        { id: 't2', taskName: 'Provisioning', status: 'COMPLETE', location: 'Pier 2', ownerDisplayName: 'Lee' }
      ]
    })

    const blocked = timeline.items.find(item => item.id === 'task:t1')
    const update = timeline.items.find(item => item.id === 'task-update:u1')
    const complete = timeline.items.find(item => item.id === 'task:t2')
    expect(blocked).toEqual(expect.objectContaining({ severity: 'CRITICAL', actorDisplayName: 'Morgan', detail: 'Deck access' }))
    expect(update).toEqual(expect.objectContaining({ severity: 'CRITICAL', actorDisplayName: 'Casey' }))
    expect(complete).toEqual(expect.objectContaining({ severity: 'SUCCESS', detail: 'Pier 2' }))
  })

  test('summarizes staffing, signoffs, dependencies, handoffs, and audit events across states', () => {
    const timeline = buildTurnaroundOperationalTimeline({
      operation: { id: 'op-1', port: 'Miami', turnaroundDate: '2026-08-14', status: 'BLOCKED', notes: 'Weather hold' },
      staffing: [
        { id: 's1', departmentRole: 'GUEST_SERVICES', plannedCount: 5, checkedInCount: 3, musterLocation: 'A', leadName: 'Taylor' },
        { id: 's2', departmentRole: 'ENGINEERING', plannedCount: 2, checkedInCount: 2 }
      ],
      signoffs: [
        { id: 'sg1', departmentRole: 'ENGINEERING', status: 'APPROVED', approverName: 'Alex' },
        { id: 'sg2', departmentRole: 'SECURITY', status: 'BLOCKED', notes: 'Inspection open' }
      ],
      dependencies: [
        { id: 'd1', taskName: 'Boarding', status: 'ACTIVE', dependsOnTaskName: 'Security sweep' },
        { id: 'd2', taskName: 'Fueling', status: 'CLEARED', dependsOnTaskId: 't3' }
      ],
      handoffs: [
        { id: 'h1', title: 'Cabin release', status: 'PENDING', dueTime: '11:00' },
        { id: 'h2', title: 'Bridge release', status: 'COMPLETE', completedAt: '2026-08-14T11:30:00Z' }
      ],
      auditEvents: [{ id: 'a1', eventType: 'TASK_UPDATED', actorDisplayName: 'Auditor', entityType: 'TASK', entityId: 't1', createdAt: '2026-08-14T12:00:00Z' }]
    })

    expect(timeline.items.find(item => item.id === 'staffing:s1')).toEqual(expect.objectContaining({ status: 'GAP', severity: 'ACTION', detail: '3/5 checked in at A' }))
    expect(timeline.items.find(item => item.id === 'staffing:s2')).toEqual(expect.objectContaining({ status: 'COVERED', severity: 'SUCCESS' }))
    expect(timeline.items.find(item => item.id === 'signoff:sg1').severity).toBe('SUCCESS')
    expect(timeline.items.find(item => item.id === 'signoff:sg2').severity).toBe('CRITICAL')
    expect(timeline.items.find(item => item.id === 'dependency:d1').status).toBe('ACTIVE')
    expect(timeline.items.find(item => item.id === 'dependency:d2').severity).toBe('SUCCESS')
    expect(timeline.items.find(item => item.id === 'handoff:h1').detail).toBe('Due 11:00')
    expect(timeline.items.find(item => item.id === 'handoff:h2').severity).toBe('SUCCESS')
    expect(timeline.items.find(item => item.id === 'audit:a1')).toEqual(expect.objectContaining({ title: 'task updated', detail: 'TASK t1' }))
    expect(timeline.summary.latestEventAt).toBe('2026-08-14T12:00:00.000Z')
  })

  test('is resilient to explicit null operation and null collections', () => {
    const timeline = buildTurnaroundOperationalTimeline({
      operation: null,
      tasks: null,
      staffing: null,
      signoffs: null,
      escalations: null,
      dependencies: null,
      handoffs: null,
      auditEvents: null
    })

    expect(timeline.operationId).toBeNull()
    expect(timeline.summary.totalEvents).toBe(1)
    expect(timeline.items[0]).toEqual(expect.objectContaining({ id: 'operation:pending', title: 'Port turnaround command plan' }))
  })

  test('sorts newest evidence first, uses weight as a tie breaker, and caps presentation at 24 items', () => {
    const tasks = Array.from({ length: 30 }, (_, index) => ({
      id: `t${index}`,
      taskName: `Task ${index}`,
      status: index === 0 ? 'BLOCKED' : 'READY',
      updatedAt: '2026-08-14T12:00:00Z'
    }))
    const timeline = buildTurnaroundOperationalTimeline({ operation: { id: 'op-1' }, tasks })

    expect(timeline.summary.totalEvents).toBe(31)
    expect(timeline.items).toHaveLength(24)
    expect(timeline.items[0].id).toBe('task:t0')
  })

  test('fails soft for malformed collections and normalizes non-finite staffing evidence', () => {
    const timeline = buildTurnaroundOperationalTimeline({
      operation: { id: 'op-malformed' },
      tasks: { id: 'not-iterable' },
      staffing: [
        { id: 's1', departmentRole: 'HOUSEKEEPING', plannedCount: Infinity, checkedInCount: 'bad' },
        { id: 's2', departmentRole: 'ENGINEERING', plannedCount: 2.9, checkedInCount: -4 }
      ],
      signoffs: 'bad',
      escalations: {},
      dependencies: null,
      handoffs: 7,
      auditEvents: { id: 'bad' }
    })

    expect(timeline.items.find(item => item.id === 'staffing:s1')).toEqual(expect.objectContaining({ detail: '0/0 checked in', status: 'COVERED' }))
    expect(timeline.items.find(item => item.id === 'staffing:s2')).toEqual(expect.objectContaining({ detail: '0/2 checked in', status: 'GAP' }))
    expect(timeline.summary.totalEvents).toBe(3)
  })

  test('normalizes equivalent terminal statuses and padded blocker evidence consistently', () => {
    const timeline = buildTurnaroundOperationalTimeline({
      operation: { id: 'op-status' },
      tasks: [{ id: 't1', status: ' completed ', taskName: 'Done task' }],
      signoffs: [{ id: 's1', status: ' approved ', departmentRole: 'ENGINEERING' }],
      dependencies: [{ id: 'd1', status: ' resolved ', taskName: 'Boarding' }],
      escalations: [{ id: 'e1', status: ' closed ', severity: ' critical ', title: 'Closed risk' }],
      handoffs: [{ id: 'h1', status: ' cleared ', title: 'Released handoff' }]
    })

    expect(timeline.items.find(item => item.id === 'task:t1')).toEqual(expect.objectContaining({ status: 'COMPLETED', severity: 'SUCCESS' }))
    expect(timeline.items.find(item => item.id === 'signoff:s1')).toEqual(expect.objectContaining({ status: 'APPROVED', severity: 'SUCCESS' }))
    expect(timeline.items.find(item => item.id === 'dependency:d1')).toEqual(expect.objectContaining({ status: 'RESOLVED', severity: 'SUCCESS' }))
    expect(timeline.items.find(item => item.id === 'escalation:e1')).toEqual(expect.objectContaining({ status: 'CLOSED', severity: 'SUCCESS' }))
    expect(timeline.items.find(item => item.id === 'handoff:h1')).toEqual(expect.objectContaining({ status: 'CLEARED', severity: 'SUCCESS' }))
  })

  test('filters malformed actor and narrative objects instead of leaking structural values', () => {
    const timeline = buildTurnaroundOperationalTimeline({
      operation: { id: 'op-text' },
      tasks: [{
        id: 't1',
        taskName: 'Cabin prep',
        ownerDisplayName: { name: 'bad' },
        ownerName: 'Valid owner',
        blockerReason: { text: 'bad' },
        location: 12,
        updates: [{ id: 'u1', authorDisplayName: {}, authorName: 'Valid author', message: 'Ready' }]
      }]
    })

    expect(timeline.items.find(item => item.id === 'task:t1')).toEqual(expect.objectContaining({ actorDisplayName: 'Valid owner', detail: '12' }))
    expect(timeline.items.find(item => item.id === 'task-update:u1')).toEqual(expect.objectContaining({ actorDisplayName: 'Valid author' }))
    expect(JSON.stringify(timeline)).not.toContain('[object Object]')
  })

})
