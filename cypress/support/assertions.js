import { selectors } from './selectors'

export function visibleCruiseCards() {
  return cy.get(selectors.cruiseLines.card)
}

export function assertCruiseCardVisible(name) {
  cy.contains(selectors.cruiseLines.card, name).should('be.visible')
}

export function assertCruiseCardNotVisible(name) {
  cy.contains(selectors.cruiseLines.card, name).should('not.exist')
}

export function assertVisibleCruiseCardCount(count) {
  cy.get(selectors.cruiseLines.card).should('have.length', count)
}

export function assertTestOutputContains(...values) {
  values.forEach(value => {
    cy.get(selectors.testPanel.output).should('contain', value)
  })
}
