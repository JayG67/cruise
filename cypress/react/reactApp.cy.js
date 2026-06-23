const { byTestId, reactSelectorKeys: rs } = require('./support/reactSelectors')
Cypress.Commands.add('getByTestId', selectorKey => cy.get(byTestId(selectorKey)))

function selectDemoUserByVisibleRole(roleText, personText = '') {
  cy.getByTestId(rs.roleTypeSelect)
    .find('option')
    .contains(roleText)
    .invoke('val')
    .then(roleValue => {
      cy.getByTestId(rs.roleTypeSelect).select(roleValue)
    })

  if (/passenger/i.test(roleText)) {
    cy.getByTestId(rs.passengerFinderPanel).should('be.visible')
    cy.getByTestId(rs.passengerFinderResultCard).should('have.length.greaterThan', 0)

    if (personText) {
      cy.getByTestId(rs.passengerSearchInput).clear().type(personText)
      cy.getByTestId(rs.passengerFinderResultCard).contains(personText).click()
      return
    }

    cy.getByTestId(rs.passengerFinderResultCard).first().click()
    return
  }

  if (/turnaround|housekeeping|guest services|food|beverage|engineering|security|port operations/i.test(roleText)) {
    cy.getByTestId(rs.operationalPersonFilterPanel).should('be.visible')
    cy.getByTestId(rs.personFinderResultCard).should('have.length.greaterThan', 0)

    if (personText) {
      cy.getByTestId(rs.personSearchInput).clear().type(personText)
      cy.getByTestId(rs.personFinderResultCard).contains(personText).click()
      return
    }

    cy.getByTestId(rs.personFinderResultCard).first().click()
    return
  }

  cy.getByTestId(rs.personFinderPanel).should('be.visible')
  cy.getByTestId(rs.personFinderResultCard).should('have.length.greaterThan', 0)

  if (personText) {
    cy.getByTestId(rs.personSearchInput).clear().type(personText)
    cy.getByTestId(rs.personFinderResultCard).contains(personText).click()
    return
  }

  cy.getByTestId(rs.personFinderResultCard).first().click()
}


function fillReactInput(selectorKey, value) {
  cy.getByTestId(selectorKey).should('be.visible').and('not.be.disabled')
  cy.getByTestId(selectorKey).clear()
  cy.getByTestId(selectorKey).should('be.visible').and('not.be.disabled')
  cy.getByTestId(selectorKey).type(value)
  cy.getByTestId(selectorKey).should('have.value', value)
}

function visitReactAppAsAdmin() {
  cy.visit('/')
  cy.getByTestId(rs.personFinderPanel).should('be.visible')
  selectDemoUserByVisibleRole('Admin')
  cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Admin')
}

