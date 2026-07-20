import { useMemo, useState, useTransition } from 'react'
import { createBooking, createCustomer, deleteBooking, deleteCustomer } from '../../api/client.js'
import { getCustomerDirectoryName } from '../../domain/adminHierarchy.js'
import { useAdminHierarchyViewState } from '../../hooks/useAdminHierarchyViewState.js'
import { useBookingDraftWorkflow } from '../../hooks/useBookingDraftWorkflow.js'
import { useCustomerDraftWorkflow } from '../../hooks/useCustomerDraftWorkflow.js'

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

  const [adminMutationMessage, setAdminMutationMessage] = useState('')
  const [createCustomerDraft, setCreateCustomerDraft] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    loyaltyNumber: ''
  })
  const [createBookingDraft, setCreateBookingDraft] = useState({
    customerId: '',
    bookingStatus: 'CONFIRMED',
    cabinNumber: '',
    fareCode: '',
    embarkationPort: '',
    debarkationPort: ''
  })
  const [deleteCustomerId, setDeleteCustomerId] = useState('')
  const [deleteBookingId, setDeleteBookingId] = useState('')
  const [deleteCustomerFilters, setDeleteCustomerFilters] = useState({ cruiseLine: '', ship: '', lastName: '', firstNameInitial: '', customerId: '' })
  const [deleteBookingFilters, setDeleteBookingFilters] = useState({ cruiseLine: '', ship: '', passengerLastName: '', passengerFirstNameInitial: '', bookingId: '' })
  const [workflowFilters, setWorkflowFilters] = useState({ cruiseLine: '', ship: '', lastName: '', firstNameInitial: '', customerId: '' })
  const [activeDeleteId, setActiveDeleteId] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [isSelectorPending, startSelectorTransition] = useTransition()

  const bookingSelectorRows = useMemo(() => bookings.map(booking => ({
    booking,
    lineName: getBookingCruiseLineName(booking),
    shipName: getBookingShipName(booking),
    primaryPassenger: getBookingPrimaryPassenger(booking),
    passengerIds: new Set((booking.passengers || []).map(passenger => passenger.customerId || passenger.customer?.id).filter(Boolean))
  })), [bookings])

  const customerSelectorMeta = useMemo(() => {
    const metaMap = new Map()

    customers.forEach(customer => {
      const linkedRows = bookingSelectorRows.filter(row => row.booking.createdByCustomerId === customer.id || row.passengerIds.has(customer.id))
      metaMap.set(customer.id, {
        bookingIds: new Set(linkedRows.map(row => row.booking.id)),
        lineNames: uniqueSorted(linkedRows.map(row => row.lineName)),
        shipNames: uniqueSorted(linkedRows.map(row => row.shipName)),
        linkedCount: linkedRows.length
      })
    })

    return metaMap
  }, [customers, bookingSelectorRows])

  function updateCreateCustomerDraft(fieldName, value) {
    setCreateCustomerDraft(current => ({ ...current, [fieldName]: value }))
  }

  function updateCreateBookingDraft(fieldName, value) {
    setCreateBookingDraft(current => ({ ...current, [fieldName]: value }))
  }

  async function handleCreateCustomer(event) {
    event.preventDefault()

    const payload = {
      firstName: createCustomerDraft.firstName.trim(),
      lastName: createCustomerDraft.lastName.trim(),
      email: createCustomerDraft.email.trim(),
      phone: createCustomerDraft.phone.trim(),
      loyaltyNumber: createCustomerDraft.loyaltyNumber.trim()
    }

    if (!payload.firstName || !payload.lastName || !payload.email) {
      setAdminMutationMessage('First name, last name, and email are required to create a customer.')
      return
    }

    try {
      const created = await createCustomer(payload)
      setCreateCustomerDraft({ firstName: '', lastName: '', email: '', phone: '', loyaltyNumber: '' })
      setAdminMutationMessage(`${created.firstName || payload.firstName} ${created.lastName || payload.lastName} was created through the React admin workspace.`)
      await onRetry?.()
    } catch (error) {
      setAdminMutationMessage(error.message || 'Unable to create customer.')
    }
  }

  async function handleCreateBooking(event) {
    event?.preventDefault?.()

    const payload = {
      customerId: createBookingDraft.customerId.trim(),
      bookingStatus: createBookingDraft.bookingStatus.trim(),
      cabinNumber: createBookingDraft.cabinNumber.trim(),
      fareCode: createBookingDraft.fareCode.trim(),
      embarkationPort: createBookingDraft.embarkationPort.trim(),
      debarkationPort: createBookingDraft.debarkationPort.trim()
    }

    if (!payload.customerId || !payload.bookingStatus || !payload.cabinNumber) {
      setAdminMutationMessage('Customer ID, booking status, and cabin number are required to create a booking.')
      return
    }

    try {
      const created = await createBooking(payload)
      setCreateBookingDraft({
        customerId: '',
        bookingStatus: 'CONFIRMED',
        cabinNumber: '',
        fareCode: '',
        embarkationPort: '',
        debarkationPort: ''
      })
      setAdminMutationMessage(`${created.id || 'New'} booking was created through the React admin workspace.`)
      await onRetry?.()
    } catch (error) {
      setAdminMutationMessage(error.message || 'Unable to create booking.')
    }
  }

  function requestDeleteCustomerById(customerId, label = customerId) {
    const normalizedCustomerId = String(customerId || '').trim()

    if (!normalizedCustomerId) {
      setAdminMutationMessage('Customer ID is required before deleting a customer.')
      return
    }

    setPendingDelete({
      type: 'customer',
      id: normalizedCustomerId,
      label,
      message: `Delete customer ${label}?`,
      confirmLabel: 'Delete Customer'
    })
  }

  function requestDeleteBookingById(bookingId, label = bookingId) {
    const normalizedBookingId = String(bookingId || '').trim()

    if (!normalizedBookingId) {
      setAdminMutationMessage('Booking ID is required before deleting a booking.')
      return
    }

    setPendingDelete({
      type: 'booking',
      id: normalizedBookingId,
      label,
      message: `Delete booking ${label}?`,
      confirmLabel: 'Delete Booking'
    })
  }

  async function executeDeleteCustomer(customerId, label = customerId) {
    setActiveDeleteId(`customer:${customerId}`)

    try {
      await deleteCustomer(customerId)
      setDeleteCustomerId('')
      setDeleteCustomerFilters({ cruiseLine: '', ship: '', lastName: '', firstNameInitial: '', customerId: '' })
      setAdminMutationMessage(`${label} customer was deleted through the React admin workspace.`)
      await onRetry?.()
    } catch (error) {
      setAdminMutationMessage(error.message || 'Unable to delete customer.')
    } finally {
      setActiveDeleteId('')
    }
  }

  async function executeDeleteBooking(bookingId, label = bookingId) {
    setActiveDeleteId(`booking:${bookingId}`)

    try {
      await deleteBooking(bookingId)
      setDeleteBookingId('')
      setDeleteBookingFilters({ cruiseLine: '', ship: '', passengerLastName: '', passengerFirstNameInitial: '', bookingId: '' })
      setAdminMutationMessage(`${label} booking was deleted through the React admin workspace.`)
      await onRetry?.()
    } catch (error) {
      setAdminMutationMessage(error.message || 'Unable to delete booking.')
    } finally {
      setActiveDeleteId('')
    }
  }

  async function confirmPendingDelete() {
    const action = pendingDelete
    if (!action) return

    try {
      if (action.type === 'customer') await executeDeleteCustomer(action.id, action.label)
      if (action.type === 'booking') await executeDeleteBooking(action.id, action.label)
    } finally {
      setPendingDelete(null)
    }
  }

  function cancelPendingDelete() {
    setPendingDelete(null)
    setAdminMutationMessage('Delete action was cancelled.')
  }

  function handleDeleteCustomer(event) {
    event.preventDefault()
    return requestDeleteCustomerById(deleteCustomerId, deleteCustomerId.trim())
  }

  function handleDeleteBooking(event) {
    event.preventDefault()
    return requestDeleteBookingById(deleteBookingId, deleteBookingId.trim())
  }

  function getBookingDeleteLabel(booking = {}) {
    const passengerNames = (booking.passengers || [])
      .map(passenger => getCustomerSortLabel(passenger.customer || passenger))
      .filter(Boolean)
      .slice(0, 2)
      .join('; ')
    const shipName = booking.ship?.name || booking.shipName || 'Ship pending'
    const sailingDate = booking.sailing?.departureDate || booking.departureDate || 'Date pending'
    const cabin = booking.cabinNumber ? `Cabin ${booking.cabinNumber}` : 'Cabin pending'

    return `${passengerNames || 'Passenger pending'} — ${booking.id} · ${shipName} · ${sailingDate} · ${cabin}`
  }

  function getCustomerDeleteLabel(customer = {}) {
    const linkedCount = customerSelectorMeta.get(customer.id)?.linkedCount || 0
    const bookingSummary = linkedCount === 1 ? '1 linked booking' : `${linkedCount} linked bookings`

    return `${getCustomerSortLabel(customer)} — ${customer.email || customer.id} · ${bookingSummary}`
  }

  function getPersonParts(person = {}) {
    const rawName = getCustomerDirectoryName(person).trim()
    const firstName = String(person.firstName || person.givenName || '').trim()
    const lastName = String(person.lastName || person.familyName || '').trim()

    if (firstName || lastName) {
      return { firstName, lastName, rawName }
    }

    const parts = rawName.split(/\s+/).filter(Boolean)
    return {
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts.slice(-1).join(''),
      rawName
    }
  }

  function getCustomerSortLabel(customer = {}) {
    const { firstName, lastName, rawName } = getPersonParts(customer)
    if (!lastName) return rawName || customer.id || 'Customer pending'
    return firstName ? `${lastName}, ${firstName}` : lastName
  }

  function getBookingPrimaryPassenger(booking = {}) {
    const passenger = (booking.passengers || [])[0]
    return passenger?.customer || passenger || {}
  }

  function compareCustomerNames(left = {}, right = {}) {
    const leftParts = getPersonParts(left)
    const rightParts = getPersonParts(right)
    return (leftParts.lastName || '').localeCompare(rightParts.lastName || '')
      || (leftParts.firstName || '').localeCompare(rightParts.firstName || '')
      || (leftParts.rawName || '').localeCompare(rightParts.rawName || '')
      || String(left.id || '').localeCompare(String(right.id || ''))
  }

  function compareBookingPassengerNames(left = {}, right = {}) {
    return compareCustomerNames(getBookingPrimaryPassenger(left), getBookingPrimaryPassenger(right))
      || String(left.id || '').localeCompare(String(right.id || ''))
  }


  function getBookingCruiseLineName(booking = {}) {
    return booking.cruiseLine?.name
      || booking.cruiseLineName
      || booking.sailing?.cruiseLineName
      || booking.ship?.cruiseLine?.name
      || booking.ship?.cruiseLineName
      || 'Cruise line pending'
  }

  function getBookingShipName(booking = {}) {
    return booking.ship?.name || booking.shipName || 'Ship pending'
  }

  function getCustomerBookingIds(customer = {}) {
    return customerSelectorMeta.get(customer.id)?.bookingIds || new Set()
  }

  function getCustomerCruiseLineNames(customer = {}) {
    return customerSelectorMeta.get(customer.id)?.lineNames || []
  }

  function getCustomerShipNames(customer = {}) {
    return customerSelectorMeta.get(customer.id)?.shipNames || []
  }

  function uniqueSorted(values = []) {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b))
  }

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

  function getScopedCustomerRows(filters = {}) {
    return customers.filter(customer => {
      const lineNames = getCustomerCruiseLineNames(customer)
      const shipNames = getCustomerShipNames(customer)
      const lineMatches = !filters.cruiseLine || lineNames.includes(filters.cruiseLine)
      const shipMatches = !filters.ship || shipNames.includes(filters.ship)
      const personParts = getPersonParts(customer)
      const lastNameMatches = !filters.lastName || personParts.lastName === filters.lastName
      const firstNameInitial = personParts.firstName.slice(0, 1).toUpperCase()
      const firstInitialMatches = !filters.firstNameInitial || firstNameInitial === filters.firstNameInitial
      return lineMatches && shipMatches && lastNameMatches && firstInitialMatches
    }).sort(compareCustomerNames)
  }

  function getScopedBookingRows(filters = {}) {
    return bookingSelectorRows.filter(row => {
      const lineMatches = !filters.cruiseLine || row.lineName === filters.cruiseLine
      const shipMatches = !filters.ship || row.shipName === filters.ship
      const passengerParts = getPersonParts(row.primaryPassenger)
      const lastNameMatches = !filters.passengerLastName || passengerParts.lastName === filters.passengerLastName
      const firstNameInitial = passengerParts.firstName.slice(0, 1).toUpperCase()
      const firstInitialMatches = !filters.passengerFirstNameInitial || firstNameInitial === filters.passengerFirstNameInitial
      return lineMatches && shipMatches && lastNameMatches && firstInitialMatches
    }).map(row => row.booking).sort(compareBookingPassengerNames)
  }

  function getScopedLineOptions(filters = {}, mode = 'booking') {
    const source = mode === 'customer' ? customers : bookings
    if (mode === 'customer') {
      return uniqueSorted(source
        .filter(customer => !filters.ship || getCustomerShipNames(customer).includes(filters.ship))
        .flatMap(getCustomerCruiseLineNames))
    }

    return uniqueSorted(bookingSelectorRows
      .filter(row => !filters.ship || row.shipName === filters.ship)
      .map(row => row.lineName))
  }

  function getScopedShipOptions(filters = {}, mode = 'booking') {
    const source = mode === 'customer' ? customers : bookings
    if (mode === 'customer') {
      return uniqueSorted(source
        .filter(customer => !filters.cruiseLine || getCustomerCruiseLineNames(customer).includes(filters.cruiseLine))
        .flatMap(getCustomerShipNames))
    }

    return uniqueSorted(bookingSelectorRows
      .filter(row => !filters.cruiseLine || row.lineName === filters.cruiseLine)
      .map(row => row.shipName))
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

  const MAX_SELECTOR_OPTIONS = 75
  const customerCruiseLineOptions = getScopedLineOptions(deleteCustomerFilters, 'customer')
  const bookingCruiseLineOptions = getScopedLineOptions(deleteBookingFilters, 'booking')
  const customerShipOptions = getScopedShipOptions(deleteCustomerFilters, 'customer')
  const bookingShipOptions = getScopedShipOptions(deleteBookingFilters, 'booking')
  const customerLastNameOptions = uniqueSorted(getScopedCustomerRows({
    cruiseLine: deleteCustomerFilters.cruiseLine,
    ship: deleteCustomerFilters.ship
  }).map(customer => getPersonParts(customer).lastName))
  const customerFirstNameInitialOptions = uniqueSorted(getScopedCustomerRows({
    cruiseLine: deleteCustomerFilters.cruiseLine,
    ship: deleteCustomerFilters.ship,
    lastName: deleteCustomerFilters.lastName
  }).map(customer => getPersonParts(customer).firstName.slice(0, 1).toUpperCase()))
  const bookingPassengerLastNameOptions = uniqueSorted(getScopedBookingRows({
    cruiseLine: deleteBookingFilters.cruiseLine,
    ship: deleteBookingFilters.ship
  }).map(booking => getPersonParts(getBookingPrimaryPassenger(booking)).lastName))
  const bookingPassengerFirstNameInitialOptions = uniqueSorted(getScopedBookingRows({
    cruiseLine: deleteBookingFilters.cruiseLine,
    ship: deleteBookingFilters.ship,
    passengerLastName: deleteBookingFilters.passengerLastName
  }).map(booking => getPersonParts(getBookingPrimaryPassenger(booking)).firstName.slice(0, 1).toUpperCase()))
  const allFilteredDeleteCustomers = getScopedCustomerRows(deleteCustomerFilters)
  const allFilteredDeleteBookings = getScopedBookingRows(deleteBookingFilters)
  const customerSelectorNeedsNarrowing = allFilteredDeleteCustomers.length > MAX_SELECTOR_OPTIONS
  const bookingSelectorNeedsNarrowing = allFilteredDeleteBookings.length > MAX_SELECTOR_OPTIONS
  const filteredDeleteCustomers = customerSelectorNeedsNarrowing ? [] : allFilteredDeleteCustomers
  const filteredDeleteBookings = bookingSelectorNeedsNarrowing ? [] : allFilteredDeleteBookings
  const workflowCruiseLineOptions = getScopedLineOptions(workflowFilters, 'customer')
  const workflowShipOptions = getScopedShipOptions(workflowFilters, 'customer')
  const workflowLastNameOptions = uniqueSorted(getScopedCustomerRows({
    cruiseLine: workflowFilters.cruiseLine,
    ship: workflowFilters.ship
  }).map(customer => getPersonParts(customer).lastName))
  const workflowFirstNameInitialOptions = uniqueSorted(getScopedCustomerRows({
    cruiseLine: workflowFilters.cruiseLine,
    ship: workflowFilters.ship,
    lastName: workflowFilters.lastName
  }).map(customer => getPersonParts(customer).firstName.slice(0, 1).toUpperCase()))
  const allFilteredWorkflowCustomers = getScopedCustomerRows(workflowFilters)
  const workflowSelectorNeedsNarrowing = allFilteredWorkflowCustomers.length > MAX_SELECTOR_OPTIONS
  const filteredWorkflowCustomers = workflowSelectorNeedsNarrowing ? [] : allFilteredWorkflowCustomers

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
