const TURNAROUND_BRIEFING_EVALUATION_CASES = Object.freeze([
  Object.freeze({
    id: 'staffing-and-dependency-high-risk',
    name: 'High-risk staffing gap with blocked dependency',
    tags: Object.freeze(['staffing', 'dependency', 'high-risk']),
    input: Object.freeze({ question: 'What could delay departure?', evidenceIds: Object.freeze(['staffing:housekeeping', 'dependency:gangway-clearance']) }),
    expected: Object.freeze({
      riskLevel: 'high',
      requiredEvidenceIds: Object.freeze(['staffing:housekeeping', 'dependency:gangway-clearance']),
      requiredFindingCategories: Object.freeze(['staffing', 'dependency']),
      minimumRecommendedActions: 2,
      allowUnsupportedEvidence: false
    })
  }),
  Object.freeze({
    id: 'ready-operation-low-risk',
    name: 'Operationally ready turnaround with no critical blockers',
    tags: Object.freeze(['readiness', 'low-risk']),
    input: Object.freeze({ question: 'Is this turnaround ready for departure?', evidenceIds: Object.freeze(['signoff:all-departments', 'task:critical-complete']) }),
    expected: Object.freeze({
      riskLevel: 'low',
      requiredEvidenceIds: Object.freeze(['signoff:all-departments']),
      requiredFindingCategories: Object.freeze([]),
      minimumRecommendedActions: 0,
      allowUnsupportedEvidence: false
    })
  }),
  Object.freeze({
    id: 'unknown-arrival-time',
    name: 'Unknown relief arrival time is preserved as an unknown',
    tags: Object.freeze(['unknowns', 'staffing']),
    input: Object.freeze({ question: 'What needs confirmation?', evidenceIds: Object.freeze(['staffing:relief-unconfirmed']) }),
    expected: Object.freeze({
      riskLevel: 'medium',
      requiredEvidenceIds: Object.freeze(['staffing:relief-unconfirmed']),
      requiredFindingCategories: Object.freeze(['staffing']),
      minimumRecommendedActions: 1,
      requiredUnknownTerms: Object.freeze(['arrival time']),
      allowUnsupportedEvidence: false
    })
  })
])

module.exports = { TURNAROUND_BRIEFING_EVALUATION_CASES }
