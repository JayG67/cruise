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
      website varchar(255)
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

  console.log('Database tables verified')
}

module.exports = initializeDatabase