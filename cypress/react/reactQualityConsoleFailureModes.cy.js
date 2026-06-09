const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { reactBookings, reactCruiseLines, reactCustomers, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React quality console failure-mode coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  function runSqaButton(testId, expectedTitle) {
    cy.getByTestId(testId).click()
    cy.getByTestId(rs.sqaOutput).should('contain.text', expectedTitle)
  }

  it('shows failed data verification when cruise-line payload is empty', () => {
    cy.intercept('GET', '/cruise', []).as('emptyCruiseData')
    runSqaButton(rs.sqaDataButton, 'Data Verification Result')
    cy.getByTestId(rs.sqaOutput).should('contain.text', '"passed": false')
    cy.getByTestId(rs.sqaStatus).should('contain.text', 'Validation needs attention')
  })

  it('shows failed API contract when customer contracts are malformed', () => {
    cy.intercept('GET', '/cruise/customers', [{ id: 'missing-email' }]).as('malformedCustomers')
    runSqaButton(rs.sqaContractButton, 'API Contract Check Result')
    cy.getByTestId(rs.sqaOutput).should('contain.text', '"customerContract": false')
  })

  it('shows UI smoke failure when health endpoint is unavailable', () => {
    cy.intercept('GET', '/health', { statusCode: 500, body: { message: 'health unavailable' } }).as('healthUnavailable')
    cy.getByTestId(rs.sqaUiSmokeButton).click()
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'UI Smoke Check Failed')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'health unavailable')
  })

  it('keeps CRUD workflow check read-only by validating fixture counts', () => {
    runSqaButton(rs.sqaCrudButton, 'Safe CRUD Workflow Result')
    cy.getByTestId(rs.sqaOutput)
      .should('contain.text', '"temporaryRecordCreated": false')
      .and('contain.text', '"cruiseLineCount": 3')
      .and('contain.text', '"customerCount": 3')
      .and('contain.text', '"bookingCount": 2')
  })

  it('reports performance smoke timing metadata', () => {
    runSqaButton(rs.sqaPerformanceButton, 'Performance Smoke Check Result')
    cy.getByTestId(rs.sqaOutput).should('contain.text', '"thresholdMs": 3000')
    cy.getByTestId(rs.sqaOutput).should('contain.text', '"durationMs"')
  })

  it('reports deployment diagnostics with current React root URL', () => {
    runSqaButton(rs.sqaDeploymentButton, 'Deployment Diagnostics Result')
    cy.getByTestId(rs.sqaOutput)
      .should('contain.text', '"url": "http://localhost:8000/')
      .and('contain.text', '"visibleCruiseLineCount": 3')
  })

  it('shows reset failure details when demo recovery API fails', () => {
    cy.intercept('POST', '/admin/reset-demo-data', {
      statusCode: 500,
      body: { message: 'reset unavailable' }
    }).as('resetUnavailable')
    cy.getByTestId(rs.sqaResetDemoDataButton).click()
    cy.getByTestId(rs.sqaResetConfirmationConfirm).click()
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Baseline Data Recovery Failed')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'reset unavailable')
  })

  it('recovers from a failed health run when the next health run passes', () => {
    cy.intercept('GET', '/health', { statusCode: 500, body: { message: 'temporary health failure' } }).as('failedHealth')
    cy.getByTestId(rs.sqaHealthButton).click()
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Health Check Failed')

    cy.intercept('GET', '/health', { status: 'ok', database: 'connected' }).as('passingHealth')
    cy.getByTestId(rs.sqaHealthButton).click()
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Health Check Result')
    cy.getByTestId(rs.sqaOutput).should('contain.text', '"passed": true')
  })

  it('keeps quality console usable after switching away from and back to admin', () => {
    cy.getByTestId(rs.roleTypeSelect).find('option').contains('Passenger').invoke('val').then(value => {
      cy.getByTestId(rs.roleTypeSelect).select(value)
    })
    cy.getByTestId(rs.sqaConsole).should('not.exist')

    cy.getByTestId(rs.roleTypeSelect).find('option').contains('Administrator').invoke('val').then(value => {
      cy.getByTestId(rs.roleTypeSelect).select(value)
    })
    cy.getByTestId(rs.sqaConsole).should('be.visible')
    runSqaButton(rs.sqaDataButton, 'Data Verification Result')
  })

  it('keeps quality console action labels portfolio-readable', () => {
    const expectedLabels = [
      'Check API Health',
      'Verify Cruise Data',
      'Run UI Smoke Check',
      'Check API Contract',
      'Run CRUD Workflow Check',
      'Run Performance Check',
      'Check Seed Integrity',
      'Check Rendering',
      'Run Deployment Check'
    ]
    expectedLabels.forEach(label => {
      cy.getByTestId(rs.sqaConsole).should('contain.text', label)
    })
  })
})
