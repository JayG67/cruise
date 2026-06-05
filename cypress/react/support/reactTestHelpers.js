const reactCruiseLines = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Celebrity Cruises',
    country: 'United States',
    website: 'https://www.celebritycruises.com'
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Princess Cruises',
    country: 'United States',
    website: ''
  }
]

const reactShips = [
  {
    id: 'ship-react-icon',
    cruiseLineId: reactCruiseLines[0].id,
    name: 'React Icon',
    currentPort: 'Miami, Florida'
  },
  {
    id: 'ship-react-utopia',
    cruiseLineId: reactCruiseLines[0].id,
    name: 'React Utopia',
    currentPort: 'Port Canaveral, Florida'
  }
]

const reactSailings = [
  {
    id: 'sailing-react-1',
    shipId: 'ship-react-icon',
    departureDate: '2026-12-12',
    departurePort: 'Miami, Florida',
    arrivalPort: 'Nassau, Bahamas',
    days: 4,
    isRepositioning: false
  },
  {
    id: 'sailing-react-2',
    shipId: 'ship-react-icon',
    departureDate: '2027-01-18',
    departurePort: 'San Juan, Puerto Rico',
    arrivalPort: 'Miami, Florida',
    days: 7,
    isRepositioning: true
  }
]

const reactItinerary = [
  {
    id: 'itinerary-react-day-1',
    sailingId: 'sailing-react-1',
    day: 1,
    title: 'Embarkation Day',
    port: 'Miami, Florida',
    activities: [
      { id: 'activity-react-1', time: '11:00 AM', activity: 'Terminal arrival' },
      { id: 'activity-react-2', time: '07:00 PM', activity: 'Welcome dinner' }
    ],
    activitySchedule: [
      { id: 'activity-react-1', time: '11:00 AM', activity: 'Terminal arrival' },
      { id: 'activity-react-2', time: '07:00 PM', activity: 'Welcome dinner' }
    ]
  },
  {
    id: 'itinerary-react-day-2',
    sailingId: 'sailing-react-1',
    day: 2,
    title: 'Perfect Day',
    port: 'CocoCay',
    activities: [
      { id: 'activity-react-3', time: '09:00 AM', activity: 'Beach club arrival' }
    ],
    activitySchedule: [
      { id: 'activity-react-3', time: '09:00 AM', activity: 'Beach club arrival' }
    ]
  }
]

const reactCustomers = [
  {
    id: 'react-customer-1',
    firstName: 'Jay',
    lastName: 'Gallagher',
    email: 'jay.react@example.com',
    phone: '555-0101',
    loyaltyNumber: 'RG-100'
  },
  {
    id: 'react-customer-2',
    firstName: 'Alisa',
    lastName: 'Gallagher',
    email: 'alisa.react@example.com',
    phone: '555-0102',
    loyaltyNumber: 'RG-200'
  },
  {
    id: 'react-customer-3',
    firstName: 'Morgan',
    lastName: 'Leader',
    email: 'morgan.leader@example.com',
    phone: '555-0103',
    loyaltyNumber: 'GL-300'
  }
]

const reactBookings = [
  {
    id: 'react-booking-1',
    bookingStatus: 'CONFIRMED',
    cabinNumber: 'P101',
    fareCode: 'BALCONY',
    embarkationPort: 'Miami, Florida',
    debarkationPort: 'Nassau, Bahamas',
    createdByCustomerId: 'react-customer-1',
    cruiseLine: { name: 'Royal Caribbean International' },
    ship: { name: 'React Icon' },
    sailing: {
      departureDate: '2026-12-12',
      itinerary: reactItinerary
    },
    passengers: [
      {
        customerId: 'react-customer-1',
        passengerType: 'Primary',
        diningPreference: 'Anytime dining',
        accessibilityNotes: '',
        customer: reactCustomers[0]
      },
      {
        customerId: 'react-customer-2',
        passengerType: 'Guest',
        diningPreference: 'Early seating',
        accessibilityNotes: 'Uses elevators',
        customer: reactCustomers[1]
      }
    ]
  },
  {
    id: 'react-booking-2',
    bookingStatus: 'PENDING',
    cabinNumber: 'G202',
    fareCode: 'GROUP',
    embarkationPort: 'San Juan, Puerto Rico',
    debarkationPort: 'Miami, Florida',
    createdByCustomerId: 'react-customer-3',
    cruiseLine: { name: 'Celebrity Cruises' },
    ship: { name: 'React Beyond' },
    sailing: {
      departureDate: '2027-01-18',
      itinerary: [reactItinerary[1]]
    },
    passengers: [
      {
        customerId: 'react-customer-3',
        passengerType: 'Group Leader',
        diningPreference: 'Late seating',
        accessibilityNotes: '',
        customer: reactCustomers[2]
      },
      {
        customerId: 'react-customer-1',
        passengerType: 'Guest',
        diningPreference: 'Anytime dining',
        accessibilityNotes: '',
        customer: reactCustomers[0]
      }
    ]
  }
]

