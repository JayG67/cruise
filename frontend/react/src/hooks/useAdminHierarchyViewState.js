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

export function useAdminHierarchyViewState(customers = [], bookings = []) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCustomerIds, setExpandedCustomerIds] = useState(() => new Set())
  const [expandedBookingIds, setExpandedBookingIds] = useState(() => new Set())

  const allRows = useMemo(() => buildCustomerBookingRows(customers, bookings), [customers, bookings])
  const rows = useMemo(() => filterCustomerBookingRows(allRows, searchTerm), [allRows, searchTerm])
  const summary = useMemo(() => summarizeHierarchyRows(rows), [rows])

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
