import ConfirmActionPanel from '../ConfirmActionPanel.jsx'

export default function AdminCustomerBookingMutationPanel({
  isLoading,
  isSelectorPending,
  adminMutationMessage,
  pendingDelete,
  confirmPendingDelete,
  cancelPendingDelete,
  activeDeleteId,
  createCustomerDraft,
  updateCreateCustomerDraft,
  handleCreateCustomer,
  deleteCustomerFilters,
  updateDeleteCustomerFilter,
  customerCruiseLineOptions,
  customerShipOptions,
  customerLastNameOptions,
  customerFirstNameInitialOptions,
  customerSelectorNeedsNarrowing,
  allFilteredDeleteCustomers,
  deleteCustomerId,
  filteredDeleteCustomers,
  getCustomerDeleteLabel,
  handleDeleteCustomer,
  deleteBookingFilters,
  updateDeleteBookingFilter,
  bookingCruiseLineOptions,
  bookingShipOptions,
  bookingPassengerLastNameOptions,
  bookingPassengerFirstNameInitialOptions,
  bookingSelectorNeedsNarrowing,
  allFilteredDeleteBookings,
  deleteBookingId,
  filteredDeleteBookings,
  getBookingDeleteLabel,
  handleDeleteBooking
}) {
  return (
    <section className="react-admin-mutation-panel ce-editor-card ce-surface-light" aria-label="React admin create and delete workflows" data-testid="react-admin-mutation-panel">
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
        <form className="draft-editor ce-surface-light" onSubmit={handleCreateCustomer} data-testid="react-admin-create-customer-form">
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

        <form className="draft-editor admin-delete-selector-card ce-surface-light" onSubmit={handleDeleteCustomer} data-testid="react-admin-delete-customer-form">
          <h5>Delete customer</h5>
          <p className="muted ce-muted">Narrow the customer list by cruise line and ship, then select the passenger record to remove.</p>
          <div className="admin-delete-filter-grid admin-progressive-selector-grid">
            <label><span>Cruise line</span><select value={deleteCustomerFilters.cruiseLine} onChange={event => updateDeleteCustomerFilter('cruiseLine', event.target.value)} data-testid="react-admin-delete-customer-line"><option value="">All cruise lines</option>{customerCruiseLineOptions.map(lineName => <option key={lineName} value={lineName}>{lineName}</option>)}</select></label>
            <label><span>Ship</span><select value={deleteCustomerFilters.ship} onChange={event => updateDeleteCustomerFilter('ship', event.target.value)} data-testid="react-admin-delete-customer-ship"><option value="">All ships</option>{customerShipOptions.map(shipName => <option key={shipName} value={shipName}>{shipName}</option>)}</select></label>
            <label><span>Last name</span><select value={deleteCustomerFilters.lastName} onChange={event => updateDeleteCustomerFilter('lastName', event.target.value)} data-testid="react-admin-delete-customer-last-name"><option value="">All last names</option>{customerLastNameOptions.map(lastName => <option key={lastName} value={lastName}>{lastName}</option>)}</select></label>
            <label><span>First-name initial</span><select value={deleteCustomerFilters.firstNameInitial} onChange={event => updateDeleteCustomerFilter('firstNameInitial', event.target.value)} data-testid="react-admin-delete-customer-first-initial"><option value="">All initials</option>{customerFirstNameInitialOptions.map(initial => <option key={initial} value={initial}>{initial}</option>)}</select></label>
            <label className="wide-delete-select"><span>Customer</span><select value={deleteCustomerId} onChange={event => updateDeleteCustomerFilter('customerId', event.target.value)} data-testid="react-admin-delete-customer-id" disabled={customerSelectorNeedsNarrowing}><option value="">{customerSelectorNeedsNarrowing ? 'Narrow the customer list first' : 'Select a customer'}</option>{filteredDeleteCustomers.map(customer => <option key={customer.id} value={customer.id}>{getCustomerDeleteLabel(customer)}</option>)}</select></label>
          </div>
          <p className="muted ce-muted" role="status">{isSelectorPending ? 'Updating customer choices…' : customerSelectorNeedsNarrowing ? `${allFilteredDeleteCustomers.length} customers match. Choose a cruise line, ship, last name, or first-name initial to narrow the list.` : `${filteredDeleteCustomers.length} matching customers`}</p>
          <button type="submit" className="fleet-danger-action ce-button-danger" disabled={activeDeleteId === `customer:${deleteCustomerId.trim()}`} data-testid="react-admin-delete-customer-submit">Delete Customer</button>
        </form>

        <form className="draft-editor admin-delete-selector-card ce-surface-light" onSubmit={handleDeleteBooking} data-testid="react-admin-delete-booking-form">
          <h5>Delete booking</h5>
          <p className="muted ce-muted">Narrow the booking list by cruise line and ship, then select the booking to remove.</p>
          <div className="admin-delete-filter-grid admin-progressive-selector-grid">
            <label><span>Cruise line</span><select value={deleteBookingFilters.cruiseLine} onChange={event => updateDeleteBookingFilter('cruiseLine', event.target.value)} data-testid="react-admin-delete-booking-line"><option value="">All cruise lines</option>{bookingCruiseLineOptions.map(lineName => <option key={lineName} value={lineName}>{lineName}</option>)}</select></label>
            <label><span>Ship</span><select value={deleteBookingFilters.ship} onChange={event => updateDeleteBookingFilter('ship', event.target.value)} data-testid="react-admin-delete-booking-ship"><option value="">All ships</option>{bookingShipOptions.map(shipName => <option key={shipName} value={shipName}>{shipName}</option>)}</select></label>
            <label><span>Passenger last name</span><select value={deleteBookingFilters.passengerLastName} onChange={event => updateDeleteBookingFilter('passengerLastName', event.target.value)} data-testid="react-admin-delete-booking-passenger-last-name"><option value="">All last names</option>{bookingPassengerLastNameOptions.map(lastName => <option key={lastName} value={lastName}>{lastName}</option>)}</select></label>
            <label><span>Passenger first-name initial</span><select value={deleteBookingFilters.passengerFirstNameInitial} onChange={event => updateDeleteBookingFilter('passengerFirstNameInitial', event.target.value)} data-testid="react-admin-delete-booking-passenger-first-initial"><option value="">All initials</option>{bookingPassengerFirstNameInitialOptions.map(initial => <option key={initial} value={initial}>{initial}</option>)}</select></label>
            <label className="wide-delete-select"><span>Booking</span><select value={deleteBookingId} onChange={event => updateDeleteBookingFilter('bookingId', event.target.value)} data-testid="react-admin-delete-booking-id" disabled={bookingSelectorNeedsNarrowing}><option value="">{bookingSelectorNeedsNarrowing ? 'Narrow the booking list first' : 'Select a booking'}</option>{filteredDeleteBookings.map(booking => <option key={booking.id} value={booking.id}>{getBookingDeleteLabel(booking)}</option>)}</select></label>
          </div>
          <p className="muted ce-muted" role="status">{isSelectorPending ? 'Updating booking choices…' : bookingSelectorNeedsNarrowing ? `${allFilteredDeleteBookings.length} bookings match. Choose a cruise line, ship, passenger last name, or first-name initial to narrow the list.` : `${filteredDeleteBookings.length} matching bookings`}</p>
          <button type="submit" className="fleet-danger-action ce-button-danger" disabled={activeDeleteId === `booking:${deleteBookingId.trim()}`} data-testid="react-admin-delete-booking-submit">Delete Booking</button>
        </form>
      </div>
    </section>
  )
}
