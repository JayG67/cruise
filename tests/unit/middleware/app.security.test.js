const request = require('supertest')

const app = require('../../../app')

describe('application security headers', () => {
  it('sends defensive browser security headers on health responses', async () => {
    const res = await request(app).get('/health')

    expect(res.statusCode).toBe(200)
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBe('DENY')
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(res.headers['permissions-policy']).toContain('camera=()')
    expect(res.headers['permissions-policy']).toContain('microphone=()')
    expect(res.headers['permissions-policy']).toContain('geolocation=()')
    expect(res.headers['content-security-policy']).toContain("default-src 'self'")
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'")
  })

  it('does not treat spoofed production identity headers as authentication in production', async () => {
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

      expect(res.statusCode).toBe(403)
      expect(res.body.message).toMatch(/Admin access requires/i)
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV
      else process.env.NODE_ENV = previousNodeEnv
      if (previousSecret === undefined) delete process.env.CRUISE_JWT_SECRET
      else process.env.CRUISE_JWT_SECRET = previousSecret
    }
  })

})
