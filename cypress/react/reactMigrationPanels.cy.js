const { visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React migration evidence and route panel parity', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('starts on hierarchy route evidence with visible evidence list and next step', () => {
    cy.getByTestId('react-active-route-summary').should('contain.text', 'hierarchy')
    cy.getByTestId('react-active-route-evidence-panel').should('be.visible')
    cy.getByTestId('react-active-route-evidence-list').find('li').should('have.length.at.least', 3)
    cy.getByTestId('react-active-route-next-step').should('be.visible')
  })

  it('marks only one route tab active at a time', () => {
    cy.getByTestId('react-route-readiness').click().should('have.attr', 'aria-pressed', 'true')
    cy.getByTestId('react-route-hierarchy').should('have.attr', 'aria-pressed', 'false')
    cy.getByTestId('react-route-roadmap').click().should('have.attr', 'aria-pressed', 'true')
    cy.getByTestId('react-route-readiness').should('have.attr', 'aria-pressed', 'false')
  })

  it('shows the migration roadmap panel from the roadmap route', () => {
    cy.getByTestId('react-route-roadmap').click()
    cy.getByTestId('react-migration-roadmap-panel').should('be.visible').and('contain.text', 'Migration roadmap')
    cy.getByTestId('react-active-route-summary').should('contain.text', 'roadmap')
  })

  it('shows the cutover readiness panel from the cutover route', () => {
    cy.getByTestId('react-route-cutover').click()
    cy.getByTestId('react-cutover-readiness-panel').should('be.visible')
    cy.getByTestId('react-cutover-summary').should('be.visible')
    cy.getByTestId('react-cutover-gates').should('contain.text', 'API contract parity')
    cy.getByTestId('react-cutover-recommendation').should('be.visible')
  })

  it('shows the pilot launch route without leaking parity or handoff panels', () => {
    cy.getByTestId('react-route-pilot').click()
    cy.getByTestId('react-pilot-launch-panel').should('be.visible')
    cy.getByTestId('react-pilot-summary').should('be.visible')
    cy.getByTestId('react-pilot-steps').find('li').should('have.length.at.least', 3)
    cy.getByTestId('react-pilot-parity-panel').should('not.exist')
    cy.getByTestId('react-migration-handoff-panel').should('not.exist')
  })

  it('shows the parity route with checklist details', () => {
    cy.getByTestId('react-route-parity').click()
    cy.getByTestId('react-pilot-parity-panel').should('be.visible')
    cy.getByTestId('react-parity-summary').should('be.visible')
    cy.getByTestId('react-parity-checks').find('li').should('have.length.at.least', 3)
    cy.getByTestId('react-parity-recommendation').should('be.visible')
  })

  it('shows the handoff route with handoff details', () => {
    cy.getByTestId('react-route-handoff').click()
    cy.getByTestId('react-migration-handoff-panel').should('be.visible')
    cy.getByTestId('react-handoff-summary').should('be.visible')
    cy.getByTestId('react-handoff-items').find('li').should('have.length.at.least', 3)
    cy.getByTestId('react-handoff-recommendation').should('be.visible')
  })

  it('drives route state from recommended workflow controls', () => {
    cy.getByTestId('react-workflow-role-button').click()
    cy.getByTestId('react-active-route-summary').should('contain.text', 'readiness')
    cy.getByTestId('react-workflow-operations-button').click()
    cy.getByTestId('react-active-route-summary').should('contain.text', 'hierarchy')
    cy.getByTestId('react-workflow-fleet-button').click()
    cy.getByTestId('react-active-route-summary').should('contain.text', 'roadmap')
    cy.getByTestId('react-workflow-quality-button').click()
    cy.getByTestId('react-active-route-summary').should('contain.text', 'cutover')
  })

  it('keeps the legacy rollback link available but separate from React route state', () => {
    cy.getByTestId('react-production-hero').within(() => {
      cy.contains('Open Legacy DOM App').should('have.attr', 'href', '/legacy')
    })
    cy.getByTestId('react-active-route-summary').should('contain.text', 'hierarchy')
  })
})
