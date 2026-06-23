const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { reactCruiseLines, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

function fillCompleteCruiseLineDetails(name = 'React Test Line') {
  cy.getByTestId(rs.createCruiseLineName).clear().type(name)
  cy.getByTestId(rs.createCruiseLineCountry).clear().type('United States')
  cy.getByTestId(rs.createCruiseLineWebsite).clear().type('https://react.example.com')
  cy.getByTestId(rs.createCruiseLineBrandFamily).clear().type('React Holdings')
  cy.getByTestId(rs.createCruiseLineBrandTheme).clear().type('Innovation')
  cy.getByTestId(rs.createCruiseLineMarketPositioning).clear().type('Modern test cruising')
}

describe('React create cruise line coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('renders the create cruise line workflow with locked starter ship fields until cruise line details are complete', () => {
    cy.getByTestId(rs.createCruiseLineWorkflow).should('be.visible').and('contain.text', 'Add New Cruise Data')
    cy.getByTestId(rs.createCruiseLineName).should('have.attr', 'required')
    cy.getByTestId(rs.createCruiseLineCountry).should('be.visible')
    cy.getByTestId(rs.createCruiseLineWebsite).should('be.visible')
    cy.getByTestId(rs.createCruiseLineBrandFamily).should('be.visible')
    cy.getByTestId(rs.createCruiseLineBrandTheme).should('be.visible')
    cy.getByTestId(rs.createCruiseLineMarketPositioning).should('be.visible')
    cy.getByTestId(rs.createShipName).should('have.length', 1).and('be.disabled')
    cy.getByTestId(rs.createShipPort).should('have.length', 1).and('be.disabled')
    cy.getByTestId(rs.addShipRow).should('be.disabled')
    cy.getByTestId(rs.removeShipRow).should('be.disabled')
    cy.getByTestId(rs.createCruiseLineMessage).should('contain.text', 'Ready to create')
  })

  it('does not allow starter ship rows to be added before all cruise line data is entered', () => {
    cy.getByTestId(rs.createCruiseLineName).type('React Partial Line')
    cy.getByTestId(rs.createCruiseLineCountry).type('United States')
    cy.getByTestId(rs.addShipRow).should('be.disabled')
    cy.getByTestId(rs.addShipRow).click({ force: true })
    cy.getByTestId(rs.createShipName).should('have.length', 1).and('be.disabled')
    cy.getByTestId(rs.createShipPort).should('have.length', 1).and('be.disabled')
  })

  it('unlocks starter ship fields only after all cruise line detail fields are complete', () => {
    cy.getByTestId(rs.createShipName).should('be.disabled')
    fillCompleteCruiseLineDetails('React Unlock Line')
    cy.getByTestId(rs.createShipName).should('not.be.disabled')
    cy.getByTestId(rs.createShipPort).should('not.be.disabled')
    cy.getByTestId(rs.addShipRow).should('not.be.disabled')
    cy.getByTestId(rs.removeShipRow).should('not.be.disabled')
  })

  it('relocks starter ship controls when a cruise line detail is cleared', () => {
    fillCompleteCruiseLineDetails('React Relock Line')
    cy.getByTestId(rs.createShipName).type('React Relock Ship')
    cy.getByTestId(rs.createCruiseLineBrandTheme).clear()
    cy.getByTestId(rs.createShipName).should('be.disabled')
    cy.getByTestId(rs.createShipPort).should('be.disabled')
    cy.getByTestId(rs.addShipRow).should('be.disabled')
    cy.getByTestId(rs.removeShipRow).should('be.disabled')
  })

  it('adds and removes starter ship rows only after the cruise line details are complete', () => {
    fillCompleteCruiseLineDetails('React Row Controls Line')
    cy.getByTestId(rs.addShipRow).click().click()
    cy.getByTestId(rs.createShipName).should('have.length', 3)
    cy.getByTestId(rs.removeShipRow).eq(1).click()
    cy.getByTestId(rs.createShipName).should('have.length', 2)
  })

  it('keeps one starter ship row when removing the only row after unlocking the workflow', () => {
    fillCompleteCruiseLineDetails('React Keep One Row')
    cy.getByTestId(rs.removeShipRow).click()
    cy.getByTestId(rs.createShipName).should('have.length', 1).and('have.value', '')
    cy.getByTestId(rs.createShipPort).should('have.length', 1).and('have.value', '')
  })

  it('requires a cruise line name before sending create requests', () => {
    cy.intercept('POST', '/cruise/cruise-line').as('createCruiseLineShouldNotRun')
    cy.getByTestId(rs.createCruiseLineCountry).type('United States')
    cy.getByTestId(rs.saveCruiseLine).click()
    cy.getByTestId(rs.createCruiseLineMessage).should('contain.text', 'Cruise line name is required')
    cy.get('@createCruiseLineShouldNotRun.all').should('have.length', 0)
  })

  it('trims cruise line and starter ship values before create requests', () => {
    cy.intercept('POST', '/cruise/cruise-line', req => {
      expect(req.body).to.deep.equal({
        name: 'React Test Line',
        country: 'United States',
        website: 'https://react.example.com',
        brandFamily: 'React Holdings',
        brandTheme: 'Innovation',
        marketPositioning: 'Modern test cruising'
      })
      req.reply({ statusCode: 201, body: { id: 'react-created-line', ...req.body } })
    }).as('createTrimmedReactLine')
    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body).to.include({
        cruiseLineId: 'react-created-line',
        name: 'React Starter Ship',
        currentPort: 'Miami'
      })
      req.reply({ statusCode: 201, body: { id: 'react-created-ship', ...req.body } })
    }).as('createTrimmedReactShip')
    cy.intercept('GET', '/cruise', [...reactCruiseLines, { id: 'react-created-line', name: 'React Test Line', country: 'United States', website: 'https://react.example.com' }]).as('reloadAfterCreate')

    cy.getByTestId(rs.createCruiseLineName).type('  React Test Line  ')
    cy.getByTestId(rs.createCruiseLineCountry).type('  United States  ')
    cy.getByTestId(rs.createCruiseLineWebsite).type('  https://react.example.com  ')
    cy.getByTestId(rs.createCruiseLineBrandFamily).type('  React Holdings  ')
    cy.getByTestId(rs.createCruiseLineBrandTheme).type('  Innovation  ')
    cy.getByTestId(rs.createCruiseLineMarketPositioning).type('  Modern test cruising  ')
    cy.getByTestId(rs.createShipName).type('  React Starter Ship  ')
    cy.getByTestId(rs.createShipPort).type('  Miami  ')
    cy.getByTestId(rs.saveCruiseLine).click()
    cy.wait('@createTrimmedReactLine')
    cy.wait('@createTrimmedReactShip')
    cy.wait('@reloadAfterCreate')
    cy.getByTestId(rs.createCruiseLineMessage).should('contain.text', 'React Test Line created successfully')
  })

  it('deduplicates starter ship names before saving', () => {
    cy.intercept('POST', '/cruise/cruise-line', { statusCode: 201, body: { id: 'react-dedupe-line', name: 'React Dedupe Line' } }).as('createDedupeLine')
    cy.intercept('POST', '/cruise/ship', { statusCode: 201, body: { id: 'react-dedupe-ship', name: 'React Twin' } }).as('createDedupeShip')
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reloadAfterDedupe')

    fillCompleteCruiseLineDetails('React Dedupe Line')
    cy.getByTestId(rs.createShipName).type('React Twin')
    cy.getByTestId(rs.addShipRow).click()
    cy.getByTestId(rs.createShipName).eq(1).type(' react twin ')
    cy.getByTestId(rs.saveCruiseLine).click()
    cy.wait('@createDedupeLine')
    cy.wait('@createDedupeShip')
    cy.get('@createDedupeShip.all').should('have.length', 1)
  })

  it('uses fallback ship port from country when the starter port is blank', () => {
    cy.intercept('POST', '/cruise/cruise-line', { statusCode: 201, body: { id: 'react-country-port-line', name: 'React Country Port', country: 'Canada' } }).as('createCountryPortLine')
    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body).to.include({ currentPort: 'Canada' })
      req.reply({ statusCode: 201, body: { id: 'react-country-port-ship', ...req.body } })
    }).as('createCountryPortShip')
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reloadAfterCountryPort')

    fillCompleteCruiseLineDetails('React Country Port')
    cy.getByTestId(rs.createCruiseLineCountry).clear().type('Canada')
    cy.getByTestId(rs.createShipName).type('React Maple')
    cy.getByTestId(rs.saveCruiseLine).click()
    cy.wait('@createCountryPortLine')
    cy.wait('@createCountryPortShip')
  })

  it('shows API errors without clearing the entered create form', () => {
    cy.intercept('POST', '/cruise/cruise-line', { statusCode: 500, body: { message: 'React create failed' } }).as('createLineFailure')
    fillCompleteCruiseLineDetails('React Failure Line')
    cy.getByTestId(rs.createShipName).type('React Failure Ship')
    cy.getByTestId(rs.saveCruiseLine).click()
    cy.wait('@createLineFailure')
    cy.getByTestId(rs.createCruiseLineMessage).should('contain.text', 'React create failed')
    cy.getByTestId(rs.createCruiseLineName).should('have.value', 'React Failure Line')
    cy.getByTestId(rs.createShipName).should('have.value', 'React Failure Ship')
  })

  it('resets all create workflow fields, relocks starter ships, and restores status text', () => {
    fillCompleteCruiseLineDetails('React Reset Line')
    cy.getByTestId(rs.createShipName).type('React Reset Ship')
    cy.getByTestId(rs.resetCruiseLine).click()
    cy.getByTestId(rs.createCruiseLineName).should('have.value', '')
    cy.getByTestId(rs.createCruiseLineCountry).should('have.value', '')
    cy.getByTestId(rs.createCruiseLineWebsite).should('have.value', '')
    cy.getByTestId(rs.createCruiseLineBrandFamily).should('have.value', '')
    cy.getByTestId(rs.createCruiseLineBrandTheme).should('have.value', '')
    cy.getByTestId(rs.createCruiseLineMarketPositioning).should('have.value', '')
    cy.getByTestId(rs.createShipName).should('have.value', '').and('be.disabled')
    cy.getByTestId(rs.addShipRow).should('be.disabled')
    cy.getByTestId(rs.createCruiseLineMessage).should('contain.text', 'Ready to create')
  })
})
