const { sql } = require('drizzle-orm')

async function migrateDatabaseEntityMetadata(db) {
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
    UPDATE booking_passengers SET "bookingPassengerUuid" = COALESCE("bookingPassengerUuid", gen_random_uuid());
  `)

  await db.execute(sql`
    UPDATE customer_itinerary_favorites SET "favoriteUuid" = COALESCE("favoriteUuid", gen_random_uuid());
  `)

  await db.execute(sql`
    UPDATE customer_pre_cruise_checklists SET "checklistUuid" = COALESCE("checklistUuid", gen_random_uuid());
  `)

}

module.exports = migrateDatabaseEntityMetadata
