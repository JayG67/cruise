const { byTestId, reactSelectorKeys: rs } = require('./support/reactSelectors')
const { interceptReactCoreApis, selectDemoUserByVisibleRole } = require('./support/reactTestHelpers')

function visitLifecycleBaselineAsAdmin() {
  interceptReactCoreApis()
  cy.visit('/')
  cy.wait('@reactDemoUsers')
  cy.wait('@reactCustomers')
  cy.wait('@reactBookings')
  cy.wait('@reactCruiseLines')
  cy.getByTestId(rs.personFinderPanel).should('be.visible')
  selectDemoUserByVisibleRole('Admin')
  cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Admin')
}

describe('Turnaround lifecycle soup-to-nuts Cypress architecture', () => {
  beforeEach(() => {
    visitLifecycleBaselineAsAdmin()
  })

  it('keeps the long workflow goal anchored in Cypress instead of mobile Playwright', () => {
    cy.readFile('docs/testing-architecture.md')
      .should('contain', 'soup-to-nuts Cypress workflow coverage')
      .and('contain', 'create the data as an administrator')
      .and('contain', 'assume each role')
      .and('contain', 'Drive turnaround operations')
      .and('contain', 'Do not use mobile Playwright as the primary owner of long CRUD lifecycle coverage')

    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.adminMutationPanel).should('be.visible')
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.sqaConsole).should('be.visible')
  })

  it('walks the deepest current admin-to-turnaround role lifecycle through visible UI state', () => {
    cy.getByTestId(rs.createCruiseLineWorkflow).within(() => {
      cy.getByTestId(rs.createCruiseLineName).should('be.visible')
      cy.getByTestId(rs.createShipName).should('be.visible')
      cy.getByTestId(rs.createCruiseLineMessage).should('be.visible')
    })

    cy.getByTestId(rs.adminCreateCustomerForm).within(() => {
      cy.getByTestId(rs.adminCreateCustomerFirstName).should('be.visible')
      cy.getByTestId(rs.adminCreateCustomerEmail).should('be.visible')
      cy.getByTestId(rs.adminCreateCustomerSubmit).should('be.visible')
    })

    cy.getByTestId(rs.adminCreateBookingForm).within(() => {
      cy.getByTestId(rs.adminCreateBookingCustomerId).should('be.visible')
      cy.getByTestId(rs.adminCreateBookingFare).should('be.visible')
      cy.getByTestId(rs.adminCreateBookingSubmit).should('be.visible')
    })

    selectDemoUserByVisibleRole('Turnaround Manager')
    cy.wait('@reactTurnaroundOperations')
    cy.getByTestId(rs.turnaroundManagerDashboard).should('be.visible')
    cy.getByTestId(rs.operationsWorkspaceShell).should('be.visible')
    cy.getByTestId(rs.operationsReleaseBoard).should('be.visible')

    const taskName = `Lifecycle Cypress verification ${Date.now()}`
    cy.getByTestId(rs.operationalReadinessCard).first().within(() => {
      cy.get('select[aria-label$="command status"]').select('IN_PROGRESS')
      cy.get('textarea[aria-label$="command notes"]').clear().type('Lifecycle Cypress command plan verified')
      cy.contains('button', 'Save command plan').click()
    })
    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround command plan updated successfully')

    cy.getByTestId(rs.operationalReadinessCard).first().within(() => {
      cy.get('select[aria-label$="new task department"]').select('turnaround-manager')
      cy.get('input[aria-label$="new task name"]').type(taskName)
      cy.get('input[aria-label$="new task owner"]').type('Alex Turner')
      cy.get('input[aria-label$="new task due time"]').type('10:45')
      cy.get('input[aria-label$="new task location"]').type('Lifecycle staging desk')
      cy.get('input[aria-label$="new task blocker reason"]').type('Lifecycle validation watch')
      cy.contains('button', 'Add turnaround task').click()
    })
    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround task created successfully')
    cy.getByTestId(rs.operationalReadinessCard).first().should('contain.text', taskName)

    selectDemoUserByVisibleRole('Engineering Lead', 'David Torres')
    cy.wait('@reactTurnaroundOperations')
    cy.getByTestId(rs.engineeringLeadDashboard).should('be.visible')
    cy.getByTestId(rs.operationalReadinessCard).first().within(() => {
      cy.getByTestId(rs.operationalRoleChecklist).should('contain.text', 'Confirm shore power')
      cy.get('input[aria-label$="staffing muster location"]').clear().type('Lifecycle engine muster')
      cy.contains('button', 'Save staffing plan').click()
    })
    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround staffing plan updated successfully')
    cy.getByTestId(rs.operationalReadinessCard).first().should('contain.text', 'Lifecycle engine muster')
  })
})
