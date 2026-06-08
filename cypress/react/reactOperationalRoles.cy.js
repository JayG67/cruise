const { byTestId, reactSelectorKeys: rs } = require('./support/reactSelectors')
const { interceptReactCoreApis, selectDemoUserByVisibleRole } = require('./support/reactTestHelpers')


function selectOperationalDemoUserByVisibleRole(roleText) {
  selectDemoUserByVisibleRole(roleText)
  cy.wait('@reactTurnaroundOperations')
}

describe('React operational role foundation', () => {
  beforeEach(() => {
    interceptReactCoreApis()
    cy.visit('/')
    cy.wait('@reactDemoUsers')
    cy.wait('@reactCustomers')
    cy.wait('@reactBookings')
    cy.wait('@reactCruiseLines')
  })

  it('renders a turnaround readiness dashboard for operational users without admin CRUD controls', () => {
    selectOperationalDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId(rs.turnaroundManagerDashboard).should('be.visible')
    cy.getByTestId(rs.operationalTurnaroundPanel).should('be.visible')
    cy.contains('Turnaround operations').should('be.visible')
    cy.contains('database-backed turnaround plans').should('be.visible')
    cy.contains('Miami same-day turnaround readiness').should('be.visible')
    cy.getByTestId(rs.operationalReadinessBookings).should('contain.text', '2')
    cy.getByTestId(rs.operationalReadinessPassengers).should('contain.text', '2')
    cy.getByTestId(rs.turnaroundSelectorPanel).should('be.visible')
    cy.getByTestId(rs.turnaroundSelector).should('contain.text', 'Miami same-day turnaround readiness').and('contain.text', 'San Juan repositioning turnaround readiness')
    cy.getByTestId(rs.operationalReadinessCard).should('have.length', 1)
    cy.getByTestId(rs.operationalRoleChecklist).should('contain.text', 'Sequence disembarkation')
    cy.getByTestId(rs.customerHierarchy).should('not.exist')
    cy.getByTestId(rs.fleetDirectory).should('not.exist')
  })

  it('lets operational users switch the selected turnaround sailing without rendering every operation at once', () => {
    selectOperationalDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId(rs.operationalReadinessCard).should('have.length', 1)
    cy.getByTestId(rs.operationalReadinessCard).should('contain.text', 'Miami same-day turnaround readiness')
    cy.getByTestId(rs.operationalReadinessCard).should('not.contain.text', 'San Juan repositioning turnaround readiness')
    cy.getByTestId(rs.turnaroundSelectorSummary)
      .should('contain.text', 'Miami, Florida')
      .and('contain.text', 'Tasks')
      .and('contain.text', '2')

    cy.getByTestId(rs.turnaroundSelector).select('turnaround-react-2')

    cy.getByTestId(rs.operationalReadinessCard).should('have.length', 1)
    cy.getByTestId(rs.operationalReadinessCard).should('contain.text', 'San Juan repositioning turnaround readiness')
    cy.getByTestId(rs.operationalReadinessCard).should('not.contain.text', 'Miami same-day turnaround readiness')
    cy.getByTestId(rs.operationalReadinessPassengers).should('contain.text', '2')
    cy.getByTestId(rs.turnaroundSelectorSummary)
      .should('contain.text', 'San Juan, Puerto Rico')
      .and('contain.text', 'Tasks')
      .and('contain.text', '1')
  })

  it('renders the slice 2 operations workspace navigation shell and updates active workstream guidance', () => {
    selectOperationalDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId(rs.operationsWorkspaceShell).should('be.visible')
    cy.getByTestId(rs.operationsWorkspaceNav).within(() => {
      cy.contains('button', 'Overview').should('have.attr', 'aria-pressed', 'true')
      cy.contains('button', 'Tasks').should('be.visible')
      cy.contains('button', 'Dependencies').should('be.visible')
      cy.contains('button', 'Handoffs').should('be.visible')
      cy.contains('button', 'Escalations').should('be.visible')
      cy.contains('button', 'Staffing').should('be.visible')
      cy.contains('button', 'Readiness').should('be.visible')
    })

    cy.getByTestId(rs.operationsWorkspaceActiveSummary)
      .should('contain.text', 'Overview')
      .and('contain.text', 'Command plan')

    cy.getByTestId(rs.operationsWorkspaceHandoffsButton).click()
    cy.getByTestId(rs.operationsWorkspaceHandoffsButton).should('have.attr', 'aria-pressed', 'true')
    cy.getByTestId(rs.operationsWorkspaceActiveSummary)
      .should('contain.text', 'Handoffs')
      .and('contain.text', 'Department-to-department release workflow')

    cy.getByTestId(rs.operationsWorkspaceTasksButton).click()
    cy.getByTestId(rs.operationsWorkspaceTasksButton).should('have.attr', 'aria-pressed', 'true')
    cy.getByTestId(rs.operationsWorkspaceActiveSummary)
      .should('contain.text', 'Tasks')
      .and('contain.text', 'Role-focused task checklist')
  })

  it('renders the slice 3 task workspace as a focused queue with one editable task detail panel', () => {
    selectOperationalDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId(rs.operationsWorkspaceTasksButton).click()
    cy.getByTestId(rs.operationsTaskWorkspace).should('be.visible')
    cy.getByTestId(rs.operationsTaskWorkspaceSummary)
      .should('contain.text', 'Total')
      .and('contain.text', '2')
      .and('contain.text', 'Blocked')
    cy.getByTestId(rs.operationsTaskList).should('be.visible')
    cy.getByTestId(rs.operationsTaskListItem).should('have.length', 2)
    cy.getByTestId(rs.operationsTaskListItem).first().should('have.attr', 'aria-pressed', 'true')
    cy.getByTestId(rs.operationsTaskDetailPanel)
      .should('be.visible')
      .and('contain.text', 'Coordinate department readiness standups')
      .and('contain.text', 'Owner')
      .and('contain.text', 'Due')
      .and('contain.text', 'Location')

    cy.contains(`${byTestId('operationsTaskListItem')}`, 'Sequence disembarkation, provisioning, cleaning, and embarkation').click()
    cy.getByTestId(rs.operationsTaskDetailPanel)
      .should('contain.text', 'Sequence disembarkation, provisioning, cleaning, and embarkation')
      .and('contain.text', 'READY')

    cy.getByTestId(rs.operationsTaskDetailPanel).within(() => {
      cy.get('textarea[aria-label="Sequence disembarkation, provisioning, cleaning, and embarkation blocker reason"]')
        .should('be.visible')
        .and($textarea => {
          expect($textarea[0].getBoundingClientRect().height).to.be.greaterThan(70)
        })
    })
  })

  it('renders the slice 4 dependency workspace as a focused gate queue with one selected dependency detail panel', () => {
    selectOperationalDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId(rs.operationsWorkspaceDependenciesButton).click()
    cy.getByTestId(rs.operationsDependencyWorkspace).should('be.visible')
    cy.getByTestId(rs.operationsDependencyWorkspaceSummary)
      .should('contain.text', 'Total')
      .and('contain.text', '2')
      .and('contain.text', 'Active')
      .and('contain.text', '2')
      .and('contain.text', 'Cleared')
    cy.getByTestId(rs.operationsDependencyList).should('be.visible')
    cy.getByTestId(rs.operationsDependencyListItem).should('have.length', 2)
    cy.getByTestId(rs.operationsDependencyListItem).first().should('have.attr', 'aria-pressed', 'true')
    cy.getByTestId(rs.operationsDependencyDetailPanel)
      .should('be.visible')
      .and('contain.text', 'Prioritize cabin strip and reset windows')
      .and('contain.text', 'Required first')
      .and('contain.text', 'Sequence disembarkation, provisioning, cleaning, and embarkation')
      .and('contain.text', 'ACTIVE')
    cy.getByTestId(rs.operationsDependencyNote)
      .should('contain.text', 'Cabin work depends on command sequencing.')

    cy.contains(`${byTestId('operationsDependencyListItem')}`, 'Confirm shore power, fuel, potable water, and waste windows').click()
    cy.getByTestId(rs.operationsDependencyDetailPanel)
      .should('contain.text', 'Confirm shore power, fuel, potable water, and waste windows')
      .and('contain.text', 'Coordinate department readiness standups')
      .and('contain.text', 'Technical clearance follows the readiness huddle.')

    cy.getByTestId(rs.operationsDependencyDetailList).within(() => {
      cy.contains('dt', 'Blocked task').should('be.visible')
      cy.contains('dt', 'Required first').should('be.visible')
      cy.contains('dt', 'Gate type').should('be.visible')
      cy.contains('dt', 'Gate status').should('be.visible')
    })
  })

  it('renders the slice 5 handoff workspace as a focused release queue with one editable detail panel', () => {
    selectOperationalDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId(rs.operationsWorkspaceHandoffsButton).click()
    cy.getByTestId(rs.operationsHandoffWorkspace).should('be.visible')
    cy.getByTestId(rs.operationsHandoffWorkspaceSummary)
      .should('contain.text', 'Total')
      .and('contain.text', '2')
      .and('contain.text', 'Complete')
      .and('contain.text', 'Blocked')
      .and('contain.text', 'Open')
    cy.getByTestId(rs.operationsHandoffList).should('be.visible')
    cy.getByTestId(rs.operationsHandoffListItem).should('have.length', 2)
    cy.getByTestId(rs.operationsHandoffListItem).first().should('have.attr', 'aria-pressed', 'true')
    cy.getByTestId(rs.operationsHandoffDetailPanel)
      .should('be.visible')
      .and('contain.text', 'Cabin readiness to embarkation desk handoff')
      .and('contain.text', 'housekeeping-lead')
      .and('contain.text', 'guest-services-lead')
      .and('contain.text', 'Maria Rodriguez')
      .and('contain.text', '11:00')
    cy.getByTestId(rs.operationsHandoffNote)
      .should('contain.text', 'Guest services needs cabin readiness confirmation')

    cy.contains(`${byTestId('operationsHandoffListItem')}`, 'Technical clearance to command center handoff').click()
    cy.getByTestId(rs.operationsHandoffDetailPanel)
      .should('contain.text', 'Technical clearance to command center handoff')
      .and('contain.text', 'engineering-lead')
      .and('contain.text', 'turnaround-manager')
      .and('contain.text', 'David Torres')
      .and('contain.text', 'IN_REVIEW')

    cy.getByTestId(rs.operationsHandoffDetailList).within(() => {
      cy.contains('dt', 'From').should('be.visible')
      cy.contains('dt', 'To').should('be.visible')
      cy.contains('dt', 'Owner').should('be.visible')
      cy.contains('dt', 'Due time').should('be.visible')
    })

    cy.getByTestId(rs.operationsHandoffDetailPanel).within(() => {
      cy.get('textarea[aria-label="Technical clearance to command center handoff handoff notes"]')
        .should('be.visible')
        .and($textarea => {
          expect($textarea[0].getBoundingClientRect().height).to.be.greaterThan(70)
        })
    })
  })

  it('shows a cross-department operations directory without rendering an oversized operational dataset', () => {
    selectOperationalDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId(rs.operationsDirectoryPanel).should('be.visible')
    cy.getByTestId(rs.operationsDirectoryCount).should('contain.text', '5 departments')
    cy.getByTestId(rs.operationsDirectoryCard).should('have.length', 5)
    cy.getByTestId(rs.operationsDirectoryCard).first().should('contain.text', 'Turnaround Manager')
    cy.getByTestId(rs.operationsDirectoryCard).should('contain.text', 'Housekeeping Lead')
    cy.getByTestId(rs.operationsDirectoryCard).should('contain.text', 'Guest Services Lead')
    cy.getByTestId(rs.operationsDirectoryCard).should('contain.text', 'Food & Beverage Lead')
    cy.getByTestId(rs.operationsDirectoryCard).should('contain.text', 'Engineering Lead')
    cy.getByTestId(rs.operationsDirectoryCard).should('contain.text', 'Contacts')
    cy.getByTestId(rs.operationsDirectoryCard).should('contain.text', 'Handoffs')
    cy.getByTestId(rs.operationsDirectoryCard).should('contain.text', 'Escalations')
  })

  it('changes checklist focus for specialized operational leads', () => {
    selectOperationalDemoUserByVisibleRole('Housekeeping Lead')
    cy.getByTestId(rs.housekeepingLeadDashboard).should('be.visible')
    cy.contains('Prioritize cabin strip and reset windows').should('be.visible')
    cy.getByTestId(rs.operationalRoleChecklist).should('contain.text', 'Prioritize cabin strip and reset windows')

    selectDemoUserByVisibleRole('Engineering Lead')
    cy.getByTestId(rs.engineeringLeadDashboard).should('be.visible')
    cy.contains('Confirm shore power, fuel, potable water, and waste windows').should('be.visible')
    cy.getByTestId(rs.operationalRoleChecklist).should('contain.text', 'shore power, fuel, potable water, and waste windows')
  })


  it('lets turnaround managers update database-backed command plan fields through the visible dashboard', () => {
    selectOperationalDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId(rs.operationalCommandForm).first().within(() => {
      cy.get('select[aria-label="Miami same-day turnaround readiness command status"]').select('IN_PROGRESS')
      cy.get('select[aria-label="Miami same-day turnaround readiness command readiness"]').select('Department handoff watch')
      cy.get('input[aria-label="Miami same-day turnaround readiness turnaround port"]').clear().type('Miami Terminal A')
      cy.get('textarea[aria-label="Miami same-day turnaround readiness command notes"]').clear().type('Terminal command center has accepted the revised handoff timeline and department handoff sequencing.')
      cy.contains('button', 'Save command plan').click()
    })

    cy.wait('@reactUpdateTurnaroundOperationCommand')
      .its('request.body')
      .should('deep.equal', {
        status: 'IN_PROGRESS',
        readinessLevel: 'Department handoff watch',
        port: 'Miami Terminal A',
        notes: 'Terminal command center has accepted the revised handoff timeline and department handoff sequencing.'
      })

    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround command plan updated successfully')
    cy.getByTestId(rs.operationalReadinessCard).first()
      .should('contain.text', 'Command status')
      .and('contain.text', 'IN_PROGRESS')
      .and('contain.text', 'Command readiness')
      .and('contain.text', 'Department handoff watch')
      .and('contain.text', 'Miami Terminal A')
      .and('contain.text', 'Terminal command center has accepted the revised handoff timeline and department handoff sequencing.')
  })

  it('keeps turnaround command controls uniform and readable in the UI', () => {
    selectOperationalDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId(rs.operationalReadinessCard).should('have.length', 1)
    cy.getByTestId(rs.turnaroundSelectorPanel).should('be.visible')

    cy.getByTestId(rs.operationalCommandForm).first().within(() => {
      cy.get('select[aria-label="Miami same-day turnaround readiness command readiness"]')
        .should('be.visible')
        .and('contain.text', 'Standard coordination')
        .and('contain.text', 'High coordination')
        .and('contain.text', 'Department handoff watch')
      cy.get('textarea[aria-label="Miami same-day turnaround readiness command notes"]')
        .should('be.visible')
        .and($textarea => {
          const styles = getComputedStyle($textarea[0])
          expect(styles.whiteSpace).to.equal('pre-wrap')
          expect(styles.overflowWrap).to.match(/anywhere|break-word/)
          expect($textarea[0].getBoundingClientRect().height).to.be.greaterThan(70)
        })
    })

    cy.getByTestId(rs.operationalStaffingSummary).first().within(() => {
      cy.contains('strong', 'Staffing check-in').should('be.visible')
      cy.contains('span', '103 of 114 crew checked in').should('be.visible')
      cy.contains('span', '90% staffed').should('be.visible')
      cy.contains('span', '11 gaps').should('be.visible')
    })
  })

  it('lets operational leads update database-backed turnaround task status from the dashboard', () => {
    selectOperationalDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId(rs.operationalProgressSummary).first().should('contain.text', '0 of 2 tasks complete')
    cy.contains(`${byTestId('operationalRoleChecklist')} li`, 'Sequence disembarkation')
      .within(() => {
        cy.contains('button', 'Complete').click()
      })

    cy.wait('@reactUpdateTurnaroundTaskStatus')
      .its('request.body')
      .should('deep.equal', { status: 'COMPLETE', blockerReason: '' })

    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround task status updated successfully')
    cy.contains(`${byTestId('operationalRoleChecklist')} li`, 'Sequence disembarkation')
      .should('contain.text', 'COMPLETE')
    cy.getByTestId(rs.operationalProgressSummary).first().should('contain.text', '1 of 2 tasks complete')
  })

  it('lets operational leads maintain database-backed task owner, timing, location, and blocker notes', () => {
    selectOperationalDemoUserByVisibleRole('Turnaround Manager')

    cy.contains(`${byTestId('operationalRoleChecklist')} li`, 'Sequence disembarkation')
      .as('sequencingTask')
      .within(() => {
        cy.getByTestId(rs.operationalTaskDetails).should('contain.text', 'Alex Turner')
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

    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround task details updated successfully')
    cy.contains(`${byTestId('operationalRoleChecklist')} li`, 'Sequence disembarkation')
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

    cy.contains(`${byTestId('operationalRoleChecklist')} li`, 'Sequence disembarkation')
      .should('contain.text', 'Blocked: Waiting for terminal headcount reconciliation')
  })


  it('lets operational leads update database-backed staffing plans from the visible dashboard', () => {
    selectOperationalDemoUserByVisibleRole('Housekeeping Lead')

    cy.getByTestId(rs.operationalStaffingSummary).first()
      .should('contain.text', '103 of 114 crew checked in')
      .and('contain.text', '11 gaps')
    cy.getByTestId(rs.operationalStaffingList).first()
      .should('contain.text', 'housekeeping-lead')
      .and('contain.text', 'Maria Rodriguez')
      .and('contain.text', 'Guest decks')

    cy.getByTestId(rs.operationalStaffingForm).first().within(() => {
      cy.get('input[aria-label="Miami same-day turnaround readiness planned staff"]').clear().type('44')
      cy.get('input[aria-label="Miami same-day turnaround readiness checked in staff"]').clear().type('41')
      cy.get('input[aria-label="Miami same-day turnaround readiness staffing lead"]').clear().type('Maria Rodriguez')
      cy.get('input[aria-label="Miami same-day turnaround readiness staffing muster location"]').clear().type('Deck 9 service corridor')
      cy.get('input[aria-label="Miami same-day turnaround readiness staffing notes"]').clear().type('Three cabin teams are still moving from pier briefing to guest decks.')
      cy.contains('button', 'Save staffing plan').click()
    })

    cy.wait('@reactUpdateTurnaroundStaffing')
      .its('request.body')
      .should('deep.equal', {
        plannedCount: 44,
        checkedInCount: 41,
        leadName: 'Maria Rodriguez',
        musterLocation: 'Deck 9 service corridor',
        notes: 'Three cabin teams are still moving from pier briefing to guest decks.'
      })

    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround staffing plan updated successfully')
    cy.getByTestId(rs.operationalStaffingList).first()
      .should('contain.text', '41 / 44')
      .and('contain.text', 'Deck 9 service corridor')
  })


  it('lets operational leads complete database-backed dependency and handoff workflows from the visible dashboard', () => {
    selectOperationalDemoUserByVisibleRole('Housekeeping Lead')

    cy.getByTestId(rs.operationalDependencySummary).first()
      .should('contain.text', '0 of 2 clear')
      .and('contain.text', '2 active')
    cy.getByTestId(rs.operationalDependencyList).first()
      .should('contain.text', 'Prioritize cabin strip and reset windows')
      .and('contain.text', 'depends on Sequence disembarkation')
      .and('contain.text', 'Cabin work depends on command sequencing')

    cy.getByTestId(rs.operationalHandoffSummary).first()
      .should('contain.text', '0 of 2 complete')
    cy.getByTestId(rs.operationalHandoffList).first()
      .should('contain.text', 'Cabin readiness to embarkation desk handoff')
      .and('contain.text', 'housekeeping-lead')
      .and('contain.text', 'guest-services-lead')

    cy.getByTestId(rs.operationalHandoffForm).first().within(() => {
      cy.get('select[aria-label="Cabin readiness to embarkation desk handoff handoff status"]').select('COMPLETE')
      cy.get('input[aria-label="Cabin readiness to embarkation desk handoff handoff owner"]').clear().type('Maria Rodriguez')
      cy.get('input[aria-label="Cabin readiness to embarkation desk handoff handoff due time"]').clear().type('10:55')
      cy.get('input[aria-label="Cabin readiness to embarkation desk handoff handoff notes"]').clear().type('Cabin release was handed to terminal embarkation leads.')
      cy.contains('button', 'Save handoff').click()
    })

    cy.wait('@reactUpdateTurnaroundHandoff')
      .its('request.body')
      .should('deep.equal', {
        status: 'COMPLETE',
        ownerName: 'Maria Rodriguez',
        dueTime: '10:55',
        notes: 'Cabin release was handed to terminal embarkation leads.'
      })

    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround handoff updated successfully')
    cy.getByTestId(rs.operationalHandoffSummary).first().should('contain.text', '1 of 2 complete')
    cy.getByTestId(rs.operationalHandoffList).first()
      .should('contain.text', 'COMPLETE')
      .and('contain.text', 'Cabin release was handed to terminal embarkation leads.')
  })

  it('lets operational leads create database-backed follow-up tasks from the visible dashboard', () => {
    selectOperationalDemoUserByVisibleRole('Guest Services Lead')

    cy.getByTestId(rs.operationalTaskCreateForm).first().within(() => {
      cy.get('select[aria-label="Miami same-day turnaround readiness new task department"]').select('guest-services-lead')
      cy.get('input[aria-label="Miami same-day turnaround readiness new task name"]').type('Open late-arrival guest support desk')
      cy.get('input[aria-label="Miami same-day turnaround readiness new task owner"]').clear().type('Angela Brooks')
      cy.get('input[aria-label="Miami same-day turnaround readiness new task due time"]').type('11:15')
      cy.get('input[aria-label="Miami same-day turnaround readiness new task location"]').type('Terminal help desk')
      cy.get('input[aria-label="Miami same-day turnaround readiness new task blocker reason"]').type('Awaiting pier staffing confirmation')
      cy.contains('button', 'Add turnaround task').click()
    })

    cy.wait('@reactCreateTurnaroundTask')
      .its('request.body')
      .should('deep.equal', {
        departmentRole: 'guest-services-lead',
        taskName: 'Open late-arrival guest support desk',
        ownerName: 'Angela Brooks',
        dueTime: '11:15',
        location: 'Terminal help desk',
        blockerReason: 'Awaiting pier staffing confirmation',
        status: 'READY'
      })

    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround task created successfully')
    cy.getByTestId(rs.operationalProgressSummary).first().should('contain.text', '0 of 1 tasks complete')
    cy.contains(`${byTestId('operationalRoleChecklist')} li`, 'Open late-arrival guest support desk')
      .should('contain.text', 'Angela Brooks')
      .and('contain.text', '11:15')
      .and('contain.text', 'Terminal help desk')
  })



  it('lets operational leads remove database-backed follow-up tasks from the visible dashboard', () => {
    selectOperationalDemoUserByVisibleRole('Housekeeping Lead')

    cy.contains(`${byTestId('operationalRoleChecklist')} li`, 'Prioritize cabin strip and reset windows')
      .as('guestTask')
      .within(() => {
        cy.contains('button', 'Remove task').click()
      })

    cy.wait('@reactDeleteTurnaroundTask')

    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround task removed successfully')
    cy.getByTestId(rs.operationalProgressSummary).first().should('contain.text', '0 of 0 tasks complete')
    cy.contains(`${byTestId('operationalRoleChecklist')} li`, 'Prioritize cabin strip and reset windows').should('not.exist')
  })


  it('lets operational leads add database-backed shift updates to turnaround tasks', () => {
    selectOperationalDemoUserByVisibleRole('Turnaround Manager')

    cy.contains(`${byTestId('operationalRoleChecklist')} li`, 'Coordinate department readiness standups')
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

    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround task update added successfully')
    cy.contains(`${byTestId('operationalRoleChecklist')} li`, 'Coordinate department readiness standups')
      .should('contain.text', 'Pier agent confirmed luggage hall release window.')
  })


  it('lets operational leads create and resolve database-backed escalation log items from the visible dashboard', () => {
    selectOperationalDemoUserByVisibleRole('Guest Services Lead')

    cy.getByTestId(rs.operationalEscalationSummary).first().should('contain.text', '1 open')
    cy.getByTestId(rs.operationalEscalationCreateForm).first().within(() => {
      cy.get('select[aria-label="Miami same-day turnaround readiness escalation department"]').select('guest-services-lead')
      cy.get('select[aria-label="Miami same-day turnaround readiness escalation severity"]').select('CRITICAL')
      cy.get('input[aria-label="Miami same-day turnaround readiness escalation title"]').type('Late bus staging capacity risk')
      cy.get('input[aria-label="Miami same-day turnaround readiness escalation owner"]').clear().type('Angela Brooks')
      cy.get('input[aria-label="Miami same-day turnaround readiness escalation notes"]').type('Terminal curb team is opening the auxiliary bus lane.')
      cy.contains('button', 'Add escalation').click()
    })

    cy.wait('@reactCreateTurnaroundEscalation')
      .its('request.body')
      .should('deep.equal', {
        departmentRole: 'guest-services-lead',
        severity: 'CRITICAL',
        title: 'Late bus staging capacity risk',
        ownerName: 'Angela Brooks',
        status: 'OPEN',
        resolutionNotes: 'Terminal curb team is opening the auxiliary bus lane.'
      })

    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround escalation created successfully')
    cy.getByTestId(rs.operationalEscalationList).first().should('contain.text', 'Late bus staging capacity risk')

    cy.contains(`${byTestId('operationalEscalationList')} li`, 'Terminal luggage hall capacity watch').within(() => {
      cy.get('select[aria-label="Terminal luggage hall capacity watch escalation status"]').select('RESOLVED')
      cy.get('select[aria-label="Terminal luggage hall capacity watch escalation update severity"]').select('WATCH')
      cy.get('input[aria-label="Terminal luggage hall capacity watch escalation update owner"]').clear().type('Angela Brooks')
      cy.get('input[aria-label="Terminal luggage hall capacity watch escalation resolution notes"]').clear().type('Luggage hall released and terminal queue is flowing.')
      cy.contains('button', 'Save escalation').click()
    })

    cy.wait('@reactUpdateTurnaroundEscalation')
      .its('request.body')
      .should('deep.equal', {
        severity: 'WATCH',
        title: 'Terminal luggage hall capacity watch',
        ownerName: 'Angela Brooks',
        status: 'RESOLVED',
        resolutionNotes: 'Luggage hall released and terminal queue is flowing.'
      })

    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround escalation updated successfully')
    cy.getByTestId(rs.operationalEscalationList).first()
      .should('contain.text', 'RESOLVED')
      .and('contain.text', 'Luggage hall released and terminal queue is flowing.')
  })


  it('lets operational leads approve database-backed department readiness signoffs', () => {
    selectOperationalDemoUserByVisibleRole('Engineering Lead')

    cy.getByTestId(rs.operationalSignoffSummary).first().should('contain.text', 'engineering-lead')
    cy.getByTestId(rs.operationalSignoffForm).first().within(() => {
      cy.get('select[aria-label="Miami same-day turnaround readiness readiness signoff status"]').select('APPROVED')
      cy.get('input[aria-label="Miami same-day turnaround readiness readiness approver"]').clear().type('David Torres')
      cy.get('input[aria-label="Miami same-day turnaround readiness readiness notes"]').clear().type('Engineering systems cleared for embarkation.')
      cy.contains('button', 'Save readiness signoff').click()
    })

    cy.wait('@reactUpdateTurnaroundSignoff')
      .its('request.body')
      .should('deep.equal', {
        approverName: 'David Torres',
        status: 'APPROVED',
        notes: 'Engineering systems cleared for embarkation.'
      })

    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround readiness signoff updated successfully')
    cy.getByTestId(rs.operationalSignoffSummary).first()
      .should('contain.text', 'APPROVED')
      .and('contain.text', 'David Torres')
  })

})
