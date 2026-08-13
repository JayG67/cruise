jest.mock('../../db', () => ({ select: jest.fn() }))

const db = require('../../db')
const {
  canAdminAccessBookingTenant,
  canAdminAccessCustomerTenant,
  filterBookingsForAdminTenant,
  filterCustomersForAdminTenant,
  resolveBookingTenant,
  resolveCustomerTenantIds
} = require('../../services/customerTenantAccess.service')

function queueSelectRows(...rowSets) {
  const queue = [...rowSets]
  db.select.mockImplementation(() => ({
    from: () => ({
      where: () => {
        const rows = queue.shift() || []
        return {
          limit: async () => rows,
          then(resolve, reject) {
            return Promise.resolve(rows).then(resolve, reject)
          }
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

  it('resolves booking tenant through booking -> sailing -> ship and fails closed on missing linkage', async () => {
    queueSelectRows(
      [{ id: 'B1', sailingId: 'SAIL-1' }],
      [{ id: 'SAIL-1', shipId: 'SHIP-1' }],
      [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }]
    )
    await expect(resolveBookingTenant('B1')).resolves.toEqual({
      bookingId: 'B1', sailingId: 'SAIL-1', shipId: 'SHIP-1', cruiseLineId: 'CL-1'
    })

    queueSelectRows([{ id: 'B2', sailingId: 'SAIL-MISSING' }], [])
    await expect(resolveBookingTenant('B2')).resolves.toBeNull()
  })

  it('derives all customer tenants from passenger and creator booking relationships', async () => {
    queueSelectRows(
      [{ customerId: 'C1', bookingId: 'B1' }],
      [{ id: 'B2', createdByCustomerId: 'C1' }],
      [{ id: 'B1', sailingId: 'SAIL-1' }, { id: 'B2', sailingId: 'SAIL-2' }],
      [
        { id: 'SAIL-1', shipId: 'SHIP-1' },
        { id: 'SAIL-2', shipId: 'SHIP-2' }
      ],
      [
        { id: 'SHIP-1', cruiseLineId: 'CL-1' },
        { id: 'SHIP-2', cruiseLineId: 'CL-2' }
      ]
    )
    await expect(resolveCustomerTenantIds('C1')).resolves.toEqual(['CL-1', 'CL-2'])
  })

  it('fails customer tenant derivation closed if any linked booking loses authoritative tenant metadata', async () => {
    queueSelectRows(
      [{ customerId: 'C1', bookingId: 'B1' }],
      [],
      [{ id: 'B1', sailingId: 'SAIL-1' }],
      [{ id: 'SAIL-1', shipId: 'SHIP-MISSING' }],
      []
    )
    await expect(resolveCustomerTenantIds('C1')).resolves.toEqual([])
  })

  it('allows tenant admins only within derived booking/customer scope and preserves global override', async () => {
    queueSelectRows(...tenantAdminRows, [{ id: 'SAIL-1', shipId: 'SHIP-1' }], [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }])
    await expect(canAdminAccessBookingTenant(adminRequest(), { id: 'B1', sailingId: 'SAIL-1' })).resolves.toBe(true)

    queueSelectRows(...tenantAdminRows, [{ id: 'SAIL-2', shipId: 'SHIP-2' }], [{ id: 'SHIP-2', cruiseLineId: 'CL-2' }])
    await expect(canAdminAccessBookingTenant(adminRequest(), { id: 'B2', sailingId: 'SAIL-2' })).resolves.toBe(false)

    queueSelectRows(...globalAdminRows)
    await expect(canAdminAccessCustomerTenant(adminRequest('global-1'), 'C-ANY')).resolves.toBe(true)
  })

  it('filters admin list surfaces to the server-backed tenant', async () => {
    queueSelectRows(
      ...tenantAdminRows,
      [{ id: 'SAIL-1', shipId: 'SHIP-1' }, { id: 'SAIL-2', shipId: 'SHIP-2' }],
      [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }, { id: 'SHIP-2', cruiseLineId: 'CL-2' }]
    )
    await expect(filterBookingsForAdminTenant(adminRequest(), [
      { id: 'B1', sailingId: 'SAIL-1' },
      { id: 'B2', sailingId: 'SAIL-2' }
    ])).resolves.toEqual([{ id: 'B1', sailingId: 'SAIL-1' }])

    queueSelectRows(...globalAdminRows)
    const customers = [{ id: 'C1' }, { id: 'C2' }]
    await expect(filterCustomersForAdminTenant(adminRequest('global-1'), customers)).resolves.toBe(customers)
  })

  it('batch-resolves customer list tenant relationships without per-customer hierarchy queries', async () => {
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
