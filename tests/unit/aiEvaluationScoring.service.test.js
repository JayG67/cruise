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

describe('AI evaluation scoring evidence hardening', () => {
  it('ignores malformed and negative weights while preserving valid weights', () => {
    expect(buildWeightedScore(
      { schemaCompliance: 1, evidenceGrounding: 0.5 },
      { schemaCompliance: 2, evidenceGrounding: '2', invalid: 'bad', negative: -4 }
    )).toBe(75)
  })

  it('rejects weight sets without a positive finite total', () => {
    expect(() => buildWeightedScore({}, { a: 'bad', b: -1, c: 0 })).toThrow(TypeError)
    expect(() => buildWeightedScore({}, null)).toThrow(TypeError)
  })

  it('normalizes malformed verdict inputs instead of returning non-finite evidence', () => {
    expect(buildEvaluationVerdict('not-a-score', 'not-a-threshold')).toEqual({
      score: 0,
      passThreshold: 80,
      passed: false,
      grade: 'FAIL'
    })
    expect(buildEvaluationVerdict('95', '90')).toEqual({
      score: 95,
      passThreshold: 90,
      passed: true,
      grade: 'EXCELLENT'
    })
  })
})
