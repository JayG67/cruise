export function OperationsDependencyWorkspace(props) {
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
<section className="operations-dependency-workspace" aria-labelledby="operations-dependency-workspace-heading" data-testid="react-operations-dependency-workspace">
  <div className="operations-dependency-workspace-header">
    <div>
      <p className="eyebrow ce-kicker">Dependency Gates</p>
      <h4 id="operations-dependency-workspace-heading">Dependency gates for {selectedOperation.title}</h4>
      <p>Review blocker gates as a dedicated release queue. Select one dependency to see the blocked task, prerequisite task, status, notes, and operational impact without crowding the main overview.</p>
    </div>
    <dl className="operations-dependency-workspace-metrics" aria-label="Selected turnaround dependency summary" data-testid="react-operations-dependency-workspace-summary">
      <div>
        <dt>Total</dt>
        <dd>{dependencyWorkspaceSummary.totalDependencies || selectedOperationDependencies.length}</dd>
      </div>
      <div>
        <dt>Active</dt>
        <dd>{dependencyWorkspaceSummary.activeDependencies || 0}</dd>
      </div>
      <div>
        <dt>Cleared</dt>
        <dd>{dependencyWorkspaceSummary.clearedDependencies || 0}</dd>
      </div>
    </dl>
  </div>

  {selectedOperationDependencies.length === 0 ? (
    <p className="status-card compact ce-command-card" data-testid="react-operations-dependency-empty-state">No dependency gates are assigned to this selected turnaround yet.</p>
  ) : (
    <div className="operations-dependency-layout">
      <div className="operations-dependency-list-panel" aria-label="Turnaround dependency gate queue">
        <div className="operations-dependency-list-heading">
          <h5>Dependency gates</h5>
          <span>{selectedOperationDependencies.length} gate{selectedOperationDependencies.length === 1 ? '' : 's'}</span>
        </div>
        <ul className="operations-dependency-list" data-testid="react-operations-dependency-list">
          {selectedOperationDependencies.map(dependency => {
            const dependencyKey = dependency.id || `${dependency.taskName}:${dependency.dependsOnTaskName}`
            const isSelected = dependencyKey === selectedDependencyKey

            return (
              <li key={dependencyKey}>
                <button
                  type="button"
                  className={`operations-dependency-list-item${isSelected ? ' active' : ''}${dependency.status === 'ACTIVE' ? ' active-gate' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDependencyId(dependencyKey)}
                  data-testid="react-operations-dependency-list-item"
                >
                  <span className={`operations-dependency-status-pill ${String(dependency.status).toLowerCase()}`}>{dependency.status}</span>
                  <strong>{dependency.taskName}</strong>
                  <span>Depends on {dependency.dependsOnTaskName}</span>
                  {dependency.notes && <small>{dependency.notes}</small>}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {selectedDependency && (
        <article className="operations-dependency-detail-panel" aria-label={`Dependency details for ${selectedDependency.taskName}`} data-testid="react-operations-dependency-detail-panel">
          <div className="operations-dependency-detail-header">
            <div>
              <p className="eyebrow ce-kicker">Dependency Details</p>
              <h5>{selectedDependency.taskName}</h5>
            </div>
            <span className={`operations-dependency-status-pill ${String(selectedDependency.status).toLowerCase()}`}>{selectedDependency.status}</span>
          </div>

          <dl className="operations-dependency-detail-list" data-testid="react-operations-dependency-detail-list">
            <div>
              <dt>Blocked task</dt>
              <dd>{selectedDependency.taskName}</dd>
            </div>
            <div>
              <dt>Required first</dt>
              <dd>{selectedDependency.dependsOnTaskName}</dd>
            </div>
            <div>
              <dt>Gate type</dt>
              <dd>{selectedDependency.dependencyType || 'BLOCKS'}</dd>
            </div>
            <div>
              <dt>Gate status</dt>
              <dd>{selectedDependency.status}</dd>
            </div>
          </dl>

          {selectedDependency.notes && (
            <div className="operations-dependency-note" data-testid="react-operations-dependency-note">
              <strong>Operational note</strong>
              <p>{selectedDependency.notes}</p>
            </div>
          )}
        </article>
      )}
    </div>
  )}
</section>
  )
}
