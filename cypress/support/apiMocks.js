import {
  initialCruiseLines,
  homeCruiseLines,
  searchCruiseLines,
  updateCruiseLines,
  deleteCruiseLines,
  royalCruiseLineId,
  mscCruiseLineId,
  royalShips,
  mscShips,
  shipsCruiseLines,
  shipMap,
  dirtyCruiseLines
} from './testData'
import { selectors } from './selectors'

export function mockCruiseLines(body = updateCruiseLines, alias = 'getCruiseLines') {
  cy.intercept('GET', '/cruise', {
    statusCode: 200,
    body
  }).as(alias)
}

export function mockCruiseLinesFailure(statusCode = 500, body = { message: 'Cruise request failed' }, alias = 'getCruiseLines') {
  cy.intercept('GET', '/cruise', {
    statusCode,
    body
  }).as(alias)
}

export function visitHome(body = updateCruiseLines) {
  mockCruiseLines(body)
  cy.visit('/')
  cy.wait('@getCruiseLines')
}

export function visitHomeWithCruiseLines(cruiseLineList = homeCruiseLines) {
  mockCruiseLines(cruiseLineList)
  cy.visit('/')
  cy.wait('@getCruiseLines')
}

export function visitWithMockedCruiseLines(cruiseLineList = [...initialCruiseLines]) {
  cy.intercept('GET', '/cruise', req => {
    req.reply({
      statusCode: 200,
      body: cruiseLineList
    })
  }).as('getCruiseLines')

  cy.visit('/')
  cy.wait('@getCruiseLines')

  return cy.wrap(cruiseLineList, { log: false })
}

export function visitSearchPage(cruiseLineList = searchCruiseLines) {
  mockCruiseLines(cruiseLineList)
  cy.visit('/')
  cy.wait('@getCruiseLines')
  cy.get(selectors.cruiseLines.card).should('have.length', cruiseLineList.length)
}

export function visitShipsPage() {
  mockCruiseLines(shipsCruiseLines)
  cy.visit('/')
  cy.wait('@getCruiseLines')
  cy.get(selectors.cruiseLines.card).should('have.length', shipsCruiseLines.length)
}

export function visitWithCruiseLines(body = deleteCruiseLines) {
  mockCruiseLines(body)
  cy.visit('/')
  cy.wait('@getCruiseLines')
}

export function visitWithCruiseLineReload(initialBody, reloadedBody) {
  let getCruiseRequestCount = 0

  cy.intercept('GET', '/cruise', (req) => {
    getCruiseRequestCount += 1
    req.reply({
      statusCode: 200,
      body: getCruiseRequestCount === 1 ? initialBody : reloadedBody
    })
  }).as('getCruiseLines')

  cy.visit('/')
  cy.wait('@getCruiseLines')
}

export function visitWithDirtyData() {
  cy.intercept('GET', '/cruise', {
    statusCode: 200,
    body: dirtyCruiseLines
  }).as('getDirtyCruiseLines')

  cy.visit('/')
  cy.wait('@getDirtyCruiseLines')
}

export function mockShipsFor(cruiseLine, response = shipMap[cruiseLine.id]) {
  cy.intercept('GET', `/cruise/ships/${cruiseLine.id}`, {
    statusCode: 200,
    body: response
  }).as(`getShips-${cruiseLine.id}`)
}

export function mockShipsForCruiseLine(cruiseLineId, response, alias = `getShips-${cruiseLineId}`) {
  cy.intercept('GET', `/cruise/ships/${cruiseLineId}`, {
    statusCode: 200,
    body: response
  }).as(alias)
}

export function mockRoyalShips(body = royalShips) {
  cy.intercept('GET', `/cruise/ships/${royalCruiseLineId}`, {
    statusCode: 200,
    body
  }).as('getRoyalShips')
}

export function mockMscShips(body = mscShips) {
  cy.intercept('GET', `/cruise/ships/${mscCruiseLineId}`, {
    statusCode: 200,
    body
  }).as('getMscShips')
}

export function stubSuccessfulRoyalDelete() {
  cy.intercept('DELETE', `/cruise/cruise-line/${royalCruiseLineId}`, (req) => {
    expect(req.method).to.equal('DELETE')
    req.reply({
      statusCode: 200,
      body: { message: 'Cruise line deleted successfully' }
    })
  }).as('deleteRoyalCruiseLine')
}

export function mockSailingsForShip(shipId, response, alias = `getSailings-${shipId}`) {
  cy.intercept('GET', `/cruise/ship/${shipId}/sailings`, {
    statusCode: 200,
    body: response
  }).as(alias)
}

export function mockItineraryForSailing(sailingId, response, alias = `getItinerary-${sailingId}`) {
  cy.intercept('GET', `/cruise/sailings/${sailingId}/itinerary`, {
    statusCode: 200,
    body: response
  }).as(alias)
}

export function mockCreateSailing(shipId, response, alias = `createSailing-${shipId}`) {
  cy.intercept('POST', `/cruise/ship/${shipId}/sailings`, { statusCode: 201, body: response }).as(alias)
}

export function mockUpdateSailing(sailingId, response, alias = `updateSailing-${sailingId}`) {
  cy.intercept('PATCH', `/cruise/sailings/${sailingId}`, { statusCode: 200, body: response }).as(alias)
}

export function mockDeleteSailing(sailingId, response, alias = `deleteSailing-${sailingId}`) {
  cy.intercept('DELETE', `/cruise/sailings/${sailingId}`, { statusCode: 200, body: response }).as(alias)
}

export function mockCreateItineraryDay(sailingId, response, alias = `createItineraryDay-${sailingId}`) {
  cy.intercept('POST', `/cruise/sailings/${sailingId}/itinerary`, { statusCode: 201, body: response }).as(alias)
}

export function mockUpdateItineraryDay(itineraryDayId, response, alias = `updateItineraryDay-${itineraryDayId}`) {
  cy.intercept('PATCH', `/cruise/itinerary-days/${itineraryDayId}`, { statusCode: 200, body: response }).as(alias)
}

export function mockDeleteItineraryDay(itineraryDayId, response, alias = `deleteItineraryDay-${itineraryDayId}`) {
  cy.intercept('DELETE', `/cruise/itinerary-days/${itineraryDayId}`, { statusCode: 200, body: response }).as(alias)
}

export function mockCreateActivity(itineraryDayId, response, alias = `createActivity-${itineraryDayId}`) {
  cy.intercept('POST', `/cruise/itinerary-days/${itineraryDayId}/activities`, { statusCode: 201, body: response }).as(alias)
}

export function mockUpdateActivity(activityId, response, alias = `updateActivity-${activityId}`) {
  cy.intercept('PATCH', `/cruise/activities/${activityId}`, { statusCode: 200, body: response }).as(alias)
}

export function mockDeleteActivity(activityId, response, alias = `deleteActivity-${activityId}`) {
  cy.intercept('DELETE', `/cruise/activities/${activityId}`, { statusCode: 200, body: response }).as(alias)
}


export function mockCreateShip(response, alias = 'createShip') {
  cy.intercept('POST', '/cruise/ship', { statusCode: 201, body: response }).as(alias)
}

export function mockUpdateShip(shipId, response, alias = `updateShip-${shipId}`) {
  cy.intercept('PATCH', `/cruise/ship/${shipId}`, { statusCode: 200, body: response }).as(alias)
}

export function mockDeleteShip(shipId, response, alias = `deleteShip-${shipId}`) {
  cy.intercept('DELETE', `/cruise/ship/${shipId}`, { statusCode: 200, body: response }).as(alias)
}
