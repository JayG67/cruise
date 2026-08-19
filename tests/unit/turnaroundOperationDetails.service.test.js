const mockTables = {
  cruiseLine: { id: 'cruiseLine.id' },
  ship: { id: 'ship.id', cruiseLineId: 'ship.cruiseLineId' },
  sailing: { id: 'sailing.id', shipId: 'sailing.shipId' },
  booking: { id: 'booking.id', sailingId: 'booking.sailingId' },
  passenger: { bookingId: 'passenger.bookingId' },
  user: { id: 'user.id' },
  task: { operationId: 'task.operationId' },
  update: { taskId: 'update.taskId' },
  signoff: { operationId: 'signoff.operationId' },
  escalation: { operationId: 'escalation.operationId' },
  staffing: { operationId: 'staffing.operationId' },
  dependency: { operationId: 'dependency.operationId' },
  handoff: { operationId: 'handoff.operationId' }
}

jest.mock('../../models/cruiseline.model', () => mockTables.cruiseLine)
jest.mock('../../models/ship.model', () => mockTables.ship)
jest.mock('../../models/sailing.model', () => mockTables.sailing)
jest.mock('../../models/booking.model', () => mockTables.booking)
jest.mock('../../models/bookingPassenger.model', () => mockTables.passenger)
jest.mock('../../models/appUser.model', () => mockTables.user)
jest.mock('../../models/turnaroundTask.model', () => mockTables.task)
jest.mock('../../models/turnaroundTaskUpdate.model', () => mockTables.update)
jest.mock('../../models/turnaroundSignoff.model', () => mockTables.signoff)
jest.mock('../../models/turnaroundEscalation.model', () => mockTables.escalation)
jest.mock('../../models/turnaroundStaffing.model', () => mockTables.staffing)
jest.mock('../../models/turnaroundTaskDependency.model', () => mockTables.dependency)
jest.mock('../../models/turnaroundHandoff.model', () => mockTables.handoff)
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((field, value) => ({ type: 'eq', field, value })),
  inArray: jest.fn((field, values) => ({ type: 'inArray', field, values }))
}))

const mockRows = new Map()
function setRows(table, ...responses) {
  mockRows.set(table, responses)
}
function mockNextRows(table) {
  const queue = mockRows.get(table) || []
  return queue.length ? queue.shift() : []
}

jest.mock('../../db', () => ({
  select: jest.fn(() => ({
    from(table) {
      return {
        where() {
          const rows = mockNextRows(table)
          return {
            limit: async () => rows,
            then(resolve, reject) { return Promise.resolve(rows).then(resolve, reject) }
          }
        }
      }
    }
  }))
}))

jest.mock('../../services/auditEvent.service', () => ({
  listAuditEventsForOperation: jest.fn(async () => [{ id: 'AUDIT1' }])
}))

const artifactKeys = [
  'releasePacket', 'operationalTimeline', 'operationalMetrics', 'lifecycleState', 'playbookTemplate',
  'playbookVariance', 'incidentCommand', 'afterActionReview', 'executiveBrief', 'operationalAssurancePacket',
  'operationalBriefingBoard', 'managementStatus', 'launchPlan', 'scenarioPlan', 'productionReadiness',
  'operationalReleaseDossier', 'operationalReviewGuide', 'closeoutPacket', 'commandCenter', 'continuityCenter',
  'shiftBriefing', 'goLiveCenter', 'operationsControlBoard'
]
const mockBuildArtifacts = jest.fn(() => Object.fromEntries(artifactKeys.map(key => [key, { key }])))
jest.mock('../../services/turnaroundOperationalArtifacts.service', () => ({
  buildTurnaroundOperationalArtifacts: (...args) => mockBuildArtifacts(...args)
}))

const { getTurnaroundOperationDetails } = require('../../services/turnaroundOperationDetails.service')

