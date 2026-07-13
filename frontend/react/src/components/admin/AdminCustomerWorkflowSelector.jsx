export default function AdminCustomerWorkflowSelector({
  workflowFilters,
  updateWorkflowFilter,
  workflowCruiseLineOptions,
  workflowShipOptions,
  filteredWorkflowCustomers,
  getCustomerDeleteLabel,
  isSelectorPending,
  searchTerm,
  updateSearchTerm
}) {
  return (
    <section className="react-admin-record-selector" aria-label="Customer workflow selector">
      <div>
        <p className="eyebrow ce-kicker">Customer workflow selector</p>
        <h4>Find customer records</h4>
        <p className="muted ce-muted">Use cruise line, ship, and customer selectors to narrow records without slow text filtering.</p>
      </div>
      <div className="admin-delete-filter-grid admin-workflow-filter-grid">
        <label><span>Cruise line</span><select value={workflowFilters.cruiseLine} onChange={event => updateWorkflowFilter('cruiseLine', event.target.value)} data-testid="react-hierarchy-line-filter"><option value="">All cruise lines</option>{workflowCruiseLineOptions.map(lineName => <option key={lineName} value={lineName}>{lineName}</option>)}</select></label>
        <label><span>Ship</span><select value={workflowFilters.ship} onChange={event => updateWorkflowFilter('ship', event.target.value)} data-testid="react-hierarchy-ship-filter"><option value="">All ships</option>{workflowShipOptions.map(shipName => <option key={shipName} value={shipName}>{shipName}</option>)}</select></label>
        <label className="wide-delete-select"><span>Customer</span><select value={workflowFilters.customerId} onChange={event => updateWorkflowFilter('customerId', event.target.value)} data-testid="react-hierarchy-customer-filter" aria-describedby="react-hierarchy-summary"><option value="">All matching customers</option>{filteredWorkflowCustomers.map(customer => <option key={customer.id} value={customer.id}>{getCustomerDeleteLabel(customer)}</option>)}</select></label>
      </div>
      <p className="muted ce-muted" role="status">{isSelectorPending ? 'Updating customer records…' : `${filteredWorkflowCustomers.length} matching customer records`}</p>
      <input className="react-admin-legacy-filter-input" data-testid="react-hierarchy-search-input" value={searchTerm} onChange={event => updateSearchTerm(event.target.value)} aria-hidden="true" tabIndex="-1" autoComplete="off" />
    </section>
  )
}
