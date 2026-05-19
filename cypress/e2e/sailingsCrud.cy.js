import { selectors } from '../support/selectors'
import {
  visitHomeWithCruiseLines,
  mockShipsForCruiseLine,
  mockSailingsForShip,
  mockItineraryForSailing,
  mockCreateSailing,
  mockUpdateSailing,
  mockDeleteSailing,
  mockCreateItineraryDay,
  mockUpdateItineraryDay,
  mockDeleteItineraryDay,
  mockCreateActivity,
  mockUpdateActivity,
  mockDeleteActivity
} from '../support/apiMocks'

const cruiseLineId = '11111111-1111-1111-1111-111111111111'
const shipId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const sailingId = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
const itineraryDayId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'
const activityId = 'ffffffff-ffff-ffff-ffff-fffffffffff1'

const cruiseLines = [
  {
    id: cruiseLineId,
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  }
]

const ships = [
  {
    id: shipId,
    name: 'Icon of the Seas',
    currentPort: 'Miami, Florida',
    cruiseLineId
  }
]

const sailings = [
  {
    id: sailingId,
    shipId,
    departureDate: '2026-07-05',
    port: 'Miami, Florida',
    departurePort: 'Miami, Florida',
    arrivalPort: 'Nassau, Bahamas',
    days: 4,
    isRepositioning: false
  }
]

const itinerary = [
  {
    id: itineraryDayId,
    sailingId,
    day: 1,
    title: 'Embarkation Day — Miami, Florida',
    port: 'Miami, Florida',
    activitySchedule: [
      {
        id: activityId,
        itineraryDayId,
        time: '12:00 PM',
        activity: 'Guest boarding and welcome lunch'
      }
    ]
  }
]

const repositioningSailingId = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
const secondItineraryDayId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2'
const secondActivityId = 'ffffffff-ffff-ffff-ffff-fffffffffff2'

const multiSailings = [
  ...sailings,
  {
    id: repositioningSailingId,
    shipId,
    departureDate: '2026-09-13',
    port: 'Miami, Florida',
    departurePort: 'Miami, Florida',
    arrivalPort: 'Barcelona, Spain',
    days: 13,
    isRepositioning: true
  }
]

const multiDayItinerary = [
  ...itinerary,
  {
    id: secondItineraryDayId,
    sailingId,
    day: 2,
    title: 'Day at Sea',
    port: 'At Sea',
    activitySchedule: [
      {
        id: secondActivityId,
        itineraryDayId: secondItineraryDayId,
        time: '9:00 AM',
        activity: 'Morning enrichment program'
      },
      {
        id: 'ffffffff-ffff-ffff-ffff-fffffffffff3',
        itineraryDayId: secondItineraryDayId,
        time: '7:00 PM',
        activity: 'Main dining room dinner service'
      }
    ]
  }
]

function setupCruiseSailingMocks() {
  visitHomeWithCruiseLines(cruiseLines)
  mockShipsForCruiseLine(cruiseLineId, ships)
  mockSailingsForShip(shipId, sailings)
  mockItineraryForSailing(sailingId, itinerary)
}

function openSailings() {
  cy.get(selectors.cruiseLines.viewShipsButton).click()
  cy.wait(`@getShips-${cruiseLineId}`)
  cy.get(selectors.ships.viewSailingsButton).click()
  cy.wait(`@getSailings-${shipId}`)
}

function openItinerary() {
  openSailings()
  cy.get(selectors.sailings.viewItineraryButton).click()
  cy.wait(`@getItinerary-${sailingId}`)
}

