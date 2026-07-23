import {
  getOperationalApproverDisplay,
  getOperationalRoleLabel
} from './operationalDashboardUtils.js'

export function OperationsReadinessWorkspace({
  selectedOperation,
  readinessWorkspaceSummary,
  selectedOperationSignoffs,
  selectedReadinessKey,
  setSelectedReadinessRole,
  selectedReadinessSignoff,
  getSignoffDraft,
  updateSignoffDraft,
  saveSignoff,
  updatingSignoffKey,
  onUpdateSignoff
}) {
  return (

        <section className="operations-readiness-workspace" aria-labelledby="operations-readiness-workspace-heading" data-testid="react-operations-readiness-workspace">
          <div className="operations-readiness-workspace-header">
            <div>
              <p className="eyebrow ce-kicker">Readiness Approvals</p>
              <h4 id="operations-readiness-workspace-heading">Readiness approvals for {selectedOperation.title}</h4>
              <p>Review department release decisions in one approval queue. Select a department to confirm status, approver ownership, and signoff notes before final turnaround release.</p>
            </div>
            <dl className="operations-readiness-workspace-metrics" aria-label="Selected turnaround readiness summary" data-testid="react-operations-readiness-workspace-summary">
              <div>
                <dt>Departments</dt>
                <dd>{readinessWorkspaceSummary.totalSignoffs}</dd>
              </div>
              <div>
                <dt>Approved</dt>
                <dd>{readinessWorkspaceSummary.approvedSignoffs}</dd>
              </div>
              <div>
                <dt>Pending</dt>
                <dd>{readinessWorkspaceSummary.pendingSignoffs}</dd>
              </div>
              <div>
                <dt>Blocked</dt>
                <dd>{readinessWorkspaceSummary.blockedSignoffs}</dd>
              </div>
            </dl>
          </div>

          {selectedOperationSignoffs.length === 0 ? (
            <p className="status-card compact ce-command-card" data-testid="react-operations-readiness-empty-state">No department readiness approvals are assigned to this turnaround yet.</p>
          ) : (
            <div className="operations-readiness-layout">
              <div className="operations-readiness-list-panel" aria-label="Department readiness approval queue">
                <div className="operations-readiness-list-heading">
                  <h5>Department approvals</h5>
                  <span>{readinessWorkspaceSummary.approvedSignoffs} of {readinessWorkspaceSummary.totalSignoffs} approved</span>
                </div>
                <ul className="operations-readiness-list" data-testid="react-operations-readiness-list">
                  {selectedOperationSignoffs.map(signoff => {
                    const isSelected = signoff.departmentRole === selectedReadinessKey
                    const signoffStatus = String(signoff.status || 'PENDING').toUpperCase()

                    return (
                      <li key={`${selectedOperation.id}-${signoff.departmentRole}`}>
                        <button
                          type="button"
                          className={`operations-readiness-list-item${isSelected ? ' active' : ''} ${signoffStatus.toLowerCase()}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedReadinessRole(signoff.departmentRole)}
                          data-testid="react-operations-readiness-list-item"
                        >
                          <span className={`operations-readiness-status-pill ${signoffStatus.toLowerCase()}`}>{signoffStatus}</span>
                          <strong>{getOperationalRoleLabel(signoff.departmentRole)}</strong>
                          <span>{getOperationalApproverDisplay(signoff)}</span>
                          {signoff.notes && <small>{signoff.notes}</small>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {selectedReadinessSignoff && (
                <article className="operations-readiness-detail-panel" aria-label={`Readiness approval details for ${selectedReadinessSignoff.departmentRole}`} data-testid="react-operations-readiness-detail-panel">
                  <div className="operations-readiness-detail-header">
                    <div>
                      <p className="eyebrow ce-kicker">Readiness Details</p>
                      <h5>{getOperationalRoleLabel(selectedReadinessSignoff.departmentRole)}</h5>
                    </div>
                    <span className={`operations-readiness-status-pill ${String(selectedReadinessSignoff.status || 'PENDING').toLowerCase()}`}>{selectedReadinessSignoff.status || 'PENDING'}</span>
                  </div>

                  <dl className="operations-readiness-detail-list" data-testid="react-operations-readiness-detail-list">
                    <div>
                      <dt>Department</dt>
                      <dd>{getOperationalRoleLabel(selectedReadinessSignoff.departmentRole)}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{selectedReadinessSignoff.status || 'PENDING'}</dd>
                    </div>
                    <div>
                      <dt>Approver</dt>
                      <dd>{getOperationalApproverDisplay(selectedReadinessSignoff)}</dd>
                    </div>
                    <div>
                      <dt>Signed at</dt>
                      <dd>{selectedReadinessSignoff.signedAt || 'Not signed yet'}</dd>
                    </div>
                  </dl>

                  {selectedReadinessSignoff.notes && (
                    <div className="operations-readiness-note" data-testid="react-operations-readiness-note">
                      <strong>Readiness note</strong>
                      <p>{selectedReadinessSignoff.notes}</p>
                    </div>
                  )}

                  {onUpdateSignoff && (
                    <form className="operations-readiness-detail-form operational-signoff-form ce-editor-card ce-surface-light operational-light-editor" onSubmit={event => { event.preventDefault(); saveSignoff(selectedOperation, selectedReadinessSignoff.departmentRole) }} data-testid="react-operational-signoff-form">
                      <label>
                        <span>Readiness status</span>
                        <select value={getSignoffDraft(selectedOperation, selectedReadinessSignoff.departmentRole).status} onChange={event => updateSignoffDraft(selectedOperation, 'status', event.target.value, selectedReadinessSignoff.departmentRole)} aria-label={`${selectedOperation.title} ${selectedReadinessSignoff.departmentRole} readiness status`}>
                          <option value="PENDING">Pending</option>
                          <option value="APPROVED">Approved</option>
                          <option value="BLOCKED">Blocked</option>
                        </select>
                      </label>
                      <label>
                        <span>Approver</span>
                        <input value={getSignoffDraft(selectedOperation, selectedReadinessSignoff.departmentRole).approverName} onChange={event => updateSignoffDraft(selectedOperation, 'approverName', event.target.value, selectedReadinessSignoff.departmentRole)} aria-label={`${selectedOperation.title} ${selectedReadinessSignoff.departmentRole} readiness approver`} />
                      </label>
                      <label className="full-width-field">
                        <span>Signoff notes</span>
                        <textarea value={getSignoffDraft(selectedOperation, selectedReadinessSignoff.departmentRole).notes} onChange={event => updateSignoffDraft(selectedOperation, 'notes', event.target.value, selectedReadinessSignoff.departmentRole)} aria-label={`${selectedOperation.title} ${selectedReadinessSignoff.departmentRole} readiness notes`} rows="3" />
                      </label>
                      <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingSignoffKey === `${selectedOperation.id}:${selectedReadinessSignoff.departmentRole}` || !getSignoffDraft(selectedOperation, selectedReadinessSignoff.departmentRole).approverName.trim()}>Save readiness approval</button>
                    </form>
                  )}
                </article>
              )}
            </div>
          )}
        </section>
        )
}

export function OperationsStaffingWorkspace({
  selectedOperation,
  selectedOperationStaffing,
  staffingWorkspaceSummary,
  selectedStaffingKey,
  setSelectedStaffingRole,
  selectedStaffing,
  getStaffingDraft,
  updateStaffingDraft,
  saveStaffing,
  updatingStaffingKey,
  onUpdateStaffing
}) {
  return (

        <section className="operations-staffing-workspace" aria-labelledby="operations-staffing-workspace-heading" data-testid="react-operations-staffing-workspace">
          <div className="operations-staffing-workspace-header">
            <div>
              <p className="eyebrow ce-kicker">Staffing Coverage</p>
              <h4 id="operations-staffing-workspace-heading">Staffing coverage for {selectedOperation.title}</h4>
              <p>Review crew coverage as a dedicated staffing queue. Select one department to update planned headcount, checked-in crew, lead ownership, muster location, and staffing notes without scanning every department card.</p>
            </div>
            <dl className="operations-staffing-workspace-metrics" aria-label="Selected turnaround staffing summary" data-testid="react-operations-staffing-workspace-summary">
              <div>
                <dt>Departments</dt>
                <dd>{staffingWorkspaceSummary.totalDepartments || selectedOperationStaffing.length}</dd>
              </div>
              <div>
                <dt>Planned</dt>
                <dd>{staffingWorkspaceSummary.plannedCount || 0}</dd>
              </div>
              <div>
                <dt>Checked in</dt>
                <dd>{staffingWorkspaceSummary.checkedInCount || 0}</dd>
              </div>
              <div>
                <dt>Gaps</dt>
                <dd>{staffingWorkspaceSummary.gapCount || 0}</dd>
              </div>
            </dl>
          </div>

          {selectedOperationStaffing.length === 0 ? (
            <p className="status-card compact ce-command-card" data-testid="react-operations-staffing-empty-state">No staffing plans are assigned to this selected turnaround yet.</p>
          ) : (
            <div className="operations-staffing-layout">
              <div className="operations-staffing-list-panel" aria-label="Turnaround staffing queue">
                <div className="operations-staffing-list-heading">
                  <h5>Department staffing</h5>
                  <span>{selectedOperationStaffing.length} department{selectedOperationStaffing.length === 1 ? '' : 's'}</span>
                </div>
                <ul className="operations-staffing-list" data-testid="react-operations-staffing-list">
                  {selectedOperationStaffing.map(staffing => {
                    const plannedCount = Number(staffing.plannedCount || 0)
                    const checkedInCount = Number(staffing.checkedInCount || 0)
                    const gapCount = Math.max(plannedCount - checkedInCount, 0)
                    const checkInPercent = plannedCount > 0 ? Math.round((checkedInCount / plannedCount) * 100) : 0
                    const isSelected = staffing.departmentRole === selectedStaffingKey

                    return (
                      <li key={`${selectedOperation.id}-${staffing.departmentRole}`}>
                        <button
                          type="button"
                          className={`operations-staffing-list-item${isSelected ? ' active' : ''}${gapCount > 0 ? ' staffing-gap' : ''}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedStaffingRole(staffing.departmentRole)}
                          data-testid="react-operations-staffing-list-item"
                        >
                          <span className="operations-staffing-status-pill">{checkInPercent}% staffed</span>
                          <strong>{getOperationalRoleLabel(staffing.departmentRole)}</strong>
                          <span>{checkedInCount} of {plannedCount} checked in</span>
                          <small>{staffing.leadName || 'Lead pending'} · {staffing.musterLocation || 'Muster pending'}</small>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {selectedStaffing && (
                <article className="operations-staffing-detail-panel" aria-label={`Staffing details for ${selectedStaffing.departmentRole}`} data-testid="react-operations-staffing-detail-panel">
                  <div className="operations-staffing-detail-header">
                    <div>
                      <p className="eyebrow ce-kicker">Staffing Details</p>
                      <h5>{getOperationalRoleLabel(selectedStaffing.departmentRole)}</h5>
                    </div>
                    <span className="operations-staffing-status-pill">{Number(selectedStaffing.plannedCount || 0) > 0 ? Math.round((Number(selectedStaffing.checkedInCount || 0) / Number(selectedStaffing.plannedCount || 0)) * 100) : 0}% staffed</span>
                  </div>

                  <dl className="operations-staffing-detail-list" data-testid="react-operations-staffing-detail-list">
                    <div>
                      <dt>Department</dt>
                      <dd>{selectedStaffing.departmentRole}</dd>
                    </div>
                    <div>
                      <dt>Lead</dt>
                      <dd>{selectedStaffing.leadName || 'Lead pending'}</dd>
                    </div>
                    <div>
                      <dt>Coverage</dt>
                      <dd>{selectedStaffing.checkedInCount} of {selectedStaffing.plannedCount} checked in</dd>
                    </div>
                    <div>
                      <dt>Muster</dt>
                      <dd>{selectedStaffing.musterLocation || 'Muster pending'}</dd>
                    </div>
                  </dl>

                  {selectedStaffing.notes && (
                    <div className="operations-staffing-note" data-testid="react-operations-staffing-note">
                      <strong>Staffing note</strong>
                      <p>{selectedStaffing.notes}</p>
                    </div>
                  )}

                  {onUpdateStaffing && (
                    <form className="operations-staffing-detail-form operational-staffing-form ce-editor-card ce-surface-light operational-light-editor" onSubmit={event => { event.preventDefault(); saveStaffing(selectedOperation, selectedStaffing.departmentRole) }} data-testid="react-operational-staffing-form">
                      <label>
                        <span>Planned staff</span>
                        <input type="number" min="0" value={getStaffingDraft(selectedOperation, selectedStaffing.departmentRole).plannedCount} onChange={event => updateStaffingDraft(selectedOperation, 'plannedCount', event.target.value, selectedStaffing.departmentRole)} aria-label={`${selectedOperation.title} planned staff`} />
                      </label>
                      <label>
                        <span>Checked in</span>
                        <input type="number" min="0" value={getStaffingDraft(selectedOperation, selectedStaffing.departmentRole).checkedInCount} onChange={event => updateStaffingDraft(selectedOperation, 'checkedInCount', event.target.value, selectedStaffing.departmentRole)} aria-label={`${selectedOperation.title} checked in staff`} />
                      </label>
                      <label>
                        <span>Staffing lead</span>
                        <input value={getStaffingDraft(selectedOperation, selectedStaffing.departmentRole).leadName} onChange={event => updateStaffingDraft(selectedOperation, 'leadName', event.target.value, selectedStaffing.departmentRole)} aria-label={`${selectedOperation.title} staffing lead`} />
                      </label>
                      <label>
                        <span>Muster location</span>
                        <input value={getStaffingDraft(selectedOperation, selectedStaffing.departmentRole).musterLocation} onChange={event => updateStaffingDraft(selectedOperation, 'musterLocation', event.target.value, selectedStaffing.departmentRole)} aria-label={`${selectedOperation.title} staffing muster location`} />
                      </label>
                      <label className="full-width-field">
                        <span>Staffing notes</span>
                        <textarea value={getStaffingDraft(selectedOperation, selectedStaffing.departmentRole).notes} onChange={event => updateStaffingDraft(selectedOperation, 'notes', event.target.value, selectedStaffing.departmentRole)} aria-label={`${selectedOperation.title} staffing notes`} rows="3" />
                      </label>
                      <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingStaffingKey === `${selectedOperation.id}:${selectedStaffing.departmentRole}` || !getStaffingDraft(selectedOperation, selectedStaffing.departmentRole).leadName.trim()}>Save staffing plan</button>
                    </form>
                  )}
                </article>
              )}
            </div>
          )}
        </section>
        )
}
