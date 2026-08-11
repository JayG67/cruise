const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

const readDatabaseBootstrap = () => ['initializeDatabase', 'databaseCompatibilityColumns', 'databaseIdentityMigration', 'databaseConstraintNormalization', 'databaseEntityMetadataMigration', 'databaseIndexProvisioning']
  .map(name => read(`services/${name}.service.js`)).join('\n')

function readTurnaroundMutationControllers() {
  return ['turnaroundMutation', 'turnaroundCommand', 'turnaroundEscalation', 'turnaroundWorkforce', 'turnaroundTask']
    .map(name => read(`controllers/${name}.controller.js`)).join('\n')
}

describe('Phase 1 passenger audit history payload guardrails', () => {
  it('keeps passenger self-service audit events on the shared before and after entity history contract', () => {
    const passengerExperienceController = read('controllers/passengerExperience.controller.js')
    const integration = read('tests/integration/customersBookings.integration.test.js')

    expect(passengerExperienceController).toContain('async function getCustomerPreCruiseChecklistRow(customerId)')
    expect(passengerExperienceController).toContain('async function getCustomerItineraryFavoriteRow(favoriteId)')
    expect(passengerExperienceController).toContain("operation: previousChecklistRow ? 'passenger-checklist-update' : 'passenger-checklist-create'")
    expect(passengerExperienceController).toContain("operation: 'passenger-booking-preferences-update'")
    expect(passengerExperienceController).toContain("operation: previousFavoriteRow ? 'passenger-itinerary-favorite-already-saved' : 'passenger-itinerary-favorite-create'")
    expect(passengerExperienceController).toContain("operation: previousFavoriteRow ? 'passenger-itinerary-favorite-delete' : 'passenger-itinerary-favorite-delete-missing'")

    for (const eventType of [
      'PASSENGER_CHECKLIST_UPDATED',
      'PASSENGER_BOOKING_PREFERENCES_UPDATED',
      'PASSENGER_ITINERARY_FAVORITE_SAVED',
      'PASSENGER_ITINERARY_FAVORITE_REMOVED'
    ]) {
      expect(passengerExperienceController).toContain(`eventType: '${eventType}'`)
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
      expect(passengerExperienceController).toContain(requiredFragment)
    }

    expect(integration).toContain('records passenger self-service audit events with before and after history payloads')
    expect(integration).toContain('/cruise/audit-events?demoUserId=UADMIN0001&entityType=CUSTOMER_PRE_CRUISE_CHECKLIST')
    expect(integration).toContain("event.eventType === 'PASSENGER_BOOKING_PREFERENCES_UPDATED'")
  })
})


describe('Phase 1 passenger relationship identity bridge guardrails', () => {
  it('adds UUID bridges for passenger relationship records without removing readable IDs', () => {
    const initializer = readDatabaseBootstrap()
    const bookingPassengerModel = read('models/bookingPassenger.model.js')
    const auditScopeService = read('services/sailingAuditScope.service.js')
    const favoriteModel = read('models/customerItineraryFavorite.model.js')
    const checklistModel = read('models/customerPreCruiseChecklist.model.js')
    const bookingDomain = read('services/bookingDomain.service.js')
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
    for (const fragment of ['function buildBookingPassengerStorageValues', 'existingPassenger?.bookingPassengerUuid', 'values.bookingPassengerUuid = existingPassenger.bookingPassengerUuid']) expect(bookingDomain).toContain(fragment)
    expect(integration).toContain('booking passenger UUID bridge')
  })
})

describe('Phase 1 turnaround audit history payload guardrails', () => {
  it('keeps turnaround operational mutation audit events on the shared before and after entity history contract', () => {
    const mutationController = readTurnaroundMutationControllers()
    const mutationSupport = read('services/turnaroundMutationSupport.service.js')
    const integration = read('tests/integration/turnaroundOperations.integration.test.js')

    expect(mutationSupport).toContain('function buildTurnaroundHistoryPayload')
    expect(mutationSupport).toContain("historyShape: 'TURNAROUND_BEFORE_AFTER_V1'")
    expect(mutationSupport).toContain("domain: 'turnaround-operations'")
    expect(mutationSupport).toContain('function mergeTurnaroundEntity')
    expect((mutationController.match(/eventPayload: buildTurnaroundHistoryPayload/g) || []).length).toBeGreaterThanOrEqual(10)

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
      expect(mutationController).toContain(`action: '${action}'`)
    }

    expect(mutationController).toContain("existingStaffing[0] ? 'update-staffing' : 'create-staffing'")
    expect(mutationController).toContain("existingSignoffs[0] ? 'update-signoff' : 'create-signoff'")
    expect(integration).toContain('records turnaround command audit events with shared before and after history payloads')
    expect(integration).toContain("historyShape: 'TURNAROUND_BEFORE_AFTER_V1'")
    expect(integration).toContain('/cruise/turnaround-operations/${operation.id}/audit-events?limit=10')
  })
})

describe('Phase 1 durable API identity contract guardrails', () => {
  it('promotes durable API identity metadata without replacing existing readable IDs', () => {
    const identityBridge = read('services/apiIdentityBridge.service.js')
    const controllers = ['cruise', 'fleet', 'cruiseLineManagement', 'shipManagement', 'sailing', 'sailingManagement', 'itineraryQuery', 'itineraryManagement', 'customer', 'customerManagement', 'passengerExperience', 'booking', 'bookingManagement', 'bookingPassenger'].map(name => read(`controllers/${name}.controller.js`)).join('\n')
    const bookingDomain = read('services/bookingDomain.service.js')
    const identityConsumers = `${controllers}\n${bookingDomain}`
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
      expect(identityConsumers).toContain(helperName)
    }

    expect(identityBridge).toContain('apiIdentity')
    expect(identityBridge).toContain('durableId')
    expect(identityBridge).toContain('displayId')
    expect(identityBridge).toContain('tenantScope')
    expect(identityBridge).toContain('relationships')
    expect(controllers).toContain('cruiseLines.map(withCruiseLineApiIdentity)')
    expect(controllers).toContain('ships.map(withShipApiIdentity)')
    expect(controllers).toContain('(sailings || []).map(withSailingApiIdentity)')
    expect(bookingDomain).toContain('withBookingPassengerApiIdentity')
    expect(bookingDomain).toContain('withBookingApiIdentity')
    expect(integration).toContain('durable API identity metadata')
  })
})

describe('Phase 1 API payload profile guardrails', () => {
  it('keeps compact booking list payload shaping centralized and opt-in', () => {
    const payloadProfile = read('services/apiPayloadProfile.service.js')
    const controller = ['cruise', 'customer', 'customerManagement', 'passengerExperience', 'booking', 'bookingManagement', 'bookingPassenger'].map(name => read(`controllers/${name}.controller.js`)).join('\n')
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
    expect(serviceTest).toContain('fails closed')
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
    const controller = [read('controllers/platformReadiness.controller.js'), read('controllers/platformOperationsAdmin.controller.js')].join('\n')
    const queryService = read('services/auditEventQuery.service.js')
    const queryServiceTest = read('tests/unit/auditEventQuery.service.test.js')

    expect(controller).toContain("require('../services/auditEventQuery.service')")
    expect(controller).toContain('buildAuditEventQueryContract(req.query')
    expect(controller).toContain('buildAuditEventListResponse(auditEvents, { ...auditEventQuery, filters: req.tenantAuditFilters || auditEventQuery.filters })')
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
