const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}
const readRoleViewSurface = () => [
  'roleView',
  'roleIdentity',
  'rolePassenger',
  'roleOperations',
  'roleOperationalAssignments',
  'roleOperationalCommandCenters',
  'roleOperationalReadiness'
].map(name => read(`frontend/react/src/domain/${name}.js`)).join('\n')
const readDatabaseBootstrap = () => ['initializeDatabase', 'databaseCompatibilityColumns', 'databaseIdentityMigration', 'databaseConstraintNormalization', 'databaseEntityMetadataMigration', 'databaseIndexProvisioning'].map(name => read(`services/${name}.service.js`)).join('\n')
const readTurnaroundOperationAssembly = () => ['turnaroundOperationDetails', 'turnaroundOperationalArtifacts'].map(name => read(`services/${name}.service.js`)).join('\n')
const readCruiseSeedLoader = () => ['loadCruiseData', 'cruiseSeedRows'].map(name => read(`services/${name}.service.js`)).join('\n')

function readTurnaroundMutationControllers() {
  return ['turnaroundMutation', 'turnaroundCommand', 'turnaroundEscalation', 'turnaroundWorkforce', 'turnaroundTask']
    .map(name => read(`controllers/${name}.controller.js`)).join('\n')
}

function readOperationalDashboardSurface() {
  return [
    read('frontend/react/src/components/ReactRoleDashboard.jsx'),
    read('frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'), read('frontend/react/src/domain/operationalDashboardWorkspace.js'),
    read('frontend/react/src/components/operations/OperationsEvidencePanels.jsx'),
    read('frontend/react/src/components/operations/OperationsReadinessEvidencePanels.jsx'),
    read('frontend/react/src/components/operations/OperationsReleasePacketPanel.jsx'),
    read('frontend/react/src/components/operations/OperationsMetricsPanel.jsx'),
    read('frontend/react/src/components/operations/OperationsPlaybookPanels.jsx'),
    read('frontend/react/src/components/operations/OperationsIncidentBriefingScenarioPanels.jsx'),
    read('frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx'),
    read('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx'),
    read('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx'),
    read('frontend/react/src/components/operations/operationalDashboardUtils.js'),
    read('frontend/react/src/components/operations/operationalDashboardLabels.js'),
    read('frontend/react/src/components/operations/operationalDashboardReadiness.js'),
    read('frontend/react/src/components/operations/operationalDashboardFormatting.js')
  ].join('\n')
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
    const initializer = readDatabaseBootstrap()

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
    const initializer = readDatabaseBootstrap()
    const referenceData = read('domain/cruiseReferenceData.js')
    const seedLoader = readCruiseSeedLoader()

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
    const initializer = readDatabaseBootstrap()

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
    const initializer = readDatabaseBootstrap()
    const loader = readCruiseSeedLoader()
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
    const initializer = readDatabaseBootstrap()
    const loader = readCruiseSeedLoader()
    const mutationController = readTurnaroundMutationControllers()
    const mutationSupport = read('services/turnaroundMutationSupport.service.js')

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
    expect(mutationSupport).toContain('async function resolveOperationalUserIdByName')
    expect(mutationSupport).toContain('async function getAssignedShipForOperation')
    expect(mutationSupport).toContain('const exactMatches = await db')
    expect(mutationSupport).not.toContain('await dbs')
    expect(mutationController).toContain('ownerUserId: await resolveOperationalUserIdByName(ownerName, operation)')
    expect(mutationController).toContain('approverUserId: await resolveOperationalUserIdByName(approverName, operation)')
    expect(mutationController).toContain('authorUserId: await resolveOperationalUserIdByName(authorName, operation)')
  })

  it('returns assignment-qualified operational person display names from turnaround APIs', () => {
    const operationDetailsService = readTurnaroundOperationAssembly()
    const dashboard = readOperationalDashboardSurface()

    expect(operationDetailsService).toContain('async function buildAppUserDisplayLookup')
    expect(operationDetailsService).toContain("enrichOperationalPerson(signoff, userDisplayById, 'approverUserId', 'approverDisplayName')")
    expect(operationDetailsService).toContain("enrichOperationalPerson(escalation, userDisplayById, 'ownerUserId', 'ownerDisplayName')")
    expect(operationDetailsService).toContain("enrichOperationalPerson(handoff, userDisplayById, 'ownerUserId', 'ownerDisplayName')")
    expect(operationDetailsService).toContain("enrichOperationalPerson(task, userDisplayById, 'ownerUserId', 'ownerDisplayName')")
    expect(operationDetailsService).toContain("enrichOperationalPerson(update, userDisplayById, 'authorUserId', 'authorDisplayName')")

    expect(dashboard).toContain('function getOperationalOwnerDisplay')
    expect(dashboard).toContain('function getOperationalAuthorDisplay')
    expect(dashboard).toContain('function getOperationalApproverDisplay')
    expect(dashboard).toContain('task.ownerDisplayName || task.ownerName')
    expect(dashboard).toContain('signoff.approverDisplayName || signoff.approverName')
  })

  it('adds explicit cruise-line and ship assignment bridges for operational tenancy', () => {
    const initializer = readDatabaseBootstrap()
    const loader = readCruiseSeedLoader()
    const appUserModel = read('models/appUser.model.js')
    const appUserRoleModel = read('models/appUserRole.model.js')
    const demoUserModel = read('models/demoUser.model.js')
    const roleViewDomain = readRoleViewSurface()

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
    const client = [read('frontend/react/src/api/client.js'), read('frontend/react/src/api/httpClient.js'), read('frontend/react/src/api/turnaroundClient.js'), read('frontend/react/src/api/platformClient.js')].join('\n')
    const staticFallback = read('frontend/react/src/api/staticFallback.js')

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
    expect(staticFallback).toContain('const requestPath = path.split')
  })

  it('enforces selected demo-user assignment scope on turnaround write paths', () => {
    const controller = read('controllers/cruise.controller.js')
    const scopeService = read('services/turnaroundScope.service.js')
    const hook = read('frontend/react/src/hooks/useTurnaroundOperations.js')
    const client = [read('frontend/react/src/api/client.js'), read('frontend/react/src/api/httpClient.js'), read('frontend/react/src/api/turnaroundClient.js'), read('frontend/react/src/api/platformClient.js')].join('\n')

    expect(controller).toContain('canAccessTurnaroundOperationForRequest(req, operation)')
    expect(controller).toContain('sendTurnaroundOperationForbidden(res)')
    expect(scopeService).toContain('async function canAccessTurnaroundOperationForRequest(req, operation)')
    expect(scopeService).toContain('function sendTurnaroundOperationForbidden(res)')
    expect(scopeService).toContain("Selected person is not assigned to this turnaround operation")
    expect(scopeService).toContain('return scopedSailingIds.includes(operation.sailingId)')

    expect(client).toContain('function buildScopedApiPath(path)')
    expect(client).toContain('function getScopedRequestOptions(options = {})')
    expect(client).toContain('function buildScopedHeaders(options = {})')
    expect(client).toContain('buildScopedApiPath(`/cruise/turnaround-operations/${encodeURIComponent(operationId)}`, options)')
    expect(client).toContain('buildScopedApiPath(`/cruise/turnaround-tasks/${encodeURIComponent(taskId)}/status`, options)')
    expect(client).toContain('buildScopedApiPath(`/cruise/turnaround-handoffs/${encodeURIComponent(handoffId)}`, options)')

    expect(hook).toContain('const mutationScope = { selectedDemoUser }')
    expect(hook).toContain('const runMutation = useCallback(async ({')
    expect(hook).toContain('setPendingKey(pendingKey)')
    expect(hook).toContain("setPendingKey('')")
    expect(hook.match(/response\?\.operation\?\.id/g)).toHaveLength(1)
    expect(hook).toContain('updateTurnaroundOperationCommand(operationId, payload, mutationScope)')
    expect(hook).toContain('updateTurnaroundTaskStatus(taskId, status, { ...options, ...mutationScope })')
    expect(hook).toContain('deleteTurnaroundTask(taskId, mutationScope)')
  })

  it('abstracts demo identity away from turnaround query strings before real auth is added', () => {
    const app = read('app.js')
    const middleware = read('middleware/requestIdentity.middleware.js')
    const controller = read('controllers/cruise.controller.js')
    const scopeService = read('services/turnaroundScope.service.js')
    const client = [read('frontend/react/src/api/client.js'), read('frontend/react/src/api/httpClient.js'), read('frontend/react/src/api/turnaroundClient.js'), read('frontend/react/src/api/platformClient.js')].join('\n')

    expect(app).toContain("const { attachRequestIdentity } = require('./middleware/requestIdentity.middleware')")
    expect(app).toContain('app.use(attachRequestIdentity)')
    expect(middleware).toContain("'X-Cruise-Demo-User-Id'")
    expect(middleware).toContain('function buildRequestIdentity(req = {})')
    expect(middleware).toContain('function getScopedDemoUserId(req)')
    expect(middleware).toContain('function buildProductionPrincipal(req = {})')
    expect(middleware).toContain('buildJwtPrincipal(req)')
    expect(middleware).toContain("identitySource: principal?.identitySource || (headerDemoUserId ? 'demo-header' : queryDemoUserId ? 'demo-query' : 'anonymous')")
    expect(controller).toContain("require('../services/turnaroundScope.service')")
    expect(scopeService).toContain("const { getScopedDemoUserId } = require('../middleware/requestIdentity.middleware')")
    expect(scopeService).toContain('const demoUserId = getScopedDemoUserId(req)')
    expect(client).toContain('function buildScopedHeaders(options = {})')
    expect(client).toContain("'X-Cruise-Demo-User-Id': scopedDemoUserId")
    expect(client).toContain('const requestOptions = getScopedRequestOptions(options)')
    expect(client).toContain("requestJson('/cruise/turnaround-operations', {")
    expect(client).toContain('...requestOptions')
    expect(client).toContain("cache: 'no-store'")
  })

  it('creates a production authorization seam before replacing demo identity', () => {
    const middleware = read('middleware/requestIdentity.middleware.js')
    const authorizationService = read('services/requestAuthorization.service.js')
    const platformAdministrationController = [read('controllers/platformReadiness.controller.js'), read('controllers/platformOperationsAdmin.controller.js')].join('\n')
    const platformAuditService = read('services/platformAudit.service.js')
    const turnaroundScopeService = read('services/turnaroundScope.service.js')

    expect(middleware).toContain('function buildProductionPrincipal(req = {})')
    expect(middleware).toContain('buildJwtPrincipal(req)')
    expect(middleware).toContain("identitySource: 'test-header'")
    expect(authorizationService).toContain('async function resolveRequestActor(req = {})')
    expect(authorizationService).toContain('async function requireAdminRequest(req, res)')
    expect(authorizationService).toContain('function getProductionPrincipal(req = {})')
    expect(platformAdministrationController).toContain("const { requireAdminRequest } = require('../services/requestAuthorization.service')")
    expect(platformAdministrationController).toContain('if (!(await requireAdminRequest(req, res))) return')
    expect(platformAuditService).toContain("const { resolveRequestAuditActor } = require('./requestAuthorization.service')")
    expect(turnaroundScopeService).toContain("const { resolveRequestAuditActor } = require('./requestAuthorization.service')")
    expect(turnaroundScopeService).toContain('const actor = await resolveRequestAuditActor(req)')
  })


  it('adds an append-only audit event bridge for production traceability', () => {
    const initializer = readDatabaseBootstrap()
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
    const mutationController = readTurnaroundMutationControllers()
    const mutationSupport = read('services/turnaroundMutationSupport.service.js')
    const scopeService = read('services/turnaroundScope.service.js')

    expect(mutationSupport).toContain("const { recordAuditEvent } = require('./auditEvent.service')")
    expect(mutationSupport).toContain('async function recordTurnaroundAuditEvent(req, operation, event)')
    expect(mutationSupport).toContain('buildTurnaroundAuditContext(req, operation)')
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
      expect(mutationController).toContain(`eventType: '${eventType}'`)
    }

    for (const entityType of [
      'TURNAROUND_OPERATION',
      'TURNAROUND_TASK',
      'TURNAROUND_STAFFING',
      'TURNAROUND_SIGNOFF',
      'TURNAROUND_ESCALATION',
      'TURNAROUND_HANDOFF'
    ]) {
      expect(mutationController).toContain(`entityType: '${entityType}'`)
    }
  })


  it('extends production audit coverage across fleet, customer, and booking mutations', () => {
    const controller = ['cruise', 'fleet', 'cruiseLineManagement', 'shipManagement', 'sailing', 'sailingManagement', 'itineraryQuery', 'itineraryManagement', 'customer', 'customerManagement', 'passengerExperience', 'booking', 'bookingManagement', 'bookingPassenger'].map(name => read(`controllers/${name}.controller.js`)).join('\n')
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
    const initializer = readDatabaseBootstrap()
    const controller = ['cruise', 'fleet', 'cruiseLineManagement', 'shipManagement', 'sailing', 'sailingManagement', 'itineraryQuery', 'itineraryManagement', 'customer', 'customerManagement', 'passengerExperience', 'booking', 'bookingManagement', 'bookingPassenger'].map(name => read(`controllers/${name}.controller.js`)).join('\n')
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
    const initializer = readDatabaseBootstrap()
    const controller = read('controllers/itineraryManagement.controller.js')
    const itineraryDayModel = read('models/itineraryDay.model.js')
    const activityScheduleModel = read('models/activitySchedule.model.js')
    const integration = read('tests/integration/sailings.integration.test.js')
    const auditScopeService = read('services/sailingAuditScope.service.js')

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
    expect(controller).toContain('getItineraryDayAuditScope')
    expect(auditScopeService).toContain('async function getItineraryDayAuditScope(itineraryDayOrId)')

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
    const initializer = readDatabaseBootstrap()
    const passengerExperienceController = read('controllers/passengerExperience.controller.js')
    const checklistModel = read('models/customerPreCruiseChecklist.model.js')
    const favoriteModel = read('models/customerItineraryFavorite.model.js')
    const bookingPassengerModel = read('models/bookingPassenger.model.js')
    const auditScopeService = read('services/sailingAuditScope.service.js')

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
    expect(passengerExperienceController).toContain('function buildChecklistStorageValues')
    expect(passengerExperienceController).toContain('getActivityAuditScope')
    expect(auditScopeService).toContain('async function getActivityAuditScope(activityScheduleId)')
    expect(passengerExperienceController).toContain('async function refreshPassengerPreferenceTimestamp(customerId)')
    expect(passengerExperienceController).toContain('async function refreshPreCruiseChecklistTimestamp(customerId)')
    expect(passengerExperienceController).toContain('async function refreshItineraryFavoriteTimestamp(favoriteId)')

    for (const eventType of [
      'PASSENGER_PROFILE_UPDATED',
      'PASSENGER_CHECKLIST_UPDATED',
      'PASSENGER_BOOKING_PREFERENCES_UPDATED',
      'PASSENGER_ITINERARY_FAVORITE_SAVED',
      'PASSENGER_ITINERARY_FAVORITE_REMOVED'
    ]) {
      expect(passengerExperienceController).toContain(`eventType: '${eventType}'`)
    }

    for (const entityType of [
      'CUSTOMER_PRE_CRUISE_CHECKLIST',
      'CUSTOMER_ITINERARY_FAVORITE'
    ]) {
      expect(passengerExperienceController).toContain(`entityType: '${entityType}'`)
    }
  })


  it('exposes scoped turnaround audit history for production traceability review', () => {
    const routes = read('routes/cruise.routes.js')
    const controller = read('controllers/cruise.controller.js')
    const operationDetailsService = readTurnaroundOperationAssembly()
    const auditService = read('services/auditEvent.service.js')
    const authorizationService = read('services/requestAuthorization.service.js')
    const dashboard = readOperationalDashboardSurface()
    const client = [read('frontend/react/src/api/client.js'), read('frontend/react/src/api/httpClient.js'), read('frontend/react/src/api/turnaroundClient.js'), read('frontend/react/src/api/platformClient.js')].join('\n')

    expect(routes).toContain("'/turnaround-operations/:id/audit-events'")
    expect(routes).toContain('cruiseController.getTurnaroundOperationAuditEvents')
    expect(controller).toContain('exports.getTurnaroundOperationAuditEvents')
    expect(controller).toContain('canAccessTurnaroundOperationForRequest(req, operation)')
    expect(controller).toContain('listAuditEventsForOperation(operation.id')
    expect(operationDetailsService).toContain('const auditEvents = await listAuditEventsForOperation(operation.id, { limit: 8 })')
    expect(operationDetailsService).toContain('releasePacket,')
    expect(operationDetailsService).toContain('auditEvents,')
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
    const operationDetailsService = readTurnaroundOperationAssembly()
    const releaseService = read('services/turnaroundRelease.service.js')
    const dashboard = readOperationalDashboardSurface()
    const styles = readReactCssBundle()

    expect(operationDetailsService).toContain("const { buildTurnaroundReleasePacket } = require('./turnaroundRelease.service')")
    expect(operationDetailsService).toContain('const releasePacket = buildTurnaroundReleasePacket({')
    expect(operationDetailsService).toContain('releasePacket,')
    expect(releaseService).toContain('function buildTurnaroundReleasePacket')
    expect(releaseService).toContain('const releaseStatus =')
    expect(releaseService).toContain("id: 'audit'")
    expect(dashboard).toContain('data-testid="react-operations-release-packet"')
    expect(dashboard).toContain('data-testid="react-operations-release-packet-checklist"')
    expect(dashboard).toContain('releasePacket.releaseRecommendation')
    expect(styles).toContain('.operations-release-packet')
  })


  it('adds turnaround operational analytics for release-day performance review', () => {
    const operationDetailsService = readTurnaroundOperationAssembly()
    const metricsService = read('services/turnaroundMetrics.service.js')
    const dashboard = readOperationalDashboardSurface()
    const styles = readReactCssBundle()

    expect(operationDetailsService).toContain("const { buildTurnaroundOperationalMetrics } = require('./turnaroundMetrics.service')")
    expect(operationDetailsService).toContain('const operationalMetrics = buildTurnaroundOperationalMetrics({')
    expect(operationDetailsService).toContain('operationalMetrics,')
    expect(metricsService).toContain('function buildTurnaroundOperationalMetrics')
    expect(metricsService).toContain('releaseConfidence')
    expect(metricsService).toContain('riskIndex')
    expect(metricsService).toContain('departmentMetrics')
    expect(metricsService).toContain('bottleneckDepartment')
    expect(dashboard).toContain('data-testid="react-operations-metrics"')
    expect(dashboard).toContain('operationalMetrics.signals')
    expect(dashboard).toContain('Department risk ranking')
    expect(styles).toContain('.operations-metrics')
    expect(styles).toContain('.operations-metrics-signal-grid')
  })


  it('adds a unified turnaround operational timeline for release-day command review', () => {
    const operationDetailsService = readTurnaroundOperationAssembly()
    const timelineService = read('services/turnaroundTimeline.service.js')
    const dashboard = readOperationalDashboardSurface()
    const styles = readReactCssBundle()

    expect(operationDetailsService).toContain("const { buildTurnaroundOperationalTimeline } = require('./turnaroundTimeline.service')")
    expect(operationDetailsService).toContain('const operationalTimeline = buildTurnaroundOperationalTimeline({')
    expect(operationDetailsService).toContain('operationalTimeline,')
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
    const operationDetailsService = readTurnaroundOperationAssembly()
    const playbookService = read('services/turnaroundPlaybook.service.js')
    const dashboard = readOperationalDashboardSurface()
    const styles = readReactCssBundle()

    expect(operationDetailsService).toContain("const { buildTurnaroundPlaybookTemplate } = require('./turnaroundPlaybook.service')")
    expect(operationDetailsService).toContain('const playbookTemplate = buildTurnaroundPlaybookTemplate({')
    expect(operationDetailsService).toContain('playbookTemplate,')
    expect(playbookService).toContain('function buildTurnaroundPlaybookTemplate')
    expect(playbookService).toContain('templateReadinessScore')
    expect(playbookService).toContain('departmentPlaybooks')
    expect(playbookService).toContain('exceptionRules')
    expect(playbookService).toContain('nextBestActions')
    expect(dashboard).toContain('data-testid="react-operations-playbook-template"')
    expect(dashboard).toContain('playbookTemplate.departmentPlaybooks')
    expect(dashboard).toContain('Template readiness')
    expect(styles).toContain('.operations-playbook')
    expect(styles).toContain('.operations-playbook-grid')
  })


  it('adds playbook variance rehearsal scoring for live turnaround execution comparison', () => {
    const operationDetailsService = readTurnaroundOperationAssembly()
    const varianceService = read('services/turnaroundVariance.service.js')
    const dashboard = readOperationalDashboardSurface()
    const styles = readReactCssBundle()

    expect(operationDetailsService).toContain("const { buildTurnaroundPlaybookVariance } = require('./turnaroundVariance.service')")
    expect(operationDetailsService).toContain('const playbookVariance = buildTurnaroundPlaybookVariance({')
    expect(operationDetailsService).toContain('playbookVariance,')
    expect(varianceService).toContain('function buildTurnaroundPlaybookVariance')
    expect(varianceService).toContain('function buildDepartmentVariances')
    expect(varianceService).toContain('rehearsalScore')
    expect(varianceService).toContain('departmentVariances')
    expect(varianceService).toContain('rehearsalActions')
    expect(dashboard).toContain('data-testid="react-operations-playbook-variance"')
    expect(dashboard).toContain('playbookVariance.departmentVariances')
    expect(dashboard).toContain('Live execution versus template baseline')
    expect(styles).toContain('.operations-playbook-variance')
    expect(styles).toContain('.operations-playbook-variance-grid')
  })


  it('adds turnaround incident command bridging for release-day exception management', () => {
    const operationDetailsService = readTurnaroundOperationAssembly()
    const incidentService = read('services/turnaroundIncident.service.js')
    const dashboard = readOperationalDashboardSurface()
    const styles = readReactCssBundle()

    expect(operationDetailsService).toContain("const { buildTurnaroundIncidentCommand } = require('./turnaroundIncident.service')")
    expect(operationDetailsService).toContain('const incidentCommand = buildTurnaroundIncidentCommand({')
    expect(operationDetailsService).toContain('incidentCommand,')
    expect(incidentService).toContain('function buildTurnaroundIncidentCommand')
    expect(incidentService).toContain('function buildIncidentSignals')
    expect(incidentService).toContain('incidentScore')
    expect(incidentService).toContain('incidentSignals')
    expect(incidentService).toContain('commandActions')
    expect(dashboard).toContain('data-testid="react-operations-incident-command"')
    expect(dashboard).toContain('incidentCommand.incidentSignals')
    expect(dashboard).toContain('Release-day exception bridge')
    expect(styles).toContain('.operations-incident-command')
    expect(styles).toContain('.operations-incident-command-grid')
  })


  it('adds turnaround after-action review for post-operation production debriefs', () => {
    const operationDetailsService = readTurnaroundOperationAssembly()
    const afterActionService = read('services/turnaroundAfterAction.service.js')
    const dashboard = readOperationalDashboardSurface()
    const styles = readReactCssBundle()

    expect(operationDetailsService).toContain("const { buildTurnaroundAfterActionReview } = require('./turnaroundAfterAction.service')")
    expect(operationDetailsService).toContain('const afterActionReview = buildTurnaroundAfterActionReview({')
    expect(operationDetailsService).toContain('afterActionReview,')
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
    const operationDetailsService = readTurnaroundOperationAssembly()
    const shiftBriefingService = read('services/turnaroundShiftBriefing.service.js')
    const dashboard = readOperationalDashboardSurface()
    const styles = readReactCssBundle()

    expect(operationDetailsService).toContain("const { buildTurnaroundShiftBriefing } = require('./turnaroundShiftBriefing.service')")
    expect(operationDetailsService).toContain('const shiftBriefing = buildTurnaroundShiftBriefing({')
    expect(operationDetailsService).toContain('shiftBriefing,')
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
    const operationDetailsService = readTurnaroundOperationAssembly()
    const goLiveService = read('services/turnaroundGoLive.service.js')
    const dashboard = readOperationalDashboardSurface()
    const selectors = read('cypress/react/support/reactSelectors.js')
    const styles = readReactCssBundle()

    expect(operationDetailsService).toContain("const { buildTurnaroundGoLiveCenter } = require('./turnaroundGoLive.service')")
    expect(operationDetailsService).toContain('const goLiveCenter = buildTurnaroundGoLiveCenter({')
    expect(operationDetailsService).toContain('goLiveCenter,')
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
    const operationDetailsService = readTurnaroundOperationAssembly()
    const controlBoardService = read('services/turnaroundOperationsControlBoard.service.js')
    const roleView = readRoleViewSurface()
    const dashboard = readOperationalDashboardSurface()
    const selectors = read('cypress/react/support/reactSelectors.js')
    const styles = readReactCssBundle()

    expect(operationDetailsService).toContain("const { buildTurnaroundOperationsControlBoard } = require('./turnaroundOperationsControlBoard.service')")
    expect(operationDetailsService).toContain('const operationsControlBoard = buildTurnaroundOperationsControlBoard({')
    expect(operationDetailsService).toContain('operationsControlBoard,')
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
    const controller = [read('controllers/platformReadiness.controller.js'), read('controllers/platformOperationsAdmin.controller.js')].join('\n')
    const auditService = read('services/auditEvent.service.js')
    const authorizationService = read('services/requestAuthorization.service.js')
    const client = [read('frontend/react/src/api/client.js'), read('frontend/react/src/api/httpClient.js'), read('frontend/react/src/api/turnaroundClient.js'), read('frontend/react/src/api/platformClient.js')].join('\n')
    const staticFallback = read('frontend/react/src/api/staticFallback.js')
    const sqaConsole = [
      read('frontend/react/src/components/ReactSqaConsole.jsx'),
      read('frontend/react/src/components/useAiQualityConsoleState.js')
    ].join('\n')
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
    expect(controller).toContain('listAuditEvents(req.tenantAuditFilters || buildAuditEventFilters(req.query)')
    expect(auditService).toContain('async function listAuditEvents(filters = {}, { limit = 25 } = {})')
    expect(auditService).toContain('entityType: auditEventTable.entityType')
    expect(auditService).toContain('source: auditEventTable.source')
    expect(client).toContain('export async function getPlatformAuditEvents(filters = {}, options = {})')
    expect(staticFallback).toContain("requestPath === '/cruise/audit-events'")
    expect(app).toContain('selectedDemoUser={selectedDemoUser}')
    expect(sqaConsole).toContain("testId: 'react-sqa-audit-history-button'")
    expect(sqaConsole).toContain("title: 'Audit History Review'")
    expect(sqaConsole).toContain('getPlatformAuditEvents({ limit: 25 }, { selectedDemoUser })')
  })

  it('documents the remaining production-scale data architecture roadmap', () => {
  })
})