describe('Sailings and itinerary admin CRUD UI', () => {
  beforeEach(() => {
    setupCruiseSailingMocks()
  })

  it('shows sailing CRUD controls after selecting a ship', () => {
    openSailings()

    cy.get(selectors.sailings.panel).should('be.visible')
    cy.get(selectors.sailings.createForm).should('be.visible')
    cy.get(selectors.sailings.createSubmitButton).should('be.visible')
    cy.get(selectors.sailings.updateButton).should('be.visible')
    cy.get(selectors.sailings.deleteButton).should('be.visible')
  })

  it('creates, updates, and deletes a sailing from the UI', () => {
    mockCreateSailing(shipId, { message: 'Sailing created successfully', id: '12121212-1212-1212-1212-121212121212' })
    mockUpdateSailing(sailingId, { message: 'Sailing updated successfully' })
    mockDeleteSailing(sailingId, { message: 'Sailing deleted successfully' })

    openSailings()

    cy.get(selectors.sailings.departureDateInput).clear().type('2026-10-01')
    cy.get(selectors.sailings.departurePortInput).type('Miami, Florida')
    cy.get(selectors.sailings.arrivalPortInput).type('Nassau, Bahamas')
    cy.get(selectors.sailings.daysInput).clear().type('4')
    cy.get(selectors.sailings.createSubmitButton).click()

    cy.wait(`@createSailing-${shipId}`).its('request.body').should('deep.include', {
      departureDate: '2026-10-01',
      departurePort: 'Miami, Florida',
      arrivalPort: 'Nassau, Bahamas',
      days: 4,
      isRepositioning: false
    })

    cy.window().then(win => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('2026-10-02')
        .onCall(1).returns('Fort Lauderdale, Florida')
        .onCall(2).returns('Barcelona, Spain')
        .onCall(3).returns('12')
        .onCall(4).returns('true')
    })

    cy.get(selectors.sailings.updateButton).first().click({ force: true })
    cy.wait(`@updateSailing-${sailingId}`).its('request.body').should('deep.include', {
      departureDate: '2026-10-02',
      departurePort: 'Fort Lauderdale, Florida',
      arrivalPort: 'Barcelona, Spain',
      days: 12,
      isRepositioning: true
    })

    cy.window().then(win => {
      win.prompt.restore && win.prompt.restore()
      cy.stub(win, 'confirm').returns(true)
    })

    cy.get(selectors.sailings.deleteButton).first().click({ force: true })
    cy.wait(`@deleteSailing-${sailingId}`)
  })

  it('shows itinerary and activity CRUD controls after selecting a sailing', () => {
    openItinerary()

    cy.get(selectors.itinerary.panel).should('be.visible')
    cy.get(selectors.itinerary.createDayForm).should('be.visible')
    cy.get(selectors.itinerary.createDaySubmitButton).should('be.visible')

    cy.get(selectors.itinerary.daySummary).first().click()
    cy.get(selectors.itinerary.updateDayButton).should('be.visible')
    cy.get(selectors.itinerary.deleteDayButton).should('be.visible')
    cy.get(selectors.itinerary.createActivityForm).should('be.visible')
    cy.get(selectors.itinerary.updateActivityButton).should('be.visible')
    cy.get(selectors.itinerary.deleteActivityButton).should('be.visible')
  })

  it('creates, updates, and deletes itinerary days and activities from the UI', () => {
    mockCreateItineraryDay(sailingId, { message: 'Itinerary day created successfully', id: 'abababab-abab-abab-abab-abababababab' })
    mockUpdateItineraryDay(itineraryDayId, { message: 'Itinerary day updated successfully' })
    mockDeleteItineraryDay(itineraryDayId, { message: 'Itinerary day deleted successfully' })
    mockCreateActivity(itineraryDayId, { message: 'Activity created successfully', id: 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd' })
    mockUpdateActivity(activityId, { message: 'Activity updated successfully' })
    mockDeleteActivity(activityId, { message: 'Activity deleted successfully' })

    openItinerary()

    cy.get(selectors.itinerary.createDayNumberInput).should('be.visible').type('{selectall}2', { force: true })
    cy.get(selectors.itinerary.createDayTitleInput).type('Day at Sea')
    cy.get(selectors.itinerary.createDayPortInput).type('At Sea')
    cy.get(selectors.itinerary.createDayActivityTimeInput).type('9:00 AM')
    cy.get(selectors.itinerary.createDayActivityTextInput).type('Morning briefing')
    cy.get(selectors.itinerary.createDaySubmitButton).click({ force: true })

    cy.wait(`@createItineraryDay-${sailingId}`).its('request.body').should('deep.include', {
      day: 2,
      title: 'Day at Sea',
      port: 'At Sea'
    })

    cy.wait(`@getItinerary-${sailingId}`)

    cy.get(selectors.itinerary.day).first().within(() => {
      cy.get(selectors.itinerary.daySummary).click()
    })

    cy.window().then(win => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('1')
        .onCall(1).returns('Updated Embarkation Day')
        .onCall(2).returns('Fort Lauderdale, Florida')
    })

    cy.get(selectors.itinerary.day).first().within(() => {
      cy.get(selectors.itinerary.updateDayButton).click({ force: true })
    })

    cy.wait(`@updateItineraryDay-${itineraryDayId}`)
    cy.wait(`@getItinerary-${sailingId}`)

    cy.get(selectors.itinerary.day).first().within(() => {
      cy.get(selectors.itinerary.daySummary).click()
      cy.get(selectors.itinerary.createActivityTimeInput).type('2:00 PM', { force: true })
      cy.get(selectors.itinerary.createActivityTextInput).type('Poolside trivia', { force: true })
      cy.get(selectors.itinerary.createActivitySubmitButton).click({ force: true })
    })

    cy.wait(`@createActivity-${itineraryDayId}`)
    cy.wait(`@getItinerary-${sailingId}`)

    cy.window().then(win => {
      win.prompt.restore && win.prompt.restore()
      cy.stub(win, 'prompt')
        .onCall(0).returns('3:00 PM')
        .onCall(1).returns('Updated trivia')
    })

    cy.get(selectors.itinerary.day).first().within(() => {
      cy.get(selectors.itinerary.daySummary).click()
      cy.get(selectors.itinerary.updateActivityButton).click({ force: true })
    })

    cy.wait(`@updateActivity-${activityId}`)
    cy.wait(`@getItinerary-${sailingId}`)

    cy.window().then(win => {
      win.prompt.restore && win.prompt.restore()
      cy.stub(win, 'confirm').returns(true)
    })

    cy.get(selectors.itinerary.day).first().within(() => {
      cy.get(selectors.itinerary.daySummary).click()
      cy.get(selectors.itinerary.deleteActivityButton).click({ force: true })
    })

    cy.wait(`@deleteActivity-${activityId}`)
    cy.wait(`@getItinerary-${sailingId}`)

    cy.get(selectors.itinerary.day).first().within(() => {
      cy.get(selectors.itinerary.daySummary).click()
      cy.get(selectors.itinerary.deleteDayButton).click({ force: true })
    })

    cy.wait(`@deleteItineraryDay-${itineraryDayId}`)
  })

  it('shows loading and fallback states for sailings and itinerary requests', () => {
    cy.intercept('GET', `/cruise/ship/${shipId}/sailings`, {
      delay: 500,
      statusCode: 200,
      body: sailings
    }).as(`delayedSailings-${shipId}`)

    cy.get(selectors.cruiseLines.viewShipsButton).click()
    cy.wait(`@getShips-${cruiseLineId}`)
    cy.get(selectors.ships.viewSailingsButton).click()

    cy.get(selectors.sailings.loadingMessage).should('contain.text', 'Loading sailings')
    cy.wait(`@delayedSailings-${shipId}`)
    cy.get(selectors.sailings.card).should('have.length', 1)

    cy.intercept('GET', `/cruise/sailings/${sailingId}/itinerary`, {
      statusCode: 500,
      body: { message: 'Itinerary unavailable' }
    }).as(`failedItinerary-${sailingId}`)

    cy.get(selectors.sailings.viewItineraryButton).click()
    cy.wait(`@failedItinerary-${sailingId}`)
    cy.get(selectors.itinerary.emptyMessage).should('contain.text', 'No itinerary found')
  })

  it('does not update or delete sailings when admin prompts are cancelled', () => {
    mockUpdateSailing(sailingId, { message: 'Should not update' })
    mockDeleteSailing(sailingId, { message: 'Should not delete' })

    openSailings()

    cy.window().then(win => {
      cy.stub(win, 'prompt').returns(null)
      cy.stub(win, 'confirm').returns(false)
    })

    cy.get(selectors.sailings.updateButton).first().click({ force: true })
    cy.get(`@updateSailing-${sailingId}.all`).should('have.length', 0)

    cy.get(selectors.sailings.deleteButton).first().click({ force: true })
    cy.get(`@deleteSailing-${sailingId}.all`).should('have.length', 0)
  })

  it('shows create sailing API errors without refreshing sailings', () => {
    cy.intercept('POST', `/cruise/ship/${shipId}/sailings`, {
      statusCode: 400,
      body: { message: 'Departure port is required' }
    }).as(`createSailingFailure-${shipId}`)

    openSailings()

    cy.get(selectors.sailings.departureDateInput).clear().type('2026-10-01')
    cy.get(selectors.sailings.departurePortInput).type('Miami, Florida')
    cy.get(selectors.sailings.arrivalPortInput).type('Nassau, Bahamas')
    cy.get(selectors.sailings.daysInput).clear().type('4')
    cy.get(selectors.sailings.createSubmitButton).click()

    cy.wait(`@createSailingFailure-${shipId}`)
    cy.get('[data-cy="create-sailing-message"]').should('contain.text', 'Departure port is required')
    cy.get(`@getSailings-${shipId}.all`).should('have.length', 1)
  })

  it('does not update or delete itinerary days or activities when admin prompts are cancelled', () => {
    mockUpdateItineraryDay(itineraryDayId, { message: 'Should not update day' })
    mockDeleteItineraryDay(itineraryDayId, { message: 'Should not delete day' })
    mockUpdateActivity(activityId, { message: 'Should not update activity' })
    mockDeleteActivity(activityId, { message: 'Should not delete activity' })

    openItinerary()

    cy.get(selectors.itinerary.daySummary).first().click()

    cy.window().then(win => {
      cy.stub(win, 'prompt').returns(null)
      cy.stub(win, 'confirm').returns(false)
    })

    cy.get(selectors.itinerary.updateDayButton).first().click({ force: true })
    cy.get(`@updateItineraryDay-${itineraryDayId}.all`).should('have.length', 0)

    cy.get(selectors.itinerary.deleteDayButton).first().click({ force: true })
    cy.get(`@deleteItineraryDay-${itineraryDayId}.all`).should('have.length', 0)

    cy.get(selectors.itinerary.updateActivityButton).first().click({ force: true })
    cy.get(`@updateActivity-${activityId}.all`).should('have.length', 0)

    cy.get(selectors.itinerary.deleteActivityButton).first().click({ force: true })
    cy.get(`@deleteActivity-${activityId}.all`).should('have.length', 0)
  })

  it('creates an itinerary day without an optional initial activity', () => {
    mockCreateItineraryDay(sailingId, {
      message: 'Itinerary day created successfully',
      id: 'abababab-abab-abab-abab-abababababab'
    })

    openItinerary()

    cy.get(selectors.itinerary.createDayNumberInput).should('be.visible').type('{selectall}3', { force: true })
    cy.get(selectors.itinerary.createDayTitleInput).type('Return to Port')
    cy.get(selectors.itinerary.createDayPortInput).type('Miami, Florida')
    cy.get(selectors.itinerary.createDaySubmitButton).click({ force: true })

    cy.wait(`@createItineraryDay-${sailingId}`).its('request.body').should('deep.equal', {
      day: 3,
      title: 'Return to Port',
      port: 'Miami, Florida',
      activitySchedule: []
    })
  })

  it('surfaces create activity API failures from the expanded itinerary day', () => {
    cy.intercept('POST', `/cruise/itinerary-days/${itineraryDayId}/activities`, {
      statusCode: 400,
      body: { message: 'Activity time is required' }
    }).as(`createActivityFailure-${itineraryDayId}`)

    openItinerary()

    cy.get(selectors.itinerary.day).first().within(() => {
      cy.get(selectors.itinerary.daySummary).click()
      cy.get(selectors.itinerary.createActivityTimeInput).type('2:00 PM', { force: true })
      cy.get(selectors.itinerary.createActivityTextInput).type('Poolside trivia', { force: true })
      cy.get(selectors.itinerary.createActivitySubmitButton).click({ force: true })
    })

    cy.wait(`@createActivityFailure-${itineraryDayId}`)
    cy.on('window:alert', text => {
      expect(text).to.contain('Activity time is required')
    })
  })


  it('renders multiple sailings with regional and repositioning sailing details', () => {
    mockSailingsForShip(shipId, multiSailings)

    openSailings()

    cy.get(selectors.sailings.card).should('have.length', 2)
    cy.get(selectors.sailings.card).first().should('contain.text', 'Round-Trip / Regional Sailing')
    cy.get(selectors.sailings.card).first().should('contain.text', 'Departure Port:')
    cy.get(selectors.sailings.card).first().should('contain.text', 'Arrival Port:')

    cy.get(selectors.sailings.card).last().should('contain.text', 'Repositioning Sailing')
    cy.get(selectors.sailings.card).last().should('contain.text', 'Barcelona, Spain')
    cy.get(selectors.sailings.card).last().should('contain.text', '13 days')
  })

  it('creates a repositioning sailing and sends the checked boolean payload', () => {
    mockCreateSailing(shipId, {
      message: 'Sailing created successfully',
      id: repositioningSailingId
    })

    openSailings()

    cy.get(selectors.sailings.departureDateInput).clear().type('2026-09-13')
    cy.get(selectors.sailings.departurePortInput).type('Miami, Florida')
    cy.get(selectors.sailings.arrivalPortInput).type('Barcelona, Spain')
    cy.get(selectors.sailings.daysInput).clear().type('13')
    cy.get(selectors.sailings.repositioningInput).check()
    cy.get(selectors.sailings.createSubmitButton).click()

    cy.wait(`@createSailing-${shipId}`).its('request.body').should('deep.include', {
      departureDate: '2026-09-13',
      port: 'Miami, Florida',
      departurePort: 'Miami, Florida',
      arrivalPort: 'Barcelona, Spain',
      days: 13,
      isRepositioning: true
    })
  })

  it('trims sailing create form values before sending the request', () => {
    mockCreateSailing(shipId, {
      message: 'Sailing created successfully',
      id: '34343434-3434-4343-8434-343434343434'
    })

    openSailings()

    cy.get(selectors.sailings.departureDateInput).clear().type('2026-10-04')
    cy.get(selectors.sailings.departurePortInput).type('  Miami, Florida  ')
    cy.get(selectors.sailings.arrivalPortInput).type('  Nassau, Bahamas  ')
    cy.get(selectors.sailings.daysInput).clear().type('5')
    cy.get(selectors.sailings.createSubmitButton).click()

    cy.wait(`@createSailing-${shipId}`).its('request.body').should('deep.include', {
      departurePort: 'Miami, Florida',
      arrivalPort: 'Nassau, Bahamas',
      port: 'Miami, Florida',
      days: 5
    })
  })

  it('shows a sailing fallback when the selected ship has no sailings', () => {
    cy.intercept('GET', `/cruise/ship/${shipId}/sailings`, {
      statusCode: 404,
      body: { message: 'No sailings found for the specified ship' }
    }).as(`missingSailings-${shipId}`)

    cy.get(selectors.cruiseLines.viewShipsButton).click()
    cy.wait(`@getShips-${cruiseLineId}`)
    cy.get(selectors.ships.viewSailingsButton).click()

    cy.wait(`@missingSailings-${shipId}`)
    cy.get(selectors.sailings.emptyMessage).should('be.visible')
    cy.get(selectors.sailings.emptyMessage).should('contain.text', 'No sailings found')
  })

  it('shows a sailing fallback when the sailings API returns invalid JSON', () => {
    cy.intercept('GET', `/cruise/ship/${shipId}/sailings`, {
      statusCode: 200,
      body: 'not-json',
      headers: {
        'content-type': 'application/json'
      }
    }).as(`invalidSailings-${shipId}`)

    cy.get(selectors.cruiseLines.viewShipsButton).click()
    cy.wait(`@getShips-${cruiseLineId}`)
    cy.get(selectors.ships.viewSailingsButton).click()

    cy.wait(`@invalidSailings-${shipId}`)
    cy.get(selectors.sailings.emptyMessage).should('contain.text', 'No sailings found')
  })

  it('renders multi-day itinerary details with ports and multiple activities', () => {
    mockItineraryForSailing(sailingId, multiDayItinerary)

    openItinerary()

    cy.get(selectors.itinerary.day).should('have.length', 2)
    cy.get(selectors.itinerary.day).first().should('contain.text', 'Embarkation Day')
    cy.get(selectors.itinerary.day).last().should('contain.text', 'Day at Sea')

    cy.get(selectors.itinerary.daySummary).last().click()

    cy.get(selectors.itinerary.itineraryPort).last().should('contain.text', 'At Sea')
    cy.get(selectors.itinerary.activity).should('have.length.at.least', 3)
    cy.get(selectors.itinerary.activity).should('contain.text', 'Morning enrichment program')
    cy.get(selectors.itinerary.activity).should('contain.text', 'Main dining room dinner service')
  })

  it('shows an itinerary fallback when the sailing has no itinerary', () => {
    cy.intercept('GET', `/cruise/sailings/${sailingId}/itinerary`, {
      statusCode: 404,
      body: { message: 'No itinerary found for the specified sailing' }
    }).as(`missingItinerary-${sailingId}`)

    openSailings()
    cy.get(selectors.sailings.viewItineraryButton).click()

    cy.wait(`@missingItinerary-${sailingId}`)
    cy.get(selectors.itinerary.emptyMessage).should('be.visible')
    cy.get(selectors.itinerary.emptyMessage).should('contain.text', 'No itinerary found')
  })

  it('does not update a sailing when a later prompt is cancelled', () => {
    mockUpdateSailing(sailingId, { message: 'Should not update' })

    openSailings()

    cy.window().then(win => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('2026-10-02')
        .onCall(1).returns('Fort Lauderdale, Florida')
        .onCall(2).returns(null)
    })

    cy.get(selectors.sailings.updateButton).first().click({ force: true })

    cy.get(`@updateSailing-${sailingId}.all`).should('have.length', 0)
  })

  it('includes the sailing departure date in the delete confirmation', () => {
    mockDeleteSailing(sailingId, { message: 'Sailing deleted successfully' })

    openSailings()

    cy.window().then(win => {
      cy.stub(win, 'confirm').as('confirmDeleteSailing').returns(false)
    })

    cy.get(selectors.sailings.deleteButton).first().click({ force: true })

    cy.get('@confirmDeleteSailing').should('have.been.calledWith', 'Delete sailing departing 2026-07-05?')
    cy.get(`@deleteSailing-${sailingId}.all`).should('have.length', 0)
  })

  it('surfaces update sailing API failures to the admin user', () => {
    cy.intercept('PATCH', `/cruise/sailings/${sailingId}`, {
      statusCode: 500,
      body: { message: 'Sailing update failed' }
    }).as(`updateSailingFailure-${sailingId}`)

    openSailings()

    cy.window().then(win => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('2026-10-02')
        .onCall(1).returns('Fort Lauderdale, Florida')
        .onCall(2).returns('Barcelona, Spain')
        .onCall(3).returns('12')
        .onCall(4).returns('true')
      cy.stub(win, 'alert').as('alert')
    })

    cy.get(selectors.sailings.updateButton).first().click({ force: true })

    cy.wait(`@updateSailingFailure-${sailingId}`)
    cy.get('@alert').should('have.been.calledWith', 'Sailing update failed')
  })

  it('surfaces delete sailing API failures to the admin user', () => {
    cy.intercept('DELETE', `/cruise/sailings/${sailingId}`, {
      statusCode: 500,
      body: { message: 'Sailing delete failed' }
    }).as(`deleteSailingFailure-${sailingId}`)

    openSailings()

    cy.window().then(win => {
      cy.stub(win, 'confirm').returns(true)
      cy.stub(win, 'alert').as('alert')
    })

    cy.get(selectors.sailings.deleteButton).first().click({ force: true })

    cy.wait(`@deleteSailingFailure-${sailingId}`)
    cy.get('@alert').should('have.been.calledWith', 'Sailing delete failed')
  })

  it('trims itinerary day values before sending the create request', () => {
    mockCreateItineraryDay(sailingId, {
      message: 'Itinerary day created successfully',
      id: '45454545-4545-4545-8545-454545454545'
    })

    openItinerary()

    cy.get(selectors.itinerary.createDayNumberInput).should('be.visible').type('{selectall}4', { force: true })
    cy.get(selectors.itinerary.createDayTitleInput).type('  Port Day — Nassau  ')
    cy.get(selectors.itinerary.createDayPortInput).type('  Nassau, Bahamas  ')
    cy.get(selectors.itinerary.createDayActivityTimeInput).type('  9:00 AM  ')
    cy.get(selectors.itinerary.createDayActivityTextInput).type('  Shore excursion meetup  ')
    cy.get(selectors.itinerary.createDaySubmitButton).click({ force: true })

    cy.wait(`@createItineraryDay-${sailingId}`).its('request.body').should('deep.equal', {
      day: 4,
      title: 'Port Day — Nassau',
      port: 'Nassau, Bahamas',
      activitySchedule: [
        {
          time: '9:00 AM',
          activity: 'Shore excursion meetup'
        }
      ]
    })
  })

  it('does not update an itinerary day when a later prompt is cancelled', () => {
    mockUpdateItineraryDay(itineraryDayId, { message: 'Should not update day' })

    openItinerary()
    cy.get(selectors.itinerary.daySummary).first().click()

    cy.window().then(win => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('1')
        .onCall(1).returns(null)
    })

    cy.get(selectors.itinerary.updateDayButton).first().click({ force: true })

    cy.get(`@updateItineraryDay-${itineraryDayId}.all`).should('have.length', 0)
  })

  it('includes the itinerary day number in the delete confirmation', () => {
    mockDeleteItineraryDay(itineraryDayId, { message: 'Itinerary day deleted successfully' })

    openItinerary()
    cy.get(selectors.itinerary.daySummary).first().click()

    cy.window().then(win => {
      cy.stub(win, 'confirm').as('confirmDeleteDay').returns(false)
    })

    cy.get(selectors.itinerary.deleteDayButton).first().click({ force: true })

    cy.get('@confirmDeleteDay').should('have.been.calledWith', 'Delete itinerary day 1?')
    cy.get(`@deleteItineraryDay-${itineraryDayId}.all`).should('have.length', 0)
  })

  it('surfaces update itinerary day API failures to the admin user', () => {
    cy.intercept('PATCH', `/cruise/itinerary-days/${itineraryDayId}`, {
      statusCode: 500,
      body: { message: 'Itinerary day update failed' }
    }).as(`updateItineraryDayFailure-${itineraryDayId}`)

    openItinerary()
    cy.get(selectors.itinerary.daySummary).first().click()

    cy.window().then(win => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('1')
        .onCall(1).returns('Updated Embarkation Day')
        .onCall(2).returns('Miami, Florida')
      cy.stub(win, 'alert').as('alert')
    })

    cy.get(selectors.itinerary.updateDayButton).first().click({ force: true })

    cy.wait(`@updateItineraryDayFailure-${itineraryDayId}`)
    cy.get('@alert').should('have.been.calledWith', 'Itinerary day update failed')
  })

  it('surfaces delete itinerary day API failures to the admin user', () => {
    cy.intercept('DELETE', `/cruise/itinerary-days/${itineraryDayId}`, {
      statusCode: 500,
      body: { message: 'Itinerary day delete failed' }
    }).as(`deleteItineraryDayFailure-${itineraryDayId}`)

    openItinerary()
    cy.get(selectors.itinerary.daySummary).first().click()

    cy.window().then(win => {
      cy.stub(win, 'confirm').returns(true)
      cy.stub(win, 'alert').as('alert')
    })

    cy.get(selectors.itinerary.deleteDayButton).first().click({ force: true })

    cy.wait(`@deleteItineraryDayFailure-${itineraryDayId}`)
    cy.get('@alert').should('have.been.calledWith', 'Itinerary day delete failed')
  })

  it('trims activity values before sending the create activity request', () => {
    mockCreateActivity(itineraryDayId, {
      message: 'Activity created successfully',
      id: '56565656-5656-4656-8565-565656565656'
    })

    openItinerary()

    cy.get(selectors.itinerary.day).first().within(() => {
      cy.get(selectors.itinerary.daySummary).click()
      cy.get(selectors.itinerary.createActivityTimeInput).type('  2:00 PM  ', { force: true })
      cy.get(selectors.itinerary.createActivityTextInput).type('  Poolside trivia  ', { force: true })
      cy.get(selectors.itinerary.createActivitySubmitButton).click({ force: true })
    })

    cy.wait(`@createActivity-${itineraryDayId}`).its('request.body').should('deep.equal', {
      time: '2:00 PM',
      activity: 'Poolside trivia'
    })
  })

  it('does not update an activity when a later prompt is cancelled', () => {
    mockUpdateActivity(activityId, { message: 'Should not update activity' })

    openItinerary()
    cy.get(selectors.itinerary.daySummary).first().click()

    cy.window().then(win => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('3:00 PM')
        .onCall(1).returns(null)
    })

    cy.get(selectors.itinerary.updateActivityButton).first().click({ force: true })

    cy.get(`@updateActivity-${activityId}.all`).should('have.length', 0)
  })

  it('asks for confirmation before deleting an activity', () => {
    mockDeleteActivity(activityId, { message: 'Activity deleted successfully' })

    openItinerary()
    cy.get(selectors.itinerary.daySummary).first().click()

    cy.window().then(win => {
      cy.stub(win, 'confirm').as('confirmDeleteActivity').returns(false)
    })

    cy.get(selectors.itinerary.deleteActivityButton).first().click({ force: true })

    cy.get('@confirmDeleteActivity').should('have.been.calledWith', 'Delete this activity?')
    cy.get(`@deleteActivity-${activityId}.all`).should('have.length', 0)
  })

  it('surfaces update activity API failures to the admin user', () => {
    cy.intercept('PATCH', `/cruise/activities/${activityId}`, {
      statusCode: 500,
      body: { message: 'Activity update failed' }
    }).as(`updateActivityFailure-${activityId}`)

    openItinerary()
    cy.get(selectors.itinerary.daySummary).first().click()

    cy.window().then(win => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('3:00 PM')
        .onCall(1).returns('Updated trivia')
      cy.stub(win, 'alert').as('alert')
    })

    cy.get(selectors.itinerary.updateActivityButton).first().click({ force: true })

    cy.wait(`@updateActivityFailure-${activityId}`)
    cy.get('@alert').should('have.been.calledWith', 'Activity update failed')
  })

  it('surfaces delete activity API failures to the admin user', () => {
    cy.intercept('DELETE', `/cruise/activities/${activityId}`, {
      statusCode: 500,
      body: { message: 'Activity delete failed' }
    }).as(`deleteActivityFailure-${activityId}`)

    openItinerary()
    cy.get(selectors.itinerary.daySummary).first().click()

    cy.window().then(win => {
      cy.stub(win, 'confirm').returns(true)
      cy.stub(win, 'alert').as('alert')
    })

    cy.get(selectors.itinerary.deleteActivityButton).first().click({ force: true })

    cy.wait(`@deleteActivityFailure-${activityId}`)
    cy.get('@alert').should('have.been.calledWith', 'Activity delete failed')
  })

  it('keeps the itinerary panel hidden until a sailing is explicitly selected', () => {
    openSailings()

    cy.get(selectors.sailings.panel).should('be.visible')
    cy.get(selectors.itinerary.panel).should('not.be.visible')
  })

  it('hides stale itinerary details when a different ship is selected for sailings', () => {
    openItinerary()

    cy.get(selectors.itinerary.panel).should('be.visible')

    cy.get(selectors.ships.viewSailingsButton).first().click()
    cy.wait(`@getSailings-${shipId}`)

    cy.get(selectors.sailings.panel).should('be.visible')
    cy.get(selectors.itinerary.panel).should('not.be.visible')
  })

})
