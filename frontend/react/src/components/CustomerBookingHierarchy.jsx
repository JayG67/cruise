import AdminCustomerBookingMutationPanel from './admin/AdminCustomerBookingMutationPanel.jsx'
import AdminCustomerWorkflowSelector from './admin/AdminCustomerWorkflowSelector.jsx'
import AdminCustomerWorkflowTable from './admin/AdminCustomerWorkflowTable.jsx'
import useCustomerBookingHierarchyState from './admin/useCustomerBookingHierarchyState.js'

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
  const state = useCustomerBookingHierarchyState({
    customers,
    bookings,
    isLoading,
    onRetry,
    onSaveCustomerDraft,
    mutationError,
    onSaveBookingDraft,
    bookingMutationError
  })
  const { workflowsVisible, setWorkflowsVisible, summary } = state

  if (state.isInitialLoading) {
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
        <p>Search customers, expand linked bookings inline, review booking details, and edit records from the same workflow table.</p>
      </div>

      <div className="react-admin-management-card ce-command-card ce-surface-light" data-testid="react-admin-management-card">
        <div className="react-admin-card-heading">
          <div>
            <p className="eyebrow ce-kicker">Admin Data Management</p>
            <h3>Customer-centered operations</h3>
            <p>Search customers first, then expand each customer to manage their bookings and booking details in context.</p>
          </div>
          <div className="react-admin-stat-pills" aria-label="Admin workspace record counts">
            <span>{summary.customerCount} customers</span>
            <span>{summary.uniqueBookingCount} linked bookings</span>
          </div>
        </div>

        <AdminCustomerBookingMutationPanel
          isLoading={isLoading}
          isSelectorPending={state.isSelectorPending}
          adminMutationMessage={state.adminMutationMessage}
          pendingDelete={state.pendingDelete}
          confirmPendingDelete={state.confirmPendingDelete}
          cancelPendingDelete={state.cancelPendingDelete}
          activeDeleteId={state.activeDeleteId}
          createCustomerDraft={state.createCustomerDraft}
          updateCreateCustomerDraft={state.updateCreateCustomerDraft}
          handleCreateCustomer={state.handleCreateCustomer}
          deleteCustomerFilters={state.deleteCustomerFilters}
          updateDeleteCustomerFilter={state.updateDeleteCustomerFilter}
          customerCruiseLineOptions={state.customerCruiseLineOptions}
          customerShipOptions={state.customerShipOptions}
          customerLastNameOptions={state.customerLastNameOptions}
          customerFirstNameInitialOptions={state.customerFirstNameInitialOptions}
          customerSelectorNeedsNarrowing={state.customerSelectorNeedsNarrowing}
          allFilteredDeleteCustomers={state.allFilteredDeleteCustomers}
          deleteCustomerId={state.deleteCustomerId}
          filteredDeleteCustomers={state.filteredDeleteCustomers}
          getCustomerDeleteLabel={state.getCustomerDeleteLabel}
          handleDeleteCustomer={state.handleDeleteCustomer}
          deleteBookingFilters={state.deleteBookingFilters}
          updateDeleteBookingFilter={state.updateDeleteBookingFilter}
          bookingCruiseLineOptions={state.bookingCruiseLineOptions}
          bookingShipOptions={state.bookingShipOptions}
          bookingPassengerLastNameOptions={state.bookingPassengerLastNameOptions}
          bookingPassengerFirstNameInitialOptions={state.bookingPassengerFirstNameInitialOptions}
          bookingSelectorNeedsNarrowing={state.bookingSelectorNeedsNarrowing}
          allFilteredDeleteBookings={state.allFilteredDeleteBookings}
          deleteBookingId={state.deleteBookingId}
          filteredDeleteBookings={state.filteredDeleteBookings}
          getBookingDeleteLabel={state.getBookingDeleteLabel}
          handleDeleteBooking={state.handleDeleteBooking}
        />

        <AdminCustomerWorkflowSelector
          workflowFilters={state.workflowFilters}
          updateWorkflowFilter={state.updateWorkflowFilter}
          workflowCruiseLineOptions={state.workflowCruiseLineOptions}
          workflowShipOptions={state.workflowShipOptions}
          workflowLastNameOptions={state.workflowLastNameOptions}
          workflowFirstNameInitialOptions={state.workflowFirstNameInitialOptions}
          workflowSelectorNeedsNarrowing={state.workflowSelectorNeedsNarrowing}
          allFilteredWorkflowCustomers={state.allFilteredWorkflowCustomers}
          filteredWorkflowCustomers={state.filteredWorkflowCustomers}
          getCustomerDeleteLabel={state.getCustomerDeleteLabel}
          isSelectorPending={state.isSelectorPending}
          searchTerm={state.searchTerm}
          updateSearchTerm={state.updateSearchTerm}
        />

        <div className="react-admin-workflow-bar ce-surface-dark">
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
          <AdminCustomerWorkflowTable
            summary={summary}
            expandAllVisibleCustomers={state.expandAllVisibleCustomers}
            collapseAllVisibleCustomers={state.collapseAllVisibleCustomers}
            visibleWorkflowRows={state.visibleWorkflowRows}
            searchTerm={state.searchTerm}
            hasActiveHierarchySearch={state.hasActiveHierarchySearch}
            hiddenWorkflowRowCount={state.hiddenWorkflowRowCount}
            expandedCustomerIds={state.expandedCustomerIds}
            expandedBookingIds={state.expandedBookingIds}
            toggleCustomer={state.toggleCustomer}
            toggleBooking={state.toggleBooking}
            customerDrafts={state.customerDrafts}
            customerDraftMessages={state.customerDraftMessages}
            openCustomerDraft={state.openCustomerDraft}
            updateCustomerDraft={state.updateCustomerDraft}
            validateCustomerDraftFor={state.validateCustomerDraftFor}
            saveCustomerDraftFor={state.saveCustomerDraftFor}
            savingCustomerId={savingCustomerId}
            cancelCustomerDraft={state.cancelCustomerDraft}
            bookingDrafts={state.bookingDrafts}
            bookingDraftMessages={state.bookingDraftMessages}
            openBookingDraft={state.openBookingDraft}
            updateBookingDraft={state.updateBookingDraft}
            validateBookingDraftFor={state.validateBookingDraftFor}
            saveBookingDraftFor={state.saveBookingDraftFor}
            savingBookingId={savingBookingId}
            cancelBookingDraft={state.cancelBookingDraft}
            requestDeleteCustomerById={state.requestDeleteCustomerById}
            requestDeleteBookingById={state.requestDeleteBookingById}
            activeDeleteId={state.activeDeleteId}
          />
        )}
      </div>
    </section>
  )
}
