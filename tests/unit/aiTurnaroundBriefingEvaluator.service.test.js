const { TURNAROUND_BRIEFING_EVALUATION_CASES } = require('../../ai/evaluations/cases/turnaroundBriefing.cases')
const { evaluateTurnaroundBriefing } = require('../../services/aiTurnaroundBriefingEvaluator.service')

describe('AI turnaround briefing evaluator', () => {
  it('passes a grounded, prioritized, actionable briefing', () => {
    const result = evaluateTurnaroundBriefing(TURNAROUND_BRIEFING_EVALUATION_CASES[0], {
      summary: 'Two departure blockers require immediate action.',
      riskLevel: 'high',
      findings: [
        { category: 'staffing', evidenceIds: ['staffing:housekeeping'], recommendedAction: 'Confirm relief coverage.' },
        { category: 'dependency', evidenceIds: ['dependency:gangway-clearance'], recommendedAction: 'Clear the gangway hold.' }
      ],
      unknowns: []
    })

    expect(result.passed).toBe(true)
    expect(result.score).toBe(100)
    expect(result.diagnostics.unsupportedEvidence).toEqual([])
  })

  it('reports missing and unsupported evidence without hiding diagnostics', () => {
    const result = evaluateTurnaroundBriefing(TURNAROUND_BRIEFING_EVALUATION_CASES[0], {
      summary: 'Departure may be delayed.',
      riskLevel: 'medium',
      findings: [{ category: 'staffing', evidenceIds: ['invented:evidence'], recommendedAction: '' }],
      unknowns: []
    })

    expect(result.passed).toBe(false)
    expect(result.diagnostics.missingRequiredEvidence).toHaveLength(2)
    expect(result.diagnostics.unsupportedEvidence).toEqual(['invented:evidence'])
    expect(result.diagnostics.missingFindingCategories).toEqual(['dependency'])
  })
})
