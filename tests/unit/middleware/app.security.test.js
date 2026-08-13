const request = require('supertest')

jest.mock('../../../services/rateLimitStore.service', () => {
  const actual = jest.requireActual('../../../services/rateLimitStore.service')
  const unitTestStore = actual.createMemoryRateLimitStore()
  return { ...actual, getRateLimitStore: () => unitTestStore }
})

const app = require('../../../app')

describe('application security headers', () => {
  it('sends defensive browser security headers on health responses', async () => {
    const res = await request(app).get('/health')

    expect(res.statusCode).toBe(200)
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/i)
    expect(res.headers['x-powered-by']).toBeUndefined()
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBe('DENY')
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(res.headers['permissions-policy']).toContain('camera=()')
    expect(res.headers['permissions-policy']).toContain('microphone=()')
    expect(res.headers['permissions-policy']).toContain('geolocation=()')
    expect(res.headers['content-security-policy']).toContain("default-src 'self'")
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(res.headers['content-security-policy']).toContain("object-src 'none'")
    expect(res.headers['content-security-policy']).toContain("style-src 'self'")
    expect(res.headers['content-security-policy']).toContain("style-src-attr 'none'")
    expect(res.headers['content-security-policy']).toContain("script-src-attr 'none'")
    expect(res.headers['content-security-policy']).not.toContain("'unsafe-inline'")
    expect(res.headers['x-dns-prefetch-control']).toBe('off')
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin')
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin')
  })

  it('serves the Lighthouse audit shell without inline styles under the strict CSP', async () => {
    const page = await request(app).get('/lighthouse-ci')
    const stylesheet = await request(app).get('/lighthouse-ci.css')

    expect(page.statusCode).toBe(200)
    expect(page.text).toContain('rel="stylesheet" href="/lighthouse-ci.css"')
    expect(page.text).not.toContain('<style')
    expect(stylesheet.statusCode).toBe(200)
    expect(stylesheet.headers['content-type']).toMatch(/text\/css/)
  })

  it('keeps the destructive production reset endpoint unavailable even with spoofed identity headers', async () => {
    const previousNodeEnv = process.env.NODE_ENV
    const previousSecret = process.env.CRUISE_JWT_SECRET
    process.env.NODE_ENV = 'production'
    process.env.CRUISE_JWT_SECRET = '0123456789abcdef0123456789abcdef'

    try {
      const res = await request(app)
        .post('/admin/reset-demo-data')
        .set('X-Cruise-User-Id', 'attacker')
        .set('X-Cruise-User-Role', 'ADMIN')
        .set('X-Cruise-Demo-User-Id', 'UADMIN0001')

      // Production intentionally hides this destructive demo-only surface instead of
      // revealing whether a supplied identity would otherwise be authorized.
      expect(res.statusCode).toBe(404)
      expect(res.body).toEqual({ message: 'Not found' })
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV
      else process.env.NODE_ENV = previousNodeEnv
      if (previousSecret === undefined) delete process.env.CRUISE_JWT_SECRET
      else process.env.CRUISE_JWT_SECRET = previousSecret
    }
  })

})
