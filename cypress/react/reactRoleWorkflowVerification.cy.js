const { byTestId, reactSelectorKeys: rs } = require('./support/reactSelectors')
const {
  interceptReactCoreApis,
  selectDemoUserByVisibleRole,
  reactTurnaroundOperations
} = require('./support/reactTestHelpers')

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function buildFullOperationalWorkflowOperations() {
  const operations = clone(reactTurnaroundOperations)
  const miamiOperation = operations[0]
  const sanJuanOperation = operations[1]

  miamiOperation.taskSummary = {
    totalTasks: 7,
    completeTasks: 0,
    blockedTasks: 0,
    inProgressTasks: 0,
    completionPercent: 0
  }
  miamiOperation.signoffSummary = {
    totalSignoffs: 5,
    approvedSignoffs: 1,
    blockedSignoffs: 0,
    pendingSignoffs: 4,
    approvalPercent: 20
  }
  miamiOperation.signoffs = [
    ...miamiOperation.signoffs,
    { id: 'turnaround-signoff-guest-services', operationId: miamiOperation.id, departmentRole: 'guest-services-lead', approverName: '', status: 'PENDING', notes: 'Guest services readiness pending.', signedAt: null },
    { id: 'turnaround-signoff-food-beverage', operationId: miamiOperation.id, departmentRole: 'food-beverage-lead', approverName: '', status: 'PENDING', notes: 'Food and beverage readiness pending.', signedAt: null }
  ]
  miamiOperation.tasks = [
    ...miamiOperation.tasks,
    {
      id: 'turnaround-task-guest-services-1',
      departmentRole: 'guest_services_lead',
      taskName: 'Stage disembarkation communication and late-flight guest support',
      ownerName: 'Angela Brooks',
      dueTime: '08:15',
      location: 'Guest services desk',
      status: 'READY',
      sortOrder: 1,
      updates: []
    },
    {
      id: 'turnaround-task-food-beverage-1',
      departmentRole: 'food_beverage_lead',
      taskName: 'Confirm provisions and cold-chain delivery windows',
      ownerName: 'Michael Chen',
      dueTime: '09:00',
      location: 'Provisioning dock',
      status: 'READY',
      sortOrder: 1,
      updates: []
    },
    {
      id: 'turnaround-task-food-beverage-2',
      departmentRole: 'food_beverage_lead',
      taskName: 'Verify dining team handoff for embarkation lunch',
      ownerName: 'Michael Chen',
      dueTime: '10:30',
      location: 'Main galley',
      status: 'READY',
      sortOrder: 2,
      updates: []
    }
  ]

  sanJuanOperation.taskSummary = {
    totalTasks: 5,
    completeTasks: 0,
    blockedTasks: 0,
    inProgressTasks: 0,
    completionPercent: 0
  }
  sanJuanOperation.signoffSummary = {
    totalSignoffs: 5,
    approvedSignoffs: 0,
    blockedSignoffs: 0,
    pendingSignoffs: 5,
    approvalPercent: 0
  }
  sanJuanOperation.signoffs = [
    ...sanJuanOperation.signoffs,
    { id: 'turnaround-signoff-housekeeping-san-juan', operationId: sanJuanOperation.id, departmentRole: 'housekeeping-lead', approverName: '', status: 'PENDING', notes: 'Housekeeping readiness pending.', signedAt: null },
    { id: 'turnaround-signoff-guest-services-san-juan', operationId: sanJuanOperation.id, departmentRole: 'guest-services-lead', approverName: '', status: 'PENDING', notes: 'Guest services readiness pending.', signedAt: null },
    { id: 'turnaround-signoff-food-beverage-san-juan', operationId: sanJuanOperation.id, departmentRole: 'food-beverage-lead', approverName: '', status: 'PENDING', notes: 'Food and beverage readiness pending.', signedAt: null }
  ]
  sanJuanOperation.tasks = [
    ...sanJuanOperation.tasks,
    {
      id: 'turnaround-task-guest-services-2',
      departmentRole: 'guest_services_lead',
      taskName: 'Prepare check-in exception handling for repositioning guests',
      ownerName: 'Angela Brooks',
      dueTime: '09:15',
      location: 'Terminal check-in zone',
      status: 'READY',
      sortOrder: 1,
      updates: []
    },
    {
      id: 'turnaround-task-food-beverage-3',
      departmentRole: 'food_beverage_lead',
      taskName: 'Review dining preference volume for repositioning sailing',
      ownerName: 'Michael Chen',
      dueTime: '10:00',
      location: 'Dining operations office',
      status: 'READY',
      sortOrder: 1,
      updates: []
    }
  ]

  return operations
}

