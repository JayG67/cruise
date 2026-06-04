const {
  openFirstReactFleetShips,
  openFirstReactSailingItinerary,
  openFirstReactShipSailings,
  reactBookings,
  reactCruiseLines,
  reactCustomers,
  reactItinerary,
  reactSailings,
  reactShips,
  visitReactAppAsAdmin
} = require('./support/reactTestHelpers.js')

describe('React application mutation verification hardening', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  function openCustomerWorkflows() {
    cy.getByTestId('react-toggle-customer-workflows').click()
    cy.getByTestId('react-customer-workflow-table').should('be.visible')
  }

  it('verifies a created customer appears in the visible admin workflow table, not only the API response', () => {
    const createdCustomer = {
      id: 'react-created-visible-customer',
      firstName: 'Visible',
      lastName: 'Customer',
      email: 'visible.customer@example.com',
      phone: '555-4477',
      loyaltyNumber: 'VC-4477'
    }

    cy.intercept('POST', '/cruise/customers', req => {
      expect(req.body).to.include({
        firstName: createdCustomer.firstName,
        lastName: createdCustomer.lastName,
        email: createdCustomer.email
      })
      req.reply({ statusCode: 201, body: createdCustomer })
    }).as('createVisibleCustomer')
    cy.intercept('GET', '/cruise/customers', [...reactCustomers, createdCustomer]).as('reloadCustomersWithVisibleCustomer')

    cy.getByTestId('react-admin-create-customer-first-name').type(createdCustomer.firstName)
    cy.getByTestId('react-admin-create-customer-last-name').type(createdCustomer.lastName)
    cy.getByTestId('react-admin-create-customer-email').type(createdCustomer.email)
    cy.getByTestId('react-admin-create-customer-phone').type(createdCustomer.phone)
    cy.getByTestId('react-admin-create-customer-loyalty').type(createdCustomer.loyaltyNumber)
    cy.getByTestId('react-admin-create-customer-submit').click()

    cy.wait('@createVisibleCustomer')
    cy.wait('@reloadCustomersWithVisibleCustomer')
    cy.getByTestId('react-admin-mutation-message').should('contain.text', 'Visible Customer')

    openCustomerWorkflows()
    cy.getByTestId('react-hierarchy-search-input').type('visible.customer@example.com')
    cy.getByTestId('react-customer-workflow-table')
      .should('contain.text', 'Customer, Visible')
      .and('contain.text', createdCustomer.email)
  })

  it('verifies a deleted booking disappears from the admin workflow UI after reload', () => {
    cy.intercept('DELETE', `/cruise/bookings/${reactBookings[0].id}`, {
      statusCode: 200,
      body: { id: reactBookings[0].id, deleted: true }
    }).as('deleteBookingForUiVerification')
    cy.intercept('GET', '/cruise/bookings', [reactBookings[1]]).as('reloadBookingsWithoutDeletedBooking')

    openCustomerWorkflows()
    cy.getByTestId('react-expand-visible-customers').click()
    cy.getByTestId('react-customer-workflow-table').should('contain.text', reactBookings[0].id)
    cy.getByTestId('react-admin-delete-booking-id').type(reactBookings[0].id)
    cy.getByTestId('react-admin-delete-booking-submit').click()
    cy.getByTestId('react-admin-delete-confirmation-confirm').click()

    cy.wait('@deleteBookingForUiVerification')
    cy.wait('@reloadBookingsWithoutDeletedBooking')
    cy.getByTestId('react-hierarchy-search-input').clear().type(reactBookings[0].id)
    cy.getByTestId('react-customer-workflow-table')
      .should('contain.text', `No customer or linked booking records match “${reactBookings[0].id}”.`)
      .and('not.contain.text', reactBookings[0].id.replace('react-booking-', 'Booking '))
  })

  it('verifies a created ship appears as a ship card with its returned port after reload', () => {
    const createdShip = {
      id: 'ship-visible-verification',
      cruiseLineId: reactCruiseLines[0].id,
      name: 'Verification of the Seas',
      currentPort: 'Galveston, Texas'
    }

    openFirstReactFleetShips()
    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body).to.include({ name: createdShip.name, currentPort: createdShip.currentPort })
      req.reply({ statusCode: 201, body: createdShip })
    }).as('createShipForUiVerification')
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, [...reactShips, createdShip]).as('reloadShipsWithCreatedShip')

    cy.getByTestId('react-create-ship-name-input').type(createdShip.name)
    cy.getByTestId('react-create-ship-current-port-input').type(createdShip.currentPort)
    cy.getByTestId('react-create-ship-submit-button').click()

    cy.wait('@createShipForUiVerification')
    cy.wait('@reloadShipsWithCreatedShip')
    cy.getByTestId('react-ship-card-grid')
      .should('contain.text', createdShip.name)
      .and('contain.text', createdShip.currentPort)
  })

  it('verifies a ship update replaces stale card text with the reloaded ship data', () => {
    const updatedShip = { ...reactShips[0], name: 'Verified Updated Ship', currentPort: 'Seattle, Washington' }

    openFirstReactFleetShips()
    cy.intercept('PATCH', `/cruise/ship/${reactShips[0].id}`, req => {
      expect(req.body).to.include({ name: updatedShip.name, currentPort: updatedShip.currentPort })
      req.reply({ statusCode: 200, body: updatedShip })
    }).as('updateShipForUiVerification')
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, [updatedShip, reactShips[1]]).as('reloadShipsWithUpdatedShip')

    cy.getByTestId('react-ship-card').first().within(() => {
      cy.getByTestId('react-update-ship-button').click()
      cy.getByTestId('react-edit-ship-name').clear().type(updatedShip.name)
      cy.getByTestId('react-edit-ship-current-port').clear().type(updatedShip.currentPort)
      cy.getByTestId('react-save-ship-edit').click()
    })

    cy.wait('@updateShipForUiVerification')
    cy.wait('@reloadShipsWithUpdatedShip')
    cy.getByTestId('react-ship-card-grid')
      .should('contain.text', updatedShip.name)
      .and('contain.text', updatedShip.currentPort)
      .and('not.contain.text', reactShips[0].currentPort)
  })

  it('verifies a created sailing appears in the sailing card list after reload', () => {
    const createdSailing = {
      id: 'sailing-visible-verification',
      shipId: reactShips[0].id,
      departureDate: '2028-04-18',
      departurePort: 'Tampa, Florida',
      arrivalPort: 'Key West, Florida',
      days: 5,
      isRepositioning: false
    }

    openFirstReactFleetShips()
    openFirstReactShipSailings()
    cy.intercept('POST', `/cruise/ship/${reactShips[0].id}/sailings`, req => {
      expect(req.body).to.include({ departureDate: createdSailing.departureDate, departurePort: createdSailing.departurePort, arrivalPort: createdSailing.arrivalPort, days: createdSailing.days })
      req.reply({ statusCode: 201, body: createdSailing })
    }).as('createSailingForUiVerification')
    cy.intercept('GET', `/cruise/ship/${reactShips[0].id}/sailings`, [...reactSailings, createdSailing]).as('reloadSailingsWithCreatedSailing')

    cy.getByTestId('react-create-sailing-departure-date').type(createdSailing.departureDate)
    cy.getByTestId('react-create-sailing-departure-port').type(createdSailing.departurePort)
    cy.getByTestId('react-create-sailing-arrival-port').type(createdSailing.arrivalPort)
    cy.getByTestId('react-create-sailing-days').type(String(createdSailing.days))
    cy.getByTestId('react-create-sailing-submit-button').click()

    cy.wait('@createSailingForUiVerification')
    cy.wait('@reloadSailingsWithCreatedSailing')
    cy.getByTestId('react-sailing-card-grid')
      .should('contain.text', createdSailing.departureDate)
      .and('contain.text', createdSailing.arrivalPort)
  })

  it('verifies itinerary activity creation appears in the itinerary UI after reload', () => {
    const createdActivity = { id: 'activity-visible-verification', time: '04:45 PM', activity: 'Guest operations readiness briefing' }
    const reloadedItinerary = [
      {
        ...reactItinerary[0],
        activities: [...reactItinerary[0].activities, createdActivity],
        activitySchedule: [...reactItinerary[0].activitySchedule, createdActivity]
      },
      reactItinerary[1]
    ]

    openFirstReactFleetShips()
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()
    cy.intercept('POST', `/cruise/itinerary-days/${reactItinerary[0].id}/activities`, req => {
      expect(req.body).to.include({ time: createdActivity.time, activity: createdActivity.activity })
      req.reply({ statusCode: 201, body: createdActivity })
    }).as('createActivityForUiVerification')
    cy.intercept('GET', `/cruise/sailings/${reactSailings[0].id}/itinerary`, reloadedItinerary).as('reloadItineraryWithCreatedActivity')

    cy.getByTestId('react-create-itinerary-activity-day-select').select(reactItinerary[0].id)
    cy.getByTestId('react-create-itinerary-activity-time').type(createdActivity.time)
    cy.getByTestId('react-create-itinerary-activity-name').type(createdActivity.activity)
    cy.getByTestId('react-create-itinerary-activity-submit-button').click()

    cy.wait('@createActivityForUiVerification')
    cy.wait('@reloadItineraryWithCreatedActivity')
    cy.getByTestId('react-itinerary-activity-list')
      .should('contain.text', createdActivity.time)
      .and('contain.text', createdActivity.activity)
  })
})
