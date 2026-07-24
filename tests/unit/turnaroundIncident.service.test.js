const {
  buildTurnaroundIncidentCommand,
  buildIncidentSignals,
  buildIncidentCommandPlan,
} = require('../../services/turnaroundIncident.service')

describe('turnaroundIncident service', () => {
  test('builds and sorts incident signals across every operational source', () => {
    const result = buildIncidentSignals({
      tasks: [
        { id: 'task-1', status: 'BLOCKED', departmentRole: 'engineering-lead', taskName: 'Restore shore power', blockerReason: 'Breaker unavailable', ownerName: 'Iris' },
        { id: 'task-2', status: 'READY', departmentRole: 'housekeeping-lead', taskName: 'Cabin sweep' },
      ],
      escalations: [
        { id: 'esc-1', status: 'OPEN', severity: 'CRITICAL', departmentRole: 'guest-services-lead', title: 'Terminal congestion', ownerDisplayName: 'Claire Bennett' },
        { id: 'esc-2', status: 'RESOLVED', severity: 'HIGH', departmentRole: 'security-lead', title: 'Resolved issue' },
      ],
      dependencies: [
        { id: 'dep-1', status: 'ACTIVE', departmentRole: 'turnaround-manager', taskName: 'Release cabins', dependsOnTaskName: 'Cabin inspection' },
        { id: 'dep-2', status: 'CLEARED', departmentRole: 'turnaround-manager', taskName: 'Cleared dependency' },
      ],
      handoffs: [
        { id: 'handoff-1', status: 'BLOCKED', departmentRole: 'food-beverage-lead', notes: 'Cold-chain delay', ownerName: 'Luca' },
        { id: 'handoff-2', status: 'PENDING', departmentRole: 'security-lead', dueTime: '12:30' },
        { id: 'handoff-3', status: 'COMPLETE', departmentRole: 'housekeeping-lead' },
      ],
      staffing: [
        { id: 'staff-1', departmentRole: 'housekeeping-lead', plannedCount: 6, checkedInCount: 2, musterLocation: 'Deck 4', leadName: 'Hannah' },
        { id: 'staff-2', departmentRole: 'engineering-lead', plannedCount: 3, checkedInCount: 3 },
      ],
      signoffs: [
        { id: 'signoff-1', status: 'BLOCKED', departmentRole: 'food-beverage-lead', notes: 'Approver unavailable' },
        { id: 'signoff-2', status: 'PENDING', departmentRole: 'turnaround-manager' },
        { id: 'signoff-3', status: 'APPROVED', departmentRole: 'engineering-lead' },
      ],
    })

    expect(result.signals).toHaveLength(8)
    expect(result.signals[0]).toMatchObject({ source: 'ESCALATION', severity: 'CRITICAL', score: 34 })
    expect(result.signals.map(signal => signal.source)).toEqual(expect.arrayContaining([
      'TASK', 'ESCALATION', 'DEPENDENCY', 'HANDOFF', 'STAFFING', 'SIGNOFF',
    ]))
    expect(result.signals.find(signal => signal.source === 'DEPENDENCY').detail).toBe('Waiting on Cabin inspection')
    expect(result.signals.find(signal => signal.source === 'STAFFING')).toMatchObject({ severity: 'HIGH', score: 20 })
    expect(result.departmentRisks.get('food-beverage-lead')).toBe(28)
  })

  test('uses safe fallback values for incomplete incident records', () => {
    const result = buildIncidentSignals({
      tasks: [{ status: 'BLOCKED' }],
      escalations: [{ status: 'OPEN' }],
      dependencies: [{ status: 'ACTIVE' }],
      handoffs: [{ status: 'PENDING' }],
      staffing: [{ plannedCount: 1, checkedInCount: 0 }],
      signoffs: [{ status: 'PENDING' }],
    })

    expect(result.signals.every(signal => signal.departmentRole === 'Unassigned')).toBe(true)
    expect(result.signals.find(signal => signal.source === 'TASK')).toMatchObject({
      title: 'Blocked turnaround task',
      detail: 'Task is blocked and requires operational intervention.',
      ownerDisplayName: 'Owner pending',
    })
    expect(result.signals.find(signal => signal.source === 'DEPENDENCY').detail).toBe('Dependency must clear before release.')
    expect(result.signals.find(signal => signal.source === 'HANDOFF').detail).toBe('Handoff remains open.')
    expect(result.signals.find(signal => signal.source === 'SIGNOFF').ownerDisplayName).toBe('Approver pending')
  })

  test.each([
    [{ incidentStatus: 'MAJOR_INCIDENT', incidentSeverity: 'CRITICAL' }, 'Hold final embarkation release'],
    [{ incidentStatus: 'ACTIVE_INCIDENT', incidentSeverity: 'HIGH' }, 'Run a department lead standup'],
    [{ incidentStatus: 'WATCH', incidentSeverity: 'WATCH' }, 'Keep watch items on the command board'],
    [{ incidentStatus: 'STABLE', incidentSeverity: 'LOW' }, 'No active incident bridge is required'],
  ])('builds severity-specific command guidance', (incident, expectedAction) => {
    const actions = buildIncidentCommandPlan(incident)
    expect(actions.join(' ')).toContain(expectedAction)
  })

  test('adds owner, release packet, and playbook variance actions while limiting the plan', () => {
    const actions = buildIncidentCommandPlan({
      incidentStatus: 'MAJOR_INCIDENT',
      incidentSeverity: 'CRITICAL',
      signals: [{ departmentRole: 'Engineering Lead', title: 'Restore shore power' }],
      releasePacket: { releaseStatus: 'NOT_READY' },
      playbookVariance: { summary: { highVarianceCount: 2 } },
    })

    expect(actions).toHaveLength(4)
    expect(actions[0]).toBe('Assign command follow-up for Engineering Lead: Restore shore power.')
    expect(actions[2]).toContain('release-packet blockers')
    expect(actions[3]).toContain('playbook variance')
  })

  test('builds a bounded incident command summary with ranked departments', () => {
    const result = buildTurnaroundIncidentCommand({
      operation: { id: 'operation-1' },
      tasks: [{ id: 'task-1', status: 'BLOCKED', departmentRole: 'engineering-lead', taskName: 'Power clearance' }],
      escalations: [{ id: 'esc-1', status: 'OPEN', severity: 'HIGH', departmentRole: 'engineering-lead', title: 'Shore power delay' }],
      operationalTimeline: { summary: { criticalCount: 3 } },
      operationalMetrics: { summary: { riskIndex: 80, readinessScore: 20 } },
      releasePacket: { readinessScore: 10, releaseStatus: 'NOT_READY' },
    })

    expect(result.operationId).toBe('operation-1')
    expect(result.incidentScore).toBeGreaterThanOrEqual(70)
    expect(result.incidentScore).toBeLessThanOrEqual(100)
    expect(result.incidentStatus).toBe('MAJOR_INCIDENT')
    expect(result.incidentSeverity).toBe('CRITICAL')
    expect(result.summary).toMatchObject({
      activeSignalCount: 2,
      timelineCriticalCount: 3,
      topIncidentDepartment: 'engineering-lead',
      releaseReadinessScore: 10,
      riskIndex: 80,
    })
    expect(result.incidentDepartments[0].departmentRole).toBe('engineering-lead')
    expect(new Date(result.generatedAt).toString()).not.toBe('Invalid Date')
  })

  test('returns a stable zero-risk command when no operational evidence exists', () => {
    const result = buildTurnaroundIncidentCommand()

    expect(result).toMatchObject({
      operationId: null,
      incidentScore: 0,
      incidentStatus: 'STABLE',
      incidentSeverity: 'LOW',
      summary: {
        activeSignalCount: 0,
        timelineCriticalCount: 0,
        topIncidentDepartment: 'None',
        releaseReadinessScore: 0,
        riskIndex: 0,
      },
      incidentSignals: [],
      incidentDepartments: [],
    })
    expect(result.commandActions).toEqual([
      'No active incident bridge is required; continue normal readiness cadence.',
    ])
  })
})
