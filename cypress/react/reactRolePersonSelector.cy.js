const { reactSelectorKeys: rs } = require('./support/reactSelectors')
require('./support/reactTestHelpers')

describe('React role and person selector', () => {
  it('uses focused person cards instead of oversized person dropdowns for role selection', () => {
    cy.visit('/')

    cy.getByTestId(rs.roleTypeSelect).should('be.visible')
    cy.getByTestId(rs.personFinderPanel).should('be.visible')
    cy.getByTestId(rs.personFinderResultCard).should('have.length.greaterThan', 0)
    cy.getByTestId(rs.demoUserSelect).should('not.be.visible')

    cy.getByTestId(rs.roleTypeSelect).select('passenger')
    cy.getByTestId(rs.passengerFinderPanel).should('be.visible')
    cy.getByTestId(rs.passengerFinderResults).should('be.visible')
    cy.getByTestId(rs.passengerFinderResultCard).first().invoke('text').should((text) => {
      expect(text).to.match(/Cruise Line|Royal Caribbean|Carnival|Norwegian|Celebrity/)
      expect(text).to.match(/\d{4}-\d{2}-\d{2}/)
    })
    cy.getByTestId(rs.personFinderResultCard).should('have.length.lessThan', 9)
    cy.getByTestId(rs.personFinderResultCard).should('not.contain.text', 'Admin')

    cy.getByTestId(rs.roleTypeSelect).select('admin')
    cy.getByTestId(rs.passengerFinderPanel).should('not.exist')
    cy.getByTestId(rs.personFinderResultCard).should('contain.text', 'Admin')
    cy.getByTestId(rs.personFinderResultCard).first().click()
    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Admin')

    cy.getByTestId(rs.roleTypeSelect).select('engineering-lead')
    cy.getByTestId(rs.personFinderResultCard).should('contain.text', 'David Torres')
    cy.getByTestId(rs.personSearchInput).clear().type('David Torres')
    cy.getByTestId(rs.personFinderResultCard).should('have.length', 1).and('contain.text', 'Engineering Lead')
    cy.getByTestId(rs.personFinderResultCard).first().click()
    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Engineering Lead')
    cy.contains('Engineering operations').should('be.visible')
  })

  it('lets passenger role users search and filter by cruise line, ship, and sailing date from card results', () => {
    cy.visit('/')

    cy.getByTestId(rs.roleTypeSelect).select('passenger')
    cy.getByTestId(rs.passengerFinderPanel).should('contain.text', 'Passenger finder')
    cy.getByTestId(rs.passengerSearchInput).should('be.visible').type('Jay Gallagher')
    cy.getByTestId(rs.passengerFinderResultCard).should('have.length', 1).and('contain.text', 'Jay Gallagher')
    cy.getByTestId(rs.personFinderResultCard).should('have.length', 1).and('contain.text', 'Jay Gallagher')
    cy.getByTestId(rs.personFinderResultCard).first().should('contain.text', 'Royal Caribbean')

    cy.getByTestId(rs.passengerSearchInput).clear()
    cy.getByTestId(rs.passengerCruiseLineFilter).select('Royal Caribbean International')
    cy.getByTestId(rs.personFinderResultCard).should('contain.text', 'Royal Caribbean International')
    cy.getByTestId(rs.personFinderResultCard).should('not.contain.text', 'Carnival Cruise Line')

    cy.getByTestId(rs.passengerShipFilter).select('Adventure of the Seas')
    cy.getByTestId(rs.passengerFinderResultCard).should('contain.text', 'Adventure of the Seas')
    cy.getByTestId(rs.personFinderResultCard).should('contain.text', 'Adventure of the Seas')

    cy.getByTestId(rs.passengerSailingDateFilter).select('2026-08-05')
    cy.getByTestId(rs.personFinderResultCard).should('contain.text', '2026-08-05')

    cy.getByTestId(rs.passengerSearchInput).type('no passenger with this name')
    cy.getByTestId(rs.passengerFinderEmpty).should('be.visible')
    cy.getByTestId(rs.personFinderEmpty).should('be.visible')
  })
})
