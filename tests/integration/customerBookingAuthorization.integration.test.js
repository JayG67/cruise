const crypto = require('crypto')
const request = require('supertest')
const { eq, ne } = require('drizzle-orm')

const app = require('../../app')
const db = require('../../db')
const bookingPassengerTable = require('../../models/bookingPassenger.model')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

const ORIGINAL_AUTH_MODE = process.env.CRUISE_AUTH_MODE
const ORIGINAL_JWT_SECRET = process.env.CRUISE_JWT_SECRET
const JWT_SECRET = 'customer-ownership-security-secret-32-byte-minimum'

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest('base64url')
  return `${signingInput}.${signature}`
}

function bearer({ sub, role }) {
  const now = Math.floor(Date.now() / 1000)
  return `Bearer ${signToken({ sub, role, name: `${role} security test`, exp: now + 300 })}`
}

const passengerOne = bearer({ sub: 'UPASS00001', role: 'PASSENGER' })
const passengerTwo = bearer({ sub: 'UPASS00002', role: 'PASSENGER' })
const admin = bearer({ sub: 'UADMIN0001', role: 'ADMIN' })

async function findBookingFor(customerId) {
  const rows = await db.select().from(bookingPassengerTable).where(eq(bookingPassengerTable.customerId, customerId)).limit(1)
  if (!rows[0]) throw new Error(`Expected seeded booking for ${customerId}`)
  return rows[0].bookingId
}

async function findBookingNotFor(customerId) {
  const rows = await db.select().from(bookingPassengerTable).where(ne(bookingPassengerTable.customerId, customerId))
  const ownRows = await db.select().from(bookingPassengerTable).where(eq(bookingPassengerTable.customerId, customerId))
  const ownBookingIds = new Set(ownRows.map(row => row.bookingId))
  const candidate = rows.find(row => !ownBookingIds.has(row.bookingId))
  if (!candidate) throw new Error(`Expected seeded booking not visible to ${customerId}`)
  return candidate.bookingId
}

beforeAll(async () => {
  process.env.CRUISE_AUTH_MODE = 'jwt'
  process.env.CRUISE_JWT_SECRET = JWT_SECRET
  await initializeDatabase()
  await loadCruiseData()
})

afterAll(() => {
  if (ORIGINAL_AUTH_MODE === undefined) delete process.env.CRUISE_AUTH_MODE
  else process.env.CRUISE_AUTH_MODE = ORIGINAL_AUTH_MODE

  if (ORIGINAL_JWT_SECRET === undefined) delete process.env.CRUISE_JWT_SECRET
  else process.env.CRUISE_JWT_SECRET = ORIGINAL_JWT_SECRET
})

