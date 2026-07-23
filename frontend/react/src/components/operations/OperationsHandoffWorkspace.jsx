import {
  getOperationalAuthorDisplay,
  getOperationalOwnerDisplay
} from './operationalDashboardUtils.js'

export function OperationsHandoffWorkspace(props) {
  const {
    selectedOperation,
    selectedOperationDependencies,
    dependencyWorkspaceSummary,
    selectedDependencyKey,
    setSelectedDependencyId,
    selectedDependency,
    selectedOperationEscalations,
    escalationWorkspaceSummary,
    selectedEscalationKey,
    setSelectedEscalationId,
    selectedEscalation,
    onCreateEscalation,
    getEscalationCreateDraft,
    updateEscalationCreateDraft,
    saveEscalationCreate,
    creatingEscalationId,
    getEscalationUpdateDraft,
    updateEscalationDraft,
    saveEscalationUpdate,
    updatingEscalationId,
    onUpdateEscalation,
    selectedOperationHandoffs,
    handoffWorkspaceSummary,
    selectedHandoffKey,
    setSelectedHandoffId,
    selectedHandoff,
    onUpdateHandoff,
    getHandoffDraft,
    updateHandoffDraft,
    saveHandoffUpdate,
    updatingHandoffId,
    selectedOperationTasks,
    taskWorkspaceSummary,
    selectedTaskKey,
    setSelectedTaskId,
    onCreateTask,
    getTaskCreateDraft,
    updateTaskCreateDraft,
    saveTaskCreate,
    creatingTaskId,
    getTaskUpdateDraft,
    updateTaskUpdateDraft,
    saveTaskUpdate,
    creatingTaskUpdateId,
    onCreateTaskUpdate,
    onUpdateTaskDetails,
    getTaskDetailDraft,
    updateTaskDetailDraft,
    saveTaskDetails,
    updatingTaskDetailsId,
    onUpdateTaskStatus,
    updatingTaskId,
    updateStatus,
    onDeleteTask,
    deletingTaskId,
    removeTask
  } = props

  return (
<section className="operations-handoff-workspace" aria-labelledby="operations-handoff-workspace-heading" data-testid="react-operations-handoff-workspace">
  <div className="operations-handoff-workspace-header">
    <div>
      <p className="eyebrow ce-kicker">Department Handoffs</p>
      <h4 id="operations-handoff-workspace-heading">Department handoffs for {selectedOperation.title}</h4>
      <p>Work one release handoff at a time. The queue keeps ownership, due time, sender, receiver, status, and notes readable without showing every handoff form in the overview.</p>
    </div>
    <dl className="operations-handoff-workspace-metrics" aria-label="Selected turnaround handoff summary" data-testid="react-operations-handoff-workspace-summary">
      <div>
        <dt>Total</dt>
        <dd>{handoffWorkspaceSummary.totalHandoffs || selectedOperationHandoffs.length}</dd>
      </div>
      <div>
        <dt>Complete</dt>
        <dd>{handoffWorkspaceSummary.completedHandoffs || 0}</dd>
      </div>
      <div>
        <dt>Blocked</dt>
        <dd>{handoffWorkspaceSummary.blockedHandoffs || 0}</dd>
      </div>
      <div>
        <dt>Open</dt>
        <dd>{handoffWorkspaceSummary.pendingHandoffs ?? Math.max(0, selectedOperationHandoffs.length - (handoffWorkspaceSummary.completedHandoffs || 0))}</dd>
      </div>
    </dl>
  </div>

  {selectedOperationHandoffs.length === 0 ? (
    <p className="status-card compact ce-command-card" data-testid="react-operations-handoff-empty-state">No department handoffs are assigned to this selected turnaround yet.</p>
  ) : (
    <div className="operations-handoff-layout">
      <div className="operations-handoff-list-panel" aria-label="Turnaround department handoff queue">
        <div className="operations-handoff-list-heading">
          <h5>Handoff queue</h5>
          <span>{selectedOperationHandoffs.length} handoff{selectedOperationHandoffs.length === 1 ? '' : 's'}</span>
        </div>
        <ul className="operations-handoff-list-focused" data-testid="react-operations-handoff-list">
          {selectedOperationHandoffs.map(handoff => {
            const isSelected = handoff.id === selectedHandoffKey

            return (
              <li key={handoff.id}>
                <button
                  type="button"
                  className={`operations-handoff-list-item${isSelected ? ' active' : ''}${handoff.status === 'BLOCKED' ? ' blocked' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedHandoffId(handoff.id)}
                  data-testid="react-operations-handoff-list-item"
                >
                  <span className={`operations-handoff-status-pill ${String(handoff.status).toLowerCase()}`}>{handoff.status}</span>
                  <strong>{handoff.title}</strong>
                  <span>{handoff.fromDepartmentRole} → {handoff.toDepartmentRole}</span>
                  <small>{getOperationalOwnerDisplay(handoff)} · {handoff.dueTime || 'Due pending'}</small>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {selectedHandoff && (
        <article className="operations-handoff-detail-panel" aria-label={`Handoff details for ${selectedHandoff.title}`} data-testid="react-operations-handoff-detail-panel">
          <div className="operations-handoff-detail-header">
            <div>
              <p className="eyebrow ce-kicker">Handoff Details</p>
              <h5>{selectedHandoff.title}</h5>
            </div>
            <span className={`operations-handoff-status-pill ${String(selectedHandoff.status).toLowerCase()}`}>{selectedHandoff.status}</span>
          </div>

          <dl className="operations-handoff-detail-list" data-testid="react-operations-handoff-detail-list">
            <div>
              <dt>From</dt>
              <dd>{selectedHandoff.fromDepartmentRole}</dd>
            </div>
            <div>
              <dt>To</dt>
              <dd>{selectedHandoff.toDepartmentRole}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{getOperationalOwnerDisplay(selectedHandoff)}</dd>
            </div>
            <div>
              <dt>Due time</dt>
              <dd>{selectedHandoff.dueTime || 'Due pending'}</dd>
            </div>
          </dl>

          {selectedHandoff.notes && (
            <div className="operations-handoff-note" data-testid="react-operations-handoff-note">
              <strong>Handoff note</strong>
              <p>{selectedHandoff.notes}</p>
            </div>
          )}

          {onUpdateHandoff && (
            <form className="operations-handoff-detail-form operational-handoff-form ce-editor-card ce-surface-light operational-light-editor" onSubmit={event => { event.preventDefault(); saveHandoffUpdate(selectedHandoff) }} data-testid="react-operational-handoff-form">
              <label>
                <span>Status</span>
                <select value={getHandoffDraft(selectedHandoff).status} onChange={event => updateHandoffDraft(selectedHandoff, 'status', event.target.value)} aria-label={`${selectedHandoff.title} handoff status`}>
                  <option value="PENDING">Pending</option>
                  <option value="READY">Ready</option>
                  <option value="IN_REVIEW">In review</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="COMPLETE">Complete</option>
                </select>
              </label>
              <label>
                <span>Owner</span>
                <input value={getHandoffDraft(selectedHandoff).ownerName} onChange={event => updateHandoffDraft(selectedHandoff, 'ownerName', event.target.value)} aria-label={`${selectedHandoff.title} handoff owner`} />
              </label>
              <label>
                <span>Due time</span>
                <input value={getHandoffDraft(selectedHandoff).dueTime} onChange={event => updateHandoffDraft(selectedHandoff, 'dueTime', event.target.value)} aria-label={`${selectedHandoff.title} handoff due time`} />
              </label>
              <label className="full-width-field">
                <span>Handoff notes</span>
                <textarea value={getHandoffDraft(selectedHandoff).notes} onChange={event => updateHandoffDraft(selectedHandoff, 'notes', event.target.value)} aria-label={`${selectedHandoff.title} handoff notes`} rows="3" />
              </label>
              <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingHandoffId === selectedHandoff.id || !getHandoffDraft(selectedHandoff).ownerName.trim()}>Save handoff</button>
            </form>
          )}
        </article>
      )}
    </div>
  )}
</section>
  )
}
