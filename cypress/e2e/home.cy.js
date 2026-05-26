import { selectors } from '../support/selectors'
import { homeCruiseLines as cruiseLines } from '../support/testData'
import { visitHomeWithCruiseLines } from '../support/apiMocks'

function expectElementFullyWithinViewport(selectorOrElement) {
  cy.get(selectorOrElement).then($element => {
    const rect = $element[0].getBoundingClientRect()

    cy.window().then(window => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      expect(rect.left, 'left edge is inside viewport').to.be.at.least(0)
      expect(rect.right, 'right edge is inside viewport').to.be.at.most(viewportWidth)
      expect(rect.top, 'top edge is not clipped far above viewport').to.be.at.least(-1)
      expect(rect.bottom, 'bottom edge is inside viewport').to.be.at.most(viewportHeight)
    })
  })
}


describe('Cruise Explorer home page', () => {
  beforeEach(() => {
    visitHomeWithCruiseLines()
  })

  it('loads the main portfolio homepage sections', () => {
    cy.contains('Cruise Explorer').should('be.visible')
    cy.contains('Cruise Operations Dashboard').should('be.visible')
    cy.contains('Manage cruise line and fleet operations').should('be.visible')
    cy.contains('Cruise Lines').should('be.visible')
    cy.contains('Add a Cruise Line').should('be.visible')
    cy.contains('Why this project matters').should('be.visible')
  })

  it('renders the primary navigation links', () => {
    cy.get(selectors.navigation.primaryNav).within(() => {
      cy.get(selectors.navigation.brandLink).should('have.attr', 'href', '#home')
      cy.get(selectors.navigation.dashboardLink).should('have.attr', 'href', '#dashboard')
      cy.get(selectors.navigation.workspaceLink).should('have.attr', 'href', '#workspace-overview')
      cy.get(selectors.navigation.sqaControlsLink).should('have.attr', 'href', '#testPanel')
      cy.get(selectors.navigation.cruiseLinesLink).should('have.attr', 'href', '#cruise-lines')
      cy.get(selectors.navigation.aboutLink).should('have.attr', 'href', '#about')
    })
  })

  it('renders a workspace navigation rail and overview cards for workflow-first navigation', () => {
    cy.get(selectors.workspace.rail).scrollIntoView().should('be.visible')
    cy.get(selectors.workspace.nav).within(() => {
      cy.get(selectors.workspace.rolesLink).should('have.attr', 'href', '#demo-role-panel')
      cy.get(selectors.workspace.operationsLink).should('have.attr', 'href', '#role-booking-dashboard')
      cy.get(selectors.workspace.fleetLink).should('have.attr', 'href', '#cruise-lines')
      cy.get(selectors.workspace.createLink).should('have.attr', 'href', '#add-cruise-line-heading')
      cy.get(selectors.workspace.qualityLink).should('have.attr', 'href', '#testPanel')
    })

    expectElementFullyWithinViewport(selectors.workspace.rail)
    expectElementFullyWithinViewport(`${selectors.workspace.rail} .workspace-rail-card`)
    cy.get(selectors.workspace.nav).then($nav => {
      expect($nav[0].scrollWidth, 'workspace rail nav does not cause page overflow').to.be.at.most($nav[0].clientWidth + 24)
    })

    cy.document().then(document => {
      expect(document.documentElement.scrollWidth, 'document has no horizontal page overflow').to.be.at.most(document.documentElement.clientWidth + 1)
    })

    cy.get(selectors.workspace.overview).should('be.visible')
    cy.get(selectors.workspace.overviewCard)
      .should('have.length', 4)
      .and('contain.text', 'Role Simulation')
      .and('contain.text', 'Fleet Directory')
      .and('contain.text', 'Admin Operations')
      .and('contain.text', 'Quality Console')
  })



  it('renders a workflow-first operations guide with reachable next-step links', () => {
    cy.get(selectors.operationsGuide.panel).scrollIntoView().should('be.visible')
    cy.get(selectors.operationsGuide.panel)
      .should('contain.text', 'Recommended Workflow')
      .and('contain.text', 'Start with the role, then move through the operation')
      .and('contain.text', 'Choose role')
      .and('contain.text', 'Review operations')
      .and('contain.text', 'Manage fleet')
      .and('contain.text', 'Run quality checks')

    cy.get(selectors.operationsGuide.steps).find('a').should('have.length', 4)
    cy.get(selectors.operationsGuide.roleLink).should('have.attr', 'href', '#demo-role-panel')
    cy.get(selectors.operationsGuide.bookingLink).should('have.attr', 'href', '#role-booking-dashboard')
    cy.get(selectors.operationsGuide.fleetLink).should('have.attr', 'href', '#cruise-lines')
    cy.get(selectors.operationsGuide.qualityLink).should('have.attr', 'href', '#testPanel')

    cy.get(selectors.operationsGuide.qualityLink).click()
    cy.get(selectors.testPanel.panel).should('be.visible')
  })



  it('keeps the workspace rail inside the viewport at desktop, tablet, and mobile widths', () => {
    ;[
      [1280, 720],
      [1000, 660],
      [900, 900],
      [390, 844]
    ].forEach(([width, height]) => {
      cy.viewport(width, height)
      cy.visit('/')

      cy.window().then(window => {
        expect(window.innerWidth, `viewport width applied for ${width}px case`).to.equal(width)
      })

      cy.get(selectors.workspace.rail).scrollIntoView().should('be.visible')
      expectElementFullyWithinViewport(selectors.workspace.rail)
      expectElementFullyWithinViewport(`${selectors.workspace.rail} .workspace-rail-card`)

      cy.get(selectors.workspace.nav).then($nav => {
        expect($nav[0].scrollWidth, `rail nav does not require horizontal scrolling at ${width}px`).to.be.at.most($nav[0].clientWidth + 1)
      })

      cy.document().then(document => {
        expect(document.documentElement.scrollWidth, `no horizontal overflow at ${width}px`).to.be.at.most(document.documentElement.clientWidth + 1)
      })
    })
  })

  it('keeps workspace navigation viewport-safe after repeated anchor jumps', () => {
    cy.viewport(390, 844)
    cy.visit('/')

    ;[
      selectors.workspace.qualityLink,
      selectors.workspace.rolesLink,
      selectors.workspace.fleetLink,
      selectors.workspace.createLink
    ].forEach(selector => {
      cy.get(selector).click()
      cy.get(selectors.workspace.rail).scrollIntoView().should('be.visible')
      expectElementFullyWithinViewport(selectors.workspace.rail)
      cy.document().then(document => {
        expect(document.documentElement.scrollWidth, `no horizontal overflow after activating ${selector}`).to.be.at.most(document.documentElement.clientWidth + 1)
      })
    })
  })



  it('uses workspace links to move directly to major operational areas', () => {
    cy.get(selectors.workspace.qualityLink).click()
    cy.location('hash').should('eq', '#testPanel')
    cy.get(selectors.testPanel.panel).should('be.visible')

    cy.get(selectors.workspace.fleetLink).click()
    cy.location('hash').should('eq', '#cruise-lines')
    cy.get(selectors.cruiseLines.section).should('be.visible')

    cy.get(selectors.workspace.rolesLink).click()
    cy.location('hash').should('eq', '#demo-role-panel')
    cy.get(selectors.demoRole.panel).should('be.visible')
  })

  it('does not render workspace overview cards as disconnected controls', () => {
    cy.get(selectors.workspace.overviewCard).each($card => {
      cy.wrap($card).should('have.attr', 'href').and('match', /^#.+/)
    })

    cy.get(selectors.workspace.overviewCard).contains('Role Simulation').click()
    cy.location('hash').should('eq', '#demo-role-panel')
  })




  it('keeps the update workflow hidden on startup until update is selected', () => {
    cy.get('[data-testid="update-cruise-line-panel"]')
      .should('not.be.visible')
      .and('have.attr', 'aria-hidden', 'true')
      .and('have.class', 'workflow-panel-hidden')

    cy.get('[data-testid="update-cruise-line-button"]').first().click()

    cy.get('[data-testid="update-cruise-line-panel"]')
      .should('be.visible')
      .and('have.attr', 'aria-hidden', 'false')
      .and('not.have.class', 'workflow-panel-hidden')

    cy.get('[data-testid="update-cruise-line-cancel-button"]').click()

    cy.get('[data-testid="update-cruise-line-panel"]')
      .should('not.be.visible')
      .and('have.attr', 'aria-hidden', 'true')
      .and('have.class', 'workflow-panel-hidden')
  })

  it('renders professional dashboard hero content without requiring API interaction', () => {
    cy.visit('/')

    cy.get(selectors.hero.dashboard).should('be.visible')
    cy.contains('Manage cruise line and fleet operations').should('be.visible')
    cy.contains('production-style full-stack platform').should('be.visible')

    cy.get(selectors.hero.ctaRow).within(() => {
      cy.get(selectors.hero.addCruiseLineLink)
        .should('be.visible')
        .and('have.attr', 'href', '#add-cruise-line-heading')
        .and('contain', 'Add Cruise Line')

      cy.get(selectors.hero.viewCruiseLinesLink)
        .should('be.visible')
        .and('have.attr', 'href', '#cruise-line-results')
        .and('contain', 'Explore Fleet')
    })

    cy.get(selectors.hero.statusPills).should('be.visible')
    cy.get(selectors.hero.liveStatus).should('contain', 'Live Deployment')
    cy.get(selectors.hero.databaseStatus).should('contain', 'PostgreSQL')
    cy.get(selectors.hero.cicdStatus).should('contain', 'CI/CD Enabled')
    cy.get(selectors.hero.crudStatus).should('contain', 'Full CRUD')
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

  it('displays the polished SQA quality console and controls', () => {
    cy.contains('SQA Test Control Panel').should('be.visible')
    cy.contains('Manual validation tools for API-driven UI behavior').should('be.visible')
    cy.contains('quality operations console').should('be.visible')

    cy.get(selectors.testPanel.statusCard).should('be.visible')
    cy.get(selectors.testPanel.statusText).should('contain.text', 'Ready for validation')
    cy.get(selectors.testPanel.lastRunLabel).should('contain.text', 'No manual run yet')

    cy.get(selectors.testPanel.actionGrid).should('be.visible')
    cy.get(selectors.testPanel.actionCard).should('have.length', 10)
    cy.get(selectors.testPanel.panel).should('not.contain.text', 'Response Time')
    cy.get(selectors.testPanel.panel).should('contain.text', 'Health Check')
    cy.get(selectors.testPanel.panel).should('contain.text', 'Data Verification')
    cy.get(selectors.testPanel.panel).should('contain.text', 'UI Smoke Check')
    cy.get(selectors.testPanel.panel).should('contain.text', 'API Contract Check')
    cy.get(selectors.testPanel.panel).should('contain.text', 'Safe CRUD Workflow')
    cy.get(selectors.testPanel.panel).should('contain.text', 'Performance Smoke Check')
    cy.get(selectors.testPanel.panel).should('contain.text', 'Seed Integrity Check')
    cy.get(selectors.testPanel.panel).should('contain.text', 'Rendering Consistency')
    cy.get(selectors.testPanel.panel).should('contain.text', 'Deployment Diagnostics')
    cy.get(selectors.testPanel.panel).should('contain.text', 'Demo Data Recovery')
    cy.get(selectors.testPanel.healthCheckButton).should('contain.text', 'Check API Health')
    cy.get(selectors.testPanel.reloadDataButton).should('contain.text', 'Verify Cruise Data')
    cy.get(selectors.testPanel.uiSmokeTestButton).should('contain.text', 'Run UI Smoke Check')
    cy.get(selectors.testPanel.apiContractCheckButton).should('contain.text', 'Check API Contract')
    cy.get(selectors.testPanel.crudWorkflowCheckButton).should('contain.text', 'Run CRUD Workflow Check')
    cy.get(selectors.testPanel.performanceSmokeCheckButton).should('contain.text', 'Run Performance Check')
    cy.get(selectors.testPanel.seedIntegrityCheckButton).should('contain.text', 'Check Seed Integrity')
    cy.get(selectors.testPanel.renderingConsistencyCheckButton).should('contain.text', 'Check Rendering')
    cy.get(selectors.testPanel.deploymentDiagnosticsButton).should('contain.text', 'Run Deployment Check')
    cy.get(selectors.testPanel.resetDemoDataButton).should('contain.text', 'Reset Demo Data')
    cy.get(selectors.testPanel.clearOutputButton).should('contain.text', 'Clear Output')
    cy.get(selectors.testPanel.outputPanel).should('be.visible')
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
    cy.get(selectors.testPanel.statusText).should('contain.text', 'Validation passed')
    cy.get(selectors.testPanel.lastRunLabel).should('contain.text', 'Last run: API Health Check Result')
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
    cy.get(selectors.testPanel.statusText).should('contain.text', 'Validation needs attention')
    cy.get(selectors.testPanel.lastRunLabel).should('contain.text', 'Last run: API Health Check Result')
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
      body: [{ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Icon of the Seas', currentPort: 'Miami, Florida', cruiseLineId: cruiseLines[0].id }]
    }).as('smokeShips')

    cy.intercept('GET', `/cruise/ship/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/sailings`, {
      statusCode: 200,
      body: [{
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        shipId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        departureDate: '2026-07-05',
        port: 'Miami, Florida',
        departurePort: 'Miami, Florida',
        arrivalPort: 'Miami, Florida',
        days: 3,
        isRepositioning: false
      }]
    }).as('smokeSailings')

    cy.intercept('GET', `/cruise/sailings/cccccccc-cccc-cccc-cccc-cccccccccccc/itinerary`, {
      statusCode: 200,
      body: [{
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
        sailingId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        day: 1,
        title: 'Embarkation Day',
        port: 'Miami, Florida',
        activitySchedule: [{
          id: 'ffffffff-ffff-ffff-ffff-fffffffffff1',
          itineraryDayId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
          time: '12:00 PM',
          activity: 'Guest boarding and welcome lunch'
        }]
      }]
    }).as('smokeItinerary')

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

  it('shows running state while manual health validation is in progress', () => {
    cy.intercept('GET', '/health', (req) => {
      req.reply({
        delay: 500,
        statusCode: 200,
        body: { status: 'ok' }
      })
    }).as('slowHealthCheck')

    cy.get(selectors.testPanel.healthCheckButton).click()
    cy.get(selectors.testPanel.healthCheckButton)
      .should('be.disabled')
      .and('contain.text', 'Checking...')
    cy.get(selectors.testPanel.statusText).should('contain.text', 'Running health check')

    cy.wait('@slowHealthCheck')
    cy.get(selectors.testPanel.healthCheckButton)
      .should('not.be.disabled')
      .and('contain.text', 'Check API Health')
  })

  it('updates console status and last-run metadata after data verification', () => {
    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: cruiseLines
    }).as('sqaCruiseData')

    cy.get(selectors.testPanel.reloadDataButton).click()
    cy.wait('@sqaCruiseData')
    cy.wait('@sqaCruiseData')

    cy.get(selectors.testPanel.statusText).should('contain.text', 'Validation passed')
    cy.get(selectors.testPanel.lastRunLabel).should('contain.text', 'Last run: Cruise Data Verification Result')
  })

  it('runs an API contract check for cruise lines and ships', () => {
    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: cruiseLines
    }).as('contractCruiseLines')

    cy.intercept('GET', `/cruise/ships/${cruiseLines[0].id}`, {
      statusCode: 200,
      body: [{ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Icon of the Seas', currentPort: 'Miami, Florida', cruiseLineId: cruiseLines[0].id }]
    }).as('contractShips')

    cy.intercept('GET', `/cruise/ship/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/sailings`, {
      statusCode: 200,
      body: [{
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        shipId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        departureDate: '2026-07-05',
        port: 'Miami, Florida',
        departurePort: 'Miami, Florida',
        arrivalPort: 'Miami, Florida',
        days: 3,
        isRepositioning: false
      }]
    }).as('contractSailings')

    cy.intercept('GET', `/cruise/sailings/cccccccc-cccc-cccc-cccc-cccccccccccc/itinerary`, {
      statusCode: 200,
      body: [{
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
        sailingId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        day: 1,
        title: 'Embarkation Day',
        port: 'Miami, Florida',
        activitySchedule: [{
          id: 'ffffffff-ffff-ffff-ffff-fffffffffff1',
          itineraryDayId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
          time: '12:00 PM',
          activity: 'Guest boarding and welcome lunch'
        }]
      }]
    }).as('contractItinerary')

    cy.get(selectors.testPanel.apiContractCheckButton).click()
    cy.wait('@contractCruiseLines')
    cy.wait('@contractShips')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'API Contract Check Result')
      .and('contain.text', '"passed": true')
      .and('contain.text', '"requiredFields"')
      .and('contain.text', '"contractPassed": true')
    cy.get(selectors.testPanel.lastRunLabel).should('contain.text', 'Last run: API Contract Check Result')
  })

  it('reports an API contract failure when cruise data is malformed', () => {
    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: [{ id: 'bad-record-without-name' }]
    }).as('badContractCruiseLines')

    cy.intercept('GET', '/cruise/ships/bad-record-without-name', {
      statusCode: 200,
      body: []
    }).as('badContractShips')

    cy.get(selectors.testPanel.apiContractCheckButton).click()
    cy.wait('@badContractCruiseLines')
    cy.wait('@badContractShips')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'API Contract Check Result')
      .and('contain.text', '"passed": false')
      .and('contain.text', '"contractPassed": false')
    cy.get(selectors.testPanel.statusText).should('contain.text', 'Validation needs attention')
  })

  it('runs a safe CRUD workflow check and cleans up the temporary record', () => {
    const temporaryCruiseLine = {
      id: '99999999-9999-4999-8999-999999999999',
      name: 'SQA Temporary Cruise Line',
      country: 'SQA',
      website: 'https://example.com/sqa-temp'
    }

    const temporaryShip = {
      id: '88888888-8888-4888-8888-888888888888',
      name: 'SQA Temporary Ship',
      currentPort: 'SQA Test Port',
      cruiseLineId: temporaryCruiseLine.id
    }

    cy.intercept('POST', '/cruise/cruise-line', {
      statusCode: 201,
      body: temporaryCruiseLine
    }).as('sqaCreateCruiseLine')

    cy.intercept('PATCH', `/cruise/cruise-line/${temporaryCruiseLine.id}`, {
      statusCode: 200,
      body: { ...temporaryCruiseLine, name: 'SQA Temporary Cruise Line Updated' }
    }).as('sqaUpdateCruiseLine')

    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body.name).to.match(/^SQA Temporary Ship \d+$/)
      expect(req.body).to.include({
        currentPort: 'SQA Test Port',
        cruiseLineId: temporaryCruiseLine.id
      })

      temporaryShip.name = req.body.name

      req.reply({
        statusCode: 201,
        body: temporaryShip
      })
    }).as('sqaCreateShip')

    cy.intercept('PATCH', `/cruise/ship/${temporaryShip.id}`, req => {
      expect(req.body.name).to.match(/^SQA Temporary Ship \d+ Updated$/)
      expect(req.body).to.include({
        currentPort: 'SQA Updated Test Port',
        cruiseLineId: temporaryCruiseLine.id
      })

      req.reply({
        statusCode: 200,
        body: {
          ...temporaryShip,
          name: req.body.name,
          currentPort: 'SQA Updated Test Port'
        }
      })
    }).as('sqaUpdateShip')

    cy.intercept('GET', `/cruise/ships/${temporaryCruiseLine.id}`, {
      statusCode: 200,
      body: [temporaryShip]
    }).as('sqaVerifyShips')

    cy.intercept('DELETE', `/cruise/cruise-line/${temporaryCruiseLine.id}`, {
      statusCode: 200,
      body: { message: 'Temporary cruise line deleted' }
    }).as('sqaDeleteCruiseLine')

    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: cruiseLines
    }).as('sqaReloadAfterCrud')

    cy.get(selectors.testPanel.crudWorkflowCheckButton).click()

    cy.wait('@sqaCreateCruiseLine')
    cy.wait('@sqaUpdateCruiseLine')
    cy.wait('@sqaCreateShip')
    cy.wait('@sqaUpdateShip')
    cy.wait('@sqaVerifyShips')
    cy.wait('@sqaDeleteCruiseLine')
    cy.wait('@sqaReloadAfterCrud')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'Safe CRUD Workflow Check Result')
      .and('contain.text', '"passed": true')
      .and('contain.text', '"temporaryRecordCleanedUp": true')
      .and('contain.text', 'delete temporary cruise line')
  })

  it('runs a performance smoke check with endpoint timing thresholds', () => {
    cy.intercept('GET', '/health', {
      statusCode: 200,
      body: { status: 'ok' }
    }).as('performanceHealth')

    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: cruiseLines
    }).as('performanceCruiseLines')

    cy.intercept('GET', `/cruise/ships/${cruiseLines[0].id}`, {
      statusCode: 200,
      body: [{ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Icon of the Seas', currentPort: 'Miami, Florida', cruiseLineId: cruiseLines[0].id }]
    }).as('performanceShips')

    cy.get(selectors.testPanel.performanceSmokeCheckButton).click()
    cy.wait('@performanceHealth')
    cy.wait('@performanceCruiseLines')
    cy.wait('@performanceShips')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'Performance Smoke Check Result')
      .and('contain.text', '"passed": true')
      .and('contain.text', '"durationMs"')
      .and('contain.text', '"thresholdMs"')
  })

  it('runs a seed data integrity check', () => {
    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: cruiseLines
    }).as('seedCruiseLines')

    cy.intercept('GET', `/cruise/ships/${cruiseLines[0].id}`, {
      statusCode: 200,
      body: [{ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Icon of the Seas', currentPort: 'Miami, Florida', cruiseLineId: cruiseLines[0].id }]
    }).as('seedShips')

    cy.intercept('GET', `/cruise/ship/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/sailings`, {
      statusCode: 200,
      body: [{
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        shipId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        departureDate: '2026-07-05',
        port: 'Miami, Florida',
        departurePort: 'Miami, Florida',
        arrivalPort: 'Miami, Florida',
        days: 3,
        isRepositioning: false
      }]
    }).as('seedSailings')

    cy.intercept('GET', `/cruise/sailings/cccccccc-cccc-cccc-cccc-cccccccccccc/itinerary`, {
      statusCode: 200,
      body: [
        { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', sailingId: 'cccccccc-cccc-cccc-cccc-cccccccccccc', day: 1, title: 'Embarkation Day', port: 'Miami, Florida', activitySchedule: [{ id: 'ffffffff-ffff-ffff-ffff-fffffffffff1', itineraryDayId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', time: '12:00 PM', activity: 'Guest boarding and welcome lunch' }] },
        { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', sailingId: 'cccccccc-cccc-cccc-cccc-cccccccccccc', day: 2, title: 'Day at Sea', port: 'At Sea', activitySchedule: [{ id: 'ffffffff-ffff-ffff-ffff-fffffffffff2', itineraryDayId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', time: '9:00 AM', activity: 'Morning fitness class' }] },
        { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', sailingId: 'cccccccc-cccc-cccc-cccc-cccccccccccc', day: 3, title: 'Return to Port', port: 'Miami, Florida', activitySchedule: [{ id: 'ffffffff-ffff-ffff-ffff-fffffffffff3', itineraryDayId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', time: '7:00 AM', activity: 'Farewell breakfast' }] }
      ]
    }).as('seedItinerary')

    cy.get(selectors.testPanel.seedIntegrityCheckButton).click()
    cy.wait('@seedCruiseLines')
    cy.wait('@seedShips')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'Seed Data Integrity Check Result')
      .and('contain.text', '"passed": true')
      .and('contain.text', '"cruiseLineCount"')
      .and('contain.text', '"shipCount"')
  })

  it('checks frontend rendering consistency against the loaded API data', () => {
    cy.get(selectors.testPanel.renderingConsistencyCheckButton).click()

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'Rendering Consistency Check Result')
      .and('contain.text', '"passed": true')
      .and('contain.text', `"apiRecordCount": ${cruiseLines.length}`)
      .and('contain.text', `"renderedCardCount": ${cruiseLines.length}`)
  })

  it('runs deployment diagnostics with runtime and health metadata', () => {
    cy.intercept('GET', '/health', {
      statusCode: 200,
      body: { status: 'ok' }
    }).as('deploymentHealth')

    cy.get(selectors.testPanel.deploymentDiagnosticsButton).click()
    cy.wait('@deploymentHealth')

    cy.get(selectors.testPanel.output)
      .should('contain.text', 'Deployment Diagnostics Result')
      .and('contain.text', '"passed": true')
      .and('contain.text', '"origin"')
      .and('contain.text', '"timestamp"')
      .and('contain.text', '"visibleCruiseLineCount"')
  })

  it('clears manual test output', () => {
    cy.intercept('GET', '/health', { statusCode: 200, body: { status: 'ok' } }).as('healthBeforeClear')

    cy.get(selectors.testPanel.healthCheckButton).click()
    cy.wait('@healthBeforeClear')
    cy.get(selectors.testPanel.output).should('contain.text', 'API Health Check Result')

    cy.get(selectors.testPanel.clearOutputButton).click()
    cy.get(selectors.testPanel.output).should('have.text', 'Test output will appear here...')
    cy.get(selectors.testPanel.statusText).should('contain.text', 'Ready for validation')
    cy.get(selectors.testPanel.lastRunLabel).should('contain.text', 'No manual run yet')
  })
})

