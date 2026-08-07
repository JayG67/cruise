const { byTestId, reactSelectorKeys: rs } = require('./support/reactSelectors')
const {
  openFirstReactFleetShips,
  openFirstReactSailingItinerary,
  openFirstReactShipSailings,
  reactBookings,
  reactCruiseLines,
  reactCustomers,
  reactItinerary,
  reactSailings,
  reactShips,
  selectDemoUserByVisibleRole,
  visitReactAppAsAdmin
} = require('./support/reactTestHelpers.js')

const royalCaribbeanId = reactCruiseLines[0].id
const workflowPassengerSailing = {
  id: 'sailing-portfolio-soup-to-nuts',
  shipId: reactShips[0].id,
  departureDate: '2027-05-16',
  departurePort: 'Miami, Florida',
  arrivalPort: 'CocoCay',
  days: 4,
  isRepositioning: false
}

function loadPassengerTripOptions() {
  cy.intercept('GET', `/cruise/ships/${royalCaribbeanId}`, reactShips).as('workflowBookingShips')
  cy.intercept('GET', `/cruise/ship/${reactShips[0].id}/sailings`, [workflowPassengerSailing]).as('workflowBookingSailings')

  cy.getByTestId(rs.bookingCruiseLineSelect).select('Royal Caribbean International')
  cy.wait('@workflowBookingShips')
  cy.getByTestId(rs.bookingShipSelect).select('React Icon')
  cy.wait('@workflowBookingSailings')
  cy.getByTestId(rs.bookingSailingSelect).select(workflowPassengerSailing.id)
}

function assertCoreAdminWorkspacesAreUsable() {
  cy.getByTestId(rs.platformOverviewCommandCenter).should('be.visible')
  cy.getByTestId(rs.roleSelector).should('be.visible')
  cy.getByTestId(rs.activeRouteOperations).should('be.visible')
  cy.getByTestId(rs.fleetDirectory).should('be.visible')
  cy.getByTestId(rs.operationsIntelligenceCenter).should('be.visible')
}

