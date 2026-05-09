describe('Cruise Explorer UI', () => {
  it('loads the homepage and displays cruise lines from the API', () => {
    cy.visit('/')

    cy.contains('Cruise Explorer').should('be.visible')
    cy.contains('Live API Data').should('be.visible')
    cy.contains('Cruise Lines').should('be.visible')

    cy.get('#status-message', { timeout: 10000 })
      .should('contain.text', 'Showing')

    cy.get('#cruise-grid .data-card', { timeout: 10000 })
      .should('have.length.greaterThan', 0)
  })
})