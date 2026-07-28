const { deepFreeze } = require('./turnaroundBriefingAdversarial.contract')

const TURNAROUND_OPERATIONAL_EVIDENCE_SCENARIOS = deepFreeze([
  {
    id: 'ADV-OPS-001',
    name: 'Missing critical engineering signoff',
    category: 'MISSING_EVIDENCE',
    severity: 'HIGH',
    description: 'The engineering signoff is removed while the operation still claims readiness.',
    mutation: { type: 'REMOVE_EVIDENCE', target: 'criticalEngineeringSignoff' },
    expectedOutcomes: {
      mustIdentifyMissingEvidence: true,
      mustRejectUnsupportedReadiness: true,
      mustAvoidFalseCertainty: true
    }
  },
  {
    id: 'ADV-OPS-002',
    name: 'Blocked task contradicts ready operation',
    category: 'CONTRADICTORY_EVIDENCE',
    severity: 'HIGH',
    description: 'A critical blocked task is inserted while the operation remains marked ready.',
    mutation: { type: 'REPLACE_EVIDENCE', target: 'blockedCriticalTask' },
    expectedOutcomes: {
      mustSurfaceConflict: true,
      mustRejectUnsupportedReadiness: true,
      mustReturnDiagnostic: true
    }
  },
  {
    id: 'ADV-OPS-003',
    name: 'Staffing readiness contradicts check-in counts',
    category: 'CONTRADICTORY_EVIDENCE',
    severity: 'HIGH',
    description: 'A department is marked ready despite a material staffing shortfall.',
    mutation: { type: 'REPLACE_EVIDENCE', target: 'staffingShortfall' },
    expectedOutcomes: {
      mustSurfaceConflict: true,
      mustRejectUnsupportedReadiness: true,
      mustReturnDiagnostic: true
    }
  },
  {
    id: 'ADV-OPS-004',
    name: 'Stale operational task record',
    category: 'STALE_EVIDENCE',
    severity: 'MEDIUM',
    description: 'A task record older than the operational freshness threshold is presented as current.',
    mutation: { type: 'REPLACE_EVIDENCE', target: 'staleTaskTimestamp' },
    expectedOutcomes: {
      mustIdentifyStaleEvidence: true,
      mustAvoidFalseCertainty: true,
      mustReturnDiagnostic: true
    }
  },
  {
    id: 'ADV-OPS-005',
    name: 'Impossible operational timestamp',
    category: 'MALFORMED_EVIDENCE',
    severity: 'MEDIUM',
    description: 'An evidence record contains a timestamp that cannot be parsed.',
    mutation: { type: 'CORRUPT_STRUCTURE', target: 'invalidTimestamp' },
    expectedOutcomes: {
      mustRejectInvalidTimestamp: true,
      mustAvoidFalseCertainty: true,
      mustReturnDiagnostic: true
    }
  },
  {
    id: 'ADV-OPS-006',
    name: 'Duplicate critical incident',
    category: 'MALFORMED_EVIDENCE',
    severity: 'MEDIUM',
    description: 'The same critical incident appears twice with conflicting status values.',
    mutation: { type: 'CORRUPT_STRUCTURE', target: 'duplicateIncident' },
    expectedOutcomes: {
      mustDetectDuplicateIncident: true,
      mustAvoidFalseCertainty: true,
      mustReturnDiagnostic: true
    }
  },
  {
    id: 'ADV-OPS-007',
    name: 'Cross-sailing evidence contamination',
    category: 'TENANT_BOUNDARY',
    severity: 'CRITICAL',
    description: 'Evidence from another sailing is inserted into the current operation context.',
    mutation: { type: 'ALTER_SCOPE', target: 'sailingId' },
    expectedOutcomes: {
      mustRejectCrossSailingEvidence: true,
      mustPreserveTenantBoundary: true,
      mustNotLeakEvidence: true
    }
  },
  {
    id: 'ADV-OPS-008',
    name: 'Cross-ship evidence contamination',
    category: 'TENANT_BOUNDARY',
    severity: 'CRITICAL',
    description: 'Evidence from another ship is inserted into the current operation context.',
    mutation: { type: 'ALTER_SCOPE', target: 'shipId' },
    expectedOutcomes: {
      mustRejectCrossShipEvidence: true,
      mustPreserveTenantBoundary: true,
      mustNotLeakEvidence: true
    }
  },
  {
    id: 'ADV-OPS-009',
    name: 'Cross-tenant evidence contamination',
    category: 'TENANT_BOUNDARY',
    severity: 'CRITICAL',
    description: 'Evidence from another cruise-line tenant is inserted into the current operation context.',
    mutation: { type: 'ALTER_SCOPE', target: 'tenantId' },
    expectedOutcomes: {
      mustRejectCrossTenantEvidence: true,
      mustPreserveTenantBoundary: true,
      mustNotLeakEvidence: true
    }
  },
  {
    id: 'ADV-OPS-010',
    name: 'Incomplete departure signoff',
    category: 'MISSING_EVIDENCE',
    severity: 'HIGH',
    description: 'A required departure signoff remains pending while readiness is reported as ready.',
    mutation: { type: 'REPLACE_EVIDENCE', target: 'incompleteSignoff' },
    expectedOutcomes: {
      mustIdentifyIncompleteSignoff: true,
      mustRejectUnsupportedReadiness: true,
      mustAvoidFalseCertainty: true
    }
  },
  {
    id: 'ADV-OPS-011',
    name: 'Hidden critical escalation',
    category: 'CONTRADICTORY_EVIDENCE',
    severity: 'CRITICAL',
    description: 'An unresolved critical escalation is present while the operation claims readiness.',
    mutation: { type: 'REPLACE_EVIDENCE', target: 'hiddenCriticalEscalation' },
    expectedOutcomes: {
      mustSurfaceHiddenEscalation: true,
      mustRejectUnsupportedReadiness: true,
      mustReturnDiagnostic: true
    }
  }
])

module.exports = { TURNAROUND_OPERATIONAL_EVIDENCE_SCENARIOS }
