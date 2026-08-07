const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { visitReactAppAsAdmin, selectDemoUserByVisibleRole } = require('./support/reactTestHelpers.js')

describe('React home and workspace coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('renders the production React shell at the root route', () => {
    cy.location('pathname').should('eq', '/')
    cy.getByTestId(rs.productionShell).should('be.visible')
    cy.getByTestId(rs.productionHero).should('contain.text', 'Manage cruise line and fleet operations')
    cy.getByTestId(rs.topNavigation).within(() => {
      cy.contains('Cruise Fleet Operations Platform').should('be.visible')
      cy.contains('Overview').should('be.visible')
      cy.contains('Line Operations').should('be.visible')
      cy.contains('Roles').should('be.visible')
      cy.contains('Operations').should('be.visible')
      cy.contains('Fleet').should('be.visible')
      cy.contains('Turnaround Setup').should('be.visible')
      cy.contains('Intelligence').should('be.visible')
    })
  })

  it('renders every React workspace card with accessible actions', () => {
    cy.getByTestId(rs.workspaceCardGrid).should('be.visible')
    cy.getByTestId(rs.platformOverviewCommandCenter).should('contain.text', 'Operational workspaces and platform capabilities')
    cy.getByTestId(rs.workspaceRoleButton).should('contain.text', 'Role-aware Views')
    cy.getByTestId(rs.workspaceOperationsButton).should('contain.text', 'Admin Operations')
    cy.getByTestId(rs.workspaceFleetButton).should('contain.text', 'Fleet Directory')
    cy.getByTestId(rs.workspaceIntelligenceButton).should('contain.text', 'Operations Intelligence')
  })

  it('drives workspace shortcuts to real application sections', () => {
    cy.getByTestId(rs.heroDemoButton).click()
    cy.getByTestId(rs.platformOverviewCommandCenter).should('be.visible')
    cy.getByTestId(rs.workspaceRoleButton).click()
    cy.getByTestId(rs.roleSelector).should('be.visible')
    cy.getByTestId(rs.workspaceOperationsButton).click()
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.workspaceFleetButton).click()
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.workspaceIntelligenceButton).click()
    cy.getByTestId(rs.operationsIntelligenceCenter).should('be.visible')
  })

  it('keeps implementation-history review panels out of the product UI', () => {
    cy.getByTestId(rs.retiredRouteNav).should('not.exist')
    cy.getByTestId(rs.releaseReadinessSection).should('not.exist')
    cy.getByTestId(rs.retiredLaunchLaunchPanel).should('not.exist')
    cy.getByTestId(rs.retiredLaunchEvidencePanel).should('not.exist')
    cy.getByTestId(rs.retiredHandoffPanel).should('not.exist')
  })

  it('keeps API loading and refresh behavior handled inside active workspaces', () => {
    cy.getByTestId(rs.queryStatusPanel).should('not.exist')
    cy.getByTestId(rs.refreshQuery).should('not.exist')
    cy.getByTestId(rs.toggleCustomerWorkflows).click()
    cy.getByTestId(rs.adminHierarchy).should('contain.text', 'Customer')
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.operationsIntelligenceCenter).should('be.visible')
  })



  it('asks passenger users before switching into an admin-only workspace and respects decline', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.passengerDashboard).should('be.visible')

    cy.getByTestId(rs.navFleetButton).click()
    cy.getByTestId(rs.roleSwitchConfirmationOverlay).should('be.visible')
    cy.getByTestId(rs.roleSwitchConfirmation)
      .should('be.visible')
      .and('contain.text', 'Fleet Directory requires the Admin role')
      .and('have.class', 'react-confirm-action-panel--modal')

    cy.getByTestId(rs.roleSwitchConfirmationCancel).click()
    cy.getByTestId(rs.roleSwitchConfirmation).should('not.exist')
    cy.getByTestId(rs.roleSwitchConfirmationOverlay).should('not.exist')
    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Passenger')
    cy.getByTestId(rs.fleetDirectory).should('not.exist')
  })

  it('switches to admin and opens the requested workspace when a passenger accepts', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.navIntelligenceButton).click()
    cy.getByTestId(rs.roleSwitchConfirmationOverlay).should('be.visible')
    cy.getByTestId(rs.roleSwitchConfirmationConfirm).click()

    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Admin')
    cy.getByTestId(rs.operationsIntelligenceCenter).should('be.visible')
    cy.getByTestId(rs.roleSwitchConfirmation).should('not.exist')
    cy.getByTestId(rs.roleSwitchConfirmationOverlay).should('not.exist')
  })

  it('keeps admin-only operations out of passenger mode', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.passengerDashboard).should('be.visible')
    cy.getByTestId(rs.activeRouteOperations).should('not.exist')
    cy.getByTestId(rs.adminHierarchy).should('not.exist')
  })
})