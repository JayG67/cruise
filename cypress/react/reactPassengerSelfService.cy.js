const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { reactBookings, reactCustomers, selectDemoUserByVisibleRole, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React passenger self-service coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
    selectDemoUserByVisibleRole('Passenger')
  })

  it('renders passenger-only profile fields prefilled from the selected customer', () => {
    cy.getByTestId(rs.passengerSelfServicePanel).should('be.visible')
    cy.getByTestId(rs.passengerProfileFirstName).should('have.value', 'Jay')
    cy.getByTestId(rs.passengerProfileLastName).should('have.value', 'Gallagher')
    cy.getByTestId(rs.passengerProfileEmail).should('have.value', 'jay.react@example.com')
    cy.getByTestId(rs.passengerProfilePhone).should('have.value', '555-0101')
  })

  it('blocks invalid passenger profile email before API mutation', () => {
    cy.intercept('PATCH', '/cruise/customers/react-customer-1/passenger-profile').as('profileShouldNotSave')
    cy.getByTestId(rs.passengerProfileEmail).clear().type('not-an-email')
    cy.getByTestId(rs.passengerProfileSubmitButton).click()
    cy.get('@profileShouldNotSave.all').should('have.length', 0)
  })

  it('submits profile identity, phone, dining preference, and accessibility notes', () => {
    cy.intercept('PATCH', '/cruise/customers/react-customer-1/passenger-profile', req => {
      expect(req.body).to.include({
        firstName: 'Jay',
        lastName: 'Gallagher',
        email: 'jay.updated@example.com',
        phone: '555-1212',
        diningPreference: 'Early seating',
        accessibilityNotes: 'Close to elevators'
      })
      req.reply({ statusCode: 200, body: { message: 'Passenger profile updated successfully' } })
    }).as('savePassengerProfileFull')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('reloadPassengerCustomers')
    cy.intercept('GET', '/cruise/bookings', reactBookings).as('reloadPassengerBookings')

    cy.getByTestId(rs.passengerProfileEmail).clear().type('jay.updated@example.com')
    cy.getByTestId(rs.passengerProfilePhone).clear().type('555-1212')
    cy.getByTestId(rs.diningPreferenceSelect).select('Early seating')
    cy.getByTestId(rs.passengerProfileAccessibilityNotes).clear().type('Close to elevators')
    cy.getByTestId(rs.passengerProfileSubmitButton).click()
    cy.wait('@savePassengerProfileFull')
    cy.getByTestId(rs.passengerProfileMessage).should('contain.text', 'Passenger profile updated successfully')
  })

  it('surfaces passenger profile API errors and keeps the form editable', () => {
    cy.intercept('PATCH', '/cruise/customers/react-customer-1/passenger-profile', { statusCode: 500, body: { message: 'Profile unavailable' } }).as('profileSaveFailure')
    cy.getByTestId(rs.passengerProfilePhone).clear().type('555-3434')
    cy.getByTestId(rs.passengerProfileSubmitButton).click()
    cy.wait('@profileSaveFailure')
    cy.getByTestId(rs.passengerProfileMessage).should('contain.text', 'Profile unavailable')
    cy.getByTestId(rs.passengerProfilePhone).should('have.value', '555-3434')
  })

  it('opens and closes booking detail panels independently', () => {
    cy.getByTestId(rs.roleBookingCard).eq(0).within(() => {
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
      cy.getByTestId(rs.roleBookingDetails).should('be.visible')
    })
    cy.getByTestId(rs.roleBookingCard).eq(1).within(() => {
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
      cy.getByTestId(rs.roleBookingDetails).should('be.visible')
    })
    cy.getByTestId(rs.roleBookingDetails).should('have.length', 2)
    cy.getByTestId(rs.roleBookingCard).eq(1).within(() => {
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
      cy.getByTestId(rs.roleBookingDetails).should('not.exist')
    })
    cy.getByTestId(rs.roleBookingDetails).should('have.length', 1)
  })

  it('shows empty favorite itinerary activity state before selecting favorites', () => {
    cy.getByTestId(rs.roleBookingCard).first().within(() => {
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
      cy.getByTestId(rs.roleFavoritesOnlyToggle).check()
      cy.getByTestId(rs.roleNoFavoriteItinerary).should('be.visible')
    })
  })

  it('shows all itinerary activities again after clearing favorites-only filter', () => {
    cy.getByTestId(rs.roleBookingCard).first().within(() => {
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
      cy.getByTestId(rs.roleFavoriteItineraryToggle).eq(1).check()
      cy.getByTestId(rs.roleFavoritesOnlyToggle).check()
      cy.getByTestId(rs.roleItineraryDay).should('have.length.at.least', 1)
      cy.getByTestId(rs.roleItineraryActivity).should('have.length', 1)
      cy.getByTestId(rs.roleFavoritesOnlyToggle).uncheck()
      cy.getByTestId(rs.roleItineraryDay).should('have.length', 2)
      cy.getByTestId(rs.roleItineraryActivity).should('have.length.greaterThan', 1)
    })
  })

  it('lets passengers find and select an existing guest from searchable cards instead of a giant dropdown', () => {
    cy.getByTestId(rs.passengerBookingWorkflow).should('be.visible')
    cy.getByTestId(rs.bookingAddGuestButton).click()

    cy.getByTestId(rs.bookingGuestCard).eq(1).within(() => {
      cy.getByTestId(rs.bookingGuestFinder).should('be.visible')
      cy.getByTestId(rs.bookingGuestSearchInput).type('Alisa')
      cy.getByTestId(rs.bookingGuestResultCard).should('have.length', 1).and('contain.text', 'Alisa Gallagher')
      cy.getByTestId(rs.bookingGuestResultCard).first().click()
      cy.getByTestId(rs.bookingSelectedGuestCard).should('contain.text', 'Alisa Gallagher')
      cy.getByTestId(rs.bookingGuestResults).should('contain.text', 'React Icon')
    })
  })


  it('lets a passenger progressively search, add a new guest, request a cruise booking, and see it in the booking list', () => {
    let createdBookingId = ''
    let createdGuestId = ''
    cy.intercept('GET', '/cruise/ships/11111111-1111-4111-8111-111111111111', [
      { id: 'ship-react-icon', cruiseLineId: '11111111-1111-4111-8111-111111111111', name: 'React Icon', currentPort: 'Miami, Florida' }
    ]).as('passengerBookingShips')
    cy.intercept('GET', '/cruise/ship/ship-react-icon/sailings', [
      {
        id: '99999999-9999-4999-8999-999999999999',
        shipId: 'ship-react-icon',
        departureDate: '2027-03-14',
        departurePort: 'Miami, Florida',
        arrivalPort: 'CocoCay',
        days: 4,
        isRepositioning: false
      },
      {
        id: '88888888-8888-4888-8888-888888888888',
        shipId: 'ship-react-icon',
        departureDate: '2027-04-20',
        departurePort: 'Port Canaveral, Florida',
        arrivalPort: 'Nassau, Bahamas',
        days: 7,
        isRepositioning: false
      }
    ]).as('passengerBookingSailings')
    cy.intercept('POST', '/cruise/customers', req => {
      expect(req.body.firstName).to.eq('Taylor')
      expect(req.body.lastName).to.eq('Guest')
      expect(req.body.email).to.eq('taylor.guest@example.com')
      expect(req.body.id).to.match(/^C[A-Z0-9]{9}$/)
      createdGuestId = req.body.id
      req.reply({ statusCode: 201, body: { message: 'Customer created successfully', id: req.body.id } })
    }).as('passengerBookingCreateGuest')
    cy.intercept('POST', '/cruise/bookings', req => {
      expect(req.body.id).to.match(/^B[A-Z0-9]{9}$/)
      expect(req.body.sailingId).to.eq('99999999-9999-4999-8999-999999999999')
      expect(req.body.bookingStatus).to.eq('REQUESTED')
      expect(req.body.createdByCustomerId).to.eq('react-customer-1')
      expect(req.body.passengers).to.have.length(2)
      expect(req.body.passengers[0]).to.include({ customerId: 'react-customer-1', isPrimaryGuest: true })
      expect(req.body.passengers[1]).to.include({ passengerRole: 'Guest', diningPreference: 'Early seating' })
      createdBookingId = req.body.id
      req.reply({ statusCode: 201, body: { message: 'Booking created successfully', id: req.body.id } })
    }).as('passengerBookingCreateBooking')
    cy.intercept('GET', '/cruise/customers', req => {
      req.reply([...reactCustomers, {
        id: createdGuestId || 'created-guest-placeholder',
        firstName: 'Taylor',
        lastName: 'Guest',
        email: 'taylor.guest@example.com',
        phone: '555-3333',
        loyaltyNumber: ''
      }])
    }).as('passengerBookingReloadCustomers')
    cy.intercept('GET', '/cruise/bookings', req => {
      req.reply([...reactBookings, {
        id: createdBookingId || 'created-booking-placeholder',
        bookingStatus: 'REQUESTED',
        cabinNumber: 'Balcony near elevators',
        fareCode: 'BALCONY',
        embarkationPort: 'Miami, Florida',
        debarkationPort: 'CocoCay',
        createdByCustomerId: 'react-customer-1',
        cruiseLine: { name: 'Royal Caribbean International' },
        ship: { name: 'React Icon' },
        sailing: {
          departureDate: '2027-03-14',
          itinerary: []
        },
        passengers: [
          { customerId: 'react-customer-1', passengerType: 'Primary', diningPreference: 'Anytime dining', accessibilityNotes: '', customer: reactCustomers[0] },
          { customerId: createdGuestId || 'created-guest-placeholder', passengerType: 'Guest', diningPreference: 'Early seating', accessibilityNotes: '', customer: { firstName: 'Taylor', lastName: 'Guest' } }
        ]
      }])
    }).as('passengerBookingReloadBookings')

    cy.getByTestId(rs.passengerBookingWorkflow).should('be.visible')
    cy.getByTestId(rs.bookingCruiseLineSearch).type('Royal')
    cy.getByTestId(rs.bookingCruiseLineSelect).select('Royal Caribbean International')
    cy.wait('@passengerBookingShips')
    cy.getByTestId(rs.bookingShipSelect).select('React Icon')
    cy.wait('@passengerBookingSailings')
    cy.getByTestId(rs.bookingDestinationSearch).type('CocoCay')
    cy.getByTestId(rs.bookingDurationFilter).select('4')
    cy.getByTestId(rs.bookingSailingSelect).select('2027-03-14 — Miami, Florida to CocoCay (4 nights)')
    cy.getByTestId(rs.bookingFareCodeSelect).select('Balcony')
    cy.getByTestId(rs.bookingCabinInput).clear().type('Balcony near elevators')
    cy.getByTestId(rs.bookingAddGuestButton).click()
    cy.getByTestId(rs.bookingGuestCard).eq(1).within(() => {
      cy.getByTestId(rs.bookingGuestModeSelect).select('New guest')
      cy.getByTestId(rs.bookingNewGuestFirstName).type('Taylor')
      cy.getByTestId(rs.bookingNewGuestLastName).type('Guest')
      cy.getByTestId(rs.bookingNewGuestEmail).type('taylor.guest@example.com')
      cy.getByTestId(rs.bookingNewGuestPhone).type('555-3333')
      cy.getByTestId(rs.bookingGuestDiningSelect).select('Early seating')
    })
    cy.getByTestId(rs.bookingSubmitButton).click()
    cy.wait('@passengerBookingCreateGuest')
    cy.wait('@passengerBookingCreateBooking')
    cy.wait('@passengerBookingReloadCustomers')
    cy.wait('@passengerBookingReloadBookings')
    cy.getByTestId(rs.bookingStatusMessage).should('contain.text', 'Booking request')
    cy.getByTestId(rs.roleBookingCard).should('have.length', 3)
    cy.getByTestId(rs.roleBookingCard).last().should('contain.text', 'REQUESTED').and('contain.text', 'React Icon').and('contain.text', 'Balcony near elevators')
  })

  it('validates passenger booking selections and new guest required fields before API submission', () => {
    cy.intercept('POST', '/cruise/bookings').as('bookingShouldNotPost')
    cy.getByTestId(rs.bookingSubmitButton).click()
    cy.getByTestId(rs.bookingStatusMessage).should('contain.text', 'Cruise line, ship, and sailing date are required')
    cy.get('@bookingShouldNotPost.all').should('have.length', 0)
  })

  it('removes passenger self-service when switching back to admin', () => {
    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId(rs.passengerSelfServicePanel).should('not.exist')
    cy.getByTestId(rs.adminHierarchy).should('be.visible')
  })
})
