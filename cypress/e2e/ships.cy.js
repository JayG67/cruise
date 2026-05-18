import { selectors } from '../support/selectors'
import {
  shipsCruiseLines as cruiseLines,
  shipMap
} from '../support/testData'
import {
  visitShipsPage,
  mockShipsFor,
  mockShipsForCruiseLine,
  mockSailingsForShip,
  mockItineraryForSailing,
  mockCreateShip,
  mockUpdateShip,
  mockDeleteShip
} from '../support/apiMocks'
import { clickViewShips } from '../support/workflows'

describe('Cruise Explorer ship lookup UI', () => {
  beforeEach(() => {
    visitShipsPage()
  })

  it('keeps the ships panel hidden before a cruise line is selected', () => {
    cy.get(selectors.ships.panel).should('not.be.visible')
    cy.get(selectors.ships.title).should('have.text', 'Ships')
    cy.get(selectors.ships.grid).should('be.empty')
  })

  it('requests ships for the selected cruise line id', () => {
    const cruiseLine = cruiseLines[0]
    mockShipsFor(cruiseLine)

    clickViewShips(cruiseLine.name)

    cy.wait(`@getShips-${cruiseLine.id}`)
      .its('request.url')
      .should('include', `/cruise/ships/${cruiseLine.id}`)
  })

  it('loads ships when View Ships is clicked', () => {
    const cruiseLine = cruiseLines[0]
    const ships = shipMap[cruiseLine.id]
    mockShipsFor(cruiseLine)

    clickViewShips(cruiseLine.name)
    cy.wait(`@getShips-${cruiseLine.id}`)

    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.ships.title).should('contain.text', `${cruiseLine.name} Ships`)
    cy.get(selectors.ships.card).should('have.length', ships.length)

    ships.forEach((ship) => {
      cy.get(selectors.ships.grid).should('contain.text', ship.name)
    })
  })

  it('shows a loading message while ships are being requested', () => {
    const cruiseLine = cruiseLines[0]

    cy.intercept('GET', `/cruise/ships/${cruiseLine.id}`, (req) => {
      req.reply({
        delay: 500,
        statusCode: 200,
        body: shipMap[cruiseLine.id]
      })
    }).as('slowShips')

    clickViewShips(cruiseLine.name)

    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.ships.grid).should('contain.text', 'Loading ships...')

    cy.wait('@slowShips')
    cy.get(selectors.ships.grid).should('not.contain.text', 'Loading ships...')
    cy.get(selectors.ships.card).should('have.length', shipMap[cruiseLine.id].length)
  })

  it('renders each ship as its own card', () => {
    const cruiseLine = cruiseLines[1]
    const ships = shipMap[cruiseLine.id]
    mockShipsFor(cruiseLine)

    clickViewShips(cruiseLine.name)
    cy.wait(`@getShips-${cruiseLine.id}`)

    cy.get(selectors.ships.card).should('have.length', ships.length)
    ships.forEach((ship) => {
      cy.contains(selectors.ships.card, ship.name).should('be.visible')
    })
  })

  it('updates the ships panel when a different cruise line is selected', () => {
    const firstCruiseLine = cruiseLines[0]
    const secondCruiseLine = cruiseLines[1]

    mockShipsFor(firstCruiseLine)
    mockShipsFor(secondCruiseLine)

    clickViewShips(firstCruiseLine.name)
    cy.wait(`@getShips-${firstCruiseLine.id}`)
    cy.get(selectors.ships.title).should('contain.text', `${firstCruiseLine.name} Ships`)
    cy.get(selectors.ships.grid).should('contain.text', 'Icon of the Seas')

    clickViewShips(secondCruiseLine.name)
    cy.wait(`@getShips-${secondCruiseLine.id}`)
    cy.get(selectors.ships.title).should('contain.text', `${secondCruiseLine.name} Ships`)
    cy.get(selectors.ships.grid).should('contain.text', 'Mardi Gras')
    cy.get(selectors.ships.grid).should('not.contain.text', 'Icon of the Seas')
  })

  it('keeps cruise line results visible after loading ships', () => {
    const cruiseLine = cruiseLines[0]
    mockShipsFor(cruiseLine)

    clickViewShips(cruiseLine.name)
    cy.wait(`@getShips-${cruiseLine.id}`)

    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.cruiseLines.card).should('have.length', cruiseLines.length)
  })

  it('loads ships after filtering to a cruise line', () => {
    const cruiseLine = cruiseLines[1]
    mockShipsFor(cruiseLine)

    cy.get(selectors.cruiseLines.searchInput).type('Carnival')
    cy.get(selectors.cruiseLines.card).should('have.length', 1)

    clickViewShips(cruiseLine.name)
    cy.wait(`@getShips-${cruiseLine.id}`)

    cy.get(selectors.ships.title).should('contain.text', `${cruiseLine.name} Ships`)
    cy.get(selectors.ships.grid).should('contain.text', 'Mardi Gras')
  })

  it('loads ships correctly after a case-insensitive cruise line search', () => {
    const cruiseLine = cruiseLines[0]
    mockShipsFor(cruiseLine)

    cy.get(selectors.cruiseLines.searchInput).type('royal')
    cy.get(selectors.cruiseLines.card).should('have.length', 1)

    clickViewShips(cruiseLine.name)
    cy.wait(`@getShips-${cruiseLine.id}`)

    cy.get(selectors.ships.title).should('contain.text', `${cruiseLine.name} Ships`)
    cy.get(selectors.ships.card).should('have.length', shipMap[cruiseLine.id].length)
  })

  it('does not clear ships when search input is changed after ships are loaded', () => {
    const cruiseLine = cruiseLines[0]
    mockShipsFor(cruiseLine)

    clickViewShips(cruiseLine.name)
    cy.wait(`@getShips-${cruiseLine.id}`)
    cy.get(selectors.ships.card).should('have.length', shipMap[cruiseLine.id].length)

    cy.get(selectors.cruiseLines.searchInput).type('ZZZ_NO_MATCH_TEST')

    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.ships.title).should('contain.text', `${cruiseLine.name} Ships`)
    cy.get(selectors.ships.card).should('have.length', shipMap[cruiseLine.id].length)
  })

  it('shows an empty ships state when the selected cruise line has no ships', () => {
    const cruiseLine = cruiseLines[2]
    mockShipsFor(cruiseLine, [])

    clickViewShips(cruiseLine.name)
    cy.wait(`@getShips-${cruiseLine.id}`)

    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.ships.title).should('contain.text', `${cruiseLine.name} Ships`)
    cy.get(selectors.ships.card).should('not.exist')
    cy.get(selectors.ships.createForm).should('be.visible')
    cy.get(selectors.ships.emptyMessage)
      .should('be.visible')
      .and('contain.text', 'No ships found')
  })

  it('shows a fallback message when the ship API returns an error', () => {
    const cruiseLine = cruiseLines[0]

    cy.intercept('GET', `/cruise/ships/${cruiseLine.id}`, {
      statusCode: 500,
      body: { message: 'Ship lookup failed' }
    }).as('shipApiFailure')

    clickViewShips(cruiseLine.name)
    cy.wait('@shipApiFailure')

    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.ships.title).should('contain.text', `${cruiseLine.name} Ships`)
    cy.get(selectors.ships.grid).should('contain.text', 'No ships found for this cruise line yet.')
    cy.get(selectors.ships.card).should('not.exist')
  })

  it('shows a fallback message when the ship API returns invalid JSON', () => {
    const cruiseLine = cruiseLines[0]

    cy.intercept('GET', `/cruise/ships/${cruiseLine.id}`, {
      statusCode: 200,
      body: 'not-json',
      headers: { 'content-type': 'application/json' }
    }).as('invalidShipsJson')

    clickViewShips(cruiseLine.name)
    cy.wait('@invalidShipsJson')

    cy.get(selectors.ships.grid).should('contain.text', 'No ships found for this cruise line yet.')
    cy.get(selectors.ships.card).should('not.exist')
  })

  it('escapes ship names before rendering them as HTML', () => {
    const cruiseLine = cruiseLines[3]
    mockShipsFor(cruiseLine)

    clickViewShips(cruiseLine.name)
    cy.wait(`@getShips-${cruiseLine.id}`)

    cy.get(`${selectors.ships.grid} img`).should('not.exist')
    cy.get(selectors.ships.grid).should('contain.text', '<img src=x onerror=alert(1)> Ship')
  })

  it('keeps the most recently selected cruise line title after a previous ship request fails', () => {
    const firstCruiseLine = cruiseLines[0]
    const secondCruiseLine = cruiseLines[1]

    cy.intercept('GET', `/cruise/ships/${firstCruiseLine.id}`, {
      statusCode: 500,
      body: { message: 'Failure' }
    }).as('firstShipFailure')
    mockShipsFor(secondCruiseLine)

    clickViewShips(firstCruiseLine.name)
    cy.wait('@firstShipFailure')
    cy.get(selectors.ships.grid).should('contain.text', 'No ships found for this cruise line yet.')

    clickViewShips(secondCruiseLine.name)
    cy.wait(`@getShips-${secondCruiseLine.id}`)
    cy.get(selectors.ships.title).should('contain.text', `${secondCruiseLine.name} Ships`)
    cy.get(selectors.ships.grid).should('contain.text', 'Mardi Gras')
    cy.get(selectors.ships.grid).should('not.contain.text', 'No ships found')
  })

  it('does not request ships when no cruise lines match the current search', () => {
    cy.intercept('GET', '/cruise/ships/*', {
      statusCode: 200,
      body: []
    }).as('anyShipLookup')

    cy.get(selectors.cruiseLines.searchInput).type('ZZZ_NO_MATCH_TEST')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'No cruise lines match your search.')
    cy.get(`${selectors.cruiseLines.grid} button`).should('not.exist')
    cy.get('@anyShipLookup.all').should('have.length', 0)
  })
})

