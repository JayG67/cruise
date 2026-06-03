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