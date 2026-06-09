import { useMemo, useState } from 'react'
import {
  buildCustomerBookingRows,
  filterCustomerBookingRows,
  summarizeHierarchyRows
} from '../domain/adminHierarchy.js'
import {
  collapseBookingsForVisibleCustomers,
  collapseVisibleCustomers,
  createBookingExpansionKey,
  expandVisibleCustomers,
  toggleExpandedId
} from '../domain/hierarchyExpansionState.js'

export function useAdminHierarchyViewState(customers = [], bookings = [], { enabled = true } = {}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCustomerIds, setExpandedCustomerIds] = useState(() => new Set())
  const [expandedBookingIds, setExpandedBookingIds] = useState(() => new Set())

  const allRows = useMemo(() => (
    enabled ? buildCustomerBookingRows(customers, bookings) : []
  ), [customers, bookings, enabled])
  const rows = useMemo(() => (
    enabled ? filterCustomerBookingRows(allRows, searchTerm) : []
  ), [allRows, enabled, searchTerm])
  const summary = useMemo(() => {
    if (!enabled) {
      return {
        customerCount: customers.length,
        uniqueBookingCount: bookings.length
      }
    }

    return summarizeHierarchyRows(rows)
  }, [bookings.length, customers.length, enabled, rows])

  function updateSearchTerm(value) {
    setSearchTerm(value)
  }

  function toggleCustomer(customerId) {
    setExpandedCustomerIds(current => toggleExpandedId(current, customerId))
  }

  function toggleBooking(customerId, bookingId) {
    setExpandedBookingIds(current => toggleExpandedId(current, createBookingExpansionKey(customerId, bookingId)))
  }

  function expandAllVisibleCustomers() {
    setExpandedCustomerIds(current => expandVisibleCustomers(current, rows))
  }

  function collapseAllVisibleCustomers() {
    setExpandedCustomerIds(current => collapseVisibleCustomers(current, rows))
    setExpandedBookingIds(current => collapseBookingsForVisibleCustomers(current, rows))
  }

  return {
    searchTerm,
    rows,
    summary,
    expandedCustomerIds,
    expandedBookingIds,
    updateSearchTerm,
    toggleCustomer,
    toggleBooking,
    expandAllVisibleCustomers,
    collapseAllVisibleCustomers
  }
}
