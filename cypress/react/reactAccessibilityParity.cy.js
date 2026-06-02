const { visitReactAppAsAdmin, selectDemoUserByVisibleRole, openFirstReactFleetShips, openFirstReactShipSailings, openFirstReactSailingItinerary } = require('./support/reactTestHelpers.js')

describe('React accessibility and keyboard parity expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('keeps core React landmarks and named regions available', () => {
    cy.get('main').should('exist')
    cy.getByTestId('react-top-navigation').should('be.visible')
    cy.getByTestId('react-role-selector').should('be.visible')
    cy.getByTestId('react-fleet-directory').should('be.visible')
    cy.getByTestId('react-create-cruise-line-workflow').should('be.visible')
    cy.getByTestId('react-sqa-console').should('be.visible')
  })

  it('keeps route nav buttons keyboard focusable and active-state discoverable', () => {
    cy.getByTestId('react-route-cutover').focus().should('have.focus').click()
    cy.getByTestId('react-route-cutover').should('have.attr', 'aria-pressed', 'true')
    cy.getByTestId('react-route-roadmap').focus().should('have.focus').click()
    cy.getByTestId('react-route-roadmap').should('have.attr', 'aria-pressed', 'true')
  })

  it('keeps customer workflow toggle aria-expanded synchronized', () => {
    cy.getByTestId('react-toggle-customer-workflows').should('have.attr', 'aria-expanded', 'false')
    cy.getByTestId('react-toggle-customer-workflows').click()
    cy.getByTestId('react-toggle-customer-workflows').should('have.attr', 'aria-expanded', 'true')
    cy.getByTestId('react-toggle-customer-workflows').click()
    cy.getByTestId('react-toggle-customer-workflows').should('have.attr', 'aria-expanded', 'false')
  })

  it('keeps customer row expansion controls exposing aria-expanded state', () => {
    cy.getByTestId('react-toggle-customer-workflows').click()
    cy.getByTestId('react-toggle-customer-bookings').first().should('have.attr', 'aria-expanded', 'false').click()
    cy.getByTestId('react-toggle-customer-bookings').first().should('have.attr', 'aria-expanded', 'true')
  })

  it('keeps passenger booking detail toggles exposing aria-expanded state', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-role-booking-details-toggle').first().should('have.attr', 'aria-expanded', 'false').click()
    cy.getByTestId('react-role-booking-details-toggle').first().should('have.attr', 'aria-expanded', 'true')
  })

  it('keeps favorite itinerary toggles exposed as checkbox controls', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-role-booking-details-toggle').first().click()
    cy.getByTestId('react-role-favorite-itinerary-toggle').first()
      .should('have.attr', 'type', 'checkbox')
      .and('not.be.checked')
      .click()
      .should('be.checked')
  })

  it('keeps form controls reachable by keyboard focus', () => {
    cy.getByTestId('react-create-cruise-line-name').focus().should('have.focus')
    cy.getByTestId('react-create-cruise-line-country').focus().should('have.focus')
    cy.getByTestId('react-save-cruise-line').focus().should('have.focus')
    cy.getByTestId('react-fleet-search').focus().should('have.focus')
  })

  it('keeps SQA output announced as a live region', () => {
    cy.getByTestId('react-sqa-output').should('have.attr', 'aria-live')
    cy.getByTestId('react-sqa-status').should('contain.text', 'Ready for validation')
  })

  it('keeps native confirmation panels using alertdialog semantics', () => {
    cy.getByTestId('react-fleet-card').first().within(() => {
      cy.getByTestId('react-delete-cruise-line-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation')
      .should('have.attr', 'role', 'alertdialog')
      .and('be.visible')
    cy.getByTestId('react-fleet-delete-confirmation-cancel').click()
  })

  it('keeps deep admin forms reachable after fleet and itinerary panels are opened', () => {
    openFirstReactFleetShips()
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()
    cy.getByTestId('react-create-sailing-form').should('be.visible')
    cy.getByTestId('react-create-itinerary-day-form').should('be.visible')
    cy.getByTestId('react-create-itinerary-activity-form').should('be.visible')
  })
})
