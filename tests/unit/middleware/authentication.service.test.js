const crypto = require('crypto')

const authentication = require('../../../services/authentication.service')

function signToken(payload, secret, header = { alg: 'HS256', typ: 'JWT' }) {
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(`${encodedHeader}.${encodedPayload}`).digest('base64url')
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

describe('authentication service', () => {
  const secret = '0123456789abcdef0123456789abcdef'

  it('forces production into JWT mode even when demo mode is requested', () => {
    expect(authentication.getAuthenticationMode({ NODE_ENV: 'production', CRUISE_AUTH_MODE: 'demo' })).toBe('jwt')
    expect(authentication.isDemoAuthenticationEnabled({ NODE_ENV: 'production', CRUISE_AUTH_MODE: 'demo' })).toBe(false)
  })

  it('keeps demo identity available outside production for local and test workflows', () => {
    expect(authentication.getAuthenticationMode({ NODE_ENV: 'development' })).toBe('demo')
    expect(authentication.getAuthenticationMode({ NODE_ENV: 'test', CRUISE_AUTH_MODE: 'demo' })).toBe('demo')
  })

  it('verifies signed HS256 claims including issuer and audience', () => {
    const payload = {
      sub: 'admin-1',
      role: 'ADMIN',
      iss: 'https://identity.example.test',
      aud: 'cruise-api',
      exp: 2000
    }
    const token = signToken(payload, secret)

    expect(authentication.verifyHs256Jwt(token, {
      secret,
      issuer: payload.iss,
      audience: payload.aud,
      nowSeconds: 1000
    })).toEqual(payload)
  })

  it('rejects tampered, expired, and wrong-audience bearer tokens', () => {
    const valid = signToken({ sub: 'admin-1', aud: 'cruise-api', exp: 2000 }, secret)
    const tampered = `${valid.slice(0, -1)}${valid.endsWith('a') ? 'b' : 'a'}`
    expect(() => authentication.verifyHs256Jwt(tampered, { secret, nowSeconds: 1000 })).toThrow('signature')

    const expired = signToken({ sub: 'admin-1', exp: 900 }, secret)
    expect(() => authentication.verifyHs256Jwt(expired, { secret, nowSeconds: 1000, clockSkewSeconds: 0 })).toThrow('expired')

    expect(() => authentication.verifyHs256Jwt(valid, {
      secret,
      audience: 'different-api',
      nowSeconds: 1000
    })).toThrow('audience')
  })

  it('requires a strong secret plus issuer and audience for production JWT configuration', () => {
    expect(() => authentication.validateJwtConfiguration({ NODE_ENV: 'production', CRUISE_JWT_SECRET: 'short' })).toThrow('CRUISE_JWT_SECRET')
    expect(() => authentication.validateJwtConfiguration({ NODE_ENV: 'production', CRUISE_JWT_SECRET: secret })).toThrow('CRUISE_JWT_ISSUER')
    expect(() => authentication.validateJwtConfiguration({ NODE_ENV: 'production', CRUISE_JWT_SECRET: secret, CRUISE_JWT_ISSUER: 'https://identity.example.test' })).toThrow('CRUISE_JWT_AUDIENCE')
    expect(authentication.validateJwtConfiguration({
      NODE_ENV: 'production',
      CRUISE_JWT_SECRET: secret,
      CRUISE_JWT_ISSUER: 'https://identity.example.test',
      CRUISE_JWT_AUDIENCE: 'cruise-api'
    })).toBe(true)
  })

  it('keeps non-production JWT issuer and audience optional for integration harnesses', () => {
    expect(authentication.validateJwtConfiguration({
      NODE_ENV: 'test',
      CRUISE_AUTH_MODE: 'jwt',
      CRUISE_JWT_SECRET: secret
    })).toBe(true)
  })

  it('builds production principals only from verified bearer tokens', () => {
    const token = signToken({
      sub: 'auth-user-1',
      email: 'admin@example.com',
      name: 'Operations Admin',
      role: 'ADMIN',
      tenant_id: 'tenant-1',
      iss: 'https://identity.example.test',
      aud: 'cruise-api',
      exp: Math.floor(Date.now() / 1000) + 60
    }, secret)
    const req = { headers: { authorization: `Bearer ${token}` } }

    expect(authentication.buildJwtPrincipal(req, {
      NODE_ENV: 'production',
      CRUISE_JWT_SECRET: secret,
      CRUISE_JWT_ISSUER: 'https://identity.example.test',
      CRUISE_JWT_AUDIENCE: 'cruise-api'
    })).toEqual({
      userId: 'auth-user-1',
      email: 'admin@example.com',
      displayName: 'Operations Admin',
      role: 'ADMIN',
      tenantId: 'tenant-1',
      identitySource: 'jwt'
    })
  })
})
