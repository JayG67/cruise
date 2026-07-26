const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { interceptReactCoreApis, selectDemoUserByVisibleRole } = require('./support/reactTestHelpers')

const cruiseLines = [
  {
    id: 'line-atlas',
    name: 'Atlas Voyages',
    brandFamily: 'Atlas Group',
    marketPositioning: 'Expedition, discovery, and destination-led cruising',
    ships: [
      {
        id: 'ship-atlas-one',
        name: 'Atlas One',
        sailings: [
          {
            id: 'atlas-sailing-1',
            departureDate: '2026-08-05',
            departurePort: 'Miami, Florida',
            arrivalPort: 'Nassau, Bahamas',
            destination: 'Nassau, Bahamas',
            days: 4,
            itinerary: [
              { day: 1, title: 'Embarkation', port: 'Miami, Florida', activitySchedule: [{ time: '12:00 PM', activity: 'Boarding' }] },
              { day: 2, title: 'Nassau', port: 'Nassau, Bahamas', activitySchedule: [{ time: '9:00 AM', activity: 'Port arrival' }] }
            ]
          },
          {
            id: 'atlas-sailing-2',
            departureDate: '2026-09-15',
            departurePort: 'Miami, Florida',
            arrivalPort: 'CocoCay, Bahamas',
            destination: 'CocoCay, Bahamas',
            days: 3,
            itinerary: [
              { day: 1, title: 'Embarkation', port: 'Miami, Florida', activitySchedule: [] },
              { day: 2, title: 'CocoCay', port: 'CocoCay, Bahamas', activitySchedule: [] },
              { day: 3, title: 'Return', port: 'Miami, Florida', activitySchedule: [] }
            ]
          }
        ]
      },
      {
        id: 'ship-atlas-two',
        name: 'Atlas Two',
        sailings: [
          {
            id: 'atlas-sailing-3',
            departureDate: '2027-01-20',
            departurePort: 'Tampa, Florida',
            arrivalPort: 'Cozumel, Mexico',
            destination: 'Cozumel, Mexico',
            days: 5,
            itinerary: [
              { day: 1, title: 'Tampa departure', port: 'Tampa, Florida', activitySchedule: [] },
              { day: 3, title: 'Cozumel', port: 'Cozumel, Mexico', activitySchedule: [] }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'line-borealis',
    name: 'Borealis Cruises',
    brandFamily: 'Borealis Holdings',
    marketPositioning: 'Premium coastal and cultural itineraries',
    ships: [
      {
        id: 'ship-borealis-star',
        name: 'Borealis Star',
        sailings: [
          {
            id: 'borealis-sailing-1',
            departureDate: '2026-11-10',
            departurePort: 'Seattle, Washington',
            arrivalPort: 'Vancouver, Canada',
            destination: 'Vancouver, Canada',
            days: 7,
            itinerary: [
              { day: 1, title: 'Seattle', port: 'Seattle, Washington', activitySchedule: [] },
              { day: 7, title: 'Vancouver', port: 'Vancouver, Canada', activitySchedule: [] }
            ]
          }
        ]
      }
    ]
  }
]

const customers = [
  { id: 'guest-a', firstName: 'Avery', lastName: 'Adams', email: 'avery@example.com' },
  { id: 'guest-b', firstName: 'Bailey', lastName: 'Brooks', email: 'bailey@example.com' },
  { id: 'guest-c', firstName: 'Casey', lastName: 'Cole', email: 'casey@example.com' }
]

const bookings = [
  {
    id: 'booking-atlas-1',
    cruiseLine: { name: 'Atlas Voyages' },
    ship: { name: 'Atlas One' },
    sailing: { departureDate: '2026-08-05' },
    passengers: [
      { customerId: 'guest-a', customer: customers[0], passengerType: 'Primary' },
      { customerId: 'guest-b', customer: customers[1], passengerType: 'Guest' }
    ]
  },
  {
    id: 'booking-atlas-2',
    cruiseLine: { name: 'Atlas Voyages' },
    ship: { name: 'Atlas Two' },
    sailing: { departureDate: '2027-01-20' },
    passengers: [{ customerId: 'guest-c', customer: customers[2], passengerType: 'Primary' }]
  },
  {
    id: 'booking-borealis-1',
    cruiseLine: { name: 'Borealis Cruises' },
    ship: { name: 'Borealis Star' },
    sailing: { departureDate: '2026-11-10' },
    passengers: [{ customerId: 'guest-b', customer: customers[1], passengerType: 'Primary' }]
  }
]

function visitOperatingWorkspace(overrides = {}) {
  interceptReactCoreApis({ cruiseLines, bookings, customers, ...overrides })
  cy.visit('/')
  cy.wait(['@reactDemoUsers', '@reactCustomers', '@reactBookings', '@reactCruiseLines'])
  selectDemoUserByVisibleRole('Admin')
  cy.getByTestId(rs.cruiseLinePresentationSuite).scrollIntoView().should('be.visible')
}

function optionLabels(selectorKey) {
  return cy.getByTestId(selectorKey).find('option').then($options => [...$options].map(option => option.textContent.trim()))
}

function metricValues() {
  return cy.getByTestId(rs.cruiseLinePresentationSuite)
    .find('[aria-label$=" operational metrics"] article')
    .then($metrics => [...$metrics].map(metric => {
      const label = metric.querySelector('span')?.textContent.trim() || ''
      const value = metric.querySelector('strong')?.textContent.trim() || ''
      return `${label} ${value}`.trim()
    }))
}

function operatingActionCard(title) {
  return cy.getByTestId(rs.presentationFlowCard).filter((_, card) => {
    return card.querySelector('strong')?.textContent.trim() === title
  })
}

describe('Cruise line operating workspace complete coverage', () => {
  it('renders the complete operating-scope contract with accessible native controls and guidance', () => {
    visitOperatingWorkspace()

    cy.getByTestId(rs.cruiseLinePresentationSuite)
      .should('have.attr', 'aria-labelledby', 'react-cruise-line-presentation-heading')
      .and('contain.text', 'Cruise line operations')
      .and('contain.text', 'Cruise line operating workspace')
      .and('contain.text', 'Select the operating scope, then drill into fleet, guest, sailing, or turnaround workflows.')

    cy.get('[aria-label="Cruise line operating scope"]').should('be.visible')
    cy.getByTestId(rs.presentationLinePicker).should('be.enabled').and('have.value', 'line-atlas')
    cy.getByTestId(rs.presentationShipPicker).should('be.enabled').and('have.value', 'Atlas One')
    cy.getByTestId(rs.presentationSailingPicker).should('be.enabled').and('have.value', 'atlas-sailing-1')
    cy.contains('small', 'Select the cruise line to operate within.').should('be.visible')
    cy.contains('small', 'Select the ship to focus on.').should('be.visible')
    cy.contains('small', 'Select the sailing to operate.').should('be.visible')
  })

  it('shows complete line, ship, and sailing choices from the selected operating scope', () => {
    visitOperatingWorkspace()

    optionLabels(rs.presentationLinePicker).should('deep.equal', ['Atlas Voyages', 'Borealis Cruises'])
    optionLabels(rs.presentationShipPicker).should('deep.equal', ['Atlas One', 'Atlas Two'])
    optionLabels(rs.presentationSailingPicker).should('deep.equal', [
      '2026-08-05 · Nassau, Bahamas',
      '2026-09-15 · CocoCay, Bahamas'
    ])
  })

  it('renders accurate brand narrative, metrics, and action summaries for the selected line', () => {
    visitOperatingWorkspace()

    cy.getByTestId(rs.cruiseLinePresentationSuite)
      .should('contain.text', 'Atlas Group')
      .and('contain.text', 'Atlas Voyages')
      .and('contain.text', 'Expedition, discovery, and destination-led cruising')

    metricValues().should('deep.equal', [
      'Ships 2',
      'Sailings 3',
      'Bookings 2',
      'Passengers 3',
      'Itinerary days 7',
      'Ports 5'
    ])

    cy.getByTestId(rs.presentationFlowCard).should('have.length', 4)
    operatingActionCard('Fleet').should('have.length', 1).and('contain.text', '2 ships and 3 sailings in scope.')
    operatingActionCard('Guests').should('have.length', 1).and('contain.text', '2 bookings and 3 visible passengers.')
    operatingActionCard('Sailing plan').should('have.length', 1).and('contain.text', 'Atlas One · 2026-08-05.')
    operatingActionCard('Turnaround').should('have.length', 1).and('contain.text', 'Move from voyage data to assigned operational execution.')
  })

  it('changes cruise line scope and resets ship and sailing to the new line defaults', () => {
    visitOperatingWorkspace()
    cy.getByTestId(rs.presentationShipPicker).select('Atlas Two')
    cy.getByTestId(rs.presentationSailingPicker).should('have.value', 'atlas-sailing-3')

    cy.getByTestId(rs.presentationLinePicker).select('line-borealis')

    cy.getByTestId(rs.presentationShipPicker).should('have.value', 'Borealis Star')
    cy.getByTestId(rs.presentationSailingPicker).should('have.value', 'borealis-sailing-1')
    optionLabels(rs.presentationShipPicker).should('deep.equal', ['Borealis Star'])
    optionLabels(rs.presentationSailingPicker).should('deep.equal', ['2026-11-10 · Vancouver, Canada'])
    cy.getByTestId(rs.cruiseLinePresentationSuite)
      .should('contain.text', 'Borealis Holdings')
      .and('contain.text', 'Premium coastal and cultural itineraries')
    metricValues().should('deep.equal', [
      'Ships 1',
      'Sailings 1',
      'Bookings 1',
      'Passengers 1',
      'Itinerary days 2',
      'Ports 2'
    ])
  })

  it('changes ship scope, resets sailing, and updates the sailing-plan summary', () => {
    visitOperatingWorkspace()

    cy.getByTestId(rs.presentationShipPicker).select('Atlas Two')

    cy.getByTestId(rs.presentationSailingPicker).should('have.value', 'atlas-sailing-3')
    optionLabels(rs.presentationSailingPicker).should('deep.equal', ['2027-01-20 · Cozumel, Mexico'])
    cy.contains('article', 'Sailing plan').should('contain.text', 'Atlas Two · 2027-01-20.')
  })

  it('changes the sailing within a ship without changing the selected line or ship', () => {
    visitOperatingWorkspace()

    cy.getByTestId(rs.presentationSailingPicker).select('atlas-sailing-2')

    cy.getByTestId(rs.presentationLinePicker).should('have.value', 'line-atlas')
    cy.getByTestId(rs.presentationShipPicker).should('have.value', 'Atlas One')
    cy.contains('article', 'Sailing plan').should('contain.text', 'Atlas One · 2026-09-15.')
  })

  it('derives usable ship and sailing scope from booking data when line records have no nested fleet', () => {
    const derivedLines = [{ id: 'line-derived', name: 'Derived Cruises', brandFamily: 'Derived Group' }]
    const derivedBookings = [
      {
        id: 'derived-booking-1',
        cruiseLine: { name: 'Derived Cruises' },
        ship: { name: 'Derived Dawn' },
        embarkationPort: 'Boston, Massachusetts',
        debarkationPort: 'Halifax, Canada',
        sailing: { departureDate: '2026-10-01' },
        passengers: [{ customerId: 'guest-a', customer: customers[0], passengerType: 'Primary' }]
      },
      {
        id: 'derived-booking-2',
        cruiseLine: { name: 'Derived Cruises' },
        ship: { name: 'Derived Dawn' },
        embarkationPort: 'Boston, Massachusetts',
        debarkationPort: 'Bermuda',
        sailing: { departureDate: '2026-11-01' },
        passengers: [{ customerId: 'guest-b', customer: customers[1], passengerType: 'Primary' }]
      }
    ]

    visitOperatingWorkspace({ cruiseLines: derivedLines, bookings: derivedBookings })

    optionLabels(rs.presentationShipPicker).should('deep.equal', ['Derived Dawn'])
    optionLabels(rs.presentationSailingPicker).should('deep.equal', [
      '2026-10-01 · Halifax, Canada',
      '2026-11-01 · Bermuda'
    ])
    metricValues().should('deep.equal', [
      'Ships 1',
      'Sailings 2',
      'Bookings 2',
      'Passengers 2',
      'Itinerary days 6',
      'Ports 3'
    ])
  })

  it('routes every operating action card to its intended live workspace', () => {
    visitOperatingWorkspace()

    operatingActionCard('Fleet').should('have.length', 1).within(() => cy.contains('button', 'Open fleet').click())
    cy.getByTestId(rs.fleetDirectory).should('be.visible')

    cy.getByTestId(rs.cruiseLinePresentationSuite).scrollIntoView()
    operatingActionCard('Guests').should('have.length', 1).within(() => cy.contains('button', 'Open roles').click())
    cy.getByTestId(rs.roleSelector).should('be.visible')

    cy.getByTestId(rs.cruiseLinePresentationSuite).scrollIntoView()
    operatingActionCard('Sailing plan').should('have.length', 1).within(() => cy.contains('button', 'Open sailings').click())
    cy.getByTestId(rs.fleetDirectory).should('be.visible')

    cy.getByTestId(rs.cruiseLinePresentationSuite).scrollIntoView()
    operatingActionCard('Turnaround').should('have.length', 1).within(() => cy.contains('button', 'Open operations').click())
    cy.getByTestId(rs.turnaroundAdminSetup).should('be.visible')
  })

  it('routes all bottom action buttons to their intended live workspaces', () => {
    visitOperatingWorkspace()

    cy.getByTestId(rs.presentationOpenFleet).click()
    cy.getByTestId(rs.fleetDirectory).should('be.visible')

    cy.getByTestId(rs.cruiseLinePresentationSuite).scrollIntoView()
    cy.getByTestId(rs.presentationOpenRoles).click()
    cy.getByTestId(rs.roleSelector).should('be.visible')

    cy.getByTestId(rs.cruiseLinePresentationSuite).scrollIntoView()
    cy.getByTestId(rs.presentationOpenTurnaround).click()
    cy.getByTestId(rs.turnaroundAdminSetup).should('be.visible')
  })

  it('keeps the operating controls keyboard-focusable and preserves selection state after workspace navigation', () => {
    visitOperatingWorkspace()

    cy.getByTestId(rs.presentationLinePicker).focus().should('have.focus')
    cy.getByTestId(rs.presentationShipPicker).focus().should('have.focus').select('Atlas Two')
    cy.getByTestId(rs.presentationSailingPicker).focus().should('have.focus').and('have.value', 'atlas-sailing-3')

    cy.getByTestId(rs.presentationOpenRoles).focus().should('have.focus').click()
    cy.getByTestId(rs.roleSelector).should('be.visible')
    cy.getByTestId(rs.presentationShipPicker).should('have.value', 'Atlas Two')
    cy.getByTestId(rs.presentationSailingPicker).should('have.value', 'atlas-sailing-3')
  })
})