describe('Platform end-to-end workflow journeys', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('walks the platform workspace navigator through every live application workspace', () => {
    cy.getByTestId(rs.heroDemoButton).click()
    cy.getByTestId(rs.platformOverviewCommandCenter)
      .should('be.visible')
      .and('contain.text', 'Operational workspaces and platform capabilities')
    cy.getByTestId(rs.platformOverviewWorkspaceGrid).should('be.visible')
    cy.getByTestId(rs.platformOverviewMetricsGrid).should('be.visible')
    cy.getByTestId(rs.platformOverviewWorkspaceStep)
      .should('have.length.at.least', 4)
      .and('contain.text', 'Open roles')
      .and('contain.text', 'Open fleet')

    cy.getByTestId(rs.workspaceRoleButton).click()
    cy.getByTestId(rs.roleSelector).should('be.visible')
    cy.getByTestId(rs.workspaceOperationsButton).click()
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.workspaceFleetButton).click()
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.workspaceIntelligenceButton).click()
    cy.getByTestId(rs.operationsIntelligenceCenter).should('be.visible')

    assertCoreAdminWorkspacesAreUsable()
  })

  it('completes an admin data setup journey from cruise line to ship, sailing, and itinerary proof', () => {
    cy.intercept('POST', '/cruise/cruise-line', req => {
      expect(req.body).to.deep.equal({
        name: 'Portfolio Demo Cruise Line',
        country: 'United States',
        website: 'https://portfolio-demo.example.com',
        brandFamily: 'Portfolio Holdings',
        brandTheme: 'Showcase Innovation',
        marketPositioning: 'Employer demo operations cruise line'
      })
      req.reply({ statusCode: 201, body: { id: 'portfolio-demo-line', ...req.body } })
    }).as('portfolioCreateCruiseLine')
    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body).to.include({
        cruiseLineId: 'portfolio-demo-line',
        name: 'Portfolio Demo Ship',
        currentPort: 'Miami'
      })
      req.reply({ statusCode: 201, body: { id: 'portfolio-demo-ship', ...req.body } })
    }).as('portfolioCreateStarterShip')
    cy.intercept('GET', '/cruise', [...reactCruiseLines, {
      id: 'portfolio-demo-line',
      name: 'Portfolio Demo Cruise Line',
      country: 'United States',
      website: 'https://portfolio-demo.example.com',
      brandFamily: 'Portfolio Holdings',
      brandTheme: 'Showcase Innovation',
      marketPositioning: 'Employer demo operations cruise line'
    }]).as('portfolioReloadCruiseLines')

    cy.getByTestId(rs.createCruiseLineName).type('Portfolio Demo Cruise Line')
    cy.getByTestId(rs.createCruiseLineCountry).type('United States')
    cy.getByTestId(rs.createCruiseLineWebsite).type('https://portfolio-demo.example.com')
    cy.getByTestId(rs.createCruiseLineBrandFamily).type('Portfolio Holdings')
    cy.getByTestId(rs.createCruiseLineBrandTheme).type('Showcase Innovation')
    cy.getByTestId(rs.createCruiseLineMarketPositioning).type('Employer demo operations cruise line')
    cy.getByTestId(rs.createShipName).should('not.be.disabled').type('Portfolio Demo Ship')
    cy.getByTestId(rs.createShipPort).type('Miami')
    cy.getByTestId(rs.saveCruiseLine).click()
    cy.wait('@portfolioCreateCruiseLine')
    cy.wait('@portfolioCreateStarterShip')
    cy.wait('@portfolioReloadCruiseLines')
    cy.getByTestId(rs.createCruiseLineMessage).should('contain.text', 'Portfolio Demo Cruise Line created successfully')

    openFirstReactFleetShips()
    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body).to.include({
        cruiseLineId: reactCruiseLines[0].id,
        name: 'Portfolio Operations Ship',
        currentPort: 'Port Canaveral'
      })
      req.reply({ statusCode: 201, body: { id: 'portfolio-operations-ship', ...req.body } })
    }).as('portfolioCreateShip')
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, [...reactShips, {
      id: 'portfolio-operations-ship',
      cruiseLineId: reactCruiseLines[0].id,
      name: 'Portfolio Operations Ship',
      currentPort: 'Port Canaveral'
    }]).as('portfolioReloadShips')

    cy.getByTestId(rs.createShipNameInput).type('Portfolio Operations Ship')
    cy.getByTestId(rs.createShipCurrentPortInput).type('Port Canaveral')
    cy.getByTestId(rs.createShipSubmitButton).click()
    cy.wait('@portfolioCreateShip')
    cy.wait('@portfolioReloadShips')
    cy.getByTestId(rs.shipActionMessage)
      .should('contain.text', 'Portfolio Operations Ship')
      .and('contain.text', 'was added')
    cy.getByTestId(rs.shipCard).should('contain.text', 'Portfolio Operations Ship')

    openFirstReactShipSailings()
    cy.intercept('POST', `/cruise/ship/${reactShips[0].id}/sailings`, req => {
      expect(req.body).to.include({
        departureDate: '2027-06-19',
        departurePort: 'Miami',
        arrivalPort: 'CocoCay',
        days: 4,
        isRepositioning: false
      })
      req.reply({ statusCode: 201, body: { id: 'portfolio-created-sailing', ...req.body } })
    }).as('portfolioCreateSailing')
    cy.intercept('GET', `/cruise/ship/${reactShips[0].id}/sailings`, [...reactSailings, {
      id: 'portfolio-created-sailing',
      shipId: reactShips[0].id,
      departureDate: '2027-06-19',
      departurePort: 'Miami',
      arrivalPort: 'CocoCay',
      days: 4,
      isRepositioning: false
    }]).as('portfolioReloadSailings')

    cy.getByTestId(rs.createSailingDepartureDate).type('2027-06-19')
    cy.getByTestId(rs.createSailingDeparturePort).type('Miami')
    cy.getByTestId(rs.createSailingArrivalPort).type('CocoCay')
    cy.getByTestId(rs.createSailingDays).type('4')
    cy.getByTestId(rs.createSailingSubmitButton).click()
    cy.wait('@portfolioCreateSailing')
    cy.wait('@portfolioReloadSailings')
    cy.getByTestId(rs.sailingActionMessage).should('contain.text', 'sailing was created')
    cy.getByTestId(rs.sailingCard).should('contain.text', '2027-06-19')

    openFirstReactSailingItinerary()
    cy.intercept('POST', `/cruise/sailings/${reactSailings[0].id}/itinerary`, req => {
      expect(req.body).to.include({ day: 3, title: 'Portfolio Sea Day', port: 'At Sea' })
      req.reply({ statusCode: 201, body: { id: 'portfolio-itinerary-day', ...req.body, activities: [] } })
    }).as('portfolioCreateItineraryDay')
    cy.intercept('POST', `/cruise/itinerary-days/${reactItinerary[0].id}/activities`, req => {
      expect(req.body).to.include({ time: '03:30 PM', activity: 'Portfolio demo showcase' })
      req.reply({ statusCode: 201, body: { id: 'portfolio-itinerary-activity', ...req.body } })
    }).as('portfolioCreateItineraryActivity')
    cy.intercept('GET', `/cruise/sailings/${reactSailings[0].id}/itinerary`, reactItinerary).as('portfolioReloadItinerary')

    cy.getByTestId(rs.createItineraryDayNumber).type('3')
    cy.getByTestId(rs.createItineraryDayTitle).type('Portfolio Sea Day')
    cy.getByTestId(rs.createItineraryDayPort).type('At Sea')
    cy.getByTestId(rs.createItineraryDaySubmitButton).click()
    cy.wait('@portfolioCreateItineraryDay')
    cy.getByTestId(rs.itineraryActionMessage)
      .should('contain.text', 'Day 3')
      .and('contain.text', 'was created')

    cy.getByTestId(rs.createItineraryActivityDaySelect).select(reactItinerary[0].id)
    cy.getByTestId(rs.createItineraryActivityTime).type('03:30 PM')
    cy.getByTestId(rs.createItineraryActivityName).type('Portfolio demo showcase')
    cy.getByTestId(rs.createItineraryActivitySubmitButton).click()
    cy.wait('@portfolioCreateItineraryActivity')
    cy.getByTestId(rs.itineraryActionMessage)
      .should('contain.text', 'Portfolio demo showcase')
      .and('contain.text', 'was added')
  })

  it('completes passenger self-service booking from search to verified booking card, then proves group visibility', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.passengerSelfServicePanel).should('be.visible')
    cy.getByTestId(rs.passengerBookingWorkflow).should('be.visible')

    const newPassengerBooking = {
      id: 'BPORTFOLIO1',
      bookingStatus: 'REQUESTED',
      cabinNumber: 'To be assigned',
      fareCode: 'BALCONY',
      embarkationPort: workflowPassengerSailing.departurePort,
      debarkationPort: workflowPassengerSailing.arrivalPort,
      createdByCustomerId: reactCustomers[0].id,
      cruiseLine: { name: 'Royal Caribbean International' },
      ship: { name: 'React Icon' },
      sailing: { departureDate: workflowPassengerSailing.departureDate, itinerary: reactItinerary },
      passengers: [{
        customerId: reactCustomers[0].id,
        passengerType: 'Primary',
        diningPreference: 'Anytime dining',
        accessibilityNotes: '',
        customer: reactCustomers[0]
      }]
    }

    cy.intercept('POST', '/cruise/bookings', req => {
      expect(req.body).to.include({
        sailingId: workflowPassengerSailing.id,
        bookingStatus: 'REQUESTED',
        fareCode: 'BALCONY',
        embarkationPort: workflowPassengerSailing.departurePort,
        debarkationPort: workflowPassengerSailing.arrivalPort
      })
      expect(req.body.passengers).to.have.length(1)
      req.reply({ statusCode: 201, body: { message: 'Booking created successfully', id: newPassengerBooking.id } })
    }).as('portfolioCreatePassengerBooking')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('portfolioReloadCustomersAfterBooking')
    cy.intercept('GET', '/cruise/bookings', [...reactBookings, newPassengerBooking]).as('portfolioReloadBookingsAfterBooking')

    loadPassengerTripOptions()
    cy.getByTestId(rs.bookingDestinationSearch).type('Coco')
    cy.getByTestId(rs.bookingDeparturePortSearch).type('Miami')
    cy.getByTestId(rs.bookingDurationFilter).select('4')
    cy.getByTestId(rs.bookingSubmitButton).click()
    cy.wait('@portfolioCreatePassengerBooking')
    cy.wait('@portfolioReloadCustomersAfterBooking')
    cy.wait('@portfolioReloadBookingsAfterBooking')
    cy.getByTestId(rs.bookingStatusMessage)
      .should('contain.text', 'Booking request')
      .and('contain.text', 'created for Royal Caribbean International on React Icon')
    cy.getByTestId(rs.roleBookingCard).should('contain.text', 'BPORTFOLIO1')

    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId(rs.passengerDashboard).should('contain.text', 'Group leader dashboard loaded')
    cy.getByTestId(rs.roleBookingCard)
      .should('have.length', 1)
      .and('contain.text', reactBookings[1].id)
      .and('not.contain.text', reactBookings[0].id)
      .and('not.contain.text', 'BPORTFOLIO1')
  })

  it('drives turnaround operations from admin setup through role execution and readiness evidence', () => {
    cy.getByTestId(rs.turnaroundAdminSetup).should('be.visible')
    cy.wait('@reactTurnaroundAdminSetup')

    const managerName = `Portfolio Turnaround Manager ${Date.now()}`
    cy.getByTestId(rs.turnaroundAdminPersonForm).within(() => {
      cy.getByTestId(rs.turnaroundAdminPersonNameInput).type(managerName)
      cy.getByTestId(rs.turnaroundAdminPersonRoleSelect).select('turnaround-manager')
      cy.getByTestId(rs.turnaroundAdminPersonCruiseLineSelect).select('Royal Caribbean International')
      cy.getByTestId(rs.turnaroundAdminPersonShipSelect).select('React Icon')
      cy.getByTestId(rs.turnaroundAdminPersonSailingSelect).select('2026-12-12 · Miami, Florida')
      cy.getByTestId(rs.turnaroundAdminPersonSubmitButton).click()
    })
    cy.wait('@reactCreateTurnaroundPerson')
    cy.getByTestId(rs.turnaroundAdminRoster).should('contain.text', managerName)

    selectDemoUserByVisibleRole('Turnaround Manager')
    cy.wait('@reactTurnaroundOperations')
    cy.getByTestId(rs.turnaroundManagerDashboard).should('be.visible')
    cy.getByTestId(rs.operationsLifecycleState).should('be.visible')
    cy.getByTestId(rs.operationsPresentationGuide).should('not.exist')

    cy.getByTestId(rs.operationalReadinessCard).first().within(() => {
      cy.get('select[aria-label$="command status"]').select('IN_PROGRESS')
      cy.get('textarea[aria-label$="command notes"]').clear().type('End-to-end command huddle is live and department leads are aligned.')
      cy.contains('button', 'Save command plan').click()
    })
    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround command plan updated successfully')

    selectDemoUserByVisibleRole('Housekeeping Lead', 'Maria Rodriguez')
    cy.wait('@reactTurnaroundOperations')
    cy.getByTestId(rs.housekeepingLeadDashboard).should('be.visible')
    cy.contains(`${byTestId('operationalRoleChecklist')} li`, 'Prioritize cabin strip and reset windows').within(() => {
      cy.contains('button', 'Complete').click()
    })
    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround task status updated successfully')

    cy.contains(`${byTestId('operationalRoleChecklist')} li`, 'Prioritize cabin strip and reset windows').within(() => {
      cy.get('input[aria-label$="owner"]').clear().type('Maria Rodriguez')
      cy.get('input[aria-label$="due time"]').clear().type('10:35')
      cy.get('input[aria-label$="location"]').clear().type('Deck 9 cabin zone')
      cy.get('input[aria-label$="blocker reason"]').clear()
      cy.contains('button', 'Save task details').click()
    })
    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround task details updated successfully')

    cy.getByTestId(rs.operationalReadinessCard).first().within(() => {
      cy.get('input[aria-label$="staffing lead"]').clear().type('Maria Rodriguez')
      cy.get('input[aria-label$="staffing muster location"]').clear().type('Portfolio cabin command desk')
      cy.contains('button', 'Save staffing plan').click()
    })
    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround staffing plan updated successfully')

    cy.getByTestId(rs.operationalReadinessCard).first().within(() => {
      cy.get('select[aria-label$="readiness signoff status"]').select('APPROVED')
      cy.get('input[aria-label$="readiness approver"]').clear().type('Maria Rodriguez')
      cy.contains('button', 'Save readiness signoff').click()
    })
    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround readiness signoff updated successfully')

    selectDemoUserByVisibleRole('Engineering Lead', 'David Torres')
    cy.wait('@reactTurnaroundOperations')
    cy.getByTestId(rs.engineeringLeadDashboard).should('be.visible')
    cy.contains(`${byTestId('operationalRoleChecklist')} li`, 'Confirm shore power, fuel, potable water, and waste windows').within(() => {
      cy.contains('button', 'Complete').click()
    })
    cy.getByTestId(rs.operationalMutationStatus).should('contain.text', 'Turnaround task status updated successfully')

    cy.getByTestId(rs.operationsLifecycleState).should('be.visible')
    cy.getByTestId(rs.operationsLifecyclePhaseAction).should('have.length.greaterThan', 0)
    cy.getByTestId(rs.operationsLifecycleBlockerAction).first().click()
    cy.getByTestId(rs.operationsWorkspaceActiveSummary).should('be.visible')
  })

  it('finishes with actionable intelligence and continues into the operational workflow', () => {
    cy.getByTestId(rs.workspaceIntelligenceButton).click()
    cy.getByTestId(rs.operationsIntelligenceCenter).should('be.visible')
    cy.getByTestId(rs.operationsIntelligenceDetail)
      .should('contain.text', 'Priority actions')
      .and('contain.text', 'staffing')

    cy.getByTestId(rs.operationsIntelligenceRoleButton).click()
    selectDemoUserByVisibleRole('Turnaround Manager', 'Alex Turner')
    cy.getByTestId(rs.operationalTurnaroundPanel).should('be.visible')
    cy.getByTestId(rs.operationsWorkspaceAiBriefingButton).click()
    cy.getByTestId(rs.aiBriefingWorkspace).should('be.visible')
  })
})
