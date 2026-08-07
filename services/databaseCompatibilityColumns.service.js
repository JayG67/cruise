const { sql } = require('drizzle-orm')

async function applyDatabaseCompatibilityColumns(db) {
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
}

module.exports = applyDatabaseCompatibilityColumns
