const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { interceptReactCoreApis } = require('./support/reactTestHelpers')

const customers = [
  { id: 'customer-alpha', firstName: 'Avery', lastName: 'Adams', email: 'avery@example.com' },
  { id: 'customer-beta', firstName: 'Bailey', lastName: 'Brooks', email: 'bailey@example.com' },
  { id: 'customer-group', firstName: 'Morgan', lastName: 'Leader', email: 'morgan@example.com' }
]

const bookings = [
  {
    id: 'booking-alpha',
    bookingStatus: 'CONFIRMED',
    cabinNumber: 'A101',
    createdByCustomerId: 'customer-alpha',
    cruiseLine: { name: 'Aqua Line' },
    ship: { name: 'Aurora' },
    sailing: { departureDate: '2026-09-10', departurePort: 'Miami', arrivalPort: 'Nassau', itinerary: [] },
    passengers: [{ customerId: 'customer-alpha', passengerType: 'Primary', customer: customers[0] }]
  },
  {
    id: 'booking-group',
    groupId: 'group-morgan',
    bookingStatus: 'CONFIRMED',
    cabinNumber: 'G202',
    createdByCustomerId: 'customer-group',
    cruiseLine: { name: 'Zephyr Line' },
    ship: { name: 'Zenith' },
    sailing: { departureDate: '2026-11-20', departurePort: 'Tampa', arrivalPort: 'Cozumel', itinerary: [] },
    passengers: [{ customerId: 'customer-group', passengerType: 'Primary', customer: customers[2] }]
  }
]

const demoUsers = [
  { id: 'admin-alpha', displayName: 'Admin Alpha', role: 'Admin', email: 'alpha.admin@example.com', department: 'Fleet Management' },
  { id: 'admin-beta', displayName: 'Admin Beta', role: 'Admin', email: 'beta.admin@example.com', department: 'Quality Engineering' },
  { id: 'passenger-avery', displayName: 'Avery Adams', role: 'Passenger', customerId: 'customer-alpha', email: 'avery@example.com' },
  { id: 'group-morgan', displayName: 'Morgan Leader', role: 'Group Leader', customerId: 'customer-group', groupId: 'group-morgan', email: 'morgan@example.com' }
]

function visitRoleSelector(overrides = {}) {
  interceptReactCoreApis({ customers, bookings, demoUsers, ...overrides })
  cy.visit('/')
  cy.wait(['@reactDemoUsers', '@reactCustomers', '@reactBookings'])
  cy.getByTestId(rs.roleTypeSelect).should('be.enabled')
}

