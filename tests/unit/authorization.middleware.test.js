jest.mock('../../services/authentication.service', () => ({
  AUTH_MODES: { DEMO: 'demo', JWT: 'jwt' },
  getAuthenticationMode: jest.fn()
}))

jest.mock('../../services/publicDemoReadPolicy.service', () => ({
  isPublicDemoReadRequest: jest.fn(() => false)
}))

jest.mock('../../services/requestAuthorization.service', () => ({
  isAdminRole: jest.fn(role => String(role || '').toUpperCase() === 'ADMIN'),
  requireAdminRequest: jest.fn()
}))

jest.mock('../../services/customerAccess.service', () => ({
  BOOKING_ACCESS_FORBIDDEN_MESSAGE: 'You do not have access to this booking record.',
  BOOKING_CREATE_FORBIDDEN_MESSAGE: 'Bookings must be created for the authenticated customer.',
  CUSTOMER_ACCESS_FORBIDDEN_MESSAGE: 'You do not have access to this customer record.',
  canAccessBooking: jest.fn(),
  canAccessCustomer: jest.fn(),
  canAccessCustomerActivity: jest.fn(),
  canCreateBooking: jest.fn()
}))



jest.mock('../../services/customerTenantAccess.service', () => ({
  canAdminAccessBookingTenant: jest.fn(),
  canAdminAccessCustomerTenant: jest.fn()
}))

