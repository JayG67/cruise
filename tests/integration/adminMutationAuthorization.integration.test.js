const crypto = require('crypto')
const request = require('supertest')

const app = require('../../app')
const db = require('../../db')
const { cruiseLineTable } = require('../../models')

const ORIGINAL_AUTH_MODE = process.env.CRUISE_AUTH_MODE
const ORIGINAL_JWT_SECRET = process.env.CRUISE_JWT_SECRET
const JWT_SECRET = 'integration-security-secret-32-bytes-minimum-value'

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest('base64url')
  return `${signingInput}.${signature}`
}

function bearer(role = 'ADMIN') {
  const now = Math.floor(Date.now() / 1000)
  return `Bearer ${signToken({ sub: `integration-${role.toLowerCase()}`, role, name: `Integration ${role}`, exp: now + 300 })}`
}

const protectedRequests = [
  { method: 'post', path: '/cruise/turnaround-admin/people', body: {} },
  { method: 'patch', path: '/cruise/turnaround-admin/people/security-test-person', body: {} },
  { method: 'delete', path: '/cruise/turnaround-admin/people/security-test-person' },
  { method: 'post', path: '/cruise/cruise-line', body: {} },
  { method: 'patch', path: '/cruise/cruise-line/00000000-0000-4000-8000-000000000001', body: {} },
  { method: 'delete', path: '/cruise/cruise-line/00000000-0000-4000-8000-000000000001' },
  { method: 'post', path: '/cruise/ship', body: {} },
  { method: 'patch', path: '/cruise/ship/00000000-0000-4000-8000-000000000001', body: {} },
  { method: 'delete', path: '/cruise/ship/00000000-0000-4000-8000-000000000001' },
  { method: 'post', path: '/cruise/ship/00000000-0000-4000-8000-000000000001/sailings', body: {} },
  { method: 'patch', path: '/cruise/sailings/00000000-0000-4000-8000-000000000001', body: {} },
  { method: 'delete', path: '/cruise/sailings/00000000-0000-4000-8000-000000000001' },
  { method: 'post', path: '/cruise/sailings/00000000-0000-4000-8000-000000000001/itinerary', body: {} },
  { method: 'patch', path: '/cruise/itinerary-days/00000000-0000-4000-8000-000000000001', body: {} },
  { method: 'delete', path: '/cruise/itinerary-days/00000000-0000-4000-8000-000000000001' },
  { method: 'post', path: '/cruise/itinerary-days/00000000-0000-4000-8000-000000000001/activities', body: {} },
  { method: 'patch', path: '/cruise/activities/00000000-0000-4000-8000-000000000001', body: {} },
  { method: 'delete', path: '/cruise/activities/00000000-0000-4000-8000-000000000001' }
]

beforeAll(() => {
  process.env.CRUISE_AUTH_MODE = 'jwt'
  process.env.CRUISE_JWT_SECRET = JWT_SECRET
})

afterAll(() => {
  if (ORIGINAL_AUTH_MODE === undefined) delete process.env.CRUISE_AUTH_MODE
  else process.env.CRUISE_AUTH_MODE = ORIGINAL_AUTH_MODE

  if (ORIGINAL_JWT_SECRET === undefined) delete process.env.CRUISE_JWT_SECRET
  else process.env.CRUISE_JWT_SECRET = ORIGINAL_JWT_SECRET
})

describe('production administrator mutation authorization', () => {
  it.each(protectedRequests)('rejects anonymous $method $path before validation or mutation', async ({ method, path, body }) => {
    const call = request(app)[method](path)
    const response = body === undefined ? await call : await call.send(body)

    expect(response.statusCode).toBe(403)
    expect(response.body).toEqual({
      message: 'Admin access requires an admin request identity.'
    })
  })

  it('rejects a valid non-admin JWT on an administrator mutation', async () => {
    const response = await request(app)
      .post('/cruise/cruise-line')
      .set('Authorization', bearer('PASSENGER'))
      .send({
        name: 'Unauthorized Security Test Line',
        country: 'United States',
        website: 'https://unauthorized.example.com'
      })

    expect(response.statusCode).toBe(403)
  })

  it('allows a verified admin JWT to create and delete fleet data', async () => {
    const uniqueName = `Authorized Security Test Line ${Date.now()}`
    const createResponse = await request(app)
      .post('/cruise/cruise-line')
      .set('Authorization', bearer('ADMIN'))
      .send({
        name: uniqueName,
        country: 'United States',
        website: 'https://authorized.example.com'
      })

    expect(createResponse.statusCode).toBe(201)
    const createdId = createResponse.body.id

    try {
      const deleteResponse = await request(app)
        .delete(`/cruise/cruise-line/${createdId}`)
        .set('Authorization', bearer('ADMIN'))

      expect(deleteResponse.statusCode).toBe(200)
    } finally {
      if (createdId) {
        await db.delete(cruiseLineTable).where(require('drizzle-orm').eq(cruiseLineTable.id, createdId))
      }
    }
  })
})
