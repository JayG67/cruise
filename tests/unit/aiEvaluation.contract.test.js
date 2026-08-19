const {
  evaluationComparisonQuerySchema,
  evaluationRunsQuerySchema,
  qualityConsoleReleasePolicyRequestSchema,
  regressionPolicySchema,
  runEvaluationMatrixRequestSchema,
  runEvaluationRequestSchema
} = require('../../ai/contracts/aiEvaluation.contract')
const {
  DEFAULT_DIMENSION_WEIGHTS,
  EVALUATION_DIMENSIONS,
  assertEvaluationCase
} = require('../../ai/evaluations/turnaroundBriefingEvaluation.contract')
const {
  ADVERSARIAL_CATEGORIES,
  ADVERSARIAL_MUTATION_TYPES,
  ADVERSARIAL_SEVERITIES,
  DEFAULT_ADVERSARIAL_RELEASE_POLICY,
  assertAdversarialScenario,
  deepFreeze,
  normalizeAdversarialReleasePolicy
} = require('../../ai/evaluations/adversarial/turnaroundBriefingAdversarial.contract')

const briefing = {
  summary: 'Operational summary',
  riskLevel: 'low',
  findings: [],
  unknowns: [],
  generatedAt: '2026-08-17T20:00:00.000Z',
  model: 'test-model',
  promptVersion: 'v1'
}

function candidate(caseId) {
  return { caseId, briefing }
}

function variant(variantId, candidates) {
  return { variantId, provider: 'deterministic', model: 'test', promptVersion: 'v1', candidates }
}

function adversarialScenario(overrides = {}) {
  return {
    id: 'scenario-1',
    name: 'Missing evidence',
    description: 'Removes a required evidence signal.',
    category: 'MISSING_EVIDENCE',
    severity: 'HIGH',
    mutation: { type: 'REMOVE_EVIDENCE' },
    expectedOutcomes: { mustFailClosed: true },
    ...overrides
  }
}

describe('AI evaluation request evidence integrity', () => {
  it('rejects duplicate candidate case identifiers in a single evaluation run', () => {
    const parsed = runEvaluationRequestSchema.safeParse({
      suiteId: 'suite',
      candidates: [candidate('case-1'), candidate('case-1')]
    })

    expect(parsed.success).toBe(false)
    expect(parsed.error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ message: 'Evaluation candidate case identifiers must be unique.' })
    ]))
  })

  it('accepts distinct candidate case identifiers', () => {
    expect(runEvaluationRequestSchema.safeParse({
      suiteId: 'suite',
      candidates: [candidate('case-1'), candidate('case-2')]
    }).success).toBe(true)
  })

  it('rejects duplicate matrix variant identifiers', () => {
    const parsed = runEvaluationMatrixRequestSchema.safeParse({
      suiteId: 'suite',
      variants: [variant('same', [candidate('case-1')]), variant('same', [candidate('case-1')])]
    })

    expect(parsed.success).toBe(false)
    expect(parsed.error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ message: 'Evaluation matrix variant identifiers must be unique.' })
    ]))
  })

  it('rejects duplicate case identifiers inside any matrix variant while accepting distinct variants', () => {
    const parsed = runEvaluationMatrixRequestSchema.safeParse({
      suiteId: 'suite',
      variants: [
        variant('baseline', [candidate('case-1'), candidate('case-1')]),
        variant('candidate', [candidate('case-1')])
      ]
    })

    expect(parsed.success).toBe(false)
    expect(parsed.error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ message: 'Evaluation matrix candidate case identifiers must be unique within each variant.' })
    ]))
  })

  it('covers release-policy, history, and comparison schema success and rejection paths', () => {
    expect(regressionPolicySchema.safeParse({ minimumPassRate: 95, allowNewFailedCases: false }).success).toBe(true)
    expect(evaluationRunsQuerySchema.parse({})).toEqual({ suiteId: 'turnaround-briefing-phase3', limit: 20 })
    expect(evaluationComparisonQuerySchema.safeParse({ baselineRunId: 'baseline-1' }).success).toBe(true)

    const sameRun = qualityConsoleReleasePolicyRequestSchema.safeParse({
      currentRunId: 'run-1',
      baselineRunId: 'run-1',
      policy: {}
    })
    expect(sameRun.success).toBe(false)
    expect(sameRun.error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ message: 'Current and baseline evaluation runs must be different.' })
    ]))

    expect(qualityConsoleReleasePolicyRequestSchema.safeParse({
      currentRunId: 'run-2',
      baselineRunId: 'run-1',
      policy: { minimumAverageScoreDelta: -5 }
    }).success).toBe(true)
  })
})

