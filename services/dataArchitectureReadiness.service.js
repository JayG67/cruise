const NORMALIZED_STATUS_VALUES = new Set([
  'READY',
  'IN_PROGRESS',
  'BLOCKED',
  'COMPLETE',
  'OPEN',
  'RESOLVED',
  'APPROVED',
  'PENDING',
  'CANCELLED',
  'CONFIRMED',
  'ACTIVE',
  'INACTIVE',
  'DRAFT',
  'REVIEW'
])

const TURNAROUND_ROLE_IDS = new Set([
  'turnaround-manager',
  'housekeeping-lead',
  'guest-services-lead',
  'food-beverage-lead',
  'engineering-lead',
  'security-lead',
  'port-operations-lead'
])

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function asPercent(passed, total) {
  if (!total) return 100
  return Math.max(0, Math.min(100, Math.round((passed / total) * 100)))
}

function normalizeStatus(value = '') {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
}

function looksLikeDateOnly(value = '') {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim())
}

function looksTimezoneAware(value = '') {
  const text = String(value || '').trim()
  return /T\d{2}:\d{2}/.test(text) && /(Z|[+-]\d{2}:?\d{2})$/.test(text)
}

function buildGate({ id, label, score, status, summary, evidence = [], recommendations = [] }) {
  return {
    id,
    label,
    score,
    status,
    summary,
    evidence,
    recommendations
  }
}

function buildIdentityGate({ customers = [], bookings = [], bookingPassengers = [], demoUsers = [], appUsers = [] }) {
  const bookingCustomerLinks = asArray(bookings).filter(booking => booking.customerId || booking.createdByCustomerId).length
  const passengerCustomerLinks = asArray(bookingPassengers).filter(passenger => passenger.customerId).length
  const normalizedDemoUsers = asArray(demoUsers).filter(user => user.normalizedUserId || user.customerId).length
  const appUserCoverage = asArray(appUsers).length
  const totalChecks = asArray(bookings).length + asArray(bookingPassengers).length + asArray(demoUsers).length + 1
  const passedChecks = bookingCustomerLinks + passengerCustomerLinks + normalizedDemoUsers + (appUserCoverage > 0 ? 1 : 0)
  const score = asPercent(passedChecks, totalChecks)

  return buildGate({
    id: 'identity',
    label: 'Identity normalization',
    score,
    status: score >= 85 ? 'ready' : score >= 60 ? 'watch' : 'needs-hardening',
    summary: `${passedChecks} of ${totalChecks} identity checks use stable IDs instead of display names.`,
    evidence: [
      `${bookingCustomerLinks} booking records link to customer IDs`,
      `${passengerCustomerLinks} booking passenger records link to customer IDs`,
      `${normalizedDemoUsers} assigned people have normalized user or customer references`,
      `${appUserCoverage} normalized app user records are available`
    ],
    recommendations: score >= 85
      ? ['Continue replacing presentation-only user references with durable operational identities as workflows expand.']
      : ['Backfill normalizedUserId for assigned people and keep booking ownership on customerId / createdByCustomerId.']
  })
}

function buildDateGate({ sailings = [], turnaroundOperations = [], auditEvents = [] }) {
  const sailingDateOnly = asArray(sailings).filter(sailing => looksLikeDateOnly(sailing.departureDate)).length
  const turnaroundDateOnly = asArray(turnaroundOperations).filter(operation => looksLikeDateOnly(operation.turnaroundDate)).length
  const auditTimezoneAware = asArray(auditEvents).filter(event => looksTimezoneAware(event.createdAt || event.occurredAt || event.timestamp)).length
  const totalChecks = asArray(sailings).length + asArray(turnaroundOperations).length + Math.max(asArray(auditEvents).length, 1)
  const passedChecks = auditTimezoneAware + Math.max(0, asArray(sailings).length - sailingDateOnly) + Math.max(0, asArray(turnaroundOperations).length - turnaroundDateOnly)
  const score = asPercent(passedChecks, totalChecks)

  return buildGate({
    id: 'dates',
    label: 'Date and time hardening',
    score,
    status: score >= 80 ? 'ready' : score >= 45 ? 'watch' : 'needs-hardening',
    summary: `${sailingDateOnly + turnaroundDateOnly} operational date fields are still date-only strings.`,
    evidence: [
      `${sailingDateOnly} sailing departure dates are date-only strings`,
      `${turnaroundDateOnly} turnaround operation dates are date-only strings`,
      `${auditTimezoneAware} audit events already expose timezone-aware timestamps`
    ],
    recommendations: ['Move operational execution moments to timestamp / UTC datetime fields before public production deployment.']
  })
}