describe('production customer and booking ownership authorization', () => {
  it('keeps bulk customer and booking datasets administrator-only', async () => {
    const [anonymousCustomers, passengerCustomers, passengerBookings, adminCustomers, adminBookings] = await Promise.all([
      request(app).get('/cruise/customers'),
      request(app).get('/cruise/customers').set('Authorization', passengerOne),
      request(app).get('/cruise/bookings').set('Authorization', passengerOne),
      request(app).get('/cruise/customers').set('Authorization', admin),
      request(app).get('/cruise/bookings').set('Authorization', admin)
    ])

    expect(anonymousCustomers.statusCode).toBe(403)
    expect(passengerCustomers.statusCode).toBe(403)
    expect(passengerBookings.statusCode).toBe(403)
    expect(adminCustomers.statusCode).toBe(200)
    expect(adminBookings.statusCode).toBe(200)
  })

  it('allows passengers to read their own customer record and blocks cross-customer IDOR reads', async () => {
    const own = await request(app)
      .get('/cruise/customers/C000000001')
      .set('Authorization', passengerOne)
    const other = await request(app)
      .get('/cruise/customers/C000000002')
      .set('Authorization', passengerOne)

    expect(own.statusCode).toBe(200)
    expect(own.body.id).toBe('C000000001')
    expect(other.statusCode).toBe(403)
    expect(other.body).toEqual({ message: 'You do not have access to this customer record.' })
  })

  it('allows only booking participants to read booking detail', async () => {
    const ownBookingId = await findBookingFor('C000000001')
    const otherBookingId = await findBookingNotFor('C000000001')

    const own = await request(app)
      .get(`/cruise/bookings/${ownBookingId}`)
      .set('Authorization', passengerOne)
    const other = await request(app)
      .get(`/cruise/bookings/${otherBookingId}`)
      .set('Authorization', passengerOne)

    expect(own.statusCode).toBe(200)
    expect(own.body.id).toBe(ownBookingId)
    expect(other.statusCode).toBe(403)
    expect(other.body).toEqual({ message: 'You do not have access to this booking record.' })
  })

  it('blocks cross-customer passenger profile and checklist mutations before validation', async () => {
    const profile = await request(app)
      .patch('/cruise/customers/C000000002/passenger-profile')
      .set('Authorization', passengerOne)
      .send({})
    const checklist = await request(app)
      .patch('/cruise/customers/C000000002/pre-cruise-checklist')
      .set('Authorization', passengerOne)
      .send({})

    expect(profile.statusCode).toBe(403)
    expect(checklist.statusCode).toBe(403)
  })

  it('allows an owned self-service request to reach validation without mutating data', async () => {
    const response = await request(app)
      .patch('/cruise/customers/C000000001/passenger-profile')
      .set('Authorization', passengerOne)
      .send({})

    expect(response.statusCode).toBe(400)
  })

  it('binds booking preferences to both the authenticated customer and an accessible booking', async () => {
    const ownBookingId = await findBookingFor('C000000001')

    const invalidPreferencePayload = { unexpectedField: 'must fail strict validation' }
    const crossCustomer = await request(app)
      .patch(`/cruise/bookings/${ownBookingId}/passengers/C000000002/preferences`)
      .set('Authorization', passengerOne)
      .send(invalidPreferencePayload)
    const ownCustomer = await request(app)
      .patch(`/cruise/bookings/${ownBookingId}/passengers/C000000001/preferences`)
      .set('Authorization', passengerOne)
      .send(invalidPreferencePayload)

    expect(crossCustomer.statusCode).toBe(403)
    expect(ownCustomer.statusCode).toBe(400)
  })

  it('binds itinerary favorite mutations to the authenticated customer', async () => {
    const crossCustomer = await request(app)
      .post('/cruise/itinerary-favorites')
      .set('Authorization', passengerOne)
      .send({ customerId: 'C000000002' })
    const ownCustomer = await request(app)
      .post('/cruise/itinerary-favorites')
      .set('Authorization', passengerOne)
      .send({ customerId: 'C000000001' })

    expect(crossCustomer.statusCode).toBe(403)
    expect(ownCustomer.statusCode).toBe(400)
  })

  it('binds passenger-led booking creation to the authenticated customer before validation', async () => {
    const forged = await request(app)
      .post('/cruise/bookings')
      .set('Authorization', passengerOne)
      .send({
        createdByCustomerId: 'C000000002',
        passengers: [{ customerId: 'C000000002' }]
      })
    const forgedCompanion = await request(app)
      .post('/cruise/bookings')
      .set('Authorization', passengerOne)
      .send({
        createdByCustomerId: 'C000000001',
        passengers: [{ customerId: 'C000000001' }, { customerId: 'C000000002' }]
      })
    const ownedButInvalid = await request(app)
      .post('/cruise/bookings')
      .set('Authorization', passengerOne)
      .send({
        createdByCustomerId: 'C000000001',
        passengers: [{ customerId: 'C000000001' }]
      })

    expect(forged.statusCode).toBe(403)
    expect(forged.body).toEqual({ message: 'Bookings must be created for the authenticated customer.' })
    expect(forgedCompanion.statusCode).toBe(403)
    expect(ownedButInvalid.statusCode).toBe(400)
  })

  it('keeps generic customer and booking administration restricted to administrators', async () => {
    const ownBookingId = await findBookingFor('C000000001')
    const customerUpdate = await request(app)
      .patch('/cruise/customers/C000000001')
      .set('Authorization', passengerOne)
      .send({})
    const bookingUpdate = await request(app)
      .patch(`/cruise/bookings/${ownBookingId}`)
      .set('Authorization', passengerOne)
      .send({})
    const addPassenger = await request(app)
      .post(`/cruise/bookings/${ownBookingId}/passengers`)
      .set('Authorization', passengerOne)
      .send({})

    expect(customerUpdate.statusCode).toBe(403)
    expect(bookingUpdate.statusCode).toBe(403)
    expect(addPassenger.statusCode).toBe(403)
  })

  it('does not let another authenticated passenger inherit the first passenger ownership scope', async () => {
    const firstCustomer = await request(app)
      .get('/cruise/customers/C000000001')
      .set('Authorization', passengerTwo)
    const secondCustomer = await request(app)
      .get('/cruise/customers/C000000002')
      .set('Authorization', passengerTwo)

    expect(firstCustomer.statusCode).toBe(403)
    expect(secondCustomer.statusCode).toBe(200)
  })
})
