const shipTable = { id: 'ship.id' }
const sailingTable = { id: 'sailing.id', shipId: 'sailing.shipId' }
jest.mock('../../models/ship.model', () => shipTable)
jest.mock('../../models/sailing.model', () => sailingTable)
jest.mock('drizzle-orm', () => ({ eq: jest.fn((field, value) => ({ field, value })) }), { virtual: true })
jest.mock('../../services/platformAudit.service', () => ({ recordPlatformAuditEvent: jest.fn() }))
jest.mock('../../services/sailingAuditScope.service', () => ({ getSailingAuditScope: jest.fn(async () => ({ cruiseLineId: 'CL1', shipId: 'SHIP1', sailingId: 'SAIL1' })) }))
jest.mock('../../services/entityHistory.service', () => ({
  buildEntityHistoryPayload: jest.fn(value => value),
  buildEntityLifecycleTimestamps: jest.fn(() => ({ createdAt: 'now', updatedAt: 'now' })),
  buildEntityUpdateTimestamp: jest.fn(() => ({ updatedAt: 'now' }))
}))
jest.mock('../../services/apiIdentityBridge.service', () => ({ withSailingApiIdentity: jest.fn(value => ({ ...value, identity: true })) }))
jest.mock('../../services/fleetHierarchy.service', () => ({ deleteItineraryForSailingIds: jest.fn() }))
jest.mock('../../db', () => ({ select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() }))

const db = require('../../db')
const audit = require('../../services/platformAudit.service')
const hierarchy = require('../../services/fleetHierarchy.service')
const controller = require('../../controllers/sailingManagement.controller')
const mockResponse = require('./helpers/mockResponse')

function selectLimit(rows) {
  db.select.mockReturnValueOnce({ from: jest.fn(() => ({ where: jest.fn(() => ({ limit: jest.fn().mockResolvedValue(rows) })) })) })
}
function selectRows(rows) {
  db.select.mockReturnValueOnce({ from: jest.fn(() => ({ where: jest.fn().mockResolvedValue(rows) })) })
}
function mutation(returnedRows) {
  const returning = jest.fn().mockResolvedValue(returnedRows)
  const where = jest.fn(() => ({ returning }))
  const set = jest.fn(() => ({ where }))
  return { set, where, returning }
}

beforeEach(() => jest.clearAllMocks())

describe('sailing management mutation hardening', () => {
  it('returns scoped sailings and rejects unknown ships', async () => {
    const missing = mockResponse(); selectLimit([])
    await controller.getSailingsByShip({ params: { shipId: 'MISSING' } }, missing, jest.fn())
    expect(missing.status).toHaveBeenCalledWith(404)

    const res = mockResponse(); selectLimit([{ id: 'SHIP1' }]); selectRows([{ id: 'S1' }])
    await controller.getSailingsByShip({ params: { shipId: 'SHIP1' } }, res, jest.fn())
    expect(res.json).toHaveBeenCalledWith([{ id: 'S1', identity: true }])
  })

  it('fails closed when a sailing disappears before update and writes no audit success', async () => {
    const res = mockResponse(); selectLimit([{ id: 'SAIL1', shipId: 'SHIP1' }])
    const m = mutation([]); db.update.mockReturnValueOnce({ set: m.set })

    await controller.updateSailing({ params: { id: 'SAIL1' }, body: { departureDate: '2027-01-01', departurePort: 'MIA', arrivalPort: 'NAS', days: 4 } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(audit.recordPlatformAuditEvent).not.toHaveBeenCalled()
  })

  it('audits a database-confirmed sailing update', async () => {
    const res = mockResponse(); selectLimit([{ id: 'SAIL1', shipId: 'SHIP1' }])
    const m = mutation([{ id: 'SAIL1' }]); db.update.mockReturnValueOnce({ set: m.set })

    await controller.updateSailing({ params: { id: 'SAIL1' }, body: { departureDate: '2027-01-01', departurePort: 'MIA', arrivalPort: 'NAS', days: 4, isRepositioning: true } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(200)
    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ eventType: 'SAILING_UPDATED', entityId: 'SAIL1' }))
  })

  it('suppresses delete audit when the sailing concurrently disappears', async () => {
    const res = mockResponse(); selectLimit([{ id: 'SAIL1', shipId: 'SHIP1' }])
    const returning = jest.fn().mockResolvedValue([])
    db.delete.mockReturnValueOnce({ where: jest.fn(() => ({ returning })) })

    await controller.deleteSailing({ params: { id: 'SAIL1' } }, res, jest.fn())

    expect(hierarchy.deleteItineraryForSailingIds).toHaveBeenCalledWith(['SAIL1'])
    expect(res.status).toHaveBeenCalledWith(404)
    expect(audit.recordPlatformAuditEvent).not.toHaveBeenCalled()
  })

  it('creates and deletes sailings with authoritative audit ids', async () => {
    const createRes = mockResponse(); selectLimit([{ id: 'SHIP1', cruiseLineId: 'CL1' }])
    db.insert.mockReturnValueOnce({ values: jest.fn(() => ({ returning: jest.fn().mockResolvedValue([{ id: 'SAIL2' }]) })) })
    await controller.insertSailing({ params: { shipId: 'SHIP1' }, body: { departureDate: '2027-01-01', departurePort: 'MIA', arrivalPort: 'NAS', days: 4 } }, createRes, jest.fn())
    expect(createRes.status).toHaveBeenCalledWith(201)

    const deleteRes = mockResponse(); selectLimit([{ id: 'SAIL1', shipId: 'SHIP1' }])
    db.delete.mockReturnValueOnce({ where: jest.fn(() => ({ returning: jest.fn().mockResolvedValue([{ id: 'SAIL1' }]) })) })
    await controller.deleteSailing({ params: { id: 'SAIL1' } }, deleteRes, jest.fn())
    expect(deleteRes.status).toHaveBeenCalledWith(200)
    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ eventType: 'SAILING_DELETED', entityId: 'SAIL1', sailingId: null }))
  })
})
