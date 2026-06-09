const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { reactCruiseLines, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React fleet search coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('starts with all intercepted cruise lines visible', () => {
    cy.getByTestId(rs.fleetCard).should('have.length', reactCruiseLines.length)
    cy.getByTestId(rs.fleetCount).should('contain.text', `Showing ${reactCruiseLines.length}`)
  })

  it('filters cruise lines by partial name', () => {
    cy.getByTestId(rs.fleetSearch).type('celebrity')
    cy.getByTestId(rs.fleetCard).should('have.length', 1).and('contain.text', 'Celebrity Cruises')
    cy.getByTestId(rs.fleetCount).should('contain.text', 'Showing 1 of 1')
  })

  it('filters cruise lines by country and trims spaces', () => {
    cy.getByTestId(rs.fleetSearch).type('  united states  ')
    cy.getByTestId(rs.fleetCard).should('have.length', 3)
  })

  it('shows and clears the empty search state', () => {
    cy.getByTestId(rs.fleetSearch).type('no matching cruise line')
    cy.getByTestId(rs.fleetEmptyState).should('contain.text', 'No cruise lines match')
    cy.getByTestId(rs.fleetCard).should('have.length', 0)

    cy.getByTestId(rs.fleetSearch).clear()
    cy.getByTestId(rs.fleetCard).should('have.length', reactCruiseLines.length)
  })

  it('does not search website text as fleet result content', () => {
    cy.getByTestId(rs.fleetSearch).type('celebritycruises.com')
    cy.getByTestId(rs.fleetEmptyState).should('be.visible')
  })

  it('preserves fleet card actions after filtering', () => {
    cy.getByTestId(rs.fleetSearch).type('royal')
    cy.getByTestId(rs.fleetCard).first().within(() => {
      cy.getByTestId(rs.viewShipsButton).should('be.visible')
      cy.getByTestId(rs.updateCruiseLineButton).should('be.visible')
      cy.getByTestId(rs.deleteCruiseLineButton).should('be.visible')
    })
  })
})