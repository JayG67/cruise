jest.mock('../../controllers/fleet.controller', () => ({}))
jest.mock('../../controllers/sailing.controller', () => ({}))
jest.mock('../../controllers/customer.controller', () => ({}))
jest.mock('../../controllers/booking.controller', () => ({}))
jest.mock('../../controllers/platformAdministration.controller', () => ({}))
jest.mock('../../controllers/turnaroundMutation.controller', () => ({
  createTurnaroundMutationController: jest.fn(() => ({}))
}))

jest.mock('../../db', () => ({ select: jest.fn() }))
jest.mock('drizzle-orm', () => ({ eq: jest.fn((field, value) => ({ field, value })) }), { virtual: true })
jest.mock('../../services/loadCruiseData.service', () => jest.fn())
jest.mock('../../services/demoDataPolicy.service', () => ({ isDemoDataEnabled: jest.fn() }))
jest.mock('../../services/auditEvent.service', () => ({ listAuditEventsForOperation: jest.fn() }))
jest.mock('../../services/turnaroundScope.service', () => ({
  canAccessTurnaroundOperationForRequest: jest.fn(),
  getTurnaroundOperationsForRequest: jest.fn(),
  sendTurnaroundOperationForbidden: jest.fn((res) => res.status(403).json({ message: 'Forbidden' }))
}))
jest.mock('../../services/bookingDomain.service', () => ({ getBookingDetails: jest.fn() }))
jest.mock('../../services/turnaroundOperationDetails.service', () => ({ getTurnaroundOperationDetails: jest.fn() }))

const controller = require('../../controllers/cruise.controller')
const db = require('../../db')
const loadCruiseData = require('../../services/loadCruiseData.service')
const { isDemoDataEnabled } = require('../../services/demoDataPolicy.service')
const { listAuditEventsForOperation } = require('../../services/auditEvent.service')
const scope = require('../../services/turnaroundScope.service')
const { getBookingDetails } = require('../../services/bookingDomain.service')
const { getTurnaroundOperationDetails } = require('../../services/turnaroundOperationDetails.service')
const mockResponse = require('./helpers/mockResponse')

function selectDirect(result) {
  db.select.mockReturnValueOnce({ from: jest.fn().mockResolvedValue(result) })
}

function selectWhere(result) {
  const where = jest.fn().mockResolvedValue(result)
  db.select.mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where }) })
  return where
}

function selectLimit(result) {
  const limit = jest.fn().mockResolvedValue(result)
  const where = jest.fn().mockReturnValue({ limit })
  db.select.mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where }) })
  return { where, limit }
}

beforeEach(() => {
  jest.clearAllMocks()
  isDemoDataEnabled.mockReturnValue(false)
  scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(true)
})

