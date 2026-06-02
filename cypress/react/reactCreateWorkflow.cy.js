const { reactCruiseLines, reactShips, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React create cruise line parity', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('renders the create cruise line workflow with starter ship fields', () => {
    cy.getByTestId('react-create-cruise-line-workflow').should('be.visible').and('contain.text', 'Add New Cruise Data')
    cy.getByTestId('react-create-cruise-line-name').should('have.attr', 'required')
    cy.getByTestId('react-create-cruise-line-country').should('be.visible')
    cy.getByTestId('react-create-cruise-line-website').should('be.visible')
    cy.getByTestId('react-create-ship-name').should('have.length', 1)
    cy.getByTestId('react-create-ship-port').should('have.length', 1)
    cy.getByTestId('react-create-cruise-line-message').should('contain.text', 'Ready to create')
  })

  it('adds and removes starter ship rows without leaving the workflow', () => {
    cy.getByTestId('react-add-ship-row').click().click()
    cy.getByTestId('react-create-ship-name').should('have.length', 3)
    cy.getByTestId('react-remove-ship-row').eq(1).click()
    cy.getByTestId('react-create-ship-name').should('have.length', 2)
  })

  it('keeps one starter ship row when removing the only row', () => {
    cy.getByTestId('react-remove-ship-row').click()
    cy.getByTestId('react-create-ship-name').should('have.length', 1).and('have.value', '')
    cy.getByTestId('react-create-ship-port').should('have.length', 1).and('have.value', '')
  })

  it('requires a cruise line name before sending create requests', () => {
    cy.intercept('POST', '/cruise/cruise-line').as('createCruiseLineShouldNotRun')
    cy.getByTestId('react-create-cruise-line-country').type('United States')
    cy.getByTestId('react-save-cruise-line').click()
    cy.getByTestId('react-create-cruise-line-message').should('contain.text', 'Cruise line name is required')
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

    cy.getByTestId('react-create-cruise-line-name').type('  React Test Line  ')
    cy.getByTestId('react-create-cruise-line-country').type('  United States  ')
    cy.getByTestId('react-create-cruise-line-website').type('  https://react.example.com  ')
    cy.getByTestId('react-create-ship-name').type('  React Starter Ship  ')
    cy.getByTestId('react-create-ship-port').type('  Miami  ')
    cy.getByTestId('react-save-cruise-line').click()
    cy.wait('@createTrimmedReactLine')
    cy.wait('@createTrimmedReactShip')
    cy.wait('@reloadAfterCreate')
    cy.getByTestId('react-create-cruise-line-message').should('contain.text', 'React Test Line created successfully')
  })

  it('deduplicates starter ship names before saving', () => {
    cy.intercept('POST', '/cruise/cruise-line', { statusCode: 201, body: { id: 'react-dedupe-line', name: 'React Dedupe Line' } }).as('createDedupeLine')
    cy.intercept('POST', '/cruise/ship', { statusCode: 201, body: { id: 'react-dedupe-ship', name: 'React Twin' } }).as('createDedupeShip')
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reloadAfterDedupe')

    cy.getByTestId('react-create-cruise-line-name').type('React Dedupe Line')
    cy.getByTestId('react-create-ship-name').type('React Twin')
    cy.getByTestId('react-add-ship-row').click()
    cy.getByTestId('react-create-ship-name').eq(1).type(' react twin ')
    cy.getByTestId('react-save-cruise-line').click()
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

    cy.getByTestId('react-create-cruise-line-name').type('React Country Port')
    cy.getByTestId('react-create-cruise-line-country').type('Canada')
    cy.getByTestId('react-create-ship-name').type('React Maple')
    cy.getByTestId('react-save-cruise-line').click()
    cy.wait('@createCountryPortLine')
    cy.wait('@createCountryPortShip')
  })

  it('shows API errors without clearing the entered create form', () => {
    cy.intercept('POST', '/cruise/cruise-line', { statusCode: 500, body: { message: 'React create failed' } }).as('createLineFailure')
    cy.getByTestId('react-create-cruise-line-name').type('React Failure Line')
    cy.getByTestId('react-create-ship-name').type('React Failure Ship')
    cy.getByTestId('react-save-cruise-line').click()
    cy.wait('@createLineFailure')
    cy.getByTestId('react-create-cruise-line-message').should('contain.text', 'React create failed')
    cy.getByTestId('react-create-cruise-line-name').should('have.value', 'React Failure Line')
    cy.getByTestId('react-create-ship-name').should('have.value', 'React Failure Ship')
  })

  it('resets all create workflow fields and status text', () => {
    cy.getByTestId('react-create-cruise-line-name').type('React Reset Line')
    cy.getByTestId('react-create-cruise-line-country').type('United States')
    cy.getByTestId('react-create-cruise-line-website').type('https://reset.example.com')
    cy.getByTestId('react-create-ship-name').type('React Reset Ship')
    cy.getByTestId('react-reset-cruise-line').click()
    cy.getByTestId('react-create-cruise-line-name').should('have.value', '')
    cy.getByTestId('react-create-cruise-line-country').should('have.value', '')
    cy.getByTestId('react-create-cruise-line-website').should('have.value', '')
    cy.getByTestId('react-create-ship-name').should('have.value', '')
    cy.getByTestId('react-create-cruise-line-message').should('contain.text', 'Ready to create')
  })
})
