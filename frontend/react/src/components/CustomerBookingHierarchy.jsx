import { useMemo, useState, useTransition } from 'react'
import { createBooking, createCustomer, deleteBooking, deleteCustomer } from '../api/client.js'
import CustomerHierarchyRow from './CustomerHierarchyRow.jsx'
import ConfirmActionPanel from './ConfirmActionPanel.jsx'
import { getCustomerDirectoryName } from '../domain/adminHierarchy.js'
import { useAdminHierarchyViewState } from '../hooks/useAdminHierarchyViewState.js'
import { useBookingDraftWorkflow } from '../hooks/useBookingDraftWorkflow.js'
import { useCustomerDraftWorkflow } from '../hooks/useCustomerDraftWorkflow.js'

export default function CustomerBookingHierarchy({
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
  const [deleteCustomerFilters, setDeleteCustomerFilters] = useState({ cruiseLine: '', ship: '', customerId: '' })
  const [deleteBookingFilters, setDeleteBookingFilters] = useState({ cruiseLine: '', ship: '', bookingId: '' })
  const [workflowFilters, setWorkflowFilters] = useState({ cruiseLine: '', ship: '', customerId: '' })
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
      setDeleteCustomerFilters({ cruiseLine: '', ship: '', customerId: '' })
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
      setDeleteBookingFilters({ cruiseLine: '', ship: '', bookingId: '' })
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
        next.customerId = ''
      }
      if (fieldName === 'ship') next.customerId = ''
      setDeleteCustomerId(next.customerId)
      return next
    }))
  }

  function updateDeleteBookingFilter(fieldName, value) {
    startSelectorTransition(() => setDeleteBookingFilters(current => {
      const next = { ...current, [fieldName]: value }
      if (fieldName === 'cruiseLine') {
        next.ship = ''
        next.bookingId = ''
      }
      if (fieldName === 'ship') next.bookingId = ''
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
      return lineMatches && shipMatches
    }).sort(compareCustomerNames)
  }

  function getScopedBookingRows(filters = {}) {
    return bookingSelectorRows.filter(row => {
      const lineMatches = !filters.cruiseLine || row.lineName === filters.cruiseLine
      const shipMatches = !filters.ship || row.shipName === filters.ship
      return lineMatches && shipMatches
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
        next.customerId = ''
      }
      if (fieldName === 'ship') next.customerId = ''
      const selectedCustomer = customers.find(customer => customer.id === next.customerId)
      const nextSearchTerm = selectedCustomer
        ? getCustomerDirectoryName(selectedCustomer)
        : next.ship || next.cruiseLine || ''
      updateSearchTerm(nextSearchTerm)
      return next
    }))
  }

  const customerCruiseLineOptions = getScopedLineOptions(deleteCustomerFilters, 'customer')
  const bookingCruiseLineOptions = getScopedLineOptions(deleteBookingFilters, 'booking')
  const customerShipOptions = getScopedShipOptions(deleteCustomerFilters, 'customer')
  const bookingShipOptions = getScopedShipOptions(deleteBookingFilters, 'booking')
  const filteredDeleteCustomers = getScopedCustomerRows(deleteCustomerFilters).slice(0, 500)
  const filteredDeleteBookings = getScopedBookingRows(deleteBookingFilters).slice(0, 500)
  const workflowCruiseLineOptions = getScopedLineOptions(workflowFilters, 'customer')
  const workflowShipOptions = getScopedShipOptions(workflowFilters, 'customer')
  const filteredWorkflowCustomers = getScopedCustomerRows(workflowFilters).slice(0, 500)

  const isInitialLoading = isLoading && customers.length === 0 && bookings.length === 0
  const hasActiveHierarchySearch = Boolean(searchTerm.trim())
  const visibleWorkflowRows = hasActiveHierarchySearch ? rows : rows.slice(0, 50)
  const hiddenWorkflowRowCount = Math.max(rows.length - visibleWorkflowRows.length, 0)

  if (isInitialLoading) {
    return <p role="status" className="status-card ce-command-card">Loading customer and booking workspace…</p>
  }

  if (error) {
    return (
      <section className="status-card error ce-feedback-message ce-editor-card" role="alert" aria-label="Customer operations loading error">
        <p>{error}</p>
        {onRetry && (
          <button type="button" className="secondary-button ce-button-secondary" onClick={onRetry}>
            Retry loading customer workspace
          </button>
        )}
      </section>
    )
  }

  return (
    <section className="react-admin-workspace ce-command-panel" aria-labelledby="react-admin-workspace-heading" data-testid="react-admin-hierarchy">
      <div className="react-admin-heading">
        <p className="eyebrow ce-kicker">Role-aware view</p>
        <h2 id="react-admin-workspace-heading">Admin workspace</h2>
        <p>
          Search customers, expand linked bookings inline, review booking details, and edit records
          from the same workflow table.
        </p>
      </div>

      <div className="react-admin-management-card ce-command-card" data-testid="react-admin-management-card">
        <div className="react-admin-card-heading">
          <div>
            <p className="eyebrow ce-kicker">Admin Data Management</p>
            <h3>Customer-centered operations</h3>
            <p>
              Search customers first, then expand each customer to manage their bookings and booking
              details in context.
            </p>
          </div>
          <div className="react-admin-stat-pills" aria-label="Admin workspace record counts">
            <span>{summary.customerCount} customers</span>
            <span>{summary.uniqueBookingCount} linked bookings</span>
          </div>
        </div>

        <section className="react-admin-mutation-panel ce-editor-card" aria-label="React admin create and delete workflows" data-testid="react-admin-mutation-panel">
          <div>
            <p className="eyebrow ce-kicker">Admin CRUD coverage</p>
            <h4>Customer records and booking safeguards</h4>
            <p>Create customer records and manage destructive corrections with scoped selectors. Passenger-led booking creation remains in the passenger booking workflow.</p>
          </div>

          {(isLoading || isSelectorPending) && (
            <p className="draft-message ce-feedback-message ce-editor-card" role="status" data-testid="react-admin-refresh-status">{isLoading ? 'Refreshing customer and booking workspace…' : 'Updating selector choices…'}</p>
          )}

          {adminMutationMessage && (
            <p className="draft-message ce-feedback-message ce-editor-card" role="status" data-testid="react-admin-mutation-message">{adminMutationMessage}</p>
          )}

          <ConfirmActionPanel
            title="Confirm admin delete"
            message={pendingDelete?.message}
            confirmLabel={pendingDelete?.confirmLabel}
            onConfirm={confirmPendingDelete}
            onCancel={cancelPendingDelete}
            isWorking={Boolean(activeDeleteId)}
            testId="react-admin-delete-confirmation"
            variant="modal"
          />

          <div className="react-admin-mutation-grid ce-field-grid">
            <form className="draft-editor" onSubmit={handleCreateCustomer} data-testid="react-admin-create-customer-form">
              <h5>Create Customer</h5>
              <div className="draft-grid ce-field-grid">
                <label><span>First name</span><input value={createCustomerDraft.firstName} onChange={event => updateCreateCustomerDraft('firstName', event.target.value)} data-testid="react-admin-create-customer-first-name" /></label>
                <label><span>Last name</span><input value={createCustomerDraft.lastName} onChange={event => updateCreateCustomerDraft('lastName', event.target.value)} data-testid="react-admin-create-customer-last-name" /></label>
                <label><span>Email</span><input value={createCustomerDraft.email} onChange={event => updateCreateCustomerDraft('email', event.target.value)} data-testid="react-admin-create-customer-email" /></label>
                <label><span>Phone</span><input value={createCustomerDraft.phone} onChange={event => updateCreateCustomerDraft('phone', event.target.value)} data-testid="react-admin-create-customer-phone" /></label>
                <label><span>Loyalty</span><input value={createCustomerDraft.loyaltyNumber} onChange={event => updateCreateCustomerDraft('loyaltyNumber', event.target.value)} data-testid="react-admin-create-customer-loyalty" /></label>
              </div>
              <button type="submit" className="primary-button ce-button-primary" data-testid="react-admin-create-customer-submit">Create Customer</button>
            </form>

            <form className="draft-editor admin-delete-selector-card" onSubmit={handleDeleteCustomer} data-testid="react-admin-delete-customer-form">
              <h5>Delete customer</h5>
              <p className="muted ce-muted">Narrow the customer list by cruise line and ship, then select the passenger record to remove.</p>
              <div className="admin-delete-filter-grid">
                <label>
                  <span>Cruise line</span>
                  <select value={deleteCustomerFilters.cruiseLine} onChange={event => updateDeleteCustomerFilter('cruiseLine', event.target.value)} data-testid="react-admin-delete-customer-line">
                    <option value="">All cruise lines</option>
                    {customerCruiseLineOptions.map(lineName => <option key={lineName} value={lineName}>{lineName}</option>)}
                  </select>
                </label>
                <label>
                  <span>Ship</span>
                  <select value={deleteCustomerFilters.ship} onChange={event => updateDeleteCustomerFilter('ship', event.target.value)} data-testid="react-admin-delete-customer-ship">
                    <option value="">All ships</option>
                    {customerShipOptions.map(shipName => <option key={shipName} value={shipName}>{shipName}</option>)}
                  </select>
                </label>
                <label className="wide-delete-select">
                  <span>Customer</span>
                  <select value={deleteCustomerId} onChange={event => { setDeleteCustomerId(event.target.value); setDeleteCustomerFilters(current => ({ ...current, customerId: event.target.value })) }} data-testid="react-admin-delete-customer-id">
                    <option value="">Select a customer</option>
                    {filteredDeleteCustomers.map(customer => <option key={customer.id} value={customer.id}>{getCustomerDeleteLabel(customer)}</option>)}
                  </select>
                </label>
              </div>
              <p className="muted ce-muted" role="status">{isSelectorPending ? 'Updating customer choices…' : `${filteredDeleteCustomers.length} matching customers`}</p>
              <button type="submit" className="fleet-danger-action ce-button-danger" disabled={activeDeleteId === `customer:${deleteCustomerId.trim()}`} data-testid="react-admin-delete-customer-submit">Delete Customer</button>
            </form>

            <form className="draft-editor admin-delete-selector-card" onSubmit={handleDeleteBooking} data-testid="react-admin-delete-booking-form">
              <h5>Delete booking</h5>
              <p className="muted ce-muted">Narrow the booking list by cruise line and ship, then select the booking to remove.</p>
              <div className="admin-delete-filter-grid">
                <label>
                  <span>Cruise line</span>
                  <select value={deleteBookingFilters.cruiseLine} onChange={event => updateDeleteBookingFilter('cruiseLine', event.target.value)} data-testid="react-admin-delete-booking-line">
                    <option value="">All cruise lines</option>
                    {bookingCruiseLineOptions.map(lineName => <option key={lineName} value={lineName}>{lineName}</option>)}
                  </select>
                </label>
                <label>
                  <span>Ship</span>
                  <select value={deleteBookingFilters.ship} onChange={event => updateDeleteBookingFilter('ship', event.target.value)} data-testid="react-admin-delete-booking-ship">
                    <option value="">All ships</option>
                    {bookingShipOptions.map(shipName => <option key={shipName} value={shipName}>{shipName}</option>)}
                  </select>
                </label>
                <label className="wide-delete-select">
                  <span>Booking</span>
                  <select value={deleteBookingId} onChange={event => { setDeleteBookingId(event.target.value); setDeleteBookingFilters(current => ({ ...current, bookingId: event.target.value })) }} data-testid="react-admin-delete-booking-id">
                    <option value="">Select a booking</option>
                    {filteredDeleteBookings.map(booking => <option key={booking.id} value={booking.id}>{getBookingDeleteLabel(booking)}</option>)}
                  </select>
                </label>
              </div>
              <p className="muted ce-muted" role="status">{isSelectorPending ? 'Updating booking choices…' : `${filteredDeleteBookings.length} matching bookings`}</p>
              <button type="submit" className="fleet-danger-action ce-button-danger" disabled={activeDeleteId === `booking:${deleteBookingId.trim()}`} data-testid="react-admin-delete-booking-submit">Delete Booking</button>
            </form>
          </div>
        </section>

        <section className="react-admin-record-selector" aria-label="Customer workflow selector">
          <div>
            <p className="eyebrow ce-kicker">Customer workflow selector</p>
            <h4>Find customer records</h4>
            <p className="muted ce-muted">Use cruise line, ship, and customer selectors to narrow records without slow text filtering.</p>
          </div>
          <div className="admin-delete-filter-grid admin-workflow-filter-grid">
            <label>
              <span>Cruise line</span>
              <select value={workflowFilters.cruiseLine} onChange={event => updateWorkflowFilter('cruiseLine', event.target.value)} data-testid="react-hierarchy-line-filter">
                <option value="">All cruise lines</option>
                {workflowCruiseLineOptions.map(lineName => <option key={lineName} value={lineName}>{lineName}</option>)}
              </select>
            </label>
            <label>
              <span>Ship</span>
              <select value={workflowFilters.ship} onChange={event => updateWorkflowFilter('ship', event.target.value)} data-testid="react-hierarchy-ship-filter">
                <option value="">All ships</option>
                {workflowShipOptions.map(shipName => <option key={shipName} value={shipName}>{shipName}</option>)}
              </select>
            </label>
            <label className="wide-delete-select">
              <span>Customer</span>
              <select value={workflowFilters.customerId} onChange={event => updateWorkflowFilter('customerId', event.target.value)} data-testid="react-hierarchy-customer-filter" aria-describedby="react-hierarchy-summary">
                <option value="">All matching customers</option>
                {filteredWorkflowCustomers.map(customer => <option key={customer.id} value={customer.id}>{getCustomerDeleteLabel(customer)}</option>)}
              </select>
            </label>
          </div>
          <p className="muted ce-muted" role="status">{isSelectorPending ? 'Updating customer records…' : `${filteredWorkflowCustomers.length} matching customer records`}</p>
          <input
            className="react-admin-legacy-filter-input"
            data-testid="react-hierarchy-search-input"
            value={searchTerm}
            onChange={event => updateSearchTerm(event.target.value)}
            aria-hidden="true"
            tabIndex="-1"
            autoComplete="off"
          />
        </section>

        <div className="react-admin-workflow-bar">
          <p id="react-hierarchy-summary" className="result-summary" role="status" data-testid="react-hierarchy-summary">
            {summary.customerCount} customers and {summary.uniqueBookingCount} linked bookings available.
            {workflowsVisible ? ' Customer records are visible with linked bookings.' : ' Open customer workflows to view parent and child records.'}
          </p>
          <button
            type="button"
            className="primary-action-button ce-button-primary"
            onClick={() => setWorkflowsVisible(currentValue => !currentValue)}
            aria-expanded={workflowsVisible}
            aria-controls="react-customer-workflow-table"
            data-testid="react-toggle-customer-workflows"
          >
            {workflowsVisible ? 'Hide Customer Workflows' : 'Show Customer Workflows'}
          </button>
        </div>

        {workflowsVisible && (
          <div id="react-customer-workflow-table" className="react-admin-table-wrap ce-editor-card" data-testid="react-customer-workflow-table">
            <div className="react-admin-table-heading">
              <strong>Customer records with linked bookings</strong>
              <span>
                Showing {summary.customerCount} customer workflows with linked bookings available as expandable child rows.
              </span>
            </div>

            <div className="hierarchy-toolbar" aria-label="React hierarchy controls">
              <p className="result-summary">
                Admin-visible customers with expandable linked bookings and booking details
              </p>
              <div className="button-row ce-action-row">
                <button type="button" className="secondary-button ce-button-secondary" onClick={expandAllVisibleCustomers} data-testid="react-expand-visible-customers">
                  Expand visible customers
                </button>
                <button type="button" className="secondary-button ce-button-secondary" onClick={collapseAllVisibleCustomers} data-testid="react-collapse-visible-customers">
                  Collapse visible customers
                </button>
              </div>
            </div>

            {visibleWorkflowRows.length === 0 ? (
              <p className="status-card compact ce-command-card" role="status">
                No customer or linked booking records match “{searchTerm.trim()}”.
              </p>
            ) : (
              <>
                {!hasActiveHierarchySearch && hiddenWorkflowRowCount > 0 && (
                  <p className="result-summary compact" role="status" data-testid="react-customer-workflow-render-limit">
                    Showing the first {visibleWorkflowRows.length} customer workflows. Use search to load a specific customer quickly.
                  </p>
                )}
                <div className="table-scroll react-admin-table-scroll" tabIndex="0">
                <table className="react-admin-table">
                  <caption>Admin-visible customers with expandable linked bookings and booking details</caption>
                  <thead>
                    <tr data-testid="react-customer-header-row">
                      <th scope="col">Customer</th>
                      <th scope="col">Email</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Loyalty</th>
                      <th scope="col">Bookings</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleWorkflowRows.map(({ customer, linkedBookings }) => {
                      const customerName = getCustomerDirectoryName(customer)
                      const isExpanded = expandedCustomerIds.has(customer.id)

                      return (
                        <CustomerHierarchyRow
                          key={customer.id}
                          customer={customer}
                          customerName={customerName}
                          linkedBookings={linkedBookings}
                          isExpanded={isExpanded}
                          expandedBookingIds={expandedBookingIds}
                          onToggleCustomer={() => toggleCustomer(customer.id)}
                          onToggleBooking={bookingId => toggleBooking(customer.id, bookingId)}
                          customerDraft={customerDrafts[customer.id]}
                          customerDraftMessage={customerDraftMessages[customer.id]}
                          onEditCustomer={() => openCustomerDraft(customer)}
                          onUpdateCustomerDraft={(fieldName, value) => updateCustomerDraft(customer.id, fieldName, value)}
                          onValidateCustomerDraft={() => validateCustomerDraftFor(customer)}
                          onSaveCustomerDraft={() => saveCustomerDraftFor(customer)}
                          isSavingCustomer={savingCustomerId === customer.id}
                          onCancelCustomerDraft={() => cancelCustomerDraft(customer.id)}
                          bookingDrafts={bookingDrafts}
                          bookingDraftMessages={bookingDraftMessages}
                          onEditBooking={booking => openBookingDraft(customer.id, booking)}
                          onUpdateBookingDraft={updateBookingDraft}
                          onValidateBookingDraft={booking => validateBookingDraftFor(customer.id, booking)}
                          onSaveBookingDraft={booking => saveBookingDraftFor(customer.id, booking)}
                          savingBookingId={savingBookingId}
                          onCancelBookingDraft={cancelBookingDraft}
                          onDeleteCustomer={() => requestDeleteCustomerById(customer.id, customerName)}
                          isDeletingCustomer={activeDeleteId === `customer:${customer.id}`}
                          onDeleteBooking={booking => requestDeleteBookingById(booking.id, booking.id)}
                          deletingBookingId={activeDeleteId.startsWith('booking:') ? activeDeleteId.replace('booking:', '') : ''}
                        />
                      )
                    })}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
