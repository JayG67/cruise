const mockSailingTable = { id: 'sailing.id' }
const mockShipTable = { id: 'ship.id' }
const mockAppUserTable = { id: 'user.id', displayName: 'user.displayName', assignedShipId: 'user.assignedShipId' }

jest.mock('../../models/sailing.model', () => mockSailingTable)
jest.mock('../../models/ship.model', () => mockShipTable)
jest.mock('../../models/appUser.model', () => mockAppUserTable)
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((field, value) => ({ type: 'eq', field, value })),
  like: jest.fn((field, value) => ({ type: 'like', field, value })),
  and: jest.fn((...clauses) => ({ type: 'and', clauses }))
}))
jest.mock('../../services/auditEvent.service', () => ({ recordAuditEvent: jest.fn(async event => event) }))
jest.mock('../../services/turnaroundScope.service', () => ({
  buildTurnaroundAuditContext: jest.fn(async () => ({ source: 'TURNAROUND_API', actorUserId: 'U1' }))
}))
jest.mock('../../services/entityHistory.service', () => ({
  buildEntityHistoryPayload: jest.fn(payload => payload)
}))

const mockSelectQueues = new Map()
function queueRows(table, ...rows) {
  mockSelectQueues.set(table, [...(mockSelectQueues.get(table) || []), ...rows])
}

jest.mock('../../db', () => ({
  select: jest.fn(() => ({
    from(table) {
      const where = () => ({
        limit: async () => (mockSelectQueues.get(table) || []).shift() || []
      })
      return { where }
    }
  }))
}))

const { recordAuditEvent } = require('../../services/auditEvent.service')
const { buildTurnaroundAuditContext } = require('../../services/turnaroundScope.service')
const {
  buildTurnaroundHistoryPayload,
  mergeTurnaroundEntity,
  recordTurnaroundAuditEvent,
  resolveOperationalUserIdByName
} = require('../../services/turnaroundMutationSupport.service')

describe('turnaround mutation support branch coverage', () => {
  beforeEach(() => {
    mockSelectQueues.clear()
    jest.clearAllMocks()
  })

  test('builds history safely with omitted and explicit values', () => {
    expect(buildTurnaroundHistoryPayload()).toEqual(expect.objectContaining({
      previous: null,
      next: null,
      entityRefs: { operationId: null, sailingId: null },
      metadata: { domain: 'turnaround-operations', historyShape: 'TURNAROUND_BEFORE_AFTER_V1' }
    }))
    expect(buildTurnaroundHistoryPayload({
      operation: { id: 'OP1', sailingId: 'SAIL1' }, previous: { a: 1 }, next: { a: 2 },
      entityRefs: { taskId: 'T1' }, metadata: { reason: 'test' }
    })).toEqual(expect.objectContaining({
      entityRefs: expect.objectContaining({ operationId: 'OP1', sailingId: 'SAIL1', taskId: 'T1' }),
      metadata: expect.objectContaining({ reason: 'test' })
    }))
    expect(mergeTurnaroundEntity()).toEqual({})
    expect(mergeTurnaroundEntity({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 })
  })

  test('records audit events using the server-derived turnaround context', async () => {
    await recordTurnaroundAuditEvent({ id: 'req' }, { id: 'OP1' }, { eventType: 'UPDATED' })
    expect(buildTurnaroundAuditContext).toHaveBeenCalled()
    expect(recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      source: 'TURNAROUND_API', actorUserId: 'U1', eventType: 'UPDATED'
    }))
  })

  test('resolves exact user names without hierarchy lookups', async () => {
    queueRows(mockAppUserTable, [{ id: 'U-exact' }])
    await expect(resolveOperationalUserIdByName('Alex')).resolves.toBe('U-exact')
  })

  test('returns null for empty names and missing assignments', async () => {
    await expect(resolveOperationalUserIdByName('')).resolves.toBeNull()
    queueRows(mockAppUserTable, [], [])
    await expect(resolveOperationalUserIdByName('Missing')).resolves.toBeNull()
  })

  test('prefers a ship-scoped prefixed user when the exact name is absent', async () => {
    queueRows(mockAppUserTable, [], [{ id: 'U-scoped' }])
    queueRows(mockSailingTable, [{ shipId: 'SHIP1' }])
    queueRows(mockShipTable, [{ id: 'SHIP1' }])
    await expect(resolveOperationalUserIdByName('Taylor', { sailingId: 'SAIL1' })).resolves.toBe('U-scoped')
  })

  test('falls back to an unscoped prefixed user when hierarchy metadata is incomplete', async () => {
    queueRows(mockAppUserTable, [], [{ id: 'U-prefix' }])
    queueRows(mockSailingTable, [])
    await expect(resolveOperationalUserIdByName('Morgan', { sailingId: 'SAIL1' })).resolves.toBe('U-prefix')

    mockSelectQueues.clear()
    queueRows(mockAppUserTable, [], [{ id: 'U-prefix-2' }])
    queueRows(mockSailingTable, [{ shipId: null }])
    await expect(resolveOperationalUserIdByName('Morgan', { sailingId: 'SAIL2' })).resolves.toBe('U-prefix-2')
  })
})
