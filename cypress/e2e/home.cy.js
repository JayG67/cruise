describe('Cruise Explorer basic UI smoke tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('loads the homepage', () => {
    cy.contains('Cruise Explorer').should('be.visible')
  })

  it('displays cruise lines from the API', () => {
    cy.get('#status-message', { timeout: 3000 })
      .should('contain.text', 'Showing')

    cy.get('#cruise-grid .data-card', { timeout: 3000 })
      .should('have.length.greaterThan', 0)
  })

  it('displays the SQA Test Control Panel', () => {
    cy.contains('SQA Test Control Panel').should('be.visible')
    cy.contains('Check API Health').should('be.visible')
    cy.contains('Verify Cruise Data').should('be.visible')
    cy.contains('Run UI Smoke Check').should('be.visible')
  })

  it('runs the API health check from the UI', () => {
    cy.contains('Check API Health').click()

    cy.get('#testOutput')
      .should('contain.text', 'API Health Check Result')
      .and('contain.text', '"passed": true')
  })
})