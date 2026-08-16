jest.mock('../../db', () => ({ select: jest.fn() }))

const db = require('../../db')
const {
  canAdminAccessBookingTenant,
  canAdminAccessCustomerTenant,
  filterBookingsForAdminTenant,
  filterCustomersForAdminTenant,
  resolveBookingTenant,
  resolveBookingTenantMap,
  resolveCustomerTenantIds,
  resolveCustomerTenantMap
} = require('../../services/customerTenantAccess.service')

function queueSelectRows(...rowSets) {
  const queue = [...rowSets]
  db.select.mockImplementation(() => ({
    from: () => ({
      where: () => {
        const rows = queue.shift() || []
        return {
          limit: async () => rows,
          then(resolve, reject) { return Promise.resolve(rows).then(resolve, reject) }
        }
      }
    })
  }))
}

function adminRequest(userId = 'admin-1', tenantId = null) {
  return { requestIdentity: { principal: { userId, role: 'ADMIN', tenantId } } }
}

const tenantAdminRows = [
  [{ id: 'admin-1', status: 'ACTIVE', cruiseLineId: 'CL-1' }],
  [{ roleId: 'ADMIN', status: 'ACTIVE', assignmentScope: 'CRUISE_LINE', cruiseLineId: 'CL-1' }]
]
const globalAdminRows = [
  [{ id: 'global-1', status: 'ACTIVE', cruiseLineId: null, assignedShipId: null }],
  [{ roleId: 'ADMIN', status: 'ACTIVE', assignmentScope: 'GLOBAL', cruiseLineId: null, assignedShipId: null }]
]