describe('turnaround operation details branch coverage', () => {
  beforeEach(() => {
    mockRows.clear()
    mockBuildArtifacts.mockClear()
  })

  test('assembles a complete hierarchy with enriched people, passengers, cleared dependencies, and ready status', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL1', shipId: 'SHIP1' }])
    setRows(mockTables.ship, [{ id: 'SHIP1', cruiseLineId: 'CL1' }])
    setRows(mockTables.cruiseLine, [{ id: 'CL1', name: 'Line' }])
    setRows(mockTables.task, [
      { id: 'T2', taskName: 'Second', status: 'COMPLETE', sortOrder: 2, ownerUserId: 'U1' },
      { id: 'T1', taskName: 'First', status: 'COMPLETE', sortOrder: 1, ownerUserId: null, ownerName: 'Fallback owner' }
    ])
    setRows(mockTables.signoff, [{ id: 'S1', departmentRole: 'Bridge', status: 'APPROVED', approverUserId: 'U2' }])
    setRows(mockTables.escalation, [{ id: 'E1', status: 'RESOLVED', severity: 'LOW', createdAt: '2026-08-14T10:00:00Z', ownerUserId: 'U3' }])
    setRows(mockTables.staffing, [{ departmentRole: 'Hotel', plannedCount: 2, checkedInCount: 2 }])
    setRows(mockTables.dependency, [
      { id: 'D1', status: 'CLEARED', taskId: 'T2', dependsOnTaskId: 'T1' },
      { id: 'D2', status: 'CLEARED', taskId: 'missing', dependsOnTaskId: 'missing2' }
    ])
    setRows(mockTables.handoff, [{ id: 'H1', status: 'COMPLETE', dueTime: '10:00', ownerUserId: 'U4' }])
    setRows(mockTables.update,
      [{ id: 'UP2', createdAt: '2026-08-14T10:00:00Z', authorUserId: 'U5' }],
      [{ id: 'UP1', createdAt: '2026-08-14T11:00:00Z', authorUserId: null, authorName: 'Fallback author' }]
    )
    setRows(mockTables.user, [[
      { id: 'U1', displayName: 'Owner One' }, { id: 'U2', displayName: 'Approver' },
      { id: 'U3', displayName: 'Escalation Owner' }, { id: 'U4', displayName: 'Handoff Owner' },
      { id: 'U5', displayName: 'Update Author' }
    ]])
    setRows(mockTables.booking, [{ id: 'B1' }, { id: 'B2' }])
    setRows(mockTables.passenger, [{ id: 'P1' }, { id: 'P2' }], [{ id: 'P3' }])

    const result = await getTurnaroundOperationDetails({ id: 'OP1', sailingId: 'SAIL1', status: 'COMMAND', readinessLevel: 'RAW' })

    expect(result).toEqual(expect.objectContaining({
      status: 'COMPLETE', readinessLevel: 'Ready for embarkation', passengerCount: 3,
      ship: expect.objectContaining({ id: 'SHIP1' }), cruiseLine: expect.objectContaining({ id: 'CL1' })
    }))
    expect(result.staffingSummary).toEqual(expect.objectContaining({ gapCount: 0, checkInPercent: 100 }))
    expect(result.dependencySummary).toEqual({ totalDependencies: 2, activeDependencies: 0, clearedDependencies: 2 })
    expect(result.taskDependencies[1]).toEqual(expect.objectContaining({ taskName: 'Unknown task', dependsOnTaskName: 'Unknown prerequisite' }))
    expect(result.tasks[0]).toEqual(expect.objectContaining({ id: 'T1', ownerDisplayName: 'Fallback owner' }))
    expect(mockBuildArtifacts).toHaveBeenCalledWith(expect.objectContaining({ passengerCount: 3 }))
  })

  test('derives blocked readiness from blocked work, signoffs, and critical escalations without hierarchy metadata', async () => {
    setRows(mockTables.sailing, [])
    setRows(mockTables.task, [{ id: 'T1', taskName: 'Blocked', status: 'BLOCKED', sortOrder: 0 }])
    setRows(mockTables.signoff, [{ departmentRole: 'Security', status: 'BLOCKED' }])
    setRows(mockTables.escalation, [{ status: 'OPEN', severity: 'CRITICAL', createdAt: '2026-08-14T12:00:00Z' }])
    setRows(mockTables.staffing, [{ departmentRole: 'Security', plannedCount: 5, checkedInCount: 2 }])
    setRows(mockTables.dependency, [{ status: 'ACTIVE', taskId: 'T1', dependsOnTaskId: 'T1' }])
    setRows(mockTables.handoff, [{ status: 'BLOCKED', dueTime: null }])
    setRows(mockTables.update, [])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP2', sailingId: 'SAIL2' })
    expect(result.status).toBe('BLOCKED')
    expect(result.readinessLevel).toBe('Blocked')
    expect(result.ship).toBeNull()
    expect(result.cruiseLine).toBeNull()
    expect(result.staffingSummary).toEqual(expect.objectContaining({ gapCount: 3, checkInPercent: 40 }))
    expect(result.handoffSummary).toEqual(expect.objectContaining({ blockedHandoffs: 1, openHandoffs: 1 }))
  })


  test('does not report embarkation readiness while staffing, dependency, or handoff release blockers remain', async () => {
    async function runReleaseCandidate({ staffing, dependencies, handoffs }) {
      mockRows.clear()
      setRows(mockTables.sailing, [{ id: 'SAIL-R', shipId: null }])
      setRows(mockTables.task, [{ id: 'T-R', taskName: 'Complete task', status: 'COMPLETE', sortOrder: 1 }])
      setRows(mockTables.signoff, [{ departmentRole: 'Bridge', status: 'APPROVED' }])
      setRows(mockTables.escalation, [])
      setRows(mockTables.staffing, staffing)
      setRows(mockTables.dependency, dependencies)
      setRows(mockTables.handoff, handoffs)
      setRows(mockTables.update, [])
      setRows(mockTables.booking, [])
      return getTurnaroundOperationDetails({ id: 'OP-R', sailingId: 'SAIL-R' })
    }

    const staffingBlocked = await runReleaseCandidate({
      staffing: [{ departmentRole: 'Hotel', plannedCount: 4, checkedInCount: 3 }],
      dependencies: [],
      handoffs: []
    })
    expect(staffingBlocked.status).toBe('COMPLETE')
    expect(staffingBlocked.readinessLevel).toBe('Blocked')

    const dependencyBlocked = await runReleaseCandidate({
      staffing: [{ departmentRole: 'Hotel', plannedCount: 4, checkedInCount: 4 }],
      dependencies: [{ id: 'D-R', status: 'ACTIVE', taskId: 'T-R', dependsOnTaskId: 'T-R' }],
      handoffs: []
    })
    expect(dependencyBlocked.readinessLevel).toBe('Blocked')

    const handoffBlocked = await runReleaseCandidate({
      staffing: [{ departmentRole: 'Hotel', plannedCount: 4, checkedInCount: 4 }],
      dependencies: [],
      handoffs: [{ id: 'H-R', status: 'PENDING', dueTime: '12:00' }]
    })
    expect(handoffBlocked.readinessLevel).toBe('Blocked')
  })

  test('derives in-progress and planning states including zero-denominator summaries', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL3', shipId: null }])
    setRows(mockTables.task, [{ id: 'T1', taskName: 'Started', status: 'IN_PROGRESS', sortOrder: null }])
    setRows(mockTables.signoff, [{ departmentRole: 'Hotel', status: 'PENDING' }])
    setRows(mockTables.escalation, [{ status: 'MONITORING', severity: 'MEDIUM' }])
    setRows(mockTables.staffing, [{ departmentRole: 'Hotel', plannedCount: 0, checkedInCount: 0 }])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [])
    setRows(mockTables.update, [])
    setRows(mockTables.booking, [])
    let result = await getTurnaroundOperationDetails({ id: 'OP3', sailingId: 'SAIL3' })
    expect(result.status).toBe('IN_PROGRESS')
    expect(result.readinessLevel).toBe('In progress')
    expect(result.staffingSummary.checkInPercent).toBe(0)

    mockRows.clear()
    setRows(mockTables.sailing, [{ id: 'SAIL4', shipId: null }])
    setRows(mockTables.task, [])
    setRows(mockTables.signoff, [])
    setRows(mockTables.escalation, [])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [])
    setRows(mockTables.booking, [])
    result = await getTurnaroundOperationDetails({ id: 'OP4', sailingId: 'SAIL4' })
    expect(result.status).toBe('PLANNED')
    expect(result.readinessLevel).toBe('Planning')
    expect(result.taskSummary.completionPercent).toBe(0)
    expect(result.signoffSummary.approvalPercent).toBe(0)
  })
})

