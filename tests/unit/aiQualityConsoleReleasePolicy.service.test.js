const {
  assessQualityConsoleReleasePolicy,
  describeQualityConsoleReleasePolicy
} = require('../../services/aiQualityConsoleReleasePolicy.service')

function run({ runId, passRate, averageScore, failedCaseIds = [] }) {
  return {
    runId,
    passRate,
    averageScore,
    results: [
      { evaluationCaseId: 'case-1', passed: !failedCaseIds.includes('case-1') },
      { evaluationCaseId: 'case-2', passed: !failedCaseIds.includes('case-2') }
    ]
  }
}

describe('AI Quality Console release-policy preview', () => {
  it('approves a candidate that satisfies absolute and regression thresholds', () => {
    const result = assessQualityConsoleReleasePolicy({
      currentRun: run({ runId: 'current', passRate: 100, averageScore: 94 }),
      baselineRun: run({ runId: 'baseline', passRate: 100, averageScore: 92 })
    })

    expect(result).toEqual(expect.objectContaining({ decision: 'APPROVED', passed: true, failureCount: 0 }))
  })

  it('blocks a candidate for quality regressions and newly failed cases', () => {
    const result = assessQualityConsoleReleasePolicy({
      currentRun: run({ runId: 'current', passRate: 50, averageScore: 70, failedCaseIds: ['case-2'] }),
      baselineRun: run({ runId: 'baseline', passRate: 100, averageScore: 90 })
    })

    expect(result.decision).toBe('BLOCKED')
    expect(result.failures.map(item => item.reason)).toEqual(expect.arrayContaining([
      'minimum-pass-rate',
      'minimum-average-score',
      'pass-rate-regression',
      'average-score-regression',
      'new-failed-cases'
    ]))
  })

  it('exposes the default policy used to initialize the console controls', () => {
    expect(describeQualityConsoleReleasePolicy()).toEqual(expect.objectContaining({
      minimumPassRate: 100,
      minimumAverageScore: 80,
      allowNewFailedCases: false
    }))
  })
})
