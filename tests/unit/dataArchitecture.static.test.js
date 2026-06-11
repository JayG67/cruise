const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('Production data architecture hardening guardrails', () => {
  it('creates indexes for high-volume cruise, booking, and turnaround query paths', () => {
    const initializer = read('services/initializeDatabase.service.js')

    for (const indexName of [
      'idx_app_users_primary_customer',
      'idx_app_users_type_status',
      'idx_app_user_roles_user_status',
      'idx_app_user_roles_role_scope',
      'idx_demo_users_normalized_user_role',
      'idx_turnaround_handoffs_owner_user',
      'idx_turnaround_escalations_owner_user',
      'idx_turnaround_signoffs_approver_user',
      'idx_turnaround_task_updates_author_user',
      'idx_turnaround_tasks_owner_user',
      'idx_ships_cruise_line_id',
      'idx_sailings_ship_id_departure_date',
      'idx_sailings_departure_route',
      'idx_itinerary_days_sailing_day',
      'idx_activity_schedules_itinerary_day',
      'idx_bookings_sailing_status',
      'idx_bookings_created_by_customer',
      'idx_booking_passengers_booking_id',
      'idx_booking_passengers_customer_id',
      'idx_customer_itinerary_favorites_customer_id',
      'idx_turnaround_operations_sailing_status',
      'idx_turnaround_operations_date_status',
      'idx_turnaround_tasks_operation_role_status',
      'idx_turnaround_tasks_operation_sort',
      'idx_turnaround_task_updates_task_created_at',
      'idx_turnaround_task_dependencies_operation_status',
      'idx_turnaround_task_dependencies_task_ids',
      'idx_turnaround_handoffs_operation_status',
      'idx_turnaround_handoffs_departments',
      'idx_turnaround_escalations_operation_status_severity',
      'idx_turnaround_escalations_department_status',
      'idx_turnaround_staffing_operation_role',
      'idx_turnaround_signoffs_operation_role_status'
    ]) {
      expect(initializer).toContain(`CREATE INDEX IF NOT EXISTS ${indexName}`)
    }
  })



  it('adds database constraints for production-safe reference values and operational invariants', () => {
    const initializer = read('services/initializeDatabase.service.js')
    const referenceData = read('domain/cruiseReferenceData.js')
    const seedLoader = read('services/loadCruiseData.service.js')

    const idempotentConstraintChecks = {
      chk_bookings_booking_status: [
        'DROP CONSTRAINT IF EXISTS chk_bookings_booking_status',
        'ADD CONSTRAINT chk_bookings_booking_status'
      ],
      chk_turnaround_handoffs_status: [
        "conname = 'chk_turnaround_handoffs_status'",
        'DROP CONSTRAINT chk_turnaround_handoffs_status',
        'ADD CONSTRAINT chk_turnaround_handoffs_status'
      ],
      chk_app_roles_role_type: [
        'DROP CONSTRAINT IF EXISTS chk_app_roles_role_type',
        'UPDATE app_roles',
        "upper(replace(\"roleType\", '-', '_'))",
        "WHEN id IN ('turnaround-manager', 'housekeeping-lead', 'guest-services-lead', 'food-beverage-lead', 'engineering-lead') THEN 'OPERATIONS'",
        'ADD CONSTRAINT chk_app_roles_role_type'
      ],
      chk_app_users_status: [
        'DROP CONSTRAINT IF EXISTS chk_app_users_status',
        'ADD CONSTRAINT chk_app_users_status'
      ],
      chk_app_users_user_type: [
        'DROP CONSTRAINT IF EXISTS chk_app_users_user_type',
        'ADD CONSTRAINT chk_app_users_user_type'
      ],
      chk_app_user_roles_status: [
        'DROP CONSTRAINT IF EXISTS chk_app_user_roles_status',
        'ADD CONSTRAINT chk_app_user_roles_status'
      ],
      chk_app_user_roles_assignment_scope: [
        'DROP CONSTRAINT IF EXISTS chk_app_user_roles_assignment_scope',
        'ADD CONSTRAINT chk_app_user_roles_assignment_scope'
      ]
    }

    for (const constraintName of [
      'chk_bookings_booking_status',
      'chk_turnaround_operations_status',
      'chk_turnaround_tasks_status',
      'chk_turnaround_task_dependencies_status',
      'chk_turnaround_handoffs_status',
      'chk_turnaround_escalations_severity',
      'chk_turnaround_escalations_status',
      'chk_turnaround_signoffs_status',
      'chk_turnaround_staffing_counts',
      'chk_turnaround_dependencies_no_self_reference',
      'chk_turnaround_task_roles',
      'chk_turnaround_staffing_roles',
      'chk_turnaround_handoff_roles',
      'chk_app_roles_role_type',
      'chk_app_users_status',
      'chk_app_users_user_type',
      'chk_app_user_roles_status',
      'chk_app_user_roles_assignment_scope'
    ]) {
      const expectedFragments = idempotentConstraintChecks[constraintName] || [
        `conname = '${constraintName}'`,
        `ADD CONSTRAINT ${constraintName}`
      ]

      for (const expectedFragment of expectedFragments) {
        expect(initializer).toContain(expectedFragment)
      }
    }

    expect(initializer).toContain("CHECK (status IN ('PENDING', 'READY', 'IN_REVIEW', 'BLOCKED', 'COMPLETE'))")
    expect(initializer).toContain(`"bookingStatus" IN ('CONFIRMED', 'DEPOSIT_PAID', 'PAID_IN_FULL', 'WAITLISTED', 'CHECKED_IN')`)
    expect(initializer).toContain("ELSE 'OPERATIONS'")
    expect(initializer).toContain("END AS \"roleType\"")
    expect(seedLoader).toContain('function getNormalizedRoleType(role)')
    expect(seedLoader).toContain("return 'OPERATIONS'")
    expect(seedLoader).toContain('roleType: getNormalizedRoleType(demoUser.role)')

    expect(referenceData).toContain("'PAID_IN_FULL'")

    for (const exportedOptionSet of [
      'BOOKING_STATUS_OPTIONS',
      'OPERATIONAL_ROLE_OPTIONS',
      'TURNAROUND_OPERATION_STATUS_OPTIONS',
      'TURNAROUND_TASK_STATUS_OPTIONS',
      'TURNAROUND_DEPENDENCY_STATUS_OPTIONS',
      'TURNAROUND_HANDOFF_STATUS_OPTIONS',
      'TURNAROUND_ESCALATION_SEVERITY_OPTIONS',
      'TURNAROUND_ESCALATION_STATUS_OPTIONS',
      'TURNAROUND_SIGNOFF_STATUS_OPTIONS',
      'TASK_UPDATE_TYPE_OPTIONS'
    ]) {
      expect(referenceData).toContain(exportedOptionSet)
    }
  })


  it('adds typed date time shadow columns and indexes for production migration compatibility', () => {
    const initializer = read('services/initializeDatabase.service.js')

    for (const columnName of [
      '"departureDateValue" date',
      '"activityTimeValue" time',
      '"turnaroundDateValue" date',
      '"dueTimeValue" time',
      '"createdAtTimestamp" timestamptz',
      '"signedAtTimestamp" timestamptz',
      '"completedAtTimestamp" timestamptz'
    ]) {
      expect(initializer).toContain(columnName)
    }

    for (const backfillExpression of [
      'SET "departureDateValue" = "departureDate"::date',
      'SET "activityTimeValue" = time::time',
      'SET "turnaroundDateValue" = "turnaroundDate"::date',
      'SET "dueTimeValue" = "dueTime"::time',
      'SET "createdAtTimestamp" = "createdAt"::timestamptz',
      'SET "signedAtTimestamp" = "signedAt"::timestamptz',
      'SET "completedAtTimestamp" = "completedAt"::timestamptz'
    ]) {
      expect(initializer).toContain(backfillExpression)
    }

    for (const indexName of [
      'idx_sailings_departure_date_value',
      'idx_turnaround_operations_date_value_status',
      'idx_turnaround_tasks_due_time_value',
      'idx_turnaround_task_updates_created_timestamp',
      'idx_turnaround_escalations_created_timestamp',
      'idx_turnaround_handoffs_due_time_value'
    ]) {
      expect(initializer).toContain(`CREATE INDEX IF NOT EXISTS ${indexName}`)
    }
  })


  it('adds normalized user and role bridge tables without removing existing demo-user compatibility', () => {
    const initializer = read('services/initializeDatabase.service.js')
    const loader = read('services/loadCruiseData.service.js')
    const demoUserModel = read('models/demoUser.model.js')

    for (const tableName of [
      'CREATE TABLE IF NOT EXISTS app_users',
      'CREATE TABLE IF NOT EXISTS app_roles',
      'CREATE TABLE IF NOT EXISTS app_user_roles'
    ]) {
      expect(initializer).toContain(tableName)
    }

    for (const bridgeColumn of [
      '"normalizedUserId" varchar(40) REFERENCES app_users(id)',
      '"normalizedRoleId" varchar(50) REFERENCES app_roles(id)'
    ]) {
      expect(initializer).toContain(bridgeColumn)
    }

    expect(initializer).toContain('INSERT INTO app_roles')
    expect(initializer).toContain('INSERT INTO app_users')
    expect(initializer).toContain('INSERT INTO app_user_roles')
    expect(initializer).toContain('UPDATE demo_users')

    for (const modelName of [
      'appUserTable',
      'appRoleTable',
      'appUserRoleTable',
      'normalizedUserId',
      'normalizedRoleId'
    ]) {
      expect(loader + demoUserModel).toContain(modelName)
    }
  })

  it('adds operational user-id attribution bridges while preserving display-name compatibility', () => {
    const initializer = read('services/initializeDatabase.service.js')
    const loader = read('services/loadCruiseData.service.js')
    const controller = read('controllers/cruise.controller.js')

    for (const column of [
      '"ownerUserId" varchar(40)',
      '"authorUserId" varchar(40)',
      '"approverUserId" varchar(40)'
    ]) {
      expect(initializer).toContain(column)
    }

    for (const foreignKey of [
      'fk_turnaround_tasks_owner_user',
      'fk_turnaround_task_updates_author_user',
      'fk_turnaround_signoffs_approver_user',
      'fk_turnaround_escalations_owner_user',
      'fk_turnaround_handoffs_owner_user'
    ]) {
      expect(initializer).toContain(foreignKey)
      expect(initializer).toContain('REFERENCES app_users(id) ON DELETE SET NULL')
    }

    for (const bridgeField of [
      'ownerUserId: resolveOperationalUserId(task.ownerName, turnaroundOperation.shipName)',
      'authorUserId: resolveOperationalUserId(update.authorName, turnaroundOperation.shipName)',
      'approverUserId: resolveOperationalUserId(signoff.approverName, turnaroundOperation.shipName)',
      'ownerUserId: resolveOperationalUserId(escalation.ownerName, turnaroundOperation.shipName)',
      'ownerUserId: resolveOperationalUserId(handoff.ownerName, turnaroundOperation.shipName)'
    ]) {
      expect(loader).toContain(bridgeField)
    }

    expect(loader).toContain('function buildAppUserLookup')
    expect(controller).toContain('resolveOperationalUserIdByName')
    expect(controller).toContain('async function getAssignedShipForOperation')
    expect(controller).toContain('const exactMatches = await db')
    expect(controller).not.toContain('await dbs')
    expect(controller).toContain('ownerUserId: await resolveOperationalUserIdByName(ownerName, operation)')
    expect(controller).toContain('approverUserId: await resolveOperationalUserIdByName(approverName, operation)')
    expect(controller).toContain('authorUserId: await resolveOperationalUserIdByName(authorName, operation)')
  })




  it('returns assignment-qualified operational person display names from turnaround APIs', () => {
    const controller = read('controllers/cruise.controller.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')

    expect(controller).toContain('async function buildAppUserDisplayLookup')
    expect(controller).toContain("enrichOperationalPerson(signoff, userDisplayById, 'approverUserId', 'approverDisplayName')")
    expect(controller).toContain("enrichOperationalPerson(escalation, userDisplayById, 'ownerUserId', 'ownerDisplayName')")
    expect(controller).toContain("enrichOperationalPerson(handoff, userDisplayById, 'ownerUserId', 'ownerDisplayName')")
    expect(controller).toContain("enrichOperationalPerson(task, userDisplayById, 'ownerUserId', 'ownerDisplayName')")
    expect(controller).toContain("enrichOperationalPerson(update, userDisplayById, 'authorUserId', 'authorDisplayName')")

    expect(dashboard).toContain('function getOperationalOwnerDisplay')
    expect(dashboard).toContain('function getOperationalAuthorDisplay')
    expect(dashboard).toContain('function getOperationalApproverDisplay')
    expect(dashboard).toContain('task.ownerDisplayName || task.ownerName')
    expect(dashboard).toContain('signoff.approverDisplayName || signoff.approverName')
  })


  it('adds explicit cruise-line and ship assignment bridges for operational tenancy', () => {
    const initializer = read('services/initializeDatabase.service.js')
    const loader = read('services/loadCruiseData.service.js')
    const appUserModel = read('models/appUser.model.js')
    const appUserRoleModel = read('models/appUserRole.model.js')
    const demoUserModel = read('models/demoUser.model.js')
    const roleViewDomain = read('frontend/react/src/domain/roleView.js')

    for (const assignmentColumn of [
      '"cruiseLineId" uuid REFERENCES cruise_lines(id) ON DELETE SET NULL',
      '"assignedShipId" uuid REFERENCES ships(id) ON DELETE SET NULL',
      '"cruiseLineName" varchar(255)',
      '"assignedShipName" varchar(255)'
    ]) {
      expect(initializer).toContain(assignmentColumn)
    }

    for (const indexName of [
      'idx_app_users_cruise_line_ship',
      'idx_app_user_roles_tenant_assignment',
      'idx_demo_users_operational_assignment'
    ]) {
      expect(initializer).toContain(`CREATE INDEX IF NOT EXISTS ${indexName}`)
    }

    expect(initializer).toContain("'CRUISE_LINE'")
    expect(initializer).toContain("'SHIP'")
    expect(loader).toContain('function getOperationalAssignmentShipName')
    expect(loader).toContain('function getOperationalAssignment')
    expect(loader).toContain('shipByName.set')
    expect(loader).toContain('cruiseLineByShipName.set')
    expect(loader).toContain('assignmentScope: operationalAssignment.assignmentScope')
    expect(loader).toContain('cruiseLineId: operationalAssignment.cruiseLineId')
    expect(loader).toContain('assignedShipId: operationalAssignment.assignedShipId')

    for (const modelSource of [appUserModel, appUserRoleModel, demoUserModel]) {
      expect(modelSource).toContain('cruiseLineId')
      expect(modelSource).toContain('assignedShipId')
    }

    expect(demoUserModel).toContain('assignedShipName')
    expect(demoUserModel).toContain('cruiseLineName')
    expect(roleViewDomain).toContain('selectedDemoUser.assignedShipName')
    expect(roleViewDomain).toContain('selectedDemoUser.cruiseLineName')
  })


  it('loads turnaround operations through the selected demo-user assignment scope', () => {
    const controller = read('controllers/cruise.controller.js')
    const scopeService = read('services/turnaroundScope.service.js')
    const app = read('frontend/react/src/App.jsx')
    const hook = read('frontend/react/src/hooks/useTurnaroundOperations.js')
    const client = read('frontend/react/src/api/client.js')

    expect(controller).toContain("getTurnaroundOperationsForRequest")
    expect(scopeService).toContain('async function getTurnaroundOperationsForRequest(req)')
    expect(scopeService).toContain('const demoUser = await resolveRequestDemoUser(req)')
    expect(scopeService).toContain('getSailingIdsForOperationalAssignment')
    expect(scopeService).toContain('where(inArray(turnaroundOperationTable.sailingId, scopedSailingIds))')
    expect(app).toContain('selectedDemoUser: effectiveSelectedDemoUser')
    expect(hook).toContain('selectedDemoUser = null')
    expect(hook).toContain('getTurnaroundOperations({ signal: controller.signal, selectedDemoUser })')
    expect(hook).toContain('[selectedDemoUser?.id]')
    expect(client).toContain("'X-Cruise-Demo-User-Id': scopedDemoUserId")
    expect(client).toContain('const requestPath = path.split')
  })


  it('enforces selected demo-user assignment scope on turnaround write paths', () => {
    const controller = read('controllers/cruise.controller.js')
    const scopeService = read('services/turnaroundScope.service.js')
    const hook = read('frontend/react/src/hooks/useTurnaroundOperations.js')
    const client = read('frontend/react/src/api/client.js')

    expect(controller).toContain('canAccessTurnaroundOperationForRequest(req, operation)')
    expect(controller).toContain('sendTurnaroundOperationForbidden(res)')
    expect(scopeService).toContain('async function canAccessTurnaroundOperationForRequest(req, operation)')
    expect(scopeService).toContain('function sendTurnaroundOperationForbidden(res)')
    expect(scopeService).toContain("Selected demo user is not assigned to this turnaround operation")
    expect(scopeService).toContain('return scopedSailingIds.includes(operation.sailingId)')

    expect(client).toContain('function buildScopedApiPath(path)')
    expect(client).toContain('function getScopedRequestOptions(options = {})')
    expect(client).toContain('function buildScopedHeaders(options = {})')
    expect(client).toContain('buildScopedApiPath(`/cruise/turnaround-operations/${encodeURIComponent(operationId)}`, options)')
    expect(client).toContain('buildScopedApiPath(`/cruise/turnaround-tasks/${encodeURIComponent(taskId)}/status`, options)')
    expect(client).toContain('buildScopedApiPath(`/cruise/turnaround-handoffs/${encodeURIComponent(handoffId)}`, options)')

    expect(hook).toContain('const mutationScope = { selectedDemoUser }')
    expect(hook).toContain('updateTurnaroundOperationCommand(operationId, payload, mutationScope)')
    expect(hook).toContain('updateTurnaroundTaskStatus(taskId, status, { ...options, ...mutationScope })')
    expect(hook).toContain('deleteTurnaroundTask(taskId, mutationScope)')
  })


  it('abstracts demo identity away from turnaround query strings before real auth is added', () => {
    const app = read('app.js')
    const middleware = read('middleware/requestIdentity.middleware.js')
    const controller = read('controllers/cruise.controller.js')
    const scopeService = read('services/turnaroundScope.service.js')
    const client = read('frontend/react/src/api/client.js')

    expect(app).toContain("const { attachRequestIdentity } = require('./middleware/requestIdentity.middleware')")
    expect(app).toContain('app.use(attachRequestIdentity)')
    expect(middleware).toContain("'X-Cruise-Demo-User-Id'")
    expect(middleware).toContain('function buildRequestIdentity(req = {})')
    expect(middleware).toContain('function getScopedDemoUserId(req)')
    expect(middleware).toContain("identitySource: headerDemoUserId ? 'header' : queryDemoUserId ? 'query' : 'anonymous'")
    expect(controller).toContain("require('../services/turnaroundScope.service')")
    expect(scopeService).toContain("const { getScopedDemoUserId } = require('../middleware/requestIdentity.middleware')")
    expect(scopeService).toContain('const demoUserId = getScopedDemoUserId(req)')
    expect(client).toContain('function buildScopedHeaders(options = {})')
    expect(client).toContain("'X-Cruise-Demo-User-Id': scopedDemoUserId")
    expect(client).toContain("requestJson('/cruise/turnaround-operations', getScopedRequestOptions(options))")
  })


  it('adds an append-only audit event bridge for production traceability', () => {
    const initializer = read('services/initializeDatabase.service.js')
    const modelsIndex = read('models/index.js')
    const auditModel = read('models/auditEvent.model.js')
    const auditService = read('services/auditEvent.service.js')
    const hardeningPlan = read('docs/data-architecture-hardening.md')

    expect(initializer).toContain('CREATE TABLE IF NOT EXISTS audit_events')

    for (const auditColumn of [
      '"eventType" varchar(100) NOT NULL',
      '"entityType" varchar(100) NOT NULL',
      '"entityId" varchar(100) NOT NULL',
      '"actorUserId" varchar(40) REFERENCES app_users(id) ON DELETE SET NULL',
      '"cruiseLineId" uuid REFERENCES cruise_lines(id) ON DELETE SET NULL',
      '"shipId" uuid REFERENCES ships(id) ON DELETE SET NULL',
      '"sailingId" uuid REFERENCES sailings(id) ON DELETE SET NULL',
      '"operationId" uuid REFERENCES turnaround_operations(id) ON DELETE SET NULL',
      '"eventPayload" text',
      '"createdAt" varchar(40) NOT NULL'
    ]) {
      expect(initializer).toContain(auditColumn)
    }

    for (const indexName of [
      'idx_audit_events_created_at',
      'idx_audit_events_entity',
      'idx_audit_events_actor',
      'idx_audit_events_tenant_scope',
      'idx_audit_events_operation'
    ]) {
      expect(initializer).toContain(`CREATE INDEX IF NOT EXISTS ${indexName}`)
    }

    expect(auditModel).toContain("pgTable('audit_events'")
    expect(auditModel).toContain('actorUserId')
    expect(auditModel).toContain('eventPayload')
    expect(modelsIndex).toContain("const auditEventTable = require('./auditEvent.model')")
    expect(modelsIndex).toContain('auditEventTable')
    expect(auditService).toContain('function buildAuditEventValues')
    expect(auditService).toContain('async function recordAuditEvent')
    expect(auditService).toContain('db.insert(auditEventTable).values(values)')
    expect(auditService).toContain('Audit event type is required.')
    expect(hardeningPlan).toContain('Audit Event Bridge')
    expect(hardeningPlan).toContain('audit_events')
    expect(hardeningPlan).toContain('append-only')
  })

  it('wires turnaround mutation endpoints to production audit events', () => {
    const controller = read('controllers/cruise.controller.js')
    const scopeService = read('services/turnaroundScope.service.js')

    expect(controller).toContain("const { listAuditEventsForOperation, recordAuditEvent } = require('../services/auditEvent.service')")
    expect(controller).toContain('async function recordTurnaroundAuditEvent(req, operation, event)')
    expect(controller).toContain('buildTurnaroundAuditContext(req, operation)')
    expect(scopeService).toContain('async function buildTurnaroundAuditContext(req, operation = {})')
    expect(scopeService).toContain("source: TURNAROUND_AUDIT_SOURCE")
    expect(scopeService).toContain('actorUserId: demoUser?.normalizedUserId || null')
    expect(scopeService).toContain('cruiseLineId: scope.cruiseLineId || null')

    for (const eventType of [
      'TURNAROUND_COMMAND_UPDATED',
      'TURNAROUND_TASK_STATUS_UPDATED',
      'TURNAROUND_TASK_DETAILS_UPDATED',
      'TURNAROUND_TASK_CREATED',
      'TURNAROUND_TASK_UPDATE_CREATED',
      'TURNAROUND_TASK_DELETED',
      'TURNAROUND_STAFFING_UPDATED',
      'TURNAROUND_SIGNOFF_UPDATED',
      'TURNAROUND_ESCALATION_CREATED',
      'TURNAROUND_ESCALATION_UPDATED',
      'TURNAROUND_HANDOFF_UPDATED'
    ]) {
      expect(controller).toContain(`eventType: '${eventType}'`)
    }

    for (const entityType of [
      'TURNAROUND_OPERATION',
      'TURNAROUND_TASK',
      'TURNAROUND_STAFFING',
      'TURNAROUND_SIGNOFF',
      'TURNAROUND_ESCALATION',
      'TURNAROUND_HANDOFF'
    ]) {
      expect(controller).toContain(`entityType: '${entityType}'`)
    }
  })


  it('exposes scoped turnaround audit history for production traceability review', () => {
    const routes = read('routes/cruise.routes.js')
    const controller = read('controllers/cruise.controller.js')
    const auditService = read('services/auditEvent.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const client = read('frontend/react/src/api/client.js')

    expect(routes).toContain("'/turnaround-operations/:id/audit-events'")
    expect(routes).toContain('cruiseController.getTurnaroundOperationAuditEvents')
    expect(controller).toContain('exports.getTurnaroundOperationAuditEvents')
    expect(controller).toContain('canAccessTurnaroundOperationForRequest(req, operation)')
    expect(controller).toContain('listAuditEventsForOperation(operation.id')
    expect(controller).toContain('auditEvents: await listAuditEventsForOperation(operation.id, { limit: 8 })')
    expect(auditService).toContain('async function listAuditEventsForOperation(operationId')
    expect(auditService).toContain('function mapAuditEvent(row = {})')
    expect(auditService).toContain('function parseAuditPayload(eventPayload)')
    expect(auditService).toContain('orderBy(desc(auditEventTable.createdAt))')
    expect(client).toContain('export async function getTurnaroundOperationAuditEvents(operationId, options = {})')
    expect(dashboard).toContain('data-testid="react-operations-audit-trail"')
    expect(dashboard).toContain('formatAuditEventType(event.eventType)')
    expect(dashboard).toContain('selectedOperation.auditEvents.slice(0, 6).map')
  })

  it('documents the remaining production-scale data architecture roadmap', () => {
    const hardeningPlan = read('docs/data-architecture-hardening.md')

    expect(hardeningPlan).toContain('Query Indexing Baseline')
    expect(hardeningPlan).toContain('proper `date`, `time`, and `timestamp` columns')
    expect(hardeningPlan).toContain('Normalize users, crew members, operational roles, and departments')
    expect(hardeningPlan).toContain('tenant/cruise-line boundaries')
    expect(hardeningPlan).toContain('append-only audit/event history')
    expect(hardeningPlan).toContain('Reference Data and Database Constraints')
    expect(hardeningPlan).toContain('database checks keeps operational dashboards')
    expect(hardeningPlan).toContain('Typed Date and Time Migration Bridge')
    expect(hardeningPlan).toContain('typed shadow columns')
    expect(hardeningPlan).toContain('Normalized User and Role Bridge')
    expect(hardeningPlan).toContain('app_users')
    expect(hardeningPlan).toContain('app_roles')
    expect(hardeningPlan).toContain('Operational Ownership Attribution Bridge')
    expect(hardeningPlan).toContain('ownerUserId')
    expect(hardeningPlan).toContain('approverUserId')
  })
})
