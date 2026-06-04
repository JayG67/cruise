const { reactBookings, selectDemoUserByVisibleRole, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React role dashboard coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('switches between admin, passenger, and group leader dashboards', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-passenger-dashboard').should('be.visible')
    cy.getByTestId('react-role-booking-card').should('have.length', 2)

    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId('react-group-leader-dashboard').should('be.visible')
    cy.getByTestId('react-role-booking-card').should('have.length', 1)

    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId('react-admin-hierarchy').should('be.visible')
    cy.getByTestId('react-passenger-dashboard').should('not.exist')
  })

  it('opens booking details with passenger manifest and itinerary content', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-role-booking-card').first().within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-booking-details').should('contain.text', 'Passenger manifest')
      cy.getByTestId('react-role-detail-passenger-row').should('have.length', 2)
      cy.getByTestId('react-role-itinerary-day').should('have.length', 2)
    })
  })

  it('supports favorites-only itinerary filtering', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-role-booking-card').first().within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-favorite-itinerary-toggle').first().check()
      cy.getByTestId('react-role-favorites-only-toggle').check()
      cy.getByTestId('react-role-itinerary-day').should('have.length', 1).and('contain.text', 'Embarkation Day')
      cy.getByTestId('react-role-favorites-only-toggle').uncheck()
      cy.getByTestId('react-role-itinerary-day').should('have.length', 2)
    })
  })

  it('keeps multiple booking detail panels open until each one is hidden', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-role-booking-card').eq(0).within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-booking-details').should('be.visible')
    })
    cy.getByTestId('react-role-booking-card').eq(1).within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-booking-details').should('be.visible')
    })
    cy.getByTestId('react-role-booking-details').should('have.length', 2)
    cy.getByTestId('react-role-booking-card').eq(0).within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-booking-details').should('not.exist')
    })
    cy.getByTestId('react-role-booking-details').should('have.length', 1)
  })

  it('updates passenger profile details through the self-service form', () => {
    cy.intercept('PATCH', '/cruise/customers/react-customer-1/passenger-profile', req => {
      expect(req.body).to.include({
        phone: '555-7777',
        diningPreference: 'Late seating',
        accessibilityNotes: 'Near elevator preferred'
      })
      req.reply({ statusCode: 200, body: { message: 'Passenger profile updated successfully' } })
    }).as('saveRoleProfile')

    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-passenger-profile-form').within(() => {
      cy.getByTestId('react-passenger-profile-phone').clear().type('555-7777')
      cy.getByTestId('react-dining-preference-select').select('Late seating')
      cy.getByTestId('react-passenger-profile-accessibility-notes').clear().type('Near elevator preferred')
      cy.getByTestId('react-passenger-profile-submit-button').click()
    })
    cy.wait('@saveRoleProfile')
    cy.getByTestId('react-passenger-profile-message').should('contain.text', 'Passenger profile updated successfully')
  })

  it('shows group leader visibility with grouped passenger data', () => {
    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId('react-group-leader-dashboard').should('contain.text', 'React Group Leader')
    cy.getByTestId('react-role-booking-card').first().should('contain.text', reactBookings[1].id)
    cy.getByTestId('react-role-booking-card').first().within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-detail-passenger-row').should('have.length', 2)
    })
  })
})