function bootWorkflowApp(overrides = {}) {
  interceptReactCoreApis({
    turnaroundOperations: buildFullOperationalWorkflowOperations(),
    ...overrides
  })
  cy.visit('/')
  cy.wait('@reactDemoUsers')
  cy.wait('@reactCustomers')
  cy.wait('@reactBookings')
  cy.wait('@reactCruiseLines')
}


function selectWorkflowDemoUserByVisibleRole(roleText) {
  selectDemoUserByVisibleRole(roleText)
  if (['Turnaround Manager', 'Housekeeping Lead', 'Guest Services Lead', 'Food & Beverage Lead', 'Engineering Lead'].includes(roleText)) {
    cy.wait('@reactTurnaroundOperations')
  }
}

function findOperationalTask(taskName) {
  return cy.contains(`${byTestId(rs.operationalRoleChecklist)} > li`, taskName)
}

function completeVisibleOperationalTask(taskName, expectedAuthor) {
  findOperationalTask(taskName).within(() => {
    cy.getByTestId(rs.operationalTaskDetails).should('be.visible')
    cy.get('input[aria-label$="shift update"]').clear().type(`${expectedAuthor} verified ${taskName}.`)
    cy.contains('button', 'Add shift update').click()
  })

  cy.wait('@reactCreateTurnaroundTaskUpdate')
    .its('request.body')
    .should(body => {
      expect(body.authorName).to.equal(expectedAuthor)
      expect(body.message).to.contain(taskName)
    })

  findOperationalTask(taskName).should('contain.text', `${expectedAuthor} verified ${taskName}.`)

  findOperationalTask(taskName).within(() => {
    cy.contains('button', 'Start').click()
  })
  cy.wait('@reactUpdateTurnaroundTaskStatus')
    .its('request.body.status')
    .should('equal', 'IN_PROGRESS')
  findOperationalTask(taskName).should('contain.text', 'IN_PROGRESS')

  findOperationalTask(taskName).within(() => {
    cy.contains('button', 'Complete').click()
  })
  cy.wait('@reactUpdateTurnaroundTaskStatus')
    .its('request.body.status')
    .should('equal', 'COMPLETE')
  findOperationalTask(taskName).should('contain.text', 'COMPLETE')
}

function approveVisibleSignoff({ operationTitle, approverName, notes }) {
  cy.contains(byTestId(rs.operationalReadinessCard), operationTitle)
    .within(() => {
      cy.getByTestId(rs.operationalSignoffForm).within(() => {
        cy.get('select[aria-label$="readiness signoff status"]').select('APPROVED')
        cy.get('input[aria-label$="readiness approver"]').clear().type(approverName)
        cy.get('input[aria-label$="readiness notes"]').clear().type(notes)
        cy.contains('button', 'Save readiness signoff').click()
      })
    })

  cy.wait('@reactUpdateTurnaroundSignoff')
    .its('request.body')
    .should('deep.equal', {
      approverName,
      status: 'APPROVED',
      notes
    })

  cy.contains(byTestId(rs.operationalReadinessCard), operationTitle)
    .should('contain.text', 'APPROVED')
    .and('contain.text', approverName)
    .within(() => {
      cy.get('input[aria-label$="readiness notes"]').should('have.value', notes)
    })
}

