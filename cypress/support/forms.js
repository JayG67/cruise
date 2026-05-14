import { selectors } from './selectors'

export function fillCruiseLineForm({ name, country, website, ships = [] }) {
  if (name !== undefined) cy.get(selectors.createCruiseLine.nameInput).clear().type(name)
  if (country !== undefined) cy.get(selectors.createCruiseLine.countryInput).clear().type(country)
  if (website !== undefined) cy.get(selectors.createCruiseLine.websiteInput).clear().type(website)

  ships.forEach((shipName, index) => {
    if (index > 0) cy.get(selectors.createCruiseLine.addShipButton).click()
    cy.get(selectors.createCruiseLine.shipNameInput).eq(index).clear().type(shipName)
  })
}

export function fillUpdateCruiseLineDetails({ name, country, website }) {
  if (name !== undefined) cy.get(selectors.updateCruiseLine.nameInput).clear().type(name)
  if (country !== undefined) cy.get(selectors.updateCruiseLine.countryInput).clear().type(country)
  if (website !== undefined) cy.get(selectors.updateCruiseLine.websiteInput).clear().type(website)
}
