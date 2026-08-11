const {
  parsePositiveInteger,
  shouldEnforceRateLimits,
  attachRequestContext,
  securityHeaders,
  apiNoStore,
  getAuthenticatedRateLimitKey,
  createRateLimiter,
  mutationRateLimitWhenNeeded,
  aiRateLimitWhenNeeded,
  safeErrorDetails,
  errorHandler
} = require('../../middleware/security.middleware')

function createResponse() {
  const headers = {}
  return {
    headers,
    locals: {},
    statusCode: 200,
    body: undefined,
    headersSent: false,
    setHeader(name, value) {
      headers[String(name).toLowerCase()] = String(value)
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    }
  }
}

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

describe('security middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalRateLimitMode = process.env.CRUISE_RATE_LIMIT_MODE
  const originalAiRateLimit = process.env.CRUISE_AI_RATE_LIMIT

  afterEach(() => {
    restoreEnv('NODE_ENV', originalNodeEnv)
    restoreEnv('CRUISE_RATE_LIMIT_MODE', originalRateLimitMode)
    restoreEnv('CRUISE_AI_RATE_LIMIT', originalAiRateLimit)
  })

  it('normalizes positive integer configuration safely', () => {
    expect(parsePositiveInteger('42', 7)).toBe(42)
    expect(parsePositiveInteger('0', 7)).toBe(7)
    expect(parsePositiveInteger('-4', 7)).toBe(7)
    expect(parsePositiveInteger('nope', 7)).toBe(7)
  })

  it('enforces rate limits in production and only explicitly outside production', () => {
    process.env.NODE_ENV = 'test'
    process.env.CRUISE_RATE_LIMIT_MODE = 'disabled'
    expect(shouldEnforceRateLimits()).toBe(false)

    process.env.CRUISE_RATE_LIMIT_MODE = 'enabled'
    expect(shouldEnforceRateLimits()).toBe(true)

    process.env.NODE_ENV = 'production'
    process.env.CRUISE_RATE_LIMIT_MODE = 'disabled'
    expect(shouldEnforceRateLimits()).toBe(true)
  })

  it('attaches a server-generated request correlation id to the request and response', () => {
    const req = {}
    const res = createResponse()
    const next = jest.fn()

    attachRequestContext(req, res, next)

    expect(req.requestId).toMatch(/^[0-9a-f-]{36}$/i)
    expect(res.locals.requestId).toBe(req.requestId)
    expect(res.headers['x-request-id']).toBe(req.requestId)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('sets browser defense headers and enables HSTS only in production', () => {
    const req = {}
    const next = jest.fn()

    process.env.NODE_ENV = 'test'
    const testRes = createResponse()
    securityHeaders(req, testRes, next)
    expect(testRes.headers['strict-transport-security']).toBeUndefined()
    expect(testRes.headers['x-dns-prefetch-control']).toBe('off')
    expect(testRes.headers['cross-origin-opener-policy']).toBe('same-origin')
    expect(testRes.headers['cross-origin-resource-policy']).toBe('same-origin')
    expect(testRes.headers['content-security-policy']).toContain("object-src 'none'")

    process.env.NODE_ENV = 'production'
    const prodRes = createResponse()
    securityHeaders(req, prodRes, next)
    expect(prodRes.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains')
  })

  it('prevents API responses from being cached', () => {
    const res = createResponse()
    const next = jest.fn()
    apiNoStore({}, res, next)
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.headers.pragma).toBe('no-cache')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('prefers the authenticated principal for rate-limit keys and falls back to network identity', () => {
    expect(getAuthenticatedRateLimitKey({ requestIdentity: { principal: { userId: 'U0' } }, ip: '1.2.3.4' })).toBe('user:U0')
    expect(getAuthenticatedRateLimitKey({ identity: { userId: 'U1' }, ip: '1.2.3.4' })).toBe('user:U1')
    expect(getAuthenticatedRateLimitKey({ auth: { userId: 'U2' }, ip: '1.2.3.4' })).toBe('user:U2')
    expect(getAuthenticatedRateLimitKey({ user: { id: 'U3' }, ip: '1.2.3.4' })).toBe('user:U3')
    expect(getAuthenticatedRateLimitKey({ ip: '1.2.3.4' })).toBe('ip:1.2.3.4')
    expect(getAuthenticatedRateLimitKey({ socket: { remoteAddress: '::1' } })).toBe('ip:::1')
  })

  it('returns 429 with retry metadata after a configured limit is exceeded', () => {
    process.env.NODE_ENV = 'test'
    process.env.CRUISE_RATE_LIMIT_MODE = 'enabled'
    const limiter = createRateLimiter({ name: 'unit', limit: 2, windowMs: 60_000 })
    const req = { requestId: 'req-1', identity: { userId: 'U1' }, ip: '1.2.3.4' }

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const res = createResponse()
      const next = jest.fn()
      limiter(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.headers['ratelimit-limit']).toBe('2')
      expect(res.headers['ratelimit-remaining']).toBe(String(2 - attempt))
    }

    const blockedRes = createResponse()
    const blockedNext = jest.fn()
    limiter(req, blockedRes, blockedNext)
    expect(blockedNext).not.toHaveBeenCalled()
    expect(blockedRes.statusCode).toBe(429)
    expect(blockedRes.headers['retry-after']).toMatch(/^\d+$/)
    expect(blockedRes.body).toEqual({ message: 'Too many requests', requestId: 'req-1' })
  })

  it('bypasses rate limiting when enforcement is disabled', () => {
    process.env.NODE_ENV = 'test'
    process.env.CRUISE_RATE_LIMIT_MODE = 'disabled'
    const limiter = createRateLimiter({ name: 'disabled', limit: 1 })
    const next = jest.fn()

    limiter({ ip: '1.2.3.4' }, createResponse(), next)
    limiter({ ip: '1.2.3.4' }, createResponse(), next)

    expect(next).toHaveBeenCalledTimes(2)
  })

  it('applies the mutation limiter only to write methods', () => {
    process.env.NODE_ENV = 'test'
    process.env.CRUISE_RATE_LIMIT_MODE = 'disabled'
    const next = jest.fn()
    mutationRateLimitWhenNeeded({ method: 'GET' }, createResponse(), next)
    mutationRateLimitWhenNeeded({ method: 'PATCH', ip: '1.2.3.4' }, createResponse(), next)
    expect(next).toHaveBeenCalledTimes(2)
  })

  it('applies the stricter AI limiter to write requests without throttling read-only status checks', () => {
    process.env.NODE_ENV = 'test'
    process.env.CRUISE_RATE_LIMIT_MODE = 'enabled'
    process.env.CRUISE_AI_RATE_LIMIT = '1'
    const req = { method: 'GET', ip: '10.0.0.8', requestId: 'ai-read' }
    const readNext = jest.fn()
    aiRateLimitWhenNeeded(req, createResponse(), readNext)
    expect(readNext).toHaveBeenCalledTimes(1)

    const firstWriteNext = jest.fn()
    aiRateLimitWhenNeeded({ ...req, method: 'POST', requestId: 'ai-write-1' }, createResponse(), firstWriteNext)
    expect(firstWriteNext).toHaveBeenCalledTimes(1)

    const blockedRes = createResponse()
    aiRateLimitWhenNeeded({ ...req, method: 'POST', requestId: 'ai-write-2' }, blockedRes, jest.fn())
    expect(blockedRes.statusCode).toBe(429)
    expect(blockedRes.body.requestId).toBe('ai-write-2')
  })

  it('hides internal exception details in production but retains them for development diagnostics', () => {
    process.env.NODE_ENV = 'production'
    expect(safeErrorDetails(new Error('database password leaked'))).toBeUndefined()

    process.env.NODE_ENV = 'test'
    expect(safeErrorDetails(new Error('diagnostic detail'))).toBe('diagnostic detail')
  })

  it('returns a correlation id and no internal error detail for production 500 responses', () => {
    process.env.NODE_ENV = 'production'
    const res = createResponse()
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    errorHandler(new Error('sensitive database detail'), { requestId: 'req-prod' }, res, jest.fn())

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ message: 'Internal server error', requestId: 'req-prod' })
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('normalizes oversized and client-error responses without exposing server internals', () => {
    process.env.NODE_ENV = 'production'

    const tooLargeRes = createResponse()
    errorHandler({ status: 413, type: 'entity.too.large', message: 'body internals' }, { requestId: 'req-413' }, tooLargeRes, jest.fn())
    expect(tooLargeRes.statusCode).toBe(413)
    expect(tooLargeRes.body).toEqual({ message: 'Request payload too large', requestId: 'req-413' })

    const badRequestRes = createResponse()
    errorHandler({ statusCode: 400, message: 'parser internals' }, { requestId: 'req-400' }, badRequestRes, jest.fn())
    expect(badRequestRes.statusCode).toBe(400)
    expect(badRequestRes.body).toEqual({ message: 'Invalid request', requestId: 'req-400' })
  })

  it('delegates when headers were already sent', () => {
    const next = jest.fn()
    errorHandler(new Error('late'), { requestId: 'req-late' }, { headersSent: true, locals: {} }, next)
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})
