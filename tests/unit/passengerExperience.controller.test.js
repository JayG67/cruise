jest.mock('../../db', () => ({
  select: jest.fn(), update: jest.fn(), insert: jest.fn(), delete: jest.fn(), execute: jest.fn()
}))
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((field, value) => ({ field, value })),
  sql: jest.fn((strings, ...values) => ({ strings, values }))
}), { virtual: true })
jest.mock('../../services/platformAudit.service', () => ({
  getBookingAuditScope: jest.fn(),
  recordPlatformAuditEvent: jest.fn()
}))
jest.mock('../../services/entityHistory.service', () => ({
  buildEntityHistoryPayload: jest.fn(value => value),
  buildEntityUpdateTimestamp: jest.fn(updatedAt => ({ updatedAt, updatedAtTimestamp: updatedAt }))
}))
jest.mock('../../services/apiIdentityBridge.service', () => ({
  withPreCruiseChecklistApiIdentity: jest.fn(value => ({ ...value, apiIdentity: true }))
}))
jest.mock('../../services/sailingAuditScope.service', () => ({
  getActivityAuditScope: jest.fn()
}))

const db = require('../../db')
const audit = require('../../services/platformAudit.service')
const sailingAudit = require('../../services/sailingAuditScope.service')
const controller = require('../../controllers/passengerExperience.controller')
const mockResponse = require('./helpers/mockResponse')

function selectRows(...rowSets) {
  const queue = [...rowSets]
  db.select.mockImplementation(() => ({
    from: () => ({
      where: () => ({ limit: async () => queue.shift() || [] })
    })
  }))
}

function updateOk() {
  db.update.mockImplementation(() => ({ set: () => ({ where: jest.fn().mockResolvedValue(undefined) }) }))
}

function insertOk() {
  db.insert.mockImplementation(() => ({
    values: () => ({ onConflictDoUpdate: jest.fn().mockResolvedValue(undefined), onConflictDoNothing: jest.fn().mockResolvedValue(undefined) })
  }))
}

function deleteOk() {
  db.delete.mockImplementation(() => ({ where: jest.fn().mockResolvedValue(undefined) }))
}

beforeEach(() => {
  jest.clearAllMocks()
  updateOk()
  insertOk()
  deleteOk()
  db.execute.mockResolvedValue(undefined)
  audit.getBookingAuditScope.mockResolvedValue({ cruiseLineId: 'CL-1', shipId: 'SHIP-1', sailingId: 'SAIL-1' })
  audit.recordPlatformAuditEvent.mockResolvedValue(undefined)
  sailingAudit.getActivityAuditScope.mockResolvedValue({ cruiseLineId: 'CL-1', shipId: 'SHIP-1', sailingId: 'SAIL-1' })
})