describe('Cruise Explorer ships additional regression coverage', () => {
  const additionalLineId = 'cccccccc-0000-4000-8000-000000000001'
  const secondLineId = 'cccccccc-0000-4000-8000-000000000002'
  const additionalLines = [
    {
      id: additionalLineId,
      name: 'Norwegian Cruise Line',
      country: 'United States',
      website: 'https://www.ncl.com'
    },
    {
      id: secondLineId,
      name: 'Disney Cruise Line',
      country: 'United States',
      website: 'https://disneycruise.disney.go.com'
    }
  ]

  function visitAdditionalShipsPage() {
    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: additionalLines
    }).as('additionalShipsGetCruiseLines')

    cy.visit('/')
    cy.wait('@additionalShipsGetCruiseLines')
  }

  beforeEach(() => {
    visitAdditionalShipsPage()
  })

  it('shows the loading message while ships are being requested', () => {
    cy.intercept('GET', `/cruise/ships/${additionalLineId}`, (req) => {
      req.reply({
        delay: 500,
        statusCode: 200,
        body: [{ id: 'ship-1', name: 'Norwegian Prima', cruiseLineId: additionalLineId }]
      })
    }).as('additionalSlowShips')

    cy.contains(selectors.cruiseLines.card, 'Norwegian Cruise Line')
      .find(selectors.cruiseLines.viewShipsButton)
      .click()

    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.ships.loadingMessage).should('contain.text', 'Loading ships...')
    cy.wait('@additionalSlowShips')
    cy.get(selectors.ships.card).should('contain.text', 'Norwegian Prima')
  })

  it('renders no ship cards when the ship API returns an empty array', () => {
    cy.intercept('GET', `/cruise/ships/${additionalLineId}`, {
      statusCode: 200,
      body: []
    }).as('additionalEmptyShips')

    cy.contains(selectors.cruiseLines.card, 'Norwegian Cruise Line')
      .find(selectors.cruiseLines.viewShipsButton)
      .click()

    cy.wait('@additionalEmptyShips')
    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.ships.card).should('not.exist')
  })

  it('escapes ship names before rendering them as HTML', () => {
    cy.intercept('GET', `/cruise/ships/${additionalLineId}`, {
      statusCode: 200,
      body: [
        {
          id: 'ship-unsafe',
          name: '<img src=x onerror=alert(1)> Ship',
          cruiseLineId: additionalLineId
        }
      ]
    }).as('additionalUnsafeShips')

    cy.contains(selectors.cruiseLines.card, 'Norwegian Cruise Line')
      .find(selectors.cruiseLines.viewShipsButton)
      .click()

    cy.wait('@additionalUnsafeShips')
    cy.get(`${selectors.ships.grid} img`).should('not.exist')
    cy.get(selectors.ships.grid).should('contain.text', '<img src=x onerror=alert(1)> Ship')
  })

  it('keeps the ships panel visible and updates the title when switching lines', () => {
    cy.intercept('GET', `/cruise/ships/${additionalLineId}`, {
      statusCode: 200,
      body: [{ id: 'ship-1', name: 'Norwegian Prima', cruiseLineId: additionalLineId }]
    }).as('additionalNclShips')

    cy.intercept('GET', `/cruise/ships/${secondLineId}`, {
      statusCode: 200,
      body: [{ id: 'ship-2', name: 'Disney Wish', cruiseLineId: secondLineId }]
    }).as('additionalDisneyShips')

    cy.contains(selectors.cruiseLines.card, 'Norwegian Cruise Line')
      .find(selectors.cruiseLines.viewShipsButton)
      .click()
    cy.wait('@additionalNclShips')
    cy.get(selectors.ships.title).should('contain.text', 'Norwegian Cruise Line Ships')

    cy.contains(selectors.cruiseLines.card, 'Disney Cruise Line')
      .find(selectors.cruiseLines.viewShipsButton)
      .click()
    cy.wait('@additionalDisneyShips')
    cy.get(selectors.ships.title).should('contain.text', 'Disney Cruise Line Ships')
    cy.get(selectors.ships.grid).should('contain.text', 'Disney Wish')
    cy.get(selectors.ships.grid).should('not.contain.text', 'Norwegian Prima')
  })

  it('does not open the ships panel before a view ships action is selected', () => {
    cy.get(selectors.ships.panel).should('not.be.visible')
    cy.get(selectors.ships.card).should('not.exist')
  })
})


