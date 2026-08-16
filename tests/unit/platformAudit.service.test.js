jest.mock('../../db', () => ({ select: jest.fn(), insert: jest.fn() }))
jest.mock('../../services/requestAuthorization.service', () => ({ resolveRequestAuditActor: jest.fn() }))
jest.mock('../../services/auditEvent.service', () => ({ recordAuditEvent: jest.fn() }))

const db = require('../../db')
const appUserTable = require('../../models/appUser.model')
const { resolveRequestAuditActor } = require('../../services/requestAuthorization.service')
const { recordAuditEvent } = require('../../services/auditEvent.service')
const service = require('../../services/platformAudit.service')

function selectQuery(rows = []) {
  const query = {
    from: jest.fn(() => query),
    where: jest.fn(() => query),
    limit: jest.fn(() => Promise.resolve(rows))
  }
  return query
}

function queueRows(...rowSets) {
  rowSets.forEach(rows => db.select.mockReturnValueOnce(selectQuery(rows)))
}

describe('platformAudit service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resolveRequestAuditActor.mockResolvedValue({
      actorUserId: 'admin-1',
      actorDisplayName: 'Admin One'
    })
    recordAuditEvent.mockImplementation(async event => event)
    db.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({ onConflictDoNothing: jest.fn().mockResolvedValue(undefined) })
    })
  })

  it('preserves actors without persistent user ids and existing actor rows', async () => {
    const anonymous = { actorUserId: null, actorDisplayName: 'Demo Session' }
    await expect(service.ensurePlatformAuditActor(anonymous)).resolves.toBe(anonymous)
    expect(db.select).not.toHaveBeenCalled()

    const existing = { actorUserId: 'admin-1', actorDisplayName: 'Admin One' }
    queueRows([{ id: 'admin-1' }])
    await expect(service.ensurePlatformAuditActor(existing)).resolves.toBe(existing)
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('creates a missing persistent audit actor with safe fallback identity fields', async () => {
    queueRows([])
    const actor = { actorUserId: 'ops-1', actorDisplayName: null }

    await expect(service.ensurePlatformAuditActor(actor)).resolves.toBe(actor)

    expect(db.insert).toHaveBeenCalledWith(appUserTable)
    const values = db.insert.mock.results[0].value.values
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      id: 'ops-1',
      displayName: 'ops-1',
      email: 'ops-1@cruise-explorer.local',
      userType: 'SYSTEM',
      status: 'ACTIVE'
    }))
  })

  it('resolves request actors into the audit attribution contract', async () => {
    queueRows([{ id: 'admin-1' }])
    await expect(service.resolvePlatformAuditActor({ requestIdentity: {} })).resolves.toEqual({
      actorUserId: 'admin-1',
      actorDisplayName: 'Admin One'
    })
  })

  it('builds empty, resolved, and stale ship audit scopes', async () => {
    await expect(service.getShipAuditScope()).resolves.toEqual({
      cruiseLineId: null, shipId: null, sailingId: null, operationId: null
    })

    queueRows([{ id: 'ship-1', cruiseLineId: 'line-1' }], [])
    await expect(service.getShipAuditScope('ship-1')).resolves.toEqual({
      cruiseLineId: 'line-1', shipId: 'ship-1', sailingId: null, operationId: null
    })
    await expect(service.getShipAuditScope('missing-ship')).resolves.toEqual({
      cruiseLineId: null, shipId: 'missing-ship', sailingId: null, operationId: null
    })
  })

  it('builds sailing scope from objects, ids, missing rows, and missing relations', async () => {
    queueRows([{ id: 'ship-1', cruiseLineId: 'line-1' }])
    await expect(service.getSailingAuditScope({ id: 'sailing-1', shipId: 'ship-1' })).resolves.toEqual({
      cruiseLineId: 'line-1', shipId: 'ship-1', sailingId: 'sailing-1', operationId: null
    })

    queueRows([{ id: 'sailing-2', shipId: 'ship-2' }], [{ id: 'ship-2', cruiseLineId: 'line-2' }], [])
    await expect(service.getSailingAuditScope('sailing-2')).resolves.toEqual({
      cruiseLineId: 'line-2', shipId: 'ship-2', sailingId: 'sailing-2', operationId: null
    })
    await expect(service.getSailingAuditScope('missing-sailing')).resolves.toEqual({
      cruiseLineId: null, shipId: null, sailingId: 'missing-sailing', operationId: null
    })
    await expect(service.getSailingAuditScope()).resolves.toEqual({
      cruiseLineId: null, shipId: null, sailingId: null, operationId: null
    })
  })

  it('builds booking scope from objects, ids, stale rows, and absent booking context', async () => {
    queueRows([{ id: 'sailing-1', shipId: 'ship-1' }], [{ id: 'ship-1', cruiseLineId: 'line-1' }])
    await expect(service.getBookingAuditScope({ id: 'booking-1', sailingId: 'sailing-1' })).resolves.toEqual({
      cruiseLineId: 'line-1', shipId: 'ship-1', sailingId: 'sailing-1', operationId: null
    })

    queueRows([{ id: 'booking-2', sailingId: 'sailing-2' }], [{ id: 'sailing-2', shipId: 'ship-2' }], [{ id: 'ship-2', cruiseLineId: 'line-2' }], [])
    await expect(service.getBookingAuditScope('booking-2')).resolves.toEqual({
      cruiseLineId: 'line-2', shipId: 'ship-2', sailingId: 'sailing-2', operationId: null
    })
    await expect(service.getBookingAuditScope('missing-booking')).resolves.toEqual({
      cruiseLineId: null, shipId: null, sailingId: null, operationId: null
    })
    await expect(service.getBookingAuditScope()).resolves.toEqual({
      cruiseLineId: null, shipId: null, sailingId: null, operationId: null
    })
  })

  it('prevents caller event data from spoofing the server-resolved audit actor', async () => {
    queueRows([{ id: 'admin-1' }])

    await service.recordPlatformAuditEvent({}, {
      eventType: 'UPDATED',
      entityType: 'SHIP',
      entityId: 'ship-1',
      actorUserId: 'spoofed-user',
      actorDisplayName: 'Spoofed Actor'
    })

    expect(recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      source: service.PLATFORM_AUDIT_SOURCE,
      actorUserId: 'admin-1',
      actorDisplayName: 'Admin One'
    }))
  })

  it('preserves an intentional workflow audit source while keeping server actor attribution authoritative', async () => {
    queueRows([{ id: 'admin-1' }])

    await service.recordPlatformAuditEvent({}, {
      eventType: 'CREATED',
      entityType: 'DEMO_USER',
      entityId: 'person-1',
      source: 'TURNAROUND_ADMIN_SETUP_API'
    })

    expect(recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      source: 'TURNAROUND_ADMIN_SETUP_API',
      actorUserId: 'admin-1',
      actorDisplayName: 'Admin One'
    }))
  })
})
