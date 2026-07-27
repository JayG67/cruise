const { compareEvaluationRuns } = require('../../services/aiEvaluationBaseline.service')

describe('AI evaluation baseline comparison', () => {
  test('detects score regression and new failed cases', () => {
    const baselineRun = { runId: 'base', suiteId: 'suite', passRate: 100, averageScore: 95, results: [{ evaluationCaseId: 'a', passed: true }] }
    const currentRun = { runId: 'current', suiteId: 'suite', passRate: 0, averageScore: 70, results: [{ evaluationCaseId: 'a', passed: false }] }
    const result = compareEvaluationRuns({ currentRun, baselineRun })
    expect(result.regressed).toBe(true)
    expect(result.newFailedCases).toEqual(['a'])
    expect(result.reasons).toEqual(expect.arrayContaining(['pass-rate-regression', 'average-score-regression', 'new-failed-cases']))
  })

  test('reports recovery without regression', () => {
    const baselineRun = { runId: 'base', suiteId: 'suite', passRate: 50, averageScore: 75, results: [{ evaluationCaseId: 'a', passed: false }] }
    const currentRun = { runId: 'current', suiteId: 'suite', passRate: 100, averageScore: 90, results: [{ evaluationCaseId: 'a', passed: true }] }
    const result = compareEvaluationRuns({ currentRun, baselineRun })
    expect(result.regressed).toBe(false)
    expect(result.recoveredCases).toEqual(['a'])
  })
})
