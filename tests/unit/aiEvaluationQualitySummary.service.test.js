const { buildAiEvaluationQualitySummary, buildFailureSummary, buildTrend, summarizeFailedCase, summarizeRun } = require('../../services/aiEvaluationQualitySummary.service')

describe('AI evaluation quality summary', () => {
  it('normalizes evaluation runs for the Quality Console', () => {
    expect(summarizeRun({ runId: 'run-1', suiteId: 'suite', passRate: 100, averageScore: 95, passed: true, results: [{ evaluationCaseId: 'case-1', passed: true }] })).toEqual(expect.objectContaining({
      runId: 'run-1', passRate: 100, averageScore: 95, passed: true, caseCount: 1, failedCaseIds: []
    }))
  })

  it('builds release readiness from persisted evaluation history', async () => {
    const result = await buildAiEvaluationQualitySummary({
      runLister: jest.fn().mockResolvedValue({ runs: [
        { runId: 'latest', suiteId: 'suite', passRate: 75, averageScore: 82, passed: false, results: [{ evaluationCaseId: 'case-2', evaluationCaseName: 'Evidence regression', passed: false, score: 62, passThreshold: 80, dimensions: [{ dimension: 'evidenceGrounding', score: 0.5 }], diagnostics: { missingRequiredEvidence: ['evidence-1'], unsupportedEvidence: [], missingFindingCategories: ['safety'], actionableFindingCount: 1 } }] },
        { runId: 'baseline', suiteId: 'suite', passRate: 100, averageScore: 94, passed: true, results: [] }
      ] })
    })
    expect(result).toEqual(expect.objectContaining({ runCount: 2, passingRuns: 1, failingRuns: 1, releaseReadiness: 'BLOCKED' }))
    expect(result.latestRun.failedCaseIds).toEqual(['case-2'])
    expect(result.latestRun.failedCases[0]).toEqual(expect.objectContaining({ evaluationCaseName: 'Evidence regression', score: 62 }))
    expect(result.latestRun.failedCases[0].weakestDimensions).toEqual([{ dimension: 'evidenceGrounding', score: 0.5 }])
    expect(result.failureSummary).toEqual([{ evaluationCaseId: 'case-2', evaluationCaseName: 'Evidence regression', failureCount: 1, latestScore: 62 }])
    expect(result.trend).toEqual(expect.objectContaining({ direction: 'REGRESSING', passRateDelta: -25, averageScoreDelta: -12 }))
  })

  it('normalizes detailed failed-case diagnostics and recurring failure counts', () => {
    const failed = summarizeFailedCase({ evaluationCaseId: 'case-1', passed: false, score: 70, dimensions: [{ dimension: 'schemaCompliance', score: 1 }, { dimension: 'actionability', score: 0.5 }], diagnostics: {} })
    expect(failed.weakestDimensions).toEqual([{ dimension: 'actionability', score: 0.5 }])
    expect(buildFailureSummary([{ failedCases: [failed] }, { failedCases: [failed] }])[0].failureCount).toBe(2)
  })

  it('reports stable no-data and improvement trends', () => {
    expect(buildTrend([]).direction).toBe('NO_DATA')
    expect(buildTrend([{ passRate: 100, averageScore: 95 }, { passRate: 75, averageScore: 80 }])).toEqual(expect.objectContaining({ direction: 'IMPROVING', passRateDelta: 25, averageScoreDelta: 15 }))
  })
})
