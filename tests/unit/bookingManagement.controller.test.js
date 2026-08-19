jest.mock('../../db', () => ({ select: jest.fn(), transaction: jest.fn() }))
jest.mock('drizzle-orm', () => ({ eq: jest.fn((field, value) => ({ field, value })) }), { virtual: true })
jest.mock('../../services/authentication.service', () => ({
  AUTH_MODES: { DEMO: 'demo', JWT: 'jwt' },
  getAuthenticationMode: jest.fn(() => 'demo')
}))
jest.mock('../../services/platformAudit.service', () => ({
  getBookingAuditScope: jest.fn(),
  getSailingAuditScope: jest.fn(),
  recordPlatformAuditEvent: jest.fn(),
  resolvePlatformAuditActor: jest.fn()
}))
jest.mock('../../services/entityHistory.service', () => ({
  buildEntityHistoryPayload: jest.fn(value => value),
  buildEntityLifecycleTimestamps: jest.fn(() => ({ createdAt: 'created', updatedAt: 'created' })),
  buildEntityUpdateTimestamp: jest.fn(() => ({ updatedAt: 'updated' }))
}))
jest.mock('../../services/apiPayloadProfile.service', () => ({
  applyBookingPayloadProfile: jest.fn(value => value),
  getRequestedPayloadProfile: jest.fn(() => 'full')
}))
jest.mock('../../services/bookingDomain.service', () => ({
  buildBookingPassengerStorageValues: jest.fn((bookingId, passenger) => ({ id: `${bookingId}-${passenger.customerId}` })),
  findBookingOverlapForPassengers: jest.fn(),
  getBookingDetails: jest.fn(),
  getBookingDetailsBatch: jest.fn(),
  indexRowsBy: jest.fn(rows => new Map((rows || []).map(row => [row.id, row]))),
  selectByIds: jest.fn()
}))
jest.mock('../../services/bookingPassengerValidation.service', () => ({ validateBookingPassengerSet: jest.fn(() => null) }))
jest.mock('../../services/customerTenantAccess.service', () => ({ filterBookingsForAdminTenant: jest.fn() }))

const db = require('../../db')
const auth = require('../../services/authentication.service')
const audit = require('../../services/platformAudit.service')
const domain = require('../../services/bookingDomain.service')
const validation = require('../../services/bookingPassengerValidation.service')
const tenant = require('../../services/customerTenantAccess.service')
const controller = require('../../controllers/bookingManagement.controller')
const mockResponse = require('./helpers/mockResponse')

function queueSelectRows(...rowSets) {
  const queue = [...rowSets]
  db.select.mockImplementation(() => ({
    from: () => {
      const rows = queue.shift() || []
      const direct = Promise.resolve(rows)
      direct.where = () => {
        const filtered = Promise.resolve(rows)
        filtered.limit = () => Promise.resolve(rows)
        return filtered
      }
      return direct
    }
  }))
}

function request(body = {}, params = {}) {
  return { body, params, requestIdentity: { principal: { role: 'ADMIN' } } }
}

beforeEach(() => {
  jest.clearAllMocks()
  auth.getAuthenticationMode.mockReturnValue(auth.AUTH_MODES.DEMO)
  validation.validateBookingPassengerSet.mockReturnValue(null)
  domain.findBookingOverlapForPassengers.mockResolvedValue(null)
  domain.getBookingDetailsBatch.mockResolvedValue([])
  domain.getBookingDetails.mockResolvedValue({ id: 'B1' })
  domain.selectByIds.mockResolvedValue([])
  audit.resolvePlatformAuditActor.mockResolvedValue({ actorUserId: 'USER-1' })
  audit.getSailingAuditScope.mockResolvedValue({ cruiseLineId: 'CL1', shipId: 'SHIP1', sailingId: 'S1' })
  audit.getBookingAuditScope.mockResolvedValue({ cruiseLineId: 'CL1', shipId: 'SHIP1', sailingId: 'S1' })
  audit.recordPlatformAuditEvent.mockResolvedValue(undefined)
})

