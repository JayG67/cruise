const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function readReactCssBundle() {
  const stylesRoot = path.join(projectRoot, 'frontend/react/src/styles')
  const cssFiles = []

  function collectCssFiles(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        collectCssFiles(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.css')) {
        cssFiles.push(fullPath)
      }
    }
  }

  collectCssFiles(stylesRoot)

  return cssFiles
    .sort()
    .map((filePath) => fs.readFileSync(filePath, 'utf8'))
    .join('\n')
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
      'idx_itinerary_days_updated',
      'idx_activity_schedules_itinerary_day',
      'idx_activity_schedules_updated',
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
      '"assignedShipName" varchar(255)',
      '"assignedSailingId" uuid REFERENCES sailings(id) ON DELETE SET NULL'
    ]) {
      expect(initializer).toContain(assignmentColumn)
    }

    for (const indexName of [
      'idx_app_users_cruise_line_ship',
      'idx_app_user_roles_tenant_assignment',
      'idx_demo_users_operational_assignment',
      'idx_demo_users_turnaround_sailing_assignment'
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
    expect(demoUserModel).toContain('assignedSailingId')
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
    expect(middleware).toContain('function buildProductionPrincipal(req = {})')
    expect(middleware).toContain("'X-Cruise-User-Id'")
    expect(middleware).toContain("identitySource: principal ? 'principal-header' : headerDemoUserId ? 'header' : queryDemoUserId ? 'query' : 'anonymous'")
    expect(controller).toContain("require('../services/turnaroundScope.service')")
    expect(scopeService).toContain("const { getScopedDemoUserId } = require('../middleware/requestIdentity.middleware')")
    expect(scopeService).toContain('const demoUserId = getScopedDemoUserId(req)')
    expect(client).toContain('function buildScopedHeaders(options = {})')
    expect(client).toContain("'X-Cruise-Demo-User-Id': scopedDemoUserId")
    expect(client).toContain("requestJson('/cruise/turnaround-operations', getScopedRequestOptions(options))")
  })


  it('creates a production authorization seam before replacing demo identity', () => {
    const middleware = read('middleware/requestIdentity.middleware.js')
    const authorizationService = read('services/requestAuthorization.service.js')
    const controller = read('controllers/cruise.controller.js')
    const platformAuditService = read('services/platformAudit.service.js')
    const turnaroundScopeService = read('services/turnaroundScope.service.js')

    expect(middleware).toContain('function buildProductionPrincipal(req = {})')
    expect(middleware).toContain("'X-Cruise-User-Role'")
    expect(middleware).toContain("'X-Cruise-Tenant-Id'")
    expect(authorizationService).toContain('async function resolveRequestActor(req = {})')
    expect(authorizationService).toContain('async function requireAdminRequest(req, res)')
    expect(authorizationService).toContain('function getProductionPrincipal(req = {})')
    expect(controller).toContain("const { requireAdminRequest } = require('../services/requestAuthorization.service')")
    expect(controller).toContain('if (!(await requireAdminRequest(req, res))) return')
    expect(platformAuditService).toContain("const { resolveRequestActor } = require('./requestAuthorization.service')")
    expect(turnaroundScopeService).toContain("const { resolveRequestActor } = require('./requestAuthorization.service')")
    expect(turnaroundScopeService).toContain('const actor = await resolveRequestActor(req)')
  })


  it('adds an append-only audit event bridge for production traceability', () => {
    const initializer = read('services/initializeDatabase.service.js')
    const modelsIndex = read('models/index.js')
    const auditModel = read('models/auditEvent.model.js')
    const auditService = read('services/auditEvent.service.js')

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
  })

  it('wires turnaround mutation endpoints to production audit events', () => {
    const controller = read('controllers/cruise.controller.js')
    const scopeService = read('services/turnaroundScope.service.js')

    expect(controller).toContain("recordAuditEvent } = require('../services/auditEvent.service')")
    expect(controller).toContain('listAuditEventsForOperation')
    expect(controller).toContain('async function recordTurnaroundAuditEvent(req, operation, event)')
    expect(controller).toContain('buildTurnaroundAuditContext(req, operation)')
    expect(scopeService).toContain('async function buildTurnaroundAuditContext(req, operation = {})')
    expect(scopeService).toContain("source: TURNAROUND_AUDIT_SOURCE")
    expect(scopeService).toContain('actorUserId: actor.actorUserId || null')
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


  it('extends production audit coverage across fleet, customer, and booking mutations', () => {
    const controller = read('controllers/cruise.controller.js')
    const platformAuditService = read('services/platformAudit.service.js')

    expect(controller).toContain("require('../services/platformAudit.service')")
    expect(controller).toContain('async function recordCruiseManagementAuditEvent(req, event)')
    expect(controller).toContain('recordPlatformAuditEvent(req, event)')
    expect(platformAuditService).toContain("const PLATFORM_AUDIT_SOURCE = 'PLATFORM_ADMIN_API'")
    expect(platformAuditService).toContain('async function resolvePlatformAuditActor(req)')
    expect(platformAuditService).toContain('async function getShipAuditScope(shipId)')
    expect(platformAuditService).toContain('async function getSailingAuditScope(sailingOrId)')
    expect(platformAuditService).toContain('async function getBookingAuditScope(bookingOrId)')
    expect(platformAuditService).toContain('source: PLATFORM_AUDIT_SOURCE')
    expect(platformAuditService).toContain("userType: 'SYSTEM'")
    expect(platformAuditService).not.toContain("userType: 'PLATFORM'")

    for (const eventType of [
      'CRUISE_LINE_CREATED',
      'CRUISE_LINE_UPDATED',
      'CRUISE_LINE_DELETED',
      'SHIP_CREATED',
      'SHIP_UPDATED',
      'SHIP_DELETED',
      'SAILING_CREATED',
      'SAILING_UPDATED',
      'SAILING_DELETED',
      'CUSTOMER_CREATED',
      'CUSTOMER_UPDATED',
      'CUSTOMER_DELETED',
      'BOOKING_CREATED',
      'BOOKING_UPDATED',
      'BOOKING_DELETED',
      'BOOKING_PASSENGER_ADDED',
      'BOOKING_PASSENGER_REMOVED'
    ]) {
      expect(controller).toContain(`eventType: '${eventType}'`)
    }

    for (const entityType of [
      'CRUISE_LINE',
      'SHIP',
      'SAILING',
      'CUSTOMER',
      'BOOKING',
      'BOOKING_PASSENGER'
    ]) {
      expect(controller).toContain(`entityType: '${entityType}'`)
    }
  })




  it('hardens core fleet, customer, and booking entities with UUID bridges, timestamps, and rich audit payloads', () => {
    const initializer = read('services/initializeDatabase.service.js')
    const controller = read('controllers/cruise.controller.js')
    const auditModel = read('models/auditEvent.model.js')
    const auditService = read('services/auditEvent.service.js')
    const entityHistoryService = read('services/entityHistory.service.js')
    const customerModel = read('models/customer.model.js')
    const bookingModel = read('models/booking.model.js')
    const sailingModel = read('models/sailing.model.js')
    const shipModel = read('models/ship.model.js')
    const cruiseLineModel = read('models/cruiseline.model.js')

    for (const column of [
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS "customerUuid" uuid DEFAULT gen_random_uuid()',
      'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "bookingUuid" uuid DEFAULT gen_random_uuid()',
      'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "createdByUserId" varchar(40) REFERENCES app_users(id) ON DELETE SET NULL',
      'ALTER TABLE cruise_lines ADD COLUMN IF NOT EXISTS "createdAt" varchar(40)',
      'ALTER TABLE ships ADD COLUMN IF NOT EXISTS "createdAt" varchar(40)',
      'ALTER TABLE sailings ADD COLUMN IF NOT EXISTS "createdAt" varchar(40)',
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS "createdAt" varchar(40)',
      'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "createdAt" varchar(40)',
      'ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz'
    ]) {
      expect(initializer).toContain(column)
    }

    for (const indexName of [
      'idx_customers_customer_uuid',
      'idx_bookings_booking_uuid',
      'idx_customers_updated_timestamp',
      'idx_bookings_updated_timestamp',
      'idx_bookings_created_by_user',
      'idx_cruise_lines_updated_timestamp',
      'idx_ships_updated_timestamp',
      'idx_sailings_updated_timestamp',
      'idx_audit_events_created_timestamp'
    ]) {
      expect(initializer).toContain(`CREATE ${indexName.includes('_uuid') ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${indexName}`)
    }

    for (const modelSource of [customerModel, bookingModel, sailingModel, shipModel, cruiseLineModel]) {
      expect(modelSource).toContain('createdAt: varchar({ length: 40 })')
      expect(modelSource).toContain('updatedAtTimestamp: timestamp({ withTimezone: true })')
    }

    expect(customerModel).toContain('customerUuid: uuid().defaultRandom()')
    expect(bookingModel).toContain('bookingUuid: uuid().defaultRandom()')
    expect(bookingModel).toContain('createdByUserId')
    expect(auditModel).toContain('createdAtTimestamp: timestamp({ withTimezone: true })')
    expect(auditService).toContain('createdAtTimestamp = new Date(createdAt)')
    expect(entityHistoryService).toContain('function buildChangedFields')
    expect(entityHistoryService).toContain('function buildEntityHistoryPayload')
    expect(entityHistoryService).toContain('function buildEntityLifecycleTimestamps')
    expect(entityHistoryService).toContain('function buildEntityUpdateTimestamp')

    for (const controllerFragment of [
      'buildEntityHistoryPayload({',
      'buildEntityLifecycleTimestamps()',
      'buildEntityUpdateTimestamp()',
      'resolvePlatformAuditActor(req)',
      'createdByUserId: platformActor.actorUserId',
      "metadata: { operation: 'create' }",
      "metadata: { operation: 'update' }",
      "metadata: { operation: 'delete' }",
      'changedFields'
    ]) {
      expect(controller + entityHistoryService).toContain(controllerFragment)
    }
  })


  it('hardens itinerary administration with timestamps and audit events', () => {
    const initializer = read('services/initializeDatabase.service.js')
    const controller = read('controllers/cruise.controller.js')
    const itineraryDayModel = read('models/itineraryDay.model.js')
    const activityScheduleModel = read('models/activitySchedule.model.js')
    const integration = read('tests/integration/sailings.integration.test.js')

    for (const column of [
      'ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS "createdAt" varchar(40)',
      'ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz',
      'ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40)',
      'ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz',
      'ALTER TABLE activity_schedules ADD COLUMN IF NOT EXISTS "createdAt" varchar(40)',
      'ALTER TABLE activity_schedules ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz',
      'ALTER TABLE activity_schedules ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40)',
      'ALTER TABLE activity_schedules ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz'
    ]) {
      expect(initializer).toContain(column)
    }

    for (const indexName of [
      'idx_itinerary_days_updated',
      'idx_activity_schedules_updated'
    ]) {
      expect(initializer).toContain(`CREATE INDEX IF NOT EXISTS ${indexName}`)
    }

    expect(itineraryDayModel).toContain('createdAtTimestamp: timestamp({ withTimezone: true })')
    expect(itineraryDayModel).toContain('updatedAtTimestamp: timestamp({ withTimezone: true })')
    expect(activityScheduleModel).toContain('createdAtTimestamp: timestamp({ withTimezone: true })')
    expect(activityScheduleModel).toContain('updatedAtTimestamp: timestamp({ withTimezone: true })')
    expect(controller).toContain('function buildTimestampBridgeValues')
    expect(controller).toContain('function buildTimestampUpdateValues')
    expect(controller).toContain('async function getItineraryDayAuditScope')

    for (const eventType of [
      'ITINERARY_DAY_CREATED',
      'ITINERARY_DAY_UPDATED',
      'ITINERARY_DAY_DELETED',
      'ITINERARY_ACTIVITY_CREATED',
      'ITINERARY_ACTIVITY_UPDATED',
      'ITINERARY_ACTIVITY_DELETED'
    ]) {
      expect(controller).toContain(`eventType: '${eventType}'`)
    }

    for (const entityType of [
      'ITINERARY_DAY',
      'ITINERARY_ACTIVITY'
    ]) {
      expect(controller).toContain(`entityType: '${entityType}'`)
    }

    expect(integration).toContain('records itinerary administration audit events with scoped sailing context')
    expect(integration).toContain('/cruise/audit-events?entityType=ITINERARY_DAY')
    expect(integration).toContain('/cruise/audit-events?entityType=ITINERARY_ACTIVITY')
  })

  it('hardens passenger self-service data with timestamps and audit events', () => {
    const initializer = read('services/initializeDatabase.service.js')
    const controller = read('controllers/cruise.controller.js')
    const checklistModel = read('models/customerPreCruiseChecklist.model.js')
    const favoriteModel = read('models/customerItineraryFavorite.model.js')
    const bookingPassengerModel = read('models/bookingPassenger.model.js')

    for (const column of [
      'ALTER TABLE booking_passengers ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40)',
      'ALTER TABLE booking_passengers ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz',
      'ALTER TABLE customer_itinerary_favorites ADD COLUMN IF NOT EXISTS "createdAt" varchar(40)',
      'ALTER TABLE customer_itinerary_favorites ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz',
      'ALTER TABLE customer_pre_cruise_checklists ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40)',
      'ALTER TABLE customer_pre_cruise_checklists ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz'
    ]) {
      expect(initializer).toContain(column)
    }

    for (const indexName of [
      'idx_customer_itinerary_favorites_customer_created',
      'idx_customer_pre_cruise_checklists_updated',
      'idx_booking_passengers_customer_updated'
    ]) {
      expect(initializer).toContain(`CREATE INDEX IF NOT EXISTS ${indexName}`)
    }

    expect(checklistModel).toContain('updatedAt: varchar({ length: 40 })')
    expect(favoriteModel).toContain('createdAt: varchar({ length: 40 })')
    expect(bookingPassengerModel).toContain('updatedAt: varchar({ length: 40 })')
    expect(controller).toContain('function buildChecklistStorageValues')
    expect(controller).toContain('async function getActivityAuditScope(activityScheduleId)')
    expect(controller).toContain('async function refreshPassengerPreferenceTimestamp(customerId)')
    expect(controller).toContain('async function refreshPreCruiseChecklistTimestamp(customerId)')
    expect(controller).toContain('async function refreshItineraryFavoriteTimestamp(favoriteId)')

    for (const eventType of [
      'PASSENGER_PROFILE_UPDATED',
      'PASSENGER_CHECKLIST_UPDATED',
      'PASSENGER_BOOKING_PREFERENCES_UPDATED',
      'PASSENGER_ITINERARY_FAVORITE_SAVED',
      'PASSENGER_ITINERARY_FAVORITE_REMOVED'
    ]) {
      expect(controller).toContain(`eventType: '${eventType}'`)
    }

    for (const entityType of [
      'CUSTOMER_PRE_CRUISE_CHECKLIST',
      'CUSTOMER_ITINERARY_FAVORITE'
    ]) {
      expect(controller).toContain(`entityType: '${entityType}'`)
    }
  })


  it('exposes scoped turnaround audit history for production traceability review', () => {
    const routes = read('routes/cruise.routes.js')
    const controller = read('controllers/cruise.controller.js')
    const auditService = read('services/auditEvent.service.js')
    const authorizationService = read('services/requestAuthorization.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const client = read('frontend/react/src/api/client.js')

    expect(routes).toContain("'/turnaround-operations/:id/audit-events'")
    expect(routes).toContain('cruiseController.getTurnaroundOperationAuditEvents')
    expect(controller).toContain('exports.getTurnaroundOperationAuditEvents')
    expect(controller).toContain('canAccessTurnaroundOperationForRequest(req, operation)')
    expect(controller).toContain('listAuditEventsForOperation(operation.id')
    expect(controller).toContain('const auditEvents = await listAuditEventsForOperation(operation.id, { limit: 8 })')
    expect(controller).toContain('releasePacket,')
    expect(controller).toContain('auditEvents,')
    expect(auditService).toContain('async function listAuditEventsForOperation(operationId')
    expect(auditService).toContain('function mapAuditEvent(row = {})')
    expect(auditService).toContain('function parseAuditPayload(eventPayload)')
    expect(auditService).toContain('orderBy(desc(auditEventTable.createdAt))')
    expect(client).toContain('export async function getTurnaroundOperationAuditEvents(operationId, options = {})')
    expect(dashboard).toContain('data-testid="react-operations-audit-trail"')
    expect(dashboard).toContain('formatAuditEventType(event.eventType)')
    expect(dashboard).toContain('selectedOperation.auditEvents.slice(0, 6).map')
  })


  it('adds a production turnaround release packet for final embarkation readiness', () => {
    const controller = read('controllers/cruise.controller.js')
    const releaseService = read('services/turnaroundRelease.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundReleasePacket } = require('../services/turnaroundRelease.service')")
    expect(controller).toContain('const releasePacket = buildTurnaroundReleasePacket({')
    expect(controller).toContain('releasePacket,')
    expect(releaseService).toContain('function buildTurnaroundReleasePacket')
    expect(releaseService).toContain('const releaseStatus =')
    expect(releaseService).toContain("id: 'audit'")
    expect(dashboard).toContain('data-testid="react-operations-release-packet"')
    expect(dashboard).toContain('data-testid="react-operations-release-packet-checklist"')
    expect(dashboard).toContain('selectedOperation.releasePacket.releaseRecommendation')
    expect(styles).toContain('.operations-release-packet')
  })


  it('adds turnaround operational analytics for release-day performance review', () => {
    const controller = read('controllers/cruise.controller.js')
    const metricsService = read('services/turnaroundMetrics.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundOperationalMetrics } = require('../services/turnaroundMetrics.service')")
    expect(controller).toContain('const operationalMetrics = buildTurnaroundOperationalMetrics({')
    expect(controller).toContain('operationalMetrics,')
    expect(metricsService).toContain('function buildTurnaroundOperationalMetrics')
    expect(metricsService).toContain('releaseConfidence')
    expect(metricsService).toContain('riskIndex')
    expect(metricsService).toContain('departmentMetrics')
    expect(metricsService).toContain('bottleneckDepartment')
    expect(dashboard).toContain('data-testid="react-operations-metrics"')
    expect(dashboard).toContain('selectedOperation.operationalMetrics.signals')
    expect(dashboard).toContain('Department risk ranking')
    expect(styles).toContain('.operations-metrics')
    expect(styles).toContain('.operations-metrics-signal-grid')
  })


  it('adds a unified turnaround operational timeline for release-day command review', () => {
    const controller = read('controllers/cruise.controller.js')
    const timelineService = read('services/turnaroundTimeline.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundOperationalTimeline } = require('../services/turnaroundTimeline.service')")
    expect(controller).toContain('const operationalTimeline = buildTurnaroundOperationalTimeline({')
    expect(controller).toContain('operationalTimeline,')
    expect(timelineService).toContain('function buildTurnaroundOperationalTimeline')
    expect(timelineService).toContain("source: 'TASK_UPDATE'")
    expect(timelineService).toContain("source: 'SIGNOFF'")
    expect(timelineService).toContain("source: 'ESCALATION'")
    expect(timelineService).toContain("source: 'AUDIT'")
    expect(timelineService).toContain('criticalCount')
    expect(dashboard).toContain('data-testid="react-operations-timeline"')
    expect(dashboard).toContain('selectedOperation.operationalTimeline.items.slice(0, 10).map')
    expect(dashboard).toContain('formatOperationalTimelineSource(item.source)')
    expect(styles).toContain('.operations-timeline')
    expect(styles).toContain('.operations-timeline-item')
  })


  it('adds reusable turnaround playbook templates for repeatable operations planning', () => {
    const controller = read('controllers/cruise.controller.js')
    const playbookService = read('services/turnaroundPlaybook.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundPlaybookTemplate } = require('../services/turnaroundPlaybook.service')")
    expect(controller).toContain('const playbookTemplate = buildTurnaroundPlaybookTemplate({')
    expect(controller).toContain('playbookTemplate,')
    expect(playbookService).toContain('function buildTurnaroundPlaybookTemplate')
    expect(playbookService).toContain('templateReadinessScore')
    expect(playbookService).toContain('departmentPlaybooks')
    expect(playbookService).toContain('exceptionRules')
    expect(playbookService).toContain('nextBestActions')
    expect(dashboard).toContain('data-testid="react-operations-playbook-template"')
    expect(dashboard).toContain('selectedOperation.playbookTemplate.departmentPlaybooks')
    expect(dashboard).toContain('Template readiness')
    expect(styles).toContain('.operations-playbook')
    expect(styles).toContain('.operations-playbook-grid')
  })


  it('adds playbook variance rehearsal scoring for live turnaround execution comparison', () => {
    const controller = read('controllers/cruise.controller.js')
    const varianceService = read('services/turnaroundVariance.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundPlaybookVariance } = require('../services/turnaroundVariance.service')")
    expect(controller).toContain('const playbookVariance = buildTurnaroundPlaybookVariance({')
    expect(controller).toContain('playbookVariance,')
    expect(varianceService).toContain('function buildTurnaroundPlaybookVariance')
    expect(varianceService).toContain('function buildDepartmentVariances')
    expect(varianceService).toContain('rehearsalScore')
    expect(varianceService).toContain('departmentVariances')
    expect(varianceService).toContain('rehearsalActions')
    expect(dashboard).toContain('data-testid="react-operations-playbook-variance"')
    expect(dashboard).toContain('selectedOperation.playbookVariance.departmentVariances')
    expect(dashboard).toContain('Live execution versus template baseline')
    expect(styles).toContain('.operations-playbook-variance')
    expect(styles).toContain('.operations-playbook-variance-grid')
  })


  it('adds turnaround incident command bridging for release-day exception management', () => {
    const controller = read('controllers/cruise.controller.js')
    const incidentService = read('services/turnaroundIncident.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundIncidentCommand } = require('../services/turnaroundIncident.service')")
    expect(controller).toContain('const incidentCommand = buildTurnaroundIncidentCommand({')
    expect(controller).toContain('incidentCommand,')
    expect(incidentService).toContain('function buildTurnaroundIncidentCommand')
    expect(incidentService).toContain('function buildIncidentSignals')
    expect(incidentService).toContain('incidentScore')
    expect(incidentService).toContain('incidentSignals')
    expect(incidentService).toContain('commandActions')
    expect(dashboard).toContain('data-testid="react-operations-incident-command"')
    expect(dashboard).toContain('selectedOperation.incidentCommand.incidentSignals')
    expect(dashboard).toContain('Release-day exception bridge')
    expect(styles).toContain('.operations-incident-command')
    expect(styles).toContain('.operations-incident-command-grid')
  })


  it('adds turnaround after-action review for post-operation production debriefs', () => {
    const controller = read('controllers/cruise.controller.js')
    const afterActionService = read('services/turnaroundAfterAction.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundAfterActionReview } = require('../services/turnaroundAfterAction.service')")
    expect(controller).toContain('const afterActionReview = buildTurnaroundAfterActionReview({')
    expect(controller).toContain('afterActionReview,')
    expect(afterActionService).toContain('function buildTurnaroundAfterActionReview')
    expect(afterActionService).toContain('buildDepartmentLessons')
    expect(afterActionService).toContain('buildAfterActionFindings')
    expect(afterActionService).toContain('followUpActions')
    expect(afterActionService).toContain('reviewStatus')
    expect(dashboard).toContain('data-testid="react-operations-after-action-review"')
    expect(dashboard).toContain('selectedOperation.afterActionReview.findings')
    expect(dashboard).toContain('Turnaround debrief and promotion readiness')
    expect(styles).toContain('.operations-after-action')
    expect(styles).toContain('.operations-after-action [class*="grid"]')
  })


  it('adds turnaround shift briefing for next-shift handoff readiness', () => {
    const controller = read('controllers/cruise.controller.js')
    const shiftBriefingService = read('services/turnaroundShiftBriefing.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundShiftBriefing } = require('../services/turnaroundShiftBriefing.service')")
    expect(controller).toContain('const shiftBriefing = buildTurnaroundShiftBriefing({')
    expect(controller).toContain('shiftBriefing,')
    expect(shiftBriefingService).toContain('function buildTurnaroundShiftBriefing')
    expect(shiftBriefingService).toContain('buildBriefingCriticalItems')
    expect(shiftBriefingService).toContain('buildDepartmentBriefs')
    expect(shiftBriefingService).toContain('handoffStatus')
    expect(dashboard).toContain('data-testid="react-operations-shift-briefing"')
    expect(dashboard).toContain('selectedOperation.shiftBriefing.criticalItems')
    expect(dashboard).toContain('Next-shift command handoff')
    expect(styles).toContain('.operations-shift-briefing')
    expect(styles).toContain('.operations-shift-briefing-grid')
  })


  it('adds turnaround go-live center for final launch readiness', () => {
    const controller = read('controllers/cruise.controller.js')
    const goLiveService = read('services/turnaroundGoLive.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const selectors = read('cypress/react/support/reactSelectors.js')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundGoLiveCenter } = require('../services/turnaroundGoLive.service')")
    expect(controller).toContain('const goLiveCenter = buildTurnaroundGoLiveCenter({')
    expect(controller).toContain('goLiveCenter,')
    expect(goLiveService).toContain('function buildTurnaroundGoLiveCenter')
    expect(goLiveService).toContain('buildGoLiveGates')
    expect(goLiveService).toContain('launchRecommendation')
    expect(dashboard).toContain('data-testid="react-operations-go-live-center"')
    expect(dashboard).toContain('selectedOperation.goLiveCenter.gates')
    expect(dashboard).toContain('Launch decision, remaining scope, and deployment proof')
    expect(selectors).toContain("operationsGoLiveCenter: 'react-operations-go-live-center'")
    expect(styles).toContain('.operations-go-live-center')
    expect(styles).toContain('.operations-go-live-center [class*="grid"]')
  })



  it('adds turnaround operations control board for consolidated command-and-control', () => {
    const controller = read('controllers/cruise.controller.js')
    const controlBoardService = read('services/turnaroundOperationsControlBoard.service.js')
    const roleView = read('frontend/react/src/domain/roleView.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const selectors = read('cypress/react/support/reactSelectors.js')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundOperationsControlBoard } = require('../services/turnaroundOperationsControlBoard.service')")
    expect(controller).toContain('const operationsControlBoard = buildTurnaroundOperationsControlBoard({')
    expect(controller).toContain('operationsControlBoard,')
    expect(controlBoardService).toContain('function buildTurnaroundOperationsControlBoard')
    expect(controlBoardService).toContain('buildControlLanes')
    expect(controlBoardService).toContain('goNoGoStatus')
    expect(roleView).toContain('operationsControlBoard: operation.operationsControlBoard || null')
    expect(dashboard).toContain('data-testid="react-operations-control-board"')
    expect(dashboard).toContain('selectedOperation.operationsControlBoard.lanes')
    expect(dashboard).toContain('Unified command view for readiness, blockers, continuity, shift priorities, and go/no-go')
    expect(selectors).toContain("operationsControlBoard: 'react-operations-control-board'")
    expect(styles).toContain('.operations-control-board')
    expect(styles).toContain('.operations-control-board [class*="grid"]')
  })

  it('exposes admin-scoped platform audit history for production review', () => {
    const routes = read('routes/cruise.routes.js')
    const controller = read('controllers/cruise.controller.js')
    const auditService = read('services/auditEvent.service.js')
    const authorizationService = read('services/requestAuthorization.service.js')
    const client = read('frontend/react/src/api/client.js')
    const sqaConsole = read('frontend/react/src/components/ReactSqaConsole.jsx')
    const app = read('frontend/react/src/App.jsx')

    expect(routes).toContain("'/audit-events'")
    expect(routes).toContain('cruiseController.getPlatformAuditEvents')
    expect(controller).toContain('exports.getPlatformAuditEvents')
    expect(controller).toContain("const { requireAdminRequest } = require('../services/requestAuthorization.service')")
    expect(controller).toContain('if (!(await requireAdminRequest(req, res))) return')
    expect(authorizationService).toContain('const ADMIN_FORBIDDEN_MESSAGE')
    expect(authorizationService).toContain('Admin access requires an admin request identity.')
    expect(authorizationService).toContain('async function requireAdminRequest(req, res)')
    expect(authorizationService).toContain('async function isAdminRequest(req = {})')
    expect(controller).toContain('listAuditEvents(buildAuditEventFilters(req.query)')
    expect(auditService).toContain('async function listAuditEvents(filters = {}, { limit = 25 } = {})')
    expect(auditService).toContain('entityType: auditEventTable.entityType')
    expect(auditService).toContain('source: auditEventTable.source')
    expect(client).toContain('export async function getPlatformAuditEvents(filters = {}, options = {})')
    expect(client).toContain("requestPath === '/cruise/audit-events'")
    expect(app).toContain('selectedDemoUser={selectedDemoUser}')
    expect(sqaConsole).toContain("testId: 'react-sqa-audit-history-button'")
    expect(sqaConsole).toContain("title: 'Audit History Review'")
    expect(sqaConsole).toContain('getPlatformAuditEvents({ limit: 25 }, { selectedDemoUser })')
  })

  it('documents the remaining production-scale data architecture roadmap', () => {
  })
})

describe('Turnaround reviewer packet guardrails', () => {
  it('keeps cruise-line reviewer packet evidence out of the operational UI', () => {
    const controller = read('controllers/cruise.controller.js')
    const packetService = read('services/turnaroundReviewerPacket.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')

    expect(controller).toContain("const { buildTurnaroundReviewerPacket } = require('../services/turnaroundReviewerPacket.service')")
    expect(controller).toContain('const reviewerPacket = buildTurnaroundReviewerPacket({')
    expect(controller).toContain('reviewerPacket,')
    expect(packetService).toContain('function buildTurnaroundReviewerPacket')
    expect(packetService).toContain('buildReviewerProofPoints')
    expect(packetService).toContain('buildReviewerDataQuality')
    expect(packetService).toContain('READY_FOR_CRUISE_LINE_REVIEW')
    expect(dashboard).not.toContain('data-testid="react-operations-reviewer-packet"')
    expect(dashboard).not.toContain('selectedOperation.reviewerPacket.proofPoints')
    expect(dashboard).not.toContain('Presentation-ready operational evidence packet')
  })
})

describe('Turnaround outreach board guardrails', () => {
  it('adds a cruise-line outreach board generated from reviewer and executive evidence', () => {
    const controller = read('controllers/cruise.controller.js')
    const outreachService = read('services/turnaroundOutreach.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundOutreachBoard } = require('../services/turnaroundOutreach.service')")
    expect(controller).toContain('const outreachBoard = buildTurnaroundOutreachBoard({')
    expect(controller).toContain('outreachBoard,')
    expect(outreachService).toContain('function buildTurnaroundOutreachBoard')
    expect(outreachService).toContain('buildApplicationChecklist')
    expect(outreachService).toContain('buildTargetRecommendations')
    expect(outreachService).toContain('READY_TO_SEND')
    expect(dashboard).toContain('data-testid="react-operations-outreach-board"')
    expect(dashboard).toContain('selectedOperation.outreachBoard.targetRecommendations')
    expect(dashboard).toContain('Application-ready reviewer strategy')
    expect(styles).toContain('.operations-outreach-board')
    expect(styles).toContain('.operations-outreach-board-grid')
  })
})

describe('Turnaround management status guardrails', () => {
  it('keeps internal management status and maturity mapping out of the operational UI', () => {
    const controller = read('controllers/cruise.controller.js')
    const completionService = read('services/turnaroundCompletion.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')

    expect(controller).toContain("const { buildTurnaroundManagementStatus } = require('../services/turnaroundCompletion.service')")
    expect(controller).toContain('const managementStatus = buildTurnaroundManagementStatus({')
    expect(controller).toContain('managementStatus,')
    expect(completionService).toContain('function buildTurnaroundManagementStatus')
    expect(completionService).toContain('buildTurnaroundCapabilityMap')
    expect(completionService).toContain('buildContinuationSummary')
    expect(completionService).toContain('FLAGSHIP_READY')
    expect(dashboard).not.toContain('data-testid="react-operations-management-status"')
    expect(dashboard).not.toContain('selectedOperation.managementStatus.capabilities')
    expect(dashboard).not.toContain('Production-demo completion map')
  })
})

describe('Turnaround launch plan guardrails', () => {
  it('keeps reviewer-demo launch certification content out of the operational UI', () => {
    const controller = read('controllers/cruise.controller.js')
    const launchService = read('services/turnaroundLaunchPlan.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')

    expect(controller).toContain("const { buildTurnaroundLaunchPlan } = require('../services/turnaroundLaunchPlan.service')")
    expect(controller).toContain('const launchPlan = buildTurnaroundLaunchPlan({')
    expect(controller).toContain('launchPlan,')
    expect(launchService).toContain('function buildTurnaroundLaunchPlan')
    expect(launchService).toContain('buildCertificationGates')
    expect(launchService).toContain('buildDemoRunbook')
    expect(launchService).toContain('READY_FOR_REVIEWER_DEMO')
    expect(dashboard).not.toContain('data-testid="react-operations-launch-plan"')
    expect(dashboard).not.toContain('selectedOperation.launchPlan.certificationGates')
    expect(dashboard).not.toContain('Reviewer demo certification gates')
  })
})

describe('Turnaround scenario plan guardrails', () => {
  it('adds operational resilience scenarios generated from launch and management evidence', () => {
    const controller = read('controllers/cruise.controller.js')
    const scenarioService = read('services/turnaroundScenarioPlan.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundScenarioPlan } = require('../services/turnaroundScenarioPlan.service')")
    expect(controller).toContain('const scenarioPlan = buildTurnaroundScenarioPlan({')
    expect(controller).toContain('scenarioPlan,')
    expect(scenarioService).toContain('function buildTurnaroundScenarioPlan')
    expect(scenarioService).toContain('buildStressCases')
    expect(scenarioService).toContain('buildContingencyActions')
    expect(scenarioService).toContain('NEEDS_CONTINGENCY_REVIEW')
    expect(dashboard).toContain('data-testid="react-operations-scenario-plan"')
    expect(dashboard).toContain('selectedOperation.scenarioPlan.stressCases')
    expect(dashboard).toContain('Operational resilience drills and contingencies')
    expect(styles).toContain('.operations-scenario-plan')
    expect(styles).toContain('.operations-scenario-plan-grid')
  })
})

describe('Turnaround production readiness cockpit guardrails', () => {
  it('adds production readiness evidence without putting deep workflows back into Playwright', () => {
    const controller = read('controllers/cruise.controller.js')
    const productionService = read('services/turnaroundProductionReadiness.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundProductionReadiness } = require('../services/turnaroundProductionReadiness.service')")
    expect(controller).toContain('const productionReadiness = buildTurnaroundProductionReadiness({')
    expect(controller).toContain('productionReadiness,')
    expect(productionService).toContain('function buildTurnaroundProductionReadiness')
    expect(productionService).toContain('buildProductionTestingContract')
    expect(productionService).toContain('Full soup-to-nuts role workflow CRUD')
    expect(productionService).toContain('Responsive layout, overflow, reachability, and selector stability only')
    expect(dashboard).toContain('data-testid="react-operations-production-readiness"')
    expect(dashboard).toContain('selectedOperation.productionReadiness.testingContract')
    expect(dashboard).toContain('Reviewer demo readiness and test ownership')
    expect(styles).toContain('.operations-production-readiness')
    expect(styles).toContain('.operations-production-readiness [class*="grid"]')
  })
})


describe('Turnaround application dossier guardrails', () => {
  it('adds cruise-line application proof package without expanding brittle Playwright workflow depth', () => {
    const controller = read('controllers/cruise.controller.js')
    const dossierService = read('services/turnaroundApplicationDossier.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundApplicationDossier } = require('../services/turnaroundApplicationDossier.service')")
    expect(controller).toContain('const applicationDossier = buildTurnaroundApplicationDossier({')
    expect(controller).toContain('productionReadiness')
    expect(controller).toContain('applicationDossier,')
    expect(dossierService).toContain('function buildTurnaroundApplicationDossier')
    expect(dossierService).toContain('buildEvidenceSections')
    expect(dossierService).toContain('Application checklist')
    expect(dossierService).toContain('Keep Playwright limited to responsive reachability, overflow, and selector stability')
    expect(dashboard).toContain('data-testid="react-operations-application-dossier"')
    expect(dashboard).toContain('selectedOperation.applicationDossier.evidenceSections')
    expect(dashboard).toContain('Cruise-line application proof package')
    expect(styles).toContain('.operations-application-dossier')
    expect(styles).toContain('.operations-application-dossier [class*="grid"]')
  })
})

describe('Turnaround closeout packet guardrails', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  function read(relativePath) {
    return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
  }

  it('adds a final closeout packet generated from operational, readiness, debrief, and reviewer proof layers', () => {
    const controller = read('controllers/cruise.controller.js')
    const closeoutService = read('services/turnaroundCloseout.service.js')
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const roleViewDomain = read('frontend/react/src/domain/roleView.js')
    const styles = readReactCssBundle()

    expect(controller).toContain("const { buildTurnaroundCloseoutPacket } = require('../services/turnaroundCloseout.service')")
    expect(controller).toContain('const closeoutPacket = buildTurnaroundCloseoutPacket({')
    expect(controller).toContain('closeoutPacket,')
    expect(closeoutService).toContain('function buildTurnaroundCloseoutPacket')
    expect(closeoutService).toContain('buildCloseoutGates')
    expect(closeoutService).toContain('buildCloseoutChecklist')
    expect(closeoutService).toContain('READY_TO_CLOSE')
    expect(roleViewDomain).toContain('closeoutPacket: operation.closeoutPacket || null')
    expect(dashboard).toContain('data-testid="react-operations-closeout-packet"')
    expect(dashboard).toContain('selectedOperation.closeoutPacket.gates')
    expect(dashboard).toContain('Final management closeout and reusable operation proof')
    expect(styles).toContain('.operations-closeout-packet')
    expect(styles).toContain('.operations-closeout-packet-grid')
  })
})

describe('Phase 1 passenger audit history payload guardrails', () => {
  it('keeps passenger self-service audit events on the shared before and after entity history contract', () => {
    const controller = read('controllers/cruise.controller.js')
    const integration = read('tests/integration/customersBookings.integration.test.js')

    expect(controller).toContain('async function getCustomerPreCruiseChecklistRow(customerId)')
    expect(controller).toContain('async function getCustomerItineraryFavoriteRow(favoriteId)')
    expect(controller).toContain("operation: previousChecklistRow ? 'passenger-checklist-update' : 'passenger-checklist-create'")
    expect(controller).toContain("operation: 'passenger-booking-preferences-update'")
    expect(controller).toContain("operation: previousFavoriteRow ? 'passenger-itinerary-favorite-already-saved' : 'passenger-itinerary-favorite-create'")
    expect(controller).toContain("operation: previousFavoriteRow ? 'passenger-itinerary-favorite-delete' : 'passenger-itinerary-favorite-delete-missing'")

    for (const eventType of [
      'PASSENGER_CHECKLIST_UPDATED',
      'PASSENGER_BOOKING_PREFERENCES_UPDATED',
      'PASSENGER_ITINERARY_FAVORITE_SAVED',
      'PASSENGER_ITINERARY_FAVORITE_REMOVED'
    ]) {
      expect(controller).toContain(`eventType: '${eventType}'`)
    }

    for (const requiredFragment of [
      'previous: previousChecklistRow',
      'next: nextChecklistRow',
      'previous: existingRows[0]',
      'next: nextPassengerPreferences',
      'previous: previousFavoriteRow',
      'next: nextFavoriteRow',
      "entityRefs: { bookingId, customerId }",
      "entityRefs: { customerId, activityScheduleId }"
    ]) {
      expect(controller).toContain(requiredFragment)
    }

    expect(integration).toContain('records passenger self-service audit events with before and after history payloads')
    expect(integration).toContain('/cruise/audit-events?demoUserId=UADMIN0001&entityType=CUSTOMER_PRE_CRUISE_CHECKLIST')
    expect(integration).toContain("event.eventType === 'PASSENGER_BOOKING_PREFERENCES_UPDATED'")
  })
})


describe('Phase 1 passenger relationship identity bridge guardrails', () => {
  it('adds UUID bridges for passenger relationship records without removing readable IDs', () => {
    const initializer = read('services/initializeDatabase.service.js')
    const bookingPassengerModel = read('models/bookingPassenger.model.js')
    const favoriteModel = read('models/customerItineraryFavorite.model.js')
    const checklistModel = read('models/customerPreCruiseChecklist.model.js')
    const controller = read('controllers/cruise.controller.js')
    const integration = read('tests/integration/customersBookings.integration.test.js')

    for (const bridgeColumn of [
      '"bookingPassengerUuid" uuid DEFAULT gen_random_uuid()',
      '"favoriteUuid" uuid DEFAULT gen_random_uuid()',
      '"checklistUuid" uuid DEFAULT gen_random_uuid()'
    ]) {
      expect(initializer).toContain(bridgeColumn)
    }

    for (const indexName of [
      'idx_booking_passengers_uuid',
      'idx_customer_itinerary_favorites_uuid',
      'idx_customer_pre_cruise_checklists_uuid'
    ]) {
      expect(initializer).toContain(`CREATE UNIQUE INDEX IF NOT EXISTS ${indexName}`)
    }

    expect(bookingPassengerModel).toContain('bookingPassengerUuid: uuid().defaultRandom()')
    expect(favoriteModel).toContain('favoriteUuid: uuid().defaultRandom()')
    expect(checklistModel).toContain('checklistUuid: uuid().defaultRandom()')
    expect(controller).toContain('function buildBookingPassengerStorageValues')
    expect(controller).toContain('existingPassenger?.bookingPassengerUuid')
    expect(controller).toContain('values.bookingPassengerUuid = existingPassenger.bookingPassengerUuid')
    expect(integration).toContain('booking passenger UUID bridge')
  })
})

describe('Phase 1 turnaround audit history payload guardrails', () => {
  it('keeps turnaround operational mutation audit events on the shared before and after entity history contract', () => {
    const controller = read('controllers/cruise.controller.js')
    const integration = read('tests/integration/turnaroundOperations.integration.test.js')

    expect(controller).toContain('function buildTurnaroundHistoryPayload')
    expect(controller).toContain("historyShape: 'TURNAROUND_BEFORE_AFTER_V1'")
    expect(controller).toContain("domain: 'turnaround-operations'")
    expect(controller).toContain('function mergeTurnaroundEntity')
    expect((controller.match(/eventPayload: buildTurnaroundHistoryPayload/g) || []).length).toBeGreaterThanOrEqual(10)

    for (const action of [
      'update-command-plan',
      'create-escalation',
      'update-escalation',
      'update-task-status',
      'create-task',
      'create-task-update',
      'delete-task',
      'update-task-details',
      'update-handoff'
    ]) {
      expect(controller).toContain(`action: '${action}'`)
    }

    expect(controller).toContain("existingStaffing[0] ? 'update-staffing' : 'create-staffing'")
    expect(controller).toContain("existingSignoffs[0] ? 'update-signoff' : 'create-signoff'")
    expect(integration).toContain('records turnaround command audit events with shared before and after history payloads')
    expect(integration).toContain("historyShape: 'TURNAROUND_BEFORE_AFTER_V1'")
    expect(integration).toContain('/cruise/turnaround-operations/${operation.id}/audit-events?limit=10')
  })
})

describe('Phase 1 durable API identity contract guardrails', () => {
  it('promotes durable API identity metadata without replacing existing readable IDs', () => {
    const identityBridge = read('services/apiIdentityBridge.service.js')
    const controller = read('controllers/cruise.controller.js')
    const integration = read('tests/integration/customersBookings.integration.test.js')

    for (const helperName of [
      'withCruiseLineApiIdentity',
      'withShipApiIdentity',
      'withSailingApiIdentity',
      'withCustomerApiIdentity',
      'withBookingApiIdentity',
      'withBookingPassengerApiIdentity',
      'withPreCruiseChecklistApiIdentity'
    ]) {
      expect(identityBridge).toContain(helperName)
      expect(controller).toContain(helperName)
    }

    expect(identityBridge).toContain('apiIdentity')
    expect(identityBridge).toContain('durableId')
    expect(identityBridge).toContain('displayId')
    expect(identityBridge).toContain('tenantScope')
    expect(identityBridge).toContain('relationships')
    expect(controller).toContain('cruiseLines.map(withCruiseLineApiIdentity)')
    expect(controller).toContain('ships.map(withShipApiIdentity)')
    expect(controller).toContain('(sailings || []).map(withSailingApiIdentity)')
    expect(controller).toContain('withBookingPassengerApiIdentity')
    expect(controller).toContain('withBookingApiIdentity')
    expect(integration).toContain('durable API identity metadata')
  })
})

describe('Phase 1 API payload profile guardrails', () => {
  it('keeps compact booking list payload shaping centralized and opt-in', () => {
    const payloadProfile = read('services/apiPayloadProfile.service.js')
    const controller = read('controllers/cruise.controller.js')
    const integration = read('tests/integration/customersBookings.integration.test.js')
    const serviceTest = read('tests/unit/apiPayloadProfile.service.test.js')

    expect(payloadProfile).toContain('function normalizePayloadProfile')
    expect(payloadProfile).toContain('function compactBooking')
    expect(payloadProfile).toContain('function compactCustomer')
    expect(payloadProfile).toContain('function applyBookingPayloadProfile')
    expect(payloadProfile).toContain('function applyCustomerPayloadProfile')
    expect(payloadProfile).toContain('passengerCount')
    expect(payloadProfile).toContain('primaryPassenger')
    expect(payloadProfile).toContain('apiIdentity')
    expect(controller).toContain('getRequestedPayloadProfile(req)')
    expect(controller).toContain('applyBookingPayloadProfile(bookingDetails, getRequestedPayloadProfile(req))')
    expect(controller).toContain('applyCustomerPayloadProfile(customerDetails, getRequestedPayloadProfile(req))')
    expect(integration).toContain('GET /cruise/bookings?payload=compact')
    expect(integration).toContain('GET /cruise/customers?payload=compact')
    expect(integration).toContain('booking.itineraryDays).toBeUndefined()')
    expect(serviceTest).toContain('builds compact customer payloads')
    expect(serviceTest).toContain('leaves full payloads unchanged unless compact is requested')
  })
})

describe('Phase 1 tenant boundary foundation guardrails', () => {
  it('centralizes tenant boundary checks without changing existing readable API contracts', () => {
    const tenantBoundary = read('services/tenantBoundary.service.js')
    const serviceTest = read('tests/unit/tenantBoundary.service.test.js')

    for (const helperName of [
      'buildTenantBoundary',
      'tenantBoundaryFromEntity',
      'tenantBoundaryFromRequest',
      'isTenantBoundaryCompatible',
      'filterRowsByTenantBoundary',
      'assertTenantBoundary'
    ]) {
      expect(tenantBoundary).toContain(helperName)
      expect(serviceTest).toContain(helperName)
    }

    expect(tenantBoundary).toContain('x-cruise-tenant-id')
    expect(tenantBoundary).toContain('TENANT_BOUNDARY_MISMATCH')
    expect(tenantBoundary).toContain('apiIdentity')
    expect(serviceTest).toContain('backward-compatible')
    expect(serviceTest).toContain('legacy-row-without-scope')
  })
})

describe('Phase 1 user actor identity bridge guardrails', () => {
  it('centralizes resolved actor shapes before completing production user normalization', () => {
    const authorizationService = read('services/requestAuthorization.service.js')
    const authorizationTest = read('tests/unit/requestAuthorization.service.test.js')

    for (const helperName of [
      'ACTOR_IDENTITY_SOURCES',
      'buildActorIdentity',
      'buildProductionActor',
      'buildDemoActor',
      'buildAnonymousActor',
      'assertResolvedActor',
      'normalizeActorRole',
      'normalizeActorDisplayName'
    ]) {
      expect(authorizationService).toContain(helperName)
      expect(authorizationTest).toContain(helperName)
    }

    expect(authorizationService).toContain('ACTOR_IDENTITY_SOURCE_REQUIRED')
    expect(authorizationService).toContain('ACTOR_DISPLAY_NAME_REQUIRED')
    expect(authorizationService).toContain('return assertResolvedActor(buildProductionActor(principal))')
    expect(authorizationService).toContain('return assertResolvedActor(buildDemoActor(demoUser) || buildAnonymousActor())')
  })
})


describe('Phase 1 audit event query contract guardrails', () => {
  it('centralizes audit history query filtering before deeper event history expansion', () => {
    const controller = read('controllers/cruise.controller.js')
    const queryService = read('services/auditEventQuery.service.js')
    const queryServiceTest = read('tests/unit/auditEventQuery.service.test.js')

    expect(controller).toContain("require('../services/auditEventQuery.service')")
    expect(controller).toContain('buildAuditEventQueryContract(req.query')
    expect(controller).toContain('buildAuditEventListResponse(auditEvents, auditEventQuery)')
    expect(queryService).toContain('AUDIT_EVENT_FILTER_FIELDS')
    expect(queryService).toContain('normalizeAuditEventFilters')
    expect(queryService).toContain('normalizeAuditEventLimit')
    expect(queryServiceTest).toContain('unexpectedTenantBypass')
    expect(queryServiceTest).toContain('queryLimit')
  })
})

describe('Phase 1 seed data decoupling bridge guardrails', () => {
  it('documents seed JSON as a demo/reset input while production data moves to migrations and workflows', () => {
    const seedManifestService = read('services/seedDataManifest.service.js')
    const seedManifestTest = read('tests/unit/seedDataManifest.service.test.js')

    for (const helperName of [
      'DEFAULT_SEED_MANIFEST',
      'normalizeSeedEntityName',
      'uniqueSeedEntities',
      'buildSeedDataManifest',
      'describeSeedDataDecoupling',
      'assertSeedDataManifest'
    ]) {
      expect(seedManifestService).toContain(helperName)
      expect(seedManifestTest).toContain(helperName)
    }

    expect(seedManifestService).toContain('data/cruise.json')
    expect(seedManifestService).toContain('database-migrations-and-admin-workflows')
    expect(seedManifestService).toContain('forbidRuntimeSeedMutation')
    expect(seedManifestTest).toContain('not the runtime source of truth')
    expect(seedManifestTest).toContain('production data changes flow through migrations, APIs, and admin workflows')
  })
})

describe('Phase 1 production indexing strategy guardrails', () => {
  it('centralizes implemented and planned index contracts before final database index propagation', () => {
    const indexStrategyService = read('services/productionIndexStrategy.service.js')
    const indexStrategyTest = read('tests/unit/productionIndexStrategy.service.test.js')

    for (const helperName of [
      'DEFAULT_INDEX_STRATEGY',
      'normalizeIndexPhase',
      'normalizeIndexDefinition',
      'buildProductionIndexStrategy',
      'groupIndexesByPhase',
      'findIndexesForTable',
      'assertProductionIndexStrategy',
      'describeProductionIndexStrategy'
    ]) {
      expect(indexStrategyService).toContain(helperName)
      expect(indexStrategyTest).toContain(helperName)
    }

    expect(indexStrategyService).toContain('idx_bookings_sailing_status')
    expect(indexStrategyService).toContain('idx_audit_events_entity_created_at')
    expect(indexStrategyService).toContain('production-index-strategy-finalization')
    expect(indexStrategyTest).toContain('planned production index work')
  })
})

describe('Phase 1 closeout readiness bridge guardrails', () => {
  it('centralizes the Phase 1 completion handoff before moving into final productionization', () => {
    const closeoutService = read('services/phaseOneCloseoutReadiness.service.js')
    const closeoutTest = read('tests/unit/phaseOneCloseoutReadiness.service.test.js')

    for (const helperName of [
      'DEFAULT_CLOSEOUT_AREAS',
      'CLOSEOUT_STATUSES',
      'normalizeCloseoutStatus',
      'normalizeCloseoutArea',
      'buildPhaseOneCloseoutReadiness',
      'assertPhaseOneCloseoutReadiness',
      'describePhaseOneCloseoutReadiness'
    ]) {
      expect(closeoutService).toContain(helperName)
      expect(closeoutTest).toContain(helperName)
    }

    expect(closeoutService).toContain('phase-one-closeout-readiness')
    expect(closeoutService).toContain('date-time-normalization')
    expect(closeoutTest).toContain('without reopening completed bridge slices')
  })
})

describe('Phase 1 completion handoff guardrails', () => {
  it('closes Phase 1 with a final completion handoff and Phase 2 productionization boundaries', () => {
    const completionService = read('services/phaseOneCompletionHandoff.service.js')
    const completionTest = read('tests/unit/phaseOneCompletionHandoff.service.test.js')

    for (const helperName of [
      'PHASE_ONE_COMPLETION_GUARDRAIL',
      'PHASE_ONE_COMPLETION_AREAS',
      'PHASE_ONE_PRODUCTIONIZATION_HANDOFF',
      'normalizeCompletionStatus',
      'normalizeCompletionArea',
      'buildPhaseOneCompletionHandoff',
      'assertPhaseOneCompletionHandoff',
      'describePhaseOneCompletionHandoff'
    ]) {
      expect(completionService).toContain(helperName)
      expect(completionTest).toContain(helperName)
    }

    expect(completionService).toContain('phase-one-completion-handoff')
    expect(completionService).toContain('Phase 1 Data Architecture Hardening')
    expect(completionService).toContain('database-migrations')
    expect(completionService).toContain('production-authentication')
    expect(completionService).toContain('tenant-enforcement')
    expect(completionTest).toContain('without reopening Phase 1 bridge slices')
  })
})
