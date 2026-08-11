const { listAuditEvents } = require('../services/auditEvent.service')
const { buildAuditEventListResponse, buildAuditEventQueryContract } = require('../services/auditEventQuery.service')
const { recordPlatformAuditEvent } = require('../services/platformAudit.service')
const {
  buildTurnaroundSetupSummary,
  createTurnaroundPerson: createTurnaroundSetupPerson,
  updateTurnaroundPerson: updateTurnaroundSetupPerson,
  deleteTurnaroundPerson: deleteTurnaroundSetupPerson
} = require('../services/turnaroundAdminSetup.service')
const { requireAdminRequest } = require('../services/requestAuthorization.service')

function buildAuditEventFilters(query = {}) {
  return buildAuditEventQueryContract(query).filters
}

async function recordCruiseManagementAuditEvent(req, event) {
  return recordPlatformAuditEvent(req, event)
}

exports.getTurnaroundAdminSetup = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    return res.status(200).json(await buildTurnaroundSetupSummary())
  } catch (err) {
    next(err)
  }
}

exports.createTurnaroundPerson = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    const person = await createTurnaroundSetupPerson(req.body)
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'TURNAROUND_PERSON_CREATED',
      entityType: 'DEMO_USER',
      entityId: person.id,
      cruiseLineId: person.cruiseLineId || null,
      shipId: person.assignedShipId || null,
      source: 'TURNAROUND_ADMIN_SETUP_API',
      eventPayload: { displayName: person.displayName, role: person.role }
    })

    return res.status(201).json({
      message: 'Turnaround person created and assigned successfully',
      person,
      setup: await buildTurnaroundSetupSummary()
    })
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message })
    }
    next(err)
  }
}

exports.updateTurnaroundPerson = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    const person = await updateTurnaroundSetupPerson(req.params.id, req.body)
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'TURNAROUND_PERSON_UPDATED',
      entityType: 'DEMO_USER',
      entityId: person.id,
      cruiseLineId: person.cruiseLineId || null,
      shipId: person.assignedShipId || null,
      source: 'TURNAROUND_ADMIN_SETUP_API',
      eventPayload: { displayName: person.displayName, role: person.role }
    })

    return res.status(200).json({
      message: 'Turnaround person assignment updated successfully',
      person,
      setup: await buildTurnaroundSetupSummary()
    })
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message })
    }
    next(err)
  }
}

exports.deleteTurnaroundPerson = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    const person = await deleteTurnaroundSetupPerson(req.params.id)
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'TURNAROUND_PERSON_UNASSIGNED',
      entityType: 'DEMO_USER',
      entityId: person.id,
      cruiseLineId: person.cruiseLineId || null,
      shipId: person.assignedShipId || null,
      source: 'TURNAROUND_ADMIN_SETUP_API',
      eventPayload: { displayName: person.displayName, role: person.role }
    })

    return res.status(200).json({
      message: 'Turnaround person removed from this team and kept in the cruise-line roster',
      person,
      setup: await buildTurnaroundSetupSummary()
    })
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message })
    }
    next(err)
  }
}

exports.getPlatformAuditEvents = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    const auditEventQuery = buildAuditEventQueryContract(req.query, { defaultLimit: 50 })
    const auditEvents = await listAuditEvents(req.tenantAuditFilters || buildAuditEventFilters(req.query), {
      limit: auditEventQuery.limit
    })

    return res.status(200).json(buildAuditEventListResponse(auditEvents, { ...auditEventQuery, filters: req.tenantAuditFilters || auditEventQuery.filters }))
  } catch (error) {
    return next(error)
  }
}
