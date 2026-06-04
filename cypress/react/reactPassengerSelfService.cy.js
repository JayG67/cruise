const { reactBookings, reactCustomers, selectDemoUserByVisibleRole, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React passenger self-service coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
    selectDemoUserByVisibleRole('Passenger')
  })

  it('renders passenger-only profile fields prefilled from the selected customer', () => {
    cy.getByTestId('react-passenger-self-service-panel').should('be.visible')
    cy.getByTestId('react-passenger-profile-first-name').should('have.value', 'Jay')
    cy.getByTestId('react-passenger-profile-last-name').should('have.value', 'Gallagher')
    cy.getByTestId('react-passenger-profile-email').should('have.value', 'jay.react@example.com')
    cy.getByTestId('react-passenger-profile-phone').should('have.value', '555-0101')
  })

  it('blocks invalid passenger profile email before API mutation', () => {
    cy.intercept('PATCH', '/cruise/customers/react-customer-1/passenger-profile').as('profileShouldNotSave')
    cy.getByTestId('react-passenger-profile-email').clear().type('not-an-email')
    cy.getByTestId('react-passenger-profile-submit-button').click()
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

    cy.getByTestId('react-passenger-profile-email').clear().type('jay.updated@example.com')
    cy.getByTestId('react-passenger-profile-phone').clear().type('555-1212')
    cy.getByTestId('react-dining-preference-select').select('Early seating')
    cy.getByTestId('react-passenger-profile-accessibility-notes').clear().type('Close to elevators')
    cy.getByTestId('react-passenger-profile-submit-button').click()
    cy.wait('@savePassengerProfileFull')
    cy.getByTestId('react-passenger-profile-message').should('contain.text', 'Passenger profile updated successfully')
  })

  it('surfaces passenger profile API errors and keeps the form editable', () => {
    cy.intercept('PATCH', '/cruise/customers/react-customer-1/passenger-profile', { statusCode: 500, body: { message: 'Profile unavailable' } }).as('profileSaveFailure')
    cy.getByTestId('react-passenger-profile-phone').clear().type('555-3434')
    cy.getByTestId('react-passenger-profile-submit-button').click()
    cy.wait('@profileSaveFailure')
    cy.getByTestId('react-passenger-profile-message').should('contain.text', 'Profile unavailable')
    cy.getByTestId('react-passenger-profile-phone').should('have.value', '555-3434')
  })

  it('opens and closes booking detail panels independently', () => {
    cy.getByTestId('react-role-booking-card').eq(0).within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-booking-details').should('be.visible')
    })
    cy.getByTestId('react-role-booking-card').eq(1).within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-booking-details').should('be.visible')
    })
    cy.getByTestId('react-role-booking-details').should('have.length', 2)
    cy.getByTestId('react-role-booking-card').eq(1).within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-booking-details').should('not.exist')
    })
    cy.getByTestId('react-role-booking-details').should('have.length', 1)
  })

  it('shows empty favorite itinerary activity state before selecting favorites', () => {
    cy.getByTestId('react-role-booking-card').first().within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-favorites-only-toggle').check()
      cy.getByTestId('react-role-no-favorite-itinerary').should('be.visible')
    })
  })

  it('shows all itinerary activities again after clearing favorites-only filter', () => {
    cy.getByTestId('react-role-booking-card').first().within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-favorite-itinerary-toggle').eq(1).check()
      cy.getByTestId('react-role-favorites-only-toggle').check()
      cy.getByTestId('react-role-itinerary-day').should('have.length.at.least', 1)
      cy.getByTestId('react-role-itinerary-activity').should('have.length', 1)
      cy.getByTestId('react-role-favorites-only-toggle').uncheck()
      cy.getByTestId('react-role-itinerary-day').should('have.length', 2)
      cy.getByTestId('react-role-itinerary-activity').should('have.length.greaterThan', 1)
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

    cy.getByTestId('react-passenger-booking-workflow').should('be.visible')
    cy.getByTestId('react-booking-cruise-line-search').type('Royal')
    cy.getByTestId('react-booking-cruise-line-select').select('Royal Caribbean International')
    cy.wait('@passengerBookingShips')
    cy.getByTestId('react-booking-ship-select').select('React Icon')
    cy.wait('@passengerBookingSailings')
    cy.getByTestId('react-booking-destination-search').type('CocoCay')
    cy.getByTestId('react-booking-duration-filter').select('4')
    cy.getByTestId('react-booking-sailing-select').select('2027-03-14 — Miami, Florida to CocoCay (4 nights)')
    cy.getByTestId('react-booking-fare-code-select').select('Balcony')
    cy.getByTestId('react-booking-cabin-input').clear().type('Balcony near elevators')
    cy.getByTestId('react-booking-add-guest-button').click()
    cy.getByTestId('react-booking-guest-card').eq(1).within(() => {
      cy.getByTestId('react-booking-guest-mode-select').select('New guest')
      cy.getByTestId('react-booking-new-guest-first-name').type('Taylor')
      cy.getByTestId('react-booking-new-guest-last-name').type('Guest')
      cy.getByTestId('react-booking-new-guest-email').type('taylor.guest@example.com')
      cy.getByTestId('react-booking-new-guest-phone').type('555-3333')
      cy.getByTestId('react-booking-guest-dining-select').select('Early seating')
    })
    cy.getByTestId('react-booking-submit-button').click()
    cy.wait('@passengerBookingCreateGuest')
    cy.wait('@passengerBookingCreateBooking')
    cy.wait('@passengerBookingReloadCustomers')
    cy.wait('@passengerBookingReloadBookings')
    cy.getByTestId('react-booking-status-message').should('contain.text', 'Booking request')
    cy.getByTestId('react-role-booking-card').should('have.length', 3)
    cy.getByTestId('react-role-booking-card').last().should('contain.text', 'REQUESTED').and('contain.text', 'React Icon').and('contain.text', 'Balcony near elevators')
  })

  it('validates passenger booking selections and new guest required fields before API submission', () => {
    cy.intercept('POST', '/cruise/bookings').as('bookingShouldNotPost')
    cy.getByTestId('react-booking-submit-button').click()
    cy.getByTestId('react-booking-status-message').should('contain.text', 'Cruise line, ship, and sailing date are required')
    cy.get('@bookingShouldNotPost.all').should('have.length', 0)
  })

  it('removes passenger self-service when switching back to admin', () => {
    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId('react-passenger-self-service-panel').should('not.exist')
    cy.getByTestId('react-admin-hierarchy').should('be.visible')
  })
})
