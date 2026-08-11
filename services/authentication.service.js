const crypto = require('crypto')

const AUTH_MODES = Object.freeze({
  DEMO: 'demo',
  JWT: 'jwt'
})

const DEFAULT_CLOCK_SKEW_SECONDS = 30
const MINIMUM_HS256_SECRET_LENGTH = 32

function getAuthenticationMode(env = process.env) {
  const configuredMode = String(env.CRUISE_AUTH_MODE || '').trim().toLowerCase()
  const isProduction = String(env.NODE_ENV || '').trim().toLowerCase() === 'production'

  if (isProduction) return AUTH_MODES.JWT
  if (configuredMode === AUTH_MODES.JWT) return AUTH_MODES.JWT
  return AUTH_MODES.DEMO
}

function isDemoAuthenticationEnabled(env = process.env) {
  return getAuthenticationMode(env) === AUTH_MODES.DEMO
}

function base64UrlDecode(value = '') {
  return Buffer.from(String(value), 'base64url')
}

function parseJsonSegment(segment = '', label = 'JWT segment') {
  try {
    return JSON.parse(base64UrlDecode(segment).toString('utf8'))
  } catch (error) {
    const tokenError = new Error(`${label} is invalid.`)
    tokenError.code = 'AUTH_TOKEN_INVALID'
    throw tokenError
  }
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.isBuffer(left) ? left : Buffer.from(String(left))
  const rightBuffer = Buffer.isBuffer(right) ? right : Buffer.from(String(right))
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function normalizeAudience(value) {
  if (Array.isArray(value)) return value.map(entry => String(entry))
  return value === undefined || value === null ? [] : [String(value)]
}

function verifyHs256Jwt(token, options = {}) {
  const parts = String(token || '').split('.')
  if (parts.length !== 3 || parts.some(part => !part)) {
    const error = new Error('Bearer token is malformed.')
    error.code = 'AUTH_TOKEN_INVALID'
    throw error
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const header = parseJsonSegment(encodedHeader, 'JWT header')
  const payload = parseJsonSegment(encodedPayload, 'JWT payload')

  if (header.alg !== 'HS256' || header.typ && header.typ !== 'JWT') {
    const error = new Error('Bearer token algorithm is not allowed.')
    error.code = 'AUTH_TOKEN_ALGORITHM_REJECTED'
    throw error
  }

  const secret = String(options.secret || '').trim()
  if (secret.length < MINIMUM_HS256_SECRET_LENGTH) {
    const error = new Error('JWT authentication is not configured with a sufficiently strong secret.')
    error.code = 'AUTH_CONFIG_INVALID'
    throw error
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = crypto.createHmac('sha256', secret).update(signingInput).digest()
  const providedSignature = base64UrlDecode(encodedSignature)
  if (!safeEqual(expectedSignature, providedSignature)) {
    const error = new Error('Bearer token signature is invalid.')
    error.code = 'AUTH_TOKEN_INVALID'
    throw error
  }

  const nowSeconds = Number.isFinite(options.nowSeconds) ? options.nowSeconds : Math.floor(Date.now() / 1000)
  const clockSkewSeconds = Number.isFinite(options.clockSkewSeconds)
    ? options.clockSkewSeconds
    : DEFAULT_CLOCK_SKEW_SECONDS

  if (!payload.sub || typeof payload.sub !== 'string') {
    const error = new Error('Bearer token subject is required.')
    error.code = 'AUTH_TOKEN_INVALID'
    throw error
  }
  if (!Number.isFinite(Number(payload.exp))) {
    const error = new Error('Bearer token expiration is required.')
    error.code = 'AUTH_TOKEN_INVALID'
    throw error
  }
  if (payload.exp !== undefined && Number(payload.exp) <= nowSeconds - clockSkewSeconds) {
    const error = new Error('Bearer token has expired.')
    error.code = 'AUTH_TOKEN_EXPIRED'
    throw error
  }
  if (payload.nbf !== undefined && Number(payload.nbf) > nowSeconds + clockSkewSeconds) {
    const error = new Error('Bearer token is not active yet.')
    error.code = 'AUTH_TOKEN_NOT_ACTIVE'
    throw error
  }
  if (options.issuer && payload.iss !== options.issuer) {
    const error = new Error('Bearer token issuer is invalid.')
    error.code = 'AUTH_TOKEN_INVALID'
    throw error
  }
  if (options.audience && !normalizeAudience(payload.aud).includes(String(options.audience))) {
    const error = new Error('Bearer token audience is invalid.')
    error.code = 'AUTH_TOKEN_INVALID'
    throw error
  }

  return payload
}

function getJwtVerificationOptions(env = process.env) {
  return {
    secret: env.CRUISE_JWT_SECRET,
    issuer: String(env.CRUISE_JWT_ISSUER || '').trim() || undefined,
    audience: String(env.CRUISE_JWT_AUDIENCE || '').trim() || undefined
  }
}


function validateJwtConfiguration(env = process.env) {
  if (getAuthenticationMode(env) !== AUTH_MODES.JWT) return true

  const secret = String(env.CRUISE_JWT_SECRET || '').trim()
  if (secret.length < MINIMUM_HS256_SECRET_LENGTH) {
    const error = new Error('JWT authentication requires CRUISE_JWT_SECRET with at least 32 characters.')
    error.code = 'AUTH_CONFIG_INVALID'
    throw error
  }

  const isProduction = String(env.NODE_ENV || '').trim().toLowerCase() === 'production'
  if (isProduction) {
    if (!String(env.CRUISE_JWT_ISSUER || '').trim()) {
      const error = new Error('Production JWT authentication requires CRUISE_JWT_ISSUER.')
      error.code = 'AUTH_CONFIG_INVALID'
      throw error
    }
    if (!String(env.CRUISE_JWT_AUDIENCE || '').trim()) {
      const error = new Error('Production JWT authentication requires CRUISE_JWT_AUDIENCE.')
      error.code = 'AUTH_CONFIG_INVALID'
      throw error
    }
  }

  return true
}

function extractBearerToken(req = {}) {
  const authorization = typeof req.get === 'function'
    ? req.get('Authorization')
    : req?.headers?.authorization
  const match = String(authorization || '').match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : ''
}

function buildJwtPrincipal(req = {}, env = process.env) {
  if (getAuthenticationMode(env) !== AUTH_MODES.JWT) return null
  const token = extractBearerToken(req)
  if (!token) return null

  const claims = verifyHs256Jwt(token, getJwtVerificationOptions(env))
  return {
    userId: claims.sub,
    email: claims.email ? String(claims.email) : null,
    displayName: String(claims.name || claims.email || claims.sub),
    role: claims.role ? String(claims.role) : null,
    tenantId: claims.tenantId || claims.tenant_id ? String(claims.tenantId || claims.tenant_id) : null,
    identitySource: 'jwt'
  }
}

module.exports = {
  AUTH_MODES,
  DEFAULT_CLOCK_SKEW_SECONDS,
  MINIMUM_HS256_SECRET_LENGTH,
  buildJwtPrincipal,
  extractBearerToken,
  getAuthenticationMode,
  getJwtVerificationOptions,
  isDemoAuthenticationEnabled,
  validateJwtConfiguration,
  verifyHs256Jwt
}
