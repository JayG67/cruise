const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { selectDemoUserByVisibleRole, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

const dashboardCards = [
  {
    card: 'workspacePresentationButton',
    button: 'platformOverviewPresentationButton',
    title: 'Cruise line operations',
    detail: 'Open the line operations workspace',
    destination: rs.cruiseLinePresentationSuite
  },
  {
    card: 'workspaceRoleButton',
    button: 'platformOverviewRolesButton',
    title: 'Role-aware Views',
    detail: 'Switch between admin, passenger, group leader',
    destination: rs.roleSelector
  },
  {
    card: 'workspaceOperationsButton',
    button: 'platformOverviewOperationsButton',
    title: 'Admin Operations',
    detail: 'Search and manage customer and booking datasets',
    destination: rs.activeRouteOperations
  },
  {
    card: 'workspaceFleetButton',
    button: 'platformOverviewFleetButton',
    title: 'Fleet Directory',
    detail: 'Search cruise lines, manage fleets, ships, and sailings',
    destination: rs.fleetDirectory
  },
  {
    card: 'workspaceIntelligenceButton',
    button: 'platformOverviewIntelligenceButton',
    title: 'Operations Intelligence',
    detail: 'Review turnaround risks, staffing gaps, escalations, dependencies, handoffs, and readiness actions',
    destination: rs.operationsIntelligenceCenter
  }
]

describe('Operations dashboard overview', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
    cy.getByTestId(rs.platformOverviewCommandCenter).scrollIntoView().should('be.visible')
  })

  it('renders the complete dashboard heading, purpose, proof points, and workspace runway', () => {
    cy.getByTestId(rs.platformOverviewCommandCenter)
      .should('have.attr', 'aria-labelledby', 'react-platform-overview-heading')
      .and('contain.text', 'Platform workspaces')
      .and('contain.text', 'Operational workspaces and platform capabilities')
      .and('contain.text', 'Open the workspace needed to manage cruise lines, fleets, guests, bookings, turnaround execution, and operational risk')

    cy.getByTestId(rs.platformOverviewMetricsGrid)
      .should('have.attr', 'aria-label', 'Platform operating metrics')
      .and('be.visible')

    cy.getByTestId(rs.platformOverviewMetricBusiness)
      .should('contain.text', 'Operational scope')
      .and('contain.text', 'customers')
      .and('contain.text', 'bookings plus fleet, passenger, and itinerary workflows')

    cy.getByTestId(rs.platformOverviewMetricRoles)
      .should('contain.text', 'Role model')
      .and('contain.text', 'views')
      .and('contain.text', 'Admin, passenger, group leader, manager, and department leads')

    cy.getByTestId(rs.platformOverviewMetricTurnaround)
      .should('contain.text', 'Turnaround depth')
      .and('contain.text', 'operators')
      .and('contain.text', 'Command, lifecycle, closeout, continuity, staffing, blockers, and signoff evidence')

    cy.getByTestId(rs.platformOverviewMetricIntelligence)
      .should('contain.text', 'Operations intelligence')
      .and('contain.text', 'lines')
      .and('contain.text', 'Turnaround risks, staffing gaps, escalations, and readiness actions are visible from one operational view')

    cy.getByTestId(rs.workspaceCardGrid).children().should('have.length', 5)
  })

  it('renders every workspace card and nested action as an accessible interactive control', () => {
    dashboardCards.forEach(({ card, button, title, detail }) => {
      cy.getByTestId(rs[card])
        .should('have.attr', 'role', 'button')
        .and('have.attr', 'tabindex', '0')
        .and('contain.text', title)
        .and('contain.text', detail)

      cy.getByTestId(rs[button])
        .should('be.visible')
        .and('have.prop', 'tagName', 'BUTTON')
        .and('not.be.disabled')
    })
  })

  dashboardCards.forEach(({ button, title, destination }) => {
    it(`opens ${title} from its visible action button`, () => {
      cy.getByTestId(rs[button]).click()
      cy.getByTestId(destination).should('be.visible')
    })
  })

  it('opens workspaces from the full card with both keyboard activation keys', () => {
    cy.getByTestId(rs.workspaceRoleButton).focus().trigger('keydown', { key: 'Enter' })
    cy.getByTestId(rs.roleSelector).should('be.visible')

    cy.getByTestId(rs.workspaceIntelligenceButton).focus().trigger('keydown', { key: ' ' })
    cy.getByTestId(rs.operationsIntelligenceCenter).should('be.visible')
  })

  it('keeps the role-aware destination available after the user switches to passenger mode', () => {
    cy.getByTestId(rs.workspaceRoleButton).click()
    cy.getByTestId(rs.roleSelector).should('be.visible')

    selectDemoUserByVisibleRole('Passenger')

    cy.getByTestId(rs.roleSelector).should('be.visible')
    cy.getByTestId(rs.platformOverviewCommandCenter).should('not.exist')
    cy.getByTestId(rs.roleSwitchConfirmation).should('not.exist')
  })

  it('removes the admin-only dashboard when a passenger role is selected', () => {
    selectDemoUserByVisibleRole('Passenger')

    cy.getByTestId(rs.platformOverviewCommandCenter).should('not.exist')
    cy.getByTestId(rs.workspacePresentationButton).should('not.exist')
    cy.getByTestId(rs.workspaceOperationsButton).should('not.exist')
    cy.getByTestId(rs.workspaceFleetButton).should('not.exist')
    cy.getByTestId(rs.workspaceIntelligenceButton).should('not.exist')
  })

  it('switches back to admin before reopening an admin dashboard destination', () => {
    selectDemoUserByVisibleRole('Passenger')
    selectDemoUserByVisibleRole('Admin')

    cy.getByTestId(rs.platformOverviewCommandCenter).should('be.visible')
    cy.getByTestId(rs.workspacePresentationButton).click()
    cy.getByTestId(rs.cruiseLinePresentationSuite).should('be.visible')
    cy.getByTestId(rs.roleSwitchConfirmation).should('not.exist')
  })
})
