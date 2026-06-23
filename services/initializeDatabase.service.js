const { sql } = require('drizzle-orm')
const db = require('../db')

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

  await db.execute(sql`
    ALTER TABLE cruise_lines ADD COLUMN IF NOT EXISTS "brandFamily" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE cruise_lines ADD COLUMN IF NOT EXISTS "brandTheme" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE cruise_lines ADD COLUMN IF NOT EXISTS "marketPositioning" varchar(500);
  `)


  await db.execute(sql`
    ALTER TABLE ships ADD COLUMN IF NOT EXISTS "currentPort" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE sailings ADD COLUMN IF NOT EXISTS "departurePort" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE sailings ADD COLUMN IF NOT EXISTS "arrivalPort" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE sailings ADD COLUMN IF NOT EXISTS "isRepositioning" boolean DEFAULT false;
  `)

  await db.execute(sql`
    ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS port varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_tasks ADD COLUMN IF NOT EXISTS "ownerName" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_tasks ADD COLUMN IF NOT EXISTS "dueTime" varchar(20);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_tasks ADD COLUMN IF NOT EXISTS location varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_tasks ADD COLUMN IF NOT EXISTS "blockerReason" varchar(500);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_task_updates ADD COLUMN IF NOT EXISTS "authorName" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_task_updates ADD COLUMN IF NOT EXISTS "updateType" varchar(50);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_task_updates ADD COLUMN IF NOT EXISTS message varchar(500);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_task_updates ADD COLUMN IF NOT EXISTS "createdAt" varchar(40);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_signoffs ADD COLUMN IF NOT EXISTS "approverName" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_signoffs ADD COLUMN IF NOT EXISTS status varchar(50);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_signoffs ADD COLUMN IF NOT EXISTS notes varchar(500);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_signoffs ADD COLUMN IF NOT EXISTS "signedAt" varchar(40);
  `)


  await db.execute(sql`
    ALTER TABLE turnaround_escalations ADD COLUMN IF NOT EXISTS "departmentRole" varchar(50);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_escalations ADD COLUMN IF NOT EXISTS severity varchar(50);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_escalations ADD COLUMN IF NOT EXISTS title varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_escalations ADD COLUMN IF NOT EXISTS "ownerName" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_escalations ADD COLUMN IF NOT EXISTS status varchar(50);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_escalations ADD COLUMN IF NOT EXISTS "resolutionNotes" varchar(500);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_escalations ADD COLUMN IF NOT EXISTS "createdAt" varchar(40);
  `)


  await db.execute(sql`
    ALTER TABLE turnaround_staffing ADD COLUMN IF NOT EXISTS "departmentRole" varchar(50);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_staffing ADD COLUMN IF NOT EXISTS "plannedCount" integer NOT NULL DEFAULT 0;
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_staffing ADD COLUMN IF NOT EXISTS "checkedInCount" integer NOT NULL DEFAULT 0;
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_staffing ADD COLUMN IF NOT EXISTS "leadName" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_staffing ADD COLUMN IF NOT EXISTS "musterLocation" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_staffing ADD COLUMN IF NOT EXISTS notes varchar(500);
  `)



  await db.execute(sql`
    ALTER TABLE turnaround_task_dependencies ADD COLUMN IF NOT EXISTS "dependencyType" varchar(50);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_task_dependencies ADD COLUMN IF NOT EXISTS status varchar(50);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_task_dependencies ADD COLUMN IF NOT EXISTS notes varchar(500);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_handoffs ADD COLUMN IF NOT EXISTS "fromDepartmentRole" varchar(50);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_handoffs ADD COLUMN IF NOT EXISTS "toDepartmentRole" varchar(50);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_handoffs ADD COLUMN IF NOT EXISTS title varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_handoffs ADD COLUMN IF NOT EXISTS status varchar(50);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_handoffs ADD COLUMN IF NOT EXISTS "ownerName" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_handoffs ADD COLUMN IF NOT EXISTS "dueTime" varchar(20);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_handoffs ADD COLUMN IF NOT EXISTS notes varchar(500);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_handoffs ADD COLUMN IF NOT EXISTS "completedAt" varchar(40);
  `)

  await db.execute(sql`
    ALTER TABLE demo_users ADD COLUMN IF NOT EXISTS "normalizedUserId" varchar(40) REFERENCES app_users(id) ON DELETE SET NULL;
  `)

  await db.execute(sql`
    ALTER TABLE demo_users ADD COLUMN IF NOT EXISTS "normalizedRoleId" varchar(50) REFERENCES app_roles(id) ON DELETE SET NULL;
  `)


  await db.execute(sql`
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS "cruiseLineId" uuid REFERENCES cruise_lines(id) ON DELETE SET NULL;
  `)

  await db.execute(sql`
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS "assignedShipId" uuid REFERENCES ships(id) ON DELETE SET NULL;
  `)

  await db.execute(sql`
    ALTER TABLE app_user_roles ADD COLUMN IF NOT EXISTS "cruiseLineId" uuid REFERENCES cruise_lines(id) ON DELETE SET NULL;
  `)

  await db.execute(sql`
    ALTER TABLE app_user_roles ADD COLUMN IF NOT EXISTS "assignedShipId" uuid REFERENCES ships(id) ON DELETE SET NULL;
  `)

  await db.execute(sql`
    ALTER TABLE demo_users ADD COLUMN IF NOT EXISTS "cruiseLineId" uuid REFERENCES cruise_lines(id) ON DELETE SET NULL;
  `)

  await db.execute(sql`
    ALTER TABLE demo_users ADD COLUMN IF NOT EXISTS "assignedShipId" uuid REFERENCES ships(id) ON DELETE SET NULL;
  `)

  await db.execute(sql`
    ALTER TABLE demo_users ADD COLUMN IF NOT EXISTS "assignedSailingId" uuid REFERENCES sailings(id) ON DELETE SET NULL;
  `)

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

  await db.execute(sql`
    ALTER TABLE demo_users ADD COLUMN IF NOT EXISTS "cruiseLineName" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE demo_users ADD COLUMN IF NOT EXISTS "assignedShipName" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE booking_passengers ADD COLUMN IF NOT EXISTS "bookingPassengerUuid" uuid DEFAULT gen_random_uuid();
  `)

  await db.execute(sql`
    ALTER TABLE booking_passengers ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40);
  `)

  await db.execute(sql`
    ALTER TABLE booking_passengers ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz;
  `)

  await db.execute(sql`
    ALTER TABLE customer_itinerary_favorites ADD COLUMN IF NOT EXISTS "favoriteUuid" uuid DEFAULT gen_random_uuid();
  `)

  await db.execute(sql`
    ALTER TABLE customer_itinerary_favorites ADD COLUMN IF NOT EXISTS "createdAt" varchar(40);
  `)

  await db.execute(sql`
    ALTER TABLE customer_itinerary_favorites ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz;
  `)

  await db.execute(sql`
    ALTER TABLE customer_pre_cruise_checklists ADD COLUMN IF NOT EXISTS "checklistUuid" uuid DEFAULT gen_random_uuid();
  `)

  await db.execute(sql`
    ALTER TABLE customer_pre_cruise_checklists ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40);
  `)

  await db.execute(sql`
    ALTER TABLE customer_pre_cruise_checklists ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz;
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_tasks ADD COLUMN IF NOT EXISTS "ownerUserId" varchar(40);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_task_updates ADD COLUMN IF NOT EXISTS "authorUserId" varchar(40);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_signoffs ADD COLUMN IF NOT EXISTS "approverUserId" varchar(40);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_escalations ADD COLUMN IF NOT EXISTS "ownerUserId" varchar(40);
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_handoffs ADD COLUMN IF NOT EXISTS "ownerUserId" varchar(40);
  `)

  await db.execute(sql`
    INSERT INTO app_roles (id, "displayName", "roleType", description)
    SELECT DISTINCT
      lower(replace(role, '_', '-')) AS id,
      initcap(lower(replace(role, '_', ' '))) AS "displayName",
      CASE
        WHEN upper(replace(role, '-', '_')) IN ('ADMIN', 'PASSENGER', 'GROUP_LEADER') THEN upper(replace(role, '-', '_'))
        ELSE 'OPERATIONS'
      END AS "roleType",
      'Normalized access role migrated from existing demo user data' AS description
    FROM demo_users
    WHERE role IS NOT NULL
    ON CONFLICT (id) DO NOTHING;
  `)

  await db.execute(sql`
    INSERT INTO app_users (id, "displayName", email, "userType", "primaryCustomerId", "cruiseLineId", "assignedShipId", status)
    SELECT
      id,
      "displayName",
      id || '@cruise-explorer.local',
      CASE WHEN role = 'ADMIN' THEN 'EMPLOYEE' ELSE 'PASSENGER' END,
      "customerId",
      "cruiseLineId",
      "assignedShipId",
      'ACTIVE'
    FROM demo_users
    ON CONFLICT (id) DO NOTHING;
  `)

  await db.execute(sql`
    INSERT INTO app_user_roles (id, "userId", "roleId", "assignmentScope", "cruiseLineId", "assignedShipId", status)
    SELECT
      demo_users.id || '-' || lower(replace(demo_users.role, '_', '-')),
      demo_users.id,
      lower(replace(demo_users.role, '_', '-')),
      CASE
        WHEN demo_users."assignedShipId" IS NOT NULL THEN 'SHIP'
        WHEN demo_users."cruiseLineId" IS NOT NULL THEN 'CRUISE_LINE'
        WHEN demo_users."customerId" IS NULL THEN 'GLOBAL'
        ELSE 'CUSTOMER'
      END,
      demo_users."cruiseLineId",
      demo_users."assignedShipId",
      'ACTIVE'
    FROM demo_users
    WHERE demo_users.role IS NOT NULL
    ON CONFLICT (id) DO NOTHING;
  `)

  await db.execute(sql`
    UPDATE demo_users
    SET
      "normalizedUserId" = id,
      "normalizedRoleId" = lower(replace(role, '_', '-'))
    WHERE "normalizedUserId" IS NULL OR "normalizedRoleId" IS NULL;
  `)


  await db.execute(sql`
    UPDATE turnaround_tasks
    SET "ownerUserId" = app_users.id
    FROM turnaround_operations
    JOIN sailings ON sailings.id = turnaround_operations."sailingId"
    JOIN app_users ON app_users."assignedShipId" = sailings."shipId"
    WHERE turnaround_tasks."operationId" = turnaround_operations.id
      AND app_users."displayName" LIKE turnaround_tasks."ownerName" || ' — %';
  `)

  await db.execute(sql`
    UPDATE turnaround_task_updates
    SET "authorUserId" = app_users.id
    FROM turnaround_tasks
    JOIN turnaround_operations ON turnaround_operations.id = turnaround_tasks."operationId"
    JOIN sailings ON sailings.id = turnaround_operations."sailingId"
    JOIN app_users ON app_users."assignedShipId" = sailings."shipId"
    WHERE turnaround_task_updates."taskId" = turnaround_tasks.id
      AND app_users."displayName" LIKE turnaround_task_updates."authorName" || ' — %';
  `)

  await db.execute(sql`
    UPDATE turnaround_signoffs
    SET "approverUserId" = app_users.id
    FROM turnaround_operations
    JOIN sailings ON sailings.id = turnaround_operations."sailingId"
    JOIN app_users ON app_users."assignedShipId" = sailings."shipId"
    WHERE turnaround_signoffs."operationId" = turnaround_operations.id
      AND turnaround_signoffs."approverName" IS NOT NULL
      AND turnaround_signoffs."approverName" <> ''
      AND app_users."displayName" LIKE turnaround_signoffs."approverName" || ' — %';
  `)

  await db.execute(sql`
    UPDATE turnaround_escalations
    SET "ownerUserId" = app_users.id
    FROM turnaround_operations
    JOIN sailings ON sailings.id = turnaround_operations."sailingId"
    JOIN app_users ON app_users."assignedShipId" = sailings."shipId"
    WHERE turnaround_escalations."operationId" = turnaround_operations.id
      AND app_users."displayName" LIKE turnaround_escalations."ownerName" || ' — %';
  `)

  await db.execute(sql`
    UPDATE turnaround_handoffs
    SET "ownerUserId" = app_users.id
    FROM turnaround_operations
    JOIN sailings ON sailings.id = turnaround_operations."sailingId"
    JOIN app_users ON app_users."assignedShipId" = sailings."shipId"
    WHERE turnaround_handoffs."operationId" = turnaround_operations.id
      AND app_users."displayName" LIKE turnaround_handoffs."ownerName" || ' — %';
  `)

  await db.execute(sql`
    UPDATE turnaround_tasks
    SET "ownerUserId" = matched_users.id
    FROM (
      SELECT DISTINCT ON (source_name) source_name, id
      FROM (
        SELECT "displayName" AS source_name, id, 1 AS match_rank FROM app_users
        UNION ALL
        SELECT split_part("displayName", ' — ', 1) AS source_name, id, 2 AS match_rank FROM app_users WHERE "displayName" LIKE '% — %'
      ) candidate_users
      WHERE source_name IS NOT NULL AND source_name <> ''
      ORDER BY source_name, match_rank, id
    ) matched_users
    WHERE turnaround_tasks."ownerUserId" IS NULL
      AND turnaround_tasks."ownerName" = matched_users.source_name;
  `)

  await db.execute(sql`
    UPDATE turnaround_task_updates
    SET "authorUserId" = matched_users.id
    FROM (
      SELECT DISTINCT ON (source_name) source_name, id
      FROM (
        SELECT "displayName" AS source_name, id, 1 AS match_rank FROM app_users
        UNION ALL
        SELECT split_part("displayName", ' — ', 1) AS source_name, id, 2 AS match_rank FROM app_users WHERE "displayName" LIKE '% — %'
      ) candidate_users
      WHERE source_name IS NOT NULL AND source_name <> ''
      ORDER BY source_name, match_rank, id
    ) matched_users
    WHERE turnaround_task_updates."authorUserId" IS NULL
      AND turnaround_task_updates."authorName" = matched_users.source_name;
  `)

  await db.execute(sql`
    UPDATE turnaround_signoffs
    SET "approverUserId" = matched_users.id
    FROM (
      SELECT DISTINCT ON (source_name) source_name, id
      FROM (
        SELECT "displayName" AS source_name, id, 1 AS match_rank FROM app_users
        UNION ALL
        SELECT split_part("displayName", ' — ', 1) AS source_name, id, 2 AS match_rank FROM app_users WHERE "displayName" LIKE '% — %'
      ) candidate_users
      WHERE source_name IS NOT NULL AND source_name <> ''
      ORDER BY source_name, match_rank, id
    ) matched_users
    WHERE turnaround_signoffs."approverUserId" IS NULL
      AND turnaround_signoffs."approverName" = matched_users.source_name;
  `)

  await db.execute(sql`
    UPDATE turnaround_escalations
    SET "ownerUserId" = matched_users.id
    FROM (
      SELECT DISTINCT ON (source_name) source_name, id
      FROM (
        SELECT "displayName" AS source_name, id, 1 AS match_rank FROM app_users
        UNION ALL
        SELECT split_part("displayName", ' — ', 1) AS source_name, id, 2 AS match_rank FROM app_users WHERE "displayName" LIKE '% — %'
      ) candidate_users
      WHERE source_name IS NOT NULL AND source_name <> ''
      ORDER BY source_name, match_rank, id
    ) matched_users
    WHERE turnaround_escalations."ownerUserId" IS NULL
      AND turnaround_escalations."ownerName" = matched_users.source_name;
  `)

  await db.execute(sql`
    UPDATE turnaround_handoffs
    SET "ownerUserId" = matched_users.id
    FROM (
      SELECT DISTINCT ON (source_name) source_name, id
      FROM (
        SELECT "displayName" AS source_name, id, 1 AS match_rank FROM app_users
        UNION ALL
        SELECT split_part("displayName", ' — ', 1) AS source_name, id, 2 AS match_rank FROM app_users WHERE "displayName" LIKE '% — %'
      ) candidate_users
      WHERE source_name IS NOT NULL AND source_name <> ''
      ORDER BY source_name, match_rank, id
    ) matched_users
    WHERE turnaround_handoffs."ownerUserId" IS NULL
      AND turnaround_handoffs."ownerName" = matched_users.source_name;
  `)

  for (const operationalUserConstraint of [
    ['fk_turnaround_tasks_owner_user', 'turnaround_tasks', 'ownerUserId'],
    ['fk_turnaround_task_updates_author_user', 'turnaround_task_updates', 'authorUserId'],
    ['fk_turnaround_signoffs_approver_user', 'turnaround_signoffs', 'approverUserId'],
    ['fk_turnaround_escalations_owner_user', 'turnaround_escalations', 'ownerUserId'],
    ['fk_turnaround_handoffs_owner_user', 'turnaround_handoffs', 'ownerUserId']
  ]) {
    const [constraintName, tableName, columnName] = operationalUserConstraint
    await db.execute(sql.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}') THEN
          ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} FOREIGN KEY ("${columnName}") REFERENCES app_users(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `))
  }


  await db.execute(sql`
    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_bookings_booking_status;
  `)

  await db.execute(sql`
    ALTER TABLE bookings ADD CONSTRAINT chk_bookings_booking_status CHECK ("bookingStatus" IN ('CONFIRMED', 'DEPOSIT_PAID', 'PAID_IN_FULL', 'WAITLISTED', 'CHECKED_IN'));
  `)

  await db.execute(sql`
    ALTER TABLE app_roles DROP CONSTRAINT IF EXISTS chk_app_roles_role_type;
  `)

  await db.execute(sql`
    UPDATE app_roles
    SET "roleType" = CASE
      WHEN upper(replace("roleType", '-', '_')) IN ('ADMIN', 'PASSENGER', 'GROUP_LEADER', 'OPERATIONS') THEN upper(replace("roleType", '-', '_'))
      WHEN id IN ('turnaround-manager', 'housekeeping-lead', 'guest-services-lead', 'food-beverage-lead', 'engineering-lead') THEN 'OPERATIONS'
      ELSE 'OPERATIONS'
    END
    WHERE "roleType" IS NULL
       OR upper(replace("roleType", '-', '_')) NOT IN ('ADMIN', 'PASSENGER', 'GROUP_LEADER', 'OPERATIONS');
  `)

  await db.execute(sql`
    ALTER TABLE app_roles ADD CONSTRAINT chk_app_roles_role_type CHECK ("roleType" IN ('ADMIN', 'PASSENGER', 'GROUP_LEADER', 'OPERATIONS'));
  `)

  await db.execute(sql`
    ALTER TABLE app_users DROP CONSTRAINT IF EXISTS chk_app_users_status;
  `)

  await db.execute(sql`
    ALTER TABLE app_users ADD CONSTRAINT chk_app_users_status CHECK (status IN ('ACTIVE', 'INACTIVE'));
  `)

  await db.execute(sql`
    ALTER TABLE app_users DROP CONSTRAINT IF EXISTS chk_app_users_user_type;
  `)

  await db.execute(sql`
    ALTER TABLE app_users ADD CONSTRAINT chk_app_users_user_type CHECK ("userType" IN ('EMPLOYEE', 'PASSENGER', 'PARTNER', 'SYSTEM'));
  `)

  await db.execute(sql`
    ALTER TABLE app_user_roles DROP CONSTRAINT IF EXISTS chk_app_user_roles_status;
  `)

  await db.execute(sql`
    ALTER TABLE app_user_roles ADD CONSTRAINT chk_app_user_roles_status CHECK (status IN ('ACTIVE', 'INACTIVE'));
  `)

  await db.execute(sql`
    ALTER TABLE app_user_roles DROP CONSTRAINT IF EXISTS chk_app_user_roles_assignment_scope;
  `)

  await db.execute(sql`
    ALTER TABLE app_user_roles ADD CONSTRAINT chk_app_user_roles_assignment_scope CHECK ("assignmentScope" IN ('GLOBAL', 'CUSTOMER', 'BOOKING', 'SAILING', 'TURNAROUND_OPERATION', 'CRUISE_LINE', 'SHIP'));
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_turnaround_operations_status') THEN
        ALTER TABLE turnaround_operations ADD CONSTRAINT chk_turnaround_operations_status CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'READY', 'WATCH', 'BLOCKED', 'COMPLETE'));
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_turnaround_tasks_status') THEN
        ALTER TABLE turnaround_tasks ADD CONSTRAINT chk_turnaround_tasks_status CHECK (status IN ('READY', 'IN_PROGRESS', 'BLOCKED', 'WATCH', 'COMPLETE'));
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_turnaround_task_dependencies_status') THEN
        ALTER TABLE turnaround_task_dependencies ADD CONSTRAINT chk_turnaround_task_dependencies_status CHECK (status IN ('ACTIVE', 'CLEARED'));
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_turnaround_handoffs_status') THEN
        ALTER TABLE turnaround_handoffs DROP CONSTRAINT chk_turnaround_handoffs_status;
      END IF;

      ALTER TABLE turnaround_handoffs ADD CONSTRAINT chk_turnaround_handoffs_status CHECK (status IN ('PENDING', 'READY', 'IN_REVIEW', 'BLOCKED', 'COMPLETE'));
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_turnaround_escalations_severity') THEN
        ALTER TABLE turnaround_escalations ADD CONSTRAINT chk_turnaround_escalations_severity CHECK (severity IN ('WATCH', 'HIGH', 'CRITICAL'));
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_turnaround_escalations_status') THEN
        ALTER TABLE turnaround_escalations ADD CONSTRAINT chk_turnaround_escalations_status CHECK (status IN ('OPEN', 'MONITORING', 'RESOLVED'));
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_turnaround_signoffs_status') THEN
        ALTER TABLE turnaround_signoffs ADD CONSTRAINT chk_turnaround_signoffs_status CHECK (status IN ('PENDING', 'APPROVED', 'BLOCKED'));
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_turnaround_staffing_counts') THEN
        ALTER TABLE turnaround_staffing ADD CONSTRAINT chk_turnaround_staffing_counts CHECK ("plannedCount" >= 0 AND "checkedInCount" >= 0 AND "checkedInCount" <= "plannedCount");
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_turnaround_dependencies_no_self_reference') THEN
        ALTER TABLE turnaround_task_dependencies ADD CONSTRAINT chk_turnaround_dependencies_no_self_reference CHECK ("taskId" <> "dependsOnTaskId");
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_turnaround_task_roles') THEN
        ALTER TABLE turnaround_tasks ADD CONSTRAINT chk_turnaround_task_roles CHECK ("departmentRole" IN ('turnaround-manager', 'housekeeping-lead', 'guest-services-lead', 'food-beverage-lead', 'engineering-lead'));
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_turnaround_staffing_roles') THEN
        ALTER TABLE turnaround_staffing ADD CONSTRAINT chk_turnaround_staffing_roles CHECK ("departmentRole" IN ('turnaround-manager', 'housekeeping-lead', 'guest-services-lead', 'food-beverage-lead', 'engineering-lead'));
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_turnaround_handoff_roles') THEN
        ALTER TABLE turnaround_handoffs ADD CONSTRAINT chk_turnaround_handoff_roles CHECK (
          "fromDepartmentRole" IN ('turnaround-manager', 'housekeeping-lead', 'guest-services-lead', 'food-beverage-lead', 'engineering-lead')
          AND "toDepartmentRole" IN ('turnaround-manager', 'housekeeping-lead', 'guest-services-lead', 'food-beverage-lead', 'engineering-lead')
        );
      END IF;
    END $$;
  `)


  await db.execute(sql`
    ALTER TABLE sailings ADD COLUMN IF NOT EXISTS "departureDateValue" date;
  `)

  await db.execute(sql`
    ALTER TABLE activity_schedules ADD COLUMN IF NOT EXISTS "activityTimeValue" time;
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_operations ADD COLUMN IF NOT EXISTS "turnaroundDateValue" date;
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_tasks ADD COLUMN IF NOT EXISTS "dueTimeValue" time;
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_task_updates ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz;
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_signoffs ADD COLUMN IF NOT EXISTS "signedAtTimestamp" timestamptz;
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_escalations ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz;
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_handoffs ADD COLUMN IF NOT EXISTS "dueTimeValue" time;
  `)

  await db.execute(sql`
    ALTER TABLE turnaround_handoffs ADD COLUMN IF NOT EXISTS "completedAtTimestamp" timestamptz;
  `)

  await db.execute(sql`
    UPDATE sailings
    SET "departureDateValue" = "departureDate"::date
    WHERE "departureDateValue" IS NULL
      AND "departureDate" ~ '^\\d{4}-\\d{2}-\\d{2}$';
  `)

  await db.execute(sql`
    UPDATE activity_schedules
    SET "activityTimeValue" = time::time
    WHERE "activityTimeValue" IS NULL
      AND time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$';
  `)

  await db.execute(sql`
    UPDATE turnaround_operations
    SET "turnaroundDateValue" = "turnaroundDate"::date
    WHERE "turnaroundDateValue" IS NULL
      AND "turnaroundDate" ~ '^\\d{4}-\\d{2}-\\d{2}$';
  `)

  await db.execute(sql`
    UPDATE turnaround_tasks
    SET "dueTimeValue" = "dueTime"::time
    WHERE "dueTimeValue" IS NULL
      AND "dueTime" ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$';
  `)

  await db.execute(sql`
    UPDATE turnaround_task_updates
    SET "createdAtTimestamp" = "createdAt"::timestamptz
    WHERE "createdAtTimestamp" IS NULL
      AND "createdAt" ~ '^\\d{4}-\\d{2}-\\d{2}T';
  `)

  await db.execute(sql`
    UPDATE turnaround_signoffs
    SET "signedAtTimestamp" = "signedAt"::timestamptz
    WHERE "signedAtTimestamp" IS NULL
      AND "signedAt" ~ '^\\d{4}-\\d{2}-\\d{2}T';
  `)

  await db.execute(sql`
    UPDATE turnaround_escalations
    SET "createdAtTimestamp" = "createdAt"::timestamptz
    WHERE "createdAtTimestamp" IS NULL
      AND "createdAt" ~ '^\\d{4}-\\d{2}-\\d{2}T';
  `)

  await db.execute(sql`
    UPDATE turnaround_handoffs
    SET "dueTimeValue" = "dueTime"::time
    WHERE "dueTimeValue" IS NULL
      AND "dueTime" ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$';
  `)

  await db.execute(sql`
    UPDATE turnaround_handoffs
    SET "completedAtTimestamp" = "completedAt"::timestamptz
    WHERE "completedAtTimestamp" IS NULL
      AND "completedAt" ~ '^\\d{4}-\\d{2}-\\d{2}T';
  `)


  await db.execute(sql`
    ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "eventType" varchar(100);
  `)

  await db.execute(sql`
    ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "entityType" varchar(100);
  `)

  await db.execute(sql`
    ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "entityId" varchar(100);
  `)

  await db.execute(sql`
    ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "actorUserId" varchar(40);
  `)

  await db.execute(sql`
    ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "actorDisplayName" varchar(255);
  `)

  await db.execute(sql`
    ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "cruiseLineId" uuid;
  `)

  await db.execute(sql`
    ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "shipId" uuid;
  `)

  await db.execute(sql`
    ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "sailingId" uuid;
  `)

  await db.execute(sql`
    ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "operationId" uuid;
  `)

  await db.execute(sql`
    ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS source varchar(100) DEFAULT 'APPLICATION';
  `)

  await db.execute(sql`
    ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "eventPayload" text;
  `)

  await db.execute(sql`
    ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "createdAt" varchar(40);
  `)



  await db.execute(sql`
    ALTER TABLE cruise_lines ADD COLUMN IF NOT EXISTS "createdAt" varchar(40);
    ALTER TABLE cruise_lines ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz;
    ALTER TABLE cruise_lines ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40);
    ALTER TABLE cruise_lines ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz;
    UPDATE cruise_lines
    SET
      "createdAt" = COALESCE("createdAt", NOW()::text),
      "createdAtTimestamp" = COALESCE("createdAtTimestamp", NOW()),
      "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()::text),
      "updatedAtTimestamp" = COALESCE("updatedAtTimestamp", "createdAtTimestamp", NOW());
  `)

  await db.execute(sql`
    ALTER TABLE ships ADD COLUMN IF NOT EXISTS "createdAt" varchar(40);
    ALTER TABLE ships ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz;
    ALTER TABLE ships ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40);
    ALTER TABLE ships ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz;
    UPDATE ships
    SET
      "createdAt" = COALESCE("createdAt", NOW()::text),
      "createdAtTimestamp" = COALESCE("createdAtTimestamp", NOW()),
      "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()::text),
      "updatedAtTimestamp" = COALESCE("updatedAtTimestamp", "createdAtTimestamp", NOW());
  `)

  await db.execute(sql`
    ALTER TABLE sailings ADD COLUMN IF NOT EXISTS "createdAt" varchar(40);
    ALTER TABLE sailings ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz;
    ALTER TABLE sailings ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40);
    ALTER TABLE sailings ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz;
    UPDATE sailings
    SET
      "createdAt" = COALESCE("createdAt", NOW()::text),
      "createdAtTimestamp" = COALESCE("createdAtTimestamp", NOW()),
      "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()::text),
      "updatedAtTimestamp" = COALESCE("updatedAtTimestamp", "createdAtTimestamp", NOW());
  `)

  await db.execute(sql`
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS "customerUuid" uuid DEFAULT gen_random_uuid();
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS "createdAt" varchar(40);
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz;
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40);
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz;
    UPDATE customers
    SET
      "customerUuid" = COALESCE("customerUuid", gen_random_uuid()),
      "createdAt" = COALESCE("createdAt", NOW()::text),
      "createdAtTimestamp" = COALESCE("createdAtTimestamp", NOW()),
      "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()::text),
      "updatedAtTimestamp" = COALESCE("updatedAtTimestamp", "createdAtTimestamp", NOW());
  `)

  await db.execute(sql`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "bookingUuid" uuid DEFAULT gen_random_uuid();
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "createdByUserId" varchar(40) REFERENCES app_users(id) ON DELETE SET NULL;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "createdAt" varchar(40);
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40);
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz;
    UPDATE bookings
    SET
      "bookingUuid" = COALESCE("bookingUuid", gen_random_uuid()),
      "createdAt" = COALESCE("createdAt", NOW()::text),
      "createdAtTimestamp" = COALESCE("createdAtTimestamp", NOW()),
      "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()::text),
      "updatedAtTimestamp" = COALESCE("updatedAtTimestamp", "createdAtTimestamp", NOW());
  `)

  await db.execute(sql`
    UPDATE bookings
    SET "createdByUserId" = app_users.id
    FROM app_users
    WHERE bookings."createdByUserId" IS NULL
      AND bookings."createdByCustomerId" = app_users."primaryCustomerId";
  `)

  await db.execute(sql`
    ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz;
    UPDATE audit_events
    SET "createdAtTimestamp" = "createdAt"::timestamptz
    WHERE "createdAtTimestamp" IS NULL
      AND "createdAt" ~ '^\d{4}-\d{2}-\d{2}T';
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_customer_uuid ON customers("customerUuid");
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_booking_uuid ON bookings("bookingUuid");
  `)

  await db.execute(sql`
    UPDATE booking_passengers SET "bookingPassengerUuid" = COALESCE("bookingPassengerUuid", gen_random_uuid());
  `)

  await db.execute(sql`
    UPDATE customer_itinerary_favorites SET "favoriteUuid" = COALESCE("favoriteUuid", gen_random_uuid());
  `)

  await db.execute(sql`
    UPDATE customer_pre_cruise_checklists SET "checklistUuid" = COALESCE("checklistUuid", gen_random_uuid());
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_passengers_uuid ON booking_passengers("bookingPassengerUuid");
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_itinerary_favorites_uuid ON customer_itinerary_favorites("favoriteUuid");
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_pre_cruise_checklists_uuid ON customer_pre_cruise_checklists("checklistUuid");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_customers_updated_timestamp ON customers("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_bookings_updated_timestamp ON bookings("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_bookings_created_by_user ON bookings("createdByUserId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_cruise_lines_updated_timestamp ON cruise_lines("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_ships_updated_timestamp ON ships("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_sailings_updated_timestamp ON sailings("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_events_created_timestamp ON audit_events("createdAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_sailings_departure_date_value ON sailings("departureDateValue");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_operations_date_value_status ON turnaround_operations("turnaroundDateValue", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_tasks_due_time_value ON turnaround_tasks("operationId", "dueTimeValue");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_task_updates_created_timestamp ON turnaround_task_updates("taskId", "createdAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_escalations_created_timestamp ON turnaround_escalations("operationId", "createdAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_handoffs_due_time_value ON turnaround_handoffs("operationId", "dueTimeValue");
  `)


  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_app_users_primary_customer ON app_users("primaryCustomerId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_app_users_type_status ON app_users("userType", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_app_users_cruise_line_ship ON app_users("cruiseLineId", "assignedShipId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_app_user_roles_user_status ON app_user_roles("userId", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_app_user_roles_role_scope ON app_user_roles("roleId", "assignmentScope");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_app_user_roles_tenant_assignment ON app_user_roles("cruiseLineId", "assignedShipId", "assignmentScope");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_demo_users_normalized_user_role ON demo_users("normalizedUserId", "normalizedRoleId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_demo_users_operational_assignment ON demo_users("cruiseLineId", "assignedShipId", role);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_demo_users_turnaround_sailing_assignment ON demo_users("cruiseLineId", "assignedShipId", "assignedSailingId", role);
  `)


  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_tasks_owner_user ON turnaround_tasks("ownerUserId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_task_updates_author_user ON turnaround_task_updates("authorUserId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_signoffs_approver_user ON turnaround_signoffs("approverUserId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_escalations_owner_user ON turnaround_escalations("ownerUserId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_handoffs_owner_user ON turnaround_handoffs("ownerUserId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_ships_cruise_line_id ON ships("cruiseLineId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_sailings_ship_id_departure_date ON sailings("shipId", "departureDate");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_sailings_departure_route ON sailings("departureDate", "departurePort", "arrivalPort");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_itinerary_days_sailing_day ON itinerary_days("sailingId", day);
  `)

  await db.execute(sql`
    ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS "createdAt" varchar(40);
    ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz;
    ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40);
    ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz;
    UPDATE itinerary_days
    SET
      "createdAt" = COALESCE("createdAt", NOW()::text),
      "createdAtTimestamp" = COALESCE("createdAtTimestamp", NOW()),
      "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()::text),
      "updatedAtTimestamp" = COALESCE("updatedAtTimestamp", "createdAtTimestamp", NOW());
  `)

  await db.execute(sql`
    ALTER TABLE activity_schedules ADD COLUMN IF NOT EXISTS "createdAt" varchar(40);
    ALTER TABLE activity_schedules ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz;
    ALTER TABLE activity_schedules ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40);
    ALTER TABLE activity_schedules ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz;
    UPDATE activity_schedules
    SET
      "createdAt" = COALESCE("createdAt", NOW()::text),
      "createdAtTimestamp" = COALESCE("createdAtTimestamp", NOW()),
      "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()::text),
      "updatedAtTimestamp" = COALESCE("updatedAtTimestamp", "createdAtTimestamp", NOW());
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_itinerary_days_updated ON itinerary_days("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_activity_schedules_updated ON activity_schedules("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_activity_schedules_itinerary_day ON activity_schedules("itineraryDayId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_bookings_sailing_status ON bookings("sailingId", "bookingStatus");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_bookings_created_by_customer ON bookings("createdByCustomerId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_booking_passengers_booking_id ON booking_passengers("bookingId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_booking_passengers_customer_id ON booking_passengers("customerId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_customer_itinerary_favorites_customer_id ON customer_itinerary_favorites("customerId");
  `)


  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_customer_itinerary_favorites_customer_created ON customer_itinerary_favorites("customerId", "createdAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_customer_pre_cruise_checklists_updated ON customer_pre_cruise_checklists("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_booking_passengers_customer_updated ON booking_passengers("customerId", "updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_operations_sailing_status ON turnaround_operations("sailingId", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_operations_date_status ON turnaround_operations("turnaroundDate", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_tasks_operation_role_status ON turnaround_tasks("operationId", "departmentRole", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_tasks_operation_sort ON turnaround_tasks("operationId", "sortOrder");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_task_updates_task_created_at ON turnaround_task_updates("taskId", "createdAt");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_task_dependencies_operation_status ON turnaround_task_dependencies("operationId", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_task_dependencies_task_ids ON turnaround_task_dependencies("taskId", "dependsOnTaskId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_handoffs_operation_status ON turnaround_handoffs("operationId", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_handoffs_departments ON turnaround_handoffs("fromDepartmentRole", "toDepartmentRole");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_escalations_operation_status_severity ON turnaround_escalations("operationId", status, severity);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_escalations_department_status ON turnaround_escalations("departmentRole", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_staffing_operation_role ON turnaround_staffing("operationId", "departmentRole");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_signoffs_operation_role_status ON turnaround_signoffs("operationId", "departmentRole", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events("createdAt");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events("entityType", "entityId", "createdAt");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events("actorUserId", "createdAt");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_scope ON audit_events("cruiseLineId", "shipId", "sailingId", "createdAt");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_events_operation ON audit_events("operationId", "createdAt");
  `)


  if (process.env.NODE_ENV !== 'test' && process.env.SUPPRESS_DB_LOGS !== 'true') {
    console.log('Database tables verified')
  }
}

module.exports = initializeDatabase