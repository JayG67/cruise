import { selectors } from '../support/selectors'

const cruiseLines = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Carnival Cruise Line',
    country: 'United States',
    website: 'https://www.carnival.com'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Empty Fleet Line',
    country: 'United States',
    website: null
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Unsafe Demo Line',
    country: 'Test Country',
    website: null
  }
]

const shipMap = {
  [cruiseLines[0].id]: [
    { id: 'ship-1', name: 'Icon of the Seas', cruiseLineId: cruiseLines[0].id },
    { id: 'ship-2', name: 'Wonder of the Seas', cruiseLineId: cruiseLines[0].id }
  ],
  [cruiseLines[1].id]: [
    { id: 'ship-3', name: 'Mardi Gras', cruiseLineId: cruiseLines[1].id },
    { id: 'ship-4', name: 'Carnival Celebration', cruiseLineId: cruiseLines[1].id },
    { id: 'ship-5', name: 'Carnival Jubilee', cruiseLineId: cruiseLines[1].id }
  ],
  [cruiseLines[2].id]: [],
  [cruiseLines[3].id]: [
    { id: 'ship-6', name: '<img src=x onerror=alert(1)> Ship', cruiseLineId: cruiseLines[3].id }
  ]
}

function visitShipsPage() {
  cy.intercept('GET', '/cruise', {
    statusCode: 200,
    body: cruiseLines
  }).as('getCruiseLines')

  cy.visit('/')
  cy.wait('@getCruiseLines')
  cy.get(selectors.cruiseLines.card).should('have.length', cruiseLines.length)
}

function mockShipsFor(cruiseLine, response = shipMap[cruiseLine.id]) {
  cy.intercept('GET', `/cruise/ships/${cruiseLine.id}`, {
    statusCode: 200,
    body: response
  }).as(`getShips-${cruiseLine.id}`)
}

function clickViewShips(cruiseLineName) {
  cy.contains(selectors.cruiseLines.card, cruiseLineName)
    .find(selectors.cruiseLines.viewShipsButton)
    .click()
}

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

  it('shows an empty ships grid when the selected cruise line has no ships', () => {
    const cruiseLine = cruiseLines[2]
    mockShipsFor(cruiseLine, [])

    clickViewShips(cruiseLine.name)
    cy.wait(`@getShips-${cruiseLine.id}`)

    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.ships.title).should('contain.text', `${cruiseLine.name} Ships`)
    cy.get(selectors.ships.card).should('not.exist')
    cy.get(selectors.ships.grid).should('be.empty')
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
