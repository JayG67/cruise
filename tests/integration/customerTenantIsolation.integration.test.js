const crypto = require('crypto')
const request = require('supertest')
const { eq, inArray } = require('drizzle-orm')

const app = require('../../app')
const db = require('../../db')
const {
  appUserRoleTable,
  appUserTable,
  bookingPassengerTable,
  bookingTable,
  cruiseLineTable,
  customerTable,
  sailingTable,
  shipTable
} = require('../../models')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

const ORIGINAL_AUTH_MODE = process.env.CRUISE_AUTH_MODE
const ORIGINAL_JWT_SECRET = process.env.CRUISE_JWT_SECRET
const JWT_SECRET = 'customer-tenant-isolation-secret-32-byte-minimum'
const TENANT_ADMIN_ID = 'customer-tenant-admin-test'
const TENANT_ROLE_ID = `${TENANT_ADMIN_ID}-admin`

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest('base64url')
  return `${signingInput}.${signature}`
}

function bearer(sub, role, tenantId = null) {
  const now = Math.floor(Date.now() / 1000)
  const payload = { sub, role, name: `${role} customer tenant test`, exp: now + 300 }
  if (tenantId) payload.tenantId = tenantId
  return `Bearer ${signToken(payload)}`
}

function shortId(prefix) {
  return `${prefix}${crypto.randomBytes(5).toString('hex').toUpperCase().slice(0, 9)}`
}

let ownLine
let otherLine
let ownSailing
let otherSailing
let ownCustomerId
let otherCustomerId
let ownBookingId
let otherBookingId

beforeAll(async () => {
  process.env.CRUISE_AUTH_MODE = 'jwt'
  process.env.CRUISE_JWT_SECRET = JWT_SECRET
  await initializeDatabase()
  await loadCruiseData()

  const lines = await db.select().from(cruiseLineTable)
  if (lines.length < 2) throw new Error('Customer tenant isolation requires at least two cruise lines')
  ;[ownLine, otherLine] = lines

  const ownShip = (await db.select().from(shipTable).where(eq(shipTable.cruiseLineId, ownLine.id)).limit(1))[0]
  const otherShip = (await db.select().from(shipTable).where(eq(shipTable.cruiseLineId, otherLine.id)).limit(1))[0]
  ownSailing = (await db.select().from(sailingTable).where(eq(sailingTable.shipId, ownShip.id)).limit(1))[0]
  otherSailing = (await db.select().from(sailingTable).where(eq(sailingTable.shipId, otherShip.id)).limit(1))[0]

  if (!ownSailing || !otherSailing) throw new Error('Customer tenant isolation requires sailings in both tenants')

  ownCustomerId = shortId('C')
  otherCustomerId = shortId('C')
  ownBookingId = shortId('B')
  otherBookingId = shortId('B')

  await db.insert(customerTable).values([
    { id: ownCustomerId, firstName: 'Own', lastName: 'Tenant', email: `${ownCustomerId.toLowerCase()}@example.com` },
    { id: otherCustomerId, firstName: 'Other', lastName: 'Tenant', email: `${otherCustomerId.toLowerCase()}@example.com` }
  ])

  await db.insert(bookingTable).values([
    { id: ownBookingId, sailingId: ownSailing.id, bookingStatus: 'CONFIRMED', createdByCustomerId: ownCustomerId },
    { id: otherBookingId, sailingId: otherSailing.id, bookingStatus: 'CONFIRMED', createdByCustomerId: otherCustomerId }
  ])

  await db.insert(bookingPassengerTable).values([
    { id: `${ownBookingId}-${ownCustomerId}`, bookingId: ownBookingId, customerId: ownCustomerId, passengerRole: 'PRIMARY', isPrimaryGuest: true },
    { id: `${otherBookingId}-${otherCustomerId}`, bookingId: otherBookingId, customerId: otherCustomerId, passengerRole: 'PRIMARY', isPrimaryGuest: true }
  ])

  await db.insert(appUserTable).values({
    id: TENANT_ADMIN_ID,
    displayName: 'Customer Tenant Admin Test',
    email: `${TENANT_ADMIN_ID}@cruise-explorer.local`,
    userType: 'EMPLOYEE',
    primaryCustomerId: null,
    cruiseLineId: ownLine.id,
    assignedShipId: null,
    status: 'ACTIVE'
  }).onConflictDoNothing()

  await db.insert(appUserRoleTable).values({
    id: TENANT_ROLE_ID,
    userId: TENANT_ADMIN_ID,
    roleId: 'admin',
    assignmentScope: 'CRUISE_LINE',
    cruiseLineId: ownLine.id,
    assignedShipId: null,
    status: 'ACTIVE'
  }).onConflictDoNothing()

  global.registerDatabaseCleanup(async () => {
    await db.delete(bookingPassengerTable).where(inArray(bookingPassengerTable.bookingId, [ownBookingId, otherBookingId]))
    await db.delete(bookingTable).where(inArray(bookingTable.id, [ownBookingId, otherBookingId]))
    await db.delete(customerTable).where(inArray(customerTable.id, [ownCustomerId, otherCustomerId]))
    await db.delete(appUserRoleTable).where(eq(appUserRoleTable.id, TENANT_ROLE_ID))
    await db.delete(appUserTable).where(eq(appUserTable.id, TENANT_ADMIN_ID))
  })
})

