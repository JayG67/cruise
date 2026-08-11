const customerTable = require('../models/customer.model')
const bookingTable = require('../models/booking.model')
const bookingPassengerTable = require('../models/bookingPassenger.model')
const customerPreCruiseChecklistTable = require('../models/customerPreCruiseChecklist.model')
const db = require('../db')
const { AUTH_MODES, getAuthenticationMode } = require('../services/authentication.service')
const { recordPlatformAuditEvent } = require('../services/platformAudit.service')
const { buildEntityHistoryPayload, buildEntityLifecycleTimestamps, buildEntityUpdateTimestamp } = require('../services/entityHistory.service')
const { withCustomerApiIdentity, withPreCruiseChecklistApiIdentity } = require('../services/apiIdentityBridge.service')
const { applyCustomerPayloadProfile, getRequestedPayloadProfile } = require('../services/apiPayloadProfile.service')
const { eq, inArray } = require('drizzle-orm')
const { filterCustomersForAdminTenant } = require('../services/customerTenantAccess.service')

async function recordCruiseManagementAuditEvent(req, event) {
  return recordPlatformAuditEvent(req, event)
}

async function selectByIds(table, column, ids) {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))]
  if (uniqueIds.length === 0) return []
  return db.select().from(table).where(inArray(column, uniqueIds))
}

const DEFAULT_PRE_CRUISE_CHECKLIST = Object.freeze({
  documents: false,
  luggage: false,
  dining: false,
  excursions: false
})

function normalizePreCruiseChecklist(row = {}) {
  const checklist = {
    documents: Boolean(row.documents),
    luggage: Boolean(row.luggage),
    dining: Boolean(row.dining),
    excursions: Boolean(row.excursions),
    updatedAt: row.updatedAt || null
  }

  if (row.customerId) checklist.customerId = row.customerId
  if (row.checklistUuid) checklist.checklistUuid = row.checklistUuid

  return row.customerId || row.checklistUuid
    ? withPreCruiseChecklistApiIdentity(checklist)
    : checklist
}

async function getCustomerPreCruiseChecklistMap(customerIds = []) {
  const rows = await selectByIds(
    customerPreCruiseChecklistTable,
    customerPreCruiseChecklistTable.customerId,
    customerIds
  )

  return new Map(rows.map(row => [row.customerId, normalizePreCruiseChecklist(row)]))
}

exports.getCustomers = async (req, res, next) => {
  try {
    const allCustomers = await db.select().from(customerTable)
    const customers = getAuthenticationMode() === AUTH_MODES.DEMO
      ? allCustomers
      : await filterCustomersForAdminTenant(req, allCustomers)

    if (!customers || customers.length === 0) {
      return res.status(404).json({ message: 'No customers found' })
    }

    const checklistByCustomerId = await getCustomerPreCruiseChecklistMap(customers.map(customer => customer.id))

    const customerDetails = customers.map(customer => withCustomerApiIdentity({
      ...customer,
      preCruiseChecklist: checklistByCustomerId.get(customer.id) || normalizePreCruiseChecklist({ ...DEFAULT_PRE_CRUISE_CHECKLIST, customerId: customer.id })
    }))

    return res.status(200).json(applyCustomerPayloadProfile(customerDetails, getRequestedPayloadProfile(req)))
  } catch (err) {
    next(err)
  }
}

exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params

    const rows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (!rows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    const checklistByCustomerId = await getCustomerPreCruiseChecklistMap([id])

    return res.status(200).json(withCustomerApiIdentity({
      ...rows[0],
      preCruiseChecklist: checklistByCustomerId.get(id) || normalizePreCruiseChecklist({ ...DEFAULT_PRE_CRUISE_CHECKLIST, customerId: id })
    }))
  } catch (err) {
    next(err)
  }
}

exports.insertCustomer = async (req, res, next) => {
  try {
    const { id, firstName, lastName, email, phone, loyaltyNumber } = req.body

    const duplicateIdRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (duplicateIdRows[0]) {
      return res.status(400).json({ message: 'Customer with the same ID already exists' })
    }

    const duplicateEmailRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.email, email))
      .limit(1)

    if (duplicateEmailRows[0]) {
      return res.status(400).json({ message: 'Customer with the same email already exists' })
    }

    const customerValues = { id, firstName, lastName, email, phone, loyaltyNumber, ...buildEntityLifecycleTimestamps() }
    await db
      .insert(customerTable)
      .values(customerValues)

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'CUSTOMER_CREATED',
      entityType: 'CUSTOMER',
      entityId: id,
      eventPayload: buildEntityHistoryPayload({
        next: customerValues,
        entityRefs: { customerId: id },
        metadata: { operation: 'create' }
      })
    })

    return res.status(201).json({
      message: 'Customer created successfully',
      id
    })
  } catch (err) {
    next(err)
  }
}

exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params
    const { firstName, lastName, email, phone, loyaltyNumber } = req.body

    const existingRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    const customerUpdates = { firstName, lastName, email, phone, loyaltyNumber, ...buildEntityUpdateTimestamp() }
    await db
      .update(customerTable)
      .set(customerUpdates)
      .where(eq(customerTable.id, id))

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'CUSTOMER_UPDATED',
      entityType: 'CUSTOMER',
      entityId: id,
      eventPayload: buildEntityHistoryPayload({
        previous: existingRows[0],
        next: { ...existingRows[0], ...customerUpdates },
        entityRefs: { customerId: id },
        metadata: { operation: 'update' }
      })
    })

    return res.status(200).json({ message: 'Customer updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params

    const existingRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    await db
      .update(bookingTable)
      .set({ createdByCustomerId: null })
      .where(eq(bookingTable.createdByCustomerId, id))

    await db
      .delete(bookingPassengerTable)
      .where(eq(bookingPassengerTable.customerId, id))

    await db
      .delete(customerTable)
      .where(eq(customerTable.id, id))

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'CUSTOMER_DELETED',
      entityType: 'CUSTOMER',
      entityId: id,
      eventPayload: buildEntityHistoryPayload({ previous: existingRows[0], entityRefs: { customerId: id }, metadata: { operation: 'delete' } })
    })

    return res.status(200).json({ message: 'Customer deleted successfully' })
  } catch (err) {
    next(err)
  }
}


