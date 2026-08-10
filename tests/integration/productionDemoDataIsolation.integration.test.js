const crypto = require('crypto')
const request = require('supertest')

const app = require('../../app')

function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const unsigned = `${base64Url(header)}.${base64Url(payload)}`
  const signature = crypto.createHmac('sha256', secret).update(unsigned).digest('base64url')
  return `${unsigned}.${signature}`
}

describe('production demo-data isolation', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalMode = process.env.CRUISE_DEMO_DATA_MODE
  const originalSecret = process.env.CRUISE_JWT_SECRET
  const secret = '0123456789abcdef0123456789abcdef'

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = originalNodeEnv

    if (originalMode === undefined) delete process.env.CRUISE_DEMO_DATA_MODE
    else process.env.CRUISE_DEMO_DATA_MODE = originalMode

    if (originalSecret === undefined) delete process.env.CRUISE_JWT_SECRET
    else process.env.CRUISE_JWT_SECRET = originalSecret
  })

  function useProductionEnvironment() {
    process.env.NODE_ENV = 'production'
    process.env.CRUISE_DEMO_DATA_MODE = 'enabled'
    process.env.CRUISE_JWT_SECRET = secret
  }

  it('does not publish the root seed dataset in production', async () => {
    useProductionEnvironment()

    const response = await request(app).get('/data/cruise.json')

    expect(response.statusCode).toBe(404)
    expect(response.text).toBe('Not found')
  })

  it('does not allow even a verified administrator to destructively reset demo data in production', async () => {
    useProductionEnvironment()
    const token = signJwt({
      sub: 'security-admin',
      role: 'ADMIN',
      exp: Math.floor(Date.now() / 1000) + 300
    }, secret)

    const response = await request(app)
      .post('/admin/reset-demo-data')
      .set('Authorization', `Bearer ${token}`)

    expect(response.statusCode).toBe(404)
    expect(response.body).toEqual({ message: 'Not found' })
  })

  it('keeps deterministic seed hosting available in test mode for the portfolio and browser suites', async () => {
    process.env.NODE_ENV = 'test'
    process.env.CRUISE_DEMO_DATA_MODE = 'enabled'

    const response = await request(app).get('/data/cruise.json')

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toMatch(/application\/json/)
    expect(response.body).toEqual(expect.objectContaining({
      cruiseLines: expect.any(Array),
      customers: expect.any(Array),
      bookings: expect.any(Array)
    }))
  })
})
