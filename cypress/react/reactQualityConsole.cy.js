const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { reactBookings, reactCruiseLines, reactCustomers, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React quality console coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })


  it('shows the Phase 5 adversarial resilience release gate', () => {
    cy.intercept('GET', '/ai/adversarial/quality-summary', {
      phase: 5,
      status: 'READY',
      totalSuites: 3,
      totalScenarios: 31,
      passedScenarios: 31,
      failedScenarios: 0,
      resilienceScore: 100,
      releaseDecision: 'APPROVED',
      suites: [
        { id: 'operational-evidence', name: 'Operational evidence attacks', resilienceScore: 100, releaseDecision: 'APPROVED' },
        { id: 'prompt-instruction', name: 'Prompt and instruction attacks', resilienceScore: 100, releaseDecision: 'APPROVED' },
        { id: 'provider-runtime', name: 'Provider and runtime resilience', resilienceScore: 100, releaseDecision: 'APPROVED' }
      ]
    }).as('adversarialQualitySummary')
    cy.reload()
    cy.wait('@adversarialQualitySummary')
    cy.getByTestId(rs.aiAdversarialSummaryPanel)
      .should('be.visible')
      .and('contain.text', 'Phase 5 safety and resilience gate')
      .and('contain.text', 'APPROVED')
      .and('contain.text', '31 of 31 scenarios passed')
      .and('contain.text', '100% across 3 suites')
    cy.getByTestId(rs.aiAdversarialSuiteList)
      .should('contain.text', 'Operational evidence attacks')
      .and('contain.text', 'Prompt and instruction attacks')
      .and('contain.text', 'Provider and runtime resilience')
  })

  it('renders every React SQA validation action and report link', () => {
    cy.getByTestId(rs.sqaConsole).should('be.visible').and('contain.text', 'Quality Validation Console')
    ;[
      rs.sqaHealthButton,
      rs.sqaGoLiveButton,
      rs.sqaDataButton,
      rs.sqaUiSmokeButton,
      rs.sqaContractButton,
      rs.sqaCrudButton,
      rs.sqaPerformanceButton,
      rs.sqaSeedButton,
      rs.sqaRenderingButton,
      rs.sqaDeploymentButton,
      rs.sqaResetDemoDataButton
    ].forEach(selectorKey => cy.getByTestId(selectorKey).should('be.visible'))
    cy.getByTestId(rs.goLiveReadinessPanel).should('be.visible').and('contain.text', 'Manual approval checklist')
    cy.getByTestId(rs.sqaConsole).within(() => {
      cy.contains('View Quality Dashboard').should('have.attr', 'href', 'https://jayg67.github.io/cruise/').and('have.attr', 'target', '_blank')
      cy.contains('View Latest Lighthouse Mobile Report').should('have.attr', 'href', 'https://jayg67.github.io/cruise/lighthouse/').and('have.attr', 'target', '_blank')
      cy.contains('View Latest Jest Coverage Report').should('have.attr', 'href', 'https://jayg67.github.io/cruise/coverage/').and('have.attr', 'target', '_blank')
    })
  })



  it('keeps the go-live checklist neutral before validation runs', () => {
    cy.getByTestId(rs.goLiveReadinessPanel)
      .should('be.visible')
      .and('contain.text', 'Not checked yet')
      .and('not.contain.text', 'Application API needs review')
      .and('not.contain.text', '0 cruise lines available')
      .and('not.contain.text', '0 customers and 0 bookings available')
      .and('not.contain.text', '0 turnaround operations available')
  })

  it('runs the React API health validation and writes structured output', () => {
    cy.intercept('GET', '/health', { status: 'ok', database: 'connected' }).as('reactHealthCheck')
    cy.getByTestId(rs.sqaHealthButton).click()
    cy.wait('@reactHealthCheck')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Health Check Result').and('contain.text', '"passed": true')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Health Check Result').and('contain.text', '"status": "ok"')
  })

  it('reports failed health validation without crashing the console', () => {
    cy.intercept('GET', '/health', { statusCode: 500, body: { message: 'React health failure' } }).as('reactHealthFailure')
    cy.getByTestId(rs.sqaHealthButton).click()
    cy.wait('@reactHealthFailure')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Health Check Failed').and('contain.text', 'React health failure')
    cy.getByTestId(rs.sqaStatus).should('contain.text', 'Validation needs attention')
  })

  it('runs data and API contract validations using React fixtures', () => {
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reactDataCruiseLines')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('reactDataCustomers')
    cy.getByTestId(rs.sqaDataButton).click()
    cy.wait('@reactDataCruiseLines')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Data Verification Result')

    cy.getByTestId(rs.sqaContractButton).click()
    cy.wait('@reactDataCruiseLines')
    cy.wait('@reactDataCustomers')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'API Contract Check Result')
  })

  it('runs UI smoke and safe CRUD validations without mutating data', () => {
    cy.intercept('GET', '/health', { status: 'ok' }).as('reactSmokeHealth')
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reactSmokeLines')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('reactSmokeCustomers')
    cy.intercept('GET', '/cruise/bookings', reactBookings).as('reactSmokeBookings')

    cy.getByTestId(rs.sqaUiSmokeButton).click()
    cy.wait('@reactSmokeHealth')
    cy.wait('@reactSmokeLines')
    cy.wait('@reactSmokeCustomers')
    cy.wait('@reactSmokeBookings')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'UI Smoke Check Result')

    cy.getByTestId(rs.sqaCrudButton).click()
    cy.wait('@reactSmokeLines')
    cy.wait('@reactSmokeCustomers')
    cy.wait('@reactSmokeBookings')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Safe CRUD Workflow Result').and('contain.text', 'temporaryRecordCreated')
  })

  it('runs performance, seed, rendering, and deployment diagnostics', () => {
    cy.intercept('GET', '/health', { status: 'ok', uptime: 100 }).as('reactDiagnosticHealth')
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reactDiagnosticLines')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('reactDiagnosticCustomers')
    cy.intercept('GET', '/cruise/bookings', reactBookings).as('reactDiagnosticBookings')

    cy.getByTestId(rs.sqaPerformanceButton).click()
    cy.wait('@reactDiagnosticHealth')
    cy.wait('@reactDiagnosticLines')
    cy.wait('@reactDiagnosticCustomers')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Performance Smoke Check Result')

    cy.getByTestId(rs.sqaRenderingButton).click()
    cy.wait('@reactDiagnosticLines')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Rendering Consistency Result')

    cy.getByTestId(rs.sqaDeploymentButton).click()
    cy.wait('@reactDiagnosticHealth')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Deployment Diagnostics Result')
  })

  it('runs a go-live readiness review with operational data and manual approval guidance', () => {
    cy.intercept('GET', '/health', { status: 'ok', uptime: 100 }).as('reactGoLiveHealth')
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reactGoLiveLines')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('reactGoLiveCustomers')
    cy.intercept('GET', '/cruise/bookings', reactBookings).as('reactGoLiveBookings')
    cy.intercept('GET', '/cruise/turnaround-operations', [{ id: 'turnaround-1', title: 'Adventure turnaround' }]).as('reactGoLiveTurnaround')

    cy.getByTestId(rs.sqaGoLiveButton).click()
    cy.wait('@reactGoLiveHealth')
    cy.wait('@reactGoLiveLines')
    cy.wait('@reactGoLiveCustomers')
    cy.wait('@reactGoLiveBookings')
    cy.wait('@reactGoLiveTurnaround')

    cy.getByTestId(rs.sqaOutput)
      .should('contain.text', 'Go-Live Readiness Review Result')
      .and('contain.text', 'recommendedManualPath')
      .and('contain.text', 'manualReviewRequired')
    cy.getByTestId(rs.goLiveReadinessPanel)
      .should('contain.text', 'Application API is responding')
      .and('contain.text', 'turnaround operations available')
  })


  it('surfaces seed integrity failures when the fixture is too small', () => {
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reactSmallSeedLines')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('reactSmallSeedCustomers')
    cy.intercept('GET', '/cruise/bookings', reactBookings).as('reactSmallSeedBookings')
    cy.getByTestId(rs.sqaSeedButton).click()
    cy.wait('@reactSmallSeedLines')
    cy.wait('@reactSmallSeedCustomers')
    cy.wait('@reactSmallSeedBookings')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Seed Integrity Check Result').and('contain.text', '"passed": false')
  })

  it('shows and cancels native React reset confirmation', () => {
    cy.getByTestId(rs.sqaResetDemoDataButton).click()
    cy.getByTestId(rs.sqaResetConfirmation).should('contain.text', 'Reset baseline data')
    cy.getByTestId(rs.sqaResetConfirmationCancel).click()
    cy.getByTestId(rs.sqaResetConfirmation).should('not.exist')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Test output will appear here')
  })

  it('runs reset demo data after confirmation and refreshes React data', () => {
    cy.intercept('POST', '/admin/reset-demo-data', { reset: true, restored: true }).as('reactResetDemoData')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('reloadCustomersAfterReset')
    cy.intercept('GET', '/cruise/bookings', reactBookings).as('reloadBookingsAfterReset')
    cy.intercept('GET', '/cruise', reactCruiseLines).as('reloadLinesAfterReset')
    cy.getByTestId(rs.sqaResetDemoDataButton).click()
    cy.getByTestId(rs.sqaResetConfirmationConfirm).click()
    cy.wait('@reactResetDemoData')
    cy.getByTestId(rs.sqaOutput).should('contain.text', 'Baseline Data Recovery Result')
  })
})