describe('Turnaround operational assurance guardrails', () => {
  it('keeps operational assurance evidence out of the primary operational UI', () => {
    const operationDetailsService = readTurnaroundOperationAssembly()
    const packetService = read('services/turnaroundOperationalAssurance.service.js')
    const dashboard = readOperationalDashboardSurface()

    expect(operationDetailsService).toContain("const { buildTurnaroundOperationalAssurance } = require('./turnaroundOperationalAssurance.service')")
    expect(operationDetailsService).toContain('const operationalAssurancePacket = buildTurnaroundOperationalAssurance({')
    expect(operationDetailsService).toContain('reviewerPacket: operationalAssurancePacket,')
    expect(packetService).toContain('function buildTurnaroundOperationalAssurance')
    expect(packetService).toContain('buildAssuranceProofPoints')
    expect(packetService).toContain('buildAssuranceDataQuality')
    expect(packetService).toContain('READY_FOR_OPERATIONAL_REVIEW')
    expect(dashboard).not.toContain('data-testid="react-operations-reviewer-packet"')
    expect(dashboard).not.toContain('selectedOperation.reviewerPacket.proofPoints')
    expect(dashboard).not.toContain('Presentation-ready operational evidence packet')
  })
})

describe('Turnaround operational briefing board guardrails', () => {
  it('adds a leadership briefing board generated from operational assurance and executive evidence', () => {
    const operationDetailsService = readTurnaroundOperationAssembly()
    const briefingService = read('services/turnaroundOperationalBriefingBoard.service.js')
    const dashboard = readOperationalDashboardSurface()
    const styles = readReactCssBundle()

    expect(operationDetailsService).toContain("const { buildTurnaroundOperationalBriefingBoard } = require('./turnaroundOperationalBriefingBoard.service')")
    expect(operationDetailsService).toContain('const operationalBriefingBoard = buildTurnaroundOperationalBriefingBoard({')
    expect(operationDetailsService).toContain('outreachBoard: operationalBriefingBoard,')
    expect(briefingService).toContain('function buildTurnaroundOperationalBriefingBoard')
    expect(briefingService).toContain('buildBriefingChecklist')
    expect(briefingService).toContain('buildAudienceRecommendations')
    expect(briefingService).toContain('READY_FOR_BRIEFING')
    expect(dashboard).toContain('data-testid="react-operations-operational-briefing-board"')
    expect(dashboard).toContain('operationalBriefingBoard.audienceRecommendations')
    expect(dashboard).toContain('Leadership-ready operational briefing')
    expect(styles).toContain('.operations-operational-briefing-board')
    expect(styles).toContain('.operations-operational-briefing-board-grid')
  })
})

