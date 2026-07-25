const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { selectDemoUserByVisibleRole, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

const dashboardCards = [
  {
    card: 'workspacePresentationButton',
    button: 'employerDemoPresentationButton',
    title: 'Cruise line operations',
    detail: 'Open the line operations workspace',
    destination: rs.cruiseLinePresentationSuite
  },
  {
    card: 'workspaceRoleButton',
    button: 'employerDemoRolesButton',
    title: 'Role-aware Views',
    detail: 'Switch between admin, passenger, group leader',
    destination: rs.roleSelector
  },
  {
    card: 'workspaceOperationsButton',
    button: 'employerDemoOperationsButton',
    title: 'Admin Operations',
    detail: 'Search and manage customer and booking datasets',
    destination: rs.activeRouteOperations
  },
  {
    card: 'workspaceFleetButton',
    button: 'employerDemoFleetButton',
    title: 'Fleet Directory',
    detail: 'Search cruise lines, manage fleets, ships, and sailings',
    destination: rs.fleetDirectory
  },
  {
    card: 'workspaceQualityButton',
    button: 'employerDemoQualityButton',
    title: 'Quality Console',
    detail: 'Run API health, data integrity, accessibility, and browser validation checks',
    destination: rs.sqaConsole
  }
]

describe('Operations dashboard overview', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
    cy.getByTestId(rs.employerDemoCommandCenter).scrollIntoView().should('be.visible')
  })

  it('renders the complete dashboard heading, purpose, proof points, and workspace runway', () => {
    cy.getByTestId(rs.employerDemoCommandCenter)
      .should('have.attr', 'aria-labelledby', 'react-employer-demo-heading')
      .and('contain.text', 'Operations dashboard')
      .and('contain.text', 'Cruise operations at a glance')
      .and('contain.text', 'Monitor passenger booking, fleet administration, role-aware workflows')

    cy.getByTestId(rs.employerDemoProofGrid)
      .should('have.attr', 'aria-label', 'Application proof points')
      .and('be.visible')

    cy.getByTestId(rs.employerDemoProofBusiness)
      .should('contain.text', 'Operational scope')
      .and('contain.text', 'customers')
      .and('contain.text', 'bookings plus fleet, passenger, and itinerary workflows')

    cy.getByTestId(rs.employerDemoProofRoles)
      .should('contain.text', 'Role model')
      .and('contain.text', 'views')
      .and('contain.text', 'Admin, passenger, group leader, manager, and department leads')

    cy.getByTestId(rs.employerDemoProofTurnaround)
      .should('contain.text', 'Turnaround depth')
      .and('contain.text', 'operators')
      .and('contain.text', 'Command, lifecycle, closeout, continuity, staffing, blockers, and signoff evidence')

    cy.getByTestId(rs.employerDemoProofQuality)
      .should('contain.text', 'SQA coverage')
      .and('contain.text', 'lines')
      .and('contain.text', 'isolated SQA console')

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

    cy.getByTestId(rs.workspaceQualityButton).focus().trigger('keydown', { key: ' ' })
    cy.getByTestId(rs.sqaConsole).should('be.visible')
  })

  it('keeps the role-aware destination available after the user switches to passenger mode', () => {
    cy.getByTestId(rs.workspaceRoleButton).click()
    cy.getByTestId(rs.roleSelector).should('be.visible')

    selectDemoUserByVisibleRole('Passenger')

    cy.getByTestId(rs.roleSelector).should('be.visible')
    cy.getByTestId(rs.employerDemoCommandCenter).should('not.exist')
    cy.getByTestId(rs.roleSwitchConfirmation).should('not.exist')
  })

  it('removes the admin-only dashboard when a passenger role is selected', () => {
    selectDemoUserByVisibleRole('Passenger')

    cy.getByTestId(rs.employerDemoCommandCenter).should('not.exist')
    cy.getByTestId(rs.workspacePresentationButton).should('not.exist')
    cy.getByTestId(rs.workspaceOperationsButton).should('not.exist')
    cy.getByTestId(rs.workspaceFleetButton).should('not.exist')
    cy.getByTestId(rs.workspaceQualityButton).should('not.exist')
  })

  it('switches back to admin before reopening an admin dashboard destination', () => {
    selectDemoUserByVisibleRole('Passenger')
    selectDemoUserByVisibleRole('Admin')

    cy.getByTestId(rs.employerDemoCommandCenter).should('be.visible')
    cy.getByTestId(rs.workspacePresentationButton).click()
    cy.getByTestId(rs.cruiseLinePresentationSuite).should('be.visible')
    cy.getByTestId(rs.roleSwitchConfirmation).should('not.exist')
  })
})
