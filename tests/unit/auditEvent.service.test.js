jest.mock('../../db', () => ({
  select: jest.fn(),
  insert: jest.fn()
}))

const db = require('../../db')
const auditEventTable = require('../../models/auditEvent.model')
const service = require('../../services/auditEvent.service')

function createSelectQuery(rows = []) {
  const query = {
    from: jest.fn(() => query),
    where: jest.fn(() => query),
    orderBy: jest.fn(() => query),
    limit: jest.fn(() => Promise.resolve(rows))
  }
  return query
}

function queueAuditRows(rows = []) {
  db.select.mockReturnValueOnce(createSelectQuery(rows))
}

describe('auditEvent service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    db.insert.mockReturnValue({ values: jest.fn().mockResolvedValue(undefined) })
  })

  it('normalizes audit limits into the supported range', () => {
    expect(service.normalizeAuditEventLimit()).toBe(25)
    expect(service.normalizeAuditEventLimit('bad')).toBe(25)
    expect(service.normalizeAuditEventLimit(0)).toBe(1)
    expect(service.normalizeAuditEventLimit(250)).toBe(100)
    expect(service.normalizeAuditEventLimit(8.8)).toBe(8)
  })

  it('parses JSON payloads and preserves raw payloads when parsing fails', () => {
    expect(service.parseAuditPayload()).toBeNull()
    expect(service.parseAuditPayload('{"status":"READY"}')).toEqual({ status: 'READY' })
    expect(service.parseAuditPayload('not json')).toBe('not json')
  })

  it('builds validated audit event values with serialized payloads', () => {
    expect(() => service.buildAuditEventValues({ entityType: 'TASK', entityId: '1' })).toThrow('Audit event type is required.')
    expect(() => service.buildAuditEventValues({ eventType: 'UPDATED', entityId: '1' })).toThrow('Audit entity type is required.')
    expect(() => service.buildAuditEventValues({ eventType: 'UPDATED', entityType: 'TASK' })).toThrow('Audit entity id is required.')

    const values = service.buildAuditEventValues({
      eventType: 'UPDATED',
      entityType: 'TASK',
      entityId: 'task-1',
      actorDisplayName: 'Alex Turner',
      eventPayload: { status: 'COMPLETE' },
      createdAt: '2026-01-01T00:00:00.000Z',
      createdAtTimestamp: new Date('2026-01-01T00:00:00.000Z')
    })

    expect(values).toEqual(expect.objectContaining({
      eventType: 'UPDATED',
      entityType: 'TASK',
      entityId: 'task-1',
      actorDisplayName: 'Alex Turner',
      source: 'APPLICATION',
      eventPayload: '{"status":"COMPLETE"}',
      createdAt: '2026-01-01T00:00:00.000Z',
      createdAtTimestamp: new Date('2026-01-01T00:00:00.000Z')
    }))
  })

  it('maps stored audit rows into API-safe payloads', () => {
    expect(service.mapAuditEvent({
      id: 'audit-1',
      eventType: 'UPDATED',
      entityType: 'TASK',
      entityId: 'task-1',
      actorUserId: 'user-1',
      actorDisplayName: 'Alex Turner',
      cruiseLineId: 'cruise-1',
      shipId: 'ship-1',
      sailingId: 'sailing-1',
      operationId: 'operation-1',
      source: 'TURNAROUND_OPERATIONS_API',
      eventPayload: '{"status":"COMPLETE"}',
      createdAt: '2026-01-01T00:00:00.000Z',
      createdAtTimestamp: new Date('2026-01-01T00:00:00.000Z')
    })).toEqual({
      id: 'audit-1',
      eventType: 'UPDATED',
      entityType: 'TASK',
      entityId: 'task-1',
      actorUserId: 'user-1',
      actorDisplayName: 'Alex Turner',
      cruiseLineId: 'cruise-1',
      shipId: 'ship-1',
      sailingId: 'sailing-1',
      operationId: 'operation-1',
      source: 'TURNAROUND_OPERATIONS_API',
      eventPayload: { status: 'COMPLETE' },
      createdAt: '2026-01-01T00:00:00.000Z',
      createdAtTimestamp: new Date('2026-01-01T00:00:00.000Z')
    })
  })

  it('lists audit events with filters and normalized limits', async () => {
    queueAuditRows([{ id: 'audit-1', eventType: 'UPDATED', entityType: 'TASK', entityId: 'task-1', eventPayload: null }])

    await expect(service.listAuditEvents({
      entityType: 'TASK',
      entityId: 'task-1',
      source: 'TURNAROUND_OPERATIONS_API'
    }, { limit: '250' })).resolves.toEqual([
      expect.objectContaining({ id: 'audit-1', eventType: 'UPDATED', entityType: 'TASK', entityId: 'task-1' })
    ])

    const query = db.select.mock.results[0].value
    expect(query.from).toHaveBeenCalledWith(auditEventTable)
    expect(query.where).toHaveBeenCalled()
    expect(query.orderBy).toHaveBeenCalled()
    expect(query.limit).toHaveBeenCalledWith(100)
  })

  it('lists operation audit history and returns an empty list without an operation id', async () => {
    await expect(service.listAuditEventsForOperation()).resolves.toEqual([])

    queueAuditRows([{ id: 'audit-2', eventType: 'CREATED', entityType: 'TURNAROUND_OPERATION', entityId: 'operation-1', operationId: 'operation-1' }])
    await expect(service.listAuditEventsForOperation('operation-1', { limit: 5 })).resolves.toEqual([
      expect.objectContaining({ id: 'audit-2', operationId: 'operation-1' })
    ])
  })

  it('records audit events through the audit table', async () => {
    const valuesChain = { values: jest.fn().mockResolvedValue(undefined) }
    db.insert.mockReturnValue(valuesChain)

    await expect(service.recordAuditEvent({
      eventType: 'CREATED',
      entityType: 'BOOKING',
      entityId: 'booking-1',
      eventPayload: 'already serialized',
      createdAt: '2026-01-01T00:00:00.000Z'
    })).resolves.toEqual(expect.objectContaining({
      eventType: 'CREATED',
      entityType: 'BOOKING',
      entityId: 'booking-1',
      eventPayload: 'already serialized'
    }))

    expect(db.insert).toHaveBeenCalledWith(auditEventTable)
    expect(valuesChain.values).toHaveBeenCalledWith(expect.objectContaining({ entityId: 'booking-1' }))
  })
})