describe('Turnaround management status guardrails', () => {
  it('keeps internal management status and maturity mapping out of the operational UI', () => {
    const operationDetailsService = readTurnaroundOperationAssembly()
    const completionService = read('services/turnaroundCompletion.service.js')
    const dashboard = readOperationalDashboardSurface()

    expect(operationDetailsService).toContain("const { buildTurnaroundManagementStatus } = require('./turnaroundCompletion.service')")
    expect(operationDetailsService).toContain('const managementStatus = buildTurnaroundManagementStatus({')
    expect(operationDetailsService).toContain('managementStatus,')
    expect(completionService).toContain('function buildTurnaroundManagementStatus')
    expect(completionService).toContain('buildTurnaroundCapabilityMap')
    expect(completionService).toContain('buildContinuationSummary')
    expect(completionService).toContain('REFERENCE_BASELINE_READY')
    expect(dashboard).not.toContain('data-testid="react-operations-management-status"')
    expect(dashboard).not.toContain('selectedOperation.managementStatus.capabilities')
    expect(dashboard).not.toContain('Production-demo completion map')
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/src/styles/components/operations-evidence-management-status.css'))).toBe(false)
    expect(read('scripts/repair-repository-structure.js')).toContain("'frontend/react/src/styles/components/operations-evidence-management-status.css'")
  })
})

