const { sql } = require('drizzle-orm')

async function applyDatabaseConstraintsAndTemporalNormalization(db) {
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

}

module.exports = applyDatabaseConstraintsAndTemporalNormalization