describe('passenger experience controller defect-discovery coverage', () => {
  it('returns 404 without mutation when passenger profile customer is missing', async () => {
    selectRows([])
    const res = mockResponse()

    await controller.updatePassengerSelfServiceProfile({ params: { id: 'C1' }, body: {} }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(db.update).not.toHaveBeenCalled()
    expect(audit.recordPlatformAuditEvent).not.toHaveBeenCalled()
  })

  it('updates passenger identity and preference rows and records before/after audit history', async () => {
    selectRows([{ id: 'C1', firstName: 'Old', lastName: 'Name' }])
    const res = mockResponse()
    const req = {
      params: { id: 'C1' },
      body: { firstName: 'New', lastName: 'Name', email: 'new@example.com', phone: '555', diningPreference: 'Late', accessibilityNotes: 'Near lift' }
    }

    await controller.updatePassengerSelfServiceProfile(req, res, jest.fn())

    expect(db.update).toHaveBeenCalledTimes(2)
    expect(db.execute).toHaveBeenCalledTimes(1)
    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(req, expect.objectContaining({
      eventType: 'PASSENGER_PROFILE_UPDATED', entityType: 'CUSTOMER', entityId: 'C1',
      eventPayload: expect.objectContaining({
        previous: expect.objectContaining({ firstName: 'Old' }),
        next: expect.objectContaining({ firstName: 'New' }),
        entityRefs: { customerId: 'C1' }
      })
    }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('creates a new pre-cruise checklist and reports create audit metadata', async () => {
    selectRows([{ id: 'C1' }], [])
    const res = mockResponse()
    const req = { params: { id: 'C1' }, body: { documents: true, luggage: 1, dining: false, excursions: 0 } }

    await controller.updatePassengerPreCruiseChecklist(req, res, jest.fn())

    expect(db.insert).toHaveBeenCalledTimes(1)
    expect(db.execute).toHaveBeenCalledTimes(1)
    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(req, expect.objectContaining({
      eventType: 'PASSENGER_CHECKLIST_UPDATED',
      eventPayload: expect.objectContaining({ previous: null, metadata: expect.objectContaining({ operation: 'passenger-checklist-create' }) })
    }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('updates an existing pre-cruise checklist and preserves update audit classification', async () => {
    selectRows([{ id: 'C1' }], [{ customerId: 'C1', documents: false, updatedAt: 'old' }])
    const res = mockResponse()
    const req = { params: { id: 'C1' }, body: { documents: true, luggage: true, dining: true, excursions: true } }

    await controller.updatePassengerPreCruiseChecklist(req, res, jest.fn())

    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(req, expect.objectContaining({
      eventPayload: expect.objectContaining({ metadata: expect.objectContaining({ operation: 'passenger-checklist-update' }) })
    }))
  })

  it('returns 404 when booking passenger preferences target is missing', async () => {
    selectRows([])
    const res = mockResponse()

    await controller.updatePassengerBookingPreferences({ params: { bookingId: 'B1', customerId: 'C1' }, body: {} }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(db.update).not.toHaveBeenCalled()
  })

  it('updates booking passenger preferences with booking tenant audit scope when booking exists', async () => {
    selectRows([{ id: 'B1-C1', diningPreference: 'Early' }], [{ id: 'B1', sailingId: 'SAIL-1' }])
    const req = { params: { bookingId: 'B1', customerId: 'C1' }, body: { diningPreference: 'Late', accessibilityNotes: 'Ramp' } }
    const res = mockResponse()

    await controller.updatePassengerBookingPreferences(req, res, jest.fn())

    expect(audit.getBookingAuditScope).toHaveBeenCalledWith(expect.objectContaining({ id: 'B1' }))
    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(req, expect.objectContaining({
      cruiseLineId: 'CL-1', shipId: 'SHIP-1', sailingId: 'SAIL-1', eventType: 'PASSENGER_BOOKING_PREFERENCES_UPDATED'
    }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('still audits booking preference history without fabricated tenant scope when the parent booking is missing', async () => {
    selectRows([{ id: 'B1-C1' }], [])
    const req = { params: { bookingId: 'B1', customerId: 'C1' }, body: { diningPreference: null, accessibilityNotes: null } }
    const res = mockResponse()

    await controller.updatePassengerBookingPreferences(req, res, jest.fn())

    expect(audit.getBookingAuditScope).not.toHaveBeenCalled()
    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(req, expect.not.objectContaining({ cruiseLineId: expect.anything() }))
  })

  it('creates a new itinerary favorite with activity audit scope', async () => {
    selectRows([])
    const req = { body: { customerId: 'C1', activityScheduleId: 'ACT-1' } }
    const res = mockResponse()

    await controller.addItineraryFavorite(req, res, jest.fn())

    expect(sailingAudit.getActivityAuditScope).toHaveBeenCalledWith('ACT-1')
    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(req, expect.objectContaining({
      eventType: 'PASSENGER_ITINERARY_FAVORITE_SAVED',
      eventPayload: expect.objectContaining({ metadata: expect.objectContaining({ operation: 'passenger-itinerary-favorite-create' }) })
    }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('keeps an existing itinerary favorite idempotent and classifies the audit event accordingly', async () => {
    selectRows([{ id: 'C1-ACT-1', customerId: 'C1', activityScheduleId: 'ACT-1', createdAt: 'existing-time' }])
    const req = { body: { customerId: 'C1', activityScheduleId: 'ACT-1' } }
    const res = mockResponse()

    await controller.addItineraryFavorite(req, res, jest.fn())

    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(req, expect.objectContaining({
      eventPayload: expect.objectContaining({ metadata: expect.objectContaining({ operation: 'passenger-itinerary-favorite-already-saved', createdAt: 'existing-time' }) })
    }))
  })

  it('deletes existing and missing favorites idempotently with distinct audit classification', async () => {
    const req = { params: { customerId: 'C1', activityScheduleId: 'ACT-1' } }
    const existingRes = mockResponse()
    selectRows([{ id: 'C1-ACT-1' }])
    await controller.deleteItineraryFavorite(req, existingRes, jest.fn())
    expect(audit.recordPlatformAuditEvent).toHaveBeenLastCalledWith(req, expect.objectContaining({
      eventPayload: expect.objectContaining({ metadata: { operation: 'passenger-itinerary-favorite-delete' } })
    }))

    jest.clearAllMocks()
    deleteOk()
    sailingAudit.getActivityAuditScope.mockResolvedValue({ sailingId: 'SAIL-1' })
    audit.recordPlatformAuditEvent.mockResolvedValue(undefined)
    selectRows([])
    const missingRes = mockResponse()
    await controller.deleteItineraryFavorite(req, missingRes, jest.fn())
    expect(audit.recordPlatformAuditEvent).toHaveBeenLastCalledWith(req, expect.objectContaining({
      eventPayload: expect.objectContaining({ metadata: { operation: 'passenger-itinerary-favorite-delete-missing' } })
    }))
    expect(missingRes.status).toHaveBeenCalledWith(200)
  })

  it('forwards persistence failures without reporting passenger success', async () => {
    const error = new Error('database unavailable')
    const next = jest.fn()
    selectRows([{ id: 'C1' }])
    db.update.mockImplementationOnce(() => ({ set: () => ({ where: jest.fn().mockRejectedValue(error) }) }))
    const res = mockResponse()

    await controller.updatePassengerSelfServiceProfile({ params: { id: 'C1' }, body: {} }, res, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalledWith(200)
  })
})