describe('Cruise Explorer ship direct CRUD UI and cascade behavior', () => {
  const cruiseLine = cruiseLines[0]
  const ship = shipMap[cruiseLine.id][0]
  const sailingId = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  const itineraryDayId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'
  const activityId = 'ffffffff-ffff-ffff-ffff-fffffffffff1'

  const sailings = [
    {
      id: sailingId,
      shipId: ship.id,
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

  beforeEach(() => {
    visitShipsPage()
    mockShipsFor(cruiseLine)
    clickViewShips(cruiseLine.name)
    cy.wait(`@getShips-${cruiseLine.id}`)
  })

  it('renders direct create, update, delete, and sailing controls for ships', () => {
    cy.get(selectors.ships.createForm).should('be.visible')
    cy.get(selectors.ships.createNameInput).should('be.visible')
    cy.get(selectors.ships.createCurrentPortInput).should('be.visible')
    cy.get(selectors.ships.createSubmitButton).should('be.visible')

    cy.get(selectors.ships.card).first().within(() => {
      cy.get(selectors.ships.viewSailingsButton).should('be.visible')
      cy.get(selectors.ships.updateButton).should('be.visible')
      cy.get(selectors.ships.deleteButton).should('be.visible')
    })
  })

  it('creates a ship from the selected fleet panel and refreshes ships', () => {
    const reloadedShips = [
      ...shipMap[cruiseLine.id],
      {
        id: 'abababab-abab-abab-abab-abababababab',
        name: 'New Portfolio Ship',
        currentPort: 'Tampa, Florida',
        cruiseLineId: cruiseLine.id
      }
    ]

    mockCreateShip({ message: 'Ship created successfully', id: 'abababab-abab-abab-abab-abababababab' })
    mockShipsForCruiseLine(cruiseLine.id, reloadedShips, `reloadShips-${cruiseLine.id}`)

    cy.get(selectors.ships.createNameInput).type('New Portfolio Ship')
    cy.get(selectors.ships.createCurrentPortInput).type('Tampa, Florida')
    cy.get(selectors.ships.createSubmitButton).click()

    cy.wait('@createShip').its('request.body').should('deep.include', {
      name: 'New Portfolio Ship',
      currentPort: 'Tampa, Florida',
      cruiseLineId: cruiseLine.id
    })
    cy.wait(`@reloadShips-${cruiseLine.id}`)
    cy.get(selectors.ships.grid).should('contain.text', 'New Portfolio Ship')
  })

  it('trims direct ship create values before sending them to the API', () => {
    mockCreateShip({ message: 'Ship created successfully', id: 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc' })
    mockShipsForCruiseLine(cruiseLine.id, shipMap[cruiseLine.id], `reloadShips-${cruiseLine.id}`)

    cy.get(selectors.ships.createNameInput).type('  Trimmed Ship  ')
    cy.get(selectors.ships.createCurrentPortInput).type('  Miami, Florida  ')
    cy.get(selectors.ships.createSubmitButton).click()

    cy.wait('@createShip').its('request.body').should('deep.include', {
      name: 'Trimmed Ship',
      currentPort: 'Miami, Florida',
      cruiseLineId: cruiseLine.id
    })
  })

  it('shows direct ship create API failures without refreshing the fleet', () => {
    cy.intercept('POST', '/cruise/ship', {
      statusCode: 400,
      body: { message: 'Ship with the same name already exists' }
    }).as('createShipFailure')

    cy.get(selectors.ships.createNameInput).type(ship.name)
    cy.get(selectors.ships.createCurrentPortInput).type('Miami, Florida')
    cy.get(selectors.ships.createSubmitButton).click()

    cy.wait('@createShipFailure')
    cy.get(selectors.ships.createMessage).should('contain.text', 'Ship with the same name already exists')
    cy.get(`@getShips-${cruiseLine.id}.all`).should('have.length', 1)
  })

  it('updates a ship directly from the ship card and refreshes the fleet', () => {
    const reloadedShips = [
      {
        ...ship,
        name: 'Updated Portfolio Ship',
        currentPort: 'Fort Lauderdale, Florida'
      }
    ]

    mockUpdateShip(ship.id, { message: 'Ship updated successfully' })
    mockShipsForCruiseLine(cruiseLine.id, reloadedShips, `reloadShips-${cruiseLine.id}`)

    cy.window().then(win => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('Updated Portfolio Ship')
        .onCall(1).returns('Fort Lauderdale, Florida')
    })

    cy.get(selectors.ships.updateButton).first().click({ force: true })

    cy.wait(`@updateShip-${ship.id}`).its('request.body').should('deep.include', {
      name: 'Updated Portfolio Ship',
      currentPort: 'Fort Lauderdale, Florida',
      cruiseLineId: cruiseLine.id
    })
    cy.wait(`@reloadShips-${cruiseLine.id}`)
    cy.get(selectors.ships.grid).should('contain.text', 'Updated Portfolio Ship')
  })

  it('does not update a ship when the current port prompt is cancelled', () => {
    mockUpdateShip(ship.id, { message: 'Should not update' })

    cy.window().then(win => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('Updated Portfolio Ship')
        .onCall(1).returns(null)
    })

    cy.get(selectors.ships.updateButton).first().click({ force: true })

    cy.get(`@updateShip-${ship.id}.all`).should('have.length', 0)
  })

  it('surfaces direct ship update API failures to the admin user', () => {
    cy.intercept('PATCH', `/cruise/ship/${ship.id}`, {
      statusCode: 500,
      body: { message: 'Ship update failed' }
    }).as(`updateShipFailure-${ship.id}`)

    cy.window().then(win => {
      cy.stub(win, 'prompt')
        .onCall(0).returns('Updated Portfolio Ship')
        .onCall(1).returns('Fort Lauderdale, Florida')
      cy.stub(win, 'alert').as('alert')
    })

    cy.get(selectors.ships.updateButton).first().click({ force: true })

    cy.wait(`@updateShipFailure-${ship.id}`)
    cy.get('@alert').should('have.been.calledWith', 'Ship update failed')
  })

  it('deletes a ship directly and refreshes the fleet', () => {
    const remainingShips = shipMap[cruiseLine.id].filter(record => record.id !== ship.id)

    mockDeleteShip(ship.id, { message: 'Ship deleted successfully' })
    mockShipsForCruiseLine(cruiseLine.id, remainingShips, `reloadShips-${cruiseLine.id}`)

    cy.window().then(win => {
      cy.stub(win, 'confirm').as('confirmDeleteShip').returns(true)
    })

    cy.get(selectors.ships.deleteButton).first().click({ force: true })

    cy.get('@confirmDeleteShip').should(
      'have.been.calledWith',
      `Delete ${ship.name}? This will also delete related sailings, itinerary days, and activities.`
    )
    cy.wait(`@deleteShip-${ship.id}`)
    cy.wait(`@reloadShips-${cruiseLine.id}`)
  })

  it('does not delete a ship when confirmation is cancelled', () => {
    mockDeleteShip(ship.id, { message: 'Should not delete' })

    cy.window().then(win => {
      cy.stub(win, 'confirm').returns(false)
    })

    cy.get(selectors.ships.deleteButton).first().click({ force: true })

    cy.get(`@deleteShip-${ship.id}.all`).should('have.length', 0)
  })

  it('surfaces direct ship delete API failures to the admin user', () => {
    cy.intercept('DELETE', `/cruise/ship/${ship.id}`, {
      statusCode: 500,
      body: { message: 'Ship delete failed' }
    }).as(`deleteShipFailure-${ship.id}`)

    cy.window().then(win => {
      cy.stub(win, 'confirm').returns(true)
      cy.stub(win, 'alert').as('alert')
    })

    cy.get(selectors.ships.deleteButton).first().click({ force: true })

    cy.wait(`@deleteShipFailure-${ship.id}`)
    cy.get('@alert').should('have.been.calledWith', 'Ship delete failed')
  })

  it('hides stale sailings and itinerary panels after deleting the selected ship', () => {
    mockSailingsForShip(ship.id, sailings)
    mockItineraryForSailing(sailingId, itinerary)
    mockDeleteShip(ship.id, { message: 'Ship deleted successfully' })
    mockShipsForCruiseLine(cruiseLine.id, [], `reloadShips-${cruiseLine.id}`)

    cy.get(selectors.ships.viewSailingsButton).first().click()
    cy.wait(`@getSailings-${ship.id}`)
    cy.get(selectors.sailings.viewItineraryButton).first().click()
    cy.wait(`@getItinerary-${sailingId}`)

    cy.get(selectors.sailings.panel).should('be.visible')
    cy.get(selectors.itinerary.panel).should('be.visible')

    cy.window().then(win => {
      cy.stub(win, 'confirm').returns(true)
    })

    cy.get(selectors.ships.deleteButton).first().click({ force: true })

    cy.wait(`@deleteShip-${ship.id}`)
    cy.wait(`@reloadShips-${cruiseLine.id}`)
    cy.get(selectors.sailings.panel).should('not.be.visible')
    cy.get(selectors.itinerary.panel).should('not.be.visible')
  })
})

