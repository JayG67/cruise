const { eq, inArray } = require('drizzle-orm')

const db = require('../db')
const bookingTable = require('../models/booking.model')
const bookingPassengerTable = require('../models/bookingPassenger.model')
const sailingTable = require('../models/sailing.model')
const shipTable = require('../models/ship.model')
const { resolvePrincipalTenantScope } = require('./tenantAccess.service')

async function selectFirst(table, predicate) {
  const rows = await db.select().from(table).where(predicate).limit(1)
  return rows[0] || null
}

async function resolveBookingTenant(bookingOrId) {
  const booking = typeof bookingOrId === 'object' && bookingOrId
    ? bookingOrId
    : await selectFirst(bookingTable, eq(bookingTable.id, bookingOrId))

  if (!booking?.sailingId) return null

  const sailing = await selectFirst(sailingTable, eq(sailingTable.id, booking.sailingId))
  if (!sailing?.shipId) return null

  const ship = await selectFirst(shipTable, eq(shipTable.id, sailing.shipId))
  if (!ship?.cruiseLineId) return null

  return {
    bookingId: booking.id || null,
    sailingId: sailing.id,
    shipId: ship.id,
    cruiseLineId: ship.cruiseLineId
  }
}

async function resolveBookingTenantMap(bookings = []) {
  const validBookings = (bookings || []).filter(booking => booking?.id && booking?.sailingId)
  if (validBookings.length === 0) return new Map()

  const sailingIds = [...new Set(validBookings.map(booking => booking.sailingId))]
  const sailings = await db.select().from(sailingTable).where(inArray(sailingTable.id, sailingIds))
  const sailingById = new Map(sailings.map(sailing => [sailing.id, sailing]))

  const shipIds = [...new Set(sailings.map(sailing => sailing.shipId).filter(Boolean))]
  if (shipIds.length === 0) return new Map()

  const ships = await db.select().from(shipTable).where(inArray(shipTable.id, shipIds))
  const shipById = new Map(ships.map(ship => [ship.id, ship]))
  const result = new Map()

  for (const booking of validBookings) {
    const sailing = sailingById.get(booking.sailingId)
    const ship = sailing?.shipId ? shipById.get(sailing.shipId) : null
    if (!sailing?.id || !ship?.cruiseLineId) continue
    result.set(booking.id, {
      bookingId: booking.id,
      sailingId: sailing.id,
      shipId: ship.id,
      cruiseLineId: ship.cruiseLineId
    })
  }

  return result
}

async function resolveCustomerTenantMap(customerIds = []) {
  const ids = [...new Set((customerIds || []).filter(Boolean))]
  if (ids.length === 0) return new Map()

  const passengerRows = await db
    .select()
    .from(bookingPassengerTable)
    .where(inArray(bookingPassengerTable.customerId, ids))

  const createdRows = await db
    .select()
    .from(bookingTable)
    .where(inArray(bookingTable.createdByCustomerId, ids))

  const customerBookingIds = new Map(ids.map(id => [id, new Set()]))
  for (const row of passengerRows) {
    if (customerBookingIds.has(row.customerId) && row.bookingId) customerBookingIds.get(row.customerId).add(row.bookingId)
  }
  for (const row of createdRows) {
    if (customerBookingIds.has(row.createdByCustomerId) && row.id) customerBookingIds.get(row.createdByCustomerId).add(row.id)
  }

  const bookingIds = [...new Set([...customerBookingIds.values()].flatMap(set => [...set]))]
  if (bookingIds.length === 0) return new Map(ids.map(id => [id, []]))

  const bookingRows = await db.select().from(bookingTable).where(inArray(bookingTable.id, bookingIds))
  const bookingTenantMap = await resolveBookingTenantMap(bookingRows)
  const result = new Map()

  for (const customerId of ids) {
    const linkedBookingIds = [...customerBookingIds.get(customerId)]
    if (linkedBookingIds.length === 0) {
      result.set(customerId, [])
      continue
    }

    const tenantIds = []
    let complete = true
    for (const bookingId of linkedBookingIds) {
      const tenant = bookingTenantMap.get(bookingId)
      if (!tenant?.cruiseLineId) {
        complete = false
        break
      }
      tenantIds.push(tenant.cruiseLineId)
    }
    result.set(customerId, complete ? [...new Set(tenantIds)] : [])
  }

  return result
}

async function resolveCustomerTenantIds(customerId) {
  if (!customerId) return []
  const tenantMap = await resolveCustomerTenantMap([customerId])
  return tenantMap.get(customerId) || []
}

async function canAdminAccessBookingTenant(req, bookingOrId) {
  const scope = await resolvePrincipalTenantScope(req)
  if (!scope) return false
  if (scope.isGlobalAdmin) return true

  const tenant = await resolveBookingTenant(bookingOrId)
  return Boolean(tenant?.cruiseLineId && scope.cruiseLineId === tenant.cruiseLineId)
}

async function canAdminAccessCustomerTenant(req, customerId) {
  const scope = await resolvePrincipalTenantScope(req)
  if (!scope) return false
  if (scope.isGlobalAdmin) return true
  if (!scope.cruiseLineId) return false

  const tenantIds = await resolveCustomerTenantIds(customerId)
  return tenantIds.includes(scope.cruiseLineId)
}

async function filterBookingsForAdminTenant(req, bookings = []) {
  const scope = await resolvePrincipalTenantScope(req)
  if (!scope) return []
  if (scope.isGlobalAdmin) return bookings
  if (!scope.cruiseLineId) return []

  const tenantMap = await resolveBookingTenantMap(bookings)
  return bookings.filter(booking => tenantMap.get(booking.id)?.cruiseLineId === scope.cruiseLineId)
}

async function filterCustomersForAdminTenant(req, customers = []) {
  const scope = await resolvePrincipalTenantScope(req)
  if (!scope) return []
  if (scope.isGlobalAdmin) return customers
  if (!scope.cruiseLineId) return []

  const tenantMap = await resolveCustomerTenantMap(customers.map(customer => customer.id))
  return customers.filter(customer => (tenantMap.get(customer.id) || []).includes(scope.cruiseLineId))
}

module.exports = {
  canAdminAccessBookingTenant,
  canAdminAccessCustomerTenant,
  filterBookingsForAdminTenant,
  filterCustomersForAdminTenant,
  resolveBookingTenant,
  resolveBookingTenantMap,
  resolveCustomerTenantIds,
  resolveCustomerTenantMap
}
