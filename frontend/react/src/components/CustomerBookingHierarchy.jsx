import { useState } from 'react'
import CustomerHierarchyRow from './CustomerHierarchyRow.jsx'
import { getCustomerName } from '../domain/adminHierarchy.js'
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
  } = useAdminHierarchyViewState(customers, bookings)

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

  const [workflowsVisible, setWorkflowsVisible] = useState(false)

  if (isLoading) {
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
                    <tr data-testid="react-customer-row">
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
