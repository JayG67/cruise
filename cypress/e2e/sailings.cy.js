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
const roundTripSailingId = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
const repositioningSailingId = 'dddddddd-dddd-dddd-dddd-dddddddddddd'

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
    id: roundTripSailingId,
    shipId,
    departureDate: '2026-07-05',
    port: 'Miami, Florida',
    departurePort: 'Miami, Florida',
    arrivalPort: 'Miami, Florida',
    days: 3,
    isRepositioning: false
  },
  {
    id: repositioningSailingId,
    shipId,
    departureDate: '2026-07-19',
    port: 'Miami, Florida',
    departurePort: 'Miami, Florida',
    arrivalPort: 'Barcelona, Spain',
    days: 13,
    isRepositioning: true
  }
]

const roundTripItinerary = [
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    sailingId: roundTripSailingId,
    day: 1,
    title: 'Embarkation Day',
    port: 'Miami, Florida',
    activitySchedule: [
      {
        id: 'ffffffff-ffff-ffff-ffff-fffffffffff1',
        itineraryDayId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
        time: '12:00 PM',
        activity: 'Guest boarding and welcome lunch'
      },
      {
        id: 'ffffffff-ffff-ffff-ffff-fffffffffff4',
        itineraryDayId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
        time: '4:00 PM',
        activity: 'Mandatory safety briefing'
      }
    ]
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
    sailingId: roundTripSailingId,
    day: 2,
    title: 'Day at Sea',
    port: 'At Sea',
    activitySchedule: [
      {
        id: 'ffffffff-ffff-ffff-ffff-fffffffffff2',
        itineraryDayId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
        time: '9:00 AM',
        activity: 'Morning fitness and stretch class'
      }
    ]
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3',
    sailingId: roundTripSailingId,
    day: 3,
    title: 'Return to Port',
    port: 'Miami, Florida',
    activitySchedule: [
      {
        id: 'ffffffff-ffff-ffff-ffff-fffffffffff3',
        itineraryDayId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3',
        time: '7:00 AM',
        activity: 'Farewell breakfast service'
      }
    ]
  }
]

const repositioningItinerary = [
  {
    id: '99999999-9999-9999-9999-999999999991',
    sailingId: repositioningSailingId,
    day: 1,
    title: 'Embarkation Day — Miami, Florida',
    port: 'Miami, Florida',
    activitySchedule: [
      {
        id: '99999999-9999-9999-9999-999999999901',
        itineraryDayId: '99999999-9999-9999-9999-999999999991',
        time: '12:00 PM',
        activity: 'Guest boarding and welcome lunch'
      }
    ]
  },
  {
    id: '99999999-9999-9999-9999-999999999992',
    sailingId: repositioningSailingId,
    day: 2,
    title: 'Day at Sea',
    port: 'At Sea',
    activitySchedule: [
      {
        id: '99999999-9999-9999-9999-999999999902',
        itineraryDayId: '99999999-9999-9999-9999-999999999992',
        time: '9:00 AM',
        activity: 'Ocean crossing enrichment lecture'
      }
    ]
  },
  {
    id: '99999999-9999-9999-9999-999999999993',
    sailingId: repositioningSailingId,
    day: 3,
    title: 'Port Day — King’s Wharf, Bermuda',
    port: 'King’s Wharf, Bermuda',
    activitySchedule: [
      {
        id: '99999999-9999-9999-9999-999999999903',
        itineraryDayId: '99999999-9999-9999-9999-999999999993',
        time: '8:00 AM',
        activity: 'Arrive in King’s Wharf, Bermuda and shore excursion meetup'
      }
    ]
  },
  {
    id: '99999999-9999-9999-9999-999999999994',
    sailingId: repositioningSailingId,
    day: 13,
    title: 'Arrival Day — Barcelona, Spain',
    port: 'Barcelona, Spain',
    activitySchedule: [
      {
        id: '99999999-9999-9999-9999-999999999904',
        itineraryDayId: '99999999-9999-9999-9999-999999999994',
        time: '7:00 AM',
        activity: 'Arrival into Barcelona, Spain and breakfast service'
      }
    ]
  }
]

