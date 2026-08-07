const { expectControllerDelegated, readProjectFile: read } = require('./controllerFacadeTestHelpers')

describe('Customer controller boundary', () => {
  const legacyController = read('controllers/cruise.controller.js')
  const customerController = read('controllers/customer.controller.js')
  const customerManagementController = read('controllers/customerManagement.controller.js')
  const passengerExperienceController = read('controllers/passengerExperience.controller.js')

  it('delegates customer handlers through stable composition boundaries', () => {
    expectControllerDelegated(legacyController, 'customerController', './customer.controller')
    expect(customerController).toContain("require('./customerManagement.controller')")
    expect(customerController).toContain("require('./passengerExperience.controller')")
  })

  it('separates customer lifecycle management from passenger voyage experience', () => {
    for (const handler of ['getCustomers', 'getCustomerById', 'insertCustomer', 'updateCustomer', 'deleteCustomer']) {
      expect(customerManagementController).toContain(`exports.${handler} = async`)
      expect(passengerExperienceController).not.toContain(`exports.${handler} = async`)
    }

    for (const handler of ['updatePassengerSelfServiceProfile', 'updatePassengerPreCruiseChecklist', 'updatePassengerBookingPreferences', 'addItineraryFavorite', 'deleteItineraryFavorite']) {
      expect(passengerExperienceController).toContain(`exports.${handler} = async`)
      expect(customerManagementController).not.toContain(`exports.${handler} = async`)
    }
  })

  it('preserves customer and passenger preference audit coverage', () => {
    for (const eventType of ['CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'CUSTOMER_DELETED']) {
      expect(customerManagementController).toContain(`eventType: '${eventType}'`)
    }
    for (const eventType of ['PASSENGER_PROFILE_UPDATED', 'PASSENGER_CHECKLIST_UPDATED', 'PASSENGER_BOOKING_PREFERENCES_UPDATED', 'PASSENGER_ITINERARY_FAVORITE_SAVED', 'PASSENGER_ITINERARY_FAVORITE_REMOVED']) {
      expect(passengerExperienceController).toContain(`eventType: '${eventType}'`)
    }
  })
})
