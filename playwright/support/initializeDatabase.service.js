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
      port varchar(255)
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS activity_schedules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "itineraryDayId" uuid NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
      time varchar(20) NOT NULL,
      activity varchar(255) NOT NULL
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
    CREATE TABLE IF NOT EXISTS demo_users (
      id varchar(20) PRIMARY KEY,
      "displayName" varchar(255) NOT NULL,
      role varchar(50) NOT NULL,
      "customerId" varchar(10) REFERENCES customers(id) ON DELETE SET NULL
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
      "boardingGroup" varchar(50)
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS customer_itinerary_favorites (
      id varchar(60) PRIMARY KEY,
      "customerId" varchar(10) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      "activityScheduleId" uuid NOT NULL REFERENCES activity_schedules(id) ON DELETE CASCADE
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
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bookings_booking_status') THEN
        ALTER TABLE bookings ADD CONSTRAINT chk_bookings_booking_status CHECK ("bookingStatus" IN ('CONFIRMED', 'DEPOSIT_PAID', 'WAITLISTED', 'CHECKED_IN'));
      END IF;
    END $$;
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
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_turnaround_handoffs_status') THEN
        ALTER TABLE turnaround_handoffs ADD CONSTRAINT chk_turnaround_handoffs_status CHECK (status IN ('PENDING', 'READY', 'IN_REVIEW', 'BLOCKED', 'COMPLETE'));
      END IF;
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

  if (process.env.NODE_ENV !== 'test' && process.env.SUPPRESS_DB_LOGS !== 'true') {
    console.log('Database tables verified')
  }
}

module.exports = initializeDatabase