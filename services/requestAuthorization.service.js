const { eq } = require('drizzle-orm')

const db = require('../db')
const demoUserTable = require('../models/demoUser.model')

const ADMIN_FORBIDDEN_MESSAGE = 'Admin access requires an admin request identity.'

function normalizeRole(role = '') {
  return String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_')
}

function isAdminRole(role = '') {
  return normalizeRole(role) === 'ADMIN'
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
    return {
      actorUserId: principal.userId,
      actorDisplayName: principal.displayName || principal.email || principal.userId,
      actorRole: principal.role || null,
      identitySource: principal.identitySource || 'principal'
    }
  }

  const demoUser = await resolveDemoUserForRequest(req)
  return {
    actorUserId: demoUser?.normalizedUserId || null,
    actorDisplayName: demoUser?.displayName || null,
    actorRole: demoUser?.role || null,
    identitySource: demoUser ? 'demo' : 'anonymous'
  }
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
  ADMIN_FORBIDDEN_MESSAGE,
  getProductionPrincipal,
  isAdminRequest,
  isAdminRole,
  normalizeRole,
  requireAdminRequest,
  resolveDemoUserForRequest,
  resolveRequestActor
}
