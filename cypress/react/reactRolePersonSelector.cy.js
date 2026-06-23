const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { interceptReactCoreApis } = require('./support/reactTestHelpers')

describe('React role and person selector', () => {
  it('uses focused person cards instead of oversized person dropdowns for role selection', () => {
    cy.visit('/')

    cy.getByTestId(rs.roleTypeSelect).should('be.visible')
    cy.getByTestId(rs.personFinderPanel).should('be.visible')
    cy.getByTestId(rs.personFinderResultCard).should('have.length.greaterThan', 0)
    cy.getByTestId(rs.demoUserSelect).should('not.be.visible')

    cy.getByTestId(rs.roleTypeSelect).select('passenger')
    cy.getByTestId(rs.passengerFinderPanel).should('be.visible')
    cy.getByTestId(rs.passengerFinderResults).should('be.visible')
    cy.get('.passenger-finder-card-chips').should('not.exist')
    cy.getByTestId(rs.personFinderResultCard).first().invoke('text').should((text) => {
      expect(text).to.match(/\d{4}-\d{2}-\d{2}/)
      expect(text).to.include(' · ')
    })
    cy.getByTestId(rs.personFinderPanel).should('not.exist')
    cy.getByTestId(rs.passengerFinderResultCard).should('have.length.lessThan', 17)
    cy.getByTestId(rs.passengerFinderResultCard).should('not.contain.text', 'Admin')

    cy.getByTestId(rs.roleTypeSelect).select('admin')
    cy.getByTestId(rs.passengerFinderPanel).should('not.exist')
    cy.getByTestId(rs.personFinderResultCard).should('contain.text', 'Admin')
    cy.getByTestId(rs.personFinderResultCard).first().click()
    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Admin')

    cy.getByTestId(rs.roleTypeSelect).select('engineering-lead')
    cy.getByTestId(rs.operationalCruiseLineFilter)
      .invoke('val')
      .should('be.a', 'string')
      .and('not.equal', '')
    cy.getByTestId(rs.personFinderResultCard).should('contain.text', 'David Torres')
    cy.getByTestId(rs.personSearchInput).clear().type('David Torres')
    cy.getByTestId(rs.personFinderResultCard).should('have.length.greaterThan', 0).and('have.length.lessThan', 17)
    cy.getByTestId(rs.personFinderResultCard).should('contain.text', 'Engineering Lead')
    cy.getByTestId(rs.personFinderResultCard).first().then(($card) => {
      const selectedShip = $card.text().includes(' — ') ? $card.text().split(' — ').pop().trim() : ''
      cy.wrap($card).click()
      cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Engineering Lead')
      if (selectedShip) {
        cy.getByTestId(rs.demoUserSummary).should('contain.text', selectedShip)
      }
    })
    cy.contains('Engineering operations').should('be.visible')
  })

  it('lets passenger role users search and filter by cruise line, ship, and sailing date from card results', () => {
    cy.visit('/')

    cy.getByTestId(rs.roleTypeSelect).select('passenger')
    cy.getByTestId(rs.passengerFinderPanel).should('contain.text', 'Passenger finder')
    cy.getByTestId(rs.passengerSearchInput).should('be.visible').type('Jay Gallagher')
    cy.getByTestId(rs.passengerFinderResultCard).should('have.length', 1).and('contain.text', 'Jay Gallagher')
    cy.getByTestId(rs.personFinderResultCard).should('have.length', 1).and('contain.text', 'Jay Gallagher')
    cy.getByTestId(rs.personFinderResultCard).first().should('contain.text', 'Royal Caribbean')

    cy.getByTestId(rs.passengerSearchInput).clear()
    cy.getByTestId(rs.passengerCruiseLineFilter).select('Royal Caribbean International')
    cy.getByTestId(rs.personFinderResultCard).should('contain.text', 'Royal Caribbean International')
    cy.getByTestId(rs.personFinderResultCard).should('not.contain.text', 'Carnival Cruise Line')

    cy.getByTestId(rs.passengerShipFilter).select('Adventure of the Seas')
    cy.getByTestId(rs.personFinderResultCard).should('contain.text', 'Adventure of the Seas')
    cy.getByTestId(rs.personFinderResultCard).should('contain.text', 'Adventure of the Seas')

    cy.getByTestId(rs.passengerSailingDateFilter).select('2026-08-05')
    cy.getByTestId(rs.personFinderResultCard).should('contain.text', '2026-08-05')

    cy.getByTestId(rs.passengerSearchInput).type('no passenger with this name')
    cy.getByTestId(rs.passengerFinderEmpty).should('be.visible')
    cy.getByTestId(rs.personFinderPanel).should('not.exist')
  })


  it('keeps passenger cruise line, ship, and sailing date filters mutually scoped and sorted', () => {
    const customers = [
      { id: 'passenger-alpha-1', firstName: 'Avery', lastName: 'Adams', email: 'avery@example.com' },
      { id: 'passenger-alpha-2', firstName: 'Bailey', lastName: 'Brooks', email: 'bailey@example.com' },
      { id: 'passenger-zephyr-1', firstName: 'Casey', lastName: 'Clark', email: 'casey@example.com' },
      { id: 'passenger-zephyr-2', firstName: 'Drew', lastName: 'Diaz', email: 'drew@example.com' }
    ]
    const demoUsers = [
      { id: 'react-admin-user', displayName: 'React Admin', role: 'Admin', email: 'admin.react@example.com' },
      ...customers.map(customer => ({
        id: `${customer.id}-user`,
        displayName: `${customer.firstName} ${customer.lastName}`,
        role: 'Passenger',
        customerId: customer.id,
        email: customer.email
      }))
    ]
    const bookingFor = ({ id, customerId, cruiseLine, ship, sailingDate }) => ({
      id,
      bookingStatus: 'CONFIRMED',
      cabinNumber: 'P101',
      fareCode: 'BALCONY',
      embarkationPort: 'Port Canaveral, Florida',
      debarkationPort: 'Port Canaveral, Florida',
      createdByCustomerId: customerId,
      cruiseLine: { name: cruiseLine },
      ship: { name: ship },
      sailing: { departureDate: sailingDate, itinerary: [] },
      passengers: [{ customerId, passengerType: 'Primary', customer: customers.find(customer => customer.id === customerId) }]
    })
    const bookings = [
      bookingFor({ id: 'booking-alpha-beta', customerId: 'passenger-alpha-1', cruiseLine: 'Aqua Line', ship: 'Beta Ship', sailingDate: '2026-01-10' }),
      bookingFor({ id: 'booking-alpha-delta', customerId: 'passenger-alpha-2', cruiseLine: 'Aqua Line', ship: 'Delta Ship', sailingDate: '2026-03-01' }),
      bookingFor({ id: 'booking-zephyr-omega', customerId: 'passenger-zephyr-1', cruiseLine: 'Zephyr Line', ship: 'Omega Ship', sailingDate: '2026-02-01' }),
      bookingFor({ id: 'booking-zephyr-beta', customerId: 'passenger-zephyr-2', cruiseLine: 'Zephyr Line', ship: 'Beta Ship', sailingDate: '2026-04-01' })
    ]

    interceptReactCoreApis({ customers, demoUsers, bookings })
    cy.visit('/')
    cy.wait(['@reactDemoUsers', '@reactBookings'])
    cy.getByTestId(rs.roleTypeSelect).select('passenger')

    cy.getByTestId(rs.passengerCruiseLineFilter).find('option').then($options => {
      expect([...$options].map(option => option.text)).to.deep.equal(['All cruise lines', 'Aqua Line', 'Zephyr Line'])
    })
    cy.getByTestId(rs.passengerShipFilter).find('option').then($options => {
      expect([...$options].map(option => option.text)).to.deep.equal(['All ships', 'Beta Ship', 'Delta Ship', 'Omega Ship'])
    })
    cy.getByTestId(rs.passengerSailingDateFilter).find('option').then($options => {
      expect([...$options].map(option => option.text)).to.deep.equal(['All sailing dates', '2026-01-10', '2026-02-01', '2026-03-01', '2026-04-01'])
    })

    cy.getByTestId(rs.passengerCruiseLineFilter).select('Aqua Line')
    cy.getByTestId(rs.passengerShipFilter).find('option').then($options => {
      expect([...$options].map(option => option.text)).to.deep.equal(['All ships', 'Beta Ship', 'Delta Ship'])
    })
    cy.getByTestId(rs.passengerSailingDateFilter).find('option').then($options => {
      expect([...$options].map(option => option.text)).to.deep.equal(['All sailing dates', '2026-01-10', '2026-03-01'])
    })
    cy.getByTestId(rs.passengerFinderResults).should('contain.text', 'Aqua Line').and('not.contain.text', 'Zephyr Line')

    cy.getByTestId(rs.passengerShipFilter).select('Delta Ship')
    cy.getByTestId(rs.passengerSailingDateFilter).find('option').then($options => {
      expect([...$options].map(option => option.text)).to.deep.equal(['All sailing dates', '2026-03-01'])
    })
    cy.getByTestId(rs.passengerFinderResults).should('contain.text', 'Delta Ship').and('not.contain.text', 'Beta Ship')

    cy.getByTestId(rs.passengerCruiseLineFilter).select('')
    cy.getByTestId(rs.passengerShipFilter).select('')
    cy.getByTestId(rs.passengerSailingDateFilter).select('2026-02-01')
    cy.getByTestId(rs.passengerCruiseLineFilter).find('option').then($options => {
      expect([...$options].map(option => option.text)).to.deep.equal(['All cruise lines', 'Zephyr Line'])
    })
    cy.getByTestId(rs.passengerShipFilter).find('option').then($options => {
      expect([...$options].map(option => option.text)).to.deep.equal(['All ships', 'Omega Ship'])
    })
    cy.getByTestId(rs.passengerFinderResults).should('contain.text', 'Omega Ship').and('not.contain.text', 'Aqua Line')

    cy.getByTestId(rs.passengerSailingDateFilter).select('')
    cy.getByTestId(rs.passengerShipFilter).select('Beta Ship')
    cy.getByTestId(rs.passengerCruiseLineFilter).find('option').then($options => {
      expect([...$options].map(option => option.text)).to.deep.equal(['All cruise lines', 'Aqua Line', 'Zephyr Line'])
    })
    cy.getByTestId(rs.passengerSailingDateFilter).find('option').then($options => {
      expect([...$options].map(option => option.text)).to.deep.equal(['All sailing dates', '2026-01-10', '2026-04-01'])
    })
    cy.getByTestId(rs.passengerFinderResults).should('contain.text', 'Beta Ship').and('not.contain.text', 'Delta Ship')
  })

  it('scopes turnaround people by cruise line before ship and shows sixteen assignment cards', () => {
    const operationalDemoUsers = [
      {
        id: 'react-admin-user',
        displayName: 'React Admin',
        role: 'Admin',
        email: 'admin.react@example.com'
      },
      ...Array.from({ length: 20 }, (_, index) => ({
        id: `royal-guest-services-${index + 1}`,
        displayName: `${index === 0 ? 'Angela Brooks' : `Royal Guest Lead ${index + 1}`} — ${index % 2 === 0 ? 'Freedom of the Seas' : 'Navigator of the Seas'}`,
        role: 'guest_services_lead',
        cruiseLineName: 'Royal Caribbean International',
        assignedShipName: index % 2 === 0 ? 'Freedom of the Seas' : 'Navigator of the Seas',
        email: `royal.guest.${index + 1}@example.com`
      })),
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `carnival-guest-services-${index + 1}`,
        displayName: `${index === 0 ? 'Angela Brooks' : `Carnival Guest Lead ${index + 1}`} — Carnival Celebration`,
        role: 'guest_services_lead',
        cruiseLineName: 'Carnival Cruise Line',
        assignedShipName: 'Carnival Celebration',
        email: `carnival.guest.${index + 1}@example.com`
      }))
    ]

    interceptReactCoreApis({ demoUsers: operationalDemoUsers })
    cy.visit('/')
    cy.wait('@reactDemoUsers')

    cy.getByTestId(rs.roleTypeSelect).select('guest-services-lead')
    cy.getByTestId(rs.operationalPersonFilterPanel).should('be.visible')
    cy.getByTestId(rs.operationalPersonFilterPanel).should('contain.text', 'Choose the person whose workspace you want to review')
    cy.getByTestId(rs.operationalSelectorSummary).should('contain.text', 'Royal Caribbean International')
    cy.getByTestId(rs.operationalSelectorSummary).should('contain.text', '20 people')
    cy.getByTestId(rs.personFinderResultCard).should('have.length', 16)
    cy.getByTestId(rs.personFinderResultCard).first().should('contain.text', 'Angela Brooks').and('contain.text', 'Guest Services Lead').and('contain.text', 'Freedom of the Seas')
    cy.getByTestId(rs.personFinderResultCard).first().then(($card) => {
      const cardStyle = getComputedStyle($card[0])
      const titleStyle = getComputedStyle($card.find('strong')[0])
      expect(cardStyle.backgroundColor, 'assignment card background is not the blank white shell').not.to.equal('rgb(255, 255, 255)')
      expect(titleStyle.color, 'assignment card text remains readable').not.to.equal(cardStyle.backgroundColor)
    })
    cy.getByTestId(rs.operationalSelectorSummary).find('strong').first().then(($summary) => {
      const summaryStyle = getComputedStyle($summary[0])
      expect(summaryStyle.color, 'summary values remain visible on the dark panel').not.to.equal('rgb(255, 255, 255, 0)')
    })
    cy.getByTestId(rs.personFinderLimitNote).should('contain.text', 'Showing the best 16 matches')
    cy.getByTestId(rs.personFinderResults).should('contain.text', 'Freedom of the Seas')
    cy.getByTestId(rs.personFinderResults).should('contain.text', 'Navigator of the Seas')
    cy.getByTestId(rs.personFinderResults).should('not.contain.text', 'Carnival Celebration')

    cy.getByTestId(rs.operationalCruiseLineFilter).select('')
    cy.getByTestId(rs.operationalShipFilter)
      .should('be.disabled')
      .find('option')
      .should('have.length', 1)
      .first()
      .should('contain.text', 'Select a cruise line first')
    cy.getByTestId(rs.operationalSelectorSummary).should('contain.text', 'Choose a cruise line')
    cy.getByTestId(rs.personFinderEmpty).should('contain.text', 'Select a cruise line')

    cy.getByTestId(rs.operationalCruiseLineFilter).select('Royal Caribbean International')
    cy.getByTestId(rs.operationalShipFilter).should('not.be.disabled')
    cy.getByTestId(rs.operationalShipFilter).find('option').should('contain.text', 'Freedom of the Seas')
    cy.getByTestId(rs.operationalShipFilter).find('option').should('contain.text', 'Navigator of the Seas')
    cy.getByTestId(rs.personFinderResultCard).should('have.length', 16)
    cy.getByTestId(rs.personFinderResults).should('not.contain.text', 'Carnival Celebration')

    cy.getByTestId(rs.personSearchInput).clear().type('Angela Brooks')
    cy.getByTestId(rs.personFinderResultCard).should('have.length', 1)
    cy.getByTestId(rs.personFinderResultCard).first().should('contain.text', 'Freedom of the Seas')
    cy.getByTestId(rs.personFinderResults).should('not.contain.text', 'Carnival Celebration')

    cy.getByTestId(rs.operationalShipFilter).select('Navigator of the Seas')
    cy.getByTestId(rs.personFinderEmpty).should('contain.text', 'No people match')

    cy.getByTestId(rs.personSearchInput).clear()
    cy.getByTestId(rs.personFinderResultCard).should('have.length.greaterThan', 0)
    cy.getByTestId(rs.personFinderResults).should('contain.text', 'Navigator of the Seas')
    cy.getByTestId(rs.personFinderResults).should('not.contain.text', 'Freedom of the Seas')
    cy.getByTestId(rs.operationalSelectorSummary).should('contain.text', 'Navigator of the Seas')
  })

})
