export default function AdminCustomerWorkflowSelector({
  workflowFilters,
  updateWorkflowFilter,
  workflowCruiseLineOptions,
  workflowShipOptions,
  workflowLastNameOptions,
  workflowFirstNameInitialOptions,
  workflowSelectorNeedsNarrowing,
  allFilteredWorkflowCustomers,
  filteredWorkflowCustomers,
  getCustomerDeleteLabel,
  isSelectorPending,
  searchTerm,
  updateSearchTerm
}) {
  return (
    <section className="react-admin-record-selector ce-surface-light" aria-label="Customer workflow selector">
      <div>
        <p className="eyebrow ce-kicker">Customer workflow selector</p>
        <h4>Find customer records</h4>
        <p className="muted ce-muted">Use cruise line, ship, last name, and first-name initial selectors to reduce the customer list before choosing a record.</p>
      </div>
      <div className="admin-delete-filter-grid admin-workflow-filter-grid admin-progressive-selector-grid">
        <label><span>Cruise line</span><select value={workflowFilters.cruiseLine} onChange={event => updateWorkflowFilter('cruiseLine', event.target.value)} data-testid="react-hierarchy-line-filter"><option value="">All cruise lines</option>{workflowCruiseLineOptions.map(lineName => <option key={lineName} value={lineName}>{lineName}</option>)}</select></label>
        <label><span>Ship</span><select value={workflowFilters.ship} onChange={event => updateWorkflowFilter('ship', event.target.value)} data-testid="react-hierarchy-ship-filter"><option value="">All ships</option>{workflowShipOptions.map(shipName => <option key={shipName} value={shipName}>{shipName}</option>)}</select></label>
        <label><span>Last name</span><select value={workflowFilters.lastName} onChange={event => updateWorkflowFilter('lastName', event.target.value)} data-testid="react-hierarchy-customer-last-name-filter"><option value="">All last names</option>{workflowLastNameOptions.map(lastName => <option key={lastName} value={lastName}>{lastName}</option>)}</select></label>
        <label><span>First-name initial</span><select value={workflowFilters.firstNameInitial} onChange={event => updateWorkflowFilter('firstNameInitial', event.target.value)} data-testid="react-hierarchy-customer-first-initial-filter"><option value="">All initials</option>{workflowFirstNameInitialOptions.map(initial => <option key={initial} value={initial}>{initial}</option>)}</select></label>
        <label className="wide-delete-select"><span>Customer</span><select value={workflowFilters.customerId} onChange={event => updateWorkflowFilter('customerId', event.target.value)} data-testid="react-hierarchy-customer-filter" aria-describedby="react-hierarchy-summary" disabled={workflowSelectorNeedsNarrowing}><option value="">{workflowSelectorNeedsNarrowing ? 'Narrow the customer list first' : 'All matching customers'}</option>{filteredWorkflowCustomers.map(customer => <option key={customer.id} value={customer.id}>{getCustomerDeleteLabel(customer)}</option>)}</select></label>
      </div>
      <p className="muted ce-muted" role="status">{isSelectorPending ? 'Updating customer records…' : workflowSelectorNeedsNarrowing ? `${allFilteredWorkflowCustomers.length} customer records match. Choose a cruise line, ship, last name, or first-name initial to narrow the list.` : `${filteredWorkflowCustomers.length} matching customer records`}</p>
      <input className="react-admin-legacy-filter-input" data-testid="react-hierarchy-search-input" value={searchTerm} onChange={event => updateSearchTerm(event.target.value)} aria-hidden="true" tabIndex="-1" autoComplete="off" />
    </section>
  )
}
