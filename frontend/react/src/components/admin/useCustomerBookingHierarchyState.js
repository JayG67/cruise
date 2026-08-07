import { useMemo, useState, useTransition } from 'react'
import { getCustomerDirectoryName } from '../../domain/adminHierarchy.js'
import { buildAdminCustomerBookingSelectorState } from '../../domain/adminCustomerBookingSelectors.js'
import { useAdminHierarchyViewState } from '../../hooks/useAdminHierarchyViewState.js'
import { useBookingDraftWorkflow } from '../../hooks/useBookingDraftWorkflow.js'
import { useCustomerDraftWorkflow } from '../../hooks/useCustomerDraftWorkflow.js'
import useAdminCustomerBookingMutations from './useAdminCustomerBookingMutations.js'

export default function useCustomerBookingHierarchyState({
  customers = [],
  bookings = [],
  isLoading,
  error,
  onRetry,
  onSaveCustomerDraft,
  savingCustomerId = '',
  mutationError = '',
  onSaveBookingDraft,
  savingBookingId = '',
  bookingMutationError = ''
}) {
  const [workflowsVisible, setWorkflowsVisible] = useState(false)
  const {
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
  } = useAdminHierarchyViewState(customers, bookings, { enabled: workflowsVisible })

  const {
    customerDrafts,
    customerDraftMessages,
    openCustomerDraft,
    updateCustomerDraft,
    validateCustomerDraftFor,
    saveCustomerDraftFor,
    cancelCustomerDraft
  } = useCustomerDraftWorkflow({ onSaveCustomerDraft, mutationError })

  const {
    bookingDrafts,
    bookingDraftMessages,
    openBookingDraft,
    updateBookingDraft,
    validateBookingDraftFor,
    saveBookingDraftFor,
    cancelBookingDraft
  } = useBookingDraftWorkflow({ onSaveBookingDraft, bookingMutationError })

  const {
    adminMutationMessage,
    createCustomerDraft,
    createBookingDraft,
    deleteCustomerId,
    setDeleteCustomerId,
    deleteBookingId,
    setDeleteBookingId,
    deleteCustomerFilters,
    setDeleteCustomerFilters,
    deleteBookingFilters,
    setDeleteBookingFilters,
    activeDeleteId,
    pendingDelete,
    updateCreateCustomerDraft,
    updateCreateBookingDraft,
    handleCreateCustomer,
    handleCreateBooking,
    requestDeleteCustomerById,
    requestDeleteBookingById,
    confirmPendingDelete,
    cancelPendingDelete,
    handleDeleteCustomer,
    handleDeleteBooking
  } = useAdminCustomerBookingMutations({ onRefresh: onRetry })
  const [workflowFilters, setWorkflowFilters] = useState({ cruiseLine: '', ship: '', lastName: '', firstNameInitial: '', customerId: '' })
  const [isSelectorPending, startSelectorTransition] = useTransition()

  function updateDeleteCustomerFilter(fieldName, value) {
    startSelectorTransition(() => setDeleteCustomerFilters(current => {
      const next = { ...current, [fieldName]: value }
      if (fieldName === 'cruiseLine') {
        next.ship = ''
        next.lastName = ''
        next.firstNameInitial = ''
        next.customerId = ''
      }
      if (fieldName === 'ship') {
        next.lastName = ''
        next.firstNameInitial = ''
        next.customerId = ''
      }
      if (fieldName === 'lastName') {
        next.firstNameInitial = ''
        next.customerId = ''
      }
      if (fieldName === 'firstNameInitial') next.customerId = ''
      setDeleteCustomerId(next.customerId)
      return next
    }))
  }

  function updateDeleteBookingFilter(fieldName, value) {
    startSelectorTransition(() => setDeleteBookingFilters(current => {
      const next = { ...current, [fieldName]: value }
      if (fieldName === 'cruiseLine') {
        next.ship = ''
        next.passengerLastName = ''
        next.passengerFirstNameInitial = ''
        next.bookingId = ''
      }
      if (fieldName === 'ship') {
        next.passengerLastName = ''
        next.passengerFirstNameInitial = ''
        next.bookingId = ''
      }
      if (fieldName === 'passengerLastName') {
        next.passengerFirstNameInitial = ''
        next.bookingId = ''
      }
      if (fieldName === 'passengerFirstNameInitial') next.bookingId = ''
      setDeleteBookingId(next.bookingId)
      return next
    }))
  }

  function updateWorkflowFilter(fieldName, value) {
    startSelectorTransition(() => setWorkflowFilters(current => {
      const next = { ...current, [fieldName]: value }
      if (fieldName === 'cruiseLine') {
        next.ship = ''
        next.lastName = ''
        next.firstNameInitial = ''
        next.customerId = ''
      }
      if (fieldName === 'ship') {
        next.lastName = ''
        next.firstNameInitial = ''
        next.customerId = ''
      }
      if (fieldName === 'lastName') {
        next.firstNameInitial = ''
        next.customerId = ''
      }
      if (fieldName === 'firstNameInitial') next.customerId = ''
      const selectedCustomer = customers.find(customer => customer.id === next.customerId)
      const nextSearchTerm = selectedCustomer
        ? getCustomerDirectoryName(selectedCustomer)
        : next.ship || next.cruiseLine || ''
      updateSearchTerm(nextSearchTerm)
      return next
    }))
  }

  const selectorState = useMemo(() => buildAdminCustomerBookingSelectorState({
    customers,
    bookings,
    deleteCustomerFilters,
    deleteBookingFilters,
    workflowFilters
  }), [customers, bookings, deleteCustomerFilters, deleteBookingFilters, workflowFilters])

  const {
    getBookingDeleteLabel,
    getCustomerDeleteLabel,
    customerCruiseLineOptions,
    bookingCruiseLineOptions,
    customerShipOptions,
    bookingShipOptions,
    customerLastNameOptions,
    customerFirstNameInitialOptions,
    bookingPassengerLastNameOptions,
    bookingPassengerFirstNameInitialOptions,
    filteredDeleteCustomers,
    filteredDeleteBookings,
    customerSelectorNeedsNarrowing,
    bookingSelectorNeedsNarrowing,
    allFilteredDeleteCustomers,
    allFilteredDeleteBookings,
    workflowCruiseLineOptions,
    workflowShipOptions,
    workflowLastNameOptions,
    workflowFirstNameInitialOptions,
    filteredWorkflowCustomers,
    workflowSelectorNeedsNarrowing,
    allFilteredWorkflowCustomers
  } = selectorState

  const isInitialLoading = isLoading && customers.length === 0 && bookings.length === 0
  const hasActiveHierarchySearch = Boolean(searchTerm.trim())
  const visibleWorkflowRows = hasActiveHierarchySearch ? rows : rows.slice(0, 50)
  const hiddenWorkflowRowCount = Math.max(rows.length - visibleWorkflowRows.length, 0)

  return {
    workflowsVisible, setWorkflowsVisible, searchTerm, rows, summary, expandedCustomerIds, expandedBookingIds,
    updateSearchTerm, toggleCustomer, toggleBooking, expandAllVisibleCustomers, collapseAllVisibleCustomers,
    customerDrafts, customerDraftMessages, openCustomerDraft, updateCustomerDraft, validateCustomerDraftFor, saveCustomerDraftFor, cancelCustomerDraft,
    bookingDrafts, bookingDraftMessages, openBookingDraft, updateBookingDraft, validateBookingDraftFor, saveBookingDraftFor, cancelBookingDraft,
    adminMutationMessage, createCustomerDraft, createBookingDraft, deleteCustomerId, setDeleteCustomerId, deleteBookingId, setDeleteBookingId,
    deleteCustomerFilters, deleteBookingFilters, workflowFilters, activeDeleteId, pendingDelete, isSelectorPending,
    updateCreateCustomerDraft, updateCreateBookingDraft, handleCreateCustomer, handleCreateBooking,
    requestDeleteCustomerById, requestDeleteBookingById, confirmPendingDelete, cancelPendingDelete, handleDeleteCustomer, handleDeleteBooking,
    getBookingDeleteLabel, getCustomerDeleteLabel, updateDeleteCustomerFilter, updateDeleteBookingFilter, updateWorkflowFilter,
    customerCruiseLineOptions, bookingCruiseLineOptions, customerShipOptions, bookingShipOptions, customerLastNameOptions, customerFirstNameInitialOptions, bookingPassengerLastNameOptions, bookingPassengerFirstNameInitialOptions,
    filteredDeleteCustomers, filteredDeleteBookings, customerSelectorNeedsNarrowing, bookingSelectorNeedsNarrowing, allFilteredDeleteCustomers, allFilteredDeleteBookings,
    workflowCruiseLineOptions, workflowShipOptions, workflowLastNameOptions, workflowFirstNameInitialOptions, filteredWorkflowCustomers, workflowSelectorNeedsNarrowing, allFilteredWorkflowCustomers, isInitialLoading, hasActiveHierarchySearch, visibleWorkflowRows, hiddenWorkflowRowCount
  }
}
