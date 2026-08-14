const {
  buildTurnaroundReleasePacket,
  normalizeStatus
} = require('../../services/turnaroundRelease.service')

describe('turnaround release packet decision behavior', () => {
  test('normalizes status values used by release gates', () => {
    expect(normalizeStatus(' complete ')).toBe('COMPLETE')
    expect(normalizeStatus(null)).toBe('')
  })

  test('produces a ready release only when every blocking gate is satisfied', () => {
    const packet = buildTurnaroundReleasePacket({
      operation: { id: 'operation-1' },
      tasks: [{ taskName: 'Embarkation', status: 'COMPLETE' }],
      staffing: [{ plannedCount: 10, checkedInCount: 10 }],
      signoffs: [{ departmentRole: 'Guest Services', status: 'APPROVED' }],
      dependencies: [{ taskId: 'task-1', status: 'CLEARED' }],
      handoffs: [{ title: 'Terminal handoff', status: 'COMPLETE' }],
      escalations: [{ title: 'Resolved watch', status: 'RESOLVED' }],
      auditEvents: [{ id: 'audit-1' }]
    })

    expect(packet.releaseStatus).toBe('READY')
    expect(packet.readinessScore).toBe(100)
    expect(packet.blockers).toEqual([])
    expect(packet.checklist.every(item => item.status === 'PASS')).toBe(true)
    expect(packet.counters).toEqual(expect.objectContaining({
      completeTasks: 1,
      staffingGaps: 0,
      approvedSignoffs: 1,
      activeDependencies: 0,
      incompleteHandoffs: 0,
      openEscalations: 0,
      recentAuditEvents: 1
    }))
  })

  test('caps staffing readiness at 100 when more staff check in than planned', () => {
    const packet = buildTurnaroundReleasePacket({
      tasks: [{ status: 'COMPLETE' }],
      staffing: [{ plannedCount: 5, checkedInCount: 8 }],
      signoffs: [{ status: 'APPROVED' }],
      dependencies: [],
      handoffs: [],
      auditEvents: [{ id: 'audit-1' }]
    })

    expect(packet.percentages.staffing).toBe(100)
    expect(packet.readinessScore).toBe(100)
    expect(packet.counters.staffingGaps).toBe(0)
  })

  test('does not claim task completion when no tasks exist', () => {
    const packet = buildTurnaroundReleasePacket({
      staffing: [{ plannedCount: 1, checkedInCount: 1 }],
      signoffs: [{ status: 'APPROVED' }],
      auditEvents: [{ id: 'audit-1' }]
    })

    expect(packet.releaseStatus).toBe('NOT_READY')
    expect(packet.checklist.find(item => item.id === 'tasks')).toEqual(expect.objectContaining({
      status: 'ACTION_REQUIRED',
      percent: 0
    }))
  })

  test('treats explicitly null operational collections as empty instead of throwing', () => {
    expect(() => buildTurnaroundReleasePacket({
      operation: null,
      tasks: null,
      staffing: null,
      signoffs: null,
      escalations: null,
      dependencies: null,
      handoffs: null,
      auditEvents: null
    })).not.toThrow()

    const packet = buildTurnaroundReleasePacket({
      operation: null,
      tasks: null,
      staffing: null,
      signoffs: null,
      escalations: null,
      dependencies: null,
      handoffs: null,
      auditEvents: null
    })

    expect(packet.operationId).toBeNull()
    expect(packet.releaseStatus).toBe('NOT_READY')
    expect(packet.counters.totalTasks).toBe(0)
    expect(packet.checklist.find(item => item.id === 'audit').status).toBe('WATCH')
  })

  test('builds blockers for every unresolved operational gate with identity fallbacks', () => {
    const packet = buildTurnaroundReleasePacket({
      tasks: [{ taskName: 'Baggage', status: 'blocked', ownerName: 'Task Owner' }],
      staffing: [{ plannedCount: 10, checkedInCount: 4 }],
      signoffs: [{ departmentRole: 'Security', status: 'PENDING', approverName: 'Approver' }],
      dependencies: [{ taskId: 'task-2', status: 'ACTIVE' }],
      handoffs: [{ title: 'Bridge handoff', status: '', ownerName: 'Handoff Owner' }],
      escalations: [{ title: 'Terminal congestion', severity: '', status: '', ownerName: 'Escalation Owner' }]
    })

    expect(packet.releaseStatus).toBe('NOT_READY')
    expect(packet.blockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'TASK', owner: 'Task Owner', detail: 'Task is blocked.' }),
      expect.objectContaining({ type: 'SIGNOFF', owner: 'Approver', detail: 'Readiness signoff is PENDING.' }),
      expect.objectContaining({ type: 'DEPENDENCY', label: 'task-2', detail: 'Waiting on prerequisite task.' }),
      expect.objectContaining({ type: 'ESCALATION', owner: 'Escalation Owner', detail: 'WATCH escalation is open.' }),
      expect.objectContaining({ type: 'HANDOFF', owner: 'Handoff Owner', detail: 'Handoff is pending.' })
    ]))
    expect(packet.checklist.find(item => item.id === 'escalations')).toEqual(expect.objectContaining({
      status: 'ACTION_REQUIRED',
      percent: 0
    }))
  })

  test('limits the release blocker payload while retaining full counters', () => {
    const tasks = Array.from({ length: 15 }, (_, index) => ({
      taskName: `Blocked ${index + 1}`,
      status: 'BLOCKED'
    }))
    const packet = buildTurnaroundReleasePacket({ tasks })

    expect(packet.blockers).toHaveLength(12)
    expect(packet.counters.blockedTasks).toBe(15)
    expect(packet.counters.totalTasks).toBe(15)
  })

  test('keeps empty dependencies and handoffs neutral while missing required staffing and signoffs block readiness', () => {
    const packet = buildTurnaroundReleasePacket({
      tasks: [{ status: 'COMPLETE' }],
      dependencies: [],
      handoffs: []
    })

    expect(packet.percentages.dependencies).toBe(100)
    expect(packet.percentages.handoffs).toBe(100)
    expect(packet.percentages.staffing).toBe(0)
    expect(packet.percentages.signoffs).toBe(0)
    expect(packet.checklist.find(item => item.id === 'dependencies').status).toBe('PASS')
    expect(packet.checklist.find(item => item.id === 'handoffs').status).toBe('PASS')
    expect(packet.checklist.find(item => item.id === 'staffing').status).toBe('ACTION_REQUIRED')
    expect(packet.checklist.find(item => item.id === 'signoffs').status).toBe('ACTION_REQUIRED')
  })
})
