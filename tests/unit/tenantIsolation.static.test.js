const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')
const routes = fs.readFileSync(path.join(projectRoot, 'routes/cruise.routes.js'), 'utf8')
const tenantAccess = fs.readFileSync(path.join(projectRoot, 'services/tenantAccess.service.js'), 'utf8')
const tenantBoundary = fs.readFileSync(path.join(projectRoot, 'services/tenantBoundary.service.js'), 'utf8')
const platformAdmin = fs.readFileSync(path.join(projectRoot, 'controllers/platformOperationsAdmin.controller.js'), 'utf8')

function routeBlock(method, routePath) {
  const marker = `router.${method}(\n  '${routePath}'`
  const start = routes.indexOf(marker)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = routes.indexOf('\n)', start)
  return routes.slice(start, end + 2)
}

describe('cruise-line tenant isolation contracts', () => {
  it('derives admin tenant scope from active app-user role assignments rather than request headers alone', () => {
    expect(tenantAccess).toContain("require('../models/appUserRole.model')")
    expect(tenantAccess).toContain("eq(appUserRoleTable.status, 'ACTIVE')")
    expect(tenantAccess).toContain('assignment.cruiseLineId || appUser.cruiseLineId')
    expect(tenantAccess).toContain('claimedTenantId !== cruiseLineId')
  })

  it('keeps cruise-line creation global-admin only and tenant-scopes fleet hierarchy mutations', () => {
    expect(routeBlock('post', '/cruise-line')).toContain('requireGlobalAdminMutation')

    const protectedRoutes = [
      ['post', '/ship', "requireCruiseLineTenantAccess('cruiseLineId')"],
      ['patch', '/cruise-line/:id', "requireCruiseLineTenantAccess('id')"],
      ['delete', '/cruise-line/:id', "requireCruiseLineTenantAccess('id')"],
      ['patch', '/ship/:id', "requireShipTenantAccess('id')"],
      ['delete', '/ship/:id', "requireShipTenantAccess('id')"],
      ['post', '/ship/:shipId/sailings', "requireShipTenantAccess('shipId')"],
      ['patch', '/sailings/:id', "requireSailingTenantAccess('id')"],
      ['delete', '/sailings/:id', "requireSailingTenantAccess('id')"],
      ['post', '/sailings/:sailingId/itinerary', "requireSailingTenantAccess('sailingId')"],
      ['patch', '/itinerary-days/:id', "requireItineraryDayTenantAccess('id')"],
      ['delete', '/itinerary-days/:id', "requireItineraryDayTenantAccess('id')"],
      ['post', '/itinerary-days/:itineraryDayId/activities', "requireItineraryDayTenantAccess('itineraryDayId')"],
      ['patch', '/activities/:id', "requireActivityTenantAccess('id')"],
      ['delete', '/activities/:id', "requireActivityTenantAccess('id')"]
    ]

    for (const [method, routePath, middleware] of protectedRoutes) {
      const block = routeBlock(method, routePath)
      expect(block).toContain('requireAdminMutation')
      expect(block).toContain(middleware)
    }
  })

  it('prevents ship reassignment across tenants by checking both existing and requested cruise-line scope', () => {
    const block = routeBlock('patch', '/ship/:id')
    expect(block).toContain("requireShipTenantAccess('id')")
    expect(block).toContain("requireCruiseLineTenantAccess('cruiseLineId')")
  })

  it('protects platform audit reads and constrains their filters to the authenticated tenant', () => {
    const block = routeBlock('get', '/audit-events')
    expect(block).toContain('requireAdminAccess')
    expect(block).toContain('requireTenantAuditAccess')
    expect(platformAdmin).toContain('req.tenantAuditFilters || buildAuditEventFilters(req.query)')
  })

  it('uses fail-closed compatibility when required tenant metadata is absent', () => {
    expect(tenantBoundary).toContain('return Boolean(candidateValue && candidateValue === requiredValue)')
    expect(tenantBoundary).not.toContain('return !candidateValue || candidateValue === requiredValue')
  })
})