afterAll(() => {
  if (ORIGINAL_AUTH_MODE === undefined) delete process.env.CRUISE_AUTH_MODE
  else process.env.CRUISE_AUTH_MODE = ORIGINAL_AUTH_MODE
  if (ORIGINAL_JWT_SECRET === undefined) delete process.env.CRUISE_JWT_SECRET
  else process.env.CRUISE_JWT_SECRET = ORIGINAL_JWT_SECRET
})

describe('Slice 9 passenger/customer tenant isolation', () => {
  it('tenant-filters bulk customer and booking reads', async () => {
    const token = bearer(TENANT_ADMIN_ID, 'ADMIN', ownLine.id)
    const [customers, bookings] = await Promise.all([
      request(app).get('/cruise/customers').set('Authorization', token),
      request(app).get('/cruise/bookings').set('Authorization', token)
    ])

    expect(customers.statusCode).toBe(200)
    expect(bookings.statusCode).toBe(200)
    expect(customers.body.some(row => row.id === ownCustomerId)).toBe(true)
    expect(customers.body.some(row => row.id === otherCustomerId)).toBe(false)
    expect(bookings.body.some(row => row.id === ownBookingId)).toBe(true)
    expect(bookings.body.some(row => row.id === otherBookingId)).toBe(false)
  })

  it('allows tenant-admin detail reads only for customer and booking records in scope', async () => {
    const token = bearer(TENANT_ADMIN_ID, 'ADMIN', ownLine.id)
    const [ownCustomer, otherCustomer, ownBooking, otherBooking] = await Promise.all([
      request(app).get(`/cruise/customers/${ownCustomerId}`).set('Authorization', token),
      request(app).get(`/cruise/customers/${otherCustomerId}`).set('Authorization', token),
      request(app).get(`/cruise/bookings/${ownBookingId}`).set('Authorization', token),
      request(app).get(`/cruise/bookings/${otherBookingId}`).set('Authorization', token)
    ])

    expect(ownCustomer.statusCode).toBe(200)
    expect(otherCustomer.statusCode).toBe(403)
    expect(ownBooking.statusCode).toBe(200)
    expect(otherBooking.statusCode).toBe(403)
  })

  it('blocks cross-tenant customer/booking mutation and destination sailing reassignment before validation', async () => {
    const token = bearer(TENANT_ADMIN_ID, 'ADMIN', ownLine.id)
    const ownCustomer = await request(app).patch(`/cruise/customers/${ownCustomerId}`).set('Authorization', token).send({})
    const otherCustomer = await request(app).patch(`/cruise/customers/${otherCustomerId}`).set('Authorization', token).send({})
    const otherBooking = await request(app).delete(`/cruise/bookings/${otherBookingId}`).set('Authorization', token)
    const moveBooking = await request(app)
      .patch(`/cruise/bookings/${ownBookingId}`)
      .set('Authorization', token)
      .send({ sailingId: otherSailing.id })

    expect(ownCustomer.statusCode).toBe(400)
    expect(otherCustomer.statusCode).toBe(403)
    expect(otherBooking.statusCode).toBe(403)
    expect(moveBooking.statusCode).toBe(403)
  })

  it('rejects a conflicting JWT tenant claim even when the resource belongs to the server assignment', async () => {
    const response = await request(app)
      .get(`/cruise/bookings/${ownBookingId}`)
      .set('Authorization', bearer(TENANT_ADMIN_ID, 'ADMIN', otherLine.id))

    expect(response.statusCode).toBe(403)
  })

  it('preserves GLOBAL-admin visibility and reserves unscoped customer creation for GLOBAL admin', async () => {
    const globalAdmin = bearer('UADMIN0001', 'ADMIN')
    const tenantAdmin = bearer(TENANT_ADMIN_ID, 'ADMIN', ownLine.id)

    const [globalBooking, readiness, tenantReadiness, tenantCustomerCreate] = await Promise.all([
      request(app).get(`/cruise/bookings/${otherBookingId}`).set('Authorization', globalAdmin),
      request(app).get('/cruise/deployment/readiness').set('Authorization', globalAdmin),
      request(app).get('/cruise/deployment/readiness').set('Authorization', tenantAdmin),
      request(app).post('/cruise/customers').set('Authorization', tenantAdmin).send({})
    ])

    expect(globalBooking.statusCode).toBe(200)
    expect(readiness.statusCode).toBe(200)
    expect(tenantReadiness.statusCode).toBe(403)
    expect(tenantCustomerCreate.statusCode).toBe(403)
  })

  it('hides demo identity and context endpoints in JWT mode', async () => {
    const [users, context] = await Promise.all([
      request(app).get('/cruise/demo-users'),
      request(app).get('/cruise/demo-users/UPASS00001/context')
    ])

    expect(users.statusCode).toBe(404)
    expect(context.statusCode).toBe(404)
  })
})
