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
    // This contract belongs to the running product surface, not a Markdown handoff file.
    // Long lifecycle coverage stays anchored in Cypress by proving the live admin,
    // operations, fleet, and quality workspaces are all available from the app.
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.adminMutationPanel).should('be.visible')
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.sqaConsole).should('be.visible')
  })


  it('starts the admin-created turnaround setup contract with scoped personnel assignment', () => {
    cy.getByTestId(rs.turnaroundAdminSetup).should('be.visible')
    cy.wait('@reactTurnaroundAdminSetup')

    const personName = `Cypress Setup Lead ${Date.now()}`
    cy.getByTestId(rs.turnaroundAdminPersonForm).within(() => {
      cy.getByTestId(rs.turnaroundAdminPersonNameInput).type(personName)
      cy.getByTestId(rs.turnaroundAdminPersonRoleSelect).select('housekeeping-lead')
      cy.getByTestId(rs.turnaroundAdminPersonCruiseLineSelect).select('Royal Caribbean International')
      cy.getByTestId(rs.turnaroundAdminPersonShipSelect).select('React Icon')
      cy.getByTestId(rs.turnaroundAdminPersonSailingSelect).select('2026-12-12 · Miami, Florida')
      cy.getByTestId(rs.turnaroundAdminPersonSubmitButton).click()
    })

    cy.wait('@reactCreateTurnaroundPerson')
    cy.getByTestId(rs.turnaroundAdminMessage).should('contain.text', 'Turnaround person created and assigned successfully')
    cy.getByTestId(rs.turnaroundAdminRoster).should('contain.text', personName)
    cy.getByTestId(rs.turnaroundAdminRoster).should('contain.text', 'React Icon')
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

    cy.getByTestId(rs.adminCreateBookingForm).should('not.exist')

    selectDemoUserByVisibleRole('Turnaround Manager')
    cy.wait('@reactTurnaroundOperations')
    cy.getByTestId(rs.turnaroundManagerDashboard).should('be.visible')
    cy.getByTestId(rs.operationsWorkspaceShell).should('be.visible')
    cy.getByTestId(rs.operationsReleaseBoard).should('be.visible')
    cy.getByTestId(rs.operationsCommandCenter).should('be.visible')
    cy.getByTestId(rs.operationsCommandCenterKpis).should('contain.text', 'Task execution').and('contain.text', 'Closeout readiness')
    cy.getByTestId(rs.operationsCommandCenterDecisions).should('contain.text', 'Command decision queue')
    cy.getByTestId(rs.operationsCommandCenterCriticalPath).should('contain.text', 'Command setup').and('contain.text', 'Management closeout')
    cy.getByTestId(rs.operationsCommandCenterDepartments).should('contain.text', 'Department command board')
    cy.getByTestId(rs.operationsShiftBriefing).should('be.visible')
    cy.getByTestId(rs.operationsShiftBriefingKpis).should('contain.text', 'Actions').and('contain.text', 'Next focus')
    cy.getByTestId(rs.operationsShiftBriefingCriticalItems).should('contain.text', 'Critical handoff items')
    cy.getByTestId(rs.operationsShiftBriefingChecklist).should('contain.text', 'Shift handoff checklist')
    cy.getByTestId(rs.operationsShiftBriefingDepartments).should('contain.text', 'Department briefing focus')
    cy.getByTestId(rs.operationsGoLiveCenter).should('be.visible')
    cy.getByTestId(rs.operationsGoLiveKpis).should('contain.text', 'Go gates').and('contain.text', 'No-go')
    cy.getByTestId(rs.operationsGoLiveGates).should('contain.text', 'Launch gates').and('contain.text', 'Workflow completeness')
    cy.getByTestId(rs.operationsGoLiveActions).should('contain.text', 'Remaining launch actions')
    cy.getByTestId(rs.operationsGoLiveEvidence).should('contain.text', 'Deployment proof checklist')
    cy.getByTestId(rs.operationsGoLiveScope).should('contain.text', 'Remaining scope before public launch')
    cy.getByTestId(rs.operationsPresentationGuide).should('not.exist')
    cy.getByTestId(rs.operationsLifecycleState).should('be.visible')
    cy.getByTestId(rs.operationsLifecyclePhases).should('contain.text', 'Setup').and('contain.text', 'Completed')
    cy.getByTestId(rs.operationsLifecycleNextAction).should('contain.text', 'Next best action')
    cy.getByTestId(rs.operationsLifecyclePhaseAction).should('have.length.greaterThan', 0)
    cy.getByTestId(rs.operationsLifecycleNextActionButton).should('be.visible')

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
    cy.getByTestId(rs.operationsLifecycleBlockers).should('contain.text', 'Task blocker')
    cy.getByTestId(rs.operationsLifecycleBlockerAction).first().click()
    cy.getByTestId(rs.operationsWorkspaceActiveSummary).should('be.visible')

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
