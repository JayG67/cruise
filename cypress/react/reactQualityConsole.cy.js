const { reactBookings, reactCruiseLines, reactCustomers, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React SQA console coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('renders every React SQA validation action and report link', () => {
    cy.getByTestId('react-sqa-console').should('be.visible').and('contain.text', 'SQA Test Control Panel')
    ;[
      'react-sqa-health-button',
      'react-sqa-data-button',
      'react-sqa-ui-smoke-button',
      'react-sqa-contract-button',
      'react-sqa-crud-button',
      'react-sqa-performance-button',
      'react-sqa-seed-button',
      'react-sqa-rendering-button',
      'react-sqa-deployment-button',
      'react-sqa-reset-demo-data-button'
    ].forEach(testId => cy.getByTestId(testId).should('be.visible'))
    cy.getByTestId('react-sqa-console').within(() => {
      cy.contains('View Quality Dashboard').should('have.attr', 'href', '/quality-dashboard.html')
      cy.contains('View Latest Lighthouse Mobile Report').should('be.visible')
      cy.contains('View Latest Jest Coverage Report').should('be.visible')
    })
  })

  it('runs the React API health validation and writes structured output', () => {
    cy.intercept('GET', '/health', { status: 'ok', database: 'connected' }).as('reactHealthCheck')
    cy.getByTestId('react-sqa-health-button').click()
    cy.wait('@reactHealthCheck')
    cy.getByTestId('react-sqa-output').should('contain.text', 'Health Check Result').and('contain.text', '"passed": true')
    cy.getByTestId('react-sqa-output').should('contain.text', 'Health Check Result').and('contain.text', '"status": "ok"')
  })

  it('reports failed health validation without crashing the console', () => {
    cy.intercept('GET', '/health', { statusCode: 500, body: { message: 'React health failure' } }).as('reactHealthFailure')
    cy.getByTestId('react-sqa-health-button').click()
    cy.wait('@reactHealthFailure')
    cy.getByTestId('react-sqa-output').should('contain.text', 'Health Check Failed').and('contain.text', 'React health failure')
    cy.getByTestId('react-sqa-status').should('contain.text', 'Validation needs attention')
  })

  it('runs data and API contract validations using React fixtures', () => {
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reactDataCruiseLines')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('reactDataCustomers')
    cy.getByTestId('react-sqa-data-button').click()
    cy.wait('@reactDataCruiseLines')
    cy.getByTestId('react-sqa-output').should('contain.text', 'Data Verification Result')

    cy.getByTestId('react-sqa-contract-button').click()
    cy.wait('@reactDataCruiseLines')
    cy.wait('@reactDataCustomers')
    cy.getByTestId('react-sqa-output').should('contain.text', 'API Contract Check Result')
  })

  it('runs UI smoke and safe CRUD validations without mutating data', () => {
    cy.intercept('GET', '/health', { status: 'ok' }).as('reactSmokeHealth')
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reactSmokeLines')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('reactSmokeCustomers')
    cy.intercept('GET', '/cruise/bookings', reactBookings).as('reactSmokeBookings')

    cy.getByTestId('react-sqa-ui-smoke-button').click()
    cy.wait('@reactSmokeHealth')
    cy.wait('@reactSmokeLines')
    cy.wait('@reactSmokeCustomers')
    cy.wait('@reactSmokeBookings')
    cy.getByTestId('react-sqa-output').should('contain.text', 'UI Smoke Check Result')

    cy.getByTestId('react-sqa-crud-button').click()
    cy.wait('@reactSmokeLines')
    cy.wait('@reactSmokeCustomers')
    cy.wait('@reactSmokeBookings')
    cy.getByTestId('react-sqa-output').should('contain.text', 'Safe CRUD Workflow Result').and('contain.text', 'temporaryRecordCreated')
  })

  it('runs performance, seed, rendering, and deployment diagnostics', () => {
    cy.intercept('GET', '/health', { status: 'ok', uptime: 100 }).as('reactDiagnosticHealth')
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reactDiagnosticLines')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('reactDiagnosticCustomers')
    cy.intercept('GET', '/cruise/bookings', reactBookings).as('reactDiagnosticBookings')

    cy.getByTestId('react-sqa-performance-button').click()
    cy.wait('@reactDiagnosticHealth')
    cy.wait('@reactDiagnosticLines')
    cy.wait('@reactDiagnosticCustomers')
    cy.getByTestId('react-sqa-output').should('contain.text', 'Performance Smoke Check Result')

    cy.getByTestId('react-sqa-rendering-button').click()
    cy.wait('@reactDiagnosticLines')
    cy.getByTestId('react-sqa-output').should('contain.text', 'Rendering Consistency Result')

    cy.getByTestId('react-sqa-deployment-button').click()
    cy.wait('@reactDiagnosticHealth')
    cy.getByTestId('react-sqa-output').should('contain.text', 'Deployment Diagnostics Result')
  })

  it('surfaces seed integrity failures when the fixture is too small', () => {
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reactSmallSeedLines')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('reactSmallSeedCustomers')
    cy.intercept('GET', '/cruise/bookings', reactBookings).as('reactSmallSeedBookings')
    cy.getByTestId('react-sqa-seed-button').click()
    cy.wait('@reactSmallSeedLines')
    cy.wait('@reactSmallSeedCustomers')
    cy.wait('@reactSmallSeedBookings')
    cy.getByTestId('react-sqa-output').should('contain.text', 'Seed Integrity Check Result').and('contain.text', '"passed": false')
  })

  it('shows and cancels native React reset confirmation', () => {
    cy.getByTestId('react-sqa-reset-demo-data-button').click()
    cy.getByTestId('react-sqa-reset-confirmation').should('contain.text', 'Reset public demo data')
    cy.getByTestId('react-sqa-reset-confirmation-cancel').click()
    cy.getByTestId('react-sqa-reset-confirmation').should('not.exist')
    cy.getByTestId('react-sqa-output').should('contain.text', 'Test output will appear here')
  })

  it('runs reset demo data after confirmation and refreshes React data', () => {
    cy.intercept('POST', '/admin/reset-demo-data', { reset: true, restored: true }).as('reactResetDemoData')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('reloadCustomersAfterReset')
    cy.intercept('GET', '/cruise/bookings', reactBookings).as('reloadBookingsAfterReset')
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reloadLinesAfterReset')
    cy.getByTestId('react-sqa-reset-demo-data-button').click()
    cy.getByTestId('react-sqa-reset-confirmation-confirm').click()
    cy.wait('@reactResetDemoData')
    cy.getByTestId('react-sqa-output').should('contain.text', 'Demo Data Recovery Result')
  })
})
