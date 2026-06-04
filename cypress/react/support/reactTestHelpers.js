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
  }
]

Cypress.Commands.add('getByTestId', testId => cy.get(`[data-testid="${testId}"]`))

function selectDemoUserByVisibleRole(roleText) {
  cy.getByTestId('react-demo-user-select')
    .find('option')
    .contains(roleText)
    .invoke('val')
    .then(value => {
      cy.getByTestId('react-demo-user-select').select(value)
    })
}

function interceptReactCoreApis(overrides = {}) {
  cy.intercept('GET', '/cruise/demo-users', overrides.demoUsers || reactDemoUsers).as('reactDemoUsers')
  cy.intercept('GET', '/cruise/customers', overrides.customers || reactCustomers).as('reactCustomers')
  cy.intercept('GET', '/cruise/bookings', overrides.bookings || reactBookings).as('reactBookings')
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
  reactDemoUsers,
  selectDemoUserByVisibleRole,
  interceptReactCoreApis,
  visitReactAppAsAdmin,
  openFirstReactFleetShips,
  openFirstReactShipSailings,
  openFirstReactSailingItinerary
}