describe('Turnaround launch plan guardrails', () => {
  it('keeps operational release certification content out of dormant UI surfaces', () => {
    const operationDetailsService = readTurnaroundOperationAssembly()
    const launchService = read('services/turnaroundLaunchPlan.service.js')
    const dashboard = readOperationalDashboardSurface()

    expect(operationDetailsService).toContain("const { buildTurnaroundLaunchPlan } = require('./turnaroundLaunchPlan.service')")
    expect(operationDetailsService).toContain('const launchPlan = buildTurnaroundLaunchPlan({')
    expect(operationDetailsService).toContain('launchPlan,')
    expect(launchService).toContain('function buildTurnaroundLaunchPlan')
    expect(launchService).toContain('buildCertificationGates')
    expect(launchService).toContain('buildDemoRunbook')
    expect(launchService).toContain('OPERATIONALLY_READY')
    expect(launchService).not.toContain('READY_FOR_REVIEWER_DEMO')
    expect(launchService).not.toContain('Reviewer demo certification gates')
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/src/styles/components/operations-evidence-launch-plan.css'))).toBe(false)
    expect(read('scripts/repair-repository-structure.js')).toContain("'frontend/react/src/styles/components/operations-evidence-launch-plan.css'")
    expect(dashboard).not.toContain('data-testid="react-operations-launch-plan"')
    expect(dashboard).not.toContain('selectedOperation.launchPlan.certificationGates')
    expect(dashboard).not.toContain('Reviewer demo certification gates')
  })
})

