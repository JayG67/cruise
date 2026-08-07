const { expectControllerDelegated, readProjectFile } = require('./controllerFacadeTestHelpers')

const bookingManagementHandlers = [
  'getBookings',
  'getBookingById',
  'getBookingsByCustomer',
  'insertBooking',
  'updateBooking',
  'deleteBooking'
]

const bookingPassengerHandlers = [
  'addBookingPassenger',
  'deleteBookingPassenger'
]

describe('Booking controller decomposition contracts', () => {
  const legacyController = readProjectFile('controllers/cruise.controller.js')
  const bookingController = readProjectFile('controllers/booking.controller.js')
  const bookingManagementController = readProjectFile('controllers/bookingManagement.controller.js')
  const bookingPassengerController = readProjectFile('controllers/bookingPassenger.controller.js')
  const bookingDomain = readProjectFile('services/bookingDomain.service.js')

  it('delegates the booking boundary through stable composition facades', () => {
    expectControllerDelegated(legacyController, 'bookingController', './booking.controller')
    expect(bookingController).toContain("require('./bookingManagement.controller')")
    expect(bookingController).toContain("require('./bookingPassenger.controller')")
  })

  it('keeps booking HTTP handlers out of the legacy and composition controllers', () => {
    for (const handler of bookingManagementHandlers) {
      expect(legacyController).not.toContain(`exports.${handler} =`)
      expect(bookingController).not.toContain(`exports.${handler} =`)
      expect(bookingManagementController).toContain(`exports.${handler} =`)
    }

    for (const handler of bookingPassengerHandlers) {
      expect(legacyController).not.toContain(`exports.${handler} =`)
      expect(bookingController).not.toContain(`exports.${handler} =`)
      expect(bookingPassengerController).toContain(`exports.${handler} =`)
    }
  })

  it('centralizes reusable booking query and validation behavior', () => {
    for (const helper of [
      'buildBookingPassengerStorageValues',
      'findBookingOverlapForPassengers',
      'getBookingDetails',
      'getBookingDetailsBatch'
    ]) {
      expect(bookingDomain).toContain(`function ${helper}`)
    }

    expect(legacyController).toContain("const { getBookingDetails } = require('../services/bookingDomain.service')")
    expect(bookingManagementController).toContain("require('../services/bookingDomain.service')")
    expect(bookingPassengerController).toContain("require('../services/bookingDomain.service')")
  })

  it('preserves booking lifecycle and passenger audit events in their owning controllers', () => {
    for (const eventType of ['BOOKING_CREATED', 'BOOKING_UPDATED', 'BOOKING_DELETED']) {
      expect(bookingManagementController).toContain(`eventType: '${eventType}'`)
    }

    for (const eventType of ['BOOKING_PASSENGER_ADDED', 'BOOKING_PASSENGER_REMOVED']) {
      expect(bookingPassengerController).toContain(`eventType: '${eventType}'`)
    }
  })
})
