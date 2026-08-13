const crypto = require('crypto')
const request = require('supertest')
const { eq, inArray } = require('drizzle-orm')

const app = require('../../../app')
const db = require('../../../db')
const {
  cruiseLineTable,
  shipTable,
  customerTable,
  bookingTable,
  bookingPassengerTable,
  customerItineraryFavoriteTable
} = require('../../../models')

const createdCruiseLineIds = []
const createdShipIds = []
const createdCustomerIds = []
const createdBookingIds = []

function uniqueSeedSafeId(prefix) {
  // Use a 9-character base-36 value sourced from 48 bits of cryptographic
  // entropy. This preserves the public 10-character C/B ID contracts while
  // using the full A-Z0-9 namespace instead of only hexadecimal characters.
  // The larger namespace further reduces collisions with seed/stale test rows.
  const randomValue = BigInt(`0x${crypto.randomBytes(6).toString('hex')}`)
  const entropy = randomValue.toString(36).toUpperCase().padStart(9, '0').slice(-9)
  return `${prefix}${entropy}`
}

function uniqueCustomerId() {
  return uniqueSeedSafeId('C')
}

function uniqueBookingId() {
  return uniqueSeedSafeId('B')
}

async function createCustomer(overrides = {}) {
  const hasFixedId = Boolean(overrides.id)
  const maxAttempts = hasFixedId ? 1 : 5

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const id = hasFixedId ? overrides.id : uniqueCustomerId()
    const payload = {
      id,
      firstName: 'Integration',
      lastName: 'Customer',
      email: `${id.toLowerCase()}@example.com`,
      phone: '555-0199',
      loyaltyNumber: `LOYALTY-${id}`,
      ...overrides,
      id
    }

    const res = await request(app)
      .post('/cruise/customers')
      .send(payload)

    if (res.statusCode === 201) {
      createdCustomerIds.push(id)

      return payload
    }

    const isGeneratedCollision =
      !hasFixedId &&
      res.statusCode === 400 &&
      typeof res.body?.message === 'string' &&
      (res.body.message.includes('same ID') || res.body.message.includes('same email'))

    if (!isGeneratedCollision || attempt === maxAttempts) {
      expect(res.statusCode).toBe(201)
    }
  }

  throw new Error('Unable to create a unique integration customer')
}

function trackBooking(bookingId) {
  if (bookingId && !createdBookingIds.includes(bookingId)) {
    createdBookingIds.push(bookingId)
  }
}

function removeTrackedBooking(bookingId) {
  const index = createdBookingIds.indexOf(bookingId)

  if (index >= 0) {
    createdBookingIds.splice(index, 1)
  }
}

function uniqueName(prefix) {
  return `${prefix} ${Date.now()} ${Math.floor(Math.random() * 100000)}`
}

async function createCruiseLine(overrides = {}) {
  const payload = {
    name: uniqueName('Integration Cruise Line'),
    country: 'United States',
    website: 'https://example.com',
    ...overrides
  }

  const insertedRows = await db
    .insert(cruiseLineTable)
    .values(payload)
    .returning({ id: cruiseLineTable.id })

  expect(insertedRows[0]).toEqual(
    expect.objectContaining({
      id: expect.any(String)
    })
  )

  createdCruiseLineIds.push(insertedRows[0].id)

  return {
    ...payload,
    id: insertedRows[0].id
  }
}

async function createShip(cruiseLineId, overrides = {}) {
  const payload = {
    name: uniqueName('Integration Ship'),
    currentPort: 'Miami, Florida',
    cruiseLineId,
    ...overrides
  }

  const cruiseLineRows = await db
    .select()
    .from(cruiseLineTable)
    .where(eq(cruiseLineTable.id, cruiseLineId))
    .limit(1)

  expect(cruiseLineRows[0]).toBeDefined()

  // Create ships through the public API instead of inserting directly. The
  // ship integration suite exercises controller-level CRUD behavior, and using
  // the same write path as the application prevents cleanup or pool timing from
  // making a freshly inserted helper record invisible to a subsequent HTTP
  // DELETE request in slower local or CI runs.
  const res = await request(app)
    .post('/cruise/ship')
    .send(payload)

  expect(res.statusCode).toBe(201)
  expect(res.body).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      message: 'Ship created successfully'
    })
  )

  createdShipIds.push(res.body.id)

  return {
    id: res.body.id,
    ...payload
  }
}

async function cleanupTestData() {
  const bookingIds = [...createdBookingIds]
  const customerIds = [...createdCustomerIds]
  const shipIds = [...createdShipIds]
  const cruiseLineIds = [...createdCruiseLineIds]

  // Integration cleanup should be deterministic and should not depend on the
  // HTTP layer that the tests are currently exercising. Direct database cleanup
  // prevents afterEach hooks from hanging behind request middleware, logging,
  // response compression, or cascade paths that are unrelated to the assertion.
  if (customerIds.length > 0) {
    await db
      .delete(customerItineraryFavoriteTable)
      .where(inArray(customerItineraryFavoriteTable.customerId, customerIds))
  }

  if (bookingIds.length > 0) {
    await db
      .delete(bookingPassengerTable)
      .where(inArray(bookingPassengerTable.bookingId, bookingIds))

    await db
      .delete(bookingTable)
      .where(inArray(bookingTable.id, bookingIds))
  }

  if (customerIds.length > 0) {
    await db
      .delete(bookingPassengerTable)
      .where(inArray(bookingPassengerTable.customerId, customerIds))

    await db
      .update(bookingTable)
      .set({ createdByCustomerId: null })
      .where(inArray(bookingTable.createdByCustomerId, customerIds))

    await db
      .delete(customerTable)
      .where(inArray(customerTable.id, customerIds))
  }

  if (shipIds.length > 0) {
    await db
      .delete(shipTable)
      .where(inArray(shipTable.id, shipIds))
  }

  if (cruiseLineIds.length > 0) {
    await db
      .delete(cruiseLineTable)
      .where(inArray(cruiseLineTable.id, cruiseLineIds))
  }

  createdBookingIds.length = 0
  createdCustomerIds.length = 0
  createdShipIds.length = 0
  createdCruiseLineIds.length = 0
}

function removeTrackedShip(shipId) {
  const index = createdShipIds.indexOf(shipId)

  if (index >= 0) {
    createdShipIds.splice(index, 1)
  }
}

function trackCruiseLine(cruiseLineId) {
  if (cruiseLineId && !createdCruiseLineIds.includes(cruiseLineId)) {
    createdCruiseLineIds.push(cruiseLineId)
  }
}

function removeTrackedCruiseLine(cruiseLineId) {
  const index = createdCruiseLineIds.indexOf(cruiseLineId)

  if (index >= 0) {
    createdCruiseLineIds.splice(index, 1)
  }
}

async function getSeededBookingWithPassengers(request, app) {
  const bookingsResponse = await request(app).get('/cruise/bookings')

  expect(bookingsResponse.statusCode).toBe(200)
  expect(Array.isArray(bookingsResponse.body)).toBe(true)

  const seededBooking = bookingsResponse.body.find(booking => (
    booking
    && booking.id
    && Array.isArray(booking.passengers)
    && booking.passengers.length > 0
  ))

  expect(seededBooking).toBeDefined()

  return seededBooking
}

module.exports = {
  getSeededBookingWithPassengers,
  uniqueName,
  uniqueCustomerId,
  uniqueBookingId,
  createCustomer,
  trackBooking,
  removeTrackedBooking,
  createCruiseLine,
  createShip,
  cleanupTestData,
  trackCruiseLine,
  removeTrackedShip,
  removeTrackedCruiseLine
}
