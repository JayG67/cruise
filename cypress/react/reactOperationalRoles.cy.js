const { interceptReactCoreApis, selectDemoUserByVisibleRole } = require('./support/reactTestHelpers')

describe('React operational role foundation', () => {
  beforeEach(() => {
    interceptReactCoreApis()
    cy.visit('/')
    cy.wait('@reactDemoUsers')
    cy.wait('@reactCustomers')
    cy.wait('@reactBookings')
    cy.wait('@reactTurnaroundOperations')
    cy.wait('@reactCruiseLines')
  })

  it('renders a turnaround readiness dashboard for operational users without admin CRUD controls', () => {
    selectDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId('react-turnaround-manager-dashboard').should('be.visible')
    cy.getByTestId('react-operational-turnaround-panel').should('be.visible')
    cy.contains('Turnaround operations').should('be.visible')
    cy.contains('database-backed turnaround plans').should('be.visible')
    cy.contains('Miami same-day turnaround readiness').should('be.visible')
    cy.getByTestId('react-operational-readiness-bookings').should('contain.text', '2')
    cy.getByTestId('react-operational-readiness-passengers').should('contain.text', '4')
    cy.getByTestId('react-operational-readiness-card').should('have.length', 2)
    cy.getByTestId('react-operational-role-checklist').should('contain.text', 'Sequence disembarkation')
    cy.getByTestId('react-customer-hierarchy').should('not.exist')
    cy.getByTestId('react-fleet-directory').should('not.exist')
  })

  it('changes checklist focus for specialized operational leads', () => {
    selectDemoUserByVisibleRole('Housekeeping Lead')
    cy.getByTestId('react-housekeeping-lead-dashboard').should('be.visible')
    cy.contains('Prioritize cabin strip and reset windows').should('be.visible')
    cy.getByTestId('react-operational-role-checklist').should('contain.text', 'Prioritize cabin strip and reset windows')

    selectDemoUserByVisibleRole('Engineering Lead')
    cy.getByTestId('react-engineering-lead-dashboard').should('be.visible')
    cy.contains('Confirm shore power, fuel, potable water, and waste windows').should('be.visible')
    cy.getByTestId('react-operational-role-checklist').should('contain.text', 'shore power, fuel, potable water, and waste windows')
  })
})
