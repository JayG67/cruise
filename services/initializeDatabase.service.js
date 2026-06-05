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

  if (process.env.NODE_ENV !== 'test' && process.env.SUPPRESS_DB_LOGS !== 'true') {
    console.log('Database tables verified')
  }
}

module.exports = initializeDatabase