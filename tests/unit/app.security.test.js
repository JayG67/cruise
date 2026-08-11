const request = require('supertest')

const app = require('../../app')

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
    expect(res.headers['x-dns-prefetch-control']).toBe('off')
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin')
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin')
  })
})