describe('React role selector complete coverage', () => {
  it('renders the complete workspace selection contract with accessible controls and role choices', () => {
    visitRoleSelector()

    cy.getByTestId(rs.roleSelector)
      .should('be.visible')
      .and('have.attr', 'aria-labelledby', 'react-role-selector-heading')
      .within(() => {
        cy.get('#react-role-selector-heading').should('have.text', 'View application as')
        cy.contains('Select a role, then choose the person whose operational view you want to review.').should('be.visible')
      })

    cy.get('label[for="react-role-type"]').should('contain.text', 'Role')
    cy.getByTestId(rs.roleTypeSelect).find('option').then($options => {
      const labels = [...$options].map(option => option.text)
      expect(labels).to.include.members(['All roles', 'Administrator', 'Passenger', 'Group Leader'])
    })
    cy.get('label[for="react-person-search"]').should('contain.text', 'Search people')
    cy.getByTestId(rs.personSearchInput)
      .should('have.attr', 'type', 'search')
      .and('have.attr', 'placeholder', 'Search by name, role, ship, email, or sailing context')
    cy.getByTestId(rs.demoUserSelect).should('not.be.visible').and('have.attr', 'aria-hidden', 'true')
  })

  it('shows accurate admin visibility, role availability, total counts, and selected state', () => {
    visitRoleSelector()
    cy.getByTestId(rs.roleTypeSelect).select('admin')

    cy.getByTestId(rs.personFinderResultCard).should('have.length', 2)
    cy.getByTestId(rs.personFinderResultCard).filter('[aria-pressed="true"]').should('have.length', 1)
    cy.getByTestId(rs.selectedPersonCard).should('contain.text', 'Selected').and('contain.text', 'Admin')
    cy.getByTestId(rs.demoUserSummary)
      .should('contain.text', '2 people visible in the current selector.')
      .and('contain.text', '2 people available for the selected role.')
      .and('contain.text', '4 total people available.')
      .and('contain.text', '3 customers and 2 bookings available.')
  })

  it('searches admin people by name, email, id, role, and assignment and recovers from no results', () => {
    visitRoleSelector()
    cy.getByTestId(rs.roleTypeSelect).select('admin')

    const searches = [
      ['Admin Beta', 'Admin Beta'],
      ['beta.admin@example.com', 'Admin Beta'],
      ['admin-beta', 'Admin Beta'],
      ['quality engineering', 'Admin Beta'],
      ['admin', 'Admin Alpha']
    ]

    searches.forEach(([query, expected]) => {
      cy.getByTestId(rs.personSearchInput).clear().type(query)
      cy.getByTestId(rs.personFinderResultCard).should('have.length', query === 'admin' ? 2 : 1).and('contain.text', expected)
    })

    cy.getByTestId(rs.personSearchInput).clear().type('nobody in this workspace')
    cy.getByTestId(rs.personFinderEmpty).should('be.visible').and('contain.text', 'No people match the current search.')
    cy.getByTestId(rs.personFinderResultCard).should('not.exist')
    cy.getByTestId(rs.demoUserSummary)
      .should('contain.text', '2 people visible in the current selector.')
      .and('contain.text', '2 people available for the selected role.')

    cy.getByTestId(rs.personSearchInput).clear()
    cy.getByTestId(rs.personFinderResultCard).should('have.length', 2)
    cy.getByTestId(rs.personFinderEmpty).should('not.exist')
  })

  it('updates the selected card, summary, and aria-pressed state when another person is chosen', () => {
    visitRoleSelector()
    cy.getByTestId(rs.roleTypeSelect).select('admin')

    cy.getByTestId(rs.personFinderResultCard).contains('Admin Beta').click()
    cy.getByTestId(rs.selectedPersonCard).should('contain.text', 'Admin Beta (Admin)')
    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Admin Beta (Admin)')
    cy.getByTestId(rs.personFinderResultCard).contains('Admin Beta').closest('button').should('have.attr', 'aria-pressed', 'true')
    cy.getByTestId(rs.personFinderResultCard).contains('Admin Alpha').closest('button').should('have.attr', 'aria-pressed', 'false')
    cy.getByTestId(rs.demoUserSelect).should('have.value', 'admin-beta')
  })

  it('clears stale search state and scopes people when the selected role changes', () => {
    visitRoleSelector()
    cy.getByTestId(rs.roleTypeSelect).select('admin')
    cy.getByTestId(rs.personSearchInput).type('Admin Beta')
    cy.getByTestId(rs.personFinderResultCard).should('have.length', 1)

    cy.getByTestId(rs.roleTypeSelect).select('group-leader')
    cy.getByTestId(rs.personSearchInput).should('have.value', '')
    cy.getByTestId(rs.personFinderResultCard).should('have.length', 1).and('contain.text', 'Morgan Leader')
    cy.getByTestId(rs.personFinderResults).should('not.contain.text', 'Admin Beta')
    cy.getByTestId(rs.demoUserSummary)
      .should('contain.text', 'Group leader mode')
      .and('contain.text', '1 people available for the selected role.')
      .and('contain.text', '1 people visible in the current selector.')
  })

  it('keeps operational workspace assignments distinct and lets search narrow to one assignment', () => {
    const duplicateAssignments = [
      { id: 'admin-main', displayName: 'Admin Main', role: 'Admin', email: 'main@example.com' },
      { id: 'engineer-freedom', displayName: 'David Torres — Freedom of the Seas', role: 'Engineering Lead', email: 'david@example.com', cruiseLineName: 'Royal Caribbean International', assignedShipName: 'Freedom of the Seas' },
      { id: 'engineer-navigator', displayName: 'David Torres — Navigator of the Seas', role: 'Engineering Lead', email: 'david@example.com', cruiseLineName: 'Royal Caribbean International', assignedShipName: 'Navigator of the Seas' }
    ]
    visitRoleSelector({ demoUsers: duplicateAssignments })
    cy.getByTestId(rs.roleTypeSelect).select('engineering-lead')
    cy.getByTestId(rs.operationalCruiseLineFilter).select('Royal Caribbean International')

    cy.getByTestId(rs.personFinderResultCard)
      .should('have.length', 2)
      .and('contain.text', 'David Torres')
      .and('contain.text', 'Freedom of the Seas')
      .and('contain.text', 'Navigator of the Seas')
    cy.getByTestId(rs.personSearchInput).type('Navigator of the Seas')
    cy.getByTestId(rs.personFinderResultCard)
      .should('have.length', 1)
      .and('contain.text', 'David Torres')
      .and('contain.text', 'Navigator of the Seas')
      .and('not.contain.text', 'Freedom of the Seas')
    cy.getByTestId(rs.demoUserSummary)
      .should('contain.text', '1 people visible in the current selector.')
      .and('contain.text', '2 people available for the selected role.')
  })

  it('limits large generic role result sets to sixteen cards and supports narrowing them', () => {
    const manyAdmins = Array.from({ length: 20 }, (_, index) => ({
      id: `admin-${String(index + 1).padStart(2, '0')}`,
      displayName: `Admin Person ${String(index + 1).padStart(2, '0')}`,
      role: 'Admin',
      email: `admin${index + 1}@example.com`,
      department: index === 19 ? 'Release Certification' : 'Fleet Management'
    }))
    visitRoleSelector({ demoUsers: manyAdmins })
    cy.getByTestId(rs.roleTypeSelect).select('admin')

    cy.getByTestId(rs.personFinderResultCard).should('have.length', 16)
    cy.getByTestId(rs.personFinderLimitNote)
      .should('be.visible')
      .and('contain.text', 'Showing the best 16 matches')
    cy.getByTestId(rs.demoUserSummary)
      .should('contain.text', '20 people visible in the current selector.')
      .and('contain.text', '20 people available for the selected role.')

    cy.getByTestId(rs.personSearchInput).type('Release Certification')
    cy.getByTestId(rs.personFinderResultCard).should('have.length', 1).and('contain.text', 'Admin Person 20')
    cy.getByTestId(rs.personFinderLimitNote).should('not.exist')
  })
})