describe('booking management controller mutation integrity', () => {
  test('fails closed when a booking disappears during update before passenger replacement', async () => {
    queueSelectRows(
      [{ id: 'B1', sailingId: 'S0' }],
      [{ id: 'S1' }],
      [{ id: 'C1' }],
      [{ id: 'B1-C1', bookingPassengerUuid: 'uuid-1' }]
    )
    const tx = {
      update: jest.fn(() => ({ set: () => ({ where: () => ({ returning: jest.fn().mockResolvedValue([]) }) }) })),
      delete: jest.fn(),
      insert: jest.fn()
    }
    db.transaction.mockImplementation(callback => callback(tx))
    const res = mockResponse()

    await controller.updateBooking(request({
      sailingId: 'S1', bookingStatus: 'CONFIRMED', passengers: [{ customerId: 'C1', isPrimaryGuest: true }]
    }, { id: 'B1' }), res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(tx.delete).not.toHaveBeenCalled()
    expect(tx.insert).not.toHaveBeenCalled()
    expect(audit.recordPlatformAuditEvent).not.toHaveBeenCalled()
  })

  test('updates booking and passengers only after the booking mutation is database-confirmed', async () => {
    queueSelectRows(
      [{ id: 'B1', sailingId: 'S0', bookingStatus: 'HELD' }],
      [{ id: 'S1' }],
      [{ id: 'C1' }],
      [{ id: 'B1-C1', bookingPassengerUuid: 'uuid-1' }]
    )
    const tx = {
      update: jest.fn(() => ({ set: () => ({ where: () => ({ returning: jest.fn().mockResolvedValue([{ id: 'B1' }]) }) }) })),
      delete: jest.fn(() => ({ where: jest.fn().mockResolvedValue(undefined) })),
      insert: jest.fn(() => ({ values: jest.fn().mockResolvedValue(undefined) }))
    }
    db.transaction.mockImplementation(callback => callback(tx))
    const req = request({ sailingId: 'S1', bookingStatus: 'CONFIRMED', passengers: [{ customerId: 'C1', isPrimaryGuest: true }] }, { id: 'B1' })
    const res = mockResponse()

    await controller.updateBooking(req, res, jest.fn())

    expect(tx.delete).toHaveBeenCalledTimes(1)
    expect(tx.insert).toHaveBeenCalledTimes(1)
    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(req, expect.objectContaining({ eventType: 'BOOKING_UPDATED', entityId: 'B1' }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('does not emit deletion success or audit when the final booking delete affects zero rows', async () => {
    queueSelectRows([{ id: 'B1', sailingId: 'S1' }])
    const tx = {
      delete: jest.fn()
        .mockReturnValueOnce({ where: jest.fn().mockResolvedValue(undefined) })
        .mockReturnValueOnce({ where: () => ({ returning: jest.fn().mockResolvedValue([]) }) })
    }
    db.transaction.mockImplementation(callback => callback(tx))
    const res = mockResponse()

    await controller.deleteBooking(request({}, { id: 'B1' }), res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(audit.recordPlatformAuditEvent).not.toHaveBeenCalled()
  })

  test('audits deletion only when the database returns the deleted booking row', async () => {
    queueSelectRows([{ id: 'B1', sailingId: 'S1' }])
    const tx = {
      delete: jest.fn()
        .mockReturnValueOnce({ where: jest.fn().mockResolvedValue(undefined) })
        .mockReturnValueOnce({ where: () => ({ returning: jest.fn().mockResolvedValue([{ id: 'B1' }]) }) })
    }
    db.transaction.mockImplementation(callback => callback(tx))
    const req = request({}, { id: 'B1' })
    const res = mockResponse()

    await controller.deleteBooking(req, res, jest.fn())

    expect(audit.getBookingAuditScope).toHaveBeenCalledWith(expect.objectContaining({ id: 'B1' }))
    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(req, expect.objectContaining({ eventType: 'BOOKING_DELETED', entityId: 'B1' }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('covers insert validation failures before any transaction is opened', async () => {
    const res = mockResponse()
    validation.validateBookingPassengerSet.mockReturnValueOnce('Booking must include exactly one primary guest')
    await controller.insertBooking(request({ passengers: [] }), res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(400)
    expect(db.transaction).not.toHaveBeenCalled()

    jest.clearAllMocks()
    validation.validateBookingPassengerSet.mockReturnValue(null)
    queueSelectRows([{ id: 'B1' }])
    await controller.insertBooking(request({ id: 'B1', passengers: [{ customerId: 'C1', isPrimaryGuest: true }] }), mockResponse(), jest.fn())
    expect(db.transaction).not.toHaveBeenCalled()
  })

  test('routes unexpected read and mutation failures to error middleware', async () => {
    const readError = new Error('read failed')
    db.select.mockImplementationOnce(() => { throw readError })
    const readNext = jest.fn()
    await controller.getBookingById(request({}, { id: 'B1' }), mockResponse(), readNext)
    expect(readNext).toHaveBeenCalledWith(readError)

    queueSelectRows([{ id: 'B1', sailingId: 'S0' }], [{ id: 'S1' }], [{ id: 'C1' }], [])
    const mutationError = new Error('update failed')
    db.transaction.mockRejectedValueOnce(mutationError)
    const mutationNext = jest.fn()
    await controller.updateBooking(request({ sailingId: 'S1', passengers: [{ customerId: 'C1', isPrimaryGuest: true }] }, { id: 'B1' }), mockResponse(), mutationNext)
    expect(mutationNext).toHaveBeenCalledWith(mutationError)
  })

  test('covers tenant-filtered customer booking reads and the empty visible result', async () => {
    auth.getAuthenticationMode.mockReturnValue(auth.AUTH_MODES.JWT)
    queueSelectRows([{ id: 'C1' }], [{ bookingId: 'B1', customerId: 'C1' }])
    domain.selectByIds.mockResolvedValue([{ id: 'B1' }])
    tenant.filterBookingsForAdminTenant.mockResolvedValue([])
    const res = mockResponse()

    await controller.getBookingsByCustomer(request({}, { customerId: 'C1' }), res, jest.fn())

    expect(tenant.filterBookingsForAdminTenant).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('booking management remaining read and validation coverage', () => {
  test('returns not-found for empty booking collections and missing customer lookup', async () => {
    queueSelectRows([])
    const bookingsRes = mockResponse()
    await controller.getBookings(request(), bookingsRes, jest.fn())
    expect(bookingsRes.status).toHaveBeenCalledWith(404)

    queueSelectRows([])
    const customerRes = mockResponse()
    await controller.getBookingsByCustomer(request({}, { customerId: 'MISSING' }), customerRes, jest.fn())
    expect(customerRes.status).toHaveBeenCalledWith(404)
  })

  test('rejects invalid sailing and customer references during booking update', async () => {
    queueSelectRows([{ id: 'B1', sailingId: 'OLD' }], [])
    const sailingRes = mockResponse()
    await controller.updateBooking(request({ sailingId: 'MISSING', passengers: [{ customerId: 'C1', isPrimaryGuest: true }] }, { id: 'B1' }), sailingRes, jest.fn())
    expect(sailingRes.status).toHaveBeenCalledWith(400)
    expect(sailingRes.json).toHaveBeenCalledWith({ message: 'Invalid sailing ID' })

    queueSelectRows([{ id: 'B1', sailingId: 'OLD' }], [{ id: 'S1' }], [])
    const customerRes = mockResponse()
    await controller.updateBooking(request({ sailingId: 'S1', passengers: [{ customerId: 'MISSING', isPrimaryGuest: true }] }, { id: 'B1' }), customerRes, jest.fn())
    expect(customerRes.status).toHaveBeenCalledWith(400)
    expect(customerRes.json).toHaveBeenCalledWith({ message: 'Invalid customer ID MISSING' })
  })

  test('forwards list, customer-list, insert, and delete failures to error middleware', async () => {
    for (const invoke of [
      (next) => controller.getBookings(request(), mockResponse(), next),
      (next) => controller.getBookingsByCustomer(request({}, { customerId: 'C1' }), mockResponse(), next),
      (next) => controller.insertBooking(request({ id: 'B1', passengers: [{ customerId: 'C1', isPrimaryGuest: true }] }), mockResponse(), next),
      (next) => controller.deleteBooking(request({}, { id: 'B1' }), mockResponse(), next)
    ]) {
      const error = new Error('forced failure')
      const next = jest.fn()
      db.select.mockImplementationOnce(() => { throw error })
      await invoke(next)
      expect(next).toHaveBeenCalledWith(error)
      jest.clearAllMocks()
      auth.getAuthenticationMode.mockReturnValue(auth.AUTH_MODES.DEMO)
      validation.validateBookingPassengerSet.mockReturnValue(null)
    }
  })
})
