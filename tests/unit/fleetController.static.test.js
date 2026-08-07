const { expectControllerDelegated, readProjectFile: read } = require('./controllerFacadeTestHelpers')

describe('Fleet controller decomposition contracts', () => {
  test('keeps the legacy controller as a thin compatibility facade for fleet handlers', () => {
    const controller = read('controllers/cruise.controller.js')

    expectControllerDelegated(controller, 'fleetController', './fleet.controller')
    expect(controller).not.toContain('exports.insertCruiseLine =')
    expect(controller).not.toContain('exports.insertShip =')
    expect(controller).not.toContain('exports.deleteCruiseLine =')
    expect(controller).not.toContain('exports.deleteShip =')
  })

  test('separates cruise-line and ship HTTP behavior behind the fleet facade', () => {
    const facade = read('controllers/fleet.controller.js')
    const cruiseLineController = read('controllers/cruiseLineManagement.controller.js')
    const shipController = read('controllers/shipManagement.controller.js')
    const controller = `${cruiseLineController}\n${shipController}`

    expect(facade).toContain("require('./cruiseLineManagement.controller')")
    expect(facade).toContain("require('./shipManagement.controller')")

    for (const handler of [
      'getCruiseLines',
      'getMissingCruiseLineId',
      'getCruiseLineById',
      'getShipsByCruiseLine',
      'insertCruiseLine',
      'insertShip',
      'updateCruiseLine',
      'updateShip',
      'deleteCruiseLine',
      'deleteShip'
    ]) {
      expect(controller).toContain(`exports.${handler} =`)
    }

    expect(cruiseLineController).toContain("require('../services/fleetHierarchy.service')")
    expect(shipController).toContain("require('../services/fleetHierarchy.service')")
    expect(cruiseLineController).toContain("eventType: 'CRUISE_LINE_CREATED'")
    expect(shipController).toContain("eventType: 'SHIP_CREATED'")
  })

  test('centralizes destructive fleet hierarchy cleanup for fleet and sailing flows', () => {
    const service = read('services/fleetHierarchy.service.js')
    const sailingControllers = [
      read('controllers/sailingManagement.controller.js'),
      read('controllers/itineraryManagement.controller.js')
    ].join('\n')

    expect(service).toContain('async function deleteActivitiesForItineraryDayIds')
    expect(service).toContain('async function deleteItineraryForSailingIds')
    expect(service).toContain('async function deleteSailingsForShipIds')
    expect(service).toContain('async function deleteShipHierarchy')
    expect(sailingControllers).toContain("require('../services/fleetHierarchy.service')")
    expect(sailingControllers).not.toContain('async function deleteShipHierarchy(')
  })
})
