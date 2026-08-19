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

describe('AI evaluation baseline fail-closed evidence handling', () => {
  test('treats only literal true as a passing case', () => {
    const baselineRun = { runId: 'base-strict', suiteId: 'suite', passRate: 100, averageScore: 95, results: [{ evaluationCaseId: 'a', passed: true }] }
    const currentRun = { runId: 'current-strict', suiteId: 'suite', passRate: 100, averageScore: 95, results: [{ evaluationCaseId: 'a', passed: 'false' }] }

    const result = compareEvaluationRuns({ currentRun, baselineRun })

    expect(result.regressed).toBe(true)
    expect(result.newFailedCases).toEqual(['a'])
    expect(result.reasons).toContain('new-failed-cases')
  })

  test('normalizes malformed run metrics instead of emitting NaN deltas', () => {
    const baselineRun = { runId: 'base-metric', suiteId: 'suite', passRate: 100, averageScore: 90, results: [] }
    const currentRun = { runId: 'current-metric', suiteId: 'suite', passRate: 'not-a-number', averageScore: Infinity, results: [] }

    const result = compareEvaluationRuns({ currentRun, baselineRun })

    expect(result.passRateDelta).toBe(-100)
    expect(result.averageScoreDelta).toBe(-90)
    expect(result.regressed).toBe(true)
    expect(Number.isFinite(result.passRateDelta)).toBe(true)
    expect(Number.isFinite(result.averageScoreDelta)).toBe(true)
  })

  test('rejects missing runs and cross-suite comparisons', () => {
    expect(() => compareEvaluationRuns({ currentRun: {}, baselineRun: {} })).toThrow(TypeError)
    expect(() => compareEvaluationRuns({
      currentRun: { runId: 'a', suiteId: 'one' },
      baselineRun: { runId: 'b', suiteId: 'two' }
    })).toThrow('same suite')
  })
})
