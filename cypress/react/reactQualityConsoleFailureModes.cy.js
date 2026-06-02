const { reactBookings, reactCruiseLines, reactCustomers, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React SQA console failure-mode parity expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  function runSqaButton(testId, expectedTitle) {
    cy.getByTestId(testId).click()
    cy.getByTestId('react-sqa-output').should('contain.text', expectedTitle)
  }

  it('shows failed data verification when cruise-line payload is empty', () => {
    cy.intercept('GET', '/cruise', []).as('emptyCruiseData')
    runSqaButton('react-sqa-data-button', 'Data Verification Result')
    cy.getByTestId('react-sqa-output').should('contain.text', '"passed": false')
    cy.getByTestId('react-sqa-status').should('contain.text', 'Validation needs attention')
  })

  it('shows failed API contract when customer contracts are malformed', () => {
    cy.intercept('GET', '/cruise/customers', [{ id: 'missing-email' }]).as('malformedCustomers')
    runSqaButton('react-sqa-contract-button', 'API Contract Check Result')
    cy.getByTestId('react-sqa-output').should('contain.text', '"customerContract": false')
  })

  it('shows UI smoke failure when health endpoint is unavailable', () => {
    cy.intercept('GET', '/health', { statusCode: 500, body: { message: 'health unavailable' } }).as('healthUnavailable')
    cy.getByTestId('react-sqa-ui-smoke-button').click()
    cy.getByTestId('react-sqa-output').should('contain.text', 'UI Smoke Check Failed')
    cy.getByTestId('react-sqa-output').should('contain.text', 'health unavailable')
  })

  it('keeps CRUD workflow check read-only by validating fixture counts', () => {
    runSqaButton('react-sqa-crud-button', 'Safe CRUD Workflow Result')
    cy.getByTestId('react-sqa-output')
      .should('contain.text', '"temporaryRecordCreated": false')
      .and('contain.text', '"cruiseLineCount": 3')
      .and('contain.text', '"customerCount": 3')
      .and('contain.text', '"bookingCount": 2')
  })

  it('reports performance smoke timing metadata', () => {
    runSqaButton('react-sqa-performance-button', 'Performance Smoke Check Result')
    cy.getByTestId('react-sqa-output').should('contain.text', '"thresholdMs": 3000')
    cy.getByTestId('react-sqa-output').should('contain.text', '"durationMs"')
  })

  it('reports deployment diagnostics with current React root URL', () => {
    runSqaButton('react-sqa-deployment-button', 'Deployment Diagnostics Result')
    cy.getByTestId('react-sqa-output')
      .should('contain.text', '"url": "http://localhost:8000/')
      .and('contain.text', '"visibleCruiseLineCount": 3')
  })

  it('shows reset failure details when demo recovery API fails', () => {
    cy.intercept('POST', '/admin/reset-demo-data', {
      statusCode: 500,
      body: { message: 'reset unavailable' }
    }).as('resetUnavailable')
    cy.getByTestId('react-sqa-reset-demo-data-button').click()
    cy.getByTestId('react-sqa-reset-confirmation-confirm').click()
    cy.getByTestId('react-sqa-output').should('contain.text', 'Demo Data Recovery Failed')
    cy.getByTestId('react-sqa-output').should('contain.text', 'reset unavailable')
  })

  it('recovers from a failed health run when the next health run passes', () => {
    cy.intercept('GET', '/health', { statusCode: 500, body: { message: 'temporary health failure' } }).as('failedHealth')
    cy.getByTestId('react-sqa-health-button').click()
    cy.getByTestId('react-sqa-output').should('contain.text', 'Health Check Failed')

    cy.intercept('GET', '/health', { status: 'ok', database: 'connected' }).as('passingHealth')
    cy.getByTestId('react-sqa-health-button').click()
    cy.getByTestId('react-sqa-output').should('contain.text', 'Health Check Result')
    cy.getByTestId('react-sqa-output').should('contain.text', '"passed": true')
  })

  it('keeps SQA console usable after switching away from and back to admin', () => {
    cy.getByTestId('react-demo-user-select').find('option').contains('Passenger').invoke('val').then(value => {
      cy.getByTestId('react-demo-user-select').select(value)
    })
    cy.getByTestId('react-sqa-console').should('not.exist')

    cy.getByTestId('react-demo-user-select').find('option').contains('Admin').invoke('val').then(value => {
      cy.getByTestId('react-demo-user-select').select(value)
    })
    cy.getByTestId('react-sqa-console').should('be.visible')
    runSqaButton('react-sqa-data-button', 'Data Verification Result')
  })

  it('keeps SQA console action labels portfolio-readable', () => {
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
      cy.getByTestId('react-sqa-console').should('contain.text', label)
    })
  })
})