describe('Turnaround scenario plan guardrails', () => {
  it('adds operational resilience scenarios generated from launch and management evidence', () => {
    const operationDetailsService = readTurnaroundOperationAssembly()
    const scenarioService = read('services/turnaroundScenarioPlan.service.js')
    const dashboard = readOperationalDashboardSurface()
    const styles = readReactCssBundle()

    expect(operationDetailsService).toContain("const { buildTurnaroundScenarioPlan } = require('./turnaroundScenarioPlan.service')")
    expect(operationDetailsService).toContain('const scenarioPlan = buildTurnaroundScenarioPlan({')
    expect(operationDetailsService).toContain('scenarioPlan,')
    expect(scenarioService).toContain('function buildTurnaroundScenarioPlan')
    expect(scenarioService).toContain('buildStressCases')
    expect(scenarioService).toContain('buildContingencyActions')
    expect(scenarioService).toContain('NEEDS_CONTINGENCY_REVIEW')
    expect(dashboard).toContain('data-testid="react-operations-scenario-plan"')
    expect(dashboard).toContain('scenarioPlan.stressCases')
    expect(dashboard).toContain('Operational resilience drills and contingencies')
    expect(styles).toContain('.operations-scenario-plan')
    expect(styles).toContain('.operations-scenario-plan-grid')
  })
})

