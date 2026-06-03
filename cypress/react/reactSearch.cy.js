const { reactCruiseLines, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React fleet search coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('starts with all intercepted cruise lines visible', () => {
    cy.getByTestId('react-fleet-card').should('have.length', reactCruiseLines.length)
    cy.getByTestId('react-fleet-count').should('contain.text', `Showing ${reactCruiseLines.length}`)
  })

  it('filters cruise lines by partial name', () => {
    cy.getByTestId('react-fleet-search').type('celebrity')
    cy.getByTestId('react-fleet-card').should('have.length', 1).and('contain.text', 'Celebrity Cruises')
    cy.getByTestId('react-fleet-count').should('contain.text', 'Showing 1 of 1')
  })

  it('filters cruise lines by country and trims spaces', () => {
    cy.getByTestId('react-fleet-search').type('  united states  ')
    cy.getByTestId('react-fleet-card').should('have.length', 3)
  })

  it('shows and clears the empty search state', () => {
    cy.getByTestId('react-fleet-search').type('no matching cruise line')
    cy.getByTestId('react-fleet-empty-state').should('contain.text', 'No cruise lines match')
    cy.getByTestId('react-fleet-card').should('have.length', 0)

    cy.getByTestId('react-fleet-search').clear()
    cy.getByTestId('react-fleet-card').should('have.length', reactCruiseLines.length)
  })

  it('does not search website text as fleet result content', () => {
    cy.getByTestId('react-fleet-search').type('celebritycruises.com')
    cy.getByTestId('react-fleet-empty-state').should('be.visible')
  })

  it('preserves fleet card actions after filtering', () => {
    cy.getByTestId('react-fleet-search').type('royal')
    cy.getByTestId('react-fleet-card').first().within(() => {
      cy.getByTestId('react-view-ships-button').should('be.visible')
      cy.getByTestId('react-update-cruise-line-button').should('be.visible')
      cy.getByTestId('react-delete-cruise-line-button').should('be.visible')
    })
  })
})