describe('turnaround operation details resilience and coverage hardening', () => {
  beforeEach(() => {
    mockRows.clear()
    mockBuildArtifacts.mockClear()
  })

  test('caps overstaffed operations at 100 percent so release scoring cannot be inflated', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-OVER', shipId: null }])
    setRows(mockTables.task, [])
    setRows(mockTables.signoff, [])
    setRows(mockTables.escalation, [])
    setRows(mockTables.staffing, [{ departmentRole: 'Hotel', plannedCount: 4, checkedInCount: 6 }])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-OVER', sailingId: 'SAIL-OVER' })

    expect(result.staffingSummary).toEqual({
      totalDepartments: 1,
      plannedCount: 4,
      checkedInCount: 6,
      gapCount: 0,
      checkInPercent: 100
    })
    expect(mockBuildArtifacts).toHaveBeenCalledWith(expect.objectContaining({
      staffing: [expect.objectContaining({ plannedCount: 4, checkedInCount: 6 })]
    }))
  })

  test('keeps hierarchy resolution fail-soft when a sailing points to a missing ship', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-NO-SHIP', shipId: 'SHIP-MISSING' }])
    setRows(mockTables.ship, [])
    setRows(mockTables.task, [])
    setRows(mockTables.signoff, [])
    setRows(mockTables.escalation, [])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-NO-SHIP', sailingId: 'SAIL-NO-SHIP' })

    expect(result.sailing).toEqual(expect.objectContaining({ id: 'SAIL-NO-SHIP' }))
    expect(result.ship).toBeNull()
    expect(result.cruiseLine).toBeNull()
  })

  test('keeps hierarchy resolution fail-soft when a ship has no cruise-line relationship', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-NO-LINE', shipId: 'SHIP-NO-LINE' }])
    setRows(mockTables.ship, [{ id: 'SHIP-NO-LINE', cruiseLineId: null }])
    setRows(mockTables.task, [])
    setRows(mockTables.signoff, [])
    setRows(mockTables.escalation, [])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-NO-LINE', sailingId: 'SAIL-NO-LINE' })

    expect(result.ship).toEqual(expect.objectContaining({ id: 'SHIP-NO-LINE' }))
    expect(result.cruiseLine).toBeNull()
  })

  test('uses embedded person labels when no authoritative app-user ids are available', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-LABELS', shipId: null }])
    setRows(mockTables.task, [{ id: 'T-L', taskName: 'Label task', status: 'COMPLETE', ownerDisplayName: 'Embedded owner' }])
    setRows(mockTables.signoff, [{ departmentRole: 'Hotel', status: 'APPROVED', approverName: 'Embedded approver' }])
    setRows(mockTables.escalation, [{ id: 'E-L', status: 'RESOLVED', severity: 'LOW', ownerName: 'Embedded escalation owner' }])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [{ id: 'H-L', status: 'COMPLETE', leadName: 'Embedded handoff lead' }])
    setRows(mockTables.update, [{ id: 'UP-L', authorName: 'Embedded author' }])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-LABELS', sailingId: 'SAIL-LABELS' })

    expect(result.tasks[0].ownerDisplayName).toBe('Embedded owner')
    expect(result.tasks[0].updates[0].authorDisplayName).toBe('Embedded author')
    expect(result.signoffs[0].approverDisplayName).toBe('Embedded approver')
    expect(result.escalations[0].ownerDisplayName).toBe('Embedded escalation owner')
    expect(result.handoffs[0].ownerDisplayName).toBe('Embedded handoff lead')
  })

  test('derives in-progress readiness from completed work or approved signoffs even without active tasks', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-PROGRESS', shipId: null }])
    setRows(mockTables.task, [{ id: 'T-P', taskName: 'Done', status: 'COMPLETE' }, { id: 'T-Q', taskName: 'Queued', status: 'PLANNED' }])
    setRows(mockTables.signoff, [{ departmentRole: 'Bridge', status: 'APPROVED' }, { departmentRole: 'Hotel', status: 'PENDING' }])
    setRows(mockTables.escalation, [])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [])
    setRows(mockTables.update, [], [])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-PROGRESS', sailingId: 'SAIL-PROGRESS' })

    expect(result.status).toBe('IN_PROGRESS')
    expect(result.readinessLevel).toBe('In progress')
    expect(result.taskSummary).toEqual(expect.objectContaining({ totalTasks: 2, completeTasks: 1, completionPercent: 50 }))
    expect(result.signoffSummary).toEqual(expect.objectContaining({ approvedSignoffs: 1, pendingSignoffs: 1, approvalPercent: 50 }))
  })

  test('counts monitoring and resolved escalations and excludes resolved critical items from release blockers', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-ESC', shipId: null }])
    setRows(mockTables.task, [])
    setRows(mockTables.signoff, [])
    setRows(mockTables.escalation, [
      { id: 'E1', status: 'OPEN', severity: 'MEDIUM', createdAt: '2026-08-17T10:00:00Z' },
      { id: 'E2', status: 'MONITORING', severity: 'HIGH', createdAt: '2026-08-17T11:00:00Z' },
      { id: 'E3', status: 'RESOLVED', severity: 'CRITICAL', createdAt: '2026-08-17T12:00:00Z' }
    ])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-ESC', sailingId: 'SAIL-ESC' })

    expect(result.escalationSummary).toEqual({
      totalEscalations: 3,
      openEscalations: 1,
      monitoringEscalations: 1,
      resolvedEscalations: 1,
      criticalEscalations: 0
    })
    expect(result.status).toBe('PLANNED')
    expect(result.readinessLevel).toBe('Planning')
    expect(result.escalations.map(item => item.id)).toEqual(['E3', 'E2', 'E1'])
  })

  test('normalizes malformed staffing counts so readiness evidence remains finite', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-BAD-STAFF', shipId: null }])
    setRows(mockTables.task, [])
    setRows(mockTables.signoff, [])
    setRows(mockTables.escalation, [])
    setRows(mockTables.staffing, [
      { departmentRole: 'Hotel', plannedCount: 'bad', checkedInCount: Infinity },
      { departmentRole: 'Engineering', plannedCount: 5.9, checkedInCount: 2.2 },
      { departmentRole: 'Security', plannedCount: -3, checkedInCount: -1 }
    ])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-BAD-STAFF', sailingId: 'SAIL-BAD-STAFF' })

    expect(result.staffingSummary).toEqual({
      totalDepartments: 3,
      plannedCount: 5,
      checkedInCount: 2,
      gapCount: 3,
      checkInPercent: 40
    })
    expect(result.readinessLevel).toBe('Blocked')
    expect(Object.values(result.staffingSummary).every(value => Number.isFinite(value))).toBe(true)
  })

  test('evaluates signoff-only and escalation-only blocker branches independently', async () => {
    async function run({ signoffs = [], escalations = [] }) {
      mockRows.clear()
      setRows(mockTables.sailing, [{ id: 'SAIL-BRANCH', shipId: null }])
      setRows(mockTables.task, [])
      setRows(mockTables.signoff, signoffs)
      setRows(mockTables.escalation, escalations)
      setRows(mockTables.staffing, [])
      setRows(mockTables.dependency, [])
      setRows(mockTables.handoff, [])
      setRows(mockTables.booking, [])
      return getTurnaroundOperationDetails({ id: 'OP-BRANCH', sailingId: 'SAIL-BRANCH' })
    }

    const signoffBlocked = await run({ signoffs: [{ departmentRole: 'Bridge', status: 'BLOCKED' }] })
    expect(signoffBlocked.status).toBe('PLANNED')
    expect(signoffBlocked.readinessLevel).toBe('Blocked')

    const escalationBlocked = await run({ escalations: [{ id: 'E-C', status: 'OPEN', severity: 'CRITICAL' }] })
    expect(escalationBlocked.status).toBe('BLOCKED')
    expect(escalationBlocked.readinessLevel).toBe('Blocked')
  })

  test('derives in-progress readiness from an approved signoff when no task progress exists', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-SIGNOFF', shipId: null }])
    setRows(mockTables.task, [])
    setRows(mockTables.signoff, [{ departmentRole: 'Bridge', status: 'APPROVED' }, { departmentRole: 'Hotel', status: 'PENDING' }])
    setRows(mockTables.escalation, [])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-SIGNOFF', sailingId: 'SAIL-SIGNOFF' })

    expect(result.status).toBe('PLANNED')
    expect(result.readinessLevel).toBe('In progress')
    expect(result.signoffSummary.approvalPercent).toBe(50)
  })

  test('uses authoritative user display names and sorts task updates newest first', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-USERS', shipId: null }])
    setRows(mockTables.task, [{ id: 'T-USERS', taskName: 'User task', status: 'IN_PROGRESS', sortOrder: 'bad', ownerUserId: 'U-OWNER', ownerName: 'Stale owner' }])
    setRows(mockTables.signoff, [{ departmentRole: 'Bridge', status: 'PENDING', approverUserId: 'U-APPROVER', approverName: 'Stale approver' }])
    setRows(mockTables.escalation, [{ id: 'E-USERS', status: 'MONITORING', severity: 'LOW', ownerUserId: 'U-ESC', ownerName: 'Stale escalation' }])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [{ id: 'H-USERS', status: 'COMPLETE', ownerUserId: 'U-HANDOFF', ownerName: 'Stale handoff' }])
    setRows(mockTables.update, [
      { id: 'UP-OLD', createdAt: '2026-08-17T10:00:00Z', authorUserId: 'U-AUTHOR' },
      { id: 'UP-NEW', createdAt: '2026-08-17T12:00:00Z', authorUserId: 'U-AUTHOR' }
    ])
    setRows(mockTables.user, [
      { id: 'U-OWNER', displayName: 'Authoritative owner' },
      { id: 'U-APPROVER', displayName: 'Authoritative approver' },
      { id: 'U-ESC', displayName: 'Authoritative escalation' },
      { id: 'U-HANDOFF', displayName: 'Authoritative handoff' },
      { id: 'U-AUTHOR', displayName: 'Authoritative author' }
    ])
    setRows(mockTables.booking, [{ id: 'B-EMPTY' }])
    setRows(mockTables.passenger, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-USERS', sailingId: 'SAIL-USERS' })

    expect(result.tasks[0].ownerDisplayName).toBe('Authoritative owner')
    expect(result.tasks[0].updates.map(update => update.id)).toEqual(['UP-NEW', 'UP-OLD'])
    expect(result.tasks[0].updates[0].authorDisplayName).toBe('Authoritative author')
    expect(result.signoffs[0].approverDisplayName).toBe('Authoritative approver')
    expect(result.escalations[0].ownerDisplayName).toBe('Authoritative escalation')
    expect(result.handoffs[0].ownerDisplayName).toBe('Authoritative handoff')
    expect(result.passengerCount).toBe(0)
  })

  test('normalizes persisted operational status casing before deriving release readiness', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-CASE', shipId: null }])
    setRows(mockTables.task, [{ id: 'T-CASE', taskName: 'Complete task', status: ' complete ', sortOrder: 1 }])
    setRows(mockTables.signoff, [{ departmentRole: 'Bridge', status: 'approved' }])
    setRows(mockTables.escalation, [{ id: 'E-CASE', status: ' resolved ', severity: 'critical' }])
    setRows(mockTables.staffing, [{ departmentRole: 'Hotel', plannedCount: 2, checkedInCount: 2 }])
    setRows(mockTables.dependency, [{ id: 'D-CASE', status: 'cleared', taskId: 'T-CASE', dependsOnTaskId: 'T-CASE' }])
    setRows(mockTables.handoff, [{ id: 'H-CASE', status: 'complete', dueTime: '12:00' }])
    setRows(mockTables.update, [])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-CASE', sailingId: 'SAIL-CASE' })

    expect(result.status).toBe('COMPLETE')
    expect(result.readinessLevel).toBe('Ready for embarkation')
    expect(result.escalationSummary).toEqual(expect.objectContaining({ resolvedEscalations: 1, criticalEscalations: 0 }))
    expect(result.dependencySummary).toEqual(expect.objectContaining({ activeDependencies: 0, clearedDependencies: 1 }))
    expect(result.handoffSummary).toEqual(expect.objectContaining({ completedHandoffs: 1, openHandoffs: 0 }))
  })

  test('still recognizes lowercase active blocker evidence after status normalization', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-LOW-BLOCK', shipId: null }])
    setRows(mockTables.task, [{ id: 'T-LOW-BLOCK', taskName: 'Blocked task', status: 'blocked' }])
    setRows(mockTables.signoff, [])
    setRows(mockTables.escalation, [{ id: 'E-LOW-BLOCK', status: 'open', severity: 'critical' }])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [])
    setRows(mockTables.update, [])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-LOW-BLOCK', sailingId: 'SAIL-LOW-BLOCK' })

    expect(result.status).toBe('BLOCKED')
    expect(result.readinessLevel).toBe('Blocked')
    expect(result.taskSummary.blockedTasks).toBe(1)
    expect(result.escalationSummary.criticalEscalations).toBe(1)
  })


  test('sorts malformed and non-finite task order values deterministically instead of leaking NaN ordering', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-SORT', shipId: null }])
    setRows(mockTables.task, [
      { id: 'T-INF', taskName: 'Infinite order', status: 'PLANNED', sortOrder: Infinity },
      { id: 'T-BAD', taskName: 'Malformed order', status: 'PLANNED', sortOrder: 'bad' },
      { id: 'T-TWO', taskName: 'Second', status: 'PLANNED', sortOrder: 2 },
      { id: 'T-ONE', taskName: 'First', status: 'PLANNED', sortOrder: 1 }
    ])
    setRows(mockTables.signoff, [])
    setRows(mockTables.escalation, [])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [])
    setRows(mockTables.update, [], [], [], [])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-SORT', sailingId: 'SAIL-SORT' })

    expect(result.tasks.map(task => task.id)).toEqual(['T-INF', 'T-BAD', 'T-ONE', 'T-TWO'])
    expect(result.taskSummary.totalTasks).toBe(4)
  })


  test('keeps hierarchy and person enrichment fail-soft across missing cruise line and fallback display fields', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-FALLBACKS', shipId: 'SHIP-FALLBACKS' }])
    setRows(mockTables.ship, [{ id: 'SHIP-FALLBACKS', cruiseLineId: 'CL-MISSING' }])
    setRows(mockTables.cruiseLine, [])
    setRows(mockTables.task, [{ id: 'T-FALLBACKS', taskName: 'Fallback task', status: 'IN_PROGRESS', sortOrder: 1, ownerUserId: 'U-MISSING', ownerDisplayName: 'Embedded task owner' }])
    setRows(mockTables.signoff, [{ id: 'S-FALLBACKS', departmentRole: 'Bridge', status: 'PENDING', approverName: 'Embedded approver' }])
    setRows(mockTables.escalation, [{ id: 'E-FALLBACKS', status: 'MONITORING', severity: 'LOW', ownerName: 'Embedded escalation owner', createdAt: null }])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [{ id: 'H-FALLBACKS', status: 'PENDING', leadName: 'Embedded handoff lead', dueTime: null }])
    setRows(mockTables.update, [{ id: 'UP-FALLBACKS', authorName: 'Embedded update author', createdAt: null }])
    setRows(mockTables.user, [])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-FALLBACKS', sailingId: 'SAIL-FALLBACKS' })

    expect(result.ship).toEqual(expect.objectContaining({ id: 'SHIP-FALLBACKS' }))
    expect(result.cruiseLine).toBeNull()
    expect(result.tasks[0].ownerDisplayName).toBe('Embedded task owner')
    expect(result.tasks[0].updates[0].authorDisplayName).toBe('Embedded update author')
    expect(result.signoffs[0].approverDisplayName).toBe('Embedded approver')
    expect(result.escalations[0].ownerDisplayName).toBe('Embedded escalation owner')
    expect(result.handoffs[0].ownerDisplayName).toBe('Embedded handoff lead')
    expect(result.readinessLevel).toBe('Blocked')
  })

})