describe('React role workflow UI verification', () => {
  beforeEach(() => {
    bootWorkflowApp()
  })

  it('verifies the admin route exposes management workflows and not role-only dashboards', () => {
    selectWorkflowDemoUserByVisibleRole('Admin')

    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'React Admin').and('contain.text', 'Admin')
    cy.getByTestId(rs.adminHierarchy).should('be.visible')
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.sqaConsole).should('be.visible')
    cy.getByTestId(rs.passengerDashboard).should('not.exist')
    cy.getByTestId(rs.operationalTurnaroundPanel).should('not.exist')

    cy.getByTestId(rs.toggleCustomerWorkflows).click()
    cy.getByTestId(rs.customerWorkflowTable).should('be.visible')
    cy.getByTestId(rs.customerWorkflowTable)
      .should('contain.text', 'jay.react@example.com')
      .and('contain.text', 'RG-100')

    cy.getByTestId(rs.expandVisibleCustomers).click()
    cy.getByTestId(rs.customerBookingsRow)
      .should('contain.text', 'react-booking-1')
      .and('contain.text', 'P101')
  })

  it('verifies the passenger route can complete profile and itinerary workflows through visible UI data', () => {
    selectWorkflowDemoUserByVisibleRole('Passenger')

    cy.getByTestId(rs.passengerDashboard).should('be.visible')
    cy.getByTestId(rs.passengerSelfServicePanel).should('be.visible')
    cy.getByTestId(rs.passengerProfileFirstName).should('have.value', 'Jay')
    cy.getByTestId(rs.passengerProfileLastName).should('have.value', 'Gallagher')
    cy.getByTestId(rs.passengerProfileEmail).should('have.value', 'jay.react@example.com')

    cy.getByTestId(rs.roleBookingCard).first().within(() => {
      cy.contains('Royal Caribbean International').should('be.visible')
      cy.contains('React Icon').should('be.visible')
      cy.contains('Jay Gallagher').should('be.visible')
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
    })

    cy.getByTestId(rs.roleBookingDetails).should('be.visible')
    cy.getByTestId(rs.roleDetailPassengerRow).should('contain.text', 'Alisa Gallagher')
    cy.getByTestId(rs.roleItineraryDay).should('contain.text', 'Embarkation Day')
    cy.contains(byTestId(rs.roleItineraryActivity), 'Terminal arrival')
      .find(byTestId(rs.roleFavoriteItineraryToggle))
      .check()
    cy.getByTestId(rs.roleFavoritesOnlyToggle).check()
    cy.getByTestId(rs.roleItineraryActivity).should('have.length', 1)
    cy.getByTestId(rs.roleItineraryActivity).should('contain.text', 'Terminal arrival')
  })

  it('verifies the group leader route only exposes group-visible booking and manifest data through the UI', () => {
    selectWorkflowDemoUserByVisibleRole('Group Leader')

    cy.getByTestId(rs.groupLeaderDashboard).should('be.visible')
    cy.getByTestId(rs.passengerDashboard).should('contain.text', 'Group leader dashboard loaded')
    cy.getByTestId(rs.roleBookingCard).should('have.length', 1)
    cy.getByTestId(rs.roleBookingCard).last().within(() => {
      cy.contains('Celebrity Cruises').should('be.visible')
      cy.contains('Morgan Leader').should('be.visible')
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
    })

    cy.getByTestId(rs.roleBookingDetails).last().within(() => {
      cy.getByTestId(rs.roleDetailPassengerRow).should('contain.text', 'Morgan Leader')
      cy.contains('Cruise itinerary').should('be.visible')
      cy.contains('Perfect Day').should('be.visible')
    })

    cy.getByTestId(rs.adminHierarchy).should('not.exist')
    cy.getByTestId(rs.operationalTurnaroundPanel).should('not.exist')
  })

  it('verifies the turnaround manager can drive the command workflow and see every result in the UI', () => {
    selectWorkflowDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId(rs.turnaroundManagerDashboard).should('be.visible')
    cy.getByTestId(rs.operationalReadinessCard).should('have.length', 2)
    cy.getByTestId(rs.operationalReadinessPassengers).should('contain.text', '4')
    cy.contains('Miami same-day turnaround readiness').should('be.visible')
    cy.contains('React Icon').should('be.visible')
    cy.contains('Miami, Florida').should('be.visible')

    completeVisibleOperationalTask('Sequence disembarkation, provisioning, cleaning, and embarkation', 'Alex Turner')
    approveVisibleSignoff({
      operationTitle: 'Miami same-day turnaround readiness',
      approverName: 'Alex Turner',
      notes: 'Turnaround command accepts same-day readiness.'
    })
  })

  it('verifies the housekeeping lead can update cabin-readiness workflow data through the UI', () => {
    selectWorkflowDemoUserByVisibleRole('Housekeeping Lead')

    cy.getByTestId(rs.housekeepingLeadDashboard).should('be.visible')
    cy.contains('Housekeeping operations').should('be.visible')
    cy.contains('Prioritize cabin strip and reset windows').should('be.visible')
    cy.contains('Confirm inspection checkpoints before guest boarding').should('be.visible')
    cy.getByTestId(rs.operationalRoleChecklist).should('not.contain.text', 'Coordinate department readiness standups')

    completeVisibleOperationalTask('Prioritize cabin strip and reset windows', 'Maria Rodriguez')
    approveVisibleSignoff({
      operationTitle: 'Miami same-day turnaround readiness',
      approverName: 'Maria Rodriguez',
      notes: 'Cabin readiness accepted after deck inspections.'
    })
  })

  it('verifies the guest services lead can update embarkation-support workflow data through the UI', () => {
    selectWorkflowDemoUserByVisibleRole('Guest Services Lead')

    cy.getByTestId(rs.guestServicesLeadDashboard).should('be.visible')
    cy.contains('Guest services operations').should('be.visible')
    cy.contains('Stage disembarkation communication and late-flight guest support').should('be.visible')
    cy.contains('Prepare check-in exception handling for repositioning guests').should('be.visible')
    cy.contains('Confirm provisions and cold-chain delivery windows').should('not.exist')

    completeVisibleOperationalTask('Stage disembarkation communication and late-flight guest support', 'Angela Brooks')
    approveVisibleSignoff({
      operationTitle: 'Miami same-day turnaround readiness',
      approverName: 'Angela Brooks',
      notes: 'Guest communications and exception desk are ready.'
    })
  })

  it('verifies the food and beverage lead can update provisioning workflow data through the UI', () => {
    selectWorkflowDemoUserByVisibleRole('Food & Beverage Lead')

    cy.getByTestId(rs.foodBeverageLeadDashboard).should('be.visible')
    cy.contains('Food & beverage operations').should('be.visible')
    cy.contains('Confirm provisions and cold-chain delivery windows').should('be.visible')
    cy.contains('Verify dining team handoff for embarkation lunch').should('be.visible')
    cy.contains('Stage disembarkation communication').should('not.exist')

    completeVisibleOperationalTask('Confirm provisions and cold-chain delivery windows', 'Michael Chen')
    approveVisibleSignoff({
      operationTitle: 'Miami same-day turnaround readiness',
      approverName: 'Michael Chen',
      notes: 'Provisioning and galley reset are ready.'
    })
  })

  it('verifies the engineering lead can block, explain, complete, and sign off technical workflow data through the UI', () => {
    selectWorkflowDemoUserByVisibleRole('Engineering Lead')

    cy.getByTestId(rs.engineeringLeadDashboard).should('be.visible')
    cy.contains('Engineering operations').should('be.visible')
    cy.contains('Confirm shore power, fuel, potable water, and waste windows').should('be.visible')
    cy.contains('Confirm technical clearance checks before embarkation').should('be.visible')

    findOperationalTask('Confirm shore power, fuel, potable water, and waste windows').within(() => {
      cy.get('input[aria-label="Confirm shore power, fuel, potable water, and waste windows blocker reason"]').clear().type('Awaiting shore power handoff from pier team')
      cy.contains('button', 'Block').click()
    })

    cy.wait('@reactUpdateTurnaroundTaskStatus')
      .its('request.body')
      .should('deep.equal', {
        status: 'BLOCKED',
        blockerReason: 'Awaiting shore power handoff from pier team'
      })

    findOperationalTask('Confirm shore power, fuel, potable water, and waste windows')
      .should('contain.text', 'BLOCKED')
      .and('contain.text', 'Awaiting shore power handoff from pier team')
    cy.getByTestId(rs.operationalProgressSummary).first().should('contain.text', '1 blocked')

    findOperationalTask('Confirm shore power, fuel, potable water, and waste windows').within(() => {
      cy.contains('button', 'Complete').click()
    })
    cy.wait('@reactUpdateTurnaroundTaskStatus')
      .its('request.body.status')
      .should('equal', 'COMPLETE')
    findOperationalTask('Confirm shore power, fuel, potable water, and waste windows').should('contain.text', 'COMPLETE')

    approveVisibleSignoff({
      operationTitle: 'Miami same-day turnaround readiness',
      approverName: 'David Torres',
      notes: 'Technical systems cleared after shore power handoff.'
    })
  })
})