describe('customer and booking tenant derivation', () => {
  beforeEach(() => db.select.mockReset())

  it('resolves booking tenant through authoritative booking -> sailing -> ship rows', async () => {
    queueSelectRows(
      [{ id: 'B1', sailingId: 'SAIL-1' }],
      [{ id: 'SAIL-1', shipId: 'SHIP-1' }],
      [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }]
    )
    await expect(resolveBookingTenant('B1')).resolves.toEqual({
      bookingId: 'B1', sailingId: 'SAIL-1', shipId: 'SHIP-1', cruiseLineId: 'CL-1'
    })
  })

  it('never trusts a caller supplied booking sailing relationship for authorization scope', async () => {
    queueSelectRows(
      [{ id: 'B2', sailingId: 'SAIL-2' }],
      [{ id: 'SAIL-2', shipId: 'SHIP-2' }],
      [{ id: 'SHIP-2', cruiseLineId: 'CL-2' }]
    )
    await expect(resolveBookingTenant({ id: 'B2', sailingId: 'SAIL-1' })).resolves.toEqual({
      bookingId: 'B2', sailingId: 'SAIL-2', shipId: 'SHIP-2', cruiseLineId: 'CL-2'
    })
  })

  it('fails booking tenant resolution closed for missing ids and broken hierarchy links', async () => {
    await expect(resolveBookingTenant(null)).resolves.toBeNull()
    await expect(resolveBookingTenant({ sailingId: 'SAIL-1' })).resolves.toBeNull()

    queueSelectRows([], [{ id: 'B2', sailingId: null }])
    await expect(resolveBookingTenant('MISSING')).resolves.toBeNull()
    await expect(resolveBookingTenant('B2')).resolves.toBeNull()

    queueSelectRows([{ id: 'B3', sailingId: 'SAIL-MISSING' }], [])
    await expect(resolveBookingTenant('B3')).resolves.toBeNull()

    queueSelectRows([{ id: 'B4', sailingId: 'SAIL-4' }], [{ id: 'SAIL-4', shipId: 'SHIP-MISSING' }], [])
    await expect(resolveBookingTenant('B4')).resolves.toBeNull()
  })

  it('batch-resolves bookings and ignores incomplete records or missing hierarchy links', async () => {
    await expect(resolveBookingTenantMap()).resolves.toEqual(new Map())
    await expect(resolveBookingTenantMap(null)).resolves.toEqual(new Map())
    await expect(resolveBookingTenantMap([{ id: null, sailingId: 'S1' }, { id: 'B0' }])).resolves.toEqual(new Map())

    queueSelectRows([{ id: 'S1', shipId: null }])
    await expect(resolveBookingTenantMap([{ id: 'B1', sailingId: 'S1' }])).resolves.toEqual(new Map())

    queueSelectRows(
      [{ id: 'S1', shipId: 'SHIP-1' }, { id: 'S2', shipId: 'SHIP-2' }],
      [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }]
    )
    await expect(resolveBookingTenantMap([
      { id: 'B1', sailingId: 'S1' },
      { id: 'B2', sailingId: 'S2' },
      { id: 'B3', sailingId: 'S-MISSING' }
    ])).resolves.toEqual(new Map([['B1', {
      bookingId: 'B1', sailingId: 'S1', shipId: 'SHIP-1', cruiseLineId: 'CL-1'
    }]]))
  })

  it('derives all customer tenants from passenger and creator booking relationships', async () => {
    queueSelectRows(
      [{ customerId: 'C1', bookingId: 'B1' }],
      [{ id: 'B2', createdByCustomerId: 'C1' }],
      [{ id: 'B1', sailingId: 'SAIL-1' }, { id: 'B2', sailingId: 'SAIL-2' }],
      [{ id: 'SAIL-1', shipId: 'SHIP-1' }, { id: 'SAIL-2', shipId: 'SHIP-2' }],
      [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }, { id: 'SHIP-2', cruiseLineId: 'CL-2' }]
    )
    await expect(resolveCustomerTenantIds('C1')).resolves.toEqual(['CL-1', 'CL-2'])
  })

  it('handles empty customer scopes, customers without bookings, and invalid linked booking tenant metadata', async () => {
    await expect(resolveCustomerTenantMap()).resolves.toEqual(new Map())
    await expect(resolveCustomerTenantMap(null)).resolves.toEqual(new Map())
    await expect(resolveCustomerTenantIds(null)).resolves.toEqual([])

    queueSelectRows([], [])
    await expect(resolveCustomerTenantMap(['C1', 'C1', null])).resolves.toEqual(new Map([['C1', []]]))

    queueSelectRows(
      [{ customerId: 'C1', bookingId: 'B1' }, { customerId: 'UNKNOWN', bookingId: 'B9' }, { customerId: 'C1' }],
      [{ id: 'B2', createdByCustomerId: 'C2' }, { createdByCustomerId: 'C2' }],
      [{ id: 'B1', sailingId: 'SAIL-1' }, { id: 'B2', sailingId: 'SAIL-2' }],
      [{ id: 'SAIL-1', shipId: 'SHIP-1' }, { id: 'SAIL-2', shipId: 'SHIP-2' }],
      [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }]
    )
    await expect(resolveCustomerTenantMap(['C1', 'C2'])).resolves.toEqual(new Map([
      ['C1', ['CL-1']],
      ['C2', []]
    ]))
  })

  it('allows tenant admins only within authoritative booking/customer scope and preserves global override', async () => {
    queueSelectRows(...tenantAdminRows, [{ id: 'B1', sailingId: 'SAIL-1' }], [{ id: 'SAIL-1', shipId: 'SHIP-1' }], [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }])
    await expect(canAdminAccessBookingTenant(adminRequest(), { id: 'B1', sailingId: 'SAIL-ATTACKER' })).resolves.toBe(true)

    queueSelectRows(...tenantAdminRows, [{ id: 'B2', sailingId: 'SAIL-2' }], [{ id: 'SAIL-2', shipId: 'SHIP-2' }], [{ id: 'SHIP-2', cruiseLineId: 'CL-2' }])
    await expect(canAdminAccessBookingTenant(adminRequest(), { id: 'B2', sailingId: 'SAIL-1' })).resolves.toBe(false)

    queueSelectRows(...globalAdminRows)
    await expect(canAdminAccessBookingTenant(adminRequest('global-1'), 'ANY')).resolves.toBe(true)

    queueSelectRows(...globalAdminRows)
    await expect(canAdminAccessCustomerTenant(adminRequest('global-1'), 'C-ANY')).resolves.toBe(true)
  })

  it('fails admin access closed for unresolved principal scope, tenantless assignment, or unknown resources', async () => {
    await expect(canAdminAccessBookingTenant({ requestIdentity: {} }, 'B1')).resolves.toBe(false)
    await expect(canAdminAccessCustomerTenant({ requestIdentity: {} }, 'C1')).resolves.toBe(false)

    const tenantless = [
      [{ id: 'admin-1', status: 'ACTIVE', cruiseLineId: null }],
      [{ roleId: 'ADMIN', status: 'ACTIVE', assignmentScope: 'CRUISE_LINE', cruiseLineId: null }]
    ]
    queueSelectRows(...tenantless)
    await expect(canAdminAccessCustomerTenant(adminRequest(), 'C1')).resolves.toBe(false)

    queueSelectRows(...tenantAdminRows, [])
    await expect(canAdminAccessBookingTenant(adminRequest(), 'MISSING')).resolves.toBe(false)
  })

  it('filters admin list surfaces to server-backed tenant scope and handles denied/global paths', async () => {
    await expect(filterBookingsForAdminTenant({ requestIdentity: {} }, [{ id: 'B1' }])).resolves.toEqual([])
    await expect(filterCustomersForAdminTenant({ requestIdentity: {} }, [{ id: 'C1' }])).resolves.toEqual([])

    queueSelectRows(...globalAdminRows)
    const bookings = [{ id: 'B1', sailingId: 'SAIL-1' }]
    await expect(filterBookingsForAdminTenant(adminRequest('global-1'), bookings)).resolves.toBe(bookings)

    queueSelectRows(...tenantAdminRows, [{ id: 'SAIL-1', shipId: 'SHIP-1' }, { id: 'SAIL-2', shipId: 'SHIP-2' }], [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }, { id: 'SHIP-2', cruiseLineId: 'CL-2' }])
    await expect(filterBookingsForAdminTenant(adminRequest(), [
      { id: 'B1', sailingId: 'SAIL-1' }, { id: 'B2', sailingId: 'SAIL-2' }
    ])).resolves.toEqual([{ id: 'B1', sailingId: 'SAIL-1' }])

    queueSelectRows(...globalAdminRows)
    const customers = [{ id: 'C1' }, { id: 'C2' }]
    await expect(filterCustomersForAdminTenant(adminRequest('global-1'), customers)).resolves.toBe(customers)
  })

  it('batch-filters customer list relationships without per-customer hierarchy queries', async () => {
    queueSelectRows(
      ...tenantAdminRows,
      [{ customerId: 'C1', bookingId: 'B1' }, { customerId: 'C2', bookingId: 'B2' }],
      [],
      [{ id: 'B1', sailingId: 'SAIL-1' }, { id: 'B2', sailingId: 'SAIL-2' }],
      [{ id: 'SAIL-1', shipId: 'SHIP-1' }, { id: 'SAIL-2', shipId: 'SHIP-2' }],
      [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }, { id: 'SHIP-2', cruiseLineId: 'CL-2' }]
    )
    await expect(filterCustomersForAdminTenant(adminRequest(), [{ id: 'C1' }, { id: 'C2' }]))
      .resolves.toEqual([{ id: 'C1' }])
  })
})