describe('turnaround operation details malformed collection hardening', () => {
  beforeEach(() => {
    mockRows.clear()
    mockBuildArtifacts.mockClear()
  })

  test('treats malformed operational row collections as empty instead of throwing', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-MALFORMED', shipId: null }])
    setRows(mockTables.task, { not: 'an array' })
    setRows(mockTables.signoff, { not: 'an array' })
    setRows(mockTables.escalation, 'bad')
    setRows(mockTables.staffing, 7)
    setRows(mockTables.dependency, null)
    setRows(mockTables.handoff, { bad: true })
    setRows(mockTables.booking, { bad: true })

    const result = await getTurnaroundOperationDetails({ id: 'OP-MALFORMED', sailingId: 'SAIL-MALFORMED' })

    expect(result.tasks).toEqual([])
    expect(result.signoffs).toEqual([])
    expect(result.escalations).toEqual([])
    expect(result.staffing).toEqual([])
    expect(result.taskDependencies).toEqual([])
    expect(result.handoffs).toEqual([])
    expect(result.passengerCount).toBe(0)
    expect(result.status).toBe('PLANNED')
    expect(result.readinessLevel).toBe('Planning')
  })

  test('ignores malformed passenger query results instead of corrupting passenger evidence', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-PAX', shipId: null }])
    setRows(mockTables.task, [])
    setRows(mockTables.signoff, [])
    setRows(mockTables.escalation, [])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [])
    setRows(mockTables.booking, [{ id: 'B-PAX' }])
    setRows(mockTables.passenger, { malformed: true })

    const result = await getTurnaroundOperationDetails({ id: 'OP-PAX', sailingId: 'SAIL-PAX' })

    expect(result.passengerCount).toBe(0)
    expect(mockBuildArtifacts).toHaveBeenCalledWith(expect.objectContaining({ passengerCount: 0 }))
  })
})

