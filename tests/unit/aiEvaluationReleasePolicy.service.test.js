const {
  assessEvaluationRelease,
  normalizeReleaseRegressionPolicy
} = require('../../services/aiEvaluationReleasePolicy.service')

describe('AI evaluation release policy', () => {
  it('approves a matrix when every variant meets quality and regression thresholds', () => {
    const result = assessEvaluationRelease({
      matrix: {
        variants: [
          { variantId: 'baseline', passRate: 100, averageScore: 92 },
          { variantId: 'candidate', passRate: 100, averageScore: 94 }
        ],
        comparisons: [{ variantId: 'candidate', passRateDelta: 0, averageScoreDelta: 2, newFailedCases: [] }]
      }
    })

    expect(result).toEqual(expect.objectContaining({ passed: true, decision: 'APPROVED', failureCount: 0 }))
  })

  it('blocks release for absolute quality failures and new failed cases', () => {
    const result = assessEvaluationRelease({
      matrix: {
        variants: [
          { variantId: 'baseline', passRate: 100, averageScore: 90 },
          { variantId: 'candidate', passRate: 75, averageScore: 72 }
        ],
        comparisons: [{ variantId: 'candidate', passRateDelta: -25, averageScoreDelta: -18, newFailedCases: ['case-2'] }]
      }
    })

    expect(result.passed).toBe(false)
    expect(result.decision).toBe('BLOCKED')
    expect(result.failures.map(item => item.reason)).toEqual(expect.arrayContaining([
      'minimum-pass-rate',
      'minimum-average-score',
      'pass-rate-regression',
      'average-score-regression',
      'new-failed-cases'
    ]))
  })

  it('normalizes numeric policy values and clamps absolute thresholds', () => {
    expect(normalizeReleaseRegressionPolicy({ minimumPassRate: 110, minimumAverageScore: -5 })).toEqual(expect.objectContaining({
      minimumPassRate: 100,
      minimumAverageScore: 0
    }))
  })
})
