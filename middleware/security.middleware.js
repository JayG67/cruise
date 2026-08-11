const crypto = require('crypto')

const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const DEFAULT_API_LIMIT = 600
const DEFAULT_MUTATION_LIMIT = 180
const DEFAULT_AI_LIMIT = 30
const MAX_RATE_LIMIT_BUCKETS = 10000

function isProduction() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production'
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function shouldEnforceRateLimits() {
  if (isProduction()) return true
  const mode = String(process.env.CRUISE_RATE_LIMIT_MODE || '').trim().toLowerCase()
  return mode === 'enabled' || mode === 'enforce'
}

function getRequestId() {
  return crypto.randomUUID()
}

function attachRequestContext(req, res, next) {
  const requestId = getRequestId()
  req.requestId = requestId
  res.locals.requestId = requestId
  res.setHeader('X-Request-Id', requestId)
  next()
}

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader('X-DNS-Prefetch-Control', 'off')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data:",
      "object-src 'none'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'"
    ].join('; ')
  )

  if (isProduction()) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  next()
}

function apiNoStore(req, res, next) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Pragma', 'no-cache')
  next()
}

function getAuthenticatedRateLimitKey(req) {
  const principalId = req.requestIdentity?.principal?.userId || req.identity?.userId || req.auth?.userId || req.user?.id
  if (principalId) return `user:${principalId}`
  return `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`
}

function pruneBuckets(buckets, now, windowMs) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }

  if (buckets.size <= MAX_RATE_LIMIT_BUCKETS) return

  const overflow = buckets.size - MAX_RATE_LIMIT_BUCKETS
  let removed = 0
  for (const key of buckets.keys()) {
    buckets.delete(key)
    removed += 1
    if (removed >= overflow) break
  }
}

function createRateLimiter({
  name,
  limit,
  windowMs = DEFAULT_RATE_LIMIT_WINDOW_MS,
  keyGenerator = getAuthenticatedRateLimitKey
}) {
  const buckets = new Map()

  return function rateLimitMiddleware(req, res, next) {
    if (!shouldEnforceRateLimits()) return next()

    const now = Date.now()
    const configuredLimit = typeof limit === 'function' ? limit() : limit
    const effectiveLimit = parsePositiveInteger(configuredLimit, DEFAULT_API_LIMIT)
    const effectiveWindowMs = parsePositiveInteger(windowMs, DEFAULT_RATE_LIMIT_WINDOW_MS)
    const key = `${name}:${keyGenerator(req)}`
    let bucket = buckets.get(key)

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + effectiveWindowMs }
      buckets.set(key, bucket)
    }

    bucket.count += 1
    const remaining = Math.max(0, effectiveLimit - bucket.count)
    const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))

    res.setHeader('RateLimit-Limit', String(effectiveLimit))
    res.setHeader('RateLimit-Remaining', String(remaining))
    res.setHeader('RateLimit-Reset', String(resetSeconds))

    if (bucket.count > effectiveLimit) {
      res.setHeader('Retry-After', String(resetSeconds))
      return res.status(429).json({
        message: 'Too many requests',
        requestId: req.requestId || null
      })
    }

    if (buckets.size > MAX_RATE_LIMIT_BUCKETS || bucket.count === 1) {
      pruneBuckets(buckets, now, effectiveWindowMs)
    }

    return next()
  }
}

function createConfiguredRateLimiter({ name, envLimit, fallback, windowMs = DEFAULT_RATE_LIMIT_WINDOW_MS }) {
  return createRateLimiter({
    name,
    limit: () => parsePositiveInteger(process.env[envLimit], fallback),
    windowMs
  })
}

const generalApiRateLimit = createConfiguredRateLimiter({
  name: 'general-api',
  envLimit: 'CRUISE_API_RATE_LIMIT',
  fallback: DEFAULT_API_LIMIT
})

const mutationRateLimit = createConfiguredRateLimiter({
  name: 'mutation',
  envLimit: 'CRUISE_MUTATION_RATE_LIMIT',
  fallback: DEFAULT_MUTATION_LIMIT
})

const aiRateLimit = createConfiguredRateLimiter({
  name: 'ai',
  envLimit: 'CRUISE_AI_RATE_LIMIT',
  fallback: DEFAULT_AI_LIMIT,
  windowMs: 60 * 60 * 1000
})

function mutationRateLimitWhenNeeded(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return mutationRateLimit(req, res, next)
  }
  return next()
}


function aiRateLimitWhenNeeded(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return aiRateLimit(req, res, next)
  }
  return next()
}

function safeErrorDetails(err) {
  if (isProduction()) return undefined
  return err?.message || 'Unknown error'
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)

  const requestId = req.requestId || res.locals?.requestId || null
  const statusCode = Number.isInteger(err?.status) && err.status >= 400 && err.status < 500
    ? err.status
    : Number.isInteger(err?.statusCode) && err.statusCode >= 400 && err.statusCode < 500
      ? err.statusCode
      : 500

  if (statusCode >= 500) {
    console.error(`[${requestId || 'no-request-id'}] Unhandled request error`, err)
  }

  if (statusCode === 413 || err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request payload too large', requestId })
  }

  if (statusCode >= 400 && statusCode < 500) {
    const clientMessage = statusCode === 400 ? 'Invalid request' : (err?.message || 'Request rejected')
    return res.status(statusCode).json({ message: clientMessage, requestId })
  }

  const body = { message: 'Internal server error', requestId }
  const details = safeErrorDetails(err)
  if (details) body.error = details
  return res.status(500).json(body)
}

module.exports = {
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  DEFAULT_API_LIMIT,
  DEFAULT_MUTATION_LIMIT,
  DEFAULT_AI_LIMIT,
  parsePositiveInteger,
  shouldEnforceRateLimits,
  attachRequestContext,
  securityHeaders,
  apiNoStore,
  getAuthenticatedRateLimitKey,
  createRateLimiter,
  generalApiRateLimit,
  mutationRateLimitWhenNeeded,
  aiRateLimit,
  aiRateLimitWhenNeeded,
  safeErrorDetails,
  errorHandler
}