function buildRoleGate({ demoUsers = [], appRoles = [], appUserRoles = [] }) {
  const normalizedRoleIds = asArray(demoUsers).filter(user => user.normalizedRoleId || TURNAROUND_ROLE_IDS.has(String(user.role || '').toLowerCase().replace(/_/g, '-'))).length
  const roleCatalogCoverage = asArray(appRoles).filter(role => role.id && role.name).length
  const userRoleAssignments = asArray(appUserRoles).filter(role => role.userId && role.roleId).length
  const totalChecks = asArray(demoUsers).length + Math.max(asArray(appRoles).length, 1) + Math.max(asArray(appUserRoles).length, 1)
  const passedChecks = normalizedRoleIds + roleCatalogCoverage + userRoleAssignments
  const score = asPercent(passedChecks, totalChecks)

  return buildGate({
    id: 'roles',
    label: 'Role normalization',
    score,
    status: score >= 85 ? 'ready' : score >= 55 ? 'watch' : 'needs-hardening',
    summary: `${normalizedRoleIds} assigned people are mapped to normalized role identifiers.`,
    evidence: [
      `${roleCatalogCoverage} app role catalog records detected`,
      `${userRoleAssignments} normalized user-role assignments detected`,
      `${normalizedRoleIds} assigned people have normalized role coverage`
    ],
    recommendations: score >= 85
      ? ['Keep role-gated UI paths driven by role IDs instead of display labels.']
      : ['Continue moving TURNAROUND_MANAGER-style values into app_roles and app_user_roles.']
  })
}

function buildStatusGate({ bookings = [], turnaroundOperations = [], turnaroundTasks = [], escalations = [], handoffs = [], signoffs = [] }) {
  const statusRecords = [
    ...asArray(bookings).map(item => item.bookingStatus || item.status),
    ...asArray(turnaroundOperations).map(item => item.status),
    ...asArray(turnaroundTasks).map(item => item.status),
    ...asArray(escalations).map(item => item.status),
    ...asArray(handoffs).map(item => item.status),
    ...asArray(signoffs).map(item => item.status)
  ].filter(Boolean)

  const normalizedStatuses = statusRecords.filter(status => NORMALIZED_STATUS_VALUES.has(normalizeStatus(status))).length
  const score = asPercent(normalizedStatuses, statusRecords.length)

  return buildGate({
    id: 'statuses',
    label: 'Constrained status values',
    score,
    status: score >= 90 ? 'ready' : score >= 65 ? 'watch' : 'needs-hardening',
    summary: `${normalizedStatuses} of ${statusRecords.length} status fields match the constrained production vocabulary.`,
    evidence: [`${statusRecords.length} status-bearing records evaluated`],
    recommendations: score >= 90
      ? ['Preserve status constraints in migrations and API validation.']
      : ['Replace free-form status strings with shared enums and database constraints.']
  })
}

function buildAuditGate({ auditEvents = [], turnaroundOperations = [], turnaroundTasks = [] }) {
  const scopedEvents = asArray(auditEvents).filter(event => event.entityType && (event.entityId || event.operationId)).length
  const operationCoverage = new Set(asArray(auditEvents).map(event => event.operationId).filter(Boolean)).size
  const totalOperationalObjects = asArray(turnaroundOperations).length + asArray(turnaroundTasks).length
  const score = asPercent(scopedEvents + operationCoverage, Math.max(asArray(auditEvents).length + totalOperationalObjects, 1))

  return buildGate({
    id: 'audit',
    label: 'Audit/event stream coverage',
    score,
    status: score >= 75 ? 'ready' : score >= 40 ? 'watch' : 'needs-hardening',
    summary: `${scopedEvents} audit events include entity or operation scope.`,
    evidence: [
      `${asArray(auditEvents).length} audit events available`,
      `${operationCoverage} turnaround operations have audit-event references`,
      `${totalOperationalObjects} operation/task records should eventually emit event history`
    ],
    recommendations: ['Expand task, staffing, signoff, and escalation changes into a true append-only event stream.']
  })
}

