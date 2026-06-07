import { useState } from 'react'
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
  const [activeDeleteId, setActiveDeleteId] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

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
    event.preventDefault()

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


  const isInitialLoading = isLoading && customers.length === 0 && bookings.length === 0

  if (isInitialLoading) {
    return <p role="status" className="status-card">Loading customer and booking workspace…</p>
  }

  if (error) {
    return (
      <section className="status-card error" role="alert" aria-label="Customer operations loading error">
        <p>{error}</p>
        {onRetry && (
          <button type="button" className="secondary-button" onClick={onRetry}>
            Retry loading customer workspace
          </button>
        )}
      </section>
    )
  }

  return (
    <section className="react-admin-workspace" aria-labelledby="react-admin-workspace-heading" data-testid="react-admin-hierarchy">
      <div className="react-admin-heading">
        <p className="eyebrow">Role-aware view</p>
        <h2 id="react-admin-workspace-heading">Admin workspace</h2>
        <p>
          Search customers, expand linked bookings inline, review booking details, and edit records
          from the same workflow table.
        </p>
      </div>

      <div className="react-admin-management-card" data-testid="react-admin-management-card">
        <div className="react-admin-card-heading">
          <div>
            <p className="eyebrow">Admin Data Management</p>
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

        <section className="react-admin-mutation-panel" aria-label="React admin create and delete workflows" data-testid="react-admin-mutation-panel">
          <div>
            <p className="eyebrow">Admin CRUD coverage</p>
            <h4>Create and delete customer or booking records</h4>
            <p>These workflows exercise customer and booking mutation boundaries in the same place recruiters can review the operating model. Contextual row actions let admins delete records from the workflow they are already reviewing instead of copying IDs into a separate form.</p>
          </div>

          {isLoading && (
            <p className="draft-message" role="status" data-testid="react-admin-refresh-status">Refreshing customer and booking workspace…</p>
          )}

          {adminMutationMessage && (
            <p className="draft-message" role="status" data-testid="react-admin-mutation-message">{adminMutationMessage}</p>
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

          <div className="react-admin-mutation-grid">
            <form className="draft-editor" onSubmit={handleCreateCustomer} data-testid="react-admin-create-customer-form">
              <h5>Create Customer</h5>
              <div className="draft-grid">
                <label><span>First name</span><input value={createCustomerDraft.firstName} onChange={event => updateCreateCustomerDraft('firstName', event.target.value)} data-testid="react-admin-create-customer-first-name" /></label>
                <label><span>Last name</span><input value={createCustomerDraft.lastName} onChange={event => updateCreateCustomerDraft('lastName', event.target.value)} data-testid="react-admin-create-customer-last-name" /></label>
                <label><span>Email</span><input value={createCustomerDraft.email} onChange={event => updateCreateCustomerDraft('email', event.target.value)} data-testid="react-admin-create-customer-email" /></label>
                <label><span>Phone</span><input value={createCustomerDraft.phone} onChange={event => updateCreateCustomerDraft('phone', event.target.value)} data-testid="react-admin-create-customer-phone" /></label>
                <label><span>Loyalty</span><input value={createCustomerDraft.loyaltyNumber} onChange={event => updateCreateCustomerDraft('loyaltyNumber', event.target.value)} data-testid="react-admin-create-customer-loyalty" /></label>
              </div>
              <button type="submit" className="primary-button" data-testid="react-admin-create-customer-submit">Create Customer</button>
            </form>

            <form className="draft-editor" onSubmit={handleCreateBooking} data-testid="react-admin-create-booking-form">
              <h5>Create Booking</h5>
              <div className="draft-grid">
                <label><span>Customer ID</span><input value={createBookingDraft.customerId} onChange={event => updateCreateBookingDraft('customerId', event.target.value)} data-testid="react-admin-create-booking-customer-id" /></label>
                <label><span>Status</span><input value={createBookingDraft.bookingStatus} onChange={event => updateCreateBookingDraft('bookingStatus', event.target.value)} data-testid="react-admin-create-booking-status" /></label>
                <label><span>Cabin</span><input value={createBookingDraft.cabinNumber} onChange={event => updateCreateBookingDraft('cabinNumber', event.target.value)} data-testid="react-admin-create-booking-cabin" /></label>
                <label><span>Fare</span><input value={createBookingDraft.fareCode} onChange={event => updateCreateBookingDraft('fareCode', event.target.value)} data-testid="react-admin-create-booking-fare" /></label>
                <label><span>Embarkation</span><input value={createBookingDraft.embarkationPort} onChange={event => updateCreateBookingDraft('embarkationPort', event.target.value)} data-testid="react-admin-create-booking-embarkation" /></label>
                <label><span>Debarkation</span><input value={createBookingDraft.debarkationPort} onChange={event => updateCreateBookingDraft('debarkationPort', event.target.value)} data-testid="react-admin-create-booking-debarkation" /></label>
              </div>
              <button type="submit" className="primary-button" data-testid="react-admin-create-booking-submit">Create Booking</button>
            </form>

            <form className="draft-editor" onSubmit={handleDeleteCustomer} data-testid="react-admin-delete-customer-form">
              <h5>Delete Customer by ID</h5>
              <label><span>Customer ID</span><input value={deleteCustomerId} onChange={event => setDeleteCustomerId(event.target.value)} data-testid="react-admin-delete-customer-id" /></label>
              <button type="submit" className="fleet-danger-action" disabled={activeDeleteId === `customer:${deleteCustomerId.trim()}`} data-testid="react-admin-delete-customer-submit">Delete Customer</button>
            </form>

            <form className="draft-editor" onSubmit={handleDeleteBooking} data-testid="react-admin-delete-booking-form">
              <h5>Delete Booking by ID</h5>
              <label><span>Booking ID</span><input value={deleteBookingId} onChange={event => setDeleteBookingId(event.target.value)} data-testid="react-admin-delete-booking-id" /></label>
              <button type="submit" className="fleet-danger-action" disabled={activeDeleteId === `booking:${deleteBookingId.trim()}`} data-testid="react-admin-delete-booking-submit">Delete Booking</button>
            </form>
          </div>
        </section>

        <label className="search-control react-admin-search">
          <span>Search admin records</span>
          <input
            data-testid="react-hierarchy-search-input"
            value={searchTerm}
            onChange={event => updateSearchTerm(event.target.value)}
            placeholder="Search customers, linked bookings, ships, email, cabin, route, status, or loyalty number..."
            aria-describedby="react-hierarchy-summary"
          />
        </label>

        <div className="react-admin-workflow-bar">
          <p id="react-hierarchy-summary" className="result-summary" role="status" data-testid="react-hierarchy-summary">
            {summary.customerCount} customers and {summary.uniqueBookingCount} linked bookings available.
            {workflowsVisible ? ' Customer records are visible with linked bookings.' : ' Open customer workflows to view parent and child records.'}
          </p>
          <button
            type="button"
            className="primary-action-button"
            onClick={() => setWorkflowsVisible(currentValue => !currentValue)}
            aria-expanded={workflowsVisible}
            aria-controls="react-customer-workflow-table"
            data-testid="react-toggle-customer-workflows"
          >
            {workflowsVisible ? 'Hide Customer Workflows' : 'Show Customer Workflows'}
          </button>
        </div>

        {workflowsVisible && (
          <div id="react-customer-workflow-table" className="react-admin-table-wrap" data-testid="react-customer-workflow-table">
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
              <div className="button-row">
                <button type="button" className="secondary-button" onClick={expandAllVisibleCustomers} data-testid="react-expand-visible-customers">
                  Expand visible customers
                </button>
                <button type="button" className="secondary-button" onClick={collapseAllVisibleCustomers} data-testid="react-collapse-visible-customers">
                  Collapse visible customers
                </button>
              </div>
            </div>

            {rows.length === 0 ? (
              <p className="status-card compact" role="status">
                No customer or linked booking records match “{searchTerm.trim()}”.
              </p>
            ) : (
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
                    {rows.map(({ customer, linkedBookings }) => {
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
            )}
          </div>
        )}
      </div>
    </section>
  )
}
