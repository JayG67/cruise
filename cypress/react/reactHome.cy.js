const { visitReactAppAsAdmin, selectDemoUserByVisibleRole } = require('./support/reactTestHelpers.js')

describe('React home and workspace parity', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('renders the production React shell at the root route', () => {
    cy.location('pathname').should('eq', '/')
    cy.getByTestId('react-production-parity-shell').should('be.visible')
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

  it('drives route summary state from workspace shortcuts', () => {
    cy.getByTestId('react-workspace-role-button').click()
    cy.getByTestId('react-active-route-summary').should('contain.text', 'readiness')
    cy.getByTestId('react-workspace-operations-button').click()
    cy.getByTestId('react-active-route-summary').should('contain.text', 'hierarchy')
    cy.getByTestId('react-workspace-fleet-button').click()
    cy.getByTestId('react-active-route-summary').should('contain.text', 'roadmap')
    cy.getByTestId('react-workspace-quality-button').click()
    cy.getByTestId('react-active-route-summary').should('contain.text', 'cutover')
  })

  it('keeps migration route panels mutually exclusive', () => {
    cy.getByTestId('react-route-pilot').click()
    cy.getByTestId('react-pilot-launch-panel').should('be.visible')
    cy.getByTestId('react-pilot-parity-panel').should('not.exist')

    cy.getByTestId('react-route-parity').click()
    cy.getByTestId('react-pilot-launch-panel').should('not.exist')
    cy.getByTestId('react-pilot-parity-panel').should('be.visible')

    cy.getByTestId('react-route-handoff').click()
    cy.getByTestId('react-pilot-parity-panel').should('not.exist')
    cy.getByTestId('react-migration-handoff-panel').should('be.visible')
  })

  it('shows query status metadata for the React admin data load', () => {
    cy.getByTestId('react-query-status-panel').should('be.visible')
    cy.getByTestId('react-query-status-message').should('contain.text', 'Loaded 3 customers and 2 bookings')
    cy.getByTestId('react-query-request-id').should('contain.text', '#')
    cy.getByTestId('react-refresh-query').should('be.enabled')
  })

  it('keeps admin-only operations out of passenger mode', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-passenger-dashboard').should('be.visible')
    cy.getByTestId('react-active-route-operations').should('not.exist')
    cy.getByTestId('react-admin-hierarchy').should('not.exist')
  })
})