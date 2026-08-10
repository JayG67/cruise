const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '../..')
const routes = fs.readFileSync(path.join(projectRoot, 'routes/cruise.routes.js'), 'utf8')
const middleware = fs.readFileSync(path.join(projectRoot, 'middleware/authorization.middleware.js'), 'utf8')
const accessService = fs.readFileSync(path.join(projectRoot, 'services/customerAccess.service.js'), 'utf8')

function routeBlock(route) {
  const index = routes.indexOf(`'${route}'`)
  expect(index).toBeGreaterThanOrEqual(0)
  return routes.slice(index, index + 240)
}

describe('customer and booking authorization contracts', () => {
  it('protects bulk passenger data and generic customer/booking administration', () => {
    expect(routeBlock('/customers')).toContain('requireAdminAccess')
    expect(routeBlock('/bookings')).toContain('requireAdminAccess')
    expect(routeBlock('/customers')).toContain('cruiseController.getCustomers')

    expect(routeBlock('/customers/:id')).toContain("requireCustomerAccess('id')")
    expect(routeBlock('/customers/:customerId/bookings')).toContain("requireCustomerAccess('customerId')")
    expect(routeBlock('/bookings/:id')).toContain("requireBookingAccess('id')")

    const customerCreate = routes.indexOf("router.post(\n  '/customers'")
    const customerUpdate = routes.indexOf("router.patch(\n  '/customers/:id'")
    const customerDelete = routes.indexOf("router.delete(\n  '/customers/:id'")
    const bookingUpdate = routes.indexOf("router.patch(\n  '/bookings/:id'")
    const bookingDelete = routes.indexOf("router.delete(\n  '/bookings/:id'")
    ;[customerCreate, customerUpdate, customerDelete, bookingUpdate, bookingDelete].forEach(index => {
      expect(index).toBeGreaterThanOrEqual(0)
      expect(routes.slice(index, index + 180)).toContain('requireAdminMutation')
    })
  })

  it('binds passenger self-service mutations to authenticated customer and booking ownership', () => {
    expect(routeBlock('/customers/:id/passenger-profile')).toContain("requireCustomerAccess('id')")
    expect(routeBlock('/customers/:id/pre-cruise-checklist')).toContain("requireCustomerAccess('id')")
    expect(routeBlock('/bookings/:bookingId/passengers/:customerId/preferences')).toContain('requireBookingPassengerAccess')
    expect(routeBlock('/itinerary-favorites')).toContain('requireFavoriteCustomerAccess')
    expect(routeBlock('/itinerary-favorites/:customerId/:activityScheduleId')).toContain('requireFavoriteCustomerAccess')
    expect(routeBlock('/bookings')).toContain('requireAdminAccess')

    const bookingCreate = routes.indexOf("router.post(\n  '/bookings'")
    expect(routes.slice(bookingCreate, bookingCreate + 180)).toContain('requireBookingCreationAccess')
  })

  it('resolves JWT principals through server-side app-user ownership rather than request customer IDs', () => {
    expect(accessService).toContain("require('../models/appUser.model')")
    expect(accessService).toContain('appUser?.primaryCustomerId')
    expect(accessService).toContain('bookingPassengerTable.customerId')
    expect(accessService).toContain('booking.createdByUserId === scope.userId')
    expect(accessService).toContain('payload.createdByCustomerId')
    expect(accessService).toContain('passengers.every')
    expect(middleware).toContain('if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()')
  })
})
