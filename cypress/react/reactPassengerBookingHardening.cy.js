const {
  reactBookings,
  reactCustomers,
  selectDemoUserByVisibleRole,
  visitReactAppAsAdmin
} = require('./support/reactTestHelpers.js')

const royalCaribbeanId = '11111111-1111-4111-8111-111111111111'
const passengerBookingShip = {
  id: 'ship-react-icon',
  cruiseLineId: royalCaribbeanId,
  name: 'React Icon',
  currentPort: 'Miami, Florida'
}
const passengerBookingSailing = {
  id: 'sailing-passenger-hardening',
  shipId: passengerBookingShip.id,
  departureDate: '2027-03-14',
  departurePort: 'Miami, Florida',
  arrivalPort: 'CocoCay',
  days: 4,
  isRepositioning: false
}

function visitAsPassenger() {
  visitReactAppAsAdmin()
  selectDemoUserByVisibleRole('Passenger')
  cy.getByTestId('react-passenger-booking-workflow').should('be.visible')
}

function loadTripOptions({ ships = [passengerBookingShip], sailings = [passengerBookingSailing] } = {}) {
  cy.intercept('GET', `/cruise/ships/${royalCaribbeanId}`, ships).as('bookingShips')
  cy.intercept('GET', `/cruise/ship/${passengerBookingShip.id}/sailings`, sailings).as('bookingSailings')
  cy.getByTestId('react-booking-cruise-line-select').select('Royal Caribbean International')
  cy.wait('@bookingShips')
  cy.getByTestId('react-booking-ship-select').select(passengerBookingShip.name)
  cy.wait('@bookingSailings')
}

function selectDefaultPassengerSailing() {
  loadTripOptions()
  cy.getByTestId('react-booking-sailing-select').select(passengerBookingSailing.id)
}

