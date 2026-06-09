const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { visitReactAppAsAdmin, selectDemoUserByVisibleRole, openFirstReactFleetShips, openFirstReactShipSailings, openFirstReactSailingItinerary } = require('./support/reactTestHelpers.js')

describe('React accessibility and keyboard coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('keeps core React landmarks and named regions available', () => {
    cy.get('main').should('exist')
    cy.getByTestId(rs.topNavigation).should('be.visible')
    cy.getByTestId(rs.roleSelector).should('be.visible')
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.createCruiseLineWorkflow).should('be.visible')
    cy.getByTestId(rs.sqaConsole).should('be.visible')
  })

  it('keeps workspace buttons keyboard focusable and discoverable', () => {
    cy.getByTestId(rs.workspaceQualityButton).focus().should('have.focus').click()
    cy.getByTestId(rs.sqaConsole).should('be.visible')
    cy.getByTestId(rs.workspaceFleetButton).focus().should('have.focus').click()
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
  })

  it('keeps customer workflow toggle aria-expanded synchronized', () => {
    cy.getByTestId(rs.toggleCustomerWorkflows).should('have.attr', 'aria-expanded', 'false')
    cy.getByTestId(rs.toggleCustomerWorkflows).click()
    cy.getByTestId(rs.toggleCustomerWorkflows).should('have.attr', 'aria-expanded', 'true')
    cy.getByTestId(rs.toggleCustomerWorkflows).click()
    cy.getByTestId(rs.toggleCustomerWorkflows).should('have.attr', 'aria-expanded', 'false')
  })

  it('keeps customer row expansion controls exposing aria-expanded state', () => {
    cy.getByTestId(rs.toggleCustomerWorkflows).click()
    cy.getByTestId(rs.toggleCustomerBookings).first().should('have.attr', 'aria-expanded', 'false').click()
    cy.getByTestId(rs.toggleCustomerBookings).first().should('have.attr', 'aria-expanded', 'true')
  })

  it('keeps passenger booking detail toggles exposing aria-expanded state', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.roleBookingDetailsToggle).first().should('have.attr', 'aria-expanded', 'false').click()
    cy.getByTestId(rs.roleBookingDetailsToggle).first().should('have.attr', 'aria-expanded', 'true')
  })

  it('keeps favorite itinerary toggles exposed as checkbox controls', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.roleBookingDetailsToggle).first().click()
    cy.getByTestId(rs.roleFavoriteItineraryToggle).first()
      .should('have.attr', 'type', 'checkbox')
      .and('not.be.checked')
      .click()
      .should('be.checked')
  })

  it('keeps form controls reachable by keyboard focus', () => {
    cy.getByTestId(rs.createCruiseLineName).focus().should('have.focus')
    cy.getByTestId(rs.createCruiseLineCountry).focus().should('have.focus')
    cy.getByTestId(rs.saveCruiseLine).focus().should('have.focus')
    cy.getByTestId(rs.fleetSearch).focus().should('have.focus')
  })

  it('keeps quality output announced as a live region', () => {
    cy.getByTestId(rs.sqaOutput).should('have.attr', 'aria-live')
    cy.getByTestId(rs.sqaStatus).should('contain.text', 'Ready for validation')
  })

  it('keeps native confirmation panels using alertdialog semantics', () => {
    cy.getByTestId(rs.fleetCard).first().within(() => {
      cy.getByTestId(rs.deleteCruiseLineButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmation)
      .should('have.attr', 'role', 'alertdialog')
      .and('be.visible')
    cy.getByTestId(rs.fleetDeleteConfirmationCancel).click()
  })

  it('keeps deep admin forms reachable after fleet and itinerary panels are opened', () => {
    openFirstReactFleetShips()
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()
    cy.getByTestId(rs.createSailingForm).should('be.visible')
    cy.getByTestId(rs.createItineraryDayForm).should('be.visible')
    cy.getByTestId(rs.createItineraryActivityForm).should('be.visible')
  })
})
