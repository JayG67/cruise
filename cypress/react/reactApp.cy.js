Cypress.Commands.add('getByTestId', testId => {
  return cy.get(`[data-testid="${testId}"]`)
})

function selectDemoUserByVisibleRole(roleText) {
  cy.getByTestId('react-demo-user-select')
    .find('option')
    .contains(roleText)
    .invoke('val')
    .then(value => {
      cy.getByTestId('react-demo-user-select').select(value)
    })
}

function visitReactAppAsAdmin() {
  cy.visit('/app-next')
  cy.getByTestId('react-demo-user-select').should('be.visible')
  selectDemoUserByVisibleRole('Admin')
  cy.getByTestId('react-demo-user-summary').should('contain.text', 'Admin')
}

describe('React app replacement route', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('loads the React replacement shell and core workspaces', () => {
    cy.getByTestId('react-production-parity-shell').should('be.visible')
    cy.getByTestId('react-top-navigation').should('be.visible')
    cy.getByTestId('react-role-selector').should('be.visible')
    cy.getByTestId('react-demo-user-select').should('be.visible')
    cy.getByTestId('react-workspace-card-grid').should('be.visible')
  })

  it('switches from admin to passenger view when a passenger demo user is selected', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-demo-user-summary').should('contain.text', 'Passenger')
    cy.getByTestId('react-passenger-dashboard').should('be.visible')
    cy.contains('Passenger booking dashboard').should('be.visible')
    cy.contains('My travel profile').should('be.visible')
    cy.getByTestId('react-active-route-operations').should('not.exist')
  })


  it('switches through React role dashboards using the actual demo user select', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-passenger-dashboard').should('be.visible')
    cy.getByTestId('react-active-route-operations').should('not.exist')

    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId('react-group-leader-dashboard').should('be.visible')

    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId('react-active-route-operations').should('be.visible')
    cy.getByTestId('react-demo-user-summary').should('contain.text', 'Admin')
  })

  it('switches back to admin view and exposes admin replacement workflows', () => {
    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId('react-demo-user-summary').should('contain.text', 'Admin')
    cy.getByTestId('react-active-route-operations').should('be.visible')
    cy.getByTestId('react-fleet-directory').should('be.visible')
    cy.getByTestId('react-create-cruise-line-workflow').should('be.visible')
    cy.getByTestId('react-sqa-console').should('be.visible')
  })



  it('creates and deletes React admin customers and bookings', () => {
    cy.intercept('POST', '/cruise/customers', req => {
      expect(req.body).to.include({
        firstName: 'React',
        lastName: 'Admin',
        email: 'react.admin@example.com'
      })

      req.reply({
        statusCode: 201,
        body: {
          id: 'react-customer-created',
          firstName: 'React',
          lastName: 'Admin',
          email: 'react.admin@example.com',
          phone: '555-0101',
          loyaltyNumber: 'RX-100'
        }
      })
    }).as('createReactCustomer')

    cy.intercept('DELETE', '/cruise/customers/react-customer-created', {
      statusCode: 200,
      body: { deleted: true }
    }).as('deleteReactCustomer')

    cy.intercept('POST', '/cruise/bookings', req => {
      expect(req.body).to.include({
        customerId: 'react-customer-created',
        bookingStatus: 'CONFIRMED',
        cabinNumber: 'R100'
      })

      req.reply({
        statusCode: 201,
        body: {
          id: 'react-booking-created',
          bookingStatus: 'CONFIRMED',
          cabinNumber: 'R100',
          fareCode: 'RX',
          embarkationPort: 'Miami',
          debarkationPort: 'Nassau'
        }
      })
    }).as('createReactBooking')

    cy.intercept('DELETE', '/cruise/bookings/react-booking-created', {
      statusCode: 200,
      body: { deleted: true }
    }).as('deleteReactBooking')

    cy.getByTestId('react-admin-create-customer-first-name').type('React')
    cy.getByTestId('react-admin-create-customer-last-name').type('Admin')
    cy.getByTestId('react-admin-create-customer-email').type('react.admin@example.com')
    cy.getByTestId('react-admin-create-customer-phone').type('555-0101')
    cy.getByTestId('react-admin-create-customer-loyalty').type('RX-100')
    cy.getByTestId('react-admin-create-customer-submit').click()
    cy.wait('@createReactCustomer')
    cy.getByTestId('react-admin-mutation-message').should('contain.text', 'React Admin was created')

    cy.getByTestId('react-admin-create-booking-customer-id').clear().type('react-customer-created')
    cy.getByTestId('react-admin-create-booking-status').clear().type('CONFIRMED')
    cy.getByTestId('react-admin-create-booking-cabin').clear().type('R100')
    cy.getByTestId('react-admin-create-booking-fare').clear().type('RX')
    cy.getByTestId('react-admin-create-booking-embarkation').clear().type('Miami')
    cy.getByTestId('react-admin-create-booking-debarkation').clear().type('Nassau')
    cy.getByTestId('react-admin-create-booking-submit').click()
    cy.wait('@createReactBooking')
    cy.getByTestId('react-admin-mutation-message').should('contain.text', 'react-booking-created booking was created')

    cy.getByTestId('react-admin-delete-booking-id').clear().type('react-booking-created')
    cy.getByTestId('react-admin-delete-booking-submit').click()
    cy.getByTestId('react-admin-delete-confirmation').should('contain.text', 'Delete booking react-booking-created?')
    cy.getByTestId('react-admin-delete-confirmation-confirm').click()
    cy.wait('@deleteReactBooking')
    cy.getByTestId('react-admin-mutation-message').should('contain.text', 'react-booking-created booking was deleted')

    cy.getByTestId('react-admin-delete-customer-id').clear().type('react-customer-created')
    cy.getByTestId('react-admin-delete-customer-submit').click()
    cy.getByTestId('react-admin-delete-confirmation').should('contain.text', 'Delete customer react-customer-created?')
    cy.getByTestId('react-admin-delete-confirmation-confirm').click()
    cy.wait('@deleteReactCustomer')
    cy.getByTestId('react-admin-mutation-message').should('contain.text', 'react-customer-created customer was deleted')
    cy.getByTestId('react-admin-delete-confirmation').should('not.exist')
  })


  it('deletes React admin customer and booking records from contextual workflow rows', () => {
    const customerRows = [
      {
        id: 'react-context-customer',
        firstName: 'Context',
        lastName: 'Admin',
        email: 'context.admin@example.com',
        phone: '555-0202',
        loyaltyNumber: 'CTX-200'
      }
    ]
    const bookingRows = [
      {
        id: 'react-context-booking',
        bookingStatus: 'CONFIRMED',
        cabinNumber: 'C200',
        fareCode: 'CTX',
        embarkationPort: 'Miami',
        debarkationPort: 'Nassau',
        createdByCustomerId: 'react-context-customer',
        passengers: [
          {
            customerId: 'react-context-customer',
            customer: customerRows[0]
          }
        ],
        cruiseLine: { name: 'Context Cruises' },
        ship: { name: 'Context Ship' },
        sailing: { departureDate: '2026-09-12' }
      }
    ]

    cy.intercept('GET', '/cruise/customers', req => {
      req.reply({ statusCode: 200, body: customerRows })
    }).as('loadContextCustomers')
    cy.intercept('GET', '/cruise/bookings', req => {
      req.reply({ statusCode: 200, body: bookingRows })
    }).as('loadContextBookings')
    cy.intercept('DELETE', '/cruise/bookings/react-context-booking', req => {
      bookingRows.splice(0, bookingRows.length)
      req.reply({ statusCode: 200, body: { deleted: true } })
    }).as('deleteContextBooking')
    cy.intercept('DELETE', '/cruise/customers/react-context-customer', req => {
      customerRows.splice(0, customerRows.length)
      req.reply({ statusCode: 200, body: { deleted: true } })
    }).as('deleteContextCustomer')

    visitReactAppAsAdmin()
    cy.wait('@loadContextCustomers')
    cy.wait('@loadContextBookings')

    cy.getByTestId('react-toggle-customer-workflows').click()
    cy.getByTestId('react-customer-workflow-table').should('contain.text', 'Context Admin')
    cy.getByTestId('react-toggle-customer-bookings').click()
    cy.getByTestId('react-booking-card').should('contain.text', 'react-context-booking')

    cy.getByTestId('react-delete-booking-row-button').click()
    cy.getByTestId('react-admin-delete-confirmation').should('contain.text', 'Delete booking react-context-booking?')
    cy.getByTestId('react-admin-delete-confirmation-confirm').click()
    cy.wait('@deleteContextBooking')
    cy.wait('@loadContextCustomers')
    cy.wait('@loadContextBookings')
    cy.getByTestId('react-admin-mutation-message').should('contain.text', 'react-context-booking booking was deleted')

    cy.getByTestId('react-delete-customer-row-button').click()
    cy.getByTestId('react-admin-delete-confirmation').should('contain.text', 'Delete customer Context Admin?')
    cy.getByTestId('react-admin-delete-confirmation-confirm').click()
    cy.wait('@deleteContextCustomer')
    cy.wait('@loadContextCustomers')
    cy.wait('@loadContextBookings')
    cy.getByTestId('react-admin-mutation-message').should('contain.text', 'Context Admin customer was deleted')
    cy.getByTestId('react-admin-delete-confirmation').should('not.exist')
  })

  it('searches the React fleet directory and loads ships for a selected cruise line', () => {
    cy.getByTestId('react-active-route-operations').should('be.visible')
    cy.getByTestId('react-fleet-search').type('Royal')
    cy.getByTestId('react-fleet-count').should('contain.text', 'matching cruise lines')
    cy.getByTestId('react-fleet-card').first().should('contain.text', 'Royal')

    cy.getByTestId('react-view-ships-button').first().click()
    cy.getByTestId('react-selected-ships-panel').should('be.visible')
    cy.getByTestId('react-selected-ships-panel').should('contain.text', 'Royal')
    cy.getByTestId('react-ship-card').should('have.length.greaterThan', 0)
    cy.getByTestId('react-ship-card').first().should('contain.text', 'Current port:')
  })



  it('updates a React cruise line from the fleet directory', () => {
    const royalCruiseLine = {
      id: 'royal-caribbean',
      name: 'Royal Caribbean International',
      country: 'United States',
      website: 'https://www.royalcaribbean.com'
    }
    cy.intercept('PATCH', '/cruise/cruise-line/*', req => {
      expect(req.url).to.match(/\/cruise\/cruise-line\/[0-9a-f-]{36}$/)
      expect(req.body).to.deep.equal({
        name: 'Royal Caribbean React Updated',
        country: 'United States React',
        website: 'https://react-updated.example.com'
      })

      const cruiseLineId = req.url.split('/').pop()

      req.reply({
        statusCode: 200,
        body: {
          ...royalCruiseLine,
          id: cruiseLineId,
          name: 'Royal Caribbean React Updated',
          country: 'United States React',
          website: 'https://react-updated.example.com'
        }
      })
    }).as('updateReactCruiseLine')

    cy.intercept('GET', '/cruise').as('reloadFleetAfterUpdate')

    cy.getByTestId('react-fleet-search').type('Royal')
    cy.getByTestId('react-view-ships-button').first().click()
    cy.getByTestId('react-selected-ships-panel').should('contain.text', 'Royal Caribbean International ships')

    cy.getByTestId('react-update-cruise-line-button').first().should('be.visible').click()
    cy.getByTestId('react-cruise-line-edit-form').should('be.visible')
    cy.getByTestId('react-edit-cruise-line-name').clear().type(' Royal Caribbean React Updated ')
    cy.getByTestId('react-edit-cruise-line-country').clear().type(' United States React ')
    cy.getByTestId('react-edit-cruise-line-website').clear().type(' https://react-updated.example.com ')
    cy.getByTestId('react-save-cruise-line-edit').click()
    cy.wait('@updateReactCruiseLine')
    cy.wait('@reloadFleetAfterUpdate')
    cy.getByTestId('react-fleet-action-message').should('contain.text', 'Royal Caribbean React Updated was updated')
    cy.getByTestId('react-selected-ships-panel').should('contain.text', 'Royal Caribbean React Updated ships')
  })

  it('supports React fleet delete cancellation and confirmed deletion', () => {
    cy.getByTestId('react-active-route-operations').should('be.visible')
    cy.intercept('DELETE', '/cruise/cruise-line/*', {
      statusCode: 200,
      body: { deleted: true }
    }).as('deleteCruiseLine')
    cy.intercept('GET', '/cruise').as('loadCruiseLines')

    cy.getByTestId('react-fleet-search').type('Norwegian')
    cy.getByTestId('react-fleet-card').first().should('contain.text', 'Norwegian')

    cy.getByTestId('react-delete-cruise-line-button').first().click()
    cy.getByTestId('react-fleet-delete-confirmation').should('contain.text', 'Delete Norwegian')
    cy.getByTestId('react-fleet-delete-confirmation-cancel').click()
    cy.get('@deleteCruiseLine.all').should('have.length', 0)

    cy.getByTestId('react-delete-cruise-line-button').first().click()
    cy.getByTestId('react-fleet-delete-confirmation-confirm').click()
    cy.wait('@deleteCruiseLine')
    cy.wait('@loadCruiseLines')
    cy.getByTestId('react-fleet-action-message').should('contain.text', 'was deleted')
  })


  it('creates a React cruise line with starter ships and reset parity', () => {
    cy.intercept('POST', '/cruise/cruise-line', req => {
      expect(req.body).to.deep.equal({
        name: 'React Test Cruises',
        country: 'United States',
        website: 'https://react-test-cruises.example.com'
      })

      req.reply({
        statusCode: 201,
        body: {
          id: 'react-test-cruise-line',
          name: 'React Test Cruises',
          country: 'United States',
          website: 'https://react-test-cruises.example.com'
        }
      })
    }).as('createReactCruiseLine')

    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body.cruiseLineId).to.equal('react-test-cruise-line')
      expect(req.body.name).to.match(/React Ship (One|Two)/)
      expect(req.body.currentPort).to.match(/Tampa|Port Canaveral/)

      req.reply({
        statusCode: 201,
        body: {
          id: `created-${req.body.name.toLowerCase().replaceAll(' ', '-')}`,
          ...req.body
        }
      })
    }).as('createReactShip')

    cy.intercept('GET', '/cruise').as('reloadFleetAfterCreate')

    cy.getByTestId('react-create-cruise-line-name').clear().type('  React Test Cruises  ')
    cy.getByTestId('react-create-cruise-line-country').clear().type('  United States  ')
    cy.getByTestId('react-create-cruise-line-website').clear().type('  https://react-test-cruises.example.com  ')
    cy.getByTestId('react-create-ship-name').first().clear().type('  React Ship One  ')
    cy.getByTestId('react-create-ship-port').first().clear().type('  Tampa  ')

    cy.getByTestId('react-add-ship-row').click()
    cy.getByTestId('react-create-ship-name').last().type('  React Ship Two  ')
    cy.getByTestId('react-create-ship-port').last().type('  Port Canaveral  ')

    cy.getByTestId('react-add-ship-row').click()
    cy.getByTestId('react-create-ship-name').last().type('  ')
    cy.getByTestId('react-remove-ship-row').last().click()

    cy.getByTestId('react-save-cruise-line').click()

    cy.wait('@createReactCruiseLine')
    cy.wait('@createReactShip')
    cy.wait('@createReactShip')
    cy.wait('@reloadFleetAfterCreate')
    cy.getByTestId('react-create-cruise-line-message').should('contain.text', 'React Test Cruises created successfully with 2 starter ships')

    cy.getByTestId('react-create-cruise-line-name').should('have.value', '')
    cy.getByTestId('react-create-ship-name').should('have.length', 1)

    cy.getByTestId('react-create-cruise-line-name').type('Temporary React Cruise')
    cy.getByTestId('react-reset-cruise-line').click()
    cy.getByTestId('react-create-cruise-line-name').should('have.value', '')
    cy.getByTestId('react-create-cruise-line-message').should('contain.text', 'Ready to create cruise line data.')
  })


  it('manages React ship CRUD and sailing lookup from the selected fleet panel', () => {
    const royalShips = [
      { id: 'react-ship-1', name: 'React Wonder', currentPort: 'Miami', cruiseLineId: 'royal-caribbean' },
      { id: 'react-ship-2', name: 'React Utopia', currentPort: 'Port Canaveral', cruiseLineId: 'royal-caribbean' }
    ]

    cy.intercept('GET', '/cruise/ships/*', req => {
      req.reply({
        statusCode: 200,
        body: royalShips
      })
    }).as('loadReactShips')

    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body.name).to.equal('React Test Ship')
      expect(req.body.currentPort).to.equal('Tampa')
      expect(req.body.cruiseLineId).to.exist

      royalShips.push({
        id: 'react-created-ship',
        name: req.body.name,
        currentPort: req.body.currentPort,
        cruiseLineId: req.body.cruiseLineId
      })

      req.reply({ statusCode: 201, body: royalShips.at(-1) })
    }).as('createReactShip')

    cy.intercept('PATCH', '/cruise/ship/react-ship-1', req => {
      expect(req.body.name).to.equal('React Wonder Updated')
      expect(req.body.currentPort).to.equal('Nassau')

      royalShips[0] = { ...royalShips[0], name: req.body.name, currentPort: req.body.currentPort }
      req.reply({ statusCode: 200, body: royalShips[0] })
    }).as('updateReactShip')

    cy.intercept('DELETE', '/cruise/ship/react-ship-2', req => {
      const index = royalShips.findIndex(ship => ship.id === 'react-ship-2')
      if (index >= 0) royalShips.splice(index, 1)
      req.reply({ statusCode: 200, body: { deleted: true } })
    }).as('deleteReactShip')

    const reactSailings = [
      {
        id: 'react-sailing-1',
        departureDate: '2026-10-01',
        departurePort: 'Miami, Florida',
        arrivalPort: 'Nassau, Bahamas',
        days: 4,
        isRepositioning: false
      }
    ]

    cy.intercept('GET', '/cruise/ship/react-ship-1/sailings', req => {
      req.reply({ statusCode: 200, body: reactSailings })
    }).as('loadReactSailings')

    cy.intercept('POST', '/cruise/ship/react-ship-1/sailings', req => {
      expect(req.body).to.deep.equal({
        departureDate: '2026-11-02',
        departurePort: 'Tampa',
        arrivalPort: 'Cozumel',
        days: 5,
        isRepositioning: true
      })

      reactSailings.push({
        id: 'react-created-sailing',
        ...req.body
      })

      req.reply({ statusCode: 201, body: reactSailings.at(-1) })
    }).as('createReactSailing')

    cy.intercept('PATCH', '/cruise/sailings/react-sailing-1', req => {
      expect(req.body).to.deep.equal({
        departureDate: '2026-12-03',
        departurePort: 'Port Canaveral',
        arrivalPort: 'Key West',
        days: 3,
        isRepositioning: false
      })

      reactSailings[0] = { id: 'react-sailing-1', ...req.body }
      req.reply({ statusCode: 200, body: reactSailings[0] })
    }).as('updateReactSailing')

    cy.intercept('DELETE', '/cruise/sailings/react-created-sailing', req => {
      const index = reactSailings.findIndex(sailing => sailing.id === 'react-created-sailing')
      if (index >= 0) reactSailings.splice(index, 1)
      req.reply({ statusCode: 200, body: { deleted: true } })
    }).as('deleteReactSailing')

    const reactItineraryDays = [
      {
        id: 'react-day-1',
        day: 1,
        title: 'Embarkation Day',
        port: 'Miami, Florida',
        activitySchedule: [
          { id: 'react-activity-1', time: '9:00 AM', activity: 'Terminal arrival' },
          { id: 'react-activity-2', time: '4:00 PM', activity: 'Sail away celebration' }
        ]
      },
      {
        id: 'react-day-2',
        day: 2,
        title: 'Port Day',
        port: 'Nassau, Bahamas',
        activitySchedule: [
          { id: 'react-activity-3', time: '10:00 AM', activity: 'Harbor walking tour' }
        ]
      }
    ]

    cy.intercept('GET', '/cruise/sailings/react-sailing-1/itinerary', req => {
      req.reply({ statusCode: 200, body: reactItineraryDays })
    }).as('loadReactItinerary')

    cy.intercept('POST', '/cruise/sailings/react-sailing-1/itinerary', req => {
      expect(req.body).to.deep.equal({
        day: 3,
        title: 'React Sea Day',
        port: 'At Sea'
      })

      reactItineraryDays.push({
        id: 'react-created-day',
        ...req.body,
        activitySchedule: []
      })

      req.reply({ statusCode: 201, body: reactItineraryDays.at(-1) })
    }).as('createReactItineraryDay')

    cy.intercept('PATCH', '/cruise/itinerary-days/react-day-1', req => {
      expect(req.body).to.deep.equal({
        day: 1,
        title: 'React Embarkation Updated',
        port: 'Miami Updated'
      })

      reactItineraryDays[0] = { ...reactItineraryDays[0], ...req.body }
      req.reply({ statusCode: 200, body: reactItineraryDays[0] })
    }).as('updateReactItineraryDay')

    cy.intercept('DELETE', '/cruise/itinerary-days/react-created-day', req => {
      const index = reactItineraryDays.findIndex(day => day.id === 'react-created-day')
      if (index >= 0) reactItineraryDays.splice(index, 1)
      req.reply({ statusCode: 200, body: { deleted: true } })
    }).as('deleteReactItineraryDay')

    cy.intercept('POST', '/cruise/itinerary-days/react-day-1/activities', req => {
      expect(req.body).to.deep.equal({
        time: '7:30 PM',
        activity: 'React Dinner Show'
      })

      reactItineraryDays[0].activitySchedule.push({
        id: 'react-created-activity',
        ...req.body
      })

      req.reply({ statusCode: 201, body: reactItineraryDays[0].activitySchedule.at(-1) })
    }).as('createReactItineraryActivity')

    cy.intercept('PATCH', '/cruise/activities/react-activity-1', req => {
      expect(req.body).to.deep.equal({
        time: '8:00 AM',
        activity: 'React Terminal Arrival Updated'
      })

      reactItineraryDays[0].activitySchedule[0] = { ...reactItineraryDays[0].activitySchedule[0], ...req.body }
      req.reply({ statusCode: 200, body: reactItineraryDays[0].activitySchedule[0] })
    }).as('updateReactItineraryActivity')

    cy.intercept('DELETE', '/cruise/activities/react-created-activity', req => {
      reactItineraryDays[0].activitySchedule = reactItineraryDays[0].activitySchedule.filter(activity => activity.id !== 'react-created-activity')
      req.reply({ statusCode: 200, body: { deleted: true } })
    }).as('deleteReactItineraryActivity')

    cy.getByTestId('react-fleet-search').type('Royal')
    cy.getByTestId('react-view-ships-button').first().click()
    cy.wait('@loadReactShips')
    cy.getByTestId('react-ship-card').should('have.length', 2)

    cy.getByTestId('react-create-ship-name-input').type(' React Test Ship ')
    cy.getByTestId('react-create-ship-current-port-input').type(' Tampa ')
    cy.getByTestId('react-create-ship-submit-button').click()
    cy.wait('@createReactShip')
    cy.getByTestId('react-ship-action-message').should('contain.text', 'React Test Ship was added')
    cy.getByTestId('react-ship-card').should('have.length', 3)

    cy.getByTestId('react-update-ship-button').first().click()
    cy.getByTestId('react-ship-edit-form').should('be.visible')
    cy.getByTestId('react-edit-ship-name').clear().type(' React Wonder Updated ')
    cy.getByTestId('react-edit-ship-current-port').clear().type(' Nassau ')
    cy.getByTestId('react-save-ship-edit').click()
    cy.wait('@updateReactShip')
    cy.getByTestId('react-ship-action-message').should('contain.text', 'React Wonder Updated was updated')
    cy.getByTestId('react-ship-card').first().should('contain.text', 'React Wonder Updated')

    cy.getByTestId('react-view-sailings-button').first().click()
    cy.wait('@loadReactSailings')
    cy.getByTestId('react-sailings-panel').should('be.visible')
    cy.getByTestId('react-create-sailing-form').should('be.visible')
    cy.getByTestId('react-create-sailing-departure-date').type('2026-11-02')
    cy.getByTestId('react-create-sailing-departure-port').type('Tampa')
    cy.getByTestId('react-create-sailing-arrival-port').type('Cozumel')
    cy.getByTestId('react-create-sailing-days').type('5')
    cy.getByTestId('react-create-sailing-repositioning').check()
    cy.getByTestId('react-create-sailing-submit-button').click()
    cy.wait('@createReactSailing')
    cy.wait('@loadReactSailings')
    cy.getByTestId('react-sailing-action-message').should('contain.text', '2026-11-02 sailing was created')
    cy.getByTestId('react-sailing-card').should('have.length', 2)

    cy.getByTestId('react-update-sailing-button').first().click()
    cy.getByTestId('react-sailing-edit-form').should('be.visible')
    cy.getByTestId('react-edit-sailing-departure-date').clear().type('2026-12-03')
    cy.getByTestId('react-edit-sailing-departure-port').clear().type('Port Canaveral')
    cy.getByTestId('react-edit-sailing-arrival-port').clear().type('Key West')
    cy.getByTestId('react-edit-sailing-days').clear().type('3')
    cy.getByTestId('react-edit-sailing-repositioning').should('not.be.checked')
    cy.getByTestId('react-save-sailing-edit').click()
    cy.wait('@updateReactSailing')
    cy.wait('@loadReactSailings')
    cy.getByTestId('react-sailing-action-message').should('contain.text', '2026-12-03 sailing was updated')
    cy.getByTestId('react-sailing-card').first().should('contain.text', '2026-12-03')

    cy.getByTestId('react-delete-sailing-button').last().click()
    cy.getByTestId('react-fleet-delete-confirmation').should('contain.text', 'Delete sailing 2026-11-02?')
    cy.getByTestId('react-fleet-delete-confirmation-confirm').scrollIntoView().click()
    cy.wait('@deleteReactSailing')
    cy.wait('@loadReactSailings')
    cy.getByTestId('react-sailing-action-message').should('contain.text', '2026-11-02 sailing was deleted')
    cy.getByTestId('react-sailing-card').should('have.length', 1)

    cy.getByTestId('react-sailing-card').first().should('contain.text', '2026-12-03')
    cy.getByTestId('react-sailing-card').first().should('contain.text', 'Round-Trip / Regional Sailing')
    cy.getByTestId('react-view-itinerary-button').first().click()
    cy.wait('@loadReactItinerary')
    cy.getByTestId('react-itinerary-panel').should('be.visible')
    cy.getByTestId('react-itinerary-day-card').should('have.length', 2)
    cy.getByTestId('react-itinerary-activity').should('have.length', 3)
    cy.getByTestId('react-itinerary-panel').should('contain.text', 'Embarkation Day')
    cy.getByTestId('react-itinerary-panel').should('contain.text', 'Sail away celebration')

    cy.getByTestId('react-create-itinerary-day-number').type('3')
    cy.getByTestId('react-create-itinerary-day-title').type('React Sea Day')
    cy.getByTestId('react-create-itinerary-day-port').type('At Sea')
    cy.getByTestId('react-create-itinerary-day-submit-button').click()
    cy.wait('@createReactItineraryDay')
    cy.wait('@loadReactItinerary')
    cy.getByTestId('react-itinerary-action-message').should('contain.text', 'Day 3 was created')
    cy.getByTestId('react-itinerary-day-card').should('have.length', 3)

    cy.getByTestId('react-create-itinerary-activity-day-select').select('react-day-1')
    cy.getByTestId('react-create-itinerary-activity-time').type('7:30 PM')
    cy.getByTestId('react-create-itinerary-activity-name').type('React Dinner Show')
    cy.getByTestId('react-create-itinerary-activity-submit-button').click()
    cy.wait('@createReactItineraryActivity')
    cy.wait('@loadReactItinerary')
    cy.getByTestId('react-itinerary-action-message').should('contain.text', 'React Dinner Show was added')
    cy.getByTestId('react-itinerary-panel').should('contain.text', 'React Dinner Show')

    cy.getByTestId('react-update-itinerary-day-button').first().click()
    cy.getByTestId('react-itinerary-day-edit-form').should('be.visible')
    cy.getByTestId('react-edit-itinerary-day-number').clear().type('1')
    cy.getByTestId('react-edit-itinerary-day-title').clear().type('React Embarkation Updated')
    cy.getByTestId('react-edit-itinerary-day-port').clear().type('Miami Updated')
    cy.getByTestId('react-save-itinerary-day-edit').click()
    cy.wait('@updateReactItineraryDay')
    cy.wait('@loadReactItinerary')
    cy.getByTestId('react-itinerary-action-message').should('contain.text', 'Day 1 was updated')
    cy.getByTestId('react-itinerary-panel').should('contain.text', 'React Embarkation Updated')

    cy.getByTestId('react-update-itinerary-activity-button').first().click()
    cy.getByTestId('react-itinerary-activity-edit-form').should('be.visible')
    cy.getByTestId('react-edit-itinerary-activity-time').clear().type('8:00 AM')
    cy.getByTestId('react-edit-itinerary-activity-name').clear().type('React Terminal Arrival Updated')
    cy.getByTestId('react-save-itinerary-activity-edit').click()
    cy.wait('@updateReactItineraryActivity')
    cy.wait('@loadReactItinerary')
    cy.getByTestId('react-itinerary-action-message').should('contain.text', 'React Terminal Arrival Updated was updated')
    cy.getByTestId('react-itinerary-panel').should('contain.text', 'React Terminal Arrival Updated')

    cy.getByTestId('react-itinerary-day-card')
      .first()
      .find('[data-testid="react-delete-itinerary-activity-button"]')
      .last()
      .click()
    cy.getByTestId('react-fleet-delete-confirmation').should('contain.text', 'Delete activity React Dinner Show?')
    cy.getByTestId('react-fleet-delete-confirmation-confirm').scrollIntoView().click()
    cy.wait('@deleteReactItineraryActivity')
    cy.wait('@loadReactItinerary')
    cy.getByTestId('react-itinerary-action-message').should('contain.text', 'React Dinner Show was deleted')
    cy.getByTestId('react-itinerary-day-grid').should('not.contain.text', 'React Dinner Show')

    cy.getByTestId('react-itinerary-day-card').last().find('[data-testid="react-delete-itinerary-day-button"]').click()
    cy.getByTestId('react-fleet-delete-confirmation').should('contain.text', 'Delete itinerary day 3?')
    cy.getByTestId('react-fleet-delete-confirmation-confirm').scrollIntoView().click()
    cy.wait('@deleteReactItineraryDay')
    cy.wait('@loadReactItinerary')
    cy.getByTestId('react-itinerary-action-message').should('contain.text', 'Day 3 was deleted')
    cy.getByTestId('react-itinerary-day-card').should('have.length', 2)

    cy.getByTestId('react-delete-ship-button').eq(1).click()
    cy.getByTestId('react-fleet-delete-confirmation').should('contain.text', 'Delete React Utopia?')
    cy.getByTestId('react-fleet-delete-confirmation-confirm').scrollIntoView().click()
    cy.wait('@deleteReactShip')
    cy.getByTestId('react-ship-action-message').should('contain.text', 'React Utopia was deleted')
    cy.getByTestId('react-ship-card').should('have.length', 2)
  })

  it('runs a React SQA health check and writes output', () => {
    cy.getByTestId('react-active-route-operations').should('be.visible')
    cy.getByTestId('react-sqa-health-button').scrollIntoView().click()
    cy.getByTestId('react-sqa-output').should('contain.text', 'Health Check Result')
    cy.getByTestId('react-sqa-output').should('contain.text', '"passed": true')
  })
})