function openShipSailings() {
  cy.get(selectors.cruiseLines.viewShipsButton).click()
  cy.wait(`@getShips-${cruiseLineId}`)

  cy.get(selectors.ships.panel).should('be.visible')
  cy.get(selectors.ships.card).should('have.length', 1)
  cy.get(selectors.ships.viewSailingsButton).click()
  cy.wait(`@getSailings-${shipId}`)
}

function openRoundTripItinerary() {
  openShipSailings()
  cy.get(selectors.sailings.viewItineraryButton).first().click()
  cy.wait(`@getItinerary-${roundTripSailingId}`)
}

describe('Sailings and itinerary UI', () => {
  beforeEach(() => {
    visitHomeWithCruiseLines(cruiseLines)
    mockShipsForCruiseLine(cruiseLineId, ships)
    mockSailingsForShip(shipId, sailings)
    mockItineraryForSailing(roundTripSailingId, roundTripItinerary)
    mockItineraryForSailing(repositioningSailingId, repositioningItinerary)
  })

  it('loads sailings for a selected ship and renders itinerary details', () => {
    openRoundTripItinerary()

    cy.get(selectors.sailings.panel).should('be.visible')
    cy.get(selectors.sailings.title).should('contain.text', 'Icon of the Seas Sailings')
    cy.get(selectors.sailings.card).should('have.length', 2)
    cy.get(selectors.ships.card).first().should('contain.text', 'Current Port:')
    cy.get(selectors.ships.card).first().should('contain.text', 'Miami, Florida')
    cy.get(selectors.ships.card).first().should('not.contain.text', 'Ship ID:')
    cy.get(selectors.sailings.card).first().should('contain.text', 'Departure Port:')
    cy.get(selectors.sailings.card).first().should('contain.text', 'Arrival Port:')
    cy.get(selectors.sailings.card).first().should('contain.text', 'Miami, Florida')
    cy.get(selectors.sailings.card).first().should('contain.text', '3 days')
    cy.get(selectors.sailings.card).last().should('contain.text', 'Repositioning Sailing')
    cy.get(selectors.sailings.card).last().should('contain.text', 'Barcelona, Spain')

    cy.get(selectors.itinerary.panel).should('be.visible')
    cy.get(selectors.itinerary.title).should('contain.text', 'Icon of the Seas Itinerary')
    cy.get(selectors.itinerary.day).should('have.length', 3)
    cy.get(selectors.itinerary.daySummary).first().should('contain.text', 'Day 1')
    cy.get(selectors.itinerary.itineraryPort).first().should('contain.text', 'Miami, Florida')
    cy.get(selectors.itinerary.activity).first().should('contain.text', 'Guest boarding and welcome lunch')
  })

  it('renders current port on ship cards without exposing internal IDs', () => {
    openShipSailings()

    cy.get(selectors.ships.card)
      .first()
      .should('contain.text', 'Icon of the Seas')
      .and('contain.text', 'Current Port:')
      .and('contain.text', 'Miami, Florida')
      .and('not.contain.text', shipId)
      .and('not.contain.text', 'Ship ID:')
  })

  it('renders round-trip and repositioning sailing types distinctly', () => {
    openShipSailings()

    cy.get(selectors.sailings.card)
      .first()
      .should('contain.text', 'Round-Trip / Regional Sailing')
      .and('contain.text', 'Departure Port:')
      .and('contain.text', 'Arrival Port:')
      .and('contain.text', '3 days')

    cy.get(selectors.sailings.card)
      .last()
      .should('contain.text', 'Repositioning Sailing')
      .and('contain.text', 'Miami, Florida')
      .and('contain.text', 'Barcelona, Spain')
      .and('contain.text', '13 days')
  })

  it('renders itinerary port labels for embarkation, sea day, and return day', () => {
    openRoundTripItinerary()

    cy.get(selectors.itinerary.itineraryPort).eq(0).should('contain.text', 'Miami, Florida')
    cy.get(selectors.itinerary.itineraryPort).eq(1).should('contain.text', 'At Sea')
    cy.get(selectors.itinerary.itineraryPort).eq(2).should('contain.text', 'Miami, Florida')
  })

  it('keeps itinerary days collapsed until the user expands them', () => {
    openRoundTripItinerary()

    cy.get(selectors.itinerary.day).first().should('not.have.attr', 'open')
    cy.get(selectors.itinerary.daySummary).first().click()
    cy.get(selectors.itinerary.day).first().should('have.attr', 'open')
    cy.get(selectors.itinerary.activitySchedule).first().should('be.visible')
    cy.get(selectors.itinerary.activity).first().should('contain.text', 'Guest boarding')
  })

  it('shows multiple activity rows for an expanded itinerary day', () => {
    openRoundTripItinerary()

    cy.get(selectors.itinerary.daySummary).first().click()
    cy.get(selectors.itinerary.day).first().within(() => {
      cy.get(selectors.itinerary.activity).should('have.length', 2)
      cy.get(selectors.itinerary.activity).first().should('contain.text', '12:00 PM')
      cy.get(selectors.itinerary.activity).last().should('contain.text', '4:00 PM')
    })
  })

  it('switches itinerary content when a different sailing is selected', () => {
    openShipSailings()

    cy.get(selectors.sailings.viewItineraryButton).last().click()
    cy.wait(`@getItinerary-${repositioningSailingId}`)

    cy.get(selectors.itinerary.title).should('contain.text', 'Icon of the Seas Itinerary')
    cy.get(selectors.itinerary.daySummary).first().should('contain.text', 'Day 1')
    cy.get(selectors.itinerary.grid).should('contain.text', 'Barcelona, Spain')
    cy.get(selectors.itinerary.grid).should('contain.text', 'King’s Wharf, Bermuda')
  })

  it('renders repositioning itinerary port visits and sea days realistically', () => {
    openShipSailings()

    cy.get(selectors.sailings.viewItineraryButton).last().click()
    cy.wait(`@getItinerary-${repositioningSailingId}`)

    cy.get(selectors.itinerary.itineraryPort).eq(0).should('contain.text', 'Miami, Florida')
    cy.get(selectors.itinerary.itineraryPort).eq(1).should('contain.text', 'At Sea')
    cy.get(selectors.itinerary.itineraryPort).eq(2).should('contain.text', 'King’s Wharf, Bermuda')
    cy.get(selectors.itinerary.itineraryPort).last().should('contain.text', 'Barcelona, Spain')
  })

  it('hides the previous itinerary panel while loading sailings for another ship', () => {
    openRoundTripItinerary()

    cy.get(selectors.itinerary.panel).should('be.visible')
    cy.get(selectors.ships.viewSailingsButton).click()
    cy.wait(`@getSailings-${shipId}`)
    cy.get(selectors.sailings.panel).should('be.visible')
    cy.get(selectors.itinerary.panel).should('not.be.visible')
  })

  it('shows a fallback message when sailings cannot be loaded', () => {
    cy.intercept('GET', `/cruise/ship/${shipId}/sailings`, {
      statusCode: 500,
      body: { message: 'Sailing service unavailable' }
    }).as(`getSailings-${shipId}`)

    cy.get(selectors.cruiseLines.viewShipsButton).click()
    cy.wait(`@getShips-${cruiseLineId}`)
    cy.get(selectors.ships.viewSailingsButton).click()
    cy.wait(`@getSailings-${shipId}`)

    cy.get(selectors.sailings.emptyMessage)
      .should('be.visible')
      .and('contain.text', 'No sailings found')
  })

  it('shows a fallback message when itinerary cannot be loaded', () => {
    cy.intercept('GET', `/cruise/sailings/${roundTripSailingId}/itinerary`, {
      statusCode: 500,
      body: { message: 'Itinerary service unavailable' }
    }).as(`getItinerary-${roundTripSailingId}`)

    openShipSailings()

    cy.get(selectors.sailings.viewItineraryButton).first().click()
    cy.wait(`@getItinerary-${roundTripSailingId}`)

    cy.get(selectors.itinerary.emptyMessage)
      .should('be.visible')
      .and('contain.text', 'No itinerary found')
  })

  it('shows loading messages while sailing and itinerary requests are pending', () => {
    cy.intercept('GET', `/cruise/ship/${shipId}/sailings`, (req) => {
      req.reply({
        delay: 250,
        statusCode: 200,
        body: sailings
      })
    }).as(`getSailings-${shipId}`)

    cy.intercept('GET', `/cruise/sailings/${roundTripSailingId}/itinerary`, (req) => {
      req.reply({
        delay: 250,
        statusCode: 200,
        body: roundTripItinerary
      })
    }).as(`getItinerary-${roundTripSailingId}`)

    cy.get(selectors.cruiseLines.viewShipsButton).click()
    cy.wait(`@getShips-${cruiseLineId}`)

    cy.get(selectors.ships.viewSailingsButton).click()
    cy.get(selectors.sailings.loadingMessage).should('contain.text', 'Loading sailings')
    cy.wait(`@getSailings-${shipId}`)

    cy.get(selectors.sailings.viewItineraryButton).first().click()
    cy.get(selectors.itinerary.loadingMessage).should('contain.text', 'Loading itinerary')
    cy.wait(`@getItinerary-${roundTripSailingId}`)
  })

  it('creates a sailing from the admin sailing form and refreshes the sailing list', () => {
    mockCreateSailing(shipId, {
      message: 'Sailing created successfully',
      id: '12121212-1212-1212-1212-121212121212'
    })

    openShipSailings()

    cy.get(selectors.sailings.createForm).should('be.visible')
    cy.get(selectors.sailings.departureDateInput).clear().type('2026-10-01')
    cy.get(selectors.sailings.departurePortInput).clear().type('Miami, Florida')
    cy.get(selectors.sailings.arrivalPortInput).clear().type('Nassau, Bahamas')
    cy.get(selectors.sailings.daysInput).clear().type('4')
    cy.get(selectors.sailings.createSubmitButton).click()

    cy.wait(`@createSailing-${shipId}`).its('request.body').should('deep.include', {
      departureDate: '2026-10-01',
      port: 'Miami, Florida',
      departurePort: 'Miami, Florida',
      arrivalPort: 'Nassau, Bahamas',
      days: 4,
      isRepositioning: false
    })
    cy.wait(`@getSailings-${shipId}`)
  })

  it('updates a sailing using the admin update action', () => {
    mockUpdateSailing(roundTripSailingId, {
      message: 'Sailing updated successfully'
    })

    openShipSailings()

    cy.window().then((win) => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('2026-10-02')
        .onCall(1).returns('Fort Lauderdale, Florida')
        .onCall(2).returns('Barcelona, Spain')
        .onCall(3).returns('12')
        .onCall(4).returns('true')
    })

    cy.get(selectors.sailings.updateButton).first().click()

    cy.wait(`@updateSailing-${roundTripSailingId}`).its('request.body').should('deep.include', {
      departureDate: '2026-10-02',
      port: 'Fort Lauderdale, Florida',
      departurePort: 'Fort Lauderdale, Florida',
      arrivalPort: 'Barcelona, Spain',
      days: 12,
      isRepositioning: true
    })
    cy.wait(`@getSailings-${shipId}`)
  })

  it('deletes a sailing after confirmation and refreshes the sailing list', () => {
    mockDeleteSailing(roundTripSailingId, {
      message: 'Sailing deleted successfully'
    })

    openShipSailings()

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true)
    })

    cy.get(selectors.sailings.deleteButton).first().click()

    cy.wait(`@deleteSailing-${roundTripSailingId}`)
    cy.wait(`@getSailings-${shipId}`)
  })

  it('does not delete a sailing when confirmation is cancelled', () => {
    mockDeleteSailing(roundTripSailingId, {
      message: 'Should not be called'
    })

    openShipSailings()

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(false)
    })

    cy.get(selectors.sailings.deleteButton).first().click()

    cy.get(`@deleteSailing-${roundTripSailingId}.all`).should('have.length', 0)
  })

  it('creates an itinerary day with an initial activity and refreshes itinerary data', () => {
    mockCreateItineraryDay(roundTripSailingId, {
      message: 'Itinerary day created successfully',
      id: 'abababab-abab-abab-abab-abababababab'
    })

    openRoundTripItinerary()

    cy.get(selectors.itinerary.createDayForm).should('be.visible')
    cy.get(selectors.itinerary.createDayNumberInput).clear().type('4')
    cy.get(selectors.itinerary.createDayTitleInput).type('Port Day — Nassau, Bahamas')
    cy.get(selectors.itinerary.createDayPortInput).type('Nassau, Bahamas')
    cy.get(selectors.itinerary.createDayActivityTimeInput).type('9:00 AM')
    cy.get(selectors.itinerary.createDayActivityTextInput).type('Shore excursion meetup')
    cy.get(selectors.itinerary.createDaySubmitButton).click()

    cy.wait(`@createItineraryDay-${roundTripSailingId}`).its('request.body').should('deep.include', {
      day: 4,
      title: 'Port Day — Nassau, Bahamas',
      port: 'Nassau, Bahamas'
    })
    cy.wait(`@getItinerary-${roundTripSailingId}`)
  })

  it('updates an itinerary day using the admin update action', () => {
    const itineraryDayId = roundTripItinerary[0].id

    mockUpdateItineraryDay(itineraryDayId, {
      message: 'Itinerary day updated successfully'
    })

    openRoundTripItinerary()

    cy.window().then((win) => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('1')
        .onCall(1).returns('Updated Embarkation Day')
        .onCall(2).returns('Fort Lauderdale, Florida')
    })

    cy.get(selectors.itinerary.day).first().within(() => {
      cy.get(selectors.itinerary.updateDayButton).click({ force: true })
    })

    cy.wait(`@updateItineraryDay-${itineraryDayId}`).its('request.body').should('deep.include', {
      day: 1,
      title: 'Updated Embarkation Day',
      port: 'Fort Lauderdale, Florida'
    })
    cy.wait(`@getItinerary-${roundTripSailingId}`)
  })

  it('deletes an itinerary day after confirmation', () => {
    const itineraryDayId = roundTripItinerary[0].id

    mockDeleteItineraryDay(itineraryDayId, {
      message: 'Itinerary day deleted successfully'
    })

    openRoundTripItinerary()

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true)
    })

    cy.get(selectors.itinerary.day).first().within(() => {
      cy.get(selectors.itinerary.deleteDayButton).click({ force: true })
    })

    cy.wait(`@deleteItineraryDay-${itineraryDayId}`)
    cy.wait(`@getItinerary-${roundTripSailingId}`)
  })

  it('creates, updates, and deletes itinerary activities from an expanded day', () => {
    const itineraryDayId = roundTripItinerary[0].id
    const activityId = roundTripItinerary[0].activitySchedule[0].id

    mockCreateActivity(itineraryDayId, {
      message: 'Activity created successfully',
      id: 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd'
    })
    mockUpdateActivity(activityId, {
      message: 'Activity updated successfully'
    })
    mockDeleteActivity(activityId, {
      message: 'Activity deleted successfully'
    })

    openRoundTripItinerary()

    cy.get(selectors.itinerary.daySummary).first().click()

    cy.get(selectors.itinerary.createActivityForm).first().within(() => {
      cy.get(selectors.itinerary.createActivityTimeInput).type('2:00 PM')
      cy.get(selectors.itinerary.createActivityTextInput).type('Poolside trivia')
      cy.get(selectors.itinerary.createActivitySubmitButton).click()
    })

    cy.wait(`@createActivity-${itineraryDayId}`).its('request.body').should('deep.include', {
      time: '2:00 PM',
      activity: 'Poolside trivia'
    })
    cy.wait(`@getItinerary-${roundTripSailingId}`)

    cy.window().then((win) => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('3:00 PM')
        .onCall(1).returns('Updated poolside trivia')
    })

    cy.get(selectors.itinerary.daySummary).first().click()
    cy.get(selectors.itinerary.updateActivityButton).first().click()

    cy.wait(`@updateActivity-${activityId}`).its('request.body').should('deep.include', {
      time: '3:00 PM',
      activity: 'Updated poolside trivia'
    })
    cy.wait(`@getItinerary-${roundTripSailingId}`)

    cy.window().then((win) => {
      win.confirm.restore && win.confirm.restore()
      cy.stub(win, 'confirm').returns(true)
    })

    cy.get(selectors.itinerary.daySummary).first().click()
    cy.get(selectors.itinerary.deleteActivityButton).first().click()

    cy.wait(`@deleteActivity-${activityId}`)
    cy.wait(`@getItinerary-${roundTripSailingId}`)
  })

})
