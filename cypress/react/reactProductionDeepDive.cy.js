const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const {
  openFirstReactFleetShips,
  openFirstReactSailingItinerary,
  openFirstReactShipSailings,
  reactItinerary,
  reactSailings,
  reactShips,
  selectDemoUserByVisibleRole,
  visitReactAppAsAdmin
} = require('./support/reactTestHelpers.js')

describe('React production deep-dive coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('keeps the product UI free of implementation-history route controls and review-only panels', () => {
    cy.getByTestId(rs.retiredRouteNav).should('not.exist')
    cy.getByTestId(rs.releaseReadinessSection).should('not.exist')
    cy.getByTestId(rs.activeRouteEvidencePanel).should('not.exist')
    cy.contains('Portfolio evidence for cruise-line software engineering roles').should('not.exist')
    cy.contains('Cruise operations command center').should('not.exist')
  })

  it('drives every primary workspace button to a working application area', () => {
    cy.getByTestId(rs.workspaceRoleButton).click()
    cy.getByTestId(rs.roleSelector).should('be.visible')

    cy.getByTestId(rs.workspaceOperationsButton).click()
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')

    cy.getByTestId(rs.workspaceFleetButton).click()
    cy.getByTestId(rs.fleetDirectory).should('be.visible')

    cy.getByTestId(rs.workspaceQualityButton).click()
    cy.getByTestId(rs.sqaConsole).should('be.visible')
  })

  it('keeps the product hero focused on the React app and quality console', () => {
    cy.getByTestId(rs.productionHero).within(() => {
      cy.getByTestId(rs.heroQualityButton).should('contain.text', 'Open Quality Console')
      cy.contains('Open Retired Pre-React App').should('not.exist')
    })
    cy.getByTestId(rs.workspaceQualityButton).click()
    cy.getByTestId(rs.sqaConsole).should('be.visible')
  })

  it('removes passenger detail state when returning to admin operations', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.roleBookingCard).first().within(() => {
      cy.getByTestId(rs.roleBookingDetailsToggle).click()
      cy.getByTestId(rs.roleBookingDetails).should('be.visible')
    })

    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId(rs.roleBookingDetails).should('not.exist')
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.sqaConsole).should('be.visible')
  })

  it('limits the group leader dashboard to group-visible bookings and manifest rows', () => {
    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId(rs.passengerDashboard)
      .should('contain.text', 'Group leader dashboard loaded with passenger-manifest visibility.')
    cy.get('#react-role-dashboard-heading').should('contain.text', 'Group booking dashboard')
    cy.getByTestId(rs.roleBookingCard).should('have.length', 1)
    cy.getByTestId(rs.roleBookingCard).first()
      .should('contain.text', 'react-booking-2')
      .and('contain.text', 'Group Leader')
      .and('not.contain.text', 'react-booking-1')

    cy.getByTestId(rs.roleBookingDetailsToggle).click()
    cy.getByTestId(rs.roleDetailPassengerRow).should('contain.text', 'Morgan Leader')
  })

  it('cancels ship deletion without calling the API or losing selected fleet context', () => {
    openFirstReactFleetShips()
    cy.intercept('DELETE', `/cruise/ship/${reactShips[0].id}`).as('shipDeleteShouldNotRun')

    cy.getByTestId(rs.shipCard).first().within(() => {
      cy.getByTestId(rs.deleteShipButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmation).should('contain.text', 'React Icon')
    cy.getByTestId(rs.fleetDeleteConfirmationCancel).click()
    cy.getByTestId(rs.fleetDeleteConfirmation).should('not.exist')
    cy.get('@shipDeleteShouldNotRun.all').should('have.length', 0)
    cy.getByTestId(rs.selectedShipsPanel).should('contain.text', 'Royal Caribbean International')
    cy.getByTestId(rs.shipCard).should('have.length', 2)
  })

  it('deletes a sailing through confirmation and refreshes the selected ship sailings', () => {
    openFirstReactFleetShips()
    openFirstReactShipSailings()

    cy.intercept('DELETE', `/cruise/sailings/${reactSailings[0].id}`, {
      statusCode: 200,
      body: { message: 'Sailing deleted successfully' }
    }).as('deleteReactSailing')
    cy.intercept('GET', `/cruise/ship/${reactShips[0].id}/sailings`, [reactSailings[1]]).as('reloadReactSailingsAfterDelete')

    cy.getByTestId(rs.sailingCard).first().within(() => {
      cy.getByTestId(rs.deleteSailingButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmationConfirm).click()
    cy.wait('@deleteReactSailing')
    cy.wait('@reloadReactSailingsAfterDelete')
    cy.getByTestId(rs.sailingCard).should('have.length', 1).and('contain.text', reactSailings[1].departureDate)
  })

  it('cancels itinerary activity deletion before the destructive request is sent', () => {
    openFirstReactFleetShips()
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()

    cy.intercept('DELETE', `/cruise/activities/${reactItinerary[0].activitySchedule[0].id}`).as('activityDeleteShouldNotRun')
    cy.getByTestId(rs.itineraryActivity).first().within(() => {
      cy.getByTestId(rs.deleteItineraryActivityButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmation).should('contain.text', 'Terminal arrival')
    cy.getByTestId(rs.fleetDeleteConfirmationCancel).click()
    cy.get('@activityDeleteShouldNotRun.all').should('have.length', 0)
    cy.getByTestId(rs.itineraryActivity).should('have.length', 3)
  })

  it('deletes an itinerary activity and reloads the itinerary detail panel', () => {
    openFirstReactFleetShips()
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()

    const updatedItinerary = [
      {
        ...reactItinerary[0],
        activities: reactItinerary[0].activities.slice(1),
        activitySchedule: reactItinerary[0].activitySchedule.slice(1)
      },
      reactItinerary[1]
    ]

    cy.intercept('DELETE', `/cruise/activities/${reactItinerary[0].activitySchedule[0].id}`, {
      statusCode: 200,
      body: { message: 'Activity deleted successfully' }
    }).as('deleteReactActivity')
    cy.intercept('GET', `/cruise/sailings/${reactSailings[0].id}/itinerary`, updatedItinerary).as('reloadReactItineraryAfterActivityDelete')

    cy.getByTestId(rs.itineraryActivity).first().within(() => {
      cy.getByTestId(rs.deleteItineraryActivityButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmationConfirm).click()
    cy.wait('@deleteReactActivity')
    cy.wait('@reloadReactItineraryAfterActivityDelete')
    cy.getByTestId(rs.itineraryActivity).should('have.length', 2)
    cy.getByTestId(rs.itineraryActivity).should('not.contain.text', 'Terminal arrival')
  })

  it('keeps quality reset confirmation explicit and refreshes app data after success', () => {
    cy.intercept('POST', '/admin/reset-demo-data', {
      statusCode: 200,
      body: { message: 'Demo data reset successfully' }
    }).as('resetDemoData')
    cy.intercept('GET', '/cruise/customers', []).as('reloadCustomersAfterReset')
    cy.intercept('GET', '/cruise/bookings', []).as('reloadBookingsAfterReset')
    cy.intercept('GET', '/cruise', []).as('reloadCruiseLinesAfterReset')

    cy.getByTestId(rs.sqaResetDemoDataButton).click()
    cy.getByTestId(rs.sqaResetConfirmation).should('be.visible')
    cy.getByTestId(rs.sqaResetConfirmationConfirm).click()
    cy.wait('@resetDemoData')
    cy.wait('@reloadCustomersAfterReset')
    cy.wait('@reloadBookingsAfterReset')
    cy.wait('@reloadCruiseLinesAfterReset')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Baseline Data Recovery Result')
    cy.getByTestId(rs.sqaStatus).should('contain.text', 'Ready for validation')
  })
})