const reactTurnaroundOperations = [
  {
    id: 'turnaround-react-1',
    title: 'Miami same-day turnaround readiness',
    turnaroundDate: '2026-12-12',
    port: 'Miami, Florida',
    status: 'PLANNED',
    readinessLevel: 'High coordination',
    notes: 'Coordinate disembarkation, cabin reset, provisioning, and embarkation for the next Miami sailing.',
    passengerCount: 2,
    taskSummary: { totalTasks: 4, completeTasks: 0, blockedTasks: 0, inProgressTasks: 0, completionPercent: 0 },
    signoffSummary: { totalSignoffs: 3, approvedSignoffs: 1, blockedSignoffs: 0, pendingSignoffs: 2, approvalPercent: 33 },
    signoffs: [
      { id: 'turnaround-signoff-1', operationId: 'turnaround-react-1', departmentRole: 'turnaround-manager', approverName: 'Alex Turner', status: 'APPROVED', notes: 'Command readiness accepted.', signedAt: '2026-12-12T07:25:00.000Z' },
      { id: 'turnaround-signoff-2', operationId: 'turnaround-react-1', departmentRole: 'housekeeping-lead', approverName: '', status: 'PENDING', notes: 'Cabin readiness pending.', signedAt: null },
      { id: 'turnaround-signoff-3', operationId: 'turnaround-react-1', departmentRole: 'engineering-lead', approverName: '', status: 'PENDING', notes: 'Engineering readiness pending.', signedAt: null }
    ],
    ship: { name: 'React Icon' },
    sailing: {
      departureDate: '2026-12-12',
      departurePort: 'Miami, Florida',
      arrivalPort: 'Nassau, Bahamas'
    },
    cruiseLine: { name: 'Royal Caribbean International' },
    tasks: [
      { id: 'turnaround-task-1', departmentRole: 'turnaround_manager', taskName: 'Coordinate department readiness standups', ownerName: 'Alex Turner', dueTime: '07:30', location: 'Port operations center', status: 'READY', sortOrder: 1, updates: [{ id: 'turnaround-update-1', authorName: 'Alex Turner', updateType: 'NOTE', message: 'Readiness huddle completed from the database update log.', createdAt: '2026-12-12T07:15:00.000Z' }] },
      { id: 'turnaround-task-2', departmentRole: 'turnaround_manager', taskName: 'Sequence disembarkation, provisioning, cleaning, and embarkation', ownerName: 'Alex Turner', dueTime: '08:00', location: 'Port operations center', status: 'READY', sortOrder: 2, updates: [] },
      { id: 'turnaround-task-3', departmentRole: 'housekeeping_lead', taskName: 'Prioritize cabin strip and reset windows', ownerName: 'Maria Rodriguez', dueTime: '10:45', location: 'Guest decks', status: 'READY', sortOrder: 1 },
      { id: 'turnaround-task-4', departmentRole: 'engineering_lead', taskName: 'Confirm shore power, fuel, potable water, and waste windows', ownerName: 'David Torres', dueTime: '08:00', location: 'Engine control room', status: 'READY', sortOrder: 1 }
    ]
  },
  {
    id: 'turnaround-react-2',
    title: 'San Juan repositioning turnaround readiness',
    turnaroundDate: '2027-01-18',
    port: 'San Juan, Puerto Rico',
    status: 'PLANNED',
    readinessLevel: 'Standard coordination',
    notes: 'Monitor passenger volume and stateroom readiness for the next sailing.',
    passengerCount: 2,
    taskSummary: { totalTasks: 3, completeTasks: 0, blockedTasks: 0, inProgressTasks: 0, completionPercent: 0 },
    signoffSummary: { totalSignoffs: 2, approvedSignoffs: 0, blockedSignoffs: 0, pendingSignoffs: 2, approvalPercent: 0 },
    signoffs: [
      { id: 'turnaround-signoff-4', operationId: 'turnaround-react-2', departmentRole: 'turnaround-manager', approverName: '', status: 'PENDING', notes: 'Command readiness pending.', signedAt: null },
      { id: 'turnaround-signoff-5', operationId: 'turnaround-react-2', departmentRole: 'engineering-lead', approverName: '', status: 'PENDING', notes: 'Engineering readiness pending.', signedAt: null }
    ],
    ship: { name: 'React Beyond' },
    sailing: {
      departureDate: '2027-01-18',
      departurePort: 'San Juan, Puerto Rico',
      arrivalPort: 'Miami, Florida'
    },
    cruiseLine: { name: 'Celebrity Cruises' },
    tasks: [
      { id: 'turnaround-task-5', departmentRole: 'turnaround_manager', taskName: 'Confirm arrival and next departure ports', ownerName: 'Alex Turner', dueTime: '07:30', location: 'Port operations center', status: 'READY', sortOrder: 1 },
      { id: 'turnaround-task-6', departmentRole: 'housekeeping_lead', taskName: 'Confirm inspection checkpoints before guest boarding', ownerName: 'Maria Rodriguez', dueTime: '10:45', location: 'Guest decks', status: 'READY', sortOrder: 1 },
      { id: 'turnaround-task-7', departmentRole: 'engineering_lead', taskName: 'Confirm technical clearance checks before embarkation', ownerName: 'David Torres', dueTime: '08:00', location: 'Engine control room', status: 'READY', sortOrder: 1 }
    ]
  }
]

