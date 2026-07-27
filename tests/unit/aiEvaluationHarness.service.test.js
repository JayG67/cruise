const { TURNAROUND_BRIEFING_EVALUATION_CASES } = require('../../ai/evaluations/cases/turnaroundBriefing.cases')
const { runEvaluationSuite } = require('../../services/aiEvaluationHarness.service')

describe('AI evaluation harness', () => {
  it('runs reusable cases and returns aggregate regression metadata', () => {
    const suite = runEvaluationSuite({
      cases: TURNAROUND_BRIEFING_EVALUATION_CASES.slice(0, 1),
      generateCandidate: () => ({
        summary: 'Immediate operational attention is required.',
        riskLevel: 'high',
        findings: [
          { category: 'staffing', evidenceIds: ['staffing:housekeeping'], recommendedAction: 'Confirm coverage.' },
          { category: 'dependency', evidenceIds: ['dependency:gangway-clearance'], recommendedAction: 'Clear the dependency.' }
        ],
        unknowns: []
      })
    })

    expect(suite.runId).toMatch(/^[a-f0-9]{16}$/)
    expect(suite).toEqual(expect.objectContaining({ caseCount: 1, passedCases: 1, failedCases: 0, passRate: 100, averageScore: 100, passed: true }))
  })

  it('rejects empty suites and missing candidate generators', () => {
    expect(() => runEvaluationSuite({ cases: [], generateCandidate: () => ({}) })).toThrow('at least one case')
    expect(() => runEvaluationSuite({ cases: TURNAROUND_BRIEFING_EVALUATION_CASES })).toThrow('generateCandidate')
  })
})
