const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { visitReactAppAsTurnaroundManager } = require('./support/reactTestHelpers.js')

const operationId = 'turnaround-react-1'
const briefingId = 'briefing-react-1'
const generatedBriefing = {
  briefing: {
    summary: 'A staffing gap and an uncleared dependency require immediate attention.',
    riskLevel: 'high',
    findings: [{
      category: 'staffing',
      severity: 'high',
      title: 'Housekeeping coverage gap',
      explanation: 'Two required positions are not checked in.',
      evidenceIds: ['staffing:housekeeping'],
      recommendedAction: 'Confirm relief coverage before cabin release.'
    }],
    unknowns: ['Relief arrival time requires confirmation.'],
    generatedAt: '2026-07-27T12:00:00.000Z',
    model: 'deterministic-rule-engine-v1',
    promptVersion: 'turnaround-briefing-v1.0.0'
  },
  audit: {
    briefingId,
    requestId: briefingId,
    operationId,
    provider: 'deterministic',
    model: 'deterministic-rule-engine-v1',
    promptVersion: 'turnaround-briefing-v1.0.0',
    evidenceCount: 8,
    generatedAt: '2026-07-27T12:00:00.000Z'
  },
  operation: { id: operationId },
  evidenceSummary: { totalAvailable: 10, included: 8, truncated: false }
}

describe('AI turnaround briefing workflow', () => {
  beforeEach(() => {
    cy.intercept('GET', '/ai/turnaround-operations/*/briefings*', { operationId, count: 0, briefings: [] }).as('aiBriefingHistory')
    cy.intercept('POST', '/ai/turnaround-operations/*/briefing', generatedBriefing).as('generateAiBriefing')
    cy.intercept('POST', '/ai/turnaround-operations/*/briefings/*/review', req => {
      req.reply({
        briefingId,
        disposition: req.body.disposition,
        notes: req.body.notes || null,
        reviewedAt: '2026-07-27T12:05:00.000Z'
      })
    }).as('reviewAiBriefing')

    visitReactAppAsTurnaroundManager()
    cy.getByTestId(rs.operationsWorkspaceAiBriefingButton).click()
    cy.wait('@aiBriefingHistory')
  })

  it('generates, displays, and reviews an evidence-grounded briefing', () => {
    cy.getByTestId(rs.aiBriefingWorkspace).should('be.visible')
    cy.getByTestId(rs.aiBriefingQuestion).clear().type('What could delay departure?')
    cy.getByTestId(rs.aiBriefingGenerate).click()
    cy.wait('@generateAiBriefing').its('request.body').should('deep.equal', { question: 'What could delay departure?' })

    cy.getByTestId(rs.aiBriefingResult)
      .should('contain.text', 'high operational risk')
      .and('contain.text', 'Housekeeping coverage gap')
      .and('contain.text', 'staffing:housekeeping')

    cy.getByTestId(rs.aiBriefingHistoryItem).should('have.length', 1)
    cy.getByTestId(rs.aiBriefingReviewDisposition).select('NEEDS_REVISION')
    cy.getByTestId(rs.aiBriefingReviewNotes).type('Confirm the relief arrival time.')
    cy.getByTestId(rs.aiBriefingSaveReview).click()
    cy.wait('@reviewAiBriefing').its('request.body').should('deep.equal', {
      disposition: 'NEEDS_REVISION',
      notes: 'Confirm the relief arrival time.'
    })
    cy.getByTestId(rs.aiBriefingWorkspace).should('contain.text', 'Human review saved successfully.')
  })

  it('surfaces provider-disabled failures without losing the workspace', () => {
    cy.intercept('POST', '/ai/turnaround-operations/*/briefing', {
      statusCode: 503,
      body: { error: 'AI generation is disabled. Configure a provider to generate briefings.' }
    }).as('disabledAiBriefing')

    cy.getByTestId(rs.aiBriefingGenerate).click()
    cy.wait('@disabledAiBriefing')
    cy.getByTestId(rs.aiBriefingWorkspace)
      .should('be.visible')
      .and('contain.text', 'AI generation is disabled')
  })
})
