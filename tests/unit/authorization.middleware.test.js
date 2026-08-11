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


jest.mock('../../services/turnaroundAccess.service', () => ({
  TURNAROUND_ACCESS_FORBIDDEN_MESSAGE: 'You do not have access to modify this turnaround operation.',
  TURNAROUND_DEPARTMENT_FORBIDDEN_MESSAGE: 'You do not have access to modify this turnaround department.',
  canAccessOperationScope: jest.fn(),
  canManageEscalation: jest.fn(),
  canManageHandoff: jest.fn(),
  canManageOperation: jest.fn(),
  canManageOperationDepartment: jest.fn(),
  canManageTask: jest.fn(),
  canReadTurnaroundOperations: jest.fn()
}))

const { getAuthenticationMode } = require('../../services/authentication.service')
const { requireAdminRequest } = require('../../services/requestAuthorization.service')
const { canAccessBooking, canAccessCustomer, canCreateBooking } = require('../../services/customerAccess.service')
const {
  canAccessOperationScope,
  canManageOperation,
  canManageOperationDepartment,
  canManageTask,
  canReadTurnaroundOperations
} = require('../../services/turnaroundAccess.service')
const {
  requireAdminAccess,
  requireAdminMutation,
  requireBookingAccess,
  requireBookingCreationAccess,
  requireBookingPassengerAccess,
  requireCustomerAccess,
  requireFavoriteCustomerAccess,
  requireTurnaroundCommandAccess,
  requireTurnaroundDepartmentAccess,
  requireTurnaroundOperationReadAccess,
  requireTurnaroundReadAccess,
  requireTurnaroundTaskAccess
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

  it('requires an authenticated operational scope for turnaround reads in JWT mode', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canReadTurnaroundOperations.mockResolvedValue(false)
    const res = responseDouble()
    const next = jest.fn()

    await requireTurnaroundReadAccess({}, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('checks operation scope before exposing a turnaround audit stream', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canAccessOperationScope.mockResolvedValue(false)
    const res = responseDouble()
    const next = jest.fn()

    await requireTurnaroundOperationReadAccess('operationId')({ params: { operationId: 'OP1' } }, res, next)

    expect(canAccessOperationScope).toHaveBeenCalledWith(expect.any(Object), 'OP1')
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('requires manager authority for operation-wide turnaround commands', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canManageOperation.mockResolvedValue(false)
    const res = responseDouble()
    const next = jest.fn()

    await requireTurnaroundCommandAccess({ params: { id: 'OP1' } }, res, next)

    expect(canManageOperation).toHaveBeenCalledWith(expect.any(Object), 'OP1')
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('binds department mutations to both operation scope and department role', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canManageOperationDepartment.mockResolvedValue(false)
    const res = responseDouble()
    const next = jest.fn()

    await requireTurnaroundDepartmentAccess('id', 'departmentRole')({ params: { id: 'OP1', departmentRole: 'ENGINEERING_LEAD' }, body: {} }, res, next)

    expect(canManageOperationDepartment).toHaveBeenCalledWith(expect.any(Object), 'OP1', 'ENGINEERING_LEAD')
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('resolves task ownership server-side before allowing task mutations', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canManageTask.mockResolvedValue(false)
    const res = responseDouble()
    const next = jest.fn()

    await requireTurnaroundTaskAccess({ params: { id: 'TASK1' } }, res, next)

    expect(canManageTask).toHaveBeenCalledWith(expect.any(Object), 'TASK1')
    expect(res.status).toHaveBeenCalledWith(403)
  })

})