describe('Retired turnaround readiness presentation guardrails', () => {
  it('preserves readiness services while keeping duplicate dormant presentation surfaces retired', () => {
    const operationDetailsService = readTurnaroundOperationAssembly()
    const productionService = read('services/turnaroundProductionReadiness.service.js')
    const dossierService = read('services/turnaroundOperationalReleaseDossier.service.js')
    const dashboard = readOperationalDashboardSurface()
    const styles = readReactCssBundle()

    expect(operationDetailsService).toContain("const { buildTurnaroundProductionReadiness } = require('./turnaroundProductionReadiness.service')")
    expect(operationDetailsService).toContain('const productionReadiness = buildTurnaroundProductionReadiness({')
    expect(operationDetailsService).toContain('productionReadiness,')
    expect(operationDetailsService).toContain("const { buildTurnaroundOperationalReleaseDossier } = require('./turnaroundOperationalReleaseDossier.service')")
    expect(operationDetailsService).toContain('const operationalReleaseDossier = buildTurnaroundOperationalReleaseDossier({')
    expect(operationDetailsService).toContain('applicationDossier: operationalReleaseDossier,')
    expect(productionService).toContain('function buildTurnaroundProductionReadiness')
    expect(dossierService).toContain('function buildTurnaroundOperationalReleaseDossier')
    expect(dashboard).not.toContain('react-operations-production-readiness')
    expect(dashboard).not.toContain('react-operations-operational-release-dossier')
    expect(styles).not.toContain('.operations-production-readiness')
    expect(styles).not.toContain('.operations-operational-release-dossier')
  })
})


