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
  }),
  Object.freeze({
    id: 'technical-blocker-critical-path',
    name: 'Engineering blocker is prioritized on the critical path',
    tags: Object.freeze(['engineering', 'critical-path', 'high-risk']),
    input: Object.freeze({ question: 'What technical issue threatens departure?', evidenceIds: Object.freeze(['task:propulsion-test-blocked', 'dependency:engineering-clearance']) }),
    expected: Object.freeze({
      riskLevel: 'high',
      requiredEvidenceIds: Object.freeze(['task:propulsion-test-blocked', 'dependency:engineering-clearance']),
      requiredFindingCategories: Object.freeze(['task', 'dependency']),
      minimumRecommendedActions: 2,
      allowUnsupportedEvidence: false
    })
  }),
  Object.freeze({
    id: 'guest-services-handoff-medium-risk',
    name: 'Guest services handoff remains incomplete',
    tags: Object.freeze(['guest-services', 'handoff', 'medium-risk']),
    input: Object.freeze({ question: 'Which handoff needs immediate ownership?', evidenceIds: Object.freeze(['handoff:mobility-assistance-open']) }),
    expected: Object.freeze({
      riskLevel: 'medium',
      requiredEvidenceIds: Object.freeze(['handoff:mobility-assistance-open']),
      requiredFindingCategories: Object.freeze(['handoff']),
      minimumRecommendedActions: 1,
      allowUnsupportedEvidence: false
    })
  }),
  Object.freeze({
    id: 'provisioning-escalation-high-risk',
    name: 'Provisioning shortage and escalation are connected',
    tags: Object.freeze(['food-beverage', 'escalation', 'high-risk']),
    input: Object.freeze({ question: 'What provisioning issue requires escalation?', evidenceIds: Object.freeze(['task:cold-storage-shortage', 'escalation:provisioning-vendor']) }),
    expected: Object.freeze({
      riskLevel: 'high',
      requiredEvidenceIds: Object.freeze(['task:cold-storage-shortage', 'escalation:provisioning-vendor']),
      requiredFindingCategories: Object.freeze(['task', 'escalation']),
      minimumRecommendedActions: 2,
      allowUnsupportedEvidence: false
    })
  }),
  Object.freeze({
    id: 'conflicting-readiness-signoff',
    name: 'Conflicting readiness evidence is surfaced without false certainty',
    tags: Object.freeze(['signoff', 'conflict', 'unknowns']),
    input: Object.freeze({ question: 'Can departure be released?', evidenceIds: Object.freeze(['signoff:housekeeping-approved', 'signoff:engineering-pending']) }),
    expected: Object.freeze({
      riskLevel: 'medium',
      requiredEvidenceIds: Object.freeze(['signoff:housekeeping-approved', 'signoff:engineering-pending']),
      requiredFindingCategories: Object.freeze(['signoff']),
      minimumRecommendedActions: 1,
      requiredUnknownTerms: Object.freeze(['engineering']),
      allowUnsupportedEvidence: false
    })
  }),
  Object.freeze({
    id: 'no-evidence-no-fabrication',
    name: 'Missing evidence does not produce fabricated operational claims',
    tags: Object.freeze(['grounding', 'unknowns', 'safety']),
    input: Object.freeze({ question: 'Summarize current departure risk.', evidenceIds: Object.freeze([]) }),
    expected: Object.freeze({
      riskLevel: 'medium',
      requiredEvidenceIds: Object.freeze([]),
      requiredFindingCategories: Object.freeze([]),
      minimumRecommendedActions: 1,
      requiredUnknownTerms: Object.freeze(['evidence']),
      allowUnsupportedEvidence: false
    })
  })
])

module.exports = { TURNAROUND_BRIEFING_EVALUATION_CASES }
