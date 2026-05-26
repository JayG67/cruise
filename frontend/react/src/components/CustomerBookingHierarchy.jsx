import { useMemo, useState } from 'react'
import CustomerHierarchyRow from './CustomerHierarchyRow.jsx'
import {
  buildCustomerBookingRows,
  filterCustomerBookingRows,
  getCustomerName,
  summarizeHierarchyRows
} from '../domain/adminHierarchy.js'
import {
  createBookingDraft,
  summarizeBookingDraftChanges,
  updateBookingDraftField,
  validateBookingDraft
} from '../domain/bookingDrafts.js'
import {
  createDraftFeedback,
  createMutationErrorFeedback,
  createNoChangesFeedback,
  createSaveSuccessFeedback,
  createSaveUnavailableFeedback,
  createValidationFeedback
} from '../domain/draftFeedback.js'
import {
  createCustomerDraft,
  summarizeCustomerDraftChanges,
  updateCustomerDraftField,
  validateCustomerDraft
} from '../domain/customerDrafts.js'
import {
  collapseBookingsForVisibleCustomers,
  collapseVisibleCustomers,
  createBookingExpansionKey,
  expandVisibleCustomers,
  toggleExpandedId
} from '../domain/hierarchyExpansionState.js'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCustomerIds, setExpandedCustomerIds] = useState(() => new Set())
  const [expandedBookingIds, setExpandedBookingIds] = useState(() => new Set())
  const [customerDrafts, setCustomerDrafts] = useState(() => ({}))
  const [customerDraftMessages, setCustomerDraftMessages] = useState(() => ({}))
  const [bookingDrafts, setBookingDrafts] = useState(() => ({}))
  const [bookingDraftMessages, setBookingDraftMessages] = useState(() => ({}))

  const allRows = useMemo(() => buildCustomerBookingRows(customers, bookings), [customers, bookings])
  const rows = useMemo(() => filterCustomerBookingRows(allRows, searchTerm), [allRows, searchTerm])
  const summary = useMemo(() => summarizeHierarchyRows(rows), [rows])


  function openCustomerDraft(customer) {
    setCustomerDrafts(current => ({
      ...current,
      [customer.id]: createCustomerDraft(customer)
    }))
    setCustomerDraftMessages(current => ({
      ...current,
      [customer.id]: ''
    }))
  }

  function updateCustomerDraft(customerId, fieldName, value) {
    setCustomerDrafts(current => ({
      ...current,
      [customerId]: updateCustomerDraftField(current[customerId], fieldName, value)
    }))
  }

  function cancelCustomerDraft(customerId) {
    setCustomerDrafts(current => {
      const nextDrafts = { ...current }
      delete nextDrafts[customerId]
      return nextDrafts
    })
    setCustomerDraftMessages(current => {
      const nextMessages = { ...current }
      delete nextMessages[customerId]
      return nextMessages
    })
  }

  function validateCustomerDraftFor(customer) {
    const draft = customerDrafts[customer.id]
    const validation = validateCustomerDraft(draft)
    const changedFields = summarizeCustomerDraftChanges(customer, draft)

    setCustomerDraftMessages(current => ({
      ...current,
      [customer.id]: createValidationFeedback(
        validation,
        `Draft is valid with ${changedFields.length} changed fields. Use Save draft to exercise the React mutation boundary.`
      )
    }))

    return { draft, validation, changedFields }
  }

  async function saveCustomerDraftFor(customer) {
    const { draft, validation, changedFields } = validateCustomerDraftFor(customer)

    if (!validation.isValid) return

    if (changedFields.length === 0) {
      setCustomerDraftMessages(current => ({
        ...current,
        [customer.id]: createNoChangesFeedback('customer')
      }))
      return
    }

    if (!onSaveCustomerDraft) {
      setCustomerDraftMessages(current => ({
        ...current,
        [customer.id]: createSaveUnavailableFeedback('Customer')
      }))
      return
    }

    try {
      const result = await onSaveCustomerDraft(customer.id, draft)
      setCustomerDraftMessages(current => ({
        ...current,
        [customer.id]: createSaveSuccessFeedback(result?.message || 'Customer draft saved through the React mutation boundary.')
      }))
      setCustomerDrafts(current => {
        const nextDrafts = { ...current }
        delete nextDrafts[customer.id]
        return nextDrafts
      })
    } catch (saveError) {
      setCustomerDraftMessages(current => ({
        ...current,
        [customer.id]: createMutationErrorFeedback(saveError, mutationError || 'Unable to save customer draft.')
      }))
    }
  }


  function openBookingDraft(customerId, booking) {
    const bookingKey = createBookingExpansionKey(customerId, booking.id)

    setBookingDrafts(current => ({
      ...current,
      [bookingKey]: createBookingDraft(booking)
    }))
    setBookingDraftMessages(current => ({
      ...current,
      [bookingKey]: ''
    }))
  }

  function updateBookingDraft(bookingKey, fieldName, value) {
    setBookingDrafts(current => ({
      ...current,
      [bookingKey]: updateBookingDraftField(current[bookingKey], fieldName, value)
    }))
  }

  function cancelBookingDraft(bookingKey) {
    setBookingDrafts(current => {
      const nextDrafts = { ...current }
      delete nextDrafts[bookingKey]
      return nextDrafts
    })
    setBookingDraftMessages(current => {
      const nextMessages = { ...current }
      delete nextMessages[bookingKey]
      return nextMessages
    })
  }

  function validateBookingDraftFor(customerId, booking) {
    const bookingKey = createBookingExpansionKey(customerId, booking.id)
    const draft = bookingDrafts[bookingKey]
    const validation = validateBookingDraft(draft)
    const changedFields = summarizeBookingDraftChanges(booking, draft)

    setBookingDraftMessages(current => ({
      ...current,
      [bookingKey]: createValidationFeedback(
        validation,
        `Booking draft is valid with ${changedFields.length} changed fields. Use Save booking draft to exercise the React booking mutation boundary.`
      )
    }))

    return { draft, validation, changedFields }
  }

  async function saveBookingDraftFor(customerId, booking) {
    const bookingKey = createBookingExpansionKey(customerId, booking.id)
    const { draft, validation, changedFields } = validateBookingDraftFor(customerId, booking)

    if (!validation.isValid) return

    if (changedFields.length === 0) {
      setBookingDraftMessages(current => ({
        ...current,
        [bookingKey]: createNoChangesFeedback('booking')
      }))
      return
    }

    if (!onSaveBookingDraft) {
      setBookingDraftMessages(current => ({
        ...current,
        [bookingKey]: createSaveUnavailableFeedback('Booking')
      }))
      return
    }

    try {
      const result = await onSaveBookingDraft(booking, draft)
      setBookingDraftMessages(current => ({
        ...current,
        [bookingKey]: createSaveSuccessFeedback(result?.message || 'Booking draft saved through the React mutation boundary.')
      }))
      setBookingDrafts(current => {
        const nextDrafts = { ...current }
        delete nextDrafts[bookingKey]
        return nextDrafts
      })
    } catch (saveError) {
      setBookingDraftMessages(current => ({
        ...current,
        [bookingKey]: createMutationErrorFeedback(saveError, bookingMutationError || 'Unable to save booking draft.')
      }))
    }
  }

  function expandAllVisibleCustomers() {
    setExpandedCustomerIds(current => expandVisibleCustomers(current, rows))
  }

  function collapseAllVisibleCustomers() {
    setExpandedCustomerIds(current => collapseVisibleCustomers(current, rows))
    setExpandedBookingIds(current => collapseBookingsForVisibleCustomers(current, rows))
  }

  if (isLoading) {
    return <p role="status" className="status-card">Loading React customer hierarchy snapshot…</p>
  }

  if (error) {
    return (
      <section className="status-card error" role="alert" aria-label="React hierarchy loading error">
        <p>{error}</p>
        {onRetry && (
          <button type="button" className="secondary-button" onClick={onRetry}>
            Retry loading snapshot
          </button>
        )}
      </section>
    )
  }

  return (
    <section className="hierarchy-card" aria-labelledby="react-hierarchy-heading" data-testid="react-admin-hierarchy">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Stage 13 migration slice</p>
          <h2 id="react-hierarchy-heading">Customer → booking hierarchy</h2>
          <p className="section-summary">
            React now owns search, summary counts, duplicate-booking-safe expansion state,
            customer and booking mutation boundaries, reusable draft editor components, shared accessible feedback contracts, and extracted row/card presentation components, and explicit aria-controls contracts for expandable hierarchy panels.
          </p>
        </div>
        <label className="search-control">
          <span>Search snapshot</span>
          <input
            data-testid="react-hierarchy-search-input"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Customer, booking, cabin, ship…"
            aria-describedby="react-hierarchy-summary"
          />
        </label>
      </div>

      <div className="hierarchy-toolbar" aria-label="React hierarchy controls">
        <p id="react-hierarchy-summary" className="result-summary" role="status" data-testid="react-hierarchy-summary">
          Showing {summary.customerCount} customers, {summary.uniqueBookingCount} unique bookings,
          and {summary.totalCustomerBookingLinks} customer-booking links.
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
        <div className="table-scroll" tabIndex="0">
          <table>
            <caption>React proof-of-concept hierarchy using the existing API contract.</caption>
            <thead>
              <tr data-testid="react-customer-row">
                <th scope="col">Customer</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Bookings</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ customer, linkedBookings }) => {
                const customerName = getCustomerName(customer)
                const isExpanded = expandedCustomerIds.has(customer.id)

                return (
                  <CustomerHierarchyRow
                    key={customer.id}
                    customer={customer}
                    customerName={customerName}
                    linkedBookings={linkedBookings}
                    isExpanded={isExpanded}
                    expandedBookingIds={expandedBookingIds}
                    onToggleCustomer={() => setExpandedCustomerIds(current => toggleExpandedId(current, customer.id))}
                    onToggleBooking={bookingId => setExpandedBookingIds(current => toggleExpandedId(current, createBookingExpansionKey(customer.id, bookingId)))}
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
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
