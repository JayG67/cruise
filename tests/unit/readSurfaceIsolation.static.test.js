const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')
const routes = fs.readFileSync(path.join(projectRoot, 'routes/cruise.routes.js'), 'utf8')
const customerAccess = fs.readFileSync(path.join(projectRoot, 'services/customerAccess.service.js'), 'utf8')
const customerTenantAccess = fs.readFileSync(path.join(projectRoot, 'services/customerTenantAccess.service.js'), 'utf8')
const customerController = fs.readFileSync(path.join(projectRoot, 'controllers/customerManagement.controller.js'), 'utf8')
const bookingController = fs.readFileSync(path.join(projectRoot, 'controllers/bookingManagement.controller.js'), 'utf8')

function routeBlock(method, routePath) {
  const marker = `router.${method}(\n  '${routePath}'`
  const start = routes.indexOf(marker)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = routes.indexOf('\n)', start)
  return routes.slice(start, end + 2)
}

describe('Slice 9 customer tenant and read-surface isolation contracts', () => {
  it('derives booking ownership through the authoritative sailing and ship hierarchy', () => {
    expect(customerTenantAccess).toContain("require('../models/sailing.model')")
    expect(customerTenantAccess).toContain("require('../models/ship.model')")
    expect(customerTenantAccess).toContain('booking.sailingId')
    expect(customerTenantAccess).toContain('sailing.shipId')
    expect(customerTenantAccess).toContain('ship.cruiseLineId')
  })

  it('tenant-filters bulk customer and booking reads instead of trusting query tenant IDs', () => {
    expect(routeBlock('get', '/customers')).toContain('requireAdminAccess')
    expect(routeBlock('get', '/bookings')).toContain('requireAdminAccess')
    expect(customerController).toContain('filterCustomersForAdminTenant(req, allCustomers)')
    expect(bookingController).toContain('filterBookingsForAdminTenant(req, allBookings)')
    expect(customerController).toContain('getAuthenticationMode() === AUTH_MODES.DEMO')
    expect(bookingController).toContain('getAuthenticationMode() === AUTH_MODES.DEMO')
    expect(customerTenantAccess).not.toContain('req.query')
    expect(customerTenantAccess).not.toContain('req.body.cruiseLineId')
  })

  it('tenant-scopes admin detail and mutation access for customer and booking resources', () => {
    expect(customerAccess).toContain('canAdminAccessCustomerTenant(req, customerId)')
    expect(customerAccess).toContain('canAdminAccessBookingTenant(req, bookingId)')

    for (const [method, routePath, middleware] of [
      ['patch', '/customers/:id', "requireCustomerTenantAdminAccess('id')"],
      ['delete', '/customers/:id', "requireCustomerTenantAdminAccess('id')"],
      ['patch', '/bookings/:id', "requireBookingTenantAdminAccess('id')"],
      ['delete', '/bookings/:id', "requireBookingTenantAdminAccess('id')"],
      ['post', '/bookings/:bookingId/passengers', "requireBookingTenantAdminAccess('bookingId')"],
      ['delete', '/bookings/:bookingId/passengers/:customerId', "requireBookingTenantAdminAccess('bookingId')"]
    ]) {
      expect(routeBlock(method, routePath)).toContain(middleware)
    }
  })

  it('prevents tenant admins from creating unscoped customers or moving bookings across tenants', () => {
    expect(routeBlock('post', '/customers')).toContain('requireGlobalAdminMutation')
    expect(routeBlock('post', '/bookings')).toContain('requireBookingCreationTenantAccess')
    expect(routeBlock('patch', '/bookings/:id')).toContain('requireBookingDestinationTenantAccess')
  })

  it('makes platform-wide readiness and turnaround setup global-admin-only in JWT mode', () => {
    for (const routePath of [
      '/data-architecture/readiness',
      '/production-hardening/readiness',
      '/deployment/readiness',
      '/public-launch/readiness',
      '/turnaround-admin/setup'
    ]) {
      expect(routeBlock('get', routePath)).toContain('requireGlobalAdminAccess')
    }
  })

  it('keeps demo identity/context reads unavailable outside demo authentication mode', () => {
    expect(routeBlock('get', '/demo-users')).toContain('requireDemoReadAccess')
    expect(routeBlock('get', '/demo-users/:id/context')).toContain('requireDemoReadAccess')
  })
})
