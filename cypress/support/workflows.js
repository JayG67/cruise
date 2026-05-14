import { selectors } from './selectors'

export function stubConfirm(confirmed = true) {
  cy.window().then((win) => {
    cy.stub(win, 'confirm').returns(confirmed).as('confirmDialog')
  })
}

export function clickViewShips(cruiseLineName) {
  cy.contains(selectors.cruiseLines.card, cruiseLineName)
    .find(selectors.cruiseLines.viewShipsButton)
    .click()
}

export function clickDeleteForCruiseLine(cruiseLineName) {
  cy.contains(selectors.cruiseLines.card, cruiseLineName)
    .find(selectors.cruiseLines.deleteButton)
    .click()
}

export function clickRoyalDelete() {
  clickDeleteForCruiseLine('Royal Caribbean International')
}

export function openRoyalUpdateForm() {
  cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
    .find(selectors.cruiseLines.updateButton)
    .click()

  cy.wait('@getRoyalShips')
  cy.get(selectors.updateCruiseLine.panel).should('be.visible')
}

export function openMscUpdateForm() {
  cy.contains(selectors.cruiseLines.card, 'MSC Cruises')
    .find(selectors.cruiseLines.updateButton)
    .click()

  cy.wait('@getMscShips')
  cy.get(selectors.updateCruiseLine.panel).should('be.visible')
}
