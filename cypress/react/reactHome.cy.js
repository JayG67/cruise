const { visitReactAppAsAdmin, selectDemoUserByVisibleRole } = require('./support/reactTestHelpers.js')

describe('React home and workspace coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('renders the production React shell at the root route', () => {
    cy.location('pathname').should('eq', '/')
    cy.getByTestId('react-production-shell').should('be.visible')
    cy.getByTestId('react-production-hero').should('contain.text', 'Manage cruise line and fleet operations')
    cy.getByTestId('react-top-navigation').within(() => {
      cy.contains('Dashboard').should('be.visible')
      cy.contains('Roles').should('be.visible')
      cy.contains('Operations').should('be.visible')
      cy.contains('Fleet').should('be.visible')
      cy.contains('Quality').should('be.visible')
    })
  })

  it('renders every React workspace card with accessible actions', () => {
    cy.getByTestId('react-workspace-card-grid').should('be.visible')
    cy.getByTestId('react-workspace-role-button').should('contain.text', 'Role Simulation')
    cy.getByTestId('react-workspace-operations-button').should('contain.text', 'Admin Operations')
    cy.getByTestId('react-workspace-fleet-button').should('contain.text', 'Fleet Directory')
    cy.getByTestId('react-workspace-quality-button').should('contain.text', 'Quality Console')
  })

  it('drives workspace shortcuts to real application sections', () => {
    cy.getByTestId('react-workspace-role-button').click()
    cy.getByTestId('react-role-selector').should('be.visible')
    cy.getByTestId('react-workspace-operations-button').click()
    cy.getByTestId('react-active-route-operations').should('be.visible')
    cy.getByTestId('react-workspace-fleet-button').click()
    cy.getByTestId('react-fleet-directory').should('be.visible')
    cy.getByTestId('react-workspace-quality-button').click()
    cy.getByTestId('react-sqa-console').should('be.visible')
  })

  it('keeps implementation-history review panels out of the product UI', () => {
    cy.getByTestId('react-retired-route-nav').should('not.exist')
    cy.getByTestId('react-release-readiness-section').should('not.exist')
    cy.getByTestId('react-retired-launch-launch-panel').should('not.exist')
    cy.getByTestId('react-retired-launch-evidence-panel').should('not.exist')
    cy.getByTestId('react-retired-handoff-panel').should('not.exist')
  })

  it('keeps API loading and refresh behavior handled inside active workspaces', () => {
    cy.getByTestId('react-query-status-panel').should('not.exist')
    cy.getByTestId('react-refresh-query').should('not.exist')
    cy.getByTestId('react-toggle-customer-workflows').click()
    cy.getByTestId('react-admin-hierarchy').should('contain.text', 'Customer')
    cy.getByTestId('react-fleet-directory').should('be.visible')
    cy.getByTestId('react-sqa-console').should('be.visible')
  })



  it('asks passenger users before switching into an admin-only workspace and respects decline', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-passenger-dashboard').should('be.visible')

    cy.getByTestId('react-workspace-fleet-button').click()
    cy.getByTestId('react-role-switch-confirmation-overlay').should('be.visible')
    cy.getByTestId('react-role-switch-confirmation')
      .should('be.visible')
      .and('contain.text', 'Fleet Directory requires the Admin role')
      .and('have.class', 'react-confirm-action-panel--modal')

    cy.getByTestId('react-role-switch-confirmation-cancel').click()
    cy.getByTestId('react-role-switch-confirmation').should('not.exist')
    cy.getByTestId('react-role-switch-confirmation-overlay').should('not.exist')
    cy.getByTestId('react-demo-user-summary').should('contain.text', 'Passenger')
    cy.getByTestId('react-fleet-directory').should('not.exist')
  })

  it('switches to admin and opens the requested workspace when a passenger accepts', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-workspace-quality-button').click()
    cy.getByTestId('react-role-switch-confirmation-overlay').should('be.visible')
    cy.getByTestId('react-role-switch-confirmation-confirm').click()

    cy.getByTestId('react-demo-user-summary').should('contain.text', 'Admin')
    cy.getByTestId('react-sqa-console').should('be.visible')
    cy.getByTestId('react-role-switch-confirmation').should('not.exist')
    cy.getByTestId('react-role-switch-confirmation-overlay').should('not.exist')
  })

  it('keeps admin-only operations out of passenger mode', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-passenger-dashboard').should('be.visible')
    cy.getByTestId('react-active-route-operations').should('not.exist')
    cy.getByTestId('react-admin-hierarchy').should('not.exist')
  })
})