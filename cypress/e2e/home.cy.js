describe('Cruise Explorer basic UI smoke tests', () => {
  let cruiseLines = []

  beforeEach(() => {
    cy.request('/cruise').then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.length).to.be.greaterThan(0)

      cruiseLines = res.body
    })

    cy.visit('/')
  })

  it('loads the homepage', () => {
    cy.contains('Cruise Explorer').should('be.visible')
  })

  it('displays cruise lines from the live API', () => {
    cy.get('#cruise-grid .data-card', { timeout: 10000 })
      .should('have.length', cruiseLines.length)

    cy.get('#status-message')
      .should(
        'contain.text',
        `Showing ${cruiseLines.length} of ${cruiseLines.length}`
      )

    cy.get('#cruise-grid')
      .should('contain.text', cruiseLines[0].name)
  })

  it('displays the SQA Test Control Panel', () => {
    cy.contains('SQA Test Control Panel').should('be.visible')

    cy.contains('Check API Health').should('be.visible')
    cy.contains('Verify Cruise Data').should('be.visible')
    cy.contains('Run UI Smoke Check').should('be.visible')
  })

  it('runs the API health check from the UI', () => {
    cy.contains('Check API Health').click()

    cy.get('#testOutput')
      .should('contain.text', 'API Health Check Result')
      .and('contain.text', '"passed": true')
  })

  it('verifies cruise data from the UI test panel', () => {
    cy.contains('Verify Cruise Data').click()

    cy.get('#testOutput')
      .should('contain.text', 'Cruise Data Verification')
      .and('contain.text', `"recordCount": ${cruiseLines.length}`)
  })

  it('runs the UI smoke check from the UI test panel', () => {
    cy.contains('Run UI Smoke Check').click()

    cy.get('#testOutput')
      .should('contain.text', 'UI Smoke Check')
      .and('contain.text', '"passed": true')
  })

  it('renders cruise line cards with expected data fields', () => {
    const cruiseLine = cruiseLines[0]

    cy.contains('#cruise-grid .data-card', cruiseLine.name)
      .should('contain.text', cruiseLine.country)

    cy.contains('#cruise-grid .data-card', cruiseLine.name)
      .contains('button', 'View Ships')
      .should('be.visible')
  })

  it('displays all cruise cards after page load', () => {
    cy.get('#cruise-grid .data-card')
      .each(($card) => {
        cy.wrap($card)
          .should('be.visible')
      })
  })
})