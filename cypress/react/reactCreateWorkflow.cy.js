const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { reactCruiseLines, reactShips, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React create cruise line coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('renders the create cruise line workflow with starter ship fields', () => {
    cy.getByTestId(rs.createCruiseLineWorkflow).should('be.visible').and('contain.text', 'Add New Cruise Data')
    cy.getByTestId(rs.createCruiseLineName).should('have.attr', 'required')
    cy.getByTestId(rs.createCruiseLineCountry).should('be.visible')
    cy.getByTestId(rs.createCruiseLineWebsite).should('be.visible')
    cy.getByTestId(rs.createShipName).should('have.length', 1)
    cy.getByTestId(rs.createShipPort).should('have.length', 1)
    cy.getByTestId(rs.createCruiseLineMessage).should('contain.text', 'Ready to create')
  })

  it('adds and removes starter ship rows without leaving the workflow', () => {
    cy.getByTestId(rs.addShipRow).click().click()
    cy.getByTestId(rs.createShipName).should('have.length', 3)
    cy.getByTestId(rs.removeShipRow).eq(1).click()
    cy.getByTestId(rs.createShipName).should('have.length', 2)
  })

  it('keeps one starter ship row when removing the only row', () => {
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
        website: 'https://react.example.com'
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

    cy.getByTestId(rs.createCruiseLineName).type('React Dedupe Line')
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

    cy.getByTestId(rs.createCruiseLineName).type('React Country Port')
    cy.getByTestId(rs.createCruiseLineCountry).type('Canada')
    cy.getByTestId(rs.createShipName).type('React Maple')
    cy.getByTestId(rs.saveCruiseLine).click()
    cy.wait('@createCountryPortLine')
    cy.wait('@createCountryPortShip')
  })

  it('shows API errors without clearing the entered create form', () => {
    cy.intercept('POST', '/cruise/cruise-line', { statusCode: 500, body: { message: 'React create failed' } }).as('createLineFailure')
    cy.getByTestId(rs.createCruiseLineName).type('React Failure Line')
    cy.getByTestId(rs.createShipName).type('React Failure Ship')
    cy.getByTestId(rs.saveCruiseLine).click()
    cy.wait('@createLineFailure')
    cy.getByTestId(rs.createCruiseLineMessage).should('contain.text', 'React create failed')
    cy.getByTestId(rs.createCruiseLineName).should('have.value', 'React Failure Line')
    cy.getByTestId(rs.createShipName).should('have.value', 'React Failure Ship')
  })

  it('resets all create workflow fields and status text', () => {
    cy.getByTestId(rs.createCruiseLineName).type('React Reset Line')
    cy.getByTestId(rs.createCruiseLineCountry).type('United States')
    cy.getByTestId(rs.createCruiseLineWebsite).type('https://reset.example.com')
    cy.getByTestId(rs.createShipName).type('React Reset Ship')
    cy.getByTestId(rs.resetCruiseLine).click()
    cy.getByTestId(rs.createCruiseLineName).should('have.value', '')
    cy.getByTestId(rs.createCruiseLineCountry).should('have.value', '')
    cy.getByTestId(rs.createCruiseLineWebsite).should('have.value', '')
    cy.getByTestId(rs.createShipName).should('have.value', '')
    cy.getByTestId(rs.createCruiseLineMessage).should('contain.text', 'Ready to create')
  })
})
