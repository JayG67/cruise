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

  it('lets operational leads update database-backed turnaround task status from the dashboard', () => {
    selectDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId('react-operational-progress-summary').first().should('contain.text', '0 of 4 tasks complete')
    cy.contains('[data-testid="react-operational-role-checklist"] li', 'Sequence disembarkation')
      .within(() => {
        cy.contains('button', 'Complete').click()
      })

    cy.wait('@reactUpdateTurnaroundTaskStatus')
      .its('request.body')
      .should('deep.equal', { status: 'COMPLETE', blockerReason: '' })

    cy.getByTestId('react-operational-mutation-status').should('contain.text', 'Turnaround task status updated successfully')
    cy.contains('[data-testid="react-operational-role-checklist"] li', 'Sequence disembarkation')
      .should('contain.text', 'COMPLETE')
    cy.getByTestId('react-operational-progress-summary').first().should('contain.text', '1 of 4 tasks complete')
  })

  it('lets operational leads maintain database-backed task owner, timing, location, and blocker notes', () => {
    selectDemoUserByVisibleRole('Turnaround Manager')

    cy.contains('[data-testid="react-operational-role-checklist"] li', 'Sequence disembarkation')
      .as('sequencingTask')
      .within(() => {
        cy.getByTestId('react-operational-task-details').should('contain.text', 'Alex Turner')
        cy.get('input[aria-label="Sequence disembarkation, provisioning, cleaning, and embarkation owner"]').clear().type('Jordan Pierce')
        cy.get('input[aria-label="Sequence disembarkation, provisioning, cleaning, and embarkation due time"]').clear().type('09:45')
        cy.get('input[aria-label="Sequence disembarkation, provisioning, cleaning, and embarkation location"]').clear().type('Pier 4 command desk')
        cy.get('input[aria-label="Sequence disembarkation, provisioning, cleaning, and embarkation blocker reason"]').clear().type('Waiting for terminal headcount reconciliation')
        cy.contains('button', 'Save task details').click()
      })

    cy.wait('@reactUpdateTurnaroundTaskDetails')
      .its('request.body')
      .should('deep.equal', {
        ownerName: 'Jordan Pierce',
        dueTime: '09:45',
        location: 'Pier 4 command desk',
        blockerReason: 'Waiting for terminal headcount reconciliation'
      })

    cy.getByTestId('react-operational-mutation-status').should('contain.text', 'Turnaround task details updated successfully')
    cy.contains('[data-testid="react-operational-role-checklist"] li', 'Sequence disembarkation')
      .should('contain.text', 'Jordan Pierce')
      .within(() => {
        cy.contains('button', 'Block').click()
      })

    cy.wait('@reactUpdateTurnaroundTaskStatus')
      .its('request.body')
      .should('deep.equal', {
        status: 'BLOCKED',
        blockerReason: 'Waiting for terminal headcount reconciliation'
      })

    cy.contains('[data-testid="react-operational-role-checklist"] li', 'Sequence disembarkation')
      .should('contain.text', 'Blocked: Waiting for terminal headcount reconciliation')
  })

  it('lets operational leads add database-backed shift updates to turnaround tasks', () => {
    selectDemoUserByVisibleRole('Turnaround Manager')

    cy.contains('[data-testid="react-operational-role-checklist"] li', 'Coordinate department readiness standups')
      .as('standupTask')
      .should('contain.text', 'Readiness huddle completed from the database update log.')
      .within(() => {
        cy.get('input[aria-label="Coordinate department readiness standups shift update"]').type('Pier agent confirmed luggage hall release window.')
        cy.contains('button', 'Add shift update').click()
      })

    cy.wait('@reactCreateTurnaroundTaskUpdate')
      .its('request.body')
      .should('deep.equal', {
        authorName: 'Alex Turner',
        updateType: 'NOTE',
        message: 'Pier agent confirmed luggage hall release window.'
      })

    cy.getByTestId('react-operational-mutation-status').should('contain.text', 'Turnaround task update added successfully')
    cy.contains('[data-testid="react-operational-role-checklist"] li', 'Coordinate department readiness standups')
      .should('contain.text', 'Pier agent confirmed luggage hall release window.')
  })

})
