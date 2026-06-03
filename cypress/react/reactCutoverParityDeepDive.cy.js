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

describe('React cutover parity deep-dive coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('keeps the product UI free of migration route controls and review-only panels', () => {
    cy.getByTestId('react-migration-route-nav').should('not.exist')
    cy.getByTestId('react-release-readiness-section').should('not.exist')
    cy.getByTestId('react-active-route-evidence-panel').should('not.exist')
    cy.contains('Portfolio evidence for cruise-line software engineering roles').should('not.exist')
    cy.contains('Cruise operations command center').should('not.exist')
  })

  it('drives every primary workspace button to a working application area', () => {
    cy.getByTestId('react-workspace-role-button').click()
    cy.getByTestId('react-role-selector').should('be.visible')

    cy.getByTestId('react-workspace-operations-button').click()
    cy.getByTestId('react-active-route-operations').should('be.visible')

    cy.getByTestId('react-workspace-fleet-button').click()
    cy.getByTestId('react-fleet-directory').should('be.visible')

    cy.getByTestId('react-workspace-quality-button').click()
    cy.getByTestId('react-sqa-console').should('be.visible')
  })

  it('keeps the product hero focused on the React app and SQA console', () => {
    cy.getByTestId('react-production-hero').within(() => {
      cy.contains('Open SQA Console').should('have.attr', 'href', '#react-quality')
      cy.contains('Open Legacy DOM App').should('not.exist')
    })
    cy.getByTestId('react-workspace-quality-button').click()
    cy.getByTestId('react-sqa-console').should('be.visible')
  })

  it('removes passenger detail state when returning to admin operations', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-role-booking-card').first().within(() => {
      cy.getByTestId('react-role-booking-details-toggle').click()
      cy.getByTestId('react-role-booking-details').should('be.visible')
    })

    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId('react-role-booking-details').should('not.exist')
    cy.getByTestId('react-active-route-operations').should('be.visible')
    cy.getByTestId('react-sqa-console').should('be.visible')
  })

  it('limits the group leader dashboard to group-visible bookings and manifest rows', () => {
    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId('react-passenger-dashboard')
      .should('contain.text', 'Group leader dashboard loaded with passenger-manifest visibility.')
    cy.get('#react-role-dashboard-heading').should('contain.text', 'Group booking dashboard')
    cy.getByTestId('react-role-booking-card').should('have.length', 1)
    cy.getByTestId('react-role-booking-card').first()
      .should('contain.text', 'react-booking-2')
      .and('contain.text', 'Group Leader')
      .and('not.contain.text', 'react-booking-1')

    cy.getByTestId('react-role-booking-details-toggle').click()
    cy.getByTestId('react-role-detail-passenger-row').should('contain.text', 'Morgan Leader')
  })

  it('cancels ship deletion without calling the API or losing selected fleet context', () => {
    openFirstReactFleetShips()
    cy.intercept('DELETE', `/cruise/ship/${reactShips[0].id}`).as('shipDeleteShouldNotRun')

    cy.getByTestId('react-ship-card').first().within(() => {
      cy.getByTestId('react-delete-ship-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation').should('contain.text', 'React Icon')
    cy.getByTestId('react-fleet-delete-confirmation-cancel').click()
    cy.getByTestId('react-fleet-delete-confirmation').should('not.exist')
    cy.get('@shipDeleteShouldNotRun.all').should('have.length', 0)
    cy.getByTestId('react-selected-ships-panel').should('contain.text', 'Royal Caribbean International')
    cy.getByTestId('react-ship-card').should('have.length', 2)
  })

  it('deletes a sailing through confirmation and refreshes the selected ship sailings', () => {
    openFirstReactFleetShips()
    openFirstReactShipSailings()

    cy.intercept('DELETE', `/cruise/sailings/${reactSailings[0].id}`, {
      statusCode: 200,
      body: { message: 'Sailing deleted successfully' }
    }).as('deleteReactSailing')
    cy.intercept('GET', `/cruise/ship/${reactShips[0].id}/sailings`, [reactSailings[1]]).as('reloadReactSailingsAfterDelete')

    cy.getByTestId('react-sailing-card').first().within(() => {
      cy.getByTestId('react-delete-sailing-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation-confirm').click()
    cy.wait('@deleteReactSailing')
    cy.wait('@reloadReactSailingsAfterDelete')
    cy.getByTestId('react-sailing-card').should('have.length', 1).and('contain.text', reactSailings[1].departureDate)
  })

  it('cancels itinerary activity deletion before the destructive request is sent', () => {
    openFirstReactFleetShips()
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()

    cy.intercept('DELETE', `/cruise/activities/${reactItinerary[0].activitySchedule[0].id}`).as('activityDeleteShouldNotRun')
    cy.getByTestId('react-itinerary-activity').first().within(() => {
      cy.getByTestId('react-delete-itinerary-activity-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation').should('contain.text', 'Terminal arrival')
    cy.getByTestId('react-fleet-delete-confirmation-cancel').click()
    cy.get('@activityDeleteShouldNotRun.all').should('have.length', 0)
    cy.getByTestId('react-itinerary-activity').should('have.length', 3)
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

    cy.getByTestId('react-itinerary-activity').first().within(() => {
      cy.getByTestId('react-delete-itinerary-activity-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation-confirm').click()
    cy.wait('@deleteReactActivity')
    cy.wait('@reloadReactItineraryAfterActivityDelete')
    cy.getByTestId('react-itinerary-activity').should('have.length', 2)
    cy.getByTestId('react-itinerary-activity').should('not.contain.text', 'Terminal arrival')
  })

  it('keeps SQA reset confirmation explicit and refreshes app data after success', () => {
    cy.intercept('POST', '/admin/reset-demo-data', {
      statusCode: 200,
      body: { message: 'Demo data reset successfully' }
    }).as('resetDemoData')
    cy.intercept('GET', '/cruise/customers', []).as('reloadCustomersAfterReset')
    cy.intercept('GET', '/cruise/bookings', []).as('reloadBookingsAfterReset')
    cy.intercept('GET', '/cruise', []).as('reloadCruiseLinesAfterReset')

    cy.getByTestId('react-sqa-reset-demo-data-button').click()
    cy.getByTestId('react-sqa-reset-confirmation').should('be.visible')
    cy.getByTestId('react-sqa-reset-confirmation-confirm').click()
    cy.wait('@resetDemoData')
    cy.wait('@reloadCustomersAfterReset')
    cy.wait('@reloadBookingsAfterReset')
    cy.wait('@reloadCruiseLinesAfterReset')
    cy.getByTestId('react-sqa-output').should('contain.text', 'Demo Data Recovery Result')
    cy.getByTestId('react-sqa-status').should('contain.text', 'Ready for validation')
  })
})