const reactDemoUsers = [
  {
    id: 'react-admin-user',
    displayName: 'React Admin',
    role: 'Admin',
    email: 'admin.react@example.com'
  },
  {
    id: 'react-passenger-user',
    displayName: 'React Passenger',
    role: 'Passenger',
    customerId: 'react-customer-1',
    email: 'jay.react@example.com'
  },
  {
    id: 'react-group-leader-user',
    displayName: 'React Group Leader',
    role: 'Group Leader',
    customerId: 'react-customer-3',
    email: 'morgan.leader@example.com'
  },
  {
    id: 'ops-turnaround',
    displayName: 'Alex Turner',
    role: 'turnaround_manager',
    email: 'alex.turner@example.com'
  },
  {
    id: 'ops-housekeeping',
    displayName: 'Maria Rodriguez',
    role: 'housekeeping_lead',
    email: 'maria.rodriguez@example.com'
  },
  {
    id: 'ops-guest-services',
    displayName: 'Angela Brooks',
    role: 'guest_services_lead',
    email: 'angela.brooks@example.com'
  },
  {
    id: 'ops-food-beverage',
    displayName: 'Michael Chen',
    role: 'food_beverage_lead',
    email: 'michael.chen@example.com'
  },
  {
    id: 'ops-engineering',
    displayName: 'David Torres',
    role: 'engineering_lead',
    email: 'david.torres@example.com'
  }
]

Cypress.Commands.add('getByTestId', testId => cy.get(`[data-testid="${testId}"]`))

function selectDemoUserByVisibleRole(roleText) {
  cy.getByTestId('react-role-type-select')
    .find('option')
    .contains(roleText)
    .invoke('val')
    .then(roleValue => {
      cy.getByTestId('react-role-type-select').select(roleValue)
    })

  cy.getByTestId('react-demo-user-select')
    .find('option')
    .first()
    .invoke('val')
    .then(userValue => {
      cy.getByTestId('react-demo-user-select').select(userValue)
    })
}