describe('Passenger booking workflow hardening', () => {
  beforeEach(() => {
    visitAsPassenger()
  })

  it('shows a useful cruise-line ship loading error and leaves dependent selects reset', () => {
    cy.intercept('GET', `/cruise/ships/${royalCaribbeanId}`, {
      statusCode: 503,
      body: { message: 'Ship inventory service unavailable' }
    }).as('shipLoadFailure')

    cy.getByTestId('react-booking-cruise-line-select').select('Royal Caribbean International')
    cy.wait('@shipLoadFailure')

    cy.getByTestId('react-booking-status-message')
      .should('contain.text', 'Could not load ships for the selected cruise line.')
      .and('contain.text', 'Ship inventory service unavailable')
    cy.getByTestId('react-booking-ship-select').should('have.value', '')
    cy.getByTestId('react-booking-sailing-select').should('have.value', '')
  })

  it('shows a useful ship sailing loading error and does not leave stale sailing choices available', () => {
    loadTripOptions({ ships: [passengerBookingShip], sailings: { statusCode: 503, body: { message: 'Sailing schedule unavailable' } } })

    cy.getByTestId('react-booking-status-message')
      .should('contain.text', 'Could not load sailing dates for the selected ship.')
      .and('contain.text', 'Sailing schedule unavailable')
    cy.getByTestId('react-booking-sailing-select').should('have.value', '')
  })

  it('filters loaded sailings by destination, departure port, and duration before booking', () => {
    loadTripOptions({
      sailings: [
        passengerBookingSailing,
        {
          ...passengerBookingSailing,
          id: 'sailing-seven-night-nassau',
          departureDate: '2027-04-20',
          departurePort: 'Port Canaveral, Florida',
          arrivalPort: 'Nassau, Bahamas',
          days: 7
        }
      ]
    })

    cy.getByTestId('react-booking-destination-search').type('Coco')
    cy.getByTestId('react-booking-departure-port-search').type('Miami')
    cy.getByTestId('react-booking-duration-filter').select('4')

    cy.getByTestId('react-booking-sailing-select').find('option').should('have.length', 2)
    cy.getByTestId('react-booking-sailing-select').should('contain.text', 'CocoCay')
    cy.getByTestId('react-booking-sailing-select').should('not.contain.text', 'Nassau')
  })

  it('blocks malformed new guest email before any customer or booking request is sent', () => {
    cy.intercept('POST', '/cruise/customers').as('customerShouldNotCreate')
    cy.intercept('POST', '/cruise/bookings').as('bookingShouldNotCreate')

    selectDefaultPassengerSailing()
    cy.getByTestId('react-booking-add-guest-button').click()
    cy.getByTestId('react-booking-guest-card').eq(1).within(() => {
      cy.getByTestId('react-booking-guest-mode-select').select('New guest')
      cy.getByTestId('react-booking-new-guest-first-name').type('Taylor')
      cy.getByTestId('react-booking-new-guest-last-name').type('Guest')
      cy.getByTestId('react-booking-new-guest-email').type('not-an-email')
    })

    cy.getByTestId('react-booking-submit-button').click()
    cy.getByTestId('react-booking-status-message').should('contain.text', 'New guest email must be a valid email address before booking.')
    cy.get('@customerShouldNotCreate.all').should('have.length', 0)
    cy.get('@bookingShouldNotCreate.all').should('have.length', 0)
  })

  it('explains new guest creation failures, keeps guest input intact, and does not create a booking', () => {
    cy.intercept('POST', '/cruise/customers', {
      statusCode: 409,
      body: { message: 'A customer with this email already exists' }
    }).as('customerCreateFailure')
    cy.intercept('POST', '/cruise/bookings').as('bookingShouldNotCreate')

    selectDefaultPassengerSailing()
    cy.getByTestId('react-booking-add-guest-button').click()
    cy.getByTestId('react-booking-guest-card').eq(1).within(() => {
      cy.getByTestId('react-booking-guest-mode-select').select('New guest')
      cy.getByTestId('react-booking-new-guest-first-name').type('Taylor')
      cy.getByTestId('react-booking-new-guest-last-name').type('Guest')
      cy.getByTestId('react-booking-new-guest-email').type('taylor.guest@example.com')
    })

    cy.getByTestId('react-booking-submit-button').click()
    cy.wait('@customerCreateFailure')
    cy.getByTestId('react-booking-status-message')
      .should('contain.text', 'Could not create guest profile for Taylor Guest.')
      .and('contain.text', 'A customer with this email already exists')
    cy.get('@bookingShouldNotCreate.all').should('have.length', 0)
    cy.getByTestId('react-booking-guest-card').eq(1).within(() => {
      cy.getByTestId('react-booking-new-guest-email').should('have.value', 'taylor.guest@example.com')
    })
  })

  it('explains booking creation failures and verifies no new booking card appears in the UI', () => {
    cy.intercept('POST', '/cruise/bookings', {
      statusCode: 409,
      body: { message: 'Selected sailing no longer has available inventory' }
    }).as('bookingCreateFailure')

    selectDefaultPassengerSailing()
    cy.getByTestId('react-role-booking-card').should('have.length', 2)
    cy.getByTestId('react-booking-submit-button').click()
    cy.wait('@bookingCreateFailure')
    cy.getByTestId('react-booking-status-message')
      .should('contain.text', 'Booking request was not created.')
      .and('contain.text', 'Selected sailing no longer has available inventory')
    cy.getByTestId('react-role-booking-card').should('have.length', 2)
  })

  it('warns when the API accepts a booking but the UI cannot refresh to verify it', () => {
    cy.intercept('POST', '/cruise/bookings', {
      statusCode: 201,
      body: { message: 'Booking created successfully', id: 'BREFRESH01' }
    }).as('bookingCreateSuccess')
    cy.intercept('GET', '/cruise/customers', {
      statusCode: 500,
      body: { message: 'Customer reload failed' }
    }).as('bookingReloadCustomersFailure')
    cy.intercept('GET', '/cruise/bookings', reactBookings).as('bookingReloadBookingsAfterFailure')

    selectDefaultPassengerSailing()
    cy.getByTestId('react-role-booking-card').should('have.length', 2)
    cy.getByTestId('react-booking-submit-button').click()
    cy.wait('@bookingCreateSuccess')
    cy.wait('@bookingReloadCustomersFailure')
    cy.getByTestId('react-booking-status-message')
      .should('contain.text', 'was created, but the booking list could not refresh')
      .and('contain.text', 'Customer reload failed')
    cy.getByTestId('react-role-booking-card').should('have.length', 2)
  })
})
