jest.mock('../../db', () => ({ select: jest.fn() }))

const db = require('../../db')
const {
  canAccessActivityTenant,
  canAccessCruiseLineTenant,
  canAccessItineraryDayTenant,
  canAccessSailingTenant,
  canAccessShipTenant,
  canCreateCruiseLineTenant,
  constrainAuditFiltersToTenant,
  resolveActivityTenant,
  resolveItineraryDayTenant,
  resolvePrincipalTenantScope,
  resolveSailingTenant,
  resolveShipTenant
} = require('../../services/tenantAccess.service')

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

function requestFor(userId, role = 'ADMIN', tenantId = null) {
  return { requestIdentity: { principal: { userId, role, tenantId } } }
}

describe('tenant access service', () => {
  beforeEach(() => db.select.mockReset())

  it('fails closed without an authenticated admin principal', async () => {
    await expect(resolvePrincipalTenantScope({})).resolves.toBeNull()
    await expect(resolvePrincipalTenantScope(requestFor('passenger-1', 'PASSENGER'))).resolves.toBeNull()
    await expect(canAccessCruiseLineTenant({}, 'CL-1')).resolves.toBe(false)
  })

  it('requires an active server-side app user and matching active admin role assignment', async () => {
    queueSelectRows([])
    await expect(resolvePrincipalTenantScope(requestFor('admin-1'))).resolves.toBeNull()

    queueSelectRows([{ id: 'admin-1', status: 'INACTIVE' }])
    await expect(resolvePrincipalTenantScope(requestFor('admin-1'))).resolves.toBeNull()

    queueSelectRows([{ id: 'admin-1', status: 'ACTIVE' }], [{ roleId: 'PASSENGER', status: 'ACTIVE' }])
    await expect(resolvePrincipalTenantScope(requestFor('admin-1'))).resolves.toBeNull()
  })

  it('recognizes a global administrator only from a global server-side assignment', async () => {
    queueSelectRows(
      [{ id: 'admin-1', status: 'ACTIVE', cruiseLineId: null, assignedShipId: null }],
      [{ roleId: 'admin', status: 'ACTIVE', assignmentScope: 'GLOBAL', cruiseLineId: null, assignedShipId: null }]
    )
    await expect(resolvePrincipalTenantScope(requestFor('admin-1'))).resolves.toEqual(expect.objectContaining({
      isGlobalAdmin: true,
      cruiseLineId: null,
      assignedShipId: null
    }))
  })

  it('derives a tenant administrator scope from the role assignment rather than the request', async () => {
    queueSelectRows(
      [{ id: 'admin-1', status: 'ACTIVE', cruiseLineId: 'CL-FALLBACK' }],
      [{ roleId: 'admin', status: 'ACTIVE', assignmentScope: 'CRUISE_LINE', cruiseLineId: 'CL-1' }]
    )
    await expect(resolvePrincipalTenantScope(requestFor('admin-1', 'ADMIN', 'CL-1'))).resolves.toEqual(expect.objectContaining({
      isGlobalAdmin: false,
      cruiseLineId: 'CL-1'
    }))
  })

  it('rejects a JWT tenant claim that conflicts with server-side assignment', async () => {
    queueSelectRows(
      [{ id: 'admin-1', status: 'ACTIVE', cruiseLineId: 'CL-1' }],
      [{ roleId: 'admin', status: 'ACTIVE', assignmentScope: 'CRUISE_LINE', cruiseLineId: 'CL-1' }]
    )
    await expect(resolvePrincipalTenantScope(requestFor('admin-1', 'ADMIN', 'CL-2'))).resolves.toBeNull()
  })

  it('allows only global administrators to create cruise-line tenants', async () => {
    queueSelectRows(
      [{ id: 'admin-1', status: 'ACTIVE' }],
      [{ roleId: 'admin', status: 'ACTIVE', assignmentScope: 'GLOBAL' }]
    )
    await expect(canCreateCruiseLineTenant(requestFor('admin-1'))).resolves.toBe(true)

    queueSelectRows(
      [{ id: 'admin-2', status: 'ACTIVE', cruiseLineId: 'CL-1' }],
      [{ roleId: 'admin', status: 'ACTIVE', assignmentScope: 'CRUISE_LINE', cruiseLineId: 'CL-1' }]
    )
    await expect(canCreateCruiseLineTenant(requestFor('admin-2'))).resolves.toBe(false)
  })

  it('enforces cruise-line equality for tenant administrators while allowing global admin', async () => {
    queueSelectRows(
      [{ id: 'admin-1', status: 'ACTIVE', cruiseLineId: 'CL-1' }],
      [{ roleId: 'admin', status: 'ACTIVE', assignmentScope: 'CRUISE_LINE', cruiseLineId: 'CL-1' }]
    )
    await expect(canAccessCruiseLineTenant(requestFor('admin-1'), 'CL-2')).resolves.toBe(false)

    queueSelectRows(
      [{ id: 'admin-global', status: 'ACTIVE' }],
      [{ roleId: 'admin', status: 'ACTIVE', assignmentScope: 'GLOBAL' }]
    )
    await expect(canAccessCruiseLineTenant(requestFor('admin-global'), 'CL-2')).resolves.toBe(true)
  })

  it('resolves ship, sailing, itinerary-day, and activity tenant chains fail-closed', async () => {
    await expect(resolveShipTenant()).resolves.toBeNull()
    queueSelectRows([])
    await expect(resolveShipTenant('SHIP-MISSING')).resolves.toBeNull()

    queueSelectRows([{ id: 'SHIP-1', cruiseLineId: 'CL-1' }])
    await expect(resolveShipTenant('SHIP-1')).resolves.toEqual({ cruiseLineId: 'CL-1', shipId: 'SHIP-1' })

    queueSelectRows([{ id: 'SAIL-1', shipId: 'SHIP-1' }], [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }])
    await expect(resolveSailingTenant('SAIL-1')).resolves.toEqual(expect.objectContaining({ cruiseLineId: 'CL-1', sailingId: 'SAIL-1' }))

    queueSelectRows([{ id: 'DAY-1', sailingId: 'SAIL-1' }], [{ id: 'SAIL-1', shipId: 'SHIP-1' }], [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }])
    await expect(resolveItineraryDayTenant('DAY-1')).resolves.toEqual(expect.objectContaining({ cruiseLineId: 'CL-1', itineraryDayId: 'DAY-1' }))

    queueSelectRows([{ id: 'ACT-1', itineraryDayId: 'DAY-1' }], [{ id: 'DAY-1', sailingId: 'SAIL-1' }], [{ id: 'SAIL-1', shipId: 'SHIP-1' }], [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }])
    await expect(resolveActivityTenant('ACT-1')).resolves.toEqual(expect.objectContaining({ cruiseLineId: 'CL-1', activityId: 'ACT-1' }))
  })

  it('enforces tenant access through every fleet hierarchy resource resolver', async () => {
    const tenantAdmin = requestFor('admin-1')
    const adminRows = [
      [{ id: 'admin-1', status: 'ACTIVE', cruiseLineId: 'CL-1' }],
      [{ roleId: 'admin', status: 'ACTIVE', assignmentScope: 'CRUISE_LINE', cruiseLineId: 'CL-1' }]
    ]

    queueSelectRows([{ id: 'SHIP-1', cruiseLineId: 'CL-1' }], ...adminRows)
    await expect(canAccessShipTenant(tenantAdmin, 'SHIP-1')).resolves.toBe(true)

    queueSelectRows([{ id: 'SAIL-1', shipId: 'SHIP-2' }], [{ id: 'SHIP-2', cruiseLineId: 'CL-2' }], ...adminRows)
    await expect(canAccessSailingTenant(tenantAdmin, 'SAIL-1')).resolves.toBe(false)

    queueSelectRows([{ id: 'DAY-1', sailingId: 'SAIL-1' }], [{ id: 'SAIL-1', shipId: 'SHIP-1' }], [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }], ...adminRows)
    await expect(canAccessItineraryDayTenant(tenantAdmin, 'DAY-1')).resolves.toBe(true)

    queueSelectRows([{ id: 'ACT-1', itineraryDayId: 'DAY-1' }], [{ id: 'DAY-1', sailingId: 'SAIL-1' }], [{ id: 'SAIL-1', shipId: 'SHIP-2' }], [{ id: 'SHIP-2', cruiseLineId: 'CL-2' }], ...adminRows)
    await expect(canAccessActivityTenant(tenantAdmin, 'ACT-1')).resolves.toBe(false)
  })

  it('forces tenant-scoped audit filters and rejects cross-tenant filter requests', () => {
    const tenantScope = { isGlobalAdmin: false, cruiseLineId: 'CL-1' }
    expect(constrainAuditFiltersToTenant({ eventType: 'SHIP_UPDATED' }, tenantScope)).toEqual({ eventType: 'SHIP_UPDATED', cruiseLineId: 'CL-1' })
    expect(constrainAuditFiltersToTenant({ cruiseLineId: 'CL-2' }, tenantScope)).toBeNull()
    expect(constrainAuditFiltersToTenant({ cruiseLineId: 'CL-2' }, { isGlobalAdmin: true })).toEqual({ cruiseLineId: 'CL-2' })
    expect(constrainAuditFiltersToTenant({}, { isGlobalAdmin: false, cruiseLineId: null })).toBeNull()
  })
})
