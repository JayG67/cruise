import { selectors } from '../support/selectors'

const royalCruiseLineId = '11111111-1111-1111-1111-111111111111'
const mscCruiseLineId = '22222222-2222-2222-2222-222222222222'
const iconShipId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const utopiaShipId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

const cruiseLines = [
  {
    id: royalCruiseLineId,
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  },
  {
    id: mscCruiseLineId,
    name: 'MSC Cruises',
    country: 'Switzerland',
    website: 'https://www.msccruises.com'
  }
]

const royalShips = [
  {
    id: iconShipId,
    name: 'Icon of the Seas',
    cruiseLineId: royalCruiseLineId
  },
  {
    id: utopiaShipId,
    name: 'Utopia of the Seas',
    cruiseLineId: royalCruiseLineId
  }
]

const mscShips = [
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'MSC Seaside',
    cruiseLineId: mscCruiseLineId
  }
]

function mockCruiseLines(body = cruiseLines) {
  cy.intercept('GET', '/cruise', {
    statusCode: 200,
    body
  }).as('getCruiseLines')
}

function visitHome(body = cruiseLines) {
  mockCruiseLines(body)
  cy.visit('/')
  cy.wait('@getCruiseLines')
}

function mockRoyalShips(body = royalShips) {
  cy.intercept('GET', `/cruise/ships/${royalCruiseLineId}`, {
    statusCode: 200,
    body
  }).as('getRoyalShips')
}

function mockMscShips(body = mscShips) {
  cy.intercept('GET', `/cruise/ships/${mscCruiseLineId}`, {
    statusCode: 200,
    body
  }).as('getMscShips')
}

function openRoyalUpdateForm() {
  cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
    .find(selectors.cruiseLines.updateButton)
    .click()

  cy.wait('@getRoyalShips')
  cy.get(selectors.updateCruiseLine.panel).should('be.visible')
}

function openMscUpdateForm() {
  cy.contains(selectors.cruiseLines.card, 'MSC Cruises')
    .find(selectors.cruiseLines.updateButton)
    .click()

  cy.wait('@getMscShips')
  cy.get(selectors.updateCruiseLine.panel).should('be.visible')
}