describe('cruise turnaround read and recovery behavior', () => {
  it('reloads demo seed data once when the first turnaround query is empty', async () => {
    const req = {}
    const res = mockResponse()
    const next = jest.fn()
    const operation = { id: 'OP-1', turnaroundDate: '2026-09-02' }

    isDemoDataEnabled.mockReturnValue(true)
    scope.getTurnaroundOperationsForRequest
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([operation])
    getTurnaroundOperationDetails.mockResolvedValue({ ...operation, marker: true })

    await controller.getTurnaroundOperations(req, res, next)

    expect(loadCruiseData).toHaveBeenCalledTimes(1)
    expect(scope.getTurnaroundOperationsForRequest).toHaveBeenCalledTimes(2)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([{ ...operation, marker: true }])
    expect(next).not.toHaveBeenCalled()
  })

  it('does not reseed outside demo mode and returns 404 for an empty turnaround set', async () => {
    const res = mockResponse()
    scope.getTurnaroundOperationsForRequest.mockResolvedValue([])

    await controller.getTurnaroundOperations({}, res, jest.fn())

    expect(loadCruiseData).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('sorts decorated turnaround operations by date', async () => {
    const res = mockResponse()
    scope.getTurnaroundOperationsForRequest.mockResolvedValue([
      { id: 'LATE' },
      { id: 'EARLY' }
    ])
    getTurnaroundOperationDetails
      .mockResolvedValueOnce({ id: 'LATE', turnaroundDate: '2026-10-10' })
      .mockResolvedValueOnce({ id: 'EARLY', turnaroundDate: '2026-09-01' })

    await controller.getTurnaroundOperations({}, res, jest.fn())

    expect(res.json).toHaveBeenCalledWith([
      { id: 'EARLY', turnaroundDate: '2026-09-01' },
      { id: 'LATE', turnaroundDate: '2026-10-10' }
    ])
  })

  it('forwards turnaround retrieval errors', async () => {
    const error = new Error('scope failed')
    const next = jest.fn()
    scope.getTurnaroundOperationsForRequest.mockRejectedValue(error)

    await controller.getTurnaroundOperations({}, mockResponse(), next)

    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('cruise turnaround audit-event access', () => {
  it('returns 404 when the operation does not exist', async () => {
    const res = mockResponse()
    selectLimit([])

    await controller.getTurnaroundOperationAuditEvents({ params: { id: 'missing' }, query: {} }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(listAuditEventsForOperation).not.toHaveBeenCalled()
  })

  it('denies audit history when turnaround scope authorization fails', async () => {
    const res = mockResponse()
    const operation = { id: 'OP-2' }
    selectLimit([operation])
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(false)

    await controller.getTurnaroundOperationAuditEvents({ params: { id: operation.id }, query: {} }, res, jest.fn())

    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(res)
    expect(listAuditEventsForOperation).not.toHaveBeenCalled()
  })

  it.each([
    [{}, 50],
    [{ limit: '17' }, '17']
  ])('uses the requested audit limit with the documented default', async (query, expectedLimit) => {
    const res = mockResponse()
    const operation = { id: 'OP-3' }
    const events = [{ id: 'AUD-1' }]
    selectLimit([operation])
    listAuditEventsForOperation.mockResolvedValue(events)

    await controller.getTurnaroundOperationAuditEvents({ params: { id: operation.id }, query }, res, jest.fn())

    expect(listAuditEventsForOperation).toHaveBeenCalledWith(operation.id, { limit: expectedLimit })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ operationId: operation.id, auditEvents: events })
  })

  it('forwards audit lookup failures', async () => {
    const error = new Error('database failed')
    const next = jest.fn()
    db.select.mockImplementationOnce(() => { throw error })

    await controller.getTurnaroundOperationAuditEvents({ params: { id: 'OP-X' }, query: {} }, mockResponse(), next)

    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('demo user visibility context', () => {
  it('returns 404 when no assigned people are available', async () => {
    const res = mockResponse()
    selectDirect([])

    await controller.getDemoUsers({}, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('returns assigned people when available', async () => {
    const res = mockResponse()
    const users = [{ id: 'U-1' }]
    selectDirect(users)

    await controller.getDemoUsers({}, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(users)
  })

  it('returns 404 for an unknown selected demo user', async () => {
    const res = mockResponse()
    selectLimit([])

    await controller.getDemoUserContext({ params: { id: 'unknown' } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('returns global visibility counts for an admin demo user', async () => {
    const res = mockResponse()
    const user = { id: 'ADMIN-1', role: 'ADMIN' }
    selectLimit([user])
    selectDirect([{ id: 'C-1' }, { id: 'C-2' }])
    selectDirect([{ id: 'B-1' }])

    await controller.getDemoUserContext({ params: { id: user.id } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      user,
      customer: null,
      bookings: [],
      visibility: expect.objectContaining({
        canManageCruiseData: true,
        accessibleCustomerCount: 2,
        accessibleBookingCount: 1
      })
    }))
  })

  it('fails closed to zero accessible records when a non-admin has no linked customer', async () => {
    const res = mockResponse()
    const user = { id: 'P-1', role: 'PASSENGER', customerId: 'C-X' }
    selectLimit([user])
    selectLimit([])

    await controller.getDemoUserContext({ params: { id: user.id } }, res, jest.fn())

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      user,
      customer: null,
      bookings: [],
      visibility: expect.objectContaining({ accessibleCustomerCount: 0, accessibleBookingCount: 0 })
    }))
  })

  it('includes only existing bookings and expands group-leader customer visibility from passenger manifests', async () => {
    const res = mockResponse()
    const user = { id: 'GL-1', role: 'GROUP_LEADER', customerId: 'C-1' }
    const customer = { id: 'C-1' }
    selectLimit([user])
    selectLimit([customer])
    selectWhere([{ bookingId: 'B-1' }, { bookingId: 'missing' }])
    selectLimit([{ id: 'B-1' }])
    selectLimit([])
    getBookingDetails.mockResolvedValue({
      id: 'B-1',
      passengers: [{ customerId: 'C-1' }, { customerId: 'C-2' }, { customerId: 'C-2' }]
    })

    await controller.getDemoUserContext({ params: { id: user.id } }, res, jest.fn())

    expect(getBookingDetails).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      bookings: [expect.objectContaining({ id: 'B-1' })],
      visibility: expect.objectContaining({ accessibleCustomerCount: 2, accessibleBookingCount: 1 })
    }))
  })

  it('keeps passenger customer visibility scoped to the selected customer even when the booking has other passengers', async () => {
    const res = mockResponse()
    const user = { id: 'P-2', role: 'PASSENGER', customerId: 'C-1' }
    const customer = { id: 'C-1' }
    selectLimit([user])
    selectLimit([customer])
    selectWhere([{ bookingId: 'B-1' }])
    selectLimit([{ id: 'B-1' }])
    getBookingDetails.mockResolvedValue({ id: 'B-1', passengers: [{ customerId: 'C-1' }, { customerId: 'C-9' }] })

    await controller.getDemoUserContext({ params: { id: user.id } }, res, jest.fn())

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      visibility: expect.objectContaining({ accessibleCustomerCount: 1, accessibleBookingCount: 1 })
    }))
  })

  it('forwards demo-context lookup failures', async () => {
    const error = new Error('lookup failed')
    const next = jest.fn()
    db.select.mockImplementationOnce(() => { throw error })

    await controller.getDemoUserContext({ params: { id: 'U-X' } }, mockResponse(), next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
