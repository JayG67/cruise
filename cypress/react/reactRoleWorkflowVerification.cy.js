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
  cy.wait('@reactTurnaroundOperations')
  cy.wait('@reactCruiseLines')
}

function findOperationalTask(taskName) {
  return cy.contains('[data-testid="react-operational-role-checklist"] > li', taskName)
}

function completeVisibleOperationalTask(taskName, expectedAuthor) {
  findOperationalTask(taskName).within(() => {
    cy.getByTestId('react-operational-task-details').should('be.visible')
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
  cy.contains('[data-testid="react-operational-readiness-card"]', operationTitle)
    .within(() => {
      cy.getByTestId('react-operational-signoff-form').within(() => {
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

  cy.contains('[data-testid="react-operational-readiness-card"]', operationTitle)
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
    selectDemoUserByVisibleRole('Admin')

    cy.getByTestId('react-demo-user-summary').should('contain.text', 'React Admin').and('contain.text', 'Admin')
    cy.getByTestId('react-admin-hierarchy').should('be.visible')
    cy.getByTestId('react-fleet-directory').should('be.visible')
    cy.getByTestId('react-sqa-console').should('be.visible')
    cy.getByTestId('react-passenger-dashboard').should('not.exist')
    cy.getByTestId('react-operational-turnaround-panel').should('not.exist')

    cy.getByTestId('react-toggle-customer-workflows').click()
    cy.getByTestId('react-customer-workflow-table').should('be.visible')
    cy.getByTestId('react-customer-workflow-table')
      .should('contain.text', 'jay.react@example.com')
      .and('contain.text', 'RG-100')

    cy.getByTestId('react-expand-visible-customers').click()
    cy.getByTestId('react-customer-bookings-row')
      .should('contain.text', 'react-booking-1')
      .and('contain.text', 'P101')
  })

  it('verifies the passenger route can complete profile and itinerary workflows through visible UI data', () => {
    selectDemoUserByVisibleRole('Passenger')

    cy.getByTestId('react-passenger-dashboard').should('be.visible')
    cy.getByTestId('react-passenger-self-service-panel').should('be.visible')
    cy.getByTestId('react-passenger-profile-first-name').should('have.value', 'Jay')
    cy.getByTestId('react-passenger-profile-last-name').should('have.value', 'Gallagher')
    cy.getByTestId('react-passenger-profile-email').should('have.value', 'jay.react@example.com')

    cy.getByTestId('react-role-booking-card').first().within(() => {
      cy.contains('Royal Caribbean International').should('be.visible')
      cy.contains('React Icon').should('be.visible')
      cy.contains('Jay Gallagher').should('be.visible')
      cy.getByTestId('react-role-booking-details-toggle').click()
    })

    cy.getByTestId('react-role-booking-details').should('be.visible')
    cy.getByTestId('react-role-detail-passenger-row').should('contain.text', 'Alisa Gallagher')
    cy.getByTestId('react-role-itinerary-day').should('contain.text', 'Embarkation Day')
    cy.contains('[data-testid="react-role-itinerary-activity"]', 'Terminal arrival')
      .find('[data-testid="react-role-favorite-itinerary-toggle"]')
      .check()
    cy.getByTestId('react-role-favorites-only-toggle').check()
    cy.getByTestId('react-role-itinerary-activity').should('have.length', 1)
    cy.getByTestId('react-role-itinerary-activity').should('contain.text', 'Terminal arrival')
  })

  it('verifies the group leader route only exposes group-visible booking and manifest data through the UI', () => {
    selectDemoUserByVisibleRole('Group Leader')

    cy.getByTestId('react-group-leader-dashboard').should('be.visible')
    cy.getByTestId('react-passenger-dashboard').should('contain.text', 'Group leader dashboard loaded')
    cy.getByTestId('react-role-booking-card').should('have.length', 1)
    cy.getByTestId('react-role-booking-card').last().within(() => {
      cy.contains('Celebrity Cruises').should('be.visible')
      cy.contains('Morgan Leader').should('be.visible')
      cy.getByTestId('react-role-booking-details-toggle').click()
    })

    cy.getByTestId('react-role-booking-details').last().within(() => {
      cy.getByTestId('react-role-detail-passenger-row').should('contain.text', 'Morgan Leader')
      cy.contains('Cruise itinerary').should('be.visible')
      cy.contains('Perfect Day').should('be.visible')
    })

    cy.getByTestId('react-admin-hierarchy').should('not.exist')
    cy.getByTestId('react-operational-turnaround-panel').should('not.exist')
  })

  it('verifies the turnaround manager can drive the command workflow and see every result in the UI', () => {
    selectDemoUserByVisibleRole('Turnaround Manager')

    cy.getByTestId('react-turnaround-manager-dashboard').should('be.visible')
    cy.getByTestId('react-operational-readiness-card').should('have.length', 2)
    cy.getByTestId('react-operational-readiness-passengers').should('contain.text', '4')
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
    selectDemoUserByVisibleRole('Housekeeping Lead')

    cy.getByTestId('react-housekeeping-lead-dashboard').should('be.visible')
    cy.contains('Housekeeping operations').should('be.visible')
    cy.contains('Prioritize cabin strip and reset windows').should('be.visible')
    cy.contains('Confirm inspection checkpoints before guest boarding').should('be.visible')
    cy.contains('Coordinate department readiness standups').should('not.exist')

    completeVisibleOperationalTask('Prioritize cabin strip and reset windows', 'Maria Rodriguez')
    approveVisibleSignoff({
      operationTitle: 'Miami same-day turnaround readiness',
      approverName: 'Maria Rodriguez',
      notes: 'Cabin readiness accepted after deck inspections.'
    })
  })

  it('verifies the guest services lead can update embarkation-support workflow data through the UI', () => {
    selectDemoUserByVisibleRole('Guest Services Lead')

    cy.getByTestId('react-guest-services-lead-dashboard').should('be.visible')
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
    selectDemoUserByVisibleRole('Food & Beverage Lead')

    cy.getByTestId('react-food-beverage-lead-dashboard').should('be.visible')
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
    selectDemoUserByVisibleRole('Engineering Lead')

    cy.getByTestId('react-engineering-lead-dashboard').should('be.visible')
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
    cy.getByTestId('react-operational-progress-summary').first().should('contain.text', '1 blocked')

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