describe('Cruise operations portfolio route', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('loads the cruise operations shell and core workspaces', () => {
    cy.getByTestId(rs.productionShell).should('be.visible')
    cy.getByTestId(rs.topNavigation).should('be.visible')
    cy.getByTestId(rs.roleSelector).should('be.visible')
    cy.getByTestId(rs.personFinderPanel).should('be.visible')
    cy.getByTestId(rs.workspaceCardGrid).should('be.visible')
    cy.getByTestId(rs.retiredRouteNav).should('not.exist')
    cy.getByTestId(rs.releaseReadinessSection).should('not.exist')
    cy.contains('Cruise operations command center').should('not.exist')
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.sqaConsole).should('be.visible')
  })



  it('navigates real application workspaces from the product controls', () => {
    cy.getByTestId(rs.workspaceRoleButton).click()
    cy.getByTestId(rs.roleSelector).should('be.visible')
    cy.getByTestId(rs.workspaceOperationsButton).click()
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.workspaceFleetButton).click()
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.workspaceQualityButton).click()
    cy.getByTestId(rs.sqaConsole).should('be.visible')
  })

  it('switches from admin to passenger view when a passenger demo user is selected', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Passenger')
    cy.getByTestId(rs.passengerDashboard).should('be.visible')
    cy.contains('Passenger booking dashboard').should('be.visible')
    cy.contains('My travel profile').should('be.visible')
    cy.getByTestId(rs.activeRouteOperations).should('not.exist')
  })


  it('opens React passenger booking details and filters favorite itinerary activities', () => {
    const demoUsers = [
      {
        id: 'react-admin-user',
        displayName: 'React Admin',
        role: 'Admin',
        email: 'admin.react@example.com'
      },
      {
        id: 'react-passenger-user',
        displayName: 'React Passenger',
        role: 'Passenger',
        customerId: 'react-passenger-customer',
        email: 'react.passenger@example.com'
      }
    ]
    const customers = [
      {
        id: 'react-passenger-customer',
        firstName: 'React',
        lastName: 'Passenger',
        email: 'react.passenger@example.com',
        phone: '555-0303'
      }
    ]
    const bookings = [
      {
        id: 'react-passenger-booking',
        bookingStatus: 'CONFIRMED',
        cabinNumber: 'P101',
        fareCode: 'RP',
        embarkationPort: 'Miami',
        debarkationPort: 'Nassau',
        createdByCustomerId: 'react-passenger-customer',
        cruiseLine: { name: 'React Cruise Line' },
        ship: { name: 'React Ship' },
        sailing: {
          departureDate: '2026-12-12',
          itinerary: [
            {
              id: 'react-day-1',
              day: 1,
              title: 'React Embarkation',
              port: 'Miami',
              activities: [
                { id: 'react-activity-1', time: '08:00 AM', activity: 'Terminal arrival' }
              ]
            },
            {
              id: 'react-day-2',
              day: 2,
              title: 'React Port Day',
              port: 'Nassau',
              activities: [
                { id: 'react-activity-2', time: '10:00 AM', activity: 'Harbor walk' }
              ]
            }
          ]
        },
        passengers: [
          {
            customerId: 'react-passenger-customer',
            passengerType: 'Primary',
            customer: customers[0]
          }
        ]
      }
    ]

    cy.intercept('GET', '/cruise/demo-users', demoUsers).as('loadReactDemoUsersForPassengerDetails')
    cy.intercept('GET', '/cruise/customers', customers).as('loadReactCustomersForPassengerDetails')
    cy.intercept('GET', '/cruise/bookings', bookings).as('loadReactBookingsForPassengerDetails')

    visitReactAppAsAdmin()
    cy.wait('@loadReactDemoUsersForPassengerDetails')
    cy.wait('@loadReactCustomersForPassengerDetails')
    cy.wait('@loadReactBookingsForPassengerDetails')

    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.passengerDashboard).should('be.visible')
    cy.getByTestId(rs.roleBookingCard).should('contain.text', 'react-passenger-booking')
    cy.getByTestId(rs.roleBookingDetailsToggle).click()
    cy.getByTestId(rs.roleBookingDetails).should('contain.text', 'Booking details')
    cy.getByTestId(rs.roleDetailPassengerRow).should('contain.text', 'React Passenger')
    cy.getByTestId(rs.roleItineraryDay).should('have.length', 2)
    cy.getByTestId(rs.roleFavoriteItineraryToggle).first().check()
    cy.getByTestId(rs.roleFavoritesOnlyToggle).check()
    cy.getByTestId(rs.roleItineraryDay).should('have.length', 1).and('contain.text', 'React Embarkation')
    cy.getByTestId(rs.roleBookingDetailsToggle).click()
    cy.getByTestId(rs.roleBookingDetails).should('not.exist')
  })


  it('saves React passenger profile and preference changes through the passenger self-service API', () => {
    const demoUsers = [
      {
        id: 'react-admin-user',
        displayName: 'React Admin',
        role: 'Admin',
        email: 'admin.react@example.com'
      },
      {
        id: 'react-passenger-user',
        displayName: 'React Passenger',
        role: 'Passenger',
        customerId: 'react-passenger-customer',
        email: 'react.passenger@example.com'
      }
    ]
    const customers = [
      {
        id: 'react-passenger-customer',
        firstName: 'React',
        lastName: 'Passenger',
        email: 'react.passenger@example.com',
        phone: '555-0303'
      }
    ]
    const bookings = [
      {
        id: 'react-passenger-booking',
        bookingStatus: 'CONFIRMED',
        cabinNumber: 'P101',
        fareCode: 'RP',
        embarkationPort: 'Miami',
        debarkationPort: 'Nassau',
        createdByCustomerId: 'react-passenger-customer',
        cruiseLine: { name: 'React Cruise Line' },
        ship: { name: 'React Ship' },
        passengers: [
          {
            customerId: 'react-passenger-customer',
            passengerType: 'Primary',
            diningPreference: 'Anytime dining',
            accessibilityNotes: '',
            customer: customers[0]
          }
        ]
      }
    ]

    cy.intercept('GET', '/cruise/demo-users', demoUsers).as('loadReactDemoUsersForPassengerProfile')
    cy.intercept('GET', '/cruise/customers', customers).as('loadReactCustomersForPassengerProfile')
    cy.intercept('GET', '/cruise/bookings', bookings).as('loadReactBookingsForPassengerProfile')
    cy.intercept('PATCH', '/cruise/customers/react-passenger-customer/passenger-profile', req => {
      expect(req.body).to.include({
        firstName: 'React',
        lastName: 'Passenger',
        email: 'react.passenger@example.com',
        phone: '555-9191',
        diningPreference: 'Late seating',
        accessibilityNotes: 'Prefers elevators near dining room'
      })

      req.reply({
        statusCode: 200,
        body: { message: 'Passenger profile updated successfully' }
      })
    }).as('saveReactPassengerProfile')

    visitReactAppAsAdmin()
    cy.wait('@loadReactDemoUsersForPassengerProfile')
    cy.wait('@loadReactCustomersForPassengerProfile')
    cy.wait('@loadReactBookingsForPassengerProfile')

    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.passengerProfileForm).should('be.visible').within(() => {
      cy.getByTestId(rs.passengerProfilePhone).clear().type('555-9191')
      cy.getByTestId(rs.diningPreferenceSelect).select('Late seating')
      cy.getByTestId(rs.passengerProfileAccessibilityNotes).type('Prefers elevators near dining room')
      cy.getByTestId(rs.passengerProfileSubmitButton).click()
    })

    cy.wait('@saveReactPassengerProfile')
    cy.getByTestId(rs.passengerProfileMessage).should('contain.text', 'Passenger profile updated successfully')
  })


  it('switches through React role dashboards using the actual demo user select', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.passengerDashboard).should('be.visible')
    cy.getByTestId(rs.activeRouteOperations).should('not.exist')

    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId(rs.groupLeaderDashboard).should('be.visible')

    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Admin')
  })

  it('switches back to admin view and exposes admin replacement workflows', () => {
    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Admin')
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.createCruiseLineWorkflow).should('be.visible')
    cy.getByTestId(rs.sqaConsole).should('be.visible')
  })



  it('creates and deletes React admin customers and bookings', () => {
    const adminCrudCustomers = []
    const adminCrudBookings = [
      {
        id: 'react-booking-created',
        bookingStatus: 'CONFIRMED',
        cabinNumber: 'R100',
        fareCode: 'RX',
        embarkationPort: 'Miami',
        debarkationPort: 'Nassau',
        cruiseLineName: 'Royal Caribbean International',
        shipName: 'Wonder of the Seas',
        createdByCustomerId: 'react-customer-created',
        passengers: []
      }
    ]

    cy.intercept('GET', '/cruise/customers', req => {
      req.reply({ statusCode: 200, body: adminCrudCustomers })
    }).as('refreshAdminCrudCustomers')
    cy.intercept('GET', '/cruise/bookings', req => {
      req.reply({ statusCode: 200, body: adminCrudBookings })
    }).as('refreshAdminCrudBookings')

    cy.intercept('POST', '/cruise/customers', req => {
      expect(req.body).to.include({
        firstName: 'React',
        lastName: 'Admin',
        email: 'react.admin@example.com'
      })

      const createdCustomer = {
        id: 'react-customer-created',
        firstName: 'React',
        lastName: 'Admin',
        email: 'react.admin@example.com',
        phone: '555-0101',
        loyaltyNumber: 'RX-100'
      }

      adminCrudCustomers.push(createdCustomer)
      req.reply({
        statusCode: 201,
        body: createdCustomer
      })
    }).as('createReactCustomer')

    cy.intercept('DELETE', '/cruise/customers/react-customer-created', req => {
      adminCrudCustomers.splice(0, adminCrudCustomers.length)
      req.reply({
        statusCode: 200,
        body: { deleted: true }
      })
    }).as('deleteReactCustomer')

    cy.intercept('POST', '/cruise/bookings', req => {
      expect(req.body).to.include({
        customerId: 'react-customer-created',
        bookingStatus: 'CONFIRMED',
        cabinNumber: 'R100'
      })

      const createdBooking = {
        id: 'react-booking-created',
        bookingStatus: 'CONFIRMED',
        cabinNumber: 'R100',
        fareCode: 'RX',
        embarkationPort: 'Miami',
        debarkationPort: 'Nassau',
        createdByCustomerId: 'react-customer-created',
        passengers: [
          {
            customerId: 'react-customer-created',
            passengerType: 'Primary',
            customer: adminCrudCustomers[0]
          }
        ]
      }

      adminCrudBookings.push(createdBooking)
      req.reply({
        statusCode: 201,
        body: createdBooking
      })
    }).as('createReactBooking')

    cy.intercept('DELETE', '/cruise/bookings/react-booking-created', req => {
      adminCrudBookings.splice(0, adminCrudBookings.length)
      req.reply({
        statusCode: 200,
        body: { deleted: true }
      })
    }).as('deleteReactBooking')

    fillReactInput(rs.adminCreateCustomerFirstName, 'React')
    fillReactInput(rs.adminCreateCustomerLastName, 'Admin')
    fillReactInput(rs.adminCreateCustomerEmail, 'react.admin@example.com')
    fillReactInput(rs.adminCreateCustomerPhone, '555-0101')
    fillReactInput(rs.adminCreateCustomerLoyalty, 'RX-100')
    cy.getByTestId(rs.adminCreateCustomerSubmit).click()
    cy.wait('@createReactCustomer')
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'React Admin was created')
    cy.getByTestId(rs.adminCreateBookingForm).should('not.exist')

    cy.getByTestId(rs.adminDeleteBookingId).select('react-booking-created')
    cy.getByTestId(rs.adminDeleteBookingSubmit).click()
    cy.getByTestId(rs.adminDeleteConfirmation).should('contain.text', 'Delete booking react-booking-created?')
    cy.getByTestId(rs.adminDeleteConfirmationConfirm).click()
    cy.wait('@deleteReactBooking')
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'react-booking-created booking was deleted')

    cy.getByTestId(rs.adminDeleteCustomerId).select('react-customer-created')
    cy.getByTestId(rs.adminDeleteCustomerSubmit).click()
    cy.getByTestId(rs.adminDeleteConfirmation).should('contain.text', 'Delete customer react-customer-created?')
    cy.getByTestId(rs.adminDeleteConfirmationConfirm).click()
    cy.wait('@deleteReactCustomer')
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'react-customer-created customer was deleted')
    cy.getByTestId(rs.adminDeleteConfirmation).should('not.exist')
  })


  it('deletes React admin customer and booking records from contextual workflow rows', () => {
    const customerRows = [
      {
        id: 'react-context-customer',
        firstName: 'Context',
        lastName: 'Admin',
        email: 'context.admin@example.com',
        phone: '555-0202',
        loyaltyNumber: 'CTX-200'
      }
    ]
    const bookingRows = [
      {
        id: 'react-context-booking',
        bookingStatus: 'CONFIRMED',
        cabinNumber: 'C200',
        fareCode: 'CTX',
        embarkationPort: 'Miami',
        debarkationPort: 'Nassau',
        createdByCustomerId: 'react-context-customer',
        passengers: [
          {
            customerId: 'react-context-customer',
            customer: customerRows[0]
          }
        ],
        cruiseLine: { name: 'Context Cruises' },
        ship: { name: 'Context Ship' },
        sailing: { departureDate: '2026-09-12' }
      }
    ]

    cy.intercept('GET', '/cruise/customers', req => {
      req.reply({ statusCode: 200, body: customerRows })
    }).as('loadContextCustomers')
    cy.intercept('GET', '/cruise/bookings', req => {
      req.reply({ statusCode: 200, body: bookingRows })
    }).as('loadContextBookings')
    cy.intercept('DELETE', '/cruise/bookings/react-context-booking', req => {
      bookingRows.splice(0, bookingRows.length)
      req.reply({ statusCode: 200, body: { deleted: true } })
    }).as('deleteContextBooking')
    cy.intercept('DELETE', '/cruise/customers/react-context-customer', req => {
      customerRows.splice(0, customerRows.length)
      req.reply({ statusCode: 200, body: { deleted: true } })
    }).as('deleteContextCustomer')

    visitReactAppAsAdmin()
    cy.wait('@loadContextCustomers')
    cy.wait('@loadContextBookings')

    cy.getByTestId(rs.toggleCustomerWorkflows).click()
    cy.getByTestId(rs.customerWorkflowTable).should('contain.text', 'Admin, Context')
    cy.getByTestId(rs.toggleCustomerBookings).click()
    cy.getByTestId(rs.bookingCard).should('contain.text', 'react-context-booking')

    cy.getByTestId(rs.deleteBookingRowButton).click()
    cy.getByTestId(rs.adminDeleteConfirmation).should('contain.text', 'Delete booking react-context-booking?')
    cy.getByTestId(rs.adminDeleteConfirmationConfirm).click()
    cy.wait('@deleteContextBooking')
    cy.wait('@loadContextCustomers')
    cy.wait('@loadContextBookings')
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'react-context-booking booking was deleted')

    cy.getByTestId(rs.deleteCustomerRowButton).click()
    cy.getByTestId(rs.adminDeleteConfirmation).should('contain.text', 'Delete customer Admin, Context?')
    cy.getByTestId(rs.adminDeleteConfirmationConfirm).click()
    cy.wait('@deleteContextCustomer')
    cy.wait('@loadContextCustomers')
    cy.wait('@loadContextBookings')
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'Admin, Context customer was deleted')
    cy.getByTestId(rs.adminDeleteConfirmation).should('not.exist')
  })

  it('searches the React fleet directory and loads ships for a selected cruise line', () => {
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.fleetSearch).type('Royal')
    cy.getByTestId(rs.fleetCount).should('contain.text', 'matching cruise lines')
    cy.getByTestId(rs.fleetCard).first().should('contain.text', 'Royal')

    cy.getByTestId(rs.viewShipsButton).first().click()
    cy.getByTestId(rs.selectedShipsPanel).should('be.visible')
    cy.getByTestId(rs.selectedShipsPanel).should('contain.text', 'Royal')
    cy.getByTestId(rs.shipCard).should('have.length.greaterThan', 0)
    cy.getByTestId(rs.shipCard).first().should('contain.text', 'Current port:')
  })



  it('updates a React cruise line from the fleet directory', () => {
    const royalCruiseLine = {
      id: 'royal-caribbean',
      name: 'Royal Caribbean International',
      country: 'United States',
      website: 'https://www.royalcaribbean.com'
    }
    cy.intercept('PATCH', '/cruise/cruise-line/*', req => {
      expect(req.url).to.match(/\/cruise\/cruise-line\/[0-9a-f-]{36}$/)
      expect(req.body).to.include({
        name: 'Royal Caribbean React Updated',
        country: 'United States React',
        website: 'https://react-updated.example.com',
        brandFamily: 'Royal Caribbean Group',
        brandTheme: 'Adventure Innovation'
      })
      expect(req.body.marketPositioning).to.contain('innovation-led cruising')

      const cruiseLineId = req.url.split('/').pop()

      req.reply({
        statusCode: 200,
        body: {
          ...royalCruiseLine,
          id: cruiseLineId,
          name: 'Royal Caribbean React Updated',
          country: 'United States React',
          website: 'https://react-updated.example.com'
        }
      })
    }).as('updateReactCruiseLine')

    cy.intercept('GET', '/cruise').as('reloadFleetAfterUpdate')

    cy.getByTestId(rs.fleetSearch).type('Royal')
    cy.getByTestId(rs.viewShipsButton).first().click()
    cy.getByTestId(rs.selectedShipsPanel).should('contain.text', 'Royal Caribbean International ships')

    cy.getByTestId(rs.updateCruiseLineButton).first().should('be.visible').click()
    cy.getByTestId(rs.cruiseLineEditForm).should('be.visible')
    cy.getByTestId(rs.editCruiseLineName).clear().type(' Royal Caribbean React Updated ')
    cy.getByTestId(rs.editCruiseLineCountry).clear().type(' United States React ')
    cy.getByTestId(rs.editCruiseLineWebsite).clear().type(' https://react-updated.example.com ')
    cy.getByTestId(rs.saveCruiseLineEdit).click()
    cy.wait('@updateReactCruiseLine')
    cy.wait('@reloadFleetAfterUpdate')
    cy.getByTestId(rs.fleetActionMessage).should('contain.text', 'Royal Caribbean React Updated was updated')
    cy.getByTestId(rs.selectedShipsPanel).should('contain.text', 'Royal Caribbean React Updated ships')
  })

  it('supports React fleet delete cancellation and confirmed deletion', () => {
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.intercept('DELETE', '/cruise/cruise-line/*', {
      statusCode: 200,
      body: { deleted: true }
    }).as('deleteCruiseLine')
    cy.intercept('GET', '/cruise').as('loadCruiseLines')

    cy.getByTestId(rs.fleetSearch).type('Norwegian')
    cy.getByTestId(rs.fleetCard).first().should('contain.text', 'Norwegian')

    cy.getByTestId(rs.deleteCruiseLineButton).first().click()
    cy.getByTestId(rs.fleetDeleteConfirmation).should('contain.text', 'Delete Norwegian')
    cy.getByTestId(rs.fleetDeleteConfirmationCancel).click()
    cy.get('@deleteCruiseLine.all').should('have.length', 0)

    cy.getByTestId(rs.deleteCruiseLineButton).first().click()
    cy.getByTestId(rs.fleetDeleteConfirmationConfirm).click()
    cy.wait('@deleteCruiseLine')
    cy.wait('@loadCruiseLines')
    cy.getByTestId(rs.fleetActionMessage).should('contain.text', 'was deleted')
  })


  it('creates a React cruise line with starter ships and reset behavior', () => {
    cy.intercept('POST', '/cruise/cruise-line', req => {
      expect(req.body).to.deep.equal({
        name: 'React Test Cruises',
        country: 'United States',
        website: 'https://react-test-cruises.example.com',
        brandFamily: 'React Holdings',
        brandTheme: 'Innovation',
        marketPositioning: 'Modern React cruise experiences'
      })

      req.reply({
        statusCode: 201,
        body: {
          id: 'react-test-cruise-line',
          name: 'React Test Cruises',
          country: 'United States',
          website: 'https://react-test-cruises.example.com',
          brandFamily: 'React Holdings',
          brandTheme: 'Innovation',
          marketPositioning: 'Modern React cruise experiences'
        }
      })
    }).as('createReactCruiseLine')

    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body.cruiseLineId).to.equal('react-test-cruise-line')
      expect(req.body.name).to.match(/React Ship (One|Two)/)
      expect(req.body.currentPort).to.match(/Tampa|Port Canaveral/)

      req.reply({
        statusCode: 201,
        body: {
          id: `created-${req.body.name.toLowerCase().replaceAll(' ', '-')}`,
          ...req.body
        }
      })
    }).as('createReactShip')

    cy.intercept('GET', '/cruise').as('reloadFleetAfterCreate')

    cy.getByTestId(rs.createCruiseLineName).clear().type('  React Test Cruises  ')
    cy.getByTestId(rs.createCruiseLineCountry).clear().type('  United States  ')
    cy.getByTestId(rs.createCruiseLineWebsite).clear().type('  https://react-test-cruises.example.com  ')
    cy.getByTestId(rs.createCruiseLineBrandFamily).clear().type('  React Holdings  ')
    cy.getByTestId(rs.createCruiseLineBrandTheme).clear().type('  Innovation  ')
    cy.getByTestId(rs.createCruiseLineMarketPositioning).clear().type('  Modern React cruise experiences  ')
    cy.getByTestId(rs.createShipName).first().should('not.be.disabled').clear().type('  React Ship One  ')
    cy.getByTestId(rs.createShipPort).first().clear().type('  Tampa  ')

    cy.getByTestId(rs.addShipRow).click()
    cy.getByTestId(rs.createShipName).last().type('  React Ship Two  ')
    cy.getByTestId(rs.createShipPort).last().type('  Port Canaveral  ')

    cy.getByTestId(rs.addShipRow).click()
    cy.getByTestId(rs.createShipName).last().type('  ')
    cy.getByTestId(rs.removeShipRow).last().click()

    cy.getByTestId(rs.saveCruiseLine).click()

    cy.wait('@createReactCruiseLine')
    cy.wait('@createReactShip')
    cy.wait('@createReactShip')
    cy.wait('@reloadFleetAfterCreate')
    cy.getByTestId(rs.createCruiseLineMessage).should('contain.text', 'React Test Cruises created successfully with 2 starter ships')

    cy.getByTestId(rs.createCruiseLineName).should('have.value', '')
    cy.getByTestId(rs.createShipName).should('have.length', 1)

    cy.getByTestId(rs.createShipName).should('be.disabled')
    cy.getByTestId(rs.addShipRow).should('be.disabled')

    cy.getByTestId(rs.createCruiseLineName).type('Temporary React Cruise')
    cy.getByTestId(rs.resetCruiseLine).click()
    cy.getByTestId(rs.createCruiseLineName).should('have.value', '')
    cy.getByTestId(rs.createCruiseLineMessage).should('contain.text', 'Ready to create cruise line data.')
  })


  it('manages React ship CRUD and sailing lookup from the selected fleet panel', () => {
    const royalShips = [
      { id: 'react-ship-1', name: 'React Wonder', currentPort: 'Miami', cruiseLineId: 'royal-caribbean' },
      { id: 'react-ship-2', name: 'React Utopia', currentPort: 'Port Canaveral', cruiseLineId: 'royal-caribbean' }
    ]

    cy.intercept('GET', '/cruise/ships/*', req => {
      req.reply({
        statusCode: 200,
        body: royalShips
      })
    }).as('loadReactShips')

    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body.name).to.equal('React Test Ship')
      expect(req.body.currentPort).to.equal('Tampa')
      expect(req.body.cruiseLineId).to.exist

      royalShips.push({
        id: 'react-created-ship',
        name: req.body.name,
        currentPort: req.body.currentPort,
        cruiseLineId: req.body.cruiseLineId
      })

      req.reply({ statusCode: 201, body: royalShips.at(-1) })
    }).as('createReactShip')

    cy.intercept('PATCH', '/cruise/ship/react-ship-1', req => {
      expect(req.body.name).to.equal('React Wonder Updated')
      expect(req.body.currentPort).to.equal('Nassau')

      royalShips[0] = { ...royalShips[0], name: req.body.name, currentPort: req.body.currentPort }
      req.reply({ statusCode: 200, body: royalShips[0] })
    }).as('updateReactShip')

    cy.intercept('DELETE', '/cruise/ship/react-ship-2', req => {
      const index = royalShips.findIndex(ship => ship.id === 'react-ship-2')
      if (index >= 0) royalShips.splice(index, 1)
      req.reply({ statusCode: 200, body: { deleted: true } })
    }).as('deleteReactShip')

    const reactSailings = [
      {
        id: 'react-sailing-1',
        departureDate: '2026-10-01',
        departurePort: 'Miami, Florida',
        arrivalPort: 'Nassau, Bahamas',
        days: 4,
        isRepositioning: false
      }
    ]

    cy.intercept('GET', '/cruise/ship/react-ship-1/sailings', req => {
      req.reply({ statusCode: 200, body: reactSailings })
    }).as('loadReactSailings')

    cy.intercept('POST', '/cruise/ship/react-ship-1/sailings', req => {
      expect(req.body).to.deep.equal({
        departureDate: '2026-11-02',
        departurePort: 'Tampa',
        arrivalPort: 'Cozumel',
        days: 5,
        isRepositioning: true
      })

      reactSailings.push({
        id: 'react-created-sailing',
        ...req.body
      })

      req.reply({ statusCode: 201, body: reactSailings.at(-1) })
    }).as('createReactSailing')

    cy.intercept('PATCH', '/cruise/sailings/react-sailing-1', req => {
      expect(req.body).to.deep.equal({
        departureDate: '2026-12-03',
        departurePort: 'Port Canaveral',
        arrivalPort: 'Key West',
        days: 3,
        isRepositioning: false
      })

      reactSailings[0] = { id: 'react-sailing-1', ...req.body }
      req.reply({ statusCode: 200, body: reactSailings[0] })
    }).as('updateReactSailing')

    cy.intercept('DELETE', '/cruise/sailings/react-created-sailing', req => {
      const index = reactSailings.findIndex(sailing => sailing.id === 'react-created-sailing')
      if (index >= 0) reactSailings.splice(index, 1)
      req.reply({ statusCode: 200, body: { deleted: true } })
    }).as('deleteReactSailing')

    const reactItineraryDays = [
      {
        id: 'react-day-1',
        day: 1,
        title: 'Embarkation Day',
        port: 'Miami, Florida',
        activitySchedule: [
          { id: 'react-activity-1', time: '9:00 AM', activity: 'Terminal arrival' },
          { id: 'react-activity-2', time: '4:00 PM', activity: 'Sail away celebration' }
        ]
      },
      {
        id: 'react-day-2',
        day: 2,
        title: 'Port Day',
        port: 'Nassau, Bahamas',
        activitySchedule: [
          { id: 'react-activity-3', time: '10:00 AM', activity: 'Harbor walking tour' }
        ]
      }
    ]

    cy.intercept('GET', '/cruise/sailings/react-sailing-1/itinerary', req => {
      req.reply({ statusCode: 200, body: reactItineraryDays })
    }).as('loadReactItinerary')

    cy.intercept('POST', '/cruise/sailings/react-sailing-1/itinerary', req => {
      expect(req.body).to.deep.equal({
        day: 3,
        title: 'React Sea Day',
        port: 'At Sea'
      })

      reactItineraryDays.push({
        id: 'react-created-day',
        ...req.body,
        activitySchedule: []
      })

      req.reply({ statusCode: 201, body: reactItineraryDays.at(-1) })
    }).as('createReactItineraryDay')

    cy.intercept('PATCH', '/cruise/itinerary-days/react-day-1', req => {
      expect(req.body).to.deep.equal({
        day: 1,
        title: 'React Embarkation Updated',
        port: 'Miami Updated'
      })

      reactItineraryDays[0] = { ...reactItineraryDays[0], ...req.body }
      req.reply({ statusCode: 200, body: reactItineraryDays[0] })
    }).as('updateReactItineraryDay')

    cy.intercept('DELETE', '/cruise/itinerary-days/react-created-day', req => {
      const index = reactItineraryDays.findIndex(day => day.id === 'react-created-day')
      if (index >= 0) reactItineraryDays.splice(index, 1)
      req.reply({ statusCode: 200, body: { deleted: true } })
    }).as('deleteReactItineraryDay')

    cy.intercept('POST', '/cruise/itinerary-days/react-day-1/activities', req => {
      expect(req.body).to.deep.equal({
        time: '7:30 PM',
        activity: 'React Dinner Show'
      })

      reactItineraryDays[0].activitySchedule.push({
        id: 'react-created-activity',
        ...req.body
      })

      req.reply({ statusCode: 201, body: reactItineraryDays[0].activitySchedule.at(-1) })
    }).as('createReactItineraryActivity')

    cy.intercept('PATCH', '/cruise/activities/react-activity-1', req => {
      expect(req.body).to.deep.equal({
        time: '8:00 AM',
        activity: 'React Terminal Arrival Updated'
      })

      reactItineraryDays[0].activitySchedule[0] = { ...reactItineraryDays[0].activitySchedule[0], ...req.body }
      req.reply({ statusCode: 200, body: reactItineraryDays[0].activitySchedule[0] })
    }).as('updateReactItineraryActivity')

    cy.intercept('DELETE', '/cruise/activities/react-created-activity', req => {
      reactItineraryDays[0].activitySchedule = reactItineraryDays[0].activitySchedule.filter(activity => activity.id !== 'react-created-activity')
      req.reply({ statusCode: 200, body: { deleted: true } })
    }).as('deleteReactItineraryActivity')

    cy.getByTestId(rs.fleetSearch).type('Royal')
    cy.getByTestId(rs.viewShipsButton).first().click()
    cy.wait('@loadReactShips')
    cy.getByTestId(rs.shipCard).should('have.length', 2)

    cy.getByTestId(rs.createShipNameInput).type(' React Test Ship ')
    cy.getByTestId(rs.createShipCurrentPortInput).type(' Tampa ')
    cy.getByTestId(rs.createShipSubmitButton).click()
    cy.wait('@createReactShip')
    cy.getByTestId(rs.shipActionMessage).should('contain.text', 'React Test Ship was added')
    cy.getByTestId(rs.shipCard).should('have.length', 3)

    cy.getByTestId(rs.updateShipButton).first().click()
    cy.getByTestId(rs.shipEditForm).should('be.visible')
    cy.getByTestId(rs.editShipName).clear().type(' React Wonder Updated ')
    cy.getByTestId(rs.editShipCurrentPort).clear().type(' Nassau ')
    cy.getByTestId(rs.saveShipEdit).click()
    cy.wait('@updateReactShip')
    cy.getByTestId(rs.shipActionMessage).should('contain.text', 'React Wonder Updated was updated')
    cy.getByTestId(rs.shipCard).first().should('contain.text', 'React Wonder Updated')

    cy.getByTestId(rs.viewSailingsButton).first().click()
    cy.wait('@loadReactSailings')
    cy.getByTestId(rs.sailingsPanel).should('be.visible')
    cy.getByTestId(rs.createSailingForm).should('be.visible')
    cy.getByTestId(rs.createSailingDepartureDate).type('2026-11-02')
    cy.getByTestId(rs.createSailingDeparturePort).type('Tampa')
    cy.getByTestId(rs.createSailingArrivalPort).type('Cozumel')
    cy.getByTestId(rs.createSailingDays).type('5')
    cy.getByTestId(rs.createSailingRepositioning).check()
    cy.getByTestId(rs.createSailingSubmitButton).click()
    cy.wait('@createReactSailing')
    cy.wait('@loadReactSailings')
    cy.getByTestId(rs.sailingActionMessage).should('contain.text', '2026-11-02 sailing was created')
    cy.getByTestId(rs.sailingCard).should('have.length', 2)

    cy.getByTestId(rs.updateSailingButton).first().click()
    cy.getByTestId(rs.sailingEditForm).should('be.visible')
    cy.getByTestId(rs.editSailingDepartureDate).clear().type('2026-12-03')
    cy.getByTestId(rs.editSailingDeparturePort).clear().type('Port Canaveral')
    cy.getByTestId(rs.editSailingArrivalPort).clear().type('Key West')
    cy.getByTestId(rs.editSailingDays).clear().type('3')
    cy.getByTestId(rs.editSailingRepositioning).should('not.be.checked')
    cy.getByTestId(rs.saveSailingEdit).click()
    cy.wait('@updateReactSailing')
    cy.wait('@loadReactSailings')
    cy.getByTestId(rs.sailingActionMessage).should('contain.text', '2026-12-03 sailing was updated')
    cy.getByTestId(rs.sailingCard).first().should('contain.text', '2026-12-03')

    cy.getByTestId(rs.deleteSailingButton).last().click()
    cy.getByTestId(rs.fleetDeleteConfirmation).should('contain.text', 'Delete sailing 2026-11-02?')
    cy.getByTestId(rs.fleetDeleteConfirmationConfirm).scrollIntoView().click()
    cy.wait('@deleteReactSailing')
    cy.wait('@loadReactSailings')
    cy.getByTestId(rs.sailingActionMessage).should('contain.text', '2026-11-02 sailing was deleted')
    cy.getByTestId(rs.sailingCard).should('have.length', 1)

    cy.getByTestId(rs.sailingCard).first().should('contain.text', '2026-12-03')
    cy.getByTestId(rs.sailingCard).first().should('contain.text', 'Round-Trip / Regional Sailing')
    cy.getByTestId(rs.viewItineraryButton).first().click()
    cy.wait('@loadReactItinerary')
    cy.getByTestId(rs.itineraryPanel).should('be.visible')
    cy.getByTestId(rs.itineraryDayCard).should('have.length', 2)
    cy.getByTestId(rs.itineraryActivity).should('have.length', 3)
    cy.getByTestId(rs.itineraryPanel).should('contain.text', 'Embarkation Day')
    cy.getByTestId(rs.itineraryPanel).should('contain.text', 'Sail away celebration')

    cy.getByTestId(rs.createItineraryDayNumber).type('3')
    cy.getByTestId(rs.createItineraryDayTitle).type('React Sea Day')
    cy.getByTestId(rs.createItineraryDayPort).type('At Sea')
    cy.getByTestId(rs.createItineraryDaySubmitButton).click()
    cy.wait('@createReactItineraryDay')
    cy.wait('@loadReactItinerary')
    cy.getByTestId(rs.itineraryActionMessage).should('contain.text', 'Day 3 was created')
    cy.getByTestId(rs.itineraryDayCard).should('have.length', 3)

    cy.getByTestId(rs.createItineraryActivityDaySelect).select('react-day-1')
    cy.getByTestId(rs.createItineraryActivityTime).type('7:30 PM')
    cy.getByTestId(rs.createItineraryActivityName).type('React Dinner Show')
    cy.getByTestId(rs.createItineraryActivitySubmitButton).click()
    cy.wait('@createReactItineraryActivity')
    cy.wait('@loadReactItinerary')
    cy.getByTestId(rs.itineraryActionMessage).should('contain.text', 'React Dinner Show was added')
    cy.getByTestId(rs.itineraryPanel).should('contain.text', 'React Dinner Show')

    cy.getByTestId(rs.updateItineraryDayButton).first().click()
    cy.getByTestId(rs.itineraryDayEditForm).should('be.visible')
    cy.getByTestId(rs.editItineraryDayNumber).clear().type('1')
    cy.getByTestId(rs.editItineraryDayTitle).clear().type('React Embarkation Updated')
    cy.getByTestId(rs.editItineraryDayPort).clear().type('Miami Updated')
    cy.getByTestId(rs.saveItineraryDayEdit).click()
    cy.wait('@updateReactItineraryDay')
    cy.wait('@loadReactItinerary')
    cy.getByTestId(rs.itineraryActionMessage).should('contain.text', 'Day 1 was updated')
    cy.getByTestId(rs.itineraryPanel).should('contain.text', 'React Embarkation Updated')

    cy.getByTestId(rs.updateItineraryActivityButton).first().click()
    cy.getByTestId(rs.itineraryActivityEditForm).should('be.visible')
    cy.getByTestId(rs.editItineraryActivityTime).clear().type('8:00 AM')
    cy.getByTestId(rs.editItineraryActivityName).clear().type('React Terminal Arrival Updated')
    cy.getByTestId(rs.saveItineraryActivityEdit).click()
    cy.wait('@updateReactItineraryActivity')
    cy.wait('@loadReactItinerary')
    cy.getByTestId(rs.itineraryActionMessage).should('contain.text', 'React Terminal Arrival Updated was updated')
    cy.getByTestId(rs.itineraryPanel).should('contain.text', 'React Terminal Arrival Updated')

    cy.getByTestId(rs.itineraryDayCard)
      .first()
      .find(byTestId(rs.deleteItineraryActivityButton))
      .last()
      .click()
    cy.getByTestId(rs.fleetDeleteConfirmation).should('contain.text', 'Delete activity React Dinner Show?')
    cy.getByTestId(rs.fleetDeleteConfirmationConfirm).scrollIntoView().click()
    cy.wait('@deleteReactItineraryActivity')
    cy.wait('@loadReactItinerary')
    cy.getByTestId(rs.itineraryActionMessage).should('contain.text', 'React Dinner Show was deleted')
    cy.getByTestId(rs.itineraryDayGrid).should('not.contain.text', 'React Dinner Show')

    cy.getByTestId(rs.itineraryDayCard).last().find(byTestId(rs.deleteItineraryDayButton)).click()
    cy.getByTestId(rs.fleetDeleteConfirmation).should('contain.text', 'Delete itinerary day 3?')
    cy.getByTestId(rs.fleetDeleteConfirmationConfirm).scrollIntoView().click()
    cy.wait('@deleteReactItineraryDay')
    cy.wait('@loadReactItinerary')
    cy.getByTestId(rs.itineraryActionMessage).should('contain.text', 'Day 3 was deleted')
    cy.getByTestId(rs.itineraryDayCard).should('have.length', 2)

    cy.getByTestId(rs.deleteShipButton).eq(1).click()
    cy.getByTestId(rs.fleetDeleteConfirmation).should('contain.text', 'Delete React Utopia?')
    cy.getByTestId(rs.fleetDeleteConfirmationConfirm).scrollIntoView().click()
    cy.wait('@deleteReactShip')
    cy.getByTestId(rs.shipActionMessage).should('contain.text', 'React Utopia was deleted')
    cy.getByTestId(rs.shipCard).should('have.length', 2)
  })


  it('resets React baseline data through a native React confirmation panel', () => {
    cy.intercept('POST', '/admin/reset-demo-data', {
      statusCode: 200,
      body: { reset: true, customers: 24, bookings: 12 }
    }).as('resetReactDemoData')

    cy.getByTestId(rs.sqaConsole).should('be.visible')
    cy.getByTestId(rs.sqaResetDemoDataButton).scrollIntoView().click()
    cy.getByTestId(rs.sqaResetConfirmation)
      .should('be.visible')
      .and('contain.text', 'Reset baseline data back to the baseline dataset?')

    cy.getByTestId(rs.sqaResetConfirmationCancel).click()
    cy.getByTestId(rs.sqaResetConfirmation).should('not.exist')
    cy.getByTestId(rs.sqaStatus).should('contain.text', 'Ready for validation')

    cy.getByTestId(rs.sqaResetDemoDataButton).click()
    cy.getByTestId(rs.sqaResetConfirmationConfirm).click()
    cy.wait('@resetReactDemoData')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Baseline Data Recovery Result')
    cy.getByTestId(rs.sqaOutput).should('contain.text', '"passed": true')
    cy.getByTestId(rs.sqaResetConfirmation).should('not.exist')
  })

  it('runs a React quality health check and writes output', () => {
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.sqaHealthButton).scrollIntoView().click()
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Health Check Result')
    cy.getByTestId(rs.sqaOutput).should('contain.text', '"passed": true')
  })
})
