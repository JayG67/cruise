const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const {
  openFirstReactFleetShips,
  openFirstReactSailingItinerary,
  openFirstReactShipSailings,
  reactBookings,
  reactCustomers,
  reactCruiseLines,
  reactItinerary,
  reactSailings,
  reactShips,
  selectDemoUserByVisibleRole,
  visitReactAppAsAdmin
} = require('./support/reactTestHelpers.js')

describe('React role journey permissions and validation coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  function assertAdminOnlySurfacesAreHidden() {
    cy.getByTestId(rs.activeRouteOperations).should('not.exist')
    cy.getByTestId(rs.adminMutationPanel).should('not.exist')
    cy.getByTestId(rs.fleetDirectory).should('not.exist')
    cy.getByTestId(rs.createCruiseLineWorkflow).should('not.exist')
    cy.getByTestId(rs.sqaConsole).should('not.exist')
    cy.getByTestId(rs.adminCreateCustomerSubmit).should('not.exist')
    cy.getByTestId(rs.adminDeleteBookingSubmit).should('not.exist')
    cy.getByTestId(rs.deleteShipButton).should('not.exist')
  }

  it('enforces role surfaces: admin can manage operations, passenger and group leader cannot', () => {
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.adminMutationPanel).should('be.visible')
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.createCruiseLineWorkflow).should('be.visible')
    cy.getByTestId(rs.sqaConsole).should('be.visible')

    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.passengerDashboard).should('be.visible')
    cy.getByTestId(rs.passengerSelfServicePanel).should('be.visible')
    assertAdminOnlySurfacesAreHidden()

    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId(rs.passengerDashboard).should('be.visible')
    cy.getByTestId(rs.roleBookingCard).should('have.length', 1)
    cy.getByTestId(rs.passengerSelfServicePanel).should('not.exist')
    assertAdminOnlySurfacesAreHidden()
  })

  it('covers passenger profile negative and successful self-service journeys', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.intercept('PATCH', `/cruise/customers/${reactCustomers[0].id}/passenger-profile`, req => {
      expect(req.body).to.include({
        firstName: 'Jay',
        lastName: 'Cruiser',
        email: 'jay.cruiser@example.com',
        phone: '555-7777',
        diningPreference: 'Late seating',
        accessibilityNotes: 'Aisle seating preferred'
      })
      req.reply({ statusCode: 200, body: { message: 'Passenger profile updated successfully' } })
    }).as('savePassengerProfile')

    cy.getByTestId(rs.passengerProfileEmail).clear().type('not-an-email')
    cy.getByTestId(rs.passengerProfileSubmitButton).click()
    cy.getByTestId(rs.passengerProfileEmail).then($input => {
      expect($input[0].checkValidity()).to.equal(false)
    })
    cy.get('@savePassengerProfile.all').should('have.length', 0)

    cy.getByTestId(rs.passengerProfileEmail).clear().type('jay.cruiser@example.com')
    cy.getByTestId(rs.passengerProfileLastName).clear().type('Cruiser')
    cy.getByTestId(rs.passengerProfilePhone).clear().type('555-7777')
    cy.getByTestId(rs.diningPreferenceSelect).select('Late seating')
    cy.getByTestId(rs.passengerProfileAccessibilityNotes).clear().type('Aisle seating preferred')
    cy.getByTestId(rs.passengerProfileSubmitButton).click()
    cy.wait('@savePassengerProfile')
    cy.getByTestId(rs.passengerProfileMessage).should('contain.text', 'Passenger profile updated successfully')
  })

  it('keeps group leader visibility scoped to grouped bookings and passenger manifest only', () => {
    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId(rs.passengerDashboard).should('contain.text', 'Group leader dashboard loaded')
    cy.getByTestId(rs.roleBookingCard)
      .should('have.length', 1)
      .and('contain.text', reactBookings[1].id)
      .and('not.contain.text', reactBookings[0].id)

    cy.getByTestId(rs.roleBookingDetailsToggle).click()
    cy.getByTestId(rs.roleDetailPassengerRow).should('have.length', 2)
    cy.getByTestId(rs.roleDetailPassengerRow).should('contain.text', 'Morgan Leader')
    cy.getByTestId(rs.roleDetailPassengerRow).should('contain.text', 'Jay Gallagher')
    cy.getByTestId(rs.passengerProfileSubmitButton).should('not.exist')
    cy.getByTestId(rs.adminMutationPanel).should('not.exist')
  })

  it('validates admin customer and booking CRUD required fields and API failures from the UI', () => {
    cy.intercept('POST', '/cruise/customers').as('unexpectedCustomerCreate')
    cy.intercept('POST', '/cruise/bookings').as('unexpectedBookingCreate')
    cy.intercept('DELETE', '/cruise/customers/*').as('unexpectedCustomerDelete')
    cy.intercept('DELETE', '/cruise/bookings/*').as('unexpectedBookingDelete')

    cy.getByTestId(rs.adminCreateCustomerSubmit).click()
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'First name, last name, and email are required')
    cy.get('@unexpectedCustomerCreate.all').should('have.length', 0)

    cy.getByTestId(rs.adminCreateBookingSubmit).click()
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'Customer ID, booking status, and cabin number are required')
    cy.get('@unexpectedBookingCreate.all').should('have.length', 0)

    cy.getByTestId(rs.adminDeleteCustomerSubmit).click()
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'Customer ID is required')
    cy.get('@unexpectedCustomerDelete.all').should('have.length', 0)

    cy.getByTestId(rs.adminDeleteBookingSubmit).click()
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'Booking ID is required')
    cy.get('@unexpectedBookingDelete.all').should('have.length', 0)

    cy.intercept('POST', '/cruise/customers', {
      statusCode: 409,
      body: { message: 'Email already exists for this customer journey test' }
    }).as('duplicateCustomerCreate')
    cy.getByTestId(rs.adminCreateCustomerFirstName).type('Duplicate')
    cy.getByTestId(rs.adminCreateCustomerLastName).type('Guest')
    cy.getByTestId(rs.adminCreateCustomerEmail).type('jay.react@example.com')
    cy.getByTestId(rs.adminCreateCustomerSubmit).click()
    cy.wait('@duplicateCustomerCreate')
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'Email already exists for this customer journey test')
    cy.getByTestId(rs.adminCreateCustomerEmail).should('have.value', 'jay.react@example.com')
  })

  it('validates fleet, ship, sailing, itinerary day, and activity CRUD constraints from the UI', () => {
    cy.intercept('POST', '/cruise/ship').as('unexpectedShipCreate')
    cy.intercept('POST', '/cruise/sailings').as('unexpectedSailingCreate')
    cy.intercept('POST', '/cruise/itinerary-days').as('unexpectedDayCreate')
    cy.intercept('POST', '/cruise/itinerary-days/*/activities').as('unexpectedActivityCreate')

    cy.getByTestId(rs.saveCruiseLine).click()
    cy.getByTestId(rs.createCruiseLineMessage).should('contain.text', 'Cruise line name is required')

    openFirstReactFleetShips()
    cy.getByTestId(rs.createShipSubmitButton).click()
    cy.getByTestId(rs.shipActionMessage).should('contain.text', 'Ship name is required')
    cy.get('@unexpectedShipCreate.all').should('have.length', 0)

    openFirstReactShipSailings()
    cy.getByTestId(rs.createSailingSubmitButton).click()
    cy.getByTestId(rs.sailingActionMessage).should('contain.text', 'Departure date, ports, and a valid day count are required')
    cy.get('@unexpectedSailingCreate.all').should('have.length', 0)

    openFirstReactSailingItinerary()
    cy.getByTestId(rs.createItineraryDaySubmitButton).click()
    cy.getByTestId(rs.itineraryActionMessage).should('contain.text', 'Day number and title are required')
    cy.get('@unexpectedDayCreate.all').should('have.length', 0)

    cy.getByTestId(rs.createItineraryActivitySubmitButton).click()
    cy.getByTestId(rs.itineraryActionMessage).should('contain.text', 'Select an itinerary day before creating an activity')
    cy.getByTestId(rs.createItineraryActivityDaySelect).select(reactItinerary[0].id)
    cy.getByTestId(rs.createItineraryActivitySubmitButton).click()
    cy.getByTestId(rs.itineraryActionMessage).should('contain.text', 'Activity time and description are required')
    cy.get('@unexpectedActivityCreate.all').should('have.length', 0)
  })

  it('covers successful admin create/delete journeys with confirmation and data refreshes', () => {
    cy.intercept('POST', '/cruise/customers', req => {
      expect(req.body).to.include({
        firstName: 'Journey',
        lastName: 'Tester',
        email: 'journey.tester@example.com'
      })
      req.reply({ statusCode: 201, body: { id: 'journey-customer', ...req.body } })
    }).as('createJourneyCustomer')
    cy.intercept('GET', '/cruise/customers', [...reactCustomers, {
      id: 'journey-customer',
      firstName: 'Journey',
      lastName: 'Tester',
      email: 'journey.tester@example.com',
      phone: '555-8811',
      loyaltyNumber: 'JOURNEY-1'
    }]).as('reloadCustomersAfterJourneyCreate')

    cy.getByTestId(rs.adminCreateCustomerFirstName).type(' Journey ')
    cy.getByTestId(rs.adminCreateCustomerLastName).type(' Tester ')
    cy.getByTestId(rs.adminCreateCustomerEmail).type(' journey.tester@example.com ')
    cy.getByTestId(rs.adminCreateCustomerPhone).type(' 555-8811 ')
    cy.getByTestId(rs.adminCreateCustomerLoyalty).type(' JOURNEY-1 ')
    cy.getByTestId(rs.adminCreateCustomerSubmit).click()
    cy.wait('@createJourneyCustomer')
    cy.wait('@reloadCustomersAfterJourneyCreate')
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'Journey Tester was created')

    cy.intercept('DELETE', `/cruise/bookings/${reactBookings[0].id}`, {
      statusCode: 200,
      body: { message: 'Booking deleted successfully' }
    }).as('deleteJourneyBooking')
    cy.intercept('GET', '/cruise/bookings', [reactBookings[1]]).as('reloadBookingsAfterJourneyDelete')

    cy.getByTestId(rs.adminDeleteBookingId).type(reactBookings[0].id)
    cy.getByTestId(rs.adminDeleteBookingSubmit).click()
    cy.getByTestId(rs.adminDeleteConfirmation).should('contain.text', reactBookings[0].id)
    cy.getByTestId(rs.adminDeleteConfirmationConfirm).click()
    cy.wait('@deleteJourneyBooking')
    cy.wait('@reloadBookingsAfterJourneyDelete')
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', `${reactBookings[0].id} booking was deleted`)
  })

  it('covers successful fleet and itinerary journeys with payload verification', () => {
    openFirstReactFleetShips()

    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body).to.include({
        cruiseLineId: reactCruiseLines[0].id,
        name: 'Journey Ship',
        currentPort: 'Galveston, Texas'
      })
      req.reply({ statusCode: 201, body: { id: 'ship-journey', ...req.body } })
    }).as('createJourneyShip')
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, [...reactShips, {
      id: 'ship-journey',
      cruiseLineId: reactCruiseLines[0].id,
      name: 'Journey Ship',
      currentPort: 'Galveston, Texas'
    }]).as('reloadShipsAfterJourneyCreate')

    cy.getByTestId(rs.createShipNameInput).type(' Journey Ship ')
    cy.getByTestId(rs.createShipCurrentPortInput).type(' Galveston, Texas ')
    cy.getByTestId(rs.createShipSubmitButton).click()
    cy.wait('@createJourneyShip')
    cy.wait('@reloadShipsAfterJourneyCreate')
    cy.getByTestId(rs.shipActionMessage).should('contain.text', 'Journey Ship was added')

    openFirstReactShipSailings()
    openFirstReactSailingItinerary()

    cy.intercept('POST', `/cruise/itinerary-days/${reactItinerary[0].id}/activities`, req => {
      expect(req.body).to.include({
        time: '02:30 PM',
        activity: 'Journey shore excursion'
      })
      expect(req.url).to.include(`/cruise/itinerary-days/${reactItinerary[0].id}/activities`)
      req.reply({ statusCode: 201, body: { id: 'activity-journey', ...req.body } })
    }).as('createJourneyActivity')
    cy.intercept('GET', `/cruise/sailings/${reactSailings[0].id}/itinerary`, [{
      ...reactItinerary[0],
      activitySchedule: [...reactItinerary[0].activitySchedule, {
        id: 'activity-journey',
        time: '02:30 PM',
        activity: 'Journey shore excursion'
      }]
    }, reactItinerary[1]]).as('reloadItineraryAfterJourneyActivity')

    cy.getByTestId(rs.createItineraryActivityDaySelect).select(reactItinerary[0].id)
    cy.getByTestId(rs.createItineraryActivityTime).type(' 02:30 PM ')
    cy.getByTestId(rs.createItineraryActivityName).type(' Journey shore excursion ')
    cy.getByTestId(rs.createItineraryActivitySubmitButton).click()
    cy.wait('@createJourneyActivity')
    cy.wait('@reloadItineraryAfterJourneyActivity')
    cy.getByTestId(rs.itineraryActionMessage).should('contain.text', 'Journey shore excursion was added')
    cy.getByTestId(rs.itineraryActivity).should('contain.text', 'Journey shore excursion')
  })


  it('asks before giving passenger users access to admin-only fleet and SQA shortcuts', () => {
    selectDemoUserByVisibleRole('Passenger')

    cy.getByTestId(rs.workspaceFleetButton).scrollIntoView().click()
    cy.getByTestId(rs.roleSwitchConfirmationOverlay).should('be.visible')
    cy.getByTestId(rs.roleSwitchConfirmation)
      .should('be.visible')
      .and('contain.text', 'Fleet Directory requires the Admin role')
    cy.getByTestId(rs.roleSwitchConfirmationCancel).click()

    cy.getByTestId(rs.roleSwitchConfirmation).should('not.exist')
    cy.getByTestId(rs.fleetDirectory).should('not.exist')
    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Passenger')

    cy.getByTestId(rs.workspaceQualityButton).scrollIntoView().click()
    cy.getByTestId(rs.roleSwitchConfirmationOverlay).should('be.visible')
    cy.getByTestId(rs.roleSwitchConfirmation)
      .should('be.visible')
      .and('contain.text', 'Quality Console requires the Admin role')
    cy.getByTestId(rs.roleSwitchConfirmationCancel).click()

    cy.getByTestId(rs.roleSwitchConfirmation).should('not.exist')
    cy.getByTestId(rs.sqaConsole).should('not.exist')
    cy.getByTestId(rs.passengerDashboard).should('be.visible')
    cy.getByTestId(rs.passengerSelfServicePanel).should('be.visible')
  })

  it('blocks group leader access to passenger self-service and admin destructive controls', () => {
    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId(rs.groupLeaderDashboard)
      .should('contain.text', 'Group booking dashboard')
      .and('contain.text', 'Group leader dashboard loaded with passenger-manifest visibility.')
    cy.getByTestId(rs.passengerSelfServicePanel).should('not.exist')
    cy.getByTestId(rs.adminDeleteCustomerSubmit).should('not.exist')
    cy.getByTestId(rs.adminDeleteBookingSubmit).should('not.exist')
    cy.getByTestId(rs.sqaResetDemoDataButton).should('not.exist')
  })

  it('keeps admin-only create drafts out of passenger and group leader journeys after role switching', () => {
    cy.getByTestId(rs.adminCreateCustomerFirstName).type('Role Leak')
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.adminCreateCustomerFirstName).should('not.exist')
    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId(rs.adminCreateCustomerFirstName).should('not.exist')
    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId(rs.adminCreateCustomerFirstName).should('have.value', '')
  })

  it('keeps invalid admin delete IDs from sending destructive requests', () => {
    cy.intercept('DELETE', '/cruise/customers/*').as('customerDeleteShouldNotRun')
    cy.intercept('DELETE', '/cruise/bookings/*').as('bookingDeleteShouldNotRun')
    cy.getByTestId(rs.adminDeleteCustomerId).type('   ')
    cy.getByTestId(rs.adminDeleteCustomerSubmit).click()
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'Customer ID is required')
    cy.getByTestId(rs.adminDeleteBookingId).type('   ')
    cy.getByTestId(rs.adminDeleteBookingSubmit).click()
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'Booking ID is required')
    cy.get('@customerDeleteShouldNotRun.all').should('have.length', 0)
    cy.get('@bookingDeleteShouldNotRun.all').should('have.length', 0)
  })

  it('preserves editable passenger profile values after a failed save', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.intercept('PATCH', `/cruise/customers/${reactCustomers[0].id}/passenger-profile`, {
      statusCode: 503,
      body: { message: 'Profile service unavailable' }
    }).as('failedPassengerProfileSave')

    cy.getByTestId(rs.passengerProfilePhone).clear().type('555-1212')
    cy.getByTestId(rs.passengerProfileAccessibilityNotes).clear().type('Needs quiet cabin')
    cy.getByTestId(rs.passengerProfileSubmitButton).click()
    cy.wait('@failedPassengerProfileSave')
    cy.getByTestId(rs.passengerProfileMessage).should('contain.text', 'Profile service unavailable')
    cy.getByTestId(rs.passengerProfilePhone).should('have.value', '555-1212')
    cy.getByTestId(rs.passengerProfileAccessibilityNotes).should('have.value', 'Needs quiet cabin')
  })
})
