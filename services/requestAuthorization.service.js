const { eq } = require('drizzle-orm')

const db = require('../db')
const demoUserTable = require('../models/demoUser.model')
const { AUTH_MODES, getAuthenticationMode } = require('./authentication.service')

const ADMIN_FORBIDDEN_MESSAGE = 'Admin access requires an admin request identity.'
const DEMO_AUDIT_ACTOR_DISPLAY_NAME = 'Cruise Explorer Demo Session'
const ACTOR_IDENTITY_SOURCES = Object.freeze({
  ANONYMOUS: 'anonymous',
  DEMO: 'demo',
  PRINCIPAL: 'principal',
  JWT: 'jwt'
})

function compactObject(value = {}) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null && entryValue !== '')
  )
}

function normalizeRole(role = '') {
  return String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_')
}

function normalizeActorRole(role = '') {
  return normalizeRole(role) || null
}

function isAdminRole(role = '') {
  return normalizeRole(role) === 'ADMIN'
}

function normalizeActorDisplayName({ displayName, email, userId } = {}) {
  return String(displayName || email || userId || '').trim() || null
}

function buildActorIdentity({ actorUserId, actorDisplayName, actorRole, identitySource, sourceUserId } = {}) {
  const actor = {
    actorUserId: actorUserId || null,
    actorDisplayName: actorDisplayName || null,
    actorRole: actorRole || null,
    identitySource: identitySource || ACTOR_IDENTITY_SOURCES.ANONYMOUS
  }

  if (sourceUserId) actor.sourceUserId = sourceUserId
  return actor
}

function buildProductionActor(principal = {}) {
  if (!principal?.userId) return null

  return buildActorIdentity({
    actorUserId: principal.userId,
    actorDisplayName: normalizeActorDisplayName(principal),
    actorRole: principal.role || null,
    identitySource: principal.identitySource || ACTOR_IDENTITY_SOURCES.PRINCIPAL
  })
}

function buildDemoActor(demoUser = {}) {
  if (!demoUser?.id) return null

  return buildActorIdentity({
    actorUserId: demoUser.normalizedUserId || null,
    actorDisplayName: normalizeActorDisplayName(demoUser),
    actorRole: demoUser.role || null,
    identitySource: ACTOR_IDENTITY_SOURCES.DEMO
  })
}

function buildAnonymousActor() {
  return buildActorIdentity({
    actorUserId: null,
    actorDisplayName: null,
    actorRole: null,
    identitySource: ACTOR_IDENTITY_SOURCES.ANONYMOUS
  })
}

function assertResolvedActor(actor = {}) {
  if (!actor.identitySource) {
    const error = new Error('Resolved actor identity source is required.')
    error.code = 'ACTOR_IDENTITY_SOURCE_REQUIRED'
    throw error
  }

  if (actor.identitySource !== ACTOR_IDENTITY_SOURCES.ANONYMOUS && !actor.actorDisplayName) {
    const error = new Error('Resolved actor display name is required for non-anonymous actors.')
    error.code = 'ACTOR_DISPLAY_NAME_REQUIRED'
    throw error
  }

  return actor
}

async function resolveDemoUserForRequest(req = {}) {
  const demoUserId = String(req?.requestIdentity?.demoUserId || req?.query?.demoUserId || '').trim()
  if (!demoUserId) return null

  const rows = await db
    .select()
    .from(demoUserTable)
    .where(eq(demoUserTable.id, demoUserId))
    .limit(1)

  return rows[0] || null
}

function getProductionPrincipal(req = {}) {
  const principal = req?.requestIdentity?.principal || null
  if (!principal?.userId) return null
  return principal
}

async function resolveRequestActor(req = {}) {
  const principal = getProductionPrincipal(req)
  if (principal) {
    return assertResolvedActor(buildProductionActor(principal))
  }

  const demoUser = await resolveDemoUserForRequest(req)
  return assertResolvedActor(buildDemoActor(demoUser) || buildAnonymousActor())
}


function buildDemoSessionAuditActor() {
  return buildActorIdentity({
    actorUserId: null,
    actorDisplayName: DEMO_AUDIT_ACTOR_DISPLAY_NAME,
    actorRole: null,
    identitySource: ACTOR_IDENTITY_SOURCES.DEMO
  })
}

async function resolveRequestAuditActor(req = {}) {
  const actor = await resolveRequestActor(req)
  if (actor.identitySource !== ACTOR_IDENTITY_SOURCES.ANONYMOUS) return actor
  if (getAuthenticationMode() !== AUTH_MODES.DEMO) return actor
  return buildDemoSessionAuditActor()
}

async function isAdminRequest(req = {}) {
  const principal = getProductionPrincipal(req)
  if (principal) return isAdminRole(principal.role)

  const demoUser = await resolveDemoUserForRequest(req)
  return isAdminRole(demoUser?.role)
}

async function requireAdminRequest(req, res) {
  if (await isAdminRequest(req)) return true
  res.status(403).json({ message: ADMIN_FORBIDDEN_MESSAGE })
  return false
}

module.exports = {
  ACTOR_IDENTITY_SOURCES,
  ADMIN_FORBIDDEN_MESSAGE,
  DEMO_AUDIT_ACTOR_DISPLAY_NAME,
  assertResolvedActor,
  buildActorIdentity,
  buildAnonymousActor,
  buildDemoActor,
  buildDemoSessionAuditActor,
  buildProductionActor,
  getProductionPrincipal,
  isAdminRequest,
  isAdminRole,
  normalizeActorDisplayName,
  normalizeActorRole,
  normalizeRole,
  requireAdminRequest,
  resolveDemoUserForRequest,
  resolveRequestActor,
  resolveRequestAuditActor
}