describe('turnaround operation equivalent terminal and malformed hierarchy hardening', () => {
  beforeEach(() => {
    mockRows.clear()
    mockBuildArtifacts.mockClear()
  })

  test('treats equivalent terminal task, dependency, and handoff states as completed readiness evidence', async () => {
    setRows(mockTables.sailing, [{ id: 'SAIL-EQ', shipId: null }])
    setRows(mockTables.task, [{ id: 'T-EQ', taskName: 'Equivalent complete', status: ' completed ', sortOrder: 1 }])
    setRows(mockTables.signoff, [{ id: 'S-EQ', departmentRole: 'Bridge', status: ' approved ' }])
    setRows(mockTables.escalation, [])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [{ id: 'D-EQ', status: 'resolved', taskId: 'T-EQ', dependsOnTaskId: 'T-EQ' }])
    setRows(mockTables.handoff, [{ id: 'H-EQ', status: 'closed', dueTime: '11:00' }])
    setRows(mockTables.update, [])
    setRows(mockTables.booking, [])

    const result = await getTurnaroundOperationDetails({ id: 'OP-EQ', sailingId: 'SAIL-EQ' })

    expect(result).toEqual(expect.objectContaining({ status: 'COMPLETE', readinessLevel: 'Ready for embarkation' }))
    expect(result.taskSummary).toEqual(expect.objectContaining({ completeTasks: 1, completionPercent: 100 }))
    expect(result.dependencySummary).toEqual({ totalDependencies: 1, activeDependencies: 0, clearedDependencies: 1 })
    expect(result.handoffSummary).toEqual(expect.objectContaining({ completedHandoffs: 1, openHandoffs: 0 }))
  })

  test('fails soft when hierarchy and user lookup queries return malformed collection shapes', async () => {
    setRows(mockTables.sailing, null)
    setRows(mockTables.task, [{ id: 'T-M', taskName: 'Owner lookup', status: 'IN_PROGRESS', sortOrder: 1, ownerUserId: 'U-M' }])
    setRows(mockTables.signoff, [])
    setRows(mockTables.escalation, [])
    setRows(mockTables.staffing, [])
    setRows(mockTables.dependency, [])
    setRows(mockTables.handoff, [])
    setRows(mockTables.update, [])
    setRows(mockTables.user, null)
    setRows(mockTables.booking, null)

    const result = await getTurnaroundOperationDetails({ id: 'OP-M', sailingId: 'SAIL-M' })

    expect(result.sailing).toBeNull()
    expect(result.ship).toBeNull()
    expect(result.cruiseLine).toBeNull()
    expect(result.passengerCount).toBe(0)
    expect(result.tasks[0]).toEqual(expect.objectContaining({ ownerDisplayName: null }))
  })
})
