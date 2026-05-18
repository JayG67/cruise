const request = require('supertest')
const app = require('../../../app')

const createdCruiseLineIds = []
const createdShipIds = []

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
  for (const shipId of [...createdShipIds]) {
    await request(app).delete(`/cruise/ship/${shipId}`)
  }

  for (const cruiseLineId of [...createdCruiseLineIds]) {
    await request(app).delete(`/cruise/cruise-line/${cruiseLineId}`)
  }

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
  createCruiseLine,
  createShip,
  cleanupTestData,
  trackCruiseLine,
  removeTrackedShip,
  removeTrackedCruiseLine
}