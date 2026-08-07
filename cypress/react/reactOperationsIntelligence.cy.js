const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { reactTurnaroundOperations, selectDemoUserByVisibleRole, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('Operations intelligence end-to-end workflow', () => {
  beforeEach(() => {
    visitReactAppAsAdmin({}, () => {
      cy.intercept(
        { method: 'GET', url: /\/cruise\/turnaround-operations(?:\?.*)?$/ },
        { statusCode: 200, body: reactTurnaroundOperations, headers: { 'cache-control': 'no-store' } }
      ).as('operationsIntelligenceFixture')
    })
    cy.wait('@operationsIntelligenceFixture')
    cy.getByTestId(rs.operationsIntelligenceCenter).scrollIntoView().should('be.visible')
    cy.getByTestId(rs.operationsIntelligenceSelect)
      .find('option')
      .should('contain.text', 'Miami same-day turnaround readiness')
    cy.getByTestId(rs.operationsIntelligenceSelect)
      .select('Miami same-day turnaround readiness · 2026-12-12')
    cy.getByTestId(rs.operationsIntelligenceDetail).should('contain.text', 'React Icon')
  })

  it('shows actionable turnaround risks instead of engineering release controls', () => {
    cy.getByTestId(rs.operationsIntelligenceCenter)
      .should('contain.text', 'Prioritize the turnarounds that need action')
      .and('contain.text', 'staffing gaps')
      .and('contain.text', 'readiness approvals')
      .and('not.contain.text', 'Release policy controls')
      .and('not.contain.text', 'Baseline comparison')
      .and('not.contain.text', 'AI evaluation quality')

    cy.getByTestId(rs.operationsIntelligenceDetail)
      .should('contain.text', 'React Icon')
      .and('contain.text', '11 staffing positions unfilled')
      .and('contain.text', '1 open escalation')
      .and('contain.text', '2 readiness signoffs pending')

    cy.getByTestId(rs.operationsIntelligenceRisk).should('contain.text', 'Watch closely')
    cy.getByTestId(rs.operationsIntelligenceMetricTasks).should('contain.text', '4')
    cy.getByTestId(rs.operationsIntelligenceMetricStaffing).should('contain.text', '11')
  })

  it('updates the complete operational picture when another turnaround is selected', () => {
    cy.getByTestId(rs.operationsIntelligenceSelect)
      .find('option')
      .should('have.length', reactTurnaroundOperations.length)
      .and('contain.text', 'San Juan repositioning turnaround readiness')

    cy.getByTestId(rs.operationsIntelligenceSelect)
      .select('San Juan repositioning turnaround readiness · 2027-01-18')

    cy.getByTestId(rs.operationsIntelligenceDetail)
      .should('contain.text', 'React Utopia')
      .and('contain.text', '2027-01-18')
      .and('contain.text', '11 staffing positions unfilled')
      .and('contain.text', '2 readiness signoffs pending')
      .and('not.contain.text', 'Terminal luggage hall capacity watch')

    cy.getByTestId(rs.operationsIntelligenceMetricEscalations).should('contain.text', '0')
  })

  it('refreshes the live operation data and visibly renders the returned changes', () => {
    const refreshed = reactTurnaroundOperations.map((operation, index) => index === 0
      ? {
          ...operation,
          staffingSummary: { ...operation.staffingSummary, checkedInCount: 114, gapCount: 0 },
          escalationSummary: { ...operation.escalationSummary, openEscalations: 0, totalEscalations: 0 },
          escalations: [],
          signoffSummary: { ...operation.signoffSummary, approvedSignoffs: 3, pendingSignoffs: 0, approvalPercent: 100 },
          taskSummary: { ...operation.taskSummary, completeTasks: 4, completionPercent: 100 },
          dependencySummary: { ...operation.dependencySummary, activeDependencies: 0 },
          handoffSummary: { ...operation.handoffSummary, openHandoffs: 0 }
        }
      : operation)

    cy.intercept({ method: 'GET', pathname: '/cruise/turnaround-operations' }, refreshed).as('refreshOperationsIntelligence')
    cy.getByTestId(rs.operationsIntelligenceRefreshButton).click()
    cy.wait('@refreshOperationsIntelligence')

    cy.getByTestId(rs.operationsIntelligenceDetail)
      .should('contain.text', 'No immediate operational exceptions')
      .and('contain.text', 'Continue monitoring task completion')
    cy.getByTestId(rs.operationsIntelligenceRisk).should('contain.text', 'On track')
    cy.getByTestId(rs.operationsIntelligenceMetricStaffing).should('contain.text', '0')
  })

  it('continues from intelligence to team setup and the full operational role workflow', () => {
    cy.getByTestId(rs.operationsIntelligenceSetupButton).click()
    cy.getByTestId(rs.turnaroundAdminSetup).should('be.visible')

    cy.getByTestId(rs.operationsIntelligenceRoleButton).click()
    cy.getByTestId(rs.roleSelector).should('be.visible')
    selectDemoUserByVisibleRole('Turnaround Manager', 'Alex Turner')
    cy.getByTestId(rs.turnaroundManagerDashboard).should('be.visible')
    cy.getByTestId(rs.operationalTurnaroundPanel).should('be.visible')
    cy.getByTestId(rs.operationsWorkspaceAiBriefingButton).click()
    cy.getByTestId(rs.aiBriefingWorkspace).should('be.visible')
  })
})
