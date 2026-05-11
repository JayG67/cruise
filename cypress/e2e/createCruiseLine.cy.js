const initialCruiseLines = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  }
]

function visitWithMockedCruiseLines(cruiseLineList = [...initialCruiseLines]) {
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

function fillCruiseLineForm({ name, country, website, ships = [] }) {
  if (name !== undefined) cy.get('#new-cruise-line-name').clear().type(name)
  if (country !== undefined) cy.get('#new-cruise-line-country').clear().type(country)
  if (website !== undefined) cy.get('#new-cruise-line-website').clear().type(website)

  ships.forEach((shipName, index) => {
    if (index > 0) cy.get('#add-ship-input-btn').click()
    cy.get('input[name="shipName"]').eq(index).clear().type(shipName)
  })
}

describe('Create Cruise Line UI', () => {
  beforeEach(() => {
    visitWithMockedCruiseLines()
  })

  it('renders the create cruise line form with the expected fields and controls', () => {
    cy.contains('Add a Cruise Line').should('be.visible')
    cy.get('#new-cruise-line-name').should('be.visible')
    cy.get('#new-cruise-line-country').should('be.visible')
    cy.get('#new-cruise-line-website').should('be.visible')
    cy.get('input[name="shipName"]').should('have.length', 1)
    cy.get('#add-ship-input-btn').should('be.visible')
    cy.get('#create-cruise-line-btn').should('be.visible')
    cy.get('#reset-cruise-line-form-btn').should('be.visible')
  })

  it('creates a cruise line with no ships and refreshes the cruise line list', () => {
    const cruiseLineList = [...initialCruiseLines]

    cy.intercept('GET', '/cruise', req => {
      req.reply({ statusCode: 200, body: cruiseLineList })
    }).as('getCruiseLinesLive')

    cy.reload()
    cy.wait('@getCruiseLinesLive')

    cy.intercept('POST', '/cruise/cruise-line', req => {
      expect(req.body).to.deep.equal({
        name: 'Virgin Voyages',
        country: 'United States',
        website: 'https://www.virginvoyages.com'
      })

      cruiseLineList.push({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Virgin Voyages',
        country: 'United States',
        website: 'https://www.virginvoyages.com'
      })

      req.reply({
        statusCode: 201,
        body: {
          message: 'Cruise line created successfully',
          id: '22222222-2222-2222-2222-222222222222'
        }
      })
    }).as('createCruiseLine')

    cy.intercept('POST', '/cruise/ship', req => {
      throw new Error(`No ships should be created, but received ${JSON.stringify(req.body)}`)
    }).as('createShip')

    fillCruiseLineForm({
      name: 'Virgin Voyages',
      country: 'United States',
      website: 'https://www.virginvoyages.com'
    })

    cy.get('#create-cruise-line-form').submit()

    cy.wait('@createCruiseLine')
    cy.wait('@getCruiseLinesLive')

    cy.contains('#create-cruise-line-message', 'Created Virgin Voyages.').should('be.visible')
    cy.contains('#cruise-grid .data-card', 'Virgin Voyages').should('be.visible')
    cy.get('@createShip.all').should('have.length', 0)
  })

  it('creates a cruise line with multiple ships', () => {
    const cruiseLineList = [...initialCruiseLines]
    const createdShips = []

    cy.intercept('GET', '/cruise', req => {
      req.reply({ statusCode: 200, body: cruiseLineList })
    }).as('getCruiseLinesLive')

    cy.reload()
    cy.wait('@getCruiseLinesLive')

    cy.intercept('POST', '/cruise/cruise-line', req => {
      expect(req.body).to.deep.equal({
        name: 'Holland America Line',
        country: 'United States',
        website: 'https://www.hollandamerica.com'
      })

      cruiseLineList.push({
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Holland America Line',
        country: 'United States',
        website: 'https://www.hollandamerica.com'
      })

      req.reply({
        statusCode: 201,
        body: {
          message: 'Cruise line created successfully',
          id: '33333333-3333-3333-3333-333333333333'
        }
      })
    }).as('createCruiseLine')

    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body.cruiseLineId).to.equal('33333333-3333-3333-3333-333333333333')
      expect(['Rotterdam', 'Nieuw Amsterdam']).to.include(req.body.name)
      createdShips.push(req.body.name)

      req.reply({
        statusCode: 201,
        body: {
          message: 'Ship created successfully',
          id: `${createdShips.length}`
        }
      })
    }).as('createShip')

    fillCruiseLineForm({
      name: 'Holland America Line',
      country: 'United States',
      website: 'https://www.hollandamerica.com',
      ships: ['Rotterdam', 'Nieuw Amsterdam']
    })

    cy.get('#create-cruise-line-form').submit()

    cy.wait('@createCruiseLine')
    cy.wait('@createShip')
    cy.wait('@createShip')
    cy.wait('@getCruiseLinesLive')

    cy.wrap(createdShips).should('deep.equal', ['Rotterdam', 'Nieuw Amsterdam'])
    cy.contains('#create-cruise-line-message', 'Created Holland America Line with 2 ships.').should('be.visible')
    cy.contains('#cruise-grid .data-card', 'Holland America Line').should('be.visible')
  })

  it('trims whitespace before sending cruise line and ship data to the API', () => {
    cy.intercept('POST', '/cruise/cruise-line', req => {
      expect(req.body).to.deep.equal({
        name: 'Azamara',
        country: 'United States',
        website: 'https://www.azamara.com'
      })

      req.reply({
        statusCode: 201,
        body: {
          message: 'Cruise line created successfully',
          id: '44444444-4444-4444-4444-444444444444'
        }
      })
    }).as('createCruiseLine')

    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body).to.deep.equal({
        name: 'Azamara Quest',
        cruiseLineId: '44444444-4444-4444-4444-444444444444'
      })

      req.reply({ statusCode: 201, body: { message: 'Ship created successfully', id: 'ship-1' } })
    }).as('createShip')

    cy.get('#new-cruise-line-name').type('   Azamara   ')
    cy.get('#new-cruise-line-country').type('   United States   ')
    cy.get('#new-cruise-line-website').type('   https://www.azamara.com   ')
    cy.get('input[name="shipName"]').first().type('   Azamara Quest   ')

    cy.get('#create-cruise-line-form').submit()

    cy.wait('@createCruiseLine')
    cy.wait('@createShip')
  })

  it('omits optional country and website fields when they are left blank', () => {
    cy.intercept('POST', '/cruise/cruise-line', req => {
      expect(req.body).to.deep.equal({
        name: 'Small Ship Cruises'
      })

      req.reply({
        statusCode: 201,
        body: {
          message: 'Cruise line created successfully',
          id: '55555555-5555-5555-5555-555555555555'
        }
      })
    }).as('createCruiseLine')

    cy.get('#new-cruise-line-name').type('Small Ship Cruises')
    cy.get('#create-cruise-line-form').submit()

    cy.wait('@createCruiseLine')
  })

  it('ignores blank ship rows and creates only rows with ship names', () => {
    const createdShips = []

    cy.intercept('POST', '/cruise/cruise-line', req => {
      req.reply({
        statusCode: 201,
        body: {
          message: 'Cruise line created successfully',
          id: '66666666-6666-6666-6666-666666666666'
        }
      })
    }).as('createCruiseLine')

    cy.intercept('POST', '/cruise/ship', req => {
      createdShips.push(req.body.name)
      req.reply({ statusCode: 201, body: { message: 'Ship created successfully', id: `ship-${createdShips.length}` } })
    }).as('createShip')

    cy.get('#new-cruise-line-name').type('Test Cruise Line')
    cy.get('#add-ship-input-btn').click()
    cy.get('input[name="shipName"]').last().type('Only Real Ship')

    cy.get('#create-cruise-line-form').submit()

    cy.wait('@createCruiseLine')
    cy.wait('@createShip')

    cy.wrap(createdShips).should('deep.equal', ['Only Real Ship'])
    cy.get('@createShip.all').should('have.length', 1)
  })

  it('does not create duplicate ships when duplicate ship names are entered', () => {
    const createdShips = []

    cy.intercept('POST', '/cruise/cruise-line', req => {
      req.reply({
        statusCode: 201,
        body: {
          message: 'Cruise line created successfully',
          id: '77777777-7777-7777-7777-777777777777'
        }
      })
    }).as('createCruiseLine')

    cy.intercept('POST', '/cruise/ship', req => {
      createdShips.push(req.body.name)
      req.reply({ statusCode: 201, body: { message: 'Ship created successfully', id: `ship-${createdShips.length}` } })
    }).as('createShip')

    fillCruiseLineForm({
      name: 'Duplicate Ship Test Line',
      ships: ['Same Ship', 'Same Ship']
    })

    cy.get('#create-cruise-line-form').submit()

    cy.wait('@createCruiseLine')
    cy.wait('@createShip')

    cy.wrap(createdShips).should('deep.equal', ['Same Ship'])
    cy.get('@createShip.all').should('have.length', 1)
  })

  it('removes an added ship row before submitting', () => {
    const createdShips = []

    cy.intercept('POST', '/cruise/cruise-line', req => {
      req.reply({
        statusCode: 201,
        body: {
          message: 'Cruise line created successfully',
          id: '88888888-8888-8888-8888-888888888888'
        }
      })
    }).as('createCruiseLine')

    cy.intercept('POST', '/cruise/ship', req => {
      createdShips.push(req.body.name)
      req.reply({ statusCode: 201, body: { message: 'Ship created successfully', id: `ship-${createdShips.length}` } })
    }).as('createShip')

    cy.get('#new-cruise-line-name').type('Remove Ship Row Test Line')
    cy.get('input[name="shipName"]').first().type('Ship That Stays')
    cy.get('#add-ship-input-btn').click()
    cy.get('input[name="shipName"]').last().type('Ship That Gets Removed')
    cy.contains('.remove-ship-row-btn', 'Remove').click()

    cy.get('#create-cruise-line-form').submit()

    cy.wait('@createCruiseLine')
    cy.wait('@createShip')

    cy.wrap(createdShips).should('deep.equal', ['Ship That Stays'])
    cy.get('@createShip.all').should('have.length', 1)
  })

  it('resets the form fields, ship rows, and message area', () => {
    cy.get('#new-cruise-line-name').type('Reset Test Line')
    cy.get('#new-cruise-line-country').type('United States')
    cy.get('#new-cruise-line-website').type('https://example.com')
    cy.get('input[name="shipName"]').first().type('Reset Test Ship')
    cy.get('#add-ship-input-btn').click()
    cy.get('input[name="shipName"]').last().type('Second Reset Test Ship')

    cy.get('#reset-cruise-line-form-btn').click()

    cy.get('#new-cruise-line-name').should('have.value', '')
    cy.get('#new-cruise-line-country').should('have.value', '')
    cy.get('#new-cruise-line-website').should('have.value', '')
    cy.get('input[name="shipName"]').should('have.length', 1)
    cy.get('input[name="shipName"]').first().should('have.value', '')
    cy.get('#create-cruise-line-message').should('have.text', '')
  })

  it('shows a useful validation message when the cruise line name is missing', () => {
    cy.get('#new-cruise-line-name').invoke('removeAttr', 'required')
    cy.get('#new-cruise-line-country').type('United States')

    cy.get('#create-cruise-line-form').submit()

    cy.contains('#create-cruise-line-message', 'Cruise line name is required.').should('be.visible')
  })

  it('does not call the create API when the cruise line name is blank spaces', () => {
    cy.intercept('POST', '/cruise/cruise-line', req => {
      throw new Error(`Create API should not be called for a blank name. Received ${JSON.stringify(req.body)}`)
    }).as('createCruiseLine')

    cy.get('#new-cruise-line-name').invoke('removeAttr', 'required')
    cy.get('#new-cruise-line-name').type('    ')
    cy.get('#create-cruise-line-form').submit()

    cy.contains('#create-cruise-line-message', 'Cruise line name is required.').should('be.visible')
    cy.get('@createCruiseLine.all').should('have.length', 0)
  })

  it('shows the API error message when cruise line creation fails', () => {
    cy.intercept('POST', '/cruise/cruise-line', {
      statusCode: 400,
      body: {
        message: 'Cruise line name already exists.'
      }
    }).as('createCruiseLine')

    cy.get('#new-cruise-line-name').type('Royal Caribbean International')
    cy.get('#create-cruise-line-form').submit()

    cy.wait('@createCruiseLine')

    cy.contains('#create-cruise-line-message', 'Cruise line name already exists.').should('be.visible')
    cy.get('#create-cruise-line-message').should('have.class', 'error')
  })

  it('shows a fallback error when the create API returns an error without a message', () => {
    cy.intercept('POST', '/cruise/cruise-line', {
      statusCode: 500,
      body: {}
    }).as('createCruiseLine')

    cy.get('#new-cruise-line-name').type('Server Error Test Line')
    cy.get('#create-cruise-line-form').submit()

    cy.wait('@createCruiseLine')

    cy.contains('#create-cruise-line-message', 'Create failed with status 500').should('be.visible')
  })

  it('shows an error when the create API does not return a cruise line id', () => {
    cy.intercept('POST', '/cruise/cruise-line', {
      statusCode: 201,
      body: {
        message: 'Cruise line created successfully'
      }
    }).as('createCruiseLine')

    cy.get('#new-cruise-line-name').type('Missing ID Test Line')
    cy.get('#create-cruise-line-form').submit()

    cy.wait('@createCruiseLine')

    cy.contains('#create-cruise-line-message', 'Cruise line was created, but the API did not return a cruise line ID.').should('be.visible')
  })

  it('shows an error when cruise line creation succeeds but ship creation fails', () => {
    cy.intercept('POST', '/cruise/cruise-line', {
      statusCode: 201,
      body: {
        message: 'Cruise line created successfully',
        id: '99999999-9999-9999-9999-999999999999'
      }
    }).as('createCruiseLine')

    cy.intercept('POST', '/cruise/ship', {
      statusCode: 400,
      body: {
        message: 'Ship name is required.'
      }
    }).as('createShip')

    cy.get('#new-cruise-line-name').type('Partial Failure Test Line')
    cy.get('input[name="shipName"]').first().type('Bad Ship')
    cy.get('#create-cruise-line-form').submit()

    cy.wait('@createCruiseLine')
    cy.wait('@createShip')

    cy.contains('#create-cruise-line-message', 'Ship name is required.').should('be.visible')
    cy.get('#create-cruise-line-message').should('have.class', 'error')
  })

  it('disables the submit button and shows a loading label while the create request is in progress', () => {
    cy.intercept('POST', '/cruise/cruise-line', req => {
      req.reply({
        delay: 500,
        statusCode: 201,
        body: {
          message: 'Cruise line created successfully',
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
        }
      })
    }).as('createCruiseLine')

    cy.get('#new-cruise-line-name').type('Loading State Test Line')
    cy.get('#create-cruise-line-form').submit()

    cy.get('#create-cruise-line-btn')
      .should('be.disabled')
      .and('contain.text', 'Creating...')

    cy.contains('#create-cruise-line-message', 'Creating cruise line...').should('be.visible')

    cy.wait('@createCruiseLine')

    cy.get('#create-cruise-line-btn')
      .should('not.be.disabled')
      .and('contain.text', 'Create Cruise Line')
  })

  it('clears the form after a successful create', () => {
    cy.intercept('POST', '/cruise/cruise-line', {
      statusCode: 201,
      body: {
        message: 'Cruise line created successfully',
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
      }
    }).as('createCruiseLine')

    cy.intercept('POST', '/cruise/ship', {
      statusCode: 201,
      body: {
        message: 'Ship created successfully',
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc'
      }
    }).as('createShip')

    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: [
        ...initialCruiseLines,
        {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          name: 'Clear Form Test Line',
          country: 'United States',
          website: 'https://example.com'
        }
      ]
    }).as('getCruiseLinesAfterCreate')

    cy.get('#new-cruise-line-name').type('Clear Form Test Line')
    cy.get('#new-cruise-line-country').type('United States')
    cy.get('#new-cruise-line-website').type('https://example.com')
    cy.get('input[name="shipName"]').first().type('Clear Form Ship')

    cy.get('#create-cruise-line-form').submit()

    cy.wait('@createCruiseLine')
    cy.wait('@createShip')
    cy.wait('@getCruiseLinesAfterCreate')

    cy.get('#new-cruise-line-name').should('have.value', '')
    cy.get('#new-cruise-line-country').should('have.value', '')
    cy.get('#new-cruise-line-website').should('have.value', '')
    cy.get('input[name="shipName"]').should('have.length', 1)
    cy.get('input[name="shipName"]').first().should('have.value', '')
  })
})
