jest.mock('../../db', () => ({
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
}))

jest.mock('../../services/platformAudit.service', () => ({
  recordPlatformAuditEvent: jest.fn()
}))

jest.mock('../../services/sailingAuditScope.service', () => ({
  getActivityAuditScope: jest.fn(),
  getItineraryDayAuditScope: jest.fn(),
  getSailingAuditScope: jest.fn()
}))

jest.mock('../../services/fleetHierarchy.service', () => ({
  deleteActivitiesForItineraryDayIds: jest.fn()
}))

const db = require('../../db')
const { recordPlatformAuditEvent } = require('../../services/platformAudit.service')
const {
  getActivityAuditScope,
  getItineraryDayAuditScope,
  getSailingAuditScope
} = require('../../services/sailingAuditScope.service')
const { deleteActivitiesForItineraryDayIds } = require('../../services/fleetHierarchy.service')
const controller = require('../../controllers/itineraryManagement.controller')

function response() {
  const res = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

function mockSelectRows(rows) {
  const limit = jest.fn().mockResolvedValue(rows)
  const where = jest.fn(() => ({ limit }))
  const from = jest.fn(() => ({ where }))
  db.select.mockReturnValueOnce({ from })
  return { from, where, limit }
}

function mockUpdateRows(rows) {
  const returning = jest.fn().mockResolvedValue(rows)
  const where = jest.fn(() => ({ returning }))
  const set = jest.fn(() => ({ where }))
  db.update.mockReturnValueOnce({ set })
  return { set, where, returning }
}


function mockDeleteRows(rows) {
  const returning = jest.fn().mockResolvedValue(rows)
  const where = jest.fn(() => ({ returning }))
  db.delete.mockReturnValueOnce({ where })
  return { where, returning }
}

function mockInsertRows(rows) {
  const returning = jest.fn().mockResolvedValue(rows)
  const values = jest.fn(() => ({ returning }))
  db.insert.mockReturnValueOnce({ values })
  return { values, returning }
}

describe('itineraryManagement controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getSailingAuditScope.mockResolvedValue({ sailingId: 'sailing-1', shipId: 'ship-1', cruiseLineId: 'line-1' })
    getItineraryDayAuditScope.mockResolvedValue({ sailingId: 'sailing-1', shipId: 'ship-1', cruiseLineId: 'line-1' })
    getActivityAuditScope.mockResolvedValue({ sailingId: 'sailing-1', shipId: 'ship-1', cruiseLineId: 'line-1' })
  })

  it('rejects invalid itinerary-day payloads before persistence', async () => {
    const res = response()
    const next = jest.fn()

    await controller.insertItineraryDay({ params: { sailingId: 'sailing-1' }, body: { day: 0, title: ' ', port: '' } }, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Validation failed',
      errors: expect.arrayContaining([
        expect.objectContaining({ field: 'day' }),
        expect.objectContaining({ field: 'title' }),
        expect.objectContaining({ field: 'port' })
      ])
    }))
    expect(db.select).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 404 when an itinerary-day create references a missing sailing', async () => {
    mockSelectRows([])
    const res = response()

    await controller.insertItineraryDay({ params: { sailingId: 'missing' }, body: { day: 1, title: 'Embark', port: 'Miami' } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(recordPlatformAuditEvent).not.toHaveBeenCalled()
  })

  it('creates an itinerary day and its supplied activities with audit evidence', async () => {
    mockSelectRows([{ id: 'sailing-1', shipId: 'ship-1' }])
    const dayInsert = mockInsertRows([{ id: 'day-1' }])
    const activityInsert = mockInsertRows([{ id: 'activity-1' }])
    const res = response()

    await controller.insertItineraryDay({
      params: { sailingId: 'sailing-1' },
      body: { day: 1, title: 'Embarkation', port: 'Miami', activitySchedule: [{ time: '10:00', activity: 'Boarding' }] }
    }, res, jest.fn())

    expect(dayInsert.values).toHaveBeenCalledWith(expect.objectContaining({ sailingId: 'sailing-1', day: 1 }))
    expect(activityInsert.values).toHaveBeenCalledWith(expect.objectContaining({ itineraryDayId: 'day-1', activity: 'Boarding' }))
    expect(recordPlatformAuditEvent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      eventType: 'ITINERARY_DAY_CREATED',
      entityId: 'day-1',
      eventPayload: expect.objectContaining({ createdActivityIds: ['activity-1'] })
    }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('fails closed when an itinerary day disappears between read and update', async () => {
    mockSelectRows([{ id: 'day-1', sailingId: 'sailing-1', title: 'Old' }])
    mockUpdateRows([])
    const res = response()

    await controller.updateItineraryDay({ params: { id: 'day-1' }, body: { day: 2, title: 'New', port: 'Nassau' } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(getItineraryDayAuditScope).not.toHaveBeenCalled()
    expect(recordPlatformAuditEvent).not.toHaveBeenCalled()
  })

  it('audits a database-confirmed itinerary day update', async () => {
    const existing = { id: 'day-1', sailingId: 'sailing-1', title: 'Old' }
    mockSelectRows([existing])
    mockUpdateRows([{ id: 'day-1' }])
    const res = response()

    await controller.updateItineraryDay({ params: { id: 'day-1' }, body: { day: 2, title: 'New', port: 'Nassau' } }, res, jest.fn())

    expect(recordPlatformAuditEvent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      eventType: 'ITINERARY_DAY_UPDATED',
      eventPayload: expect.objectContaining({ previous: existing })
    }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('fails closed when an activity disappears between read and update', async () => {
    mockSelectRows([{ id: 'activity-1', itineraryDayId: 'day-1', activity: 'Old' }])
    mockUpdateRows([])
    const res = response()

    await controller.updateActivitySchedule({ params: { id: 'activity-1' }, body: { time: '11:00', activity: 'New' } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(getActivityAuditScope).not.toHaveBeenCalled()
    expect(recordPlatformAuditEvent).not.toHaveBeenCalled()
  })

  it('audits a database-confirmed activity update', async () => {
    const existing = { id: 'activity-1', itineraryDayId: 'day-1', activity: 'Old' }
    mockSelectRows([existing])
    mockUpdateRows([{ id: 'activity-1' }])
    const res = response()

    await controller.updateActivitySchedule({ params: { id: 'activity-1' }, body: { time: '11:00', activity: 'New' } }, res, jest.fn())

    expect(getActivityAuditScope).toHaveBeenCalledWith('activity-1')
    expect(recordPlatformAuditEvent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ eventType: 'ITINERARY_ACTIVITY_UPDATED' }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('fails closed when an itinerary day disappears before delete confirmation', async () => {
    const existing = { id: 'day-1', sailingId: 'sailing-1' }
    mockSelectRows([existing])
    db.select.mockReturnValueOnce({ from: jest.fn(() => ({ where: jest.fn().mockResolvedValue([]) })) })
    mockDeleteRows([])
    const res = response()

    await controller.deleteItineraryDay({ params: { id: 'day-1' } }, res, jest.fn())

    expect(deleteActivitiesForItineraryDayIds).toHaveBeenCalledWith(['day-1'])
    expect(res.status).toHaveBeenCalledWith(404)
    expect(recordPlatformAuditEvent).not.toHaveBeenCalled()
  })

  it('fails closed when an activity disappears before delete confirmation', async () => {
    mockSelectRows([{ id: 'activity-1', itineraryDayId: 'day-1' }])
    mockDeleteRows([])
    const res = response()

    await controller.deleteActivitySchedule({ params: { id: 'activity-1' } }, res, jest.fn())

    expect(getActivityAuditScope).toHaveBeenCalledWith('activity-1')
    expect(res.status).toHaveBeenCalledWith(404)
    expect(recordPlatformAuditEvent).not.toHaveBeenCalled()
  })

  it('propagates persistence failures through next', async () => {
    const failure = new Error('database unavailable')
    const limit = jest.fn().mockRejectedValue(failure)
    db.select.mockReturnValueOnce({ from: jest.fn(() => ({ where: jest.fn(() => ({ limit })) })) })
    const next = jest.fn()

    await controller.updateItineraryDay({ params: { id: 'day-1' }, body: {} }, response(), next)

    expect(next).toHaveBeenCalledWith(failure)
  })
})