jest.mock('../../services/tenantAccess.service', () => ({
  GLOBAL_ADMIN_REQUIRED_MESSAGE: 'This operation requires a global administrator.',
  TENANT_ACCESS_FORBIDDEN_MESSAGE: 'You do not have access to this cruise-line tenant.',
  canAccessActivityTenant: jest.fn(),
  canAccessCruiseLineTenant: jest.fn(),
  canAccessItineraryDayTenant: jest.fn(),
  canAccessSailingTenant: jest.fn(),
  canAccessShipTenant: jest.fn(),
  canCreateCruiseLineTenant: jest.fn(),
  constrainAuditFiltersToTenant: jest.fn(),
  resolvePrincipalTenantScope: jest.fn()
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
const { isPublicDemoReadRequest } = require('../../services/publicDemoReadPolicy.service')
const {
  canAccessActivityTenant,
  canAccessCruiseLineTenant,
  canAccessItineraryDayTenant,
  canAccessSailingTenant,
  canAccessShipTenant,
  canCreateCruiseLineTenant,
  constrainAuditFiltersToTenant,
  resolvePrincipalTenantScope
} = require('../../services/tenantAccess.service')

const { requireAdminRequest } = require('../../services/requestAuthorization.service')
const { canAccessBooking, canAccessCustomer, canAccessCustomerActivity, canCreateBooking } = require('../../services/customerAccess.service')
const { canAdminAccessBookingTenant, canAdminAccessCustomerTenant } = require('../../services/customerTenantAccess.service')
const {
  canAccessOperationScope,
  canManageOperation,
  canManageOperationDepartment,
  canManageTask,
  canManageEscalation,
  canManageHandoff,
  canReadTurnaroundOperations
} = require('../../services/turnaroundAccess.service')
const {
  requireActivityTenantAccess,
  requireAdminAccess,
  requireAdminMutation,
  requireCruiseLineTenantAccess,
  requireGlobalAdminAccess,
  requireGlobalAdminMutation,
  requireItineraryDayTenantAccess,
  requireSailingTenantAccess,
  requireShipTenantAccess,
  requireTenantAuditAccess,
  requireBookingAccess,
  requireBookingCreationAccess,
  requireBookingCreationTenantAccess,
  requireBookingDestinationTenantAccess,
  requireBookingPassengerAccess,
  requireCustomerAccess,
  requireCustomerTenantAdminAccess,
  requireDemoReadAccess,
  requireFavoriteCustomerAccess,
  requireTurnaroundCommandAccess,
  requireTurnaroundDepartmentAccess,
  requireTurnaroundEscalationAccess,
  requireTurnaroundHandoffAccess,
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
    isPublicDemoReadRequest.mockReturnValue(false)
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

  it('requires a server-confirmed global administrator for platform-wide AI access', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    requireAdminRequest.mockResolvedValue(true)
    canCreateCruiseLineTenant.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    const allowedNext = jest.fn()
    const deniedNext = jest.fn()
    const deniedRes = responseDouble()

    await requireGlobalAdminAccess({ requestIdentity: { principal: { userId: 'global-admin', role: 'ADMIN' } } }, responseDouble(), allowedNext)
    await requireGlobalAdminAccess({ requestIdentity: { principal: { userId: 'tenant-admin', role: 'ADMIN' } } }, deniedRes, deniedNext)

    expect(allowedNext).toHaveBeenCalledTimes(1)
    expect(deniedNext).not.toHaveBeenCalled()
    expect(deniedRes.status).toHaveBeenCalledWith(403)
    expect(deniedRes.json).toHaveBeenCalledWith({ message: 'This operation requires a global administrator.' })
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

  it('binds itinerary favorites to both the authenticated customer and an activity on an accessible voyage', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canAccessCustomer.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    canAccessCustomerActivity.mockResolvedValue(false)
    const deniedCustomerRes = responseDouble()
    const deniedActivityRes = responseDouble()
    const next = jest.fn()

    await requireFavoriteCustomerAccess({ params: {}, body: { customerId: 'C2', activityScheduleId: 'A2' } }, deniedCustomerRes, next)
    await requireFavoriteCustomerAccess({ params: { customerId: 'C1', activityScheduleId: 'A9' }, body: {} }, deniedActivityRes, next)
    await requireFavoriteCustomerAccess({ params: {}, body: { customerId: 'C1' } }, responseDouble(), next)

    expect(canAccessCustomer).toHaveBeenNthCalledWith(1, expect.any(Object), 'C2')
    expect(canAccessCustomerActivity).not.toHaveBeenCalledWith(expect.any(Object), 'C2', 'A2')
    expect(canAccessCustomerActivity).toHaveBeenCalledWith(expect.any(Object), 'C1', 'A9')
    expect(deniedCustomerRes.status).toHaveBeenCalledWith(403)
    expect(deniedActivityRes.status).toHaveBeenCalledWith(403)
    expect(next).toHaveBeenCalledTimes(1)
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


  it('tenant-checks admin booking destinations while allowing validation to handle a missing sailing', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canAccessSailingTenant.mockResolvedValueOnce(true).mockResolvedValueOnce(false)

    const allowedNext = jest.fn()
    await requireBookingCreationTenantAccess(
      { requestIdentity: { principal: { role: 'ADMIN' } }, body: { sailingId: 'SAIL-1' } },
      responseDouble(),
      allowedNext
    )
    expect(allowedNext).toHaveBeenCalledTimes(1)

    const deniedRes = responseDouble()
    const deniedNext = jest.fn()
    await requireBookingDestinationTenantAccess(
      { body: { sailingId: 'SAIL-2' } },
      deniedRes,
      deniedNext
    )
    expect(deniedRes.status).toHaveBeenCalledWith(403)
    expect(deniedNext).not.toHaveBeenCalled()

    const validationNext = jest.fn()
    await requireBookingDestinationTenantAccess({ body: {} }, responseDouble(), validationNext)
    expect(validationNext).toHaveBeenCalledTimes(1)
  })

  it('enforces tenant-admin customer and booking resource middleware', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canAdminAccessCustomerTenant.mockResolvedValue(false)
    canAdminAccessBookingTenant.mockResolvedValue(false)
    const customerRes = responseDouble()
    const bookingRes = responseDouble()

    await requireCustomerTenantAdminAccess('customerId')({ params: { customerId: 'C2' } }, customerRes, jest.fn())
    const bookingMiddleware = require('../../middleware/authorization.middleware').requireBookingTenantAdminAccess('bookingId')
    await bookingMiddleware({ params: { bookingId: 'B2' } }, bookingRes, jest.fn())

    expect(customerRes.status).toHaveBeenCalledWith(403)
    expect(bookingRes.status).toHaveBeenCalledWith(403)
  })

  it('allows explicitly enabled public portfolio reads without weakening JWT mutation authorization', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    isPublicDemoReadRequest.mockImplementation(req => req?.method === 'GET')
    requireAdminRequest.mockResolvedValue(false)
    const readNext = jest.fn()
    const demoNext = jest.fn()
    const turnaroundNext = jest.fn()
    const mutationNext = jest.fn()
    const mutationRes = responseDouble()

    await requireAdminAccess({ method: 'GET' }, responseDouble(), readNext)
    await requireDemoReadAccess({ method: 'GET' }, responseDouble(), demoNext)
    await requireTurnaroundReadAccess({ method: 'GET' }, responseDouble(), turnaroundNext)
    await requireAdminMutation({ method: 'POST' }, mutationRes, mutationNext)

    expect(readNext).toHaveBeenCalledTimes(1)
    expect(demoNext).toHaveBeenCalledTimes(1)
    expect(turnaroundNext).toHaveBeenCalledTimes(1)
    expect(mutationNext).not.toHaveBeenCalled()
    expect(requireAdminRequest).toHaveBeenCalledWith(expect.objectContaining({ method: 'POST' }), mutationRes)
  })

  it('returns not-found for demo identity read surfaces outside demo mode', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    const res = responseDouble()
    const next = jest.fn()

    await requireDemoReadAccess({}, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
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

  it('requires both admin identity and global server scope for new tenant creation', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    requireAdminRequest.mockResolvedValue(true)
    canCreateCruiseLineTenant.mockResolvedValue(false)
    const res = responseDouble()
    const next = jest.fn()

    await requireGlobalAdminMutation({}, res, next)

    expect(requireAdminRequest).toHaveBeenCalled()
    expect(canCreateCruiseLineTenant).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: 'This operation requires a global administrator.' })
    expect(next).not.toHaveBeenCalled()
  })

  it('allows a global administrator through the new-tenant boundary', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    requireAdminRequest.mockResolvedValue(true)
    canCreateCruiseLineTenant.mockResolvedValue(true)
    const next = jest.fn()

    await requireGlobalAdminMutation({}, {}, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('enforces cruise-line tenant scope from params or body', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canAccessCruiseLineTenant.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    const next = jest.fn()
    const deniedRes = responseDouble()

    await requireCruiseLineTenantAccess('cruiseLineId')({ params: {}, body: { cruiseLineId: 'CL-1' } }, {}, next)
    await requireCruiseLineTenantAccess('id')({ params: { id: 'CL-2' }, body: {} }, deniedRes, next)

    expect(canAccessCruiseLineTenant).toHaveBeenNthCalledWith(1, expect.any(Object), 'CL-1')
    expect(canAccessCruiseLineTenant).toHaveBeenNthCalledWith(2, expect.any(Object), 'CL-2')
    expect(next).toHaveBeenCalledTimes(1)
    expect(deniedRes.status).toHaveBeenCalledWith(403)
  })

  it.each([
    ['ship', requireShipTenantAccess('id'), canAccessShipTenant],
    ['sailing', requireSailingTenantAccess('id'), canAccessSailingTenant],
    ['itinerary day', requireItineraryDayTenantAccess('id'), canAccessItineraryDayTenant],
    ['activity', requireActivityTenantAccess('id'), canAccessActivityTenant]
  ])('enforces %s tenant scope before controller execution', async (_label, middleware, accessCheck) => {
    getAuthenticationMode.mockReturnValue('jwt')
    accessCheck.mockResolvedValue(false)
    const res = responseDouble()
    const next = jest.fn()

    await middleware({ params: { id: 'RESOURCE-1' } }, res, next)

    expect(accessCheck).toHaveBeenCalledWith(expect.any(Object), 'RESOURCE-1')
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('preserves demo-mode compatibility for tenant middleware without database checks', async () => {
    getAuthenticationMode.mockReturnValue('demo')
    const next = jest.fn()

    await requireCruiseLineTenantAccess('id')({ params: { id: 'CL-1' } }, {}, next)
    await requireShipTenantAccess('id')({ params: { id: 'SHIP-1' } }, {}, next)

    expect(canAccessCruiseLineTenant).not.toHaveBeenCalled()
    expect(canAccessShipTenant).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(2)
  })

  it('attaches tenant-constrained audit filters in JWT mode and rejects cross-tenant filters', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    resolvePrincipalTenantScope.mockResolvedValue({ isGlobalAdmin: false, cruiseLineId: 'CL-1' })
    constrainAuditFiltersToTenant
      .mockReturnValueOnce({ source: 'TEST', cruiseLineId: 'CL-1' })
      .mockReturnValueOnce(null)
    const next = jest.fn()
    const allowedReq = { query: { source: 'TEST' } }
    const deniedRes = responseDouble()

    await requireTenantAuditAccess(allowedReq, {}, next)
    await requireTenantAuditAccess({ query: { cruiseLineId: 'CL-2' } }, deniedRes, next)

    expect(allowedReq.tenantAuditFilters).toEqual({ source: 'TEST', cruiseLineId: 'CL-1' })
    expect(next).toHaveBeenCalledTimes(1)
    expect(deniedRes.status).toHaveBeenCalledWith(403)
  })


  it('covers successful JWT resource authorization branches without emitting responses', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canAccessBooking.mockResolvedValue(true)
    canAccessCustomer.mockResolvedValue(true)
    canAccessCustomerActivity.mockResolvedValue(true)
    canCreateBooking.mockResolvedValue(true)
    canReadTurnaroundOperations.mockResolvedValue(true)
    canAccessOperationScope.mockResolvedValue(true)
    canManageOperation.mockResolvedValue(true)
    canManageOperationDepartment.mockResolvedValue(true)
    canManageTask.mockResolvedValue(true)
    canManageEscalation.mockResolvedValue(true)
    canManageHandoff.mockResolvedValue(true)
    const next = jest.fn()

    await requireBookingAccess('bookingId')({ params: { bookingId: 'B1' } }, responseDouble(), next)
    await requireBookingPassengerAccess({ params: { customerId: 'C1', bookingId: 'B1' } }, responseDouble(), next)
    await requireFavoriteCustomerAccess({ params: { customerId: 'C1', activityScheduleId: 'A1' }, body: {} }, responseDouble(), next)
    await requireBookingCreationAccess({ body: { createdByCustomerId: 'C1' } }, responseDouble(), next)
    await requireTurnaroundReadAccess({}, responseDouble(), next)
    await requireTurnaroundOperationReadAccess('operationId')({ params: { operationId: 'OP1' } }, responseDouble(), next)
    await requireTurnaroundCommandAccess({ params: { id: 'OP1' } }, responseDouble(), next)
    await requireTurnaroundDepartmentAccess('id', 'departmentRole')({ params: { id: 'OP1' }, body: { departmentRole: 'ENGINEERING_LEAD' } }, responseDouble(), next)
    await requireTurnaroundTaskAccess({ params: { id: 'TASK1' } }, responseDouble(), next)
    await requireTurnaroundEscalationAccess({ params: { id: 'ESC1' } }, responseDouble(), next)
    await requireTurnaroundHandoffAccess({ params: { id: 'HAND1' } }, responseDouble(), next)

    expect(next).toHaveBeenCalledTimes(11)
  })

  it('covers non-admin and missing-sailing booking tenant bypasses', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    const next = jest.fn()

    await requireBookingCreationTenantAccess({ requestIdentity: { principal: { role: 'PASSENGER' } }, body: { sailingId: 'SAIL-1' } }, responseDouble(), next)
    await requireBookingCreationTenantAccess({ requestIdentity: { principal: { role: 'ADMIN' } }, body: {} }, responseDouble(), next)

    expect(canAccessSailingTenant).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(2)
  })

  it('short-circuits booking membership when customer ownership fails', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    canAccessCustomer.mockResolvedValue(false)
    const res = responseDouble()

    await requireBookingPassengerAccess({ params: { customerId: 'C9', bookingId: 'B9' } }, res, jest.fn())

    expect(canAccessBooking).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it.each([
    [requireShipTenantAccess('id'), canAccessShipTenant],
    [requireSailingTenantAccess('id'), canAccessSailingTenant],
    [requireItineraryDayTenantAccess('id'), canAccessItineraryDayTenant],
    [requireActivityTenantAccess('id'), canAccessActivityTenant]
  ])('allows an in-tenant resource through the scoped middleware', async (middleware, accessCheck) => {
    getAuthenticationMode.mockReturnValue('jwt')
    accessCheck.mockResolvedValue(true)
    const next = jest.fn()

    await middleware({ params: { id: 'RESOURCE-OK' } }, responseDouble(), next)

    expect(next).toHaveBeenCalledTimes(1)
  })

})
