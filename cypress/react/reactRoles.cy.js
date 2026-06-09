const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { reactBookings, selectDemoUserByVisibleRole, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React role dashboard coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('switches between admin, passenger, and group leader dashboards', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.passengerDashboard).should('be.visible')
    cy.getByTestId(rs.roleBookingCard).should('have.length', 2)

    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId(rs.groupLeaderDashboard).should('be.visible')
    cy.getByTestId(rs.roleBookingCard).should('have.length', 1)

    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId(rs.adminHierarchy).should('be.visible')
    cy.getByTestId(rs.passengerDashboard).should('not.exist')
  })

  it('opens booking details with passenger manifest and itinerary content', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.roleBookingCard).first().within(() => {
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
      cy.getByTestId(rs.roleBookingDetails).should('contain.text', 'Passenger manifest')
      cy.getByTestId(rs.roleDetailPassengerRow).should('have.length', 2)
      cy.getByTestId(rs.roleItineraryDay).should('have.length', 2)
    })
  })

  it('supports favorites-only itinerary activity filtering', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.roleBookingCard).first().within(() => {
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
      cy.getByTestId(rs.roleFavoriteItineraryToggle).first().check()
      cy.getByTestId(rs.roleFavoritesOnlyToggle).check()
      cy.getByTestId(rs.roleItineraryDay).should('have.length', 1).and('contain.text', 'Embarkation Day')
      cy.getByTestId(rs.roleItineraryActivity).should('have.length', 1)
      cy.getByTestId(rs.roleFavoritesOnlyToggle).uncheck()
      cy.getByTestId(rs.roleItineraryDay).should('have.length', 2)
    })
  })

  it('keeps multiple booking detail panels open until each one is hidden', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.roleBookingCard).eq(0).within(() => {
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
      cy.getByTestId(rs.roleBookingDetails).should('be.visible')
    })
    cy.getByTestId(rs.roleBookingCard).eq(1).within(() => {
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
      cy.getByTestId(rs.roleBookingDetails).should('be.visible')
    })
    cy.getByTestId(rs.roleBookingDetails).should('have.length', 2)
    cy.getByTestId(rs.roleBookingCard).eq(0).within(() => {
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
      cy.getByTestId(rs.roleBookingDetails).should('not.exist')
    })
    cy.getByTestId(rs.roleBookingDetails).should('have.length', 1)
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
    cy.getByTestId(rs.passengerProfileForm).within(() => {
      cy.getByTestId(rs.passengerProfilePhone).clear().type('555-7777')
      cy.getByTestId(rs.diningPreferenceSelect).select('Late seating')
      cy.getByTestId(rs.passengerProfileAccessibilityNotes).clear().type('Near elevator preferred')
      cy.getByTestId(rs.passengerProfileSubmitButton).click()
    })
    cy.wait('@saveRoleProfile')
    cy.getByTestId(rs.passengerProfileMessage).should('contain.text', 'Passenger profile updated successfully')
  })

  it('shows group leader visibility with grouped passenger data', () => {
    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId(rs.groupLeaderDashboard).should('contain.text', 'React Group Leader')
    cy.getByTestId(rs.roleBookingCard).first().should('contain.text', reactBookings[1].id)
    cy.getByTestId(rs.roleBookingCard).first().within(() => {
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
      cy.getByTestId(rs.roleDetailPassengerRow).should('have.length', 2)
    })
  })
})