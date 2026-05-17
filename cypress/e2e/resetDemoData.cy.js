import { selectors } from '../support/selectors'
import {
  dirtyCruiseLines,
  seedCruiseLines
} from '../support/testData'
import { visitWithDirtyData } from '../support/apiMocks'

const dirtyShip = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  name: 'Dirty Ship',
  currentPort: 'Miami, Florida',
  cruiseLineId: '11111111-1111-1111-1111-111111111111'
}

function mockCruiseReloadAfterReset(resetBody = {}) {
  let cruiseRequestCount = 0

  cy.intercept('GET', '/cruise', (req) => {
    cruiseRequestCount += 1
    req.reply({
      statusCode: 200,
      body: cruiseRequestCount === 1 ? dirtyCruiseLines : seedCruiseLines
    })
  }).as('getCruiseLines')

  cy.intercept('POST', '/admin/reset-demo-data', {
    statusCode: 200,
    body: {
      message: 'Demo data reset successfully',
      cruiseLineCount: seedCruiseLines.length,
      shipCount: 12,
      sailingCount: 60,
      itineraryDayCount: 300,
      activityCount: 900,
      ...resetBody
    }
  }).as('resetDemoData')
}

function confirmReset(shouldConfirm = true) {
  cy.window().then((win) => {
    cy.stub(win, 'confirm').returns(shouldConfirm).as('confirmReset')
  })
}