function interceptReactCoreApis(overrides = {}) {
  cy.intercept('GET', '/cruise/demo-users', overrides.demoUsers || reactDemoUsers).as('reactDemoUsers')
  cy.intercept('GET', '/cruise/customers', overrides.customers || reactCustomers).as('reactCustomers')
  cy.intercept('GET', '/cruise/bookings', overrides.bookings || reactBookings).as('reactBookings')
  cy.intercept('GET', '/cruise/turnaround-operations', overrides.turnaroundOperations || reactTurnaroundOperations).as('reactTurnaroundOperations')
  cy.intercept('PATCH', '/cruise/turnaround-operations/*/signoffs/*', req => {
    const [, routeRemainder] = req.url.split('/turnaround-operations/')
    const [operationId, signoffPath] = routeRemainder.split('/signoffs/')
    const departmentRole = decodeURIComponent(signoffPath)
    const updatedOperations = (overrides.turnaroundOperations || reactTurnaroundOperations).map(operation => {
      if (operation.id !== operationId) return operation

      const existingSignoffs = operation.signoffs || []
      const hasExistingSignoff = existingSignoffs.some(signoff => signoff.departmentRole === departmentRole)
      const updatedSignoff = {
        id: hasExistingSignoff ? existingSignoffs.find(signoff => signoff.departmentRole === departmentRole).id : 'turnaround-signoff-created',
        operationId,
        departmentRole,
        approverName: req.body?.approverName || 'Operational lead',
        status: req.body?.status || 'PENDING',
        notes: req.body?.notes || '',
        signedAt: req.body?.status === 'PENDING' ? null : '2026-12-12T10:30:00.000Z'
      }
      const signoffs = hasExistingSignoff
        ? existingSignoffs.map(signoff => signoff.departmentRole === departmentRole ? updatedSignoff : signoff)
        : [...existingSignoffs, updatedSignoff]
      const approvedSignoffs = signoffs.filter(signoff => signoff.status === 'APPROVED').length
      const blockedSignoffs = signoffs.filter(signoff => signoff.status === 'BLOCKED').length
      const pendingSignoffs = signoffs.filter(signoff => signoff.status === 'PENDING').length

      return {
        ...operation,
        signoffs,
        signoffSummary: {
          totalSignoffs: signoffs.length,
          approvedSignoffs,
          blockedSignoffs,
          pendingSignoffs,
          approvalPercent: signoffs.length === 0 ? 0 : Math.round((approvedSignoffs / signoffs.length) * 100)
        }
      }
    })
    const operation = updatedOperations.find(candidate => candidate.id === operationId)

    req.reply({ statusCode: 200, body: { message: 'Turnaround readiness signoff updated successfully', operation } })
  }).as('reactUpdateTurnaroundSignoff')
  cy.intercept('PATCH', '/cruise/turnaround-tasks/*/status', req => {
    const taskId = req.url.split('/turnaround-tasks/')[1].split('/status')[0]
    const requestedStatus = req.body?.status || 'IN_PROGRESS'
    const updatedOperations = (overrides.turnaroundOperations || reactTurnaroundOperations).map(operation => {
      const tasks = operation.tasks.map(task => task.id === taskId ? { ...task, status: requestedStatus, blockerReason: req.body?.blockerReason || (requestedStatus === 'BLOCKED' ? 'Awaiting pier-side supervisor confirmation' : '') } : task)
      const completeTasks = tasks.filter(task => task.status === 'COMPLETE').length
      const blockedTasks = tasks.filter(task => task.status === 'BLOCKED').length
      const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length
      const taskSummary = {
        totalTasks: tasks.length,
        completeTasks,
        blockedTasks,
        inProgressTasks,
        completionPercent: tasks.length === 0 ? 0 : Math.round((completeTasks / tasks.length) * 100)
      }

      return { ...operation, tasks, taskSummary, status: blockedTasks > 0 ? 'BLOCKED' : inProgressTasks > 0 ? 'IN_PROGRESS' : operation.status }
    })
    const operation = updatedOperations.find(candidate => candidate.tasks.some(task => task.id === taskId))

    req.reply({ statusCode: 200, body: { message: 'Turnaround task status updated successfully', operation } })
  }).as('reactUpdateTurnaroundTaskStatus')
  cy.intercept('PATCH', '/cruise/turnaround-tasks/*/details', req => {
    const taskId = req.url.split('/turnaround-tasks/')[1].split('/details')[0]
    const updatedOperations = (overrides.turnaroundOperations || reactTurnaroundOperations).map(operation => {
      const tasks = operation.tasks.map(task => task.id === taskId ? { ...task, ...req.body } : task)

      return { ...operation, tasks }
    })
    const operation = updatedOperations.find(candidate => candidate.tasks.some(task => task.id === taskId))

    req.reply({ statusCode: 200, body: { message: 'Turnaround task details updated successfully', operation } })
  }).as('reactUpdateTurnaroundTaskDetails')
  cy.intercept('POST', '/cruise/turnaround-tasks/*/updates', req => {
    const taskId = req.url.split('/turnaround-tasks/')[1].split('/updates')[0]
    const update = {
      id: 'turnaround-update-created',
      authorName: req.body?.authorName || 'Operational lead',
      updateType: req.body?.updateType || 'NOTE',
      message: req.body?.message || 'Update added',
      createdAt: '2026-12-12T09:30:00.000Z'
    }
    const updatedOperations = (overrides.turnaroundOperations || reactTurnaroundOperations).map(operation => {
      const tasks = operation.tasks.map(task => task.id === taskId ? { ...task, updates: [update, ...(task.updates || [])] } : task)

      return { ...operation, tasks }
    })
    const operation = updatedOperations.find(candidate => candidate.tasks.some(task => task.id === taskId))

    req.reply({ statusCode: 201, body: { message: 'Turnaround task update added successfully', operation } })
  }).as('reactCreateTurnaroundTaskUpdate')
  cy.intercept('GET', '/cruise', overrides.cruiseLines || reactCruiseLines).as('reactCruiseLines')
}


