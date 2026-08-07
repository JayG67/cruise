const { sql } = require('drizzle-orm')
const db = require('../db')
const applyDatabaseCompatibilityColumns = require('./databaseCompatibilityColumns.service')
const applyDatabaseConstraintsAndTemporalNormalization = require('./databaseConstraintNormalization.service')
const migrateDatabaseIdentityAndOperationalOwnership = require('./databaseIdentityMigration.service')
const migrateDatabaseEntityMetadata = require('./databaseEntityMetadataMigration.service')
const provisionDatabaseIndexes = require('./databaseIndexProvisioning.service')

async function initializeDatabase() {
  await db.execute(sql`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS cruise_lines (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(255) NOT NULL,
      country varchar(255),
      website varchar(255),
      "brandFamily" varchar(255),
      "brandTheme" varchar(255),
      "marketPositioning" varchar(500)
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ships (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(255) NOT NULL,
      "currentPort" varchar(255),
      "cruiseLineId" uuid NOT NULL REFERENCES cruise_lines(id) ON DELETE CASCADE
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sailings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "shipId" uuid NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
      "departureDate" varchar(10) NOT NULL,
      port varchar(255) NOT NULL,
      "departurePort" varchar(255),
      "arrivalPort" varchar(255),
      days integer NOT NULL,
      "isRepositioning" boolean DEFAULT false
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS itinerary_days (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "sailingId" uuid NOT NULL REFERENCES sailings(id) ON DELETE CASCADE,
      day integer NOT NULL,
      title varchar(255) NOT NULL,
      port varchar(255),
      "createdAt" varchar(40),
      "createdAtTimestamp" timestamptz,
      "updatedAt" varchar(40),
      "updatedAtTimestamp" timestamptz
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS activity_schedules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "itineraryDayId" uuid NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
      time varchar(20) NOT NULL,
      activity varchar(255) NOT NULL,
      "createdAt" varchar(40),
      "createdAtTimestamp" timestamptz,
      "updatedAt" varchar(40),
      "updatedAtTimestamp" timestamptz
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS turnaround_operations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "sailingId" uuid NOT NULL REFERENCES sailings(id) ON DELETE CASCADE,
      title varchar(255) NOT NULL,
      "turnaroundDate" varchar(20) NOT NULL,
      port varchar(255) NOT NULL,
      status varchar(50) NOT NULL,
      "readinessLevel" varchar(100) NOT NULL,
      notes varchar(500)
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS turnaround_tasks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "operationId" uuid NOT NULL REFERENCES turnaround_operations(id) ON DELETE CASCADE,
      "departmentRole" varchar(50) NOT NULL,
      "taskName" varchar(255) NOT NULL,
      "ownerName" varchar(255),
      "ownerUserId" varchar(40),
      "dueTime" varchar(20),
      location varchar(255),
      "blockerReason" varchar(500),
      status varchar(50) NOT NULL,
      "sortOrder" integer NOT NULL DEFAULT 0
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS turnaround_task_updates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "taskId" uuid NOT NULL REFERENCES turnaround_tasks(id) ON DELETE CASCADE,
      "authorName" varchar(255) NOT NULL,
      "authorUserId" varchar(40),
      "updateType" varchar(50) NOT NULL,
      message varchar(500) NOT NULL,
      "createdAt" varchar(40) NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS turnaround_signoffs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "operationId" uuid NOT NULL REFERENCES turnaround_operations(id) ON DELETE CASCADE,
      "departmentRole" varchar(50) NOT NULL,
      "approverName" varchar(255),
      "approverUserId" varchar(40),
      status varchar(50) NOT NULL,
      notes varchar(500),
      "signedAt" varchar(40)
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS turnaround_escalations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "operationId" uuid NOT NULL REFERENCES turnaround_operations(id) ON DELETE CASCADE,
      "departmentRole" varchar(50) NOT NULL,
      severity varchar(50) NOT NULL,
      title varchar(255) NOT NULL,
      "ownerName" varchar(255),
      "ownerUserId" varchar(40),
      status varchar(50) NOT NULL,
      "resolutionNotes" varchar(500),
      "createdAt" varchar(40) NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS turnaround_staffing (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "operationId" uuid NOT NULL REFERENCES turnaround_operations(id) ON DELETE CASCADE,
      "departmentRole" varchar(50) NOT NULL,
      "plannedCount" integer NOT NULL DEFAULT 0,
      "checkedInCount" integer NOT NULL DEFAULT 0,
      "leadName" varchar(255),
      "musterLocation" varchar(255),
      notes varchar(500)
    );
  `)



  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS turnaround_task_dependencies (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "operationId" uuid NOT NULL REFERENCES turnaround_operations(id) ON DELETE CASCADE,
      "taskId" uuid NOT NULL REFERENCES turnaround_tasks(id) ON DELETE CASCADE,
      "dependsOnTaskId" uuid NOT NULL REFERENCES turnaround_tasks(id) ON DELETE CASCADE,
      "dependencyType" varchar(50) NOT NULL DEFAULT 'BLOCKS',
      status varchar(50) NOT NULL DEFAULT 'ACTIVE',
      notes varchar(500)
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS turnaround_handoffs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "operationId" uuid NOT NULL REFERENCES turnaround_operations(id) ON DELETE CASCADE,
      "fromDepartmentRole" varchar(50) NOT NULL,
      "toDepartmentRole" varchar(50) NOT NULL,
      title varchar(255) NOT NULL,
      status varchar(50) NOT NULL DEFAULT 'PENDING',
      "ownerName" varchar(255),
      "ownerUserId" varchar(40),
      "dueTime" varchar(20),
      notes varchar(500),
      "completedAt" varchar(40)
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS customers (
      id varchar(10) PRIMARY KEY,
      "firstName" varchar(100) NOT NULL,
      "lastName" varchar(100) NOT NULL,
      email varchar(255) NOT NULL UNIQUE,
      phone varchar(50),
      "loyaltyNumber" varchar(100)
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id varchar(10) PRIMARY KEY,
      "sailingId" uuid NOT NULL REFERENCES sailings(id) ON DELETE CASCADE,
      "bookingStatus" varchar(50) NOT NULL,
      "cabinNumber" varchar(20),
      "fareCode" varchar(50),
      "embarkationPort" varchar(255),
      "debarkationPort" varchar(255),
      "createdByCustomerId" varchar(10) REFERENCES customers(id)
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_roles (
      id varchar(50) PRIMARY KEY,
      "displayName" varchar(255) NOT NULL,
      "roleType" varchar(50) NOT NULL,
      description varchar(500)
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_users (
      id varchar(40) PRIMARY KEY,
      "displayName" varchar(255) NOT NULL,
      email varchar(255) NOT NULL,
      "userType" varchar(50) NOT NULL,
      "primaryCustomerId" varchar(10) REFERENCES customers(id) ON DELETE SET NULL,
      "cruiseLineId" uuid REFERENCES cruise_lines(id) ON DELETE SET NULL,
      "assignedShipId" uuid REFERENCES ships(id) ON DELETE SET NULL,
      status varchar(50) NOT NULL DEFAULT 'ACTIVE'
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_user_roles (
      id varchar(100) PRIMARY KEY,
      "userId" varchar(40) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      "roleId" varchar(50) NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
      "assignmentScope" varchar(50) NOT NULL DEFAULT 'GLOBAL',
      "cruiseLineId" uuid REFERENCES cruise_lines(id) ON DELETE SET NULL,
      "assignedShipId" uuid REFERENCES ships(id) ON DELETE SET NULL,
      status varchar(50) NOT NULL DEFAULT 'ACTIVE'
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS demo_users (
      id varchar(20) PRIMARY KEY,
      "displayName" varchar(255) NOT NULL,
      role varchar(50) NOT NULL,
      "customerId" varchar(10) REFERENCES customers(id) ON DELETE SET NULL,
      "normalizedUserId" varchar(40) REFERENCES app_users(id) ON DELETE SET NULL,
      "normalizedRoleId" varchar(50) REFERENCES app_roles(id) ON DELETE SET NULL,
      "cruiseLineId" uuid REFERENCES cruise_lines(id) ON DELETE SET NULL,
      "assignedShipId" uuid REFERENCES ships(id) ON DELETE SET NULL,
      "assignedSailingId" uuid REFERENCES sailings(id) ON DELETE SET NULL,
      "cruiseLineName" varchar(255),
      "assignedShipName" varchar(255)
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS booking_passengers (
      id varchar(30) PRIMARY KEY,
      "bookingId" varchar(10) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      "customerId" varchar(10) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      "passengerRole" varchar(50) NOT NULL,
      "isPrimaryGuest" boolean NOT NULL DEFAULT false,
      "diningPreference" varchar(100),
      "accessibilityNotes" varchar(255),
      "boardingGroup" varchar(50),
      "bookingPassengerUuid" uuid DEFAULT gen_random_uuid(),
      "updatedAt" varchar(40),
      "updatedAtTimestamp" timestamptz
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS customer_itinerary_favorites (
      id varchar(60) PRIMARY KEY,
      "customerId" varchar(10) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      "activityScheduleId" uuid NOT NULL REFERENCES activity_schedules(id) ON DELETE CASCADE,
      "favoriteUuid" uuid DEFAULT gen_random_uuid(),
      "createdAt" varchar(40),
      "createdAtTimestamp" timestamptz
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS customer_pre_cruise_checklists (
      "customerId" varchar(10) PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
      "checklistUuid" uuid DEFAULT gen_random_uuid(),
      documents boolean NOT NULL DEFAULT false,
      luggage boolean NOT NULL DEFAULT false,
      dining boolean NOT NULL DEFAULT false,
      excursions boolean NOT NULL DEFAULT false,
      "updatedAt" varchar(40)
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS audit_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "eventType" varchar(100) NOT NULL,
      "entityType" varchar(100) NOT NULL,
      "entityId" varchar(100) NOT NULL,
      "actorUserId" varchar(40) REFERENCES app_users(id) ON DELETE SET NULL,
      "actorDisplayName" varchar(255),
      "cruiseLineId" uuid REFERENCES cruise_lines(id) ON DELETE SET NULL,
      "shipId" uuid REFERENCES ships(id) ON DELETE SET NULL,
      "sailingId" uuid REFERENCES sailings(id) ON DELETE SET NULL,
      "operationId" uuid REFERENCES turnaround_operations(id) ON DELETE SET NULL,
      source varchar(100) NOT NULL DEFAULT 'APPLICATION',
      "eventPayload" text,
      "createdAt" varchar(40) NOT NULL
    );
  `)

  await applyDatabaseCompatibilityColumns(db)

  await db.execute(sql`
    DO $$
    DECLARE
      constraint_record record;
    BEGIN
      FOR constraint_record IN
        SELECT conrelid::regclass::text AS table_name, conname
        FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid IN (
            'app_users'::regclass,
            'app_user_roles'::regclass,
            'demo_users'::regclass,
            'audit_events'::regclass
          )
          AND confrelid IN ('ships'::regclass, 'sailings'::regclass)
      LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', constraint_record.table_name, constraint_record.conname);
      END LOOP;

      ALTER TABLE app_users
        ADD CONSTRAINT app_users_assigned_ship_id_ships_id_fk
        FOREIGN KEY ("assignedShipId") REFERENCES ships(id) ON DELETE SET NULL;

      ALTER TABLE app_user_roles
        ADD CONSTRAINT app_user_roles_assigned_ship_id_ships_id_fk
        FOREIGN KEY ("assignedShipId") REFERENCES ships(id) ON DELETE SET NULL;

      ALTER TABLE demo_users
        ADD CONSTRAINT demo_users_assigned_ship_id_ships_id_fk
        FOREIGN KEY ("assignedShipId") REFERENCES ships(id) ON DELETE SET NULL;

      ALTER TABLE demo_users
        ADD CONSTRAINT demo_users_assigned_sailing_id_sailings_id_fk
        FOREIGN KEY ("assignedSailingId") REFERENCES sailings(id) ON DELETE SET NULL;

      ALTER TABLE audit_events
        ADD CONSTRAINT audit_events_ship_id_ships_id_fk
        FOREIGN KEY ("shipId") REFERENCES ships(id) ON DELETE SET NULL;

      ALTER TABLE audit_events
        ADD CONSTRAINT audit_events_sailing_id_sailings_id_fk
        FOREIGN KEY ("sailingId") REFERENCES sailings(id) ON DELETE SET NULL;
    END $$;
  `)

  await migrateDatabaseIdentityAndOperationalOwnership(db)

  await applyDatabaseConstraintsAndTemporalNormalization(db)

  await migrateDatabaseEntityMetadata(db)

  await provisionDatabaseIndexes(db)

  if (process.env.NODE_ENV !== 'test' && process.env.SUPPRESS_DB_LOGS !== 'true') {
    console.log('Database tables verified')
  }
}

module.exports = initializeDatabase