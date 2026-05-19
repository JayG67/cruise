const request = require('supertest')
const app = require('../../../app')

const createdCruiseLineIds = []
const createdShipIds = []
const createdCustomerIds = []
const createdBookingIds = []


function uniqueCustomerId() {
  return `C${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`
}

function uniqueBookingId() {
  return `B${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`
}

async function createCustomer(overrides = {}) {
  const id = overrides.id || uniqueCustomerId()
  const payload = {
    id,
    firstName: 'Integration',
    lastName: 'Customer',
    email: `${id.toLowerCase()}@example.com`,
    phone: '555-0199',
    loyaltyNumber: `LOYALTY-${id}`,
    ...overrides
  }

  const res = await request(app)
    .post('/cruise/customers')
    .send(payload)

  expect(res.statusCode).toBe(201)

  createdCustomerIds.push(id)

  return payload
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

  const res = await request(app)
    .post('/cruise/cruise-line')
    .send(payload)

  expect(res.statusCode).toBe(201)
  expect(res.body).toHaveProperty('id')

  createdCruiseLineIds.push(res.body.id)

  return {
    id: res.body.id,
    ...payload
  }
}

async function createShip(cruiseLineId, overrides = {}) {
  const payload = {
    name: uniqueName('Integration Ship'),
    currentPort: 'Miami, Florida',
    cruiseLineId,
    ...overrides
  }

  const res = await request(app)
    .post('/cruise/ship')
    .send(payload)

  expect(res.statusCode).toBe(201)
  expect(res.body).toHaveProperty('id')

  createdShipIds.push(res.body.id)

  return {
    id: res.body.id,
    ...payload
  }
}

async function cleanupTestData() {
  for (const bookingId of [...createdBookingIds]) {
    await request(app).delete(`/cruise/bookings/${bookingId}`)
  }

  for (const customerId of [...createdCustomerIds]) {
    await request(app).delete(`/cruise/customers/${customerId}`)
  }

  for (const shipId of [...createdShipIds]) {
    await request(app).delete(`/cruise/ship/${shipId}`)
  }

  for (const cruiseLineId of [...createdCruiseLineIds]) {
    await request(app).delete(`/cruise/cruise-line/${cruiseLineId}`)
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

module.exports = {
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