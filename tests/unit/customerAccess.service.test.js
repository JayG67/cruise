jest.mock('../../db', () => ({ select: jest.fn() }))
jest.mock('../../services/customerTenantAccess.service', () => ({
  canAdminAccessBookingTenant: jest.fn(),
  canAdminAccessCustomerTenant: jest.fn()
}))

const db = require('../../db')
const tenantAccess = require('../../services/customerTenantAccess.service')
const service = require('../../services/customerAccess.service')

function queueSelectRows(...rowSets) {
  const queue = [...rowSets]
  db.select.mockImplementation(() => ({
    from: () => ({
      where: () => ({
        limit: async () => queue.shift() || []
      })
    })
  }))
}

function principalRequest(userId, role = 'PASSENGER') {
  return { requestIdentity: { principal: { userId, role } } }
}

describe('customer access service', () => {
  let previousMode
  let previousNodeEnv

  beforeEach(() => {
    jest.clearAllMocks()
    previousMode = process.env.CRUISE_AUTH_MODE
    previousNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'test'
    process.env.CRUISE_AUTH_MODE = 'demo'
  })

  afterEach(() => {
    if (previousMode === undefined) delete process.env.CRUISE_AUTH_MODE
    else process.env.CRUISE_AUTH_MODE = previousMode
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousNodeEnv
  })

  it('resolves JWT administrator scope without trusting a request customer id', async () => {
    await expect(service.resolveRequestCustomerScope(principalRequest('admin-1', 'ADMIN'))).resolves.toEqual({
      authMode: 'jwt',
      isAdmin: true,
      userId: 'admin-1',
      customerId: null,
      role: 'ADMIN'
    })
    expect(db.select).not.toHaveBeenCalled()
  })

  it('resolves a JWT passenger through the server-side app user customer link', async () => {
    queueSelectRows([{ id: 'user-1', primaryCustomerId: 'CUST-1', userType: 'PASSENGER' }])
    await expect(service.resolveRequestCustomerScope(principalRequest('user-1', null))).resolves.toEqual({
      authMode: 'jwt',
      isAdmin: false,
      userId: 'user-1',
      customerId: 'CUST-1',
      role: 'PASSENGER'
    })
  })

  it('resolves demo anonymous, customer, and administrator scopes from server-side demo users', async () => {
    await expect(service.resolveRequestCustomerScope({ requestIdentity: {} })).resolves.toEqual({
      authMode: 'demo', isAdmin: false, userId: null, customerId: null, role: null
    })

    queueSelectRows([{ id: 'demo-1', normalizedUserId: 'user-1', customerId: 'CUST-1', role: 'PASSENGER' }])
    await expect(service.resolveRequestCustomerScope({ requestIdentity: { demoUserId: ' demo-1 ' } })).resolves.toEqual({
      authMode: 'demo', isAdmin: false, userId: 'user-1', customerId: 'CUST-1', role: 'PASSENGER'
    })

    queueSelectRows([{ id: 'demo-admin', normalizedUserId: null, customerId: null, role: 'ADMIN' }])
    await expect(service.resolveRequestCustomerScope({ requestIdentity: { demoUserId: 'demo-admin' } })).resolves.toEqual({
      authMode: 'demo', isAdmin: true, userId: 'demo-admin', customerId: null, role: 'ADMIN'
    })
  })

  it('fails closed when JWT mode has no authenticated principal', async () => {
    process.env.CRUISE_AUTH_MODE = 'jwt'
    await expect(service.resolveRequestCustomerScope({ requestIdentity: {} })).resolves.toEqual({
      authMode: 'jwt', isAdmin: false, userId: null, customerId: null, role: null
    })
  })

  it('delegates administrator customer and booking access to tenant-aware authorization', async () => {
    tenantAccess.canAdminAccessCustomerTenant.mockResolvedValue(true)
    tenantAccess.canAdminAccessBookingTenant.mockResolvedValue(false)

    await expect(service.canAccessCustomer(principalRequest('admin-1', 'ADMIN'), 'CUST-1')).resolves.toBe(true)
    await expect(service.canAccessBooking(principalRequest('admin-1', 'ADMIN'), 'BOOK-2')).resolves.toBe(false)

    expect(tenantAccess.canAdminAccessCustomerTenant).toHaveBeenCalledWith(expect.any(Object), 'CUST-1')
    expect(tenantAccess.canAdminAccessBookingTenant).toHaveBeenCalledWith(expect.any(Object), 'BOOK-2')
  })

  it('allows customer access only to the server-resolved customer id', async () => {
    queueSelectRows([{ primaryCustomerId: 'CUST-1', userType: 'PASSENGER' }])
    await expect(service.canAccessCustomer(principalRequest('user-1'), ' CUST-1 ')).resolves.toBe(true)

    queueSelectRows([{ primaryCustomerId: 'CUST-1', userType: 'PASSENGER' }])
    await expect(service.canAccessCustomer(principalRequest('user-1'), 'CUST-2')).resolves.toBe(false)
  })

  it('allows booking access for creator-customer and creator-user ownership', async () => {
    queueSelectRows(
      [{ primaryCustomerId: 'CUST-1', userType: 'PASSENGER' }],
      [{ id: 'BOOK-1', createdByCustomerId: 'CUST-1', createdByUserId: 'other-user' }]
    )
    await expect(service.canAccessBooking(principalRequest('user-1'), 'BOOK-1')).resolves.toBe(true)

    queueSelectRows(
      [{ primaryCustomerId: 'CUST-1', userType: 'PASSENGER' }],
      [{ id: 'BOOK-2', createdByCustomerId: 'CUST-2', createdByUserId: 'user-1' }]
    )
    await expect(service.canAccessBooking(principalRequest('user-1'), 'BOOK-2')).resolves.toBe(true)
  })

  it('allows booking access through passenger membership and fails closed for missing records', async () => {
    queueSelectRows(
      [{ primaryCustomerId: 'CUST-1', userType: 'PASSENGER' }],
      [{ id: 'BOOK-3', createdByCustomerId: 'CUST-2', createdByUserId: 'other-user' }],
      [{ bookingId: 'BOOK-3', customerId: 'CUST-1' }]
    )
    await expect(service.canAccessBooking(principalRequest('user-1'), 'BOOK-3')).resolves.toBe(true)

    queueSelectRows([{ primaryCustomerId: 'CUST-1', userType: 'PASSENGER' }], [])
    await expect(service.canAccessBooking(principalRequest('user-1'), 'BOOK-MISSING')).resolves.toBe(false)

    queueSelectRows([{ primaryCustomerId: null, userType: 'PASSENGER' }])
    await expect(service.canAccessBooking(principalRequest('user-1'), 'BOOK-1')).resolves.toBe(false)
  })

  it('requires self-owned booking creation with at least one matching passenger', async () => {
    queueSelectRows([{ primaryCustomerId: 'CUST-1', userType: 'PASSENGER' }])
    await expect(service.canCreateBooking(principalRequest('user-1'), {
      createdByCustomerId: 'CUST-1',
      passengers: [{ customerId: 'CUST-1' }]
    })).resolves.toBe(true)

    queueSelectRows([{ primaryCustomerId: 'CUST-1', userType: 'PASSENGER' }])
    await expect(service.canCreateBooking(principalRequest('user-1'), {
      createdByCustomerId: 'CUST-2', passengers: [{ customerId: 'CUST-1' }]
    })).resolves.toBe(false)

    queueSelectRows([{ primaryCustomerId: 'CUST-1', userType: 'PASSENGER' }])
    await expect(service.canCreateBooking(principalRequest('user-1'), {
      createdByCustomerId: 'CUST-1', passengers: []
    })).resolves.toBe(false)

    queueSelectRows([{ primaryCustomerId: 'CUST-1', userType: 'PASSENGER' }])
    await expect(service.canCreateBooking(principalRequest('user-1'), {
      createdByCustomerId: 'CUST-1', passengers: [{ customerId: 'CUST-2' }]
    })).resolves.toBe(false)
  })

  it('allows administrators to create bookings and denies unidentified customers', async () => {
    await expect(service.canCreateBooking(principalRequest('admin-1', 'ADMIN'), {})).resolves.toBe(true)

    process.env.CRUISE_AUTH_MODE = 'jwt'
    await expect(service.canCreateBooking({ requestIdentity: {} }, {
      createdByCustomerId: 'CUST-1', passengers: [{ customerId: 'CUST-1' }]
    })).resolves.toBe(false)
  })
})
