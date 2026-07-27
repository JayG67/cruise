const { clampScore, buildWeightedScore, buildEvaluationVerdict } = require('../../services/aiEvaluationScoring.service')

describe('AI evaluation scoring', () => {
  it('clamps invalid scores and builds stable weighted percentages', () => {
    expect(clampScore(-1)).toBe(0)
    expect(clampScore(2)).toBe(1)
    expect(clampScore('bad')).toBe(0)
    expect(buildWeightedScore({ schemaCompliance: 1, evidenceGrounding: 1, riskPrioritization: 1, actionability: 0.5, unknownsDiscipline: 1 })).toBe(90)
  })

  it('produces deterministic pass and grade verdicts', () => {
    expect(buildEvaluationVerdict(96)).toEqual({ score: 96, passThreshold: 80, passed: true, grade: 'EXCELLENT' })
    expect(buildEvaluationVerdict(72)).toEqual({ score: 72, passThreshold: 80, passed: false, grade: 'NEEDS_REVIEW' })
  })
})
