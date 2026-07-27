const { buildAiEvaluationQualitySummary, summarizeRun } = require('../../services/aiEvaluationQualitySummary.service')

describe('AI evaluation quality summary', () => {
  it('normalizes evaluation runs for the Quality Console', () => {
    expect(summarizeRun({ runId: 'run-1', suiteId: 'suite', passRate: 100, averageScore: 95, passed: true, results: [{ evaluationCaseId: 'case-1', passed: true }] })).toEqual(expect.objectContaining({
      runId: 'run-1', passRate: 100, averageScore: 95, passed: true, caseCount: 1, failedCaseIds: []
    }))
  })

  it('builds release readiness from persisted evaluation history', async () => {
    const result = await buildAiEvaluationQualitySummary({
      runLister: jest.fn().mockResolvedValue({ runs: [
        { runId: 'latest', suiteId: 'suite', passRate: 75, averageScore: 82, passed: false, results: [{ evaluationCaseId: 'case-2', passed: false }] },
        { runId: 'baseline', suiteId: 'suite', passRate: 100, averageScore: 94, passed: true, results: [] }
      ] })
    })
    expect(result).toEqual(expect.objectContaining({ runCount: 2, passingRuns: 1, failingRuns: 1, releaseReadiness: 'BLOCKED' }))
    expect(result.latestRun.failedCaseIds).toEqual(['case-2'])
  })
})
