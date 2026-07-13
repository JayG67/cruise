import { getOperationalApproverDisplay } from './operationalDashboardUtils.js'

export function OperationsStaffingSignoffSection({
  getSignoffDraft,
  getStaffingDraft,
  item,
  onUpdateSignoff,
  onUpdateStaffing,
  roleView,
  saveSignoff,
  saveStaffing,
  updateSignoffDraft,
  updateStaffingDraft,
  updatingSignoffKey,
  updatingStaffingKey,
}) {
  return (
    <>
      {item.staffingSummary && (
        <div className="operational-staffing-summary" data-testid="react-operational-staffing-summary">
          <strong>Staffing check-in</strong>
          <span>{item.staffingSummary.checkedInCount} of {item.staffingSummary.plannedCount} crew checked in</span>
          <span>{item.staffingSummary.checkInPercent}% staffed</span>
          {item.staffingSummary.gapCount > 0 && <span>{item.staffingSummary.gapCount} gap{item.staffingSummary.gapCount === 1 ? '' : 's'}</span>}
        </div>
      )}

      {item.staffing?.length > 0 && (
        <div className="operational-staffing-list" data-testid="react-operational-staffing-list">
          <strong>Department staffing plan</strong>
          <ul>
            {item.staffing.map(staffing => (
              <li key={`${item.id}-${staffing.departmentRole}`}>
                <span>{staffing.departmentRole}</span>
                <span>{staffing.checkedInCount} / {staffing.plannedCount}</span>
                <span>{staffing.leadName || 'Lead pending'}</span>
                <span>{staffing.musterLocation || 'Muster pending'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onUpdateStaffing && (
        <form className="operational-staffing-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveStaffing(item) }} data-testid="react-operational-staffing-form">
          <label>
            <span>Planned staff</span>
            <input type="number" min="0" value={getStaffingDraft(item).plannedCount} onChange={event => updateStaffingDraft(item, 'plannedCount', event.target.value)} aria-label={`${item.title} planned staff`} />
          </label>
          <label>
            <span>Checked in</span>
            <input type="number" min="0" value={getStaffingDraft(item).checkedInCount} onChange={event => updateStaffingDraft(item, 'checkedInCount', event.target.value)} aria-label={`${item.title} checked in staff`} />
          </label>
          <label>
            <span>Staffing lead</span>
            <input value={getStaffingDraft(item).leadName} onChange={event => updateStaffingDraft(item, 'leadName', event.target.value)} aria-label={`${item.title} staffing lead`} />
          </label>
          <label>
            <span>Muster location</span>
            <input value={getStaffingDraft(item).musterLocation} onChange={event => updateStaffingDraft(item, 'musterLocation', event.target.value)} aria-label={`${item.title} staffing muster location`} />
          </label>
          <label className="full-width-field">
            <span>Staffing notes</span>
            <input value={getStaffingDraft(item).notes} onChange={event => updateStaffingDraft(item, 'notes', event.target.value)} aria-label={`${item.title} staffing notes`} />
          </label>
          <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingStaffingKey === `${item.id}:${roleView}` || !getStaffingDraft(item).leadName.trim()}>Save staffing plan</button>
        </form>
      )}

      {item.signoffs.length > 0 && (
        <div className="operational-signoff-summary" data-testid="react-operational-signoff-summary">
          <strong>Department readiness signoffs</strong>
          <ul>
            {item.signoffs.map(signoff => (
              <li key={`${item.id}-${signoff.departmentRole}`}>
                <span>{signoff.departmentRole}</span>
                <span>{signoff.status}</span>
                <span>{getOperationalApproverDisplay(signoff)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onUpdateSignoff && (
        <form className="operational-signoff-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveSignoff(item) }} data-testid="react-operational-signoff-form">
          <label>
            <span>Readiness status</span>
            <select value={getSignoffDraft(item).status} onChange={event => updateSignoffDraft(item, 'status', event.target.value)} aria-label={`${item.title} readiness signoff status`}>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </label>
          <label>
            <span>Approver</span>
            <input value={getSignoffDraft(item).approverName} onChange={event => updateSignoffDraft(item, 'approverName', event.target.value)} aria-label={`${item.title} readiness approver`} />
          </label>
          <label className="full-width-field">
            <span>Signoff notes</span>
            <input value={getSignoffDraft(item).notes} onChange={event => updateSignoffDraft(item, 'notes', event.target.value)} aria-label={`${item.title} readiness notes`} />
          </label>
          <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingSignoffKey === `${item.id}:${roleView}` || !getSignoffDraft(item).approverName.trim()}>Save readiness signoff</button>
        </form>
      )}
    </>
  )
}