describe('Reset Demo Data UI', () => {
  it('renders a reset demo data control with explanatory copy', () => {
    visitWithDirtyData()

    cy.get(selectors.testPanel.resetDemoDataButton)
      .should('be.visible')
      .and('contain.text', 'Reset Demo Data')

    cy.get(selectors.testPanel.resetDemoDataNote)
      .should('be.visible')
      .and('contain.text', 'This public demo allows CRUD changes')
      .and('contain.text', 'restore the original seed dataset')
  })

  it('keeps the reset control visible and usable from the SQA panel', () => {
    visitWithDirtyData()

    cy.get(selectors.testPanel.panel).should('be.visible')
    cy.get(selectors.testPanel.actionGrid).should('be.visible')
    cy.get(selectors.testPanel.resetDemoDataButton)
      .should('be.visible')
      .and('not.be.disabled')
    cy.get(selectors.testPanel.resetDemoDataNote)
      .should('contain.text', 'This public demo allows CRUD changes')
      .and('contain.text', 'restore the original seed dataset')
  })

  it('does not call the reset endpoint when the user cancels confirmation', () => {
    visitWithDirtyData()
    confirmReset(false)

    cy.intercept('POST', '/admin/reset-demo-data', {
      statusCode: 200,
      body: { message: 'Should not be called' }
    }).as('resetDemoData')

    cy.get(selectors.testPanel.resetDemoDataButton).click()

    cy.get('@confirmReset').should('have.been.calledOnce')
    cy.get('@resetDemoData.all').should('have.length', 0)
    cy.get(selectors.testPanel.output)
      .should('contain.text', 'Demo Data Reset Cancelled')
      .and('contain.text', '"cancelled": true')

    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Dirty Demo Cruise Line')
  })

  it('does not reload cruise data when the user cancels confirmation', () => {
    visitWithDirtyData()
    confirmReset(false)

    cy.intercept('POST', '/admin/reset-demo-data', {
      statusCode: 200,
      body: { message: 'Should not be called' }
    }).as('resetDemoData')

    cy.get(selectors.testPanel.resetDemoDataButton).click()

    cy.get('@resetDemoData.all').should('have.length', 0)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Dirty Demo Cruise Line')
    cy.get(selectors.cruiseLines.grid).should('not.contain.text', 'Royal Caribbean International')
  })

  it('resets demo data after confirmation and reloads the grid from seed data', () => {
    mockCruiseReloadAfterReset()

    cy.visit('/')
    cy.wait('@getCruiseLines')
    confirmReset(true)

    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Dirty Demo Cruise Line')

    cy.get(selectors.testPanel.resetDemoDataButton).click()
    cy.wait('@resetDemoData')
    cy.wait('@getCruiseLines')

    cy.get('@confirmReset').should('have.been.calledOnce')
    cy.get(selectors.testPanel.output)
      .should('contain.text', 'Demo Data Reset Result')
      .and('contain.text', '"passed": true')
      .and('contain.text', '"statusCode": 200')
      .and('contain.text', '"cruiseLineCount": 2')
      .and('contain.text', '"shipCount": 12')
      .and('contain.text', '"sailingCount": 60')
      .and('contain.text', '"itineraryDayCount": 300')
      .and('contain.text', '"activityCount": 900')

    cy.get(selectors.cruiseLines.grid).should('not.contain.text', 'Dirty Demo Cruise Line')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Royal Caribbean International')
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Showing 2 of 2 cruise lines')
  })

  it('shows the reset endpoint response metadata in the SQA output panel', () => {
    mockCruiseReloadAfterReset({
      cruiseLineCount: 4,
      shipCount: 143,
      sailingCount: 715,
      itineraryDayCount: 3861,
      activityCount: 11583
    })

    cy.visit('/')
    cy.wait('@getCruiseLines')
    confirmReset(true)

    cy.get(selectors.testPanel.resetDemoDataButton).click()
    cy.wait('@resetDemoData')
    cy.wait('@getCruiseLines')

    cy.get(selectors.testPanel.output)
      .should('contain.text', '"cruiseLineCount": 4')
      .and('contain.text', '"shipCount": 143')
      .and('contain.text', '"sailingCount": 715')
      .and('contain.text', '"itineraryDayCount": 3861')
      .and('contain.text', '"activityCount": 11583')
  })

  it('clears search text before displaying the restored seed data', () => {
    mockCruiseReloadAfterReset()

    cy.visit('/')
    cy.wait('@getCruiseLines')

    cy.get(selectors.cruiseLines.searchInput).type('Dirty')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Dirty Demo Cruise Line')

    confirmReset(true)

    cy.get(selectors.testPanel.resetDemoDataButton).click()
    cy.wait('@resetDemoData')
    cy.wait('@getCruiseLines')

    cy.get(selectors.cruiseLines.searchInput).should('have.value', '')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Carnival Cruise Line')
  })

  it('restores a filtered empty search state back to visible seed data', () => {
    mockCruiseReloadAfterReset()

    cy.visit('/')
    cy.wait('@getCruiseLines')

    cy.get(selectors.cruiseLines.searchInput).type('No Match')
    cy.get(selectors.cruiseLines.emptyMessage).should('be.visible')

    confirmReset(true)

    cy.get(selectors.testPanel.resetDemoDataButton).click()
    cy.wait('@resetDemoData')
    cy.wait('@getCruiseLines')

    cy.get(selectors.cruiseLines.searchInput).should('have.value', '')
    cy.get(selectors.cruiseLines.emptyMessage).should('not.exist')
    cy.get(selectors.cruiseLines.card).should('have.length', seedCruiseLines.length)
  })

  it('hides selected ships and active update panels after a successful reset', () => {
    mockCruiseReloadAfterReset()

    cy.intercept('GET', '/cruise/ships/11111111-1111-1111-1111-111111111111', {
      statusCode: 200,
      body: [dirtyShip]
    }).as('getDirtyShips')

    cy.visit('/')
    cy.wait('@getCruiseLines')

    cy.contains(selectors.cruiseLines.card, 'Dirty Demo Cruise Line').within(() => {
      cy.get(selectors.cruiseLines.viewShipsButton).click()
    })
    cy.wait('@getDirtyShips')
    cy.get(selectors.ships.panel).should('be.visible')

    cy.contains(selectors.cruiseLines.card, 'Dirty Demo Cruise Line').within(() => {
      cy.get(selectors.cruiseLines.updateButton).click()
    })
    cy.wait('@getDirtyShips')
    cy.get(selectors.updateCruiseLine.panel).should('be.visible')

    confirmReset(true)

    cy.get(selectors.testPanel.resetDemoDataButton).click()
    cy.wait('@resetDemoData')
    cy.wait('@getCruiseLines')

    cy.get(selectors.ships.panel).should('not.be.visible')
    cy.get(selectors.updateCruiseLine.panel).should('not.be.visible')
  })

  it('hides sailings and itinerary panels after a successful reset', () => {
    mockCruiseReloadAfterReset()

    cy.intercept('GET', '/cruise/ships/11111111-1111-1111-1111-111111111111', {
      statusCode: 200,
      body: [dirtyShip]
    }).as('getDirtyShips')

    cy.intercept('GET', '/cruise/ship/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/sailings', {
      statusCode: 200,
      body: [
        {
          id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          shipId: dirtyShip.id,
          departureDate: '2026-07-05',
          port: 'Miami, Florida',
          departurePort: 'Miami, Florida',
          arrivalPort: 'Miami, Florida',
          days: 3,
          isRepositioning: false
        }
      ]
    }).as('getDirtySailings')

    cy.intercept('GET', '/cruise/sailings/cccccccc-cccc-cccc-cccc-cccccccccccc/itinerary', {
      statusCode: 200,
      body: [
        {
          id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
          sailingId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          day: 1,
          title: 'Embarkation Day',
          port: 'Miami, Florida',
          activitySchedule: [
            {
              id: 'ffffffff-ffff-ffff-ffff-fffffffffff1',
              itineraryDayId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
              time: '12:00 PM',
              activity: 'Guest boarding'
            }
          ]
        }
      ]
    }).as('getDirtyItinerary')

    cy.visit('/')
    cy.wait('@getCruiseLines')

    cy.contains(selectors.cruiseLines.card, 'Dirty Demo Cruise Line').within(() => {
      cy.get(selectors.cruiseLines.viewShipsButton).click()
    })
    cy.wait('@getDirtyShips')

    cy.get(selectors.ships.viewSailingsButton).click()
    cy.wait('@getDirtySailings')

    cy.get(selectors.sailings.viewItineraryButton).click()
    cy.wait('@getDirtyItinerary')

    cy.get(selectors.sailings.panel).should('be.visible')
    cy.get(selectors.itinerary.panel).should('be.visible')

    confirmReset(true)

    cy.get(selectors.testPanel.resetDemoDataButton).click()
    cy.wait('@resetDemoData')
    cy.wait('@getCruiseLines')

    cy.get(selectors.sailings.panel).should('not.be.visible')
    cy.get(selectors.itinerary.panel).should('not.be.visible')
  })

  it('does not reload the grid when reset endpoint fails', () => {
    visitWithDirtyData()
    confirmReset(true)

    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: seedCruiseLines
    }).as('unexpectedReload')

    cy.intercept('POST', '/admin/reset-demo-data', {
      statusCode: 500,
      body: { message: 'Reset failed because the database is unavailable' }
    }).as('resetFailure')

    cy.get(selectors.testPanel.resetDemoDataButton).click()
    cy.wait('@resetFailure')

    cy.get('@unexpectedReload.all').should('have.length', 0)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Dirty Demo Cruise Line')
  })

  it('shows the API error message when reset fails', () => {
    visitWithDirtyData()
    confirmReset(true)

    cy.intercept('POST', '/admin/reset-demo-data', {
      statusCode: 500,
      body: { message: 'Reset failed because the database is unavailable' }
    }).as('resetFailure')

    cy.get(selectors.testPanel.resetDemoDataButton).click()
    cy.wait('@resetFailure')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'Demo Data Reset Failed')
      .and('contain.text', 'Reset failed because the database is unavailable')

    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Dirty Demo Cruise Line')
  })

  it('shows a fallback error when reset fails without a response message', () => {
    visitWithDirtyData()
    confirmReset(true)

    cy.intercept('POST', '/admin/reset-demo-data', {
      statusCode: 503,
      body: {}
    }).as('resetFailure')

    cy.get(selectors.testPanel.resetDemoDataButton).click()
    cy.wait('@resetFailure')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'Demo Data Reset Failed')
      .and('contain.text', 'Demo data reset failed with status 503')
  })

  it('shows a network fallback error when the reset request errors before a response', () => {
    visitWithDirtyData()
    confirmReset(true)

    cy.intercept('POST', '/admin/reset-demo-data', {
      forceNetworkError: true
    }).as('resetNetworkFailure')

    cy.get(selectors.testPanel.resetDemoDataButton).click()
    cy.wait('@resetNetworkFailure')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'Demo Data Reset Failed')
      .and('contain.text', 'Failed to fetch')
  })
})
