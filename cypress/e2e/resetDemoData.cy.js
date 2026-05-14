import { selectors } from '../support/selectors'
import {
  dirtyCruiseLines,
  seedCruiseLines
} from '../support/testData'
import { visitWithDirtyData } from '../support/apiMocks'

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

  it('does not call the reset endpoint when the user cancels confirmation', () => {
    visitWithDirtyData()

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(false).as('confirmReset')
    })

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

  it('resets demo data after confirmation and reloads the grid from seed data', () => {
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
        shipCount: 12
      }
    }).as('resetDemoData')

    cy.visit('/')
    cy.wait('@getCruiseLines')

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true).as('confirmReset')
    })

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

    cy.get(selectors.cruiseLines.grid).should('not.contain.text', 'Dirty Demo Cruise Line')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Royal Caribbean International')
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Showing 2 of 2 cruise lines')
  })

  it('clears search text before displaying the restored seed data', () => {
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
      body: { message: 'Demo data reset successfully', cruiseLineCount: 2, shipCount: 12 }
    }).as('resetDemoData')

    cy.visit('/')
    cy.wait('@getCruiseLines')

    cy.get(selectors.cruiseLines.searchInput).type('Dirty')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Dirty Demo Cruise Line')

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true)
    })

    cy.get(selectors.testPanel.resetDemoDataButton).click()
    cy.wait('@resetDemoData')
    cy.wait('@getCruiseLines')

    cy.get(selectors.cruiseLines.searchInput).should('have.value', '')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Carnival Cruise Line')
  })

  it('hides selected ships and active update panels after a successful reset', () => {
    let cruiseRequestCount = 0

    cy.intercept('GET', '/cruise', (req) => {
      cruiseRequestCount += 1
      req.reply({
        statusCode: 200,
        body: cruiseRequestCount === 1 ? dirtyCruiseLines : seedCruiseLines
      })
    }).as('getCruiseLines')

    cy.intercept('GET', '/cruise/ships/11111111-1111-1111-1111-111111111111', {
      statusCode: 200,
      body: [
        {
          id: 'ship-1',
          name: 'Dirty Ship',
          cruiseLineId: '11111111-1111-1111-1111-111111111111'
        }
      ]
    }).as('getDirtyShips')

    cy.intercept('POST', '/admin/reset-demo-data', {
      statusCode: 200,
      body: { message: 'Demo data reset successfully', cruiseLineCount: 2, shipCount: 12 }
    }).as('resetDemoData')

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

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true)
    })

    cy.get(selectors.testPanel.resetDemoDataButton).click()
    cy.wait('@resetDemoData')
    cy.wait('@getCruiseLines')

    cy.get(selectors.ships.panel).should('not.be.visible')
    cy.get(selectors.updateCruiseLine.panel).should('not.be.visible')
  })

  it('shows the API error message when reset fails', () => {
    visitWithDirtyData()

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true)
    })

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

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true)
    })

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
})