function buildTenantGate({ cruiseLines = [], ships = [], sailings = [], turnaroundOperations = [], demoUsers = [] }) {
  const shipsScoped = asArray(ships).filter(ship => ship.cruiseLineId).length
  const sailingsScoped = asArray(sailings).filter(sailing => sailing.shipId).length
  const operationScoped = asArray(turnaroundOperations).filter(operation => operation.sailingId).length
  const peopleScoped = asArray(demoUsers).filter(user => !TURNAROUND_ROLE_IDS.has(String(user.role || '').toLowerCase().replace(/_/g, '-')) || user.cruiseLineId).length
  const totalChecks = asArray(ships).length + asArray(sailings).length + asArray(turnaroundOperations).length + asArray(demoUsers).length
  const passedChecks = shipsScoped + sailingsScoped + operationScoped + peopleScoped
  const score = asPercent(passedChecks, totalChecks)

  return buildGate({
    id: 'tenant-boundaries',
    label: 'Cruise-line tenant boundaries',
    score,
    status: score >= 90 ? 'ready' : score >= 70 ? 'watch' : 'needs-hardening',
    summary: `${passedChecks} of ${totalChecks} tenant-boundary checks are scoped to cruise line, ship, or sailing IDs.`,
    evidence: [
      `${asArray(cruiseLines).length} cruise-line tenants detected`,
      `${shipsScoped} ships carry cruiseLineId`,
      `${sailingsScoped} sailings carry shipId`,
      `${peopleScoped} users avoid cross-line turnaround assignment leakage`
    ],
    recommendations: ['Add explicit tenant IDs to every operational table before supporting multiple real cruise-line customers.']
  })
}

function buildMigrationBacklog(gates = []) {
  const normalizedGates = asArray(gates)
  const gatePriority = {
    dates: 1,
    roles: 2,
    statuses: 3,
    audit: 4,
    identity: 5,
    'tenant-boundaries': 6
  }

  const templates = {
    identity: {
      title: 'Backfill stable person references',
      phase: 'Foundation',
      owner: 'Platform data',
      effort: 'M',
      risk: 'medium',
      dependency: 'Confirm canonical customer, passenger, application-user, and assigned-person mapping rules.',
      migration: 'Create nullable stable reference fields, backfill from current relationships, then make writes use IDs before tightening constraints.',
      acceptance: 'Bookings, passengers, assigned people, and application users can be joined without display-name matching.'
    },
    dates: {
      title: 'Promote operational dates to timezone-aware timestamps',
      phase: 'Foundation',
      owner: 'Operations platform',
      effort: 'M',
      risk: 'high',
      dependency: 'Decide port-local timezone policy and UTC storage conventions.',
      migration: 'Add timestamp columns beside date-only fields, backfill with port-local assumptions, update APIs, then retire ambiguous date strings.',
      acceptance: 'Operational timeline, audit history, and turnaround board use timezone-aware execution moments.'
    },
    roles: {
      title: 'Move role gating to normalized role assignments',
      phase: 'Access model',
      owner: 'Identity and access',
      effort: 'S',
      risk: 'medium',
      dependency: 'Finalize role catalog IDs and role-to-workspace permissions.',
      migration: 'Use app_roles and app_user_roles as the source of truth while keeping display labels as presentation-only metadata.',
      acceptance: 'Every protected admin and turnaround workflow can authorize against role IDs rather than labels.'
    },
    statuses: {
      title: 'Constrain operational statuses with shared enums',
      phase: 'Domain model',
      owner: 'Workflow systems',
      effort: 'S',
      risk: 'medium',
      dependency: 'Align status vocabulary across bookings, tasks, signoffs, handoffs, and escalations.',
      migration: 'Introduce shared enum helpers and validation, map legacy strings, then add database checks in a later migration.',
      acceptance: 'All status-bearing records serialize one of the approved production status values.'
    },
    audit: {
      title: 'Expand append-only audit event coverage',
      phase: 'Observability',
      owner: 'Platform audit',
      effort: 'M',
      risk: 'medium',
      dependency: 'Define required event payload shape for task, staffing, signoff, handoff, and escalation changes.',
      migration: 'Record normalized audit events for each mutating workflow and expose event streams by operation, entity, and tenant.',
      acceptance: 'Operational changes can be replayed as a scoped event history for governance reviews and closeout records.'
    },
    'tenant-boundaries': {
      title: 'Enforce cruise-line tenant boundaries',
      phase: 'Scale readiness',
      owner: 'Multi-tenant platform',
      effort: 'L',
      risk: 'high',
      dependency: 'Lock tenant ownership model for cruise lines, ships, sailings, users, and operational records.',
      migration: 'Add explicit tenant references to operational tables, backfill through sailing and ship relationships, then enforce tenant-scoped reads and writes.',
      acceptance: 'No admin, passenger-group, or turnaround workflow can leak data across cruise-line tenants.'
    }
  }

  return [...normalizedGates]
    .sort((a, b) => (a.status === b.status ? gatePriority[a.id] - gatePriority[b.id] : a.score - b.score))
    .map((gate, index) => ({
      id: `migration-${gate.id}`,
      gateId: gate.id,
      sequence: index + 1,
      score: gate.score,
      status: gate.status,
      ...(templates[gate.id] || {
        title: gate.label,
        phase: 'Hardening',
        owner: 'Platform',
        effort: 'M',
        risk: 'medium',
        dependency: 'Review current data shape.',
        migration: gate.recommendations?.[0] || 'Plan a migration for this data architecture gate.',
        acceptance: gate.summary
      })
    }))
}

