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
    name: 'MSC Cruises',
    country: 'Switzerland',
    website: 'https://www.msccruises.com'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'No Country Cruise Line',
    country: null,
    website: null
  }
]

function visitHomeWithCruiseLines(cruiseLineList = cruiseLines) {
  cy.intercept('GET', '/cruise', {
    statusCode: 200,
    body: cruiseLineList
  }).as('getCruiseLines')

  cy.visit('/')
  cy.wait('@getCruiseLines')
}

describe('Cruise Explorer home page', () => {
  beforeEach(() => {
    visitHomeWithCruiseLines()
  })

  it('loads the main portfolio homepage sections', () => {
    cy.contains('Cruise Explorer').should('be.visible')
    cy.contains('Portfolio Full-Stack Demo').should('be.visible')
    cy.contains('Explore cruise data through multiple technology stacks.').should('be.visible')
    cy.contains('Cruise Lines').should('be.visible')
    cy.contains('Add a Cruise Line').should('be.visible')
    cy.contains('Why this project matters').should('be.visible')
  })

  it('renders the primary navigation links', () => {
    cy.get(selectors.navigation.primaryNav).within(() => {
      cy.get(selectors.navigation.brandLink).should('have.attr', 'href', '#home')
      cy.get(selectors.navigation.stacksLink).should('have.attr', 'href', '#stacks')
      cy.get(selectors.navigation.cruiseLinesLink).should('have.attr', 'href', '#cruise-lines')
      cy.get(selectors.navigation.aboutLink).should('have.attr', 'href', '#about')
    })
  })

  it('renders portfolio feature controls without requiring API interaction', () => {
    cy.visit('/')

    cy.get(selectors.hero.actions).should('be.visible')

    cy.get(selectors.hero.vanillaButton)
      .should('be.visible')
      .and('contain', 'Cruise Explorer Dashboard')

    cy.get(selectors.hero.testingButton)
      .should('be.visible')
      .and('contain', 'SQA Automation Focus')

    cy.get(selectors.hero.deploymentButton)
      .should('be.visible')
      .and('contain', 'CI / CD Deployment')

    cy.get(selectors.hero.stackCard)
      .should('be.visible')
      .and('contain', 'Cruise Explorer Dashboard')
  })
  
  it('displays cruise lines returned by the API', () => {
    cy.get(selectors.cruiseLines.card).should('have.length', cruiseLines.length)
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', `Showing ${cruiseLines.length} of ${cruiseLines.length}`)

    cruiseLines.forEach((line) => {
      cy.get(selectors.cruiseLines.grid).should('contain.text', line.name)
    })
  })

  it('renders each cruise line card with expected fields and actions', () => {
    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International').within(() => {
      cy.contains('Country:').should('be.visible')
      cy.contains('United States').should('be.visible')
      cy.get(selectors.cruiseLines.websiteLink)
        .should('have.attr', 'href', 'https://www.royalcaribbean.com')
        .and('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noopener')
      cy.get(selectors.cruiseLines.viewShipsButton).should('be.visible')
    })
  })

  it('shows fallback text when optional cruise line fields are missing', () => {
    cy.contains(selectors.cruiseLines.card, 'No Country Cruise Line').within(() => {
      cy.contains('Country: Not listed').should('be.visible')
      cy.contains('Visit website').should('not.exist')
      cy.get(selectors.cruiseLines.viewShipsButton).should('be.visible')
    })
  })

  it('escapes cruise line text before rendering it as HTML', () => {
    const unsafeCruiseLines = [
      {
        id: '99999999-9999-9999-9999-999999999999',
        name: '<img src=x onerror=alert(1)> Cruise',
        country: '<script>alert(1)</script>',
        website: null
      }
    ]

    visitHomeWithCruiseLines(unsafeCruiseLines)

    cy.get(`${selectors.cruiseLines.grid} img`).should('not.exist')
    cy.get(`${selectors.cruiseLines.grid} script`).should('not.exist')
    cy.get(selectors.cruiseLines.grid).should('contain.text', '<img src=x onerror=alert(1)> Cruise')
    cy.get(selectors.cruiseLines.grid).should('contain.text', '<script>alert(1)</script>')
  })

  it('shows a loading state while cruise lines are being requested', () => {
    cy.intercept('GET', '/cruise', (req) => {
      req.reply({
        delay: 500,
        statusCode: 200,
        body: cruiseLines
      })
    }).as('slowGetCruiseLines')

    cy.visit('/')
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Loading cruise lines...')
    cy.get(selectors.cruiseLines.grid).should('be.empty')
    cy.wait('@slowGetCruiseLines')
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', `Showing ${cruiseLines.length} of ${cruiseLines.length}`)
  })

  it('shows a useful message when the cruise line API fails', () => {
    cy.intercept('GET', '/cruise', {
      statusCode: 500,
      body: { message: 'Database unavailable' }
    }).as('getCruiseLinesFailure')

    cy.visit('/')
    cy.wait('@getCruiseLinesFailure')

    cy.get(selectors.cruiseLines.statusMessage)
      .should('contain.text', 'Could not load cruise lines')
      .and('contain.text', 'Check that the server is running')
    cy.get(selectors.cruiseLines.card).should('not.exist')
  })

  it('shows a useful message when the cruise line API returns invalid JSON', () => {
    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: 'not-json',
      headers: { 'content-type': 'application/json' }
    }).as('getInvalidJson')

    cy.visit('/')
    cy.wait('@getInvalidJson')

    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Could not load cruise lines')
    cy.get(selectors.cruiseLines.card).should('not.exist')
  })
})

