import {
  getOperationalAuthorDisplay,
  getOperationalOwnerDisplay
} from './operationalDashboardUtils.js'

export function OperationsEscalationWorkspace(props) {
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
<section className="operations-escalation-workspace" aria-labelledby="operations-escalation-workspace-heading" data-testid="react-operations-escalation-workspace">
  <div className="operations-escalation-workspace-header">
    <div>
      <p className="eyebrow ce-kicker">Escalation Management</p>
      <h4 id="operations-escalation-workspace-heading">Escalation command for {selectedOperation.title}</h4>
      <p>Review one operational risk at a time. The queue separates severity, owner, status, and resolution notes so escalations are readable without opening every incident form on the page.</p>
    </div>
    <dl className="operations-escalation-workspace-metrics" aria-label="Selected turnaround escalation summary" data-testid="react-operations-escalation-workspace-summary">
      <div>
        <dt>Total</dt>
        <dd>{escalationWorkspaceSummary.totalEscalations ?? selectedOperationEscalations.length}</dd>
      </div>
      <div>
        <dt>Open</dt>
        <dd>{escalationWorkspaceSummary.openEscalations || 0}</dd>
      </div>
      <div>
        <dt>Monitoring</dt>
        <dd>{escalationWorkspaceSummary.monitoringEscalations || 0}</dd>
      </div>
      <div>
        <dt>Critical</dt>
        <dd>{escalationWorkspaceSummary.criticalEscalations || 0}</dd>
      </div>
    </dl>
  </div>

  {onCreateEscalation && (
    <form className="operations-escalation-quick-add operational-escalation-create-form ce-editor-card ce-surface-light operational-light-editor" onSubmit={event => { event.preventDefault(); saveEscalationCreate(selectedOperation) }} data-testid="react-operational-escalation-create-form">
      <h5>Add escalation</h5>
      <label>
        <span>Department</span>
        <select value={getEscalationCreateDraft(selectedOperation).departmentRole} onChange={event => updateEscalationCreateDraft(selectedOperation, 'departmentRole', event.target.value)} aria-label={`${selectedOperation.title} escalation department`}>
          <option value="turnaround-manager">Turnaround Manager</option>
          <option value="housekeeping-lead">Housekeeping Lead</option>
          <option value="guest-services-lead">Guest Services Lead</option>
          <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
          <option value="engineering-lead">Engineering Lead</option>
          <option value="security-lead">Security Lead</option>
          <option value="port-operations-lead">Port Operations Lead</option>
        </select>
      </label>
      <label>
        <span>Severity</span>
        <select value={getEscalationCreateDraft(selectedOperation).severity} onChange={event => updateEscalationCreateDraft(selectedOperation, 'severity', event.target.value)} aria-label={`${selectedOperation.title} escalation severity`}>
          <option value="WATCH">Watch</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </label>
      <label>
        <span>Title</span>
        <input value={getEscalationCreateDraft(selectedOperation).title} onChange={event => updateEscalationCreateDraft(selectedOperation, 'title', event.target.value)} aria-label={`${selectedOperation.title} escalation title`} />
      </label>
      <label>
        <span>Owner</span>
        <input value={getEscalationCreateDraft(selectedOperation).ownerName} onChange={event => updateEscalationCreateDraft(selectedOperation, 'ownerName', event.target.value)} aria-label={`${selectedOperation.title} escalation owner`} />
      </label>
      <label className="full-width-field">
        <span>Escalation notes</span>
        <textarea value={getEscalationCreateDraft(selectedOperation).resolutionNotes} onChange={event => updateEscalationCreateDraft(selectedOperation, 'resolutionNotes', event.target.value)} aria-label={`${selectedOperation.title} escalation notes`} rows="3" />
      </label>
      <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingEscalationId === selectedOperation.id || !getEscalationCreateDraft(selectedOperation).title.trim()}>Add escalation</button>
    </form>
  )}

  {selectedOperationEscalations.length === 0 ? (
    <p className="status-card compact ce-command-card" data-testid="react-operations-escalation-empty-state">No escalation records are active for this selected turnaround.</p>
  ) : (
    <div className="operations-escalation-layout">
      <div className="operations-escalation-list-panel" aria-label="Turnaround escalation queue">
        <div className="operations-escalation-list-heading">
          <h5>Escalation queue</h5>
          <span>{selectedOperationEscalations.length} escalation{selectedOperationEscalations.length === 1 ? '' : 's'}</span>
        </div>
        <ul className="operations-escalation-list-focused" data-testid="react-operations-escalation-list">
          {selectedOperationEscalations.map(escalation => {
            const isSelected = escalation.id === selectedEscalationKey
            const severity = String(escalation.severity || 'WATCH').toLowerCase()

            return (
              <li key={escalation.id}>
                <button
                  type="button"
                  className={`operations-escalation-list-item${isSelected ? ' active' : ''} ${severity}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedEscalationId(escalation.id)}
                  data-testid="react-operations-escalation-list-item"
                >
                  <span className={`operations-escalation-severity-pill ${severity}`}>{escalation.severity || 'WATCH'}</span>
                  <strong>{escalation.title}</strong>
                  <span>{escalation.departmentRole} · {escalation.status}</span>
                  <small>{getOperationalOwnerDisplay(escalation)}</small>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {selectedEscalation && (
        <article className="operations-escalation-detail-panel" aria-label={`Escalation details for ${selectedEscalation.title}`} data-testid="react-operations-escalation-detail-panel">
          <div className="operations-escalation-detail-header">
            <div>
              <p className="eyebrow ce-kicker">Escalation Details</p>
              <h5>{selectedEscalation.title}</h5>
            </div>
            <span className={`operations-escalation-severity-pill ${String(selectedEscalation.severity || 'WATCH').toLowerCase()}`}>{selectedEscalation.severity || 'WATCH'}</span>
          </div>

          <dl className="operations-escalation-detail-list" data-testid="react-operations-escalation-detail-list">
            <div>
              <dt>Department</dt>
              <dd>{selectedEscalation.departmentRole}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{getOperationalOwnerDisplay(selectedEscalation)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedEscalation.status}</dd>
            </div>
            <div>
              <dt>Severity</dt>
              <dd>{selectedEscalation.severity}</dd>
            </div>
          </dl>

          {selectedEscalation.resolutionNotes && (
            <div className="operations-escalation-note" data-testid="react-operations-escalation-note">
              <strong>Resolution notes</strong>
              <p>{selectedEscalation.resolutionNotes}</p>
            </div>
          )}

          {onUpdateEscalation && (
            <form className="operations-escalation-detail-form operational-escalation-update-form ce-editor-card ce-surface-light operational-light-editor" onSubmit={event => { event.preventDefault(); saveEscalationUpdate(selectedEscalation) }} data-testid="react-operational-escalation-update-form">
              <label>
                <span>Status</span>
                <select value={getEscalationUpdateDraft(selectedEscalation).status} onChange={event => updateEscalationDraft(selectedEscalation, 'status', event.target.value)} aria-label={`${selectedEscalation.title} escalation status`}>
                  <option value="OPEN">Open</option>
                  <option value="MONITORING">Monitoring</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </label>
              <label>
                <span>Severity</span>
                <select value={getEscalationUpdateDraft(selectedEscalation).severity} onChange={event => updateEscalationDraft(selectedEscalation, 'severity', event.target.value)} aria-label={`${selectedEscalation.title} escalation update severity`}>
                  <option value="WATCH">Watch</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </label>
              <label>
                <span>Owner</span>
                <input value={getEscalationUpdateDraft(selectedEscalation).ownerName} onChange={event => updateEscalationDraft(selectedEscalation, 'ownerName', event.target.value)} aria-label={`${selectedEscalation.title} escalation update owner`} />
              </label>
              <label className="full-width-field">
                <span>Resolution notes</span>
                <textarea value={getEscalationUpdateDraft(selectedEscalation).resolutionNotes} onChange={event => updateEscalationDraft(selectedEscalation, 'resolutionNotes', event.target.value)} aria-label={`${selectedEscalation.title} escalation resolution notes`} rows="3" />
              </label>
              <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingEscalationId === selectedEscalation.id || !getEscalationUpdateDraft(selectedEscalation).title.trim()}>Save escalation</button>
            </form>
          )}
        </article>
      )}
    </div>
  )}
</section>
  )
}