describe('turnaround briefing evaluation contract', () => {
  it('publishes the stable scoring dimensions and weights', () => {
    expect(EVALUATION_DIMENSIONS).toEqual([
      'schemaCompliance',
      'evidenceGrounding',
      'riskPrioritization',
      'actionability',
      'unknownsDiscipline'
    ])
    expect(Object.values(DEFAULT_DIMENSION_WEIGHTS).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12)
    expect(Object.isFrozen(EVALUATION_DIMENSIONS)).toBe(true)
    expect(Object.isFrozen(DEFAULT_DIMENSION_WEIGHTS)).toBe(true)
  })

  it('accepts a complete evaluation case', () => {
    const evaluationCase = {
      id: 'case-1',
      name: 'Operational baseline',
      input: { operationId: 'op-1' },
      expected: { riskLevel: 'low' }
    }
    expect(assertEvaluationCase(evaluationCase)).toBe(evaluationCase)
  })

  it.each([
    [null, 'Evaluation case must be an object.'],
    [[], 'Evaluation case must be an object.'],
    [{ id: 'case-1', name: '   ', input: {}, expected: {} }, 'Evaluation case requires id and name.'],
    [{ id: 'case-1', name: 'Case', input: [], expected: {} }, 'Evaluation case requires input.'],
    [{ id: 'case-1', name: 'Case', input: {}, expected: [] }, 'Evaluation case requires expected outcomes.']
  ])('fails closed for malformed evaluation case %#', (value, message) => {
    expect(() => assertEvaluationCase(value)).toThrow(message)
  })
})

describe('turnaround briefing adversarial contract', () => {
  it('accepts a complete adversarial scenario and exposes stable taxonomies', () => {
    const scenario = adversarialScenario()
    expect(assertAdversarialScenario(scenario)).toBe(scenario)
    expect(ADVERSARIAL_CATEGORIES).toContain('PROMPT_INJECTION')
    expect(ADVERSARIAL_SEVERITIES).toEqual(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    expect(ADVERSARIAL_MUTATION_TYPES).toContain('SIMULATE_PROVIDER_FAILURE')
  })

  it.each([
    [null, 'Adversarial scenario must be an object.'],
    [[], 'Adversarial scenario must be an object.'],
    [adversarialScenario({ id: '   ' }), 'Adversarial scenario requires id, name, and description.'],
    [adversarialScenario({ category: 'UNKNOWN' }), 'Unsupported adversarial category: UNKNOWN'],
    [adversarialScenario({ severity: 'UNKNOWN' }), 'Unsupported adversarial severity: UNKNOWN'],
    [adversarialScenario({ mutation: [] }), 'Adversarial scenario requires a mutation object.'],
    [adversarialScenario({ mutation: { type: 'UNKNOWN' } }), 'Unsupported adversarial mutation type: UNKNOWN'],
    [adversarialScenario({ expectedOutcomes: [] }), 'Adversarial scenario requires expected outcomes.'],
    [adversarialScenario({ expectedOutcomes: {} }), 'Adversarial scenario requires at least one expected outcome.']
  ])('rejects malformed adversarial scenario %#', (scenario, message) => {
    expect(() => assertAdversarialScenario(scenario)).toThrow(message)
  })

  it('deep-freezes nested evidence while leaving primitives and already-frozen values stable', () => {
    const nested = { child: { values: [1, { proof: true }] } }
    expect(deepFreeze(nested)).toBe(nested)
    expect(Object.isFrozen(nested)).toBe(true)
    expect(Object.isFrozen(nested.child)).toBe(true)
    expect(Object.isFrozen(nested.child.values)).toBe(true)
    expect(Object.isFrozen(nested.child.values[1])).toBe(true)
    expect(deepFreeze(null)).toBe(null)
    expect(deepFreeze('evidence')).toBe('evidence')
    expect(deepFreeze(nested)).toBe(nested)
  })

  it('normalizes adversarial release policy defaults, limits, booleans, and malformed containers', () => {
    expect(normalizeAdversarialReleasePolicy()).toEqual(DEFAULT_ADVERSARIAL_RELEASE_POLICY)
    expect(normalizeAdversarialReleasePolicy(null)).toEqual(DEFAULT_ADVERSARIAL_RELEASE_POLICY)
    expect(normalizeAdversarialReleasePolicy([])).toEqual(DEFAULT_ADVERSARIAL_RELEASE_POLICY)
    expect(normalizeAdversarialReleasePolicy({
      minimumPassRate: 150,
      minimumResilienceScore: -10,
      blockOnCriticalFailure: false,
      blockOnHighFailure: false
    })).toEqual({
      minimumPassRate: 100,
      minimumResilienceScore: 0,
      blockOnCriticalFailure: false,
      blockOnHighFailure: false
    })
    expect(normalizeAdversarialReleasePolicy({ minimumPassRate: 'bad', minimumResilienceScore: Infinity }))
      .toEqual(DEFAULT_ADVERSARIAL_RELEASE_POLICY)
  })
})
