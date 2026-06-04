export function toggleExpandedId(currentIds = new Set(), id) {
  const nextIds = new Set(currentIds)

  if (nextIds.has(id)) {
    nextIds.delete(id)
  } else {
    nextIds.add(id)
  }

  return nextIds
}

export function expandVisibleCustomers(currentIds = new Set(), rows = []) {
  const nextIds = new Set(currentIds)

  rows.forEach(({ customer }) => {
    if (customer?.id) nextIds.add(customer.id)
  })

  return nextIds
}

export function collapseVisibleCustomers(currentIds = new Set(), rows = []) {
  const visibleCustomerIds = new Set(rows.map(({ customer }) => customer?.id).filter(Boolean))

  return new Set([...currentIds].filter(customerId => !visibleCustomerIds.has(customerId)))
}

export function createBookingExpansionKey(customerId, bookingId) {
  return `${customerId}:${bookingId}`
}

export function collapseBookingsForVisibleCustomers(currentBookingIds = new Set(), rows = []) {
  const visibleCustomerIds = new Set(rows.map(({ customer }) => customer?.id).filter(Boolean))

  return new Set(
    [...currentBookingIds].filter(bookingKey => {
      const [customerId] = bookingKey.split(':')
      return !visibleCustomerIds.has(customerId)
    })
  )
}
