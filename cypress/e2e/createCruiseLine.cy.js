import { selectors } from '../support/selectors'

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
  if (name !== undefined) cy.get(selectors.createCruiseLine.nameInput).clear().type(name)
  if (country !== undefined) cy.get(selectors.createCruiseLine.countryInput).clear().type(country)
  if (website !== undefined) cy.get(selectors.createCruiseLine.websiteInput).clear().type(website)

  ships.forEach((shipName, index) => {
    if (index > 0) cy.get(selectors.createCruiseLine.addShipButton).click()
    cy.get(selectors.createCruiseLine.shipNameInput).eq(index).clear().type(shipName)
  })
}

describe('Create Cruise Line UI', () => {
  beforeEach(() => {
    visitWithMockedCruiseLines()
  })

  it('renders the create cruise line form with the expected fields and controls', () => {
    cy.contains('Add a Cruise Line').should('be.visible')
    cy.contains('CREATE WORKFLOW').should('be.visible')
    cy.get(selectors.createCruiseLine.nameInput).should('be.visible')
    cy.get(selectors.createCruiseLine.countryInput).should('be.visible')
    cy.get(selectors.createCruiseLine.websiteInput).should('be.visible')
    cy.get(selectors.createCruiseLine.shipNameInput).should('have.length', 1)
    cy.get(selectors.createCruiseLine.addShipButton).should('be.visible')
    cy.get(selectors.createCruiseLine.submitButton).should('be.visible')
    cy.get(selectors.createCruiseLine.resetButton).should('be.visible')
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

    cy.get(selectors.createCruiseLine.form).submit()

    cy.wait('@createCruiseLine')
    cy.wait('@getCruiseLinesLive')

    cy.contains(selectors.createCruiseLine.message, 'Created Virgin Voyages.').should('be.visible')
    cy.contains(selectors.cruiseLines.card, 'Virgin Voyages').should('be.visible')
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

    cy.get(selectors.createCruiseLine.form).submit()

    cy.wait('@createCruiseLine')
    cy.wait('@createShip')
    cy.wait('@createShip')
    cy.wait('@getCruiseLinesLive')

    cy.wrap(createdShips).should('deep.equal', ['Rotterdam', 'Nieuw Amsterdam'])
    cy.contains(selectors.createCruiseLine.message, 'Created Holland America Line with 2 ships.').should('be.visible')
    cy.contains(selectors.cruiseLines.card, 'Holland America Line').should('be.visible')
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

    cy.get(selectors.createCruiseLine.nameInput).type('   Azamara   ')
    cy.get(selectors.createCruiseLine.countryInput).type('   United States   ')
    cy.get(selectors.createCruiseLine.websiteInput).type('   https://www.azamara.com   ')
    cy.get(selectors.createCruiseLine.shipNameInput).first().type('   Azamara Quest   ')

    cy.get(selectors.createCruiseLine.form).submit()

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

    cy.get(selectors.createCruiseLine.nameInput).type('Small Ship Cruises')
    cy.get(selectors.createCruiseLine.form).submit()

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

    cy.get(selectors.createCruiseLine.nameInput).type('Test Cruise Line')
    cy.get(selectors.createCruiseLine.addShipButton).click()
    cy.get(selectors.createCruiseLine.shipNameInput).last().type('Only Real Ship')

    cy.get(selectors.createCruiseLine.form).submit()

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

    cy.get(selectors.createCruiseLine.form).submit()

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

    cy.get(selectors.createCruiseLine.nameInput).type('Remove Ship Row Test Line')
    cy.get(selectors.createCruiseLine.shipNameInput).first().type('Ship That Stays')
    cy.get(selectors.createCruiseLine.addShipButton).click()
    cy.get(selectors.createCruiseLine.shipNameInput).last().type('Ship That Gets Removed')
    cy.contains(selectors.createCruiseLine.removeShipButton, 'Remove').click()

    cy.get(selectors.createCruiseLine.form).submit()

    cy.wait('@createCruiseLine')
    cy.wait('@createShip')

    cy.wrap(createdShips).should('deep.equal', ['Ship That Stays'])
    cy.get('@createShip.all').should('have.length', 1)
  })

  it('resets the form fields, ship rows, and message area', () => {
    cy.get(selectors.createCruiseLine.nameInput).type('Reset Test Line')
    cy.get(selectors.createCruiseLine.countryInput).type('United States')
    cy.get(selectors.createCruiseLine.websiteInput).type('https://example.com')
    cy.get(selectors.createCruiseLine.shipNameInput).first().type('Reset Test Ship')
    cy.get(selectors.createCruiseLine.addShipButton).click()
    cy.get(selectors.createCruiseLine.shipNameInput).last().type('Second Reset Test Ship')

    cy.get(selectors.createCruiseLine.resetButton).click()

    cy.get(selectors.createCruiseLine.nameInput).should('have.value', '')
    cy.get(selectors.createCruiseLine.countryInput).should('have.value', '')
    cy.get(selectors.createCruiseLine.websiteInput).should('have.value', '')
    cy.get(selectors.createCruiseLine.shipNameInput).should('have.length', 1)
    cy.get(selectors.createCruiseLine.shipNameInput).first().should('have.value', '')
    cy.get(selectors.createCruiseLine.message).should('have.text', '')
  })

  it('shows a useful validation message when the cruise line name is missing', () => {
    cy.get(selectors.createCruiseLine.nameInput).invoke('removeAttr', 'required')
    cy.get(selectors.createCruiseLine.countryInput).type('United States')

    cy.get(selectors.createCruiseLine.form).submit()

    cy.contains(selectors.createCruiseLine.message, 'Cruise line name is required.').should('be.visible')
  })

  it('does not call the create API when the cruise line name is blank spaces', () => {
    cy.intercept('POST', '/cruise/cruise-line', req => {
      throw new Error(`Create API should not be called for a blank name. Received ${JSON.stringify(req.body)}`)
    }).as('createCruiseLine')

    cy.get(selectors.createCruiseLine.nameInput).invoke('removeAttr', 'required')
    cy.get(selectors.createCruiseLine.nameInput).type('    ')
    cy.get(selectors.createCruiseLine.form).submit()

    cy.contains(selectors.createCruiseLine.message, 'Cruise line name is required.').should('be.visible')
    cy.get('@createCruiseLine.all').should('have.length', 0)
  })

  it('shows the API error message when cruise line creation fails', () => {
    cy.intercept('POST', '/cruise/cruise-line', {
      statusCode: 400,
      body: {
        message: 'Cruise line name already exists.'
      }
    }).as('createCruiseLine')

    cy.get(selectors.createCruiseLine.nameInput).type('Royal Caribbean International')
    cy.get(selectors.createCruiseLine.form).submit()

    cy.wait('@createCruiseLine')

    cy.contains(selectors.createCruiseLine.message, 'Cruise line name already exists.').should('be.visible')
    cy.get(selectors.createCruiseLine.message).should('have.class', 'error')
  })

  it('shows a fallback error when the create API returns an error without a message', () => {
    cy.intercept('POST', '/cruise/cruise-line', {
      statusCode: 500,
      body: {}
    }).as('createCruiseLine')

    cy.get(selectors.createCruiseLine.nameInput).type('Server Error Test Line')
    cy.get(selectors.createCruiseLine.form).submit()

    cy.wait('@createCruiseLine')

    cy.contains(selectors.createCruiseLine.message, 'Create failed with status 500').should('be.visible')
  })

  it('shows an error when the create API does not return a cruise line id', () => {
    cy.intercept('POST', '/cruise/cruise-line', {
      statusCode: 201,
      body: {
        message: 'Cruise line created successfully'
      }
    }).as('createCruiseLine')

    cy.get(selectors.createCruiseLine.nameInput).type('Missing ID Test Line')
    cy.get(selectors.createCruiseLine.form).submit()

    cy.wait('@createCruiseLine')

    cy.contains(selectors.createCruiseLine.message, 'Cruise line was created, but the API did not return a cruise line ID.').should('be.visible')
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

    cy.get(selectors.createCruiseLine.nameInput).type('Partial Failure Test Line')
    cy.get(selectors.createCruiseLine.shipNameInput).first().type('Bad Ship')
    cy.get(selectors.createCruiseLine.form).submit()

    cy.wait('@createCruiseLine')
    cy.wait('@createShip')

    cy.contains(selectors.createCruiseLine.message, 'Ship name is required.').should('be.visible')
    cy.get(selectors.createCruiseLine.message).should('have.class', 'error')
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

    cy.get(selectors.createCruiseLine.nameInput).type('Loading State Test Line')
    cy.get(selectors.createCruiseLine.form).submit()

    cy.get(selectors.createCruiseLine.submitButton)
      .should('be.disabled')
      .and('contain.text', 'Creating...')

    cy.contains(selectors.createCruiseLine.message, 'Creating cruise line...').should('be.visible')

    cy.wait('@createCruiseLine')

    cy.get(selectors.createCruiseLine.submitButton)
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

    cy.get(selectors.createCruiseLine.nameInput).type('Clear Form Test Line')
    cy.get(selectors.createCruiseLine.countryInput).type('United States')
    cy.get(selectors.createCruiseLine.websiteInput).type('https://example.com')
    cy.get(selectors.createCruiseLine.shipNameInput).first().type('Clear Form Ship')

    cy.get(selectors.createCruiseLine.form).submit()

    cy.wait('@createCruiseLine')
    cy.wait('@createShip')
    cy.wait('@getCruiseLinesAfterCreate')

    cy.get(selectors.createCruiseLine.nameInput).should('have.value', '')
    cy.get(selectors.createCruiseLine.countryInput).should('have.value', '')
    cy.get(selectors.createCruiseLine.websiteInput).should('have.value', '')
    cy.get(selectors.createCruiseLine.shipNameInput).should('have.length', 1)
    cy.get(selectors.createCruiseLine.shipNameInput).first().should('have.value', '')
  })
})