describe('Update Cruise Line UI', () => {
  beforeEach(() => {
    visitHome()
  })

  it('opens the update form with cruise line details and existing ships', () => {
    mockRoyalShips()

    openRoyalUpdateForm()

    cy.get(selectors.updateCruiseLine.idInput).should('have.value', royalCruiseLineId)
    cy.get(selectors.updateCruiseLine.nameInput).should('have.value', 'Royal Caribbean International')
    cy.get(selectors.updateCruiseLine.countryInput).should('have.value', 'United States')
    cy.get(selectors.updateCruiseLine.websiteInput).should('have.value', 'https://www.royalcaribbean.com')
    cy.get(selectors.updateCruiseLine.existingShipRow).should('have.length', 2)
    cy.get(selectors.updateCruiseLine.shipNameInput).eq(0).should('have.value', 'Icon of the Seas')
    cy.get(selectors.updateCruiseLine.shipNameInput).eq(1).should('have.value', 'Utopia of the Seas')
    cy.get(selectors.updateCruiseLine.newShipRow).should('have.length', 1)
    cy.get(selectors.updateCruiseLine.message).should('contain.text', 'Editing Royal Caribbean International.')
  })

  it('opens the update form for a cruise line with no existing ships', () => {
    cy.intercept('GET', `/cruise/ships/${mscCruiseLineId}`, {
      statusCode: 404,
      body: { message: 'No ships found' }
    }).as('getMscShips')

    openMscUpdateForm()

    cy.get(selectors.updateCruiseLine.nameInput).should('have.value', 'MSC Cruises')
    cy.get(selectors.updateCruiseLine.noShipsMessage)
      .should('be.visible')
      .and('contain.text', 'No ships exist for this cruise line yet')
    cy.get(selectors.updateCruiseLine.existingShipRow).should('not.exist')
    cy.get(selectors.updateCruiseLine.newShipRow).should('have.length', 1)
  })

  it('shows an error when existing ships cannot be loaded for update', () => {
    cy.intercept('GET', `/cruise/ships/${royalCruiseLineId}`, {
      statusCode: 500,
      body: { message: 'Ship service unavailable' }
    }).as('getRoyalShips')

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.updateButton)
      .click()

    cy.wait('@getRoyalShips')

    cy.get(selectors.updateCruiseLine.panel).should('be.visible')
    cy.get(selectors.updateCruiseLine.message)
      .should('contain.text', 'Ship request failed with status 500')
    cy.get(selectors.updateCruiseLine.existingShipRow).should('not.exist')
    cy.get(selectors.updateCruiseLine.newShipRow).should('not.exist')
  })

  it('updates cruise line details, renames existing ships, and creates a new ship', () => {
    mockRoyalShips()

    cy.intercept('PATCH', `/cruise/cruise-line/${royalCruiseLineId}`, (req) => {
      expect(req.body).to.deep.equal({
        name: 'Royal Caribbean Group',
        country: 'United States',
        website: 'https://www.royalcaribbean.com/updated'
      })

      req.reply({
        statusCode: 200,
        body: { message: 'Cruise line updated successfully' }
      })
    }).as('updateCruiseLine')

    cy.intercept('PATCH', `/cruise/ship/${iconShipId}`, (req) => {
      expect(req.body).to.deep.equal({
        name: 'Icon of the Seas Updated',
        cruiseLineId: royalCruiseLineId
      })

      req.reply({
        statusCode: 200,
        body: { message: 'Ship updated successfully' }
      })
    }).as('updateIconShip')

    cy.intercept('PATCH', `/cruise/ship/${utopiaShipId}`, (req) => {
      expect(req.body).to.deep.equal({
        name: 'Utopia of the Seas Updated',
        cruiseLineId: royalCruiseLineId
      })

      req.reply({
        statusCode: 200,
        body: { message: 'Ship updated successfully' }
      })
    }).as('updateUtopiaShip')

    cy.intercept('POST', '/cruise/ship', (req) => {
      expect(req.body).to.deep.equal({
        name: 'Star of the Seas',
        cruiseLineId: royalCruiseLineId
      })

      req.reply({
        statusCode: 201,
        body: { message: 'Ship created successfully', id: 'dddddddd-dddd-dddd-dddd-dddddddddddd' }
      })
    }).as('createNewShip')

    openRoyalUpdateForm()

    cy.get(selectors.updateCruiseLine.nameInput).clear().type('Royal Caribbean Group')
    cy.get(selectors.updateCruiseLine.websiteInput).clear().type('https://www.royalcaribbean.com/updated')
    cy.get(selectors.updateCruiseLine.shipNameInput).eq(0).clear().type('Icon of the Seas Updated')
    cy.get(selectors.updateCruiseLine.shipNameInput).eq(1).clear().type('Utopia of the Seas Updated')
    cy.get(selectors.updateCruiseLine.shipNameInput).last().type('Star of the Seas')
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@updateCruiseLine')
    cy.wait('@updateIconShip')
    cy.wait('@updateUtopiaShip')
    cy.wait('@createNewShip')

    cy.get(selectors.updateCruiseLine.panel).should('not.be.visible')
  })

  it('updates cruise line details without creating a ship when the new ship row is blank', () => {
    cy.intercept('GET', `/cruise/ships/${mscCruiseLineId}`, {
      statusCode: 404,
      body: { message: 'No ships found' }
    }).as('getMscShips')

    cy.intercept('PATCH', `/cruise/cruise-line/${mscCruiseLineId}`, (req) => {
      expect(req.body).to.deep.equal({
        name: 'MSC Cruises Updated',
        country: 'Switzerland',
        website: 'https://www.msccruises.com'
      })

      req.reply({ statusCode: 200, body: { message: 'Cruise line updated successfully' } })
    }).as('updateCruiseLine')

    cy.intercept('POST', '/cruise/ship', {
      statusCode: 201,
      body: { id: 'new-ship' }
    }).as('createShip')

    openMscUpdateForm()

    cy.get(selectors.updateCruiseLine.nameInput).clear().type('MSC Cruises Updated')
    cy.get(selectors.updateCruiseLine.shipNameInput).last().should('have.value', '')
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@updateCruiseLine')
    cy.get('@createShip.all').should('have.length', 0)
    cy.get(selectors.updateCruiseLine.panel).should('not.be.visible')
  })

  it('trims cruise line and ship values before submitting update requests', () => {
    mockRoyalShips([royalShips[0]])

    cy.intercept('PATCH', `/cruise/cruise-line/${royalCruiseLineId}`, (req) => {
      expect(req.body).to.deep.equal({
        name: 'Trimmed Cruise Line',
        country: 'Trimmed Country',
        website: 'https://trimmed.example.com'
      })

      req.reply({ statusCode: 200, body: { message: 'Cruise line updated successfully' } })
    }).as('updateCruiseLine')

    cy.intercept('PATCH', `/cruise/ship/${iconShipId}`, (req) => {
      expect(req.body).to.deep.equal({
        name: 'Trimmed Existing Ship',
        cruiseLineId: royalCruiseLineId
      })

      req.reply({ statusCode: 200, body: { message: 'Ship updated successfully' } })
    }).as('updateShip')

    cy.intercept('POST', '/cruise/ship', (req) => {
      expect(req.body).to.deep.equal({
        name: 'Trimmed New Ship',
        cruiseLineId: royalCruiseLineId
      })

      req.reply({ statusCode: 201, body: { message: 'Ship created successfully' } })
    }).as('createShip')

    openRoyalUpdateForm()

    cy.get(selectors.updateCruiseLine.nameInput).clear().type('   Trimmed Cruise Line   ')
    cy.get(selectors.updateCruiseLine.countryInput).clear().type('   Trimmed Country   ')
    cy.get(selectors.updateCruiseLine.websiteInput).clear().type('   https://trimmed.example.com   ')
    cy.get(selectors.updateCruiseLine.shipNameInput).eq(0).clear().type('   Trimmed Existing Ship   ')
    cy.get(selectors.updateCruiseLine.shipNameInput).last().type('   Trimmed New Ship   ')
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@updateCruiseLine')
    cy.wait('@updateShip')
    cy.wait('@createShip')
  })

  it('omits optional country and website fields when they are blank during update', () => {
    cy.intercept('GET', `/cruise/ships/${mscCruiseLineId}`, {
      statusCode: 404,
      body: { message: 'No ships found' }
    }).as('getMscShips')

    cy.intercept('PATCH', `/cruise/cruise-line/${mscCruiseLineId}`, (req) => {
      expect(req.body).to.deep.equal({
        name: 'MSC No Optional Fields'
      })

      req.reply({ statusCode: 200, body: { message: 'Cruise line updated successfully' } })
    }).as('updateCruiseLine')

    openMscUpdateForm()

    cy.get(selectors.updateCruiseLine.nameInput).clear().type('MSC No Optional Fields')
    cy.get(selectors.updateCruiseLine.countryInput).clear()
    cy.get(selectors.updateCruiseLine.websiteInput).clear()
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@updateCruiseLine')
  })

  it('does not create duplicate new ships when duplicate new ship names are entered', () => {
    cy.intercept('GET', `/cruise/ships/${mscCruiseLineId}`, {
      statusCode: 404,
      body: { message: 'No ships found' }
    }).as('getMscShips')

    cy.intercept('PATCH', `/cruise/cruise-line/${mscCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line updated successfully' }
    }).as('updateCruiseLine')

    cy.intercept('POST', '/cruise/ship', (req) => {
      expect(req.body).to.deep.equal({
        name: 'MSC World America',
        cruiseLineId: mscCruiseLineId
      })

      req.reply({ statusCode: 201, body: { id: 'new-ship' } })
    }).as('createShip')

    openMscUpdateForm()

    cy.get(selectors.updateCruiseLine.shipNameInput).last().type('MSC World America')
    cy.get(selectors.updateCruiseLine.addShipButton).click()
    cy.get(selectors.updateCruiseLine.shipNameInput).last().type('MSC World America')
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@updateCruiseLine')
    cy.wait('@createShip')
    cy.get('@createShip.all').should('have.length', 1)
    cy.get(selectors.updateCruiseLine.panel).should('not.be.visible')
  })

  it('removes a new ship row before submitting the update workflow', () => {
    cy.intercept('GET', `/cruise/ships/${mscCruiseLineId}`, {
      statusCode: 404,
      body: { message: 'No ships found' }
    }).as('getMscShips')

    cy.intercept('PATCH', `/cruise/cruise-line/${mscCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line updated successfully' }
    }).as('updateCruiseLine')

    cy.intercept('POST', '/cruise/ship', {
      statusCode: 201,
      body: { id: 'removed-ship' }
    }).as('createShip')

    openMscUpdateForm()

    cy.get(selectors.updateCruiseLine.addShipButton).click()
    cy.get(selectors.updateCruiseLine.shipNameInput).last().type('This Ship Should Not Be Created')
    cy.get(selectors.updateCruiseLine.removeShipButton).last().click()
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@updateCruiseLine')
    cy.get('@createShip.all').should('have.length', 0)
  })

  it('does not submit when the cruise line name is blank', () => {
    mockMscShips()

    cy.intercept('PATCH', `/cruise/cruise-line/${mscCruiseLineId}`, {
      statusCode: 200,
      body: {}
    }).as('updateCruiseLine')

    openMscUpdateForm()

    cy.get(selectors.updateCruiseLine.nameInput).clear()
    cy.get(selectors.updateCruiseLine.form).submit()

    cy.get(selectors.updateCruiseLine.message)
      .should('contain.text', 'Cruise line name is required.')

    cy.get('@updateCruiseLine.all').should('have.length', 0)
  })

  it('does not submit when an existing ship name is blank', () => {
    mockRoyalShips([royalShips[0]])

    cy.intercept('PATCH', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 200,
      body: {}
    }).as('updateCruiseLine')

    cy.intercept('PATCH', `/cruise/ship/${iconShipId}`, {
      statusCode: 200,
      body: {}
    }).as('updateShip')

    openRoyalUpdateForm()

    cy.get(selectors.updateCruiseLine.shipNameInput).eq(0).clear()
    cy.get(selectors.updateCruiseLine.form).submit()

    cy.get(selectors.updateCruiseLine.message)
      .should('contain.text', 'Existing ship names cannot be blank')

    cy.get('@updateCruiseLine.all').should('have.length', 0)
    cy.get('@updateShip.all').should('have.length', 0)
  })

  it('shows the API error message when cruise line update fails', () => {
    mockRoyalShips([royalShips[0]])

    cy.intercept('PATCH', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 409,
      body: { message: 'Cruise line already exists' }
    }).as('updateCruiseLine')

    cy.intercept('PATCH', `/cruise/ship/${iconShipId}`, {
      statusCode: 200,
      body: {}
    }).as('updateShip')

    openRoyalUpdateForm()

    cy.get(selectors.updateCruiseLine.nameInput).clear().type('Duplicate Cruise Line')
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@updateCruiseLine')
    cy.get('@updateShip.all').should('have.length', 0)
    cy.get(selectors.updateCruiseLine.message)
      .should('contain.text', 'Cruise line already exists')
  })

  it('shows a fallback error when cruise line update fails without a message', () => {
    cy.intercept('GET', `/cruise/ships/${mscCruiseLineId}`, {
      statusCode: 404,
      body: { message: 'No ships found' }
    }).as('getMscShips')

    cy.intercept('PATCH', `/cruise/cruise-line/${mscCruiseLineId}`, {
      statusCode: 500,
      body: {}
    }).as('updateCruiseLine')

    openMscUpdateForm()

    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@updateCruiseLine')
    cy.get(selectors.updateCruiseLine.message)
      .should('contain.text', 'Update failed with status 500')
  })

  it('shows an error when an existing ship update fails after cruise line update succeeds', () => {
    mockRoyalShips([royalShips[0]])

    cy.intercept('PATCH', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line updated successfully' }
    }).as('updateCruiseLine')

    cy.intercept('PATCH', `/cruise/ship/${iconShipId}`, {
      statusCode: 500,
      body: { message: 'Ship update failed' }
    }).as('updateShip')

    openRoyalUpdateForm()

    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@updateCruiseLine')
    cy.wait('@updateShip')
    cy.get(selectors.updateCruiseLine.message)
      .should('contain.text', 'Ship update failed')
  })

  it('shows a fallback error when a new ship cannot be created during update', () => {
    cy.intercept('GET', `/cruise/ships/${mscCruiseLineId}`, {
      statusCode: 404,
      body: { message: 'No ships found' }
    }).as('getMscShips')

    cy.intercept('PATCH', `/cruise/cruise-line/${mscCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line updated successfully' }
    }).as('updateCruiseLine')

    cy.intercept('POST', '/cruise/ship', {
      statusCode: 500,
      body: {}
    }).as('createShip')

    openMscUpdateForm()

    cy.get(selectors.updateCruiseLine.shipNameInput).last().type('Broken New Ship')
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@updateCruiseLine')
    cy.wait('@createShip')
    cy.get(selectors.updateCruiseLine.message)
      .should('contain.text', 'Cruise line was created, but ship "Broken New Ship" could not be created.')
  })

  it('disables the submit button and shows a loading label while saving updates', () => {
    mockRoyalShips([royalShips[0]])

    cy.intercept('PATCH', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 200,
      delay: 600,
      body: { message: 'Cruise line updated successfully' }
    }).as('updateCruiseLine')

    cy.intercept('PATCH', `/cruise/ship/${iconShipId}`, {
      statusCode: 200,
      body: { message: 'Ship updated successfully' }
    }).as('updateShip')

    openRoyalUpdateForm()

    cy.get(selectors.updateCruiseLine.submitButton).click()
    cy.get(selectors.updateCruiseLine.submitButton)
      .should('be.disabled')
      .and('contain.text', 'Saving...')
    cy.get(selectors.updateCruiseLine.message).should('contain.text', 'Saving updates...')

    cy.wait('@updateCruiseLine')
    cy.wait('@updateShip')
    cy.get(selectors.updateCruiseLine.panel).should('not.be.visible')
  })

  it('refreshes the visible ships panel after updating the selected cruise line', () => {
    cy.intercept(
      { method: 'GET', url: `/cruise/ships/${royalCruiseLineId}`, times: 1 },
      { statusCode: 200, body: [royalShips[0]] }
    ).as('getShipsForDisplay')

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.viewShipsButton)
      .click()

    cy.wait('@getShipsForDisplay')
    cy.get(selectors.ships.panel).should('be.visible')

    cy.intercept('GET', `/cruise/ships/${royalCruiseLineId}`, {
      statusCode: 200,
      body: [royalShips[0]]
    }).as('getRoyalShips')

    cy.intercept('PATCH', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line updated successfully' }
    }).as('updateCruiseLine')

    cy.intercept('PATCH', `/cruise/ship/${iconShipId}`, {
      statusCode: 200,
      body: { message: 'Ship updated successfully' }
    }).as('updateShip')

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.updateButton)
      .click()

    cy.wait('@getRoyalShips')
    cy.get(selectors.updateCruiseLine.nameInput).clear().type('Royal Caribbean Updated')
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@updateCruiseLine')
    cy.wait('@updateShip')
    cy.get(selectors.ships.title).should('contain.text', 'Royal Caribbean Updated Ships')
  })

  it('hides the update form when cancel is selected', () => {
    mockRoyalShips()

    openRoyalUpdateForm()

    cy.get(selectors.updateCruiseLine.cancelButton).click()
    cy.get(selectors.updateCruiseLine.panel).should('not.be.visible')
  })
})

describe('Update Cruise Line UI additional regression coverage', () => {
  const additionalCruiseLineId = 'eeeeeeee-0000-4000-8000-000000000001'
  const secondAdditionalCruiseLineId = 'eeeeeeee-0000-4000-8000-000000000002'
  const additionalShipId = 'eeeeeeee-0000-4000-8000-000000000101'
  const secondAdditionalShipId = 'eeeeeeee-0000-4000-8000-000000000102'

  const additionalLines = [
    {
      id: additionalCruiseLineId,
      name: 'Oceania Cruises',
      country: 'United States',
      website: 'https://www.oceaniacruises.com'
    },
    {
      id: secondAdditionalCruiseLineId,
      name: 'Regent Seven Seas',
      country: 'United States',
      website: 'https://www.rssc.com'
    }
  ]

  const additionalShips = [
    {
      id: additionalShipId,
      name: 'Oceania Vista',
      cruiseLineId: additionalCruiseLineId
    },
    {
      id: secondAdditionalShipId,
      name: 'Oceania Marina',
      cruiseLineId: additionalCruiseLineId
    }
  ]

  function visitAdditionalUpdatePage(lines = additionalLines) {
    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: lines
    }).as('additionalUpdateGetCruiseLines')

    cy.visit('/')
    cy.wait('@additionalUpdateGetCruiseLines')
  }

  function openAdditionalUpdateForm(ships = additionalShips) {
    cy.intercept('GET', `/cruise/ships/${additionalCruiseLineId}`, {
      statusCode: 200,
      body: ships
    }).as('additionalUpdateGetShips')

    cy.contains(selectors.cruiseLines.card, 'Oceania Cruises')
      .find(selectors.cruiseLines.updateButton)
      .click()

    cy.wait('@additionalUpdateGetShips')
    cy.get(selectors.updateCruiseLine.panel).should('be.visible')
  }

  beforeEach(() => {
    visitAdditionalUpdatePage()
  })

  it('omits optional country and website fields when they are cleared before update', () => {
    openAdditionalUpdateForm([])

    cy.intercept('PATCH', `/cruise/cruise-line/${additionalCruiseLineId}`, (req) => {
      expect(req.body).to.deep.equal({ name: 'Oceania Cruises Updated' })
      req.reply({ statusCode: 200, body: { message: 'Cruise line updated successfully' } })
    }).as('additionalUpdateCruiseLine')

    cy.get(selectors.updateCruiseLine.nameInput).clear().type('Oceania Cruises Updated')
    cy.get(selectors.updateCruiseLine.countryInput).clear()
    cy.get(selectors.updateCruiseLine.websiteInput).clear()
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@additionalUpdateCruiseLine')
  })

  it('deduplicates new ship names during update', () => {
    openAdditionalUpdateForm([])

    cy.intercept('PATCH', `/cruise/cruise-line/${additionalCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line updated successfully' }
    }).as('additionalUpdateCruiseLine')

    cy.intercept('POST', '/cruise/ship', {
      statusCode: 201,
      body: { id: 'new-oceania-ship' }
    }).as('additionalCreateShip')

    cy.get(selectors.updateCruiseLine.shipNameInput).last().type('Oceania Allura')
    cy.get(selectors.updateCruiseLine.addShipButton).click()
    cy.get(selectors.updateCruiseLine.shipNameInput).last().type('   Oceania Allura   ')
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@additionalUpdateCruiseLine')
    cy.wait('@additionalCreateShip')
    cy.get('@additionalCreateShip.all').should('have.length', 1)
  })

  it('blocks the update when an existing ship name is blank', () => {
    openAdditionalUpdateForm([additionalShips[0]])

    cy.intercept('PATCH', `/cruise/cruise-line/${additionalCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Should not update' }
    }).as('additionalBlockedUpdate')

    cy.get(selectors.updateCruiseLine.shipNameInput).first().clear()
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.get(selectors.updateCruiseLine.message)
      .should('contain.text', 'Existing ship names cannot be blank')
    cy.get('@additionalBlockedUpdate.all').should('have.length', 0)
  })

  it('keeps the update panel open and filled when the cruise line PATCH fails', () => {
    openAdditionalUpdateForm([])

    cy.intercept('PATCH', `/cruise/cruise-line/${additionalCruiseLineId}`, {
      statusCode: 500,
      body: { message: 'Update service unavailable' }
    }).as('additionalPatchFailure')

    cy.get(selectors.updateCruiseLine.nameInput).clear().type('Oceania Failure Test')
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@additionalPatchFailure')
    cy.get(selectors.updateCruiseLine.panel).should('be.visible')
    cy.get(selectors.updateCruiseLine.nameInput).should('have.value', 'Oceania Failure Test')
    cy.get(selectors.updateCruiseLine.message).should('contain.text', 'Update service unavailable')
  })

  it('reports a fallback message when the cruise line PATCH fails without a response message', () => {
    openAdditionalUpdateForm([])

    cy.intercept('PATCH', `/cruise/cruise-line/${additionalCruiseLineId}`, {
      statusCode: 500,
      body: {}
    }).as('additionalPatchFallbackFailure')

    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@additionalPatchFallbackFailure')
    cy.get(selectors.updateCruiseLine.message).should('contain.text', 'Update failed with status 500')
  })

  it('reports when an existing ship PATCH fails after the cruise line update succeeds', () => {
    openAdditionalUpdateForm([additionalShips[0]])

    cy.intercept('PATCH', `/cruise/cruise-line/${additionalCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line updated successfully' }
    }).as('additionalUpdateCruiseLine')

    cy.intercept('PATCH', `/cruise/ship/${additionalShipId}`, {
      statusCode: 500,
      body: { message: 'Ship update failed' }
    }).as('additionalShipPatchFailure')

    cy.get(selectors.updateCruiseLine.shipNameInput).first().clear().type('Oceania Vista Updated')
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@additionalUpdateCruiseLine')
    cy.wait('@additionalShipPatchFailure')
    cy.get(selectors.updateCruiseLine.message).should('contain.text', 'Ship update failed')
  })

  it('reports when creating a new ship fails after the cruise line update succeeds', () => {
    openAdditionalUpdateForm([])

    cy.intercept('PATCH', `/cruise/cruise-line/${additionalCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line updated successfully' }
    }).as('additionalUpdateCruiseLine')

    cy.intercept('POST', '/cruise/ship', {
      statusCode: 500,
      body: { message: 'New ship create failed' }
    }).as('additionalCreateShipFailure')

    cy.get(selectors.updateCruiseLine.shipNameInput).last().type('Oceania New Ship')
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@additionalUpdateCruiseLine')
    cy.wait('@additionalCreateShipFailure')
    cy.get(selectors.updateCruiseLine.message).should('contain.text', 'New ship create failed')
  })

  it('disables the save button and shows a saving label while the update is in progress', () => {
    openAdditionalUpdateForm([])

    cy.intercept('PATCH', `/cruise/cruise-line/${additionalCruiseLineId}`, (req) => {
      req.reply({ delay: 500, statusCode: 200, body: { message: 'Cruise line updated successfully' } })
    }).as('additionalSlowUpdate')

    cy.get(selectors.updateCruiseLine.submitButton).click()
    cy.get(selectors.updateCruiseLine.submitButton)
      .should('be.disabled')
      .and('contain.text', 'Saving...')

    cy.wait('@additionalSlowUpdate')
    cy.get(selectors.updateCruiseLine.panel).should('not.be.visible')
  })

  it('clears stale ship rows when switching from one cruise line update form to another', () => {
    openAdditionalUpdateForm(additionalShips)
    cy.get(selectors.updateCruiseLine.existingShipRow).should('have.length', 2)

    cy.intercept('GET', `/cruise/ships/${secondAdditionalCruiseLineId}`, {
      statusCode: 404,
      body: { message: 'No ships found' }
    }).as('additionalSecondLineShips')

    cy.contains(selectors.cruiseLines.card, 'Regent Seven Seas')
      .find(selectors.cruiseLines.updateButton)
      .click()

    cy.wait('@additionalSecondLineShips')
    cy.get(selectors.updateCruiseLine.nameInput).should('have.value', 'Regent Seven Seas')
    cy.get(selectors.updateCruiseLine.existingShipRow).should('not.exist')
    cy.get(selectors.updateCruiseLine.noShipsMessage).should('be.visible')
  })

  it('does not send requests when cancel is clicked after editing fields', () => {
    openAdditionalUpdateForm([additionalShips[0]])

    cy.intercept('PATCH', `/cruise/cruise-line/${additionalCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Should not update' }
    }).as('additionalCanceledUpdate')

    cy.get(selectors.updateCruiseLine.nameInput).clear().type('Canceled Update')
    cy.get(selectors.updateCruiseLine.shipNameInput).first().clear().type('Canceled Ship Update')
    cy.get(selectors.updateCruiseLine.cancelButton).click()

    cy.get(selectors.updateCruiseLine.panel).should('not.be.visible')
    cy.get('@additionalCanceledUpdate.all').should('have.length', 0)
  })

  it('creates multiple new ships when multiple unique new ship rows are provided', () => {
    openAdditionalUpdateForm([])
    const createdShipNames = []

    cy.intercept('PATCH', `/cruise/cruise-line/${additionalCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line updated successfully' }
    }).as('additionalUpdateCruiseLine')

    cy.intercept('POST', '/cruise/ship', (req) => {
      createdShipNames.push(req.body.name)
      req.reply({ statusCode: 201, body: { id: `created-${createdShipNames.length}` } })
    }).as('additionalCreateShip')

    cy.get(selectors.updateCruiseLine.shipNameInput).last().type('Oceania Ship One')
    cy.get(selectors.updateCruiseLine.addShipButton).click()
    cy.get(selectors.updateCruiseLine.shipNameInput).last().type('Oceania Ship Two')
    cy.get(selectors.updateCruiseLine.submitButton).click()

    cy.wait('@additionalUpdateCruiseLine')
    cy.wait('@additionalCreateShip')
    cy.wait('@additionalCreateShip')
    cy.wrap(createdShipNames).should('deep.equal', ['Oceania Ship One', 'Oceania Ship Two'])
  })
})

describe('Update Cruise Line UI ship delete coverage', () => {
  beforeEach(() => {
    visitHome()
  })

  it('renders delete ship buttons only for existing ships in the update form', () => {
    mockRoyalShips()

    openRoyalUpdateForm()

    cy.get(selectors.updateCruiseLine.existingShipRow).should('have.length', 2)
    cy.get(selectors.updateCruiseLine.deleteShipButton).should('have.length', 2)
    cy.get(selectors.updateCruiseLine.newShipRow)
      .find(selectors.updateCruiseLine.deleteShipButton)
      .should('not.exist')
    cy.get(selectors.updateCruiseLine.newShipRow)
      .find(selectors.updateCruiseLine.removeShipButton)
      .should('exist')
  })

  it('does not delete a ship when the user cancels confirmation', () => {
    mockRoyalShips()

    cy.intercept('DELETE', `/cruise/ship/${iconShipId}`, {
      statusCode: 200,
      body: { message: 'Should not delete' }
    }).as('deleteShip')

    cy.on('window:confirm', () => false)

    openRoyalUpdateForm()
    cy.get(selectors.updateCruiseLine.deleteShipButton).first().click()

    cy.get('@deleteShip.all').should('have.length', 0)
    cy.get(selectors.updateCruiseLine.existingShipRow).should('have.length', 2)
    cy.get(selectors.updateCruiseLine.message).should('contain.text', 'Editing Royal Caribbean International.')
  })

  it('deletes an existing ship from the update form after confirmation', () => {
    mockRoyalShips()

    cy.intercept('DELETE', `/cruise/ship/${iconShipId}`, {
      statusCode: 200,
      body: { message: 'Ship deleted successfully' }
    }).as('deleteShip')

    cy.on('window:confirm', (message) => {
      expect(message).to.equal('Delete Icon of the Seas?')
      return true
    })

    openRoyalUpdateForm()
    cy.get(selectors.updateCruiseLine.deleteShipButton).first().click()

    cy.wait('@deleteShip')
    cy.get(selectors.updateCruiseLine.existingShipRow).should('have.length', 1)
    cy.get(selectors.updateCruiseLine.shipNameInput).first().should('have.value', 'Utopia of the Seas')
    cy.get(selectors.updateCruiseLine.message).should('contain.text', 'Icon of the Seas was deleted successfully.')
  })

  it('shows the API error message when deleting a ship fails', () => {
    mockRoyalShips()

    cy.intercept('DELETE', `/cruise/ship/${iconShipId}`, {
      statusCode: 500,
      body: { message: 'Ship delete failed' }
    }).as('deleteShipFailure')

    cy.on('window:confirm', () => true)

    openRoyalUpdateForm()
    cy.get(selectors.updateCruiseLine.deleteShipButton).first().click()

    cy.wait('@deleteShipFailure')
    cy.get(selectors.updateCruiseLine.existingShipRow).should('have.length', 2)
    cy.get(selectors.updateCruiseLine.message).should('contain.text', 'Ship delete failed')
  })

  it('shows a fallback error when deleting a ship fails without a response message', () => {
    mockRoyalShips()

    cy.intercept('DELETE', `/cruise/ship/${iconShipId}`, {
      statusCode: 500,
      body: {}
    }).as('deleteShipFailure')

    cy.on('window:confirm', () => true)

    openRoyalUpdateForm()
    cy.get(selectors.updateCruiseLine.deleteShipButton).first().click()

    cy.wait('@deleteShipFailure')
    cy.get(selectors.updateCruiseLine.existingShipRow).should('have.length', 2)
    cy.get(selectors.updateCruiseLine.message).should('contain.text', 'Delete ship failed with status 500')
  })

  it('refreshes the selected ships panel when a visible ship is deleted from the update form', () => {
    let shipLoadCount = 0

    cy.intercept('GET', `/cruise/ships/${royalCruiseLineId}`, (req) => {
      shipLoadCount += 1

      req.reply({
        statusCode: 200,
        body: shipLoadCount < 3 ? royalShips : [royalShips[1]]
      })
    }).as('getRoyalShips')

    cy.intercept('DELETE', `/cruise/ship/${iconShipId}`, {
      statusCode: 200,
      body: { message: 'Ship deleted successfully' }
    }).as('deleteShip')

    cy.on('window:confirm', () => true)

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.viewShipsButton)
      .click()
    cy.wait('@getRoyalShips')
    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.ships.card).should('contain.text', 'Icon of the Seas')

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.updateButton)
      .click()
    cy.wait('@getRoyalShips')

    cy.get(selectors.updateCruiseLine.deleteShipButton).first().click()
    cy.wait('@deleteShip')
    cy.wait('@getRoyalShips')

    cy.get(selectors.ships.card).should('not.contain.text', 'Icon of the Seas')
    cy.get(selectors.ships.card).should('contain.text', 'Utopia of the Seas')
  })

  it('shows the no-ships message when the final existing ship is deleted', () => {
    mockRoyalShips([royalShips[0]])

    cy.intercept('DELETE', `/cruise/ship/${iconShipId}`, {
      statusCode: 200,
      body: { message: 'Ship deleted successfully' }
    }).as('deleteShip')

    cy.on('window:confirm', () => true)

    openRoyalUpdateForm()
    cy.get(selectors.updateCruiseLine.existingShipRow).should('have.length', 1)
    cy.get(selectors.updateCruiseLine.deleteShipButton).click()

    cy.wait('@deleteShip')
    cy.get(selectors.updateCruiseLine.existingShipRow).should('not.exist')
    cy.get(selectors.updateCruiseLine.noShipsMessage)
      .should('be.visible')
      .and('contain.text', 'No ships exist for this cruise line yet')
    cy.get(selectors.updateCruiseLine.newShipRow).should('have.length', 1)
  })
})