describe('Turnaround closeout packet guardrails', () => {
  const projectRoot = path.resolve(__dirname, '../../..')
  function read(relativePath) {
    return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
  }
  it('adds a final closeout packet generated from operational, readiness, debrief, and governance evidence layers', () => {
    const operationDetailsService = readTurnaroundOperationAssembly()
    const closeoutService = read('services/turnaroundCloseout.service.js')
    const dashboard = readOperationalDashboardSurface()
    const roleViewDomain = readRoleViewSurface()
    const styles = readReactCssBundle()
    expect(operationDetailsService).toContain("const { buildTurnaroundCloseoutPacket } = require('./turnaroundCloseout.service')")
    expect(operationDetailsService).toContain('const closeoutPacket = buildTurnaroundCloseoutPacket({')
    expect(operationDetailsService).toContain('closeoutPacket,')
    expect(closeoutService).toContain('function buildTurnaroundCloseoutPacket')
    expect(closeoutService).toContain('buildCloseoutGates')
    expect(closeoutService).toContain('buildCloseoutChecklist')
    expect(closeoutService).toContain('READY_TO_CLOSE')
    expect(roleViewDomain).toContain('closeoutPacket: operation.closeoutPacket || null')
    expect(dashboard).toContain('data-testid="react-operations-closeout-packet"')
    expect(dashboard).toContain('selectedOperation.closeoutPacket.gates')
    expect(dashboard).toContain('Final management closeout and reusable operating baseline')
    expect(styles).toContain('.operations-closeout-packet')
    expect(styles).toContain('.operations-closeout-packet-grid')
  })
})
