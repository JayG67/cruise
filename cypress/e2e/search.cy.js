describe('Cruise Explorer search UI tests', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.get('#cruise-grid .data-card', { timeout: 10000 })
      .should('have.length.greaterThan', 0)
  })

  it('filters cruise lines by name', () => {
    cy.get('#search-input').type('Royal')

    cy.get('#status-message')
      .should('contain.text', 'Showing')
      .and('contain.text', 'of')

    cy.get('#cruise-grid')
      .should('contain.text', 'Royal')
  })

  it('filters cruise lines by country', () => {
    cy.get('#search-input').type('United States')

    cy.get('#status-message')
      .should('contain.text', 'Showing')

    cy.get('#cruise-grid .data-card')
      .should('have.length.greaterThan', 0)
  })

  it('shows an empty message when no cruise lines match', () => {
    cy.get('#search-input').type('ZZZ_NO_MATCH_TEST')

    cy.get('#status-message')
      .should('contain.text', 'Showing 0')

    cy.get('#cruise-grid')
      .should('contain.text', 'No cruise lines match your search.')
  })

  it('restores cruise lines when search is cleared', () => {
    cy.get('#cruise-grid .data-card')
      .its('length')
      .then((initialCount) => {
        cy.get('#search-input').type('Royal')
        cy.get('#search-input').clear()

        cy.get('#cruise-grid .data-card')
          .should('have.length', initialCount)
      })
  })
})