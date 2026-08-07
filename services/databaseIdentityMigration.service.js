const { sql } = require('drizzle-orm')

async function migrateDatabaseIdentityAndOperationalOwnership(db) {
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
      'Normalized access role migrated from existing assigned-person data' AS description
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

}

module.exports = migrateDatabaseIdentityAndOperationalOwnership