function visitReactAppAsAdmin(overrides = {}) {
  interceptReactCoreApis(overrides)
  cy.visit('/')
  cy.wait('@reactDemoUsers')
  cy.wait('@reactCustomers')
  cy.wait('@reactBookings')
  cy.wait('@reactCruiseLines')
  cy.getByTestId('react-demo-user-select').should('be.visible')
  selectDemoUserByVisibleRole('Admin')
  cy.getByTestId('react-demo-user-summary').should('contain.text', 'Admin')
}

function openFirstReactFleetShips(ships = reactShips) {
  cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, ships).as('reactShips')
  cy.getByTestId('react-fleet-card').first().within(() => {
    cy.getByTestId('react-view-ships-button').click()
  })
  cy.wait('@reactShips')
  cy.getByTestId('react-selected-ships-panel').should('be.visible')
  cy.getByTestId('react-ship-card').should('have.length', ships.length)
}

function openFirstReactShipSailings(sailings = reactSailings) {
  cy.intercept('GET', `/cruise/ship/${reactShips[0].id}/sailings`, sailings).as('reactSailings')
  cy.getByTestId('react-ship-card').first().within(() => {
    cy.getByTestId('react-view-sailings-button').click()
  })
  cy.wait('@reactSailings')
  cy.getByTestId('react-sailings-panel').should('be.visible')
  cy.getByTestId('react-sailing-card').should('have.length', sailings.length)
}

function openFirstReactSailingItinerary(itinerary = reactItinerary) {
  cy.intercept('GET', `/cruise/sailings/${reactSailings[0].id}/itinerary`, itinerary).as('reactItinerary')
  cy.getByTestId('react-sailing-card').first().within(() => {
    cy.getByTestId('react-view-itinerary-button').click()
  })
  cy.wait('@reactItinerary')
  cy.getByTestId('react-itinerary-panel').should('be.visible')
  cy.getByTestId('react-itinerary-day-card').should('have.length', itinerary.length)
}

module.exports = {
  reactCruiseLines,
  reactShips,
  reactSailings,
  reactItinerary,
  reactCustomers,
  reactBookings,
  reactTurnaroundOperations,
  reactDemoUsers,
  selectDemoUserByVisibleRole,
  interceptReactCoreApis,
  visitReactAppAsAdmin,
  openFirstReactFleetShips,
  openFirstReactShipSailings,
  openFirstReactSailingItinerary
}
