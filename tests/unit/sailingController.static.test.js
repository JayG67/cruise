const { expectControllerDelegated, readProjectFile: read } = require('./controllerFacadeTestHelpers')

describe('Sailing and itinerary controller decomposition contracts', () => {
  test('keeps the legacy controller as a compatibility facade for sailing handlers', () => {
    const controller = read('controllers/cruise.controller.js')

    expectControllerDelegated(controller, 'sailingController', './sailing.controller')

    for (const handler of [
      'getSailingsByShip',
      'getItineraryBySailing',
      'insertSailing',
      'updateSailing',
      'deleteSailing',
      'insertItineraryDay',
      'updateItineraryDay',
      'deleteItineraryDay',
      'insertActivitySchedule',
      'updateActivitySchedule',
      'deleteActivitySchedule'
    ]) {
      expect(controller).not.toContain(`exports.${handler} =`)
    }
  })

  test('keeps the route-facing sailing controller as a thin domain composition facade', () => {
    const controller = read('controllers/sailing.controller.js')

    expect(controller).toContain("require('./sailingManagement.controller')")
    expect(controller).toContain("require('./itineraryQuery.controller')")
    expect(controller).toContain("require('./itineraryManagement.controller')")
    expect(controller).toContain('...sailingManagementController')
    expect(controller).toContain('...itineraryQueryController')
    expect(controller).toContain('...itineraryManagementController')
    expect(controller).not.toContain('exports.getSailingsByShip =')
  })

  test('separates voyage lifecycle, itinerary queries, and itinerary administration', () => {
    const sailingManagement = read('controllers/sailingManagement.controller.js')
    const itineraryQuery = read('controllers/itineraryQuery.controller.js')
    const itineraryManagement = read('controllers/itineraryManagement.controller.js')

    for (const handler of ['getSailingsByShip', 'insertSailing', 'updateSailing', 'deleteSailing']) {
      expect(sailingManagement).toContain(`exports.${handler} =`)
    }
    expect(sailingManagement).toContain("eventType: 'SAILING_CREATED'")

    expect(itineraryQuery).toContain('exports.getItineraryBySailing =')
    expect(itineraryQuery).toContain('getCustomerFavoriteActivityIds')

    for (const handler of [
      'insertItineraryDay',
      'updateItineraryDay',
      'deleteItineraryDay',
      'insertActivitySchedule',
      'updateActivitySchedule',
      'deleteActivitySchedule'
    ]) {
      expect(itineraryManagement).toContain(`exports.${handler} =`)
    }
    expect(itineraryManagement).toContain("eventType: 'ITINERARY_DAY_CREATED'")
    expect(itineraryManagement).toContain("eventType: 'ITINERARY_ACTIVITY_CREATED'")
  })

  test('shares sailing and itinerary audit scoping across controller boundaries', () => {
    const service = read('services/sailingAuditScope.service.js')
    const sailingManagement = read('controllers/sailingManagement.controller.js')
    const itineraryManagement = read('controllers/itineraryManagement.controller.js')
    const passengerExperienceController = read('controllers/passengerExperience.controller.js')

    expect(service).toContain('async function getSailingAuditScope')
    expect(service).toContain('async function getItineraryDayAuditScope')
    expect(service).toContain('async function getActivityAuditScope')
    expect(sailingManagement).toContain("require('../services/sailingAuditScope.service')")
    expect(itineraryManagement).toContain("require('../services/sailingAuditScope.service')")
    expect(passengerExperienceController).toContain("const { getActivityAuditScope } = require('../services/sailingAuditScope.service')")
  })
})
