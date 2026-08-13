const express = require('express')
const request = require('supertest')
const {
  attachRequestContext,
  securityHeaders,
  apiNoStore,
  createRateLimiter,
  errorHandler
} = require('../../middleware/security.middleware')

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

describe('HTTP security hardening integration', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalRateLimitMode = process.env.CRUISE_RATE_LIMIT_MODE

  afterEach(() => {
    restoreEnv('NODE_ENV', originalNodeEnv)
    restoreEnv('CRUISE_RATE_LIMIT_MODE', originalRateLimitMode)
  })

  it('emits unique server correlation ids and defensive headers', async () => {
    process.env.NODE_ENV = 'production'
    const app = express()
    app.use(attachRequestContext)
    app.use(securityHeaders)
    app.get('/health', (req, res) => res.status(200).json({ requestId: req.requestId }))

    const first = await request(app).get('/health')
    const second = await request(app).get('/health')

    expect(first.statusCode).toBe(200)
    expect(first.headers['x-request-id']).toBe(first.body.requestId)
    expect(second.headers['x-request-id']).toBe(second.body.requestId)
    expect(first.body.requestId).not.toBe(second.body.requestId)
    expect(first.headers['strict-transport-security']).toContain('max-age=31536000')
    expect(first.headers['content-security-policy']).toContain("object-src 'none'")
  })

  it('enforces principal-scoped throttling with standard retry metadata', async () => {
    process.env.NODE_ENV = 'test'
    process.env.CRUISE_RATE_LIMIT_MODE = 'enabled'
    const limiter = createRateLimiter({ name: 'integration', limit: 2, windowMs: 60_000 })
    const app = express()
    app.use(attachRequestContext)
    app.use((req, res, next) => {
      req.identity = { userId: req.get('x-test-user') || 'anonymous' }
      next()
    })
    app.use(limiter)
    app.get('/api', (req, res) => res.status(200).json({ ok: true }))

    expect((await request(app).get('/api').set('x-test-user', 'U1')).statusCode).toBe(200)
    expect((await request(app).get('/api').set('x-test-user', 'U1')).statusCode).toBe(200)
    const blocked = await request(app).get('/api').set('x-test-user', 'U1')
    const otherUser = await request(app).get('/api').set('x-test-user', 'U2')

    expect(blocked.statusCode).toBe(429)
    expect(blocked.headers['retry-after']).toMatch(/^\d+$/)
    expect(blocked.body.message).toBe('Too many requests')
    expect(blocked.body.requestId).toBeTruthy()
    expect(otherUser.statusCode).toBe(200)
  })

  it('marks API responses no-store and returns safe production errors with the same request id', async () => {
    process.env.NODE_ENV = 'production'
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const app = express()
    app.use(attachRequestContext)
    app.use('/api', apiNoStore)
    app.get('/api/fail', (req, res, next) => next(new Error('database host and credential detail')))
    app.use(errorHandler)

    const response = await request(app).get('/api/fail')

    expect(response.statusCode).toBe(500)
    expect(response.headers['cache-control']).toBe('no-store')
    expect(response.body).toEqual({
      message: 'Internal server error',
      requestId: response.headers['x-request-id']
    })
    expect(response.text).not.toContain('database host')
    consoleSpy.mockRestore()
  })

  it('rejects oversized JSON payloads as 413 with safe correlation metadata', async () => {
    process.env.NODE_ENV = 'production'
    const app = express()
    app.use(attachRequestContext)
    app.use(express.json({ limit: '1kb' }))
    app.post('/api', (req, res) => res.status(204).end())
    app.use(errorHandler)

    const response = await request(app)
      .post('/api')
      .send({ payload: 'x'.repeat(2048) })

    expect(response.statusCode).toBe(413)
    expect(response.body).toEqual({
      message: 'Request payload too large',
      requestId: response.headers['x-request-id']
    })
  })
})