describe('Cruise Explorer home page additional regression coverage', () => {
  const additionalCruiseLines = [
    {
      id: 'aaaaaaaa-0000-4000-8000-000000000001',
      name: 'Celebrity Cruises',
      country: 'United States',
      website: 'https://www.celebritycruises.com'
    },
    {
      id: 'aaaaaaaa-0000-4000-8000-000000000002',
      name: 'Princess Cruises',
      country: 'United States',
      website: ''
    }
  ]

  function visitAdditionalHome(body = additionalCruiseLines) {
    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body
    }).as('additionalGetCruiseLines')

    cy.visit('/')
    cy.wait('@additionalGetCruiseLines')
  }

  it('renders one view ships, update, and delete action for every cruise line card', () => {
    visitAdditionalHome()

    cy.get(selectors.cruiseLines.card).should('have.length', additionalCruiseLines.length)
    cy.get(selectors.cruiseLines.updateButton).should('have.length', additionalCruiseLines.length)
    cy.get(selectors.cruiseLines.viewShipsButton).should('have.length', additionalCruiseLines.length)
    cy.get(selectors.cruiseLines.deleteButton).should('have.length', additionalCruiseLines.length)
  })

  it('does not render a website link when the website field is an empty string', () => {
    visitAdditionalHome()

    cy.contains(selectors.cruiseLines.card, 'Princess Cruises').within(() => {
      cy.get(selectors.cruiseLines.websiteLink).should('not.exist')
    })
  })

  it('keeps the add cruise line hero link targeted to the create form', () => {
    visitAdditionalHome()

    cy.get(selectors.hero.addCruiseLineLink)
      .should('be.visible')
      .and('have.attr', 'href', '#add-cruise-line-heading')
      .and('contain.text', 'Add Cruise Line')
  })

  it('keeps the view cruise lines hero link targeted to the actual results area', () => {
    visitAdditionalHome()

    cy.get(selectors.hero.viewCruiseLinesLink)
      .should('be.visible')
      .and('have.attr', 'href', '#cruise-line-results')
      .and('contain.text', 'Explore Fleet')
  })

  it('renders an empty-state message when the API returns no cruise lines', () => {
    visitAdditionalHome([])

    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Showing 0 of 0 cruise lines.')
    cy.get(selectors.cruiseLines.emptyMessage)
      .should('be.visible')
      .and('contain.text', 'No cruise lines match your search.')
  })

  it('does not render stale cards after a failed reload from the SQA panel', () => {
    let requestCount = 0

    cy.intercept('GET', '/cruise', (req) => {
      requestCount += 1
      req.reply(
        requestCount === 1
          ? { statusCode: 200, body: additionalCruiseLines }
          : { statusCode: 500, body: { message: 'Reload failed' } }
      )
    }).as('additionalReloadCruiseLines')

    cy.visit('/')
    cy.wait('@additionalReloadCruiseLines')
    cy.get(selectors.cruiseLines.card).should('have.length', 2)

    cy.get(selectors.testPanel.reloadDataButton).click()
    cy.wait('@additionalReloadCruiseLines')

    cy.get(selectors.testPanel.output)
      .should('contain', 'Cruise Data Verification Result')
      .and('contain', '"passed": false')
      .and('contain', '"statusCode": 500')
      .and('contain', 'Reload failed')
  })
})