describe('Create Cruise Line UI additional regression coverage', () => {
  const additionalInitialLines = [
    {
      id: 'dddddddd-0000-4000-8000-000000000001',
      name: 'Existing Cruise Line',
      country: 'United States',
      website: 'https://example.com'
    }
  ]

  function visitAdditionalCreatePage(lines = additionalInitialLines) {
    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: lines
    }).as('additionalCreateGetCruiseLines')

    cy.visit('/')
    cy.wait('@additionalCreateGetCruiseLines')
  }

  beforeEach(() => {
    visitAdditionalCreatePage()
  })

  it('creates a single ship and uses singular success wording', () => {
    cy.intercept('POST', '/cruise/cruise-line', {
      statusCode: 201,
      body: { id: 'dddddddd-0000-4000-8000-000000000002' }
    }).as('additionalCreateCruiseLine')

    cy.intercept('POST', '/cruise/ship', (req) => {
      expect(req.body).to.deep.equal({
        name: 'Single Test Ship',
        cruiseLineId: 'dddddddd-0000-4000-8000-000000000002'
      })
      req.reply({ statusCode: 201, body: { id: 'ship-single' } })
    }).as('additionalCreateShip')

    cy.get(selectors.createCruiseLine.nameInput).type('Single Ship Line')
    cy.get(selectors.createCruiseLine.shipNameInput).first().type('Single Test Ship')
    cy.get(selectors.createCruiseLine.form).submit()

    cy.wait('@additionalCreateCruiseLine')
    cy.wait('@additionalCreateShip')
    cy.get(selectors.createCruiseLine.message).should('contain.text', 'Created Single Ship Line with 1 ship.')
  })

  it('omits blank optional fields even when they contain spaces', () => {
    cy.intercept('POST', '/cruise/cruise-line', (req) => {
      expect(req.body).to.deep.equal({ name: 'Whitespace Optional Fields Line' })
      req.reply({ statusCode: 201, body: { id: 'dddddddd-0000-4000-8000-000000000003' } })
    }).as('additionalCreateCruiseLine')

    cy.get(selectors.createCruiseLine.nameInput).type('Whitespace Optional Fields Line')
    cy.get(selectors.createCruiseLine.countryInput).type('   ')
    cy.get(selectors.createCruiseLine.websiteInput).type('   ')
    cy.get(selectors.createCruiseLine.form).submit()

    cy.wait('@additionalCreateCruiseLine')
  })

  it('deduplicates ship names after trimming whitespace', () => {
    cy.intercept('POST', '/cruise/cruise-line', {
      statusCode: 201,
      body: { id: 'dddddddd-0000-4000-8000-000000000004' }
    }).as('additionalCreateCruiseLine')

    cy.intercept('POST', '/cruise/ship', {
      statusCode: 201,
      body: { id: 'ship-dedupe' }
    }).as('additionalCreateShip')

    cy.get(selectors.createCruiseLine.nameInput).type('Dedupe Ship Line')
    cy.get(selectors.createCruiseLine.shipNameInput).first().type('Duplicate Ship')
    cy.get(selectors.createCruiseLine.addShipButton).click()
    cy.get(selectors.createCruiseLine.shipNameInput).last().type('   Duplicate Ship   ')
    cy.get(selectors.createCruiseLine.form).submit()

    cy.wait('@additionalCreateCruiseLine')
    cy.wait('@additionalCreateShip')
    cy.get('@additionalCreateShip.all').should('have.length', 1)
  })

  it('clears a previous validation message when the form is reset', () => {
    cy.get(selectors.createCruiseLine.nameInput).then(($input) => {
      $input.val('')
    })
    cy.get(selectors.createCruiseLine.form).then(($form) => {
      $form[0].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    cy.get(selectors.createCruiseLine.message).should('contain.text', 'Cruise line name is required.')
    cy.get(selectors.createCruiseLine.resetButton).click()
    cy.get(selectors.createCruiseLine.message).should('have.text', '')
  })

  it('keeps the form filled when cruise line creation fails', () => {
    cy.intercept('POST', '/cruise/cruise-line', {
      statusCode: 409,
      body: { message: 'Cruise line already exists' }
    }).as('additionalCreateConflict')

    cy.get(selectors.createCruiseLine.nameInput).type('Duplicate Cruise Line')
    cy.get(selectors.createCruiseLine.countryInput).type('United States')
    cy.get(selectors.createCruiseLine.form).submit()

    cy.wait('@additionalCreateConflict')
    cy.get(selectors.createCruiseLine.message).should('contain.text', 'Cruise line already exists')
    cy.get(selectors.createCruiseLine.nameInput).should('have.value', 'Duplicate Cruise Line')
    cy.get(selectors.createCruiseLine.countryInput).should('have.value', 'United States')
  })

  it('removes only the selected dynamic ship row', () => {
    cy.get(selectors.createCruiseLine.shipNameInput).first().type('Ship A')
    cy.get(selectors.createCruiseLine.addShipButton).click()
    cy.get(selectors.createCruiseLine.shipNameInput).last().type('Ship B')
    cy.get(selectors.createCruiseLine.addShipButton).click()
    cy.get(selectors.createCruiseLine.shipNameInput).last().type('Ship C')

    cy.get(selectors.createCruiseLine.removeShipButton).first().click()

    cy.get(selectors.createCruiseLine.shipNameInput).should('have.length', 2)
    cy.get(selectors.createCruiseLine.shipNameInput).eq(0).should('have.value', 'Ship A')
    cy.get(selectors.createCruiseLine.shipNameInput).eq(1).should('have.value', 'Ship C')
  })
})
