const { reactBookings, reactCustomers, selectDemoUserByVisibleRole, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React passenger self-service parity expansion', () => {
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

  it('shows empty favorite itinerary state before selecting favorites', () => {
    cy.getByTestId('react-role-booking-card').first().within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-favorites-only-toggle').check()
      cy.getByTestId('react-role-no-favorite-itinerary').should('be.visible')
    })
  })

  it('shows all itinerary days again after clearing favorites-only filter', () => {
    cy.getByTestId('react-role-booking-card').first().within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-favorite-itinerary-toggle').eq(1).check()
      cy.getByTestId('react-role-favorites-only-toggle').check()
      cy.getByTestId('react-role-itinerary-day').should('have.length', 1)
      cy.getByTestId('react-role-favorites-only-toggle').uncheck()
      cy.getByTestId('react-role-itinerary-day').should('have.length', 2)
    })
  })

  it('removes passenger self-service when switching back to admin', () => {
    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId('react-passenger-self-service-panel').should('not.exist')
    cy.getByTestId('react-admin-hierarchy').should('be.visible')
  })
})
