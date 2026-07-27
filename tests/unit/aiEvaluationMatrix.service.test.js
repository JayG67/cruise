const { TURNAROUND_BRIEFING_EVALUATION_CASES } = require('../../ai/evaluations/cases/turnaroundBriefing.cases')
const { runEvaluationMatrix } = require('../../services/aiEvaluationMatrix.service')

function passingCandidate() {
  return {
    summary: 'Immediate operational attention is required.',
    riskLevel: 'high',
    findings: [
      { category: 'staffing', evidenceIds: ['staffing:housekeeping'], recommendedAction: 'Confirm coverage.' },
      { category: 'dependency', evidenceIds: ['dependency:gangway-clearance'], recommendedAction: 'Clear the dependency.' }
    ],
    unknowns: []
  }
}

function failingCandidate() {
  return {
    summary: 'No material risk identified.',
    riskLevel: 'low',
    findings: [],
    unknowns: []
  }
}

describe('AI evaluation provider and prompt matrix', () => {
  it('compares variants against a named baseline and approves non-regressing candidates', () => {
    const matrix = runEvaluationMatrix({
      cases: TURNAROUND_BRIEFING_EVALUATION_CASES.slice(0, 1),
      baselineVariantId: 'prompt-v1',
      variants: [
        { variantId: 'prompt-v1', provider: 'deterministic', model: 'model-a', promptVersion: 'v1', generateCandidate: passingCandidate },
        { variantId: 'prompt-v2', provider: 'deterministic', model: 'model-a', promptVersion: 'v2', generateCandidate: passingCandidate }
      ]
    })

    expect(matrix).toEqual(expect.objectContaining({ baselineVariantId: 'prompt-v1', variantCount: 2, caseCount: 1 }))
    expect(matrix.comparisons).toHaveLength(1)
    expect(matrix.comparisons[0]).toEqual(expect.objectContaining({ variantId: 'prompt-v2', regressed: false }))
    expect(matrix.releaseDecision.decision).toBe('APPROVED')
    expect(matrix.variants[1].run.metadata).toEqual(expect.objectContaining({ promptVersion: 'v2' }))
    expect(matrix.variants[0].runId).not.toBe(matrix.variants[1].runId)
  })

  it('blocks a regressing provider or prompt candidate', () => {
    const matrix = runEvaluationMatrix({
      cases: TURNAROUND_BRIEFING_EVALUATION_CASES.slice(0, 1),
      variants: [
        { variantId: 'baseline', generateCandidate: passingCandidate },
        { variantId: 'candidate', generateCandidate: failingCandidate }
      ]
    })

    expect(matrix.comparisons[0].regressed).toBe(true)
    expect(matrix.releaseDecision.decision).toBe('BLOCKED')
  })

  it('requires at least two uniquely named variants and a valid baseline', () => {
    const cases = TURNAROUND_BRIEFING_EVALUATION_CASES.slice(0, 1)
    expect(() => runEvaluationMatrix({ cases, variants: [] })).toThrow('at least two variants')
    expect(() => runEvaluationMatrix({ cases, variants: [
      { variantId: 'same', generateCandidate: passingCandidate },
      { variantId: 'same', generateCandidate: passingCandidate }
    ] })).toThrow('must be unique')
    expect(() => runEvaluationMatrix({ cases, baselineVariantId: 'missing', variants: [
      { variantId: 'a', generateCandidate: passingCandidate },
      { variantId: 'b', generateCandidate: passingCandidate }
    ] })).toThrow('baseline variant')
  })
})