describe('Cruise Explorer SQA Test Control Panel', () => {
  beforeEach(() => {
    visitHomeWithCruiseLines()
  })

  it('displays the manual validation panel and controls', () => {
    cy.contains('SQA Test Control Panel').should('be.visible')
    cy.contains('Manual validation tools for API-driven UI behavior').should('be.visible')
    cy.get(selectors.testPanel.healthCheckButton).should('contain.text', 'Check API Health')
    cy.get(selectors.testPanel.reloadDataButton).should('contain.text', 'Verify Cruise Data')
    cy.get(selectors.testPanel.uiSmokeTestButton).should('contain.text', 'Run UI Smoke Check')
    cy.get(selectors.testPanel.clearOutputButton).should('contain.text', 'Clear Output')
    cy.get(selectors.testPanel.output).should('contain.text', 'Test output will appear here')
  })

  it('runs a successful API health check from the UI', () => {
    cy.intercept('GET', '/health', {
      statusCode: 200,
      body: { status: 'ok' }
    }).as('healthCheck')

    cy.get(selectors.testPanel.healthCheckButton).click()
    cy.wait('@healthCheck')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'API Health Check Result')
      .and('contain.text', '"passed": true')
      .and('contain.text', '"statusCode": 200')
  })

  it('reports a failed API health check when the server returns an error', () => {
    cy.intercept('GET', '/health', {
      statusCode: 503,
      body: { status: 'down' }
    }).as('healthCheckFailure')

    cy.get(selectors.testPanel.healthCheckButton).click()
    cy.wait('@healthCheckFailure')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'API Health Check Result')
      .and('contain.text', '"passed": false')
      .and('contain.text', '"statusCode": 503')
  })

  it('verifies cruise data and reloads the grid', () => {
    const updatedCruiseLines = [
      ...cruiseLines,
      {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Updated Test Cruise Line',
        country: 'Canada',
        website: null
      }
    ]

    let requestCount = 0
    cy.intercept('GET', '/cruise', (req) => {
      requestCount += 1
      req.reply({
        statusCode: 200,
        body: requestCount === 1 ? cruiseLines : updatedCruiseLines
      })
    }).as('getCruiseLinesForVerification')

    cy.visit('/')
    cy.wait('@getCruiseLinesForVerification')

    cy.get(selectors.testPanel.reloadDataButton).click()
    cy.wait('@getCruiseLinesForVerification')
    cy.wait('@getCruiseLinesForVerification')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'Cruise Data Verification Result')
      .and('contain.text', '"passed": true')
      .and('contain.text', `"recordCount": ${updatedCruiseLines.length}`)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Updated Test Cruise Line')
  })

  it('reports cruise data verification failure when the API returns a non-array response', () => {
    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: { message: 'Unexpected response shape' }
    }).as('badCruiseData')

    cy.get(selectors.testPanel.reloadDataButton).click()
    cy.wait('@badCruiseData')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'Cruise Data Verification Result')
      .and('contain.text', '"passed": false')
      .and('contain.text', '"recordCount": 0')
  })

  it('runs a passing UI smoke check across health, cruise lines, and ships', () => {
    cy.intercept('GET', '/health', { statusCode: 200, body: { status: 'ok' } }).as('smokeHealth')
    cy.intercept('GET', '/cruise', { statusCode: 200, body: cruiseLines }).as('smokeCruiseLines')
    cy.intercept('GET', `/cruise/ships/${cruiseLines[0].id}`, {
      statusCode: 200,
      body: [{ id: 'ship-1', name: 'Icon of the Seas', cruiseLineId: cruiseLines[0].id }]
    }).as('smokeShips')

    cy.get(selectors.testPanel.uiSmokeTestButton).click()
    cy.wait('@smokeHealth')
    cy.wait('@smokeCruiseLines')
    cy.wait('@smokeShips')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'UI Smoke Check Result')
      .and('contain.text', '"passed": true')
      .and('contain.text', 'GET /health')
      .and('contain.text', 'GET /cruise')
      .and('contain.text', 'GET /cruise/ships/:cruiseLineId')
  })

  it('reports a failing UI smoke check when one dependency fails', () => {
    cy.intercept('GET', '/health', { statusCode: 200, body: { status: 'ok' } }).as('smokeHealthFailureCase')
    cy.intercept('GET', '/cruise', { statusCode: 500, body: { message: 'Server error' } }).as('smokeCruiseFailureCase')

    cy.get(selectors.testPanel.uiSmokeTestButton).click()
    cy.wait('@smokeHealthFailureCase')
    cy.wait('@smokeCruiseFailureCase')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'UI Smoke Check Result')
      .and('contain.text', '"passed": false')
      .and('contain.text', 'GET /cruise')
      .and('contain.text', '"statusCode": 500')
  })

  it('clears manual test output', () => {
    cy.intercept('GET', '/health', { statusCode: 200, body: { status: 'ok' } }).as('healthBeforeClear')

    cy.get(selectors.testPanel.healthCheckButton).click()
    cy.wait('@healthBeforeClear')
    cy.get(selectors.testPanel.output).should('contain.text', 'API Health Check Result')

    cy.get(selectors.testPanel.clearOutputButton).click()
    cy.get(selectors.testPanel.output).should('have.text', 'Test output will appear here...')
  })
})