function buildMigrationTimeline(backlog = []) {
  const normalizedBacklog = asArray(backlog)
  const phases = ['Foundation', 'Access model', 'Domain model', 'Observability', 'Scale readiness']

  return phases
    .map((phase, index) => {
      const items = normalizedBacklog.filter(item => item.phase === phase)
      const maxRisk = items.some(item => item.risk === 'high') ? 'high' : items.some(item => item.risk === 'medium') ? 'medium' : 'low'

      return {
        phase,
        sequence: index + 1,
        status: items.some(item => item.status === 'needs-hardening') ? 'needs-hardening' : items.some(item => item.status === 'watch') ? 'watch' : 'ready',
        risk: maxRisk,
        items: items.map(item => item.id),
        summary: items.length
          ? `${items.length} migration workstream${items.length === 1 ? '' : 's'} queued for ${phase.toLowerCase()}.`
          : `No active ${phase.toLowerCase()} migration blockers detected.`
      }
    })
}

function buildSchemaContract(gates = []) {
  return asArray(gates).map(gate => ({
    gateId: gate.id,
    label: gate.label,
    targetState: gate.status === 'ready'
      ? 'Preserve current production-ready contract and protect it with tests.'
      : gate.recommendations?.[0] || 'Define and enforce a production-ready contract.',
    currentEvidence: gate.evidence || [],
    contractTest: `Add regression coverage for ${gate.label.toLowerCase()} before applying schema migrations.`
  }))
}

function buildHardeningRiskRegister(backlog = []) {
  return asArray(backlog)
    .filter(item => item.risk === 'high' || item.status !== 'ready')
    .slice(0, 6)
    .map(item => ({
      id: `risk-${item.gateId}`,
      title: item.title,
      severity: item.risk === 'high' ? 'high' : item.status === 'needs-hardening' ? 'medium' : 'watch',
      mitigation: item.dependency,
      validation: item.acceptance
    }))
}

function buildDataArchitectureReadiness(input = {}) {
  const source = input && typeof input === 'object' ? input : {}
  const gates = [
    buildIdentityGate(source),
    buildDateGate(source),
    buildRoleGate(source),
    buildStatusGate(source),
    buildAuditGate(source),
    buildTenantGate(source)
  ]

  const overallScore = Math.round(gates.reduce((total, gate) => total + gate.score, 0) / gates.length)
  const blockers = gates.filter(gate => gate.status === 'needs-hardening')
  const watchItems = gates.filter(gate => gate.status === 'watch')

  const migrationBacklog = buildMigrationBacklog(gates)
  const migrationTimeline = buildMigrationTimeline(migrationBacklog)
  const schemaContract = buildSchemaContract(gates)
  const riskRegister = buildHardeningRiskRegister(migrationBacklog)

  return {
    title: 'Data Architecture Hardening Center',
    overallScore,
    status: blockers.length ? 'needs-hardening' : watchItems.length ? 'watch' : 'ready',
    summary: blockers.length
      ? `${blockers.length} architecture gate${blockers.length === 1 ? '' : 's'} need hardening before production deployment.`
      : watchItems.length
        ? `${watchItems.length} architecture gate${watchItems.length === 1 ? '' : 's'} should be watched during production hardening.`
        : 'Core data architecture gates are ready for the production-hardening phase.',
    gates,
    migrationBacklog,
    migrationTimeline,
    schemaContract,
    riskRegister,
    roadmap: [
      'Stabilize workflow UX before schema migration churn.',
      'Normalize identity and role relationships before public deployment.',
      'Move operational dates to timezone-aware timestamp fields.',
      'Convert constrained statuses to shared enums and database checks.',
      'Expand audit events into durable operational event streams.',
      'Introduce explicit tenant boundaries for each cruise-line customer.'
    ]
  }
}

module.exports = {
  NORMALIZED_STATUS_VALUES,
  TURNAROUND_ROLE_IDS,
  buildDataArchitectureReadiness,
  buildMigrationBacklog,
  buildMigrationTimeline,
  buildSchemaContract,
  buildHardeningRiskRegister,
  normalizeStatus,
  looksLikeDateOnly,
  looksTimezoneAware
}
