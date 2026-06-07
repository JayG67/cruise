const { reactSelectorKeys: rs } = require('./support/reactSelectors')
require('./support/reactTestHelpers')
describe('React role and person selector', () => {
  it('filters people by selected role and keeps operational roles selectable', () => {
    cy.visit('/')

    cy.getByTestId(rs.roleTypeSelect).should('be.visible')
    cy.getByTestId(rs.demoUserSelect).should('be.visible')

    cy.getByTestId(rs.roleTypeSelect).select('passenger')
    cy.getByTestId(rs.passengerFinderPanel).should('be.visible')
    cy.getByTestId(rs.passengerFinderResults).should('be.visible')
    cy.getByTestId(rs.passengerFinderResultCard).first().should('contain.text', 'Royal Caribbean')
    cy.getByTestId(rs.demoUserSelect).find('option').should('contain.text', 'Royal Caribbean')
    cy.getByTestId(rs.demoUserSelect).find('option').should('not.contain.text', 'Admin')

    cy.getByTestId(rs.roleTypeSelect).select('admin')
    cy.getByTestId(rs.passengerFinderPanel).should('not.exist')
    cy.getByTestId(rs.demoUserSelect).find('option').should('contain.text', 'Admin')
    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Admin')

    cy.getByTestId(rs.roleTypeSelect).select('engineering-lead')
    cy.getByTestId(rs.demoUserSelect).find('option').should('contain.text', 'David Torres')
    cy.getByTestId(rs.demoUserSelect).find('option').should('not.contain.text', '(Engineering Lead)')
    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Engineering Lead')
    cy.contains('Engineering operations').should('be.visible')
  })

  it('lets passenger role users search and filter by cruise line, ship, and sailing date', () => {
    cy.visit('/')

    cy.getByTestId(rs.roleTypeSelect).select('passenger')
    cy.getByTestId(rs.passengerFinderPanel).should('contain.text', 'Passenger finder')
    cy.getByTestId(rs.passengerSearchInput).should('be.visible').type('Jay Gallagher')
    cy.getByTestId(rs.passengerFinderResultCard).should('have.length', 1).and('contain.text', 'Jay Gallagher')
    cy.getByTestId(rs.demoUserSelect).find('option').should('have.length', 1).and('contain.text', 'Jay Gallagher')
    cy.getByTestId(rs.demoUserSelect).find('option').first().should('contain.text', 'Royal Caribbean')

    cy.getByTestId(rs.passengerSearchInput).clear()
    cy.getByTestId(rs.passengerCruiseLineFilter).select('Royal Caribbean International')
    cy.getByTestId(rs.demoUserSelect).find('option').should('contain.text', 'Royal Caribbean International')
    cy.getByTestId(rs.demoUserSelect).find('option').should('not.contain.text', 'Carnival Cruise Line')

    cy.getByTestId(rs.passengerShipFilter).select('Adventure of the Seas')
    cy.getByTestId(rs.passengerFinderResultCard).should('contain.text', 'Adventure of the Seas')
    cy.getByTestId(rs.demoUserSelect).find('option').should('contain.text', 'Adventure of the Seas')

    cy.getByTestId(rs.passengerSailingDateFilter).select('2026-08-05')
    cy.getByTestId(rs.demoUserSelect).find('option').should('contain.text', '2026-08-05')

    cy.getByTestId(rs.passengerSearchInput).type('no passenger with this name')
    cy.getByTestId(rs.passengerFinderEmpty).should('be.visible')
  })
})
