jest.mock('../../services/authentication.service', () => ({
  AUTH_MODES: { DEMO: 'demo', JWT: 'jwt' },
  getAuthenticationMode: jest.fn()
}))

jest.mock('../../services/requestAuthorization.service', () => ({
  requireAdminRequest: jest.fn()
}))

jest.mock('../../services/customerAccess.service', () => ({
  BOOKING_ACCESS_FORBIDDEN_MESSAGE: 'You do not have access to this booking record.',
  BOOKING_CREATE_FORBIDDEN_MESSAGE: 'Bookings must be created for the authenticated customer.',
  CUSTOMER_ACCESS_FORBIDDEN_MESSAGE: 'You do not have access to this customer record.',
  canAccessBooking: jest.fn(),
  canAccessCustomer: jest.fn(),
  canCreateBooking: jest.fn()
}))

const { getAuthenticationMode } = require('../../services/authentication.service')
const { requireAdminRequest } = require('../../services/requestAuthorization.service')
const { canAccessBooking, canAccessCustomer, canCreateBooking } = require('../../services/customerAccess.service')
const {
  requireAdminAccess,
  requireAdminMutation,
  requireBookingAccess,
  requireBookingCreationAccess,
  requireBookingPassengerAccess,
  requireCustomerAccess,
  requireFavoriteCustomerAccess
} = require('../../middleware/authorization.middleware')

function responseDouble() {
  const res = { status: jest.fn(), json: jest.fn() }
  res.status.mockReturnValue(res)
  return res
}

describe('authorization middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('preserves demo-mode portfolio workflows without invoking production authorization', async () => {
    getAuthenticationMode.mockReturnValue('demo')
    const next = jest.fn()

    await requireAdminMutation({}, {}, next)

    expect(requireAdminRequest).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('allows a verified administrator through in JWT mode', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    requireAdminRequest.mockResolvedValue(true)
    const req = { requestIdentity: { principal: { userId: 'admin-1', role: 'ADMIN' } } }
    const res = {}
    const next = jest.fn()

    await requireAdminAccess(req, res, next)

    expect(requireAdminRequest).toHaveBeenCalledWith(req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('stops the request when JWT-mode administrator authorization fails', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    requireAdminRequest.mockResolvedValue(false)
    const next = jest.fn()

    await requireAdminMutation({}, {}, next)

    expect(next).not.toHaveBeenCalled()
  })

  it('allows only the authenticated customer through customer-scoped routes', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canAccessCustomer.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    const middleware = requireCustomerAccess('customerId')
    const next = jest.fn()
    const allowedRes = responseDouble()
    const deniedRes = responseDouble()

    await middleware({ params: { customerId: 'C000000001' } }, allowedRes, next)
    await middleware({ params: { customerId: 'C000000002' } }, deniedRes, next)

    expect(canAccessCustomer).toHaveBeenNthCalledWith(1, expect.any(Object), 'C000000001')
    expect(next).toHaveBeenCalledTimes(1)
    expect(deniedRes.status).toHaveBeenCalledWith(403)
    expect(deniedRes.json).toHaveBeenCalledWith({ message: 'You do not have access to this customer record.' })
  })

  it('requires booking membership for booking-scoped routes', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canAccessBooking.mockResolvedValue(false)
    const res = responseDouble()
    const next = jest.fn()

    await requireBookingAccess('bookingId')({ params: { bookingId: 'B000000001' } }, res, next)

    expect(canAccessBooking).toHaveBeenCalledWith(expect.any(Object), 'B000000001')
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('requires both customer ownership and booking membership for passenger preference updates', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canAccessCustomer.mockResolvedValue(true)
    canAccessBooking.mockResolvedValue(false)
    const res = responseDouble()
    const next = jest.fn()

    await requireBookingPassengerAccess({ params: { bookingId: 'B1', customerId: 'C1' } }, res, next)

    expect(canAccessCustomer).toHaveBeenCalledWith(expect.any(Object), 'C1')
    expect(canAccessBooking).toHaveBeenCalledWith(expect.any(Object), 'B1')
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('binds itinerary favorites to the authenticated customer', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canAccessCustomer.mockResolvedValue(false)
    const res = responseDouble()
    const next = jest.fn()

    await requireFavoriteCustomerAccess({ params: {}, body: { customerId: 'C2' } }, res, next)

    expect(canAccessCustomer).toHaveBeenCalledWith(expect.any(Object), 'C2')
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('requires passenger-led booking creation to belong to the authenticated customer', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canCreateBooking.mockResolvedValue(false)
    const res = responseDouble()
    const next = jest.fn()
    const req = { body: { createdByCustomerId: 'C2', passengers: [] } }

    await requireBookingCreationAccess(req, res, next)

    expect(canCreateBooking).toHaveBeenCalledWith(req, req.body)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: 'Bookings must be created for the authenticated customer.' })
    expect(next).not.toHaveBeenCalled()
  })
})
