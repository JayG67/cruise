function compactObject(value = {}) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null && entryValue !== '')
  )
}

function buildApiIdentity({ entityType, durableId, displayId, tenantScope = {}, relationships = {} } = {}) {
  return {
    entityType,
    durableId: durableId || displayId || null,
    displayId: displayId || durableId || null,
    tenantScope: compactObject(tenantScope),
    relationships: compactObject(relationships)
  }
}

function withApiIdentity(row, options = {}) {
  if (!row) return row
  return {
    ...row,
    apiIdentity: buildApiIdentity(options)
  }
}

function withCruiseLineApiIdentity(cruiseLine) {
  return withApiIdentity(cruiseLine, {
    entityType: 'CRUISE_LINE',
    durableId: cruiseLine?.id,
    displayId: cruiseLine?.name,
    tenantScope: { cruiseLineId: cruiseLine?.id }
  })
}

function withShipApiIdentity(ship) {
  return withApiIdentity(ship, {
    entityType: 'SHIP',
    durableId: ship?.id,
    displayId: ship?.name,
    tenantScope: { cruiseLineId: ship?.cruiseLineId, shipId: ship?.id },
    relationships: { cruiseLineId: ship?.cruiseLineId }
  })
}

function withSailingApiIdentity(sailing) {
  return withApiIdentity(sailing, {
    entityType: 'SAILING',
    durableId: sailing?.id,
    displayId: sailing?.departureDate,
    tenantScope: { shipId: sailing?.shipId, sailingId: sailing?.id },
    relationships: { shipId: sailing?.shipId }
  })
}

function withCustomerApiIdentity(customer) {
  return withApiIdentity(customer, {
    entityType: 'CUSTOMER',
    durableId: customer?.customerUuid,
    displayId: customer?.id,
    relationships: { customerId: customer?.id }
  })
}

function withBookingApiIdentity(booking) {
  return withApiIdentity(booking, {
    entityType: 'BOOKING',
    durableId: booking?.bookingUuid,
    displayId: booking?.id,
    tenantScope: { sailingId: booking?.sailingId },
    relationships: {
      bookingId: booking?.id,
      sailingId: booking?.sailingId,
      createdByCustomerId: booking?.createdByCustomerId,
      createdByUserId: booking?.createdByUserId
    }
  })
}

function withBookingPassengerApiIdentity(passenger) {
  return withApiIdentity(passenger, {
    entityType: 'BOOKING_PASSENGER',
    durableId: passenger?.bookingPassengerUuid,
    displayId: passenger?.id,
    tenantScope: { bookingId: passenger?.bookingId },
    relationships: {
      bookingId: passenger?.bookingId,
      customerId: passenger?.customerId
    }
  })
}

function withPreCruiseChecklistApiIdentity(checklist) {
  return withApiIdentity(checklist, {
    entityType: 'PRE_CRUISE_CHECKLIST',
    durableId: checklist?.checklistUuid,
    displayId: checklist?.customerId,
    relationships: { customerId: checklist?.customerId }
  })
}

function withItineraryFavoriteApiIdentity(favorite) {
  return withApiIdentity(favorite, {
    entityType: 'ITINERARY_FAVORITE',
    durableId: favorite?.favoriteUuid,
    displayId: favorite?.id,
    relationships: {
      customerId: favorite?.customerId,
      activityScheduleId: favorite?.activityScheduleId
    }
  })
}

module.exports = {
  buildApiIdentity,
  withApiIdentity,
  withCruiseLineApiIdentity,
  withShipApiIdentity,
  withSailingApiIdentity,
  withCustomerApiIdentity,
  withBookingApiIdentity,
  withBookingPassengerApiIdentity,
  withPreCruiseChecklistApiIdentity,
  withItineraryFavoriteApiIdentity
}
