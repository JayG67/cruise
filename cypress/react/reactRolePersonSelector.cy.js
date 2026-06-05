describe('React role and person selector', () => {
  it('filters people by selected role and keeps operational roles selectable', () => {
    cy.visit('/')

    cy.get('[data-testid="react-role-type-select"]').should('be.visible')
    cy.get('[data-testid="react-demo-user-select"]').should('be.visible')

    cy.get('[data-testid="react-role-type-select"]').select('passenger')
    cy.get('[data-testid="react-demo-user-select"]').find('option').should('contain.text', 'Passenger')
    cy.get('[data-testid="react-demo-user-select"]').find('option').should('not.contain.text', 'Admin')

    cy.get('[data-testid="react-role-type-select"]').select('admin')
    cy.get('[data-testid="react-demo-user-select"]').find('option').should('contain.text', 'Admin')
    cy.get('[data-testid="react-demo-user-summary"]').should('contain.text', 'Admin')

    cy.get('[data-testid="react-role-type-select"]').select('engineering-lead')
    cy.get('[data-testid="react-demo-user-select"]').find('option').should('contain.text', 'Engineering Lead')
    cy.get('[data-testid="react-demo-user-summary"]').should('contain.text', 'Engineering Lead')
    cy.contains('Engineering operations').should('be.visible')
  })
})
