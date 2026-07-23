import {
  getOperationalAuthorDisplay,
  getOperationalOwnerDisplay
} from './operationalDashboardUtils.js'

export function OperationsTaskWorkspace(props) {
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
<section className="operations-task-workspace" aria-labelledby="operations-task-workspace-heading" data-testid="react-operations-task-workspace">
  <div className="operations-task-workspace-header">
    <div>
      <p className="eyebrow ce-kicker">Task Management</p>
      <h4 id="operations-task-workspace-heading">Task list for {selectedOperation.title}</h4>
      <p>Review the role checklist as a clean queue. Pick one task to update owner, timing, location, blocker notes, status, and shift updates without exposing every operational workflow at once.</p>
    </div>
    <dl className="operations-task-workspace-metrics" aria-label="Selected turnaround task summary" data-testid="react-operations-task-workspace-summary">
      <div>
        <dt>Total</dt>
        <dd>{taskWorkspaceSummary.totalTasks || selectedOperationTasks.length}</dd>
      </div>
      <div>
        <dt>Complete</dt>
        <dd>{taskWorkspaceSummary.completeTasks || 0}</dd>
      </div>
      <div>
        <dt>Blocked</dt>
        <dd>{taskWorkspaceSummary.blockedTasks || 0}</dd>
      </div>
      <div>
        <dt>Ready</dt>
        <dd>{taskWorkspaceSummary.completionPercent || 0}%</dd>
      </div>
    </dl>
  </div>

  {onCreateTask && (
    <form className="operations-task-quick-add operational-task-create-form ce-editor-card ce-surface-light operational-light-editor" onSubmit={event => { event.preventDefault(); saveTaskCreate(selectedOperation) }} data-testid="react-operational-task-create-form">
      <div>
        <p className="eyebrow ce-kicker">Add task</p>
        <h5>New turnaround task</h5>
      </div>
      <label>
        <span>Department</span>
        <select value={getTaskCreateDraft(selectedOperation).departmentRole} onChange={event => updateTaskCreateDraft(selectedOperation, 'departmentRole', event.target.value)} aria-label={`${selectedOperation.title} new task department`}>
          <option value="turnaround-manager">Turnaround Manager</option>
          <option value="housekeeping-lead">Housekeeping Lead</option>
          <option value="guest-services-lead">Guest Services Lead</option>
          <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
          <option value="engineering-lead">Engineering Lead</option>
          <option value="security-lead">Security Lead</option>
          <option value="port-operations-lead">Port Operations Lead</option>
        </select>
      </label>
      <label className="operations-task-quick-add-name">
        <span>Task name</span>
        <input value={getTaskCreateDraft(selectedOperation).taskName} onChange={event => updateTaskCreateDraft(selectedOperation, 'taskName', event.target.value)} aria-label={`${selectedOperation.title} new task name`} />
      </label>
      <label>
        <span>Owner</span>
        <input value={getTaskCreateDraft(selectedOperation).ownerName} onChange={event => updateTaskCreateDraft(selectedOperation, 'ownerName', event.target.value)} aria-label={`${selectedOperation.title} new task owner`} />
      </label>
      <label>
        <span>Due time</span>
        <input value={getTaskCreateDraft(selectedOperation).dueTime} onChange={event => updateTaskCreateDraft(selectedOperation, 'dueTime', event.target.value)} aria-label={`${selectedOperation.title} new task due time`} />
      </label>
      <label>
        <span>Location</span>
        <input value={getTaskCreateDraft(selectedOperation).location} onChange={event => updateTaskCreateDraft(selectedOperation, 'location', event.target.value)} aria-label={`${selectedOperation.title} new task location`} />
      </label>
      <label className="full-width-field">
        <span>Blocker reason</span>
        <input value={getTaskCreateDraft(selectedOperation).blockerReason} onChange={event => updateTaskCreateDraft(selectedOperation, 'blockerReason', event.target.value)} aria-label={`${selectedOperation.title} new task blocker reason`} />
      </label>
      <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingTaskId === selectedOperation.id || !getTaskCreateDraft(selectedOperation).taskName.trim()}>Add turnaround task</button>
    </form>
  )}

  {selectedOperationTasks.length === 0 ? (
    <p className="status-card compact ce-command-card" data-testid="react-operations-task-empty-state">No tasks are assigned to this selected turnaround yet.</p>
  ) : (
    <div className="operations-task-layout">
      <div className="operations-task-list-panel" aria-label="Turnaround task queue">
        <div className="operations-task-list-heading">
          <h5>Task queue</h5>
          <span>{selectedOperationTasks.length} task{selectedOperationTasks.length === 1 ? '' : 's'}</span>
        </div>
        <ul className="operations-task-list" data-testid="react-operations-task-list">
          {selectedOperationTasks.map(task => {
            const taskKey = task.id || task.taskName
            const isSelected = taskKey === selectedTaskKey

            return (
              <li key={taskKey}>
                <button
                  type="button"
                  className={`operations-task-list-item${isSelected ? ' active' : ''}${task.status === 'BLOCKED' ? ' blocked' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedTaskId(taskKey)}
                  data-testid="react-operations-task-list-item"
                >
                  <span className="operations-task-status-pill">{task.status}</span>
                  <strong>{task.taskName}</strong>
                  <span>{task.ownerDisplayName || task.ownerName || 'Unassigned'} · {task.dueTime || 'Timing pending'}</span>
                  {task.blockerReason && <small>Blocked: {task.blockerReason}</small>}
                </button>
                {isSelected && (
                  <article className="operations-task-detail-panel inline-task-detail-panel" aria-label={`Task details for ${task.taskName}`} data-testid="react-operations-task-detail-panel">
                    <div className="operations-task-detail-header"><p className="eyebrow ce-kicker">Selected task</p><h5>{task.taskName}</h5><span className="operations-task-status-pill">{task.status}</span></div>
                    <dl className="operational-task-detail-list" data-testid="react-operational-task-details">
                      <div><dt>Owner</dt><dd>{task.ownerDisplayName || task.ownerName || 'Unassigned'}</dd></div>
                      <div><dt>Due</dt><dd>{task.dueTime || 'Timing pending'}</dd></div>
                      <div><dt>Location</dt><dd>{task.location || 'Location pending'}</dd></div>
                    </dl>
                    {task.blockerReason && <p className="operational-blocker-note" data-testid="react-operational-blocker-note">Blocked: {task.blockerReason}</p>}
                    {task.updates?.length > 0 && (
                      <div className="operational-task-updates" data-testid="react-operational-task-updates">
                        <strong>Shift updates</strong>
                        <ul>{task.updates.slice(0, 3).map(update => <li key={update.id}><span>{getOperationalAuthorDisplay(update)}</span><span>{update.message}</span></li>)}</ul>
                      </div>
                    )}
                    {onCreateTaskUpdate && task.id && (
                      <form className="operational-task-update-form ce-editor-card ce-surface-light operational-light-editor" onSubmit={event => { event.preventDefault(); saveTaskUpdate(task) }} data-testid="react-operational-task-update-form">
                        <label className="full-width-field"><span>Shift update</span><input value={getTaskUpdateDraft(task)} onChange={event => updateTaskUpdateDraft(task, event.target.value)} aria-label={`${task.taskName} shift update`} /></label>
                        <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingTaskUpdateId === task.id || !getTaskUpdateDraft(task).trim()}>Add shift update</button>
                      </form>
                    )}
                    {onUpdateTaskDetails && task.id && (
                      <form className="operational-task-detail-form operations-task-detail-edit-form ce-editor-card ce-surface-light operational-light-editor" onSubmit={event => { event.preventDefault(); saveTaskDetails(task) }} data-testid="react-operational-task-detail-form">
                        <label><span>Owner</span><input value={getTaskDetailDraft(task).ownerName} onChange={event => updateTaskDetailDraft(task, 'ownerName', event.target.value)} aria-label={`${task.taskName} owner`} /></label>
                        <label><span>Due time</span><input value={getTaskDetailDraft(task).dueTime} onChange={event => updateTaskDetailDraft(task, 'dueTime', event.target.value)} aria-label={`${task.taskName} due time`} /></label>
                        <label><span>Location</span><input value={getTaskDetailDraft(task).location} onChange={event => updateTaskDetailDraft(task, 'location', event.target.value)} aria-label={`${task.taskName} location`} /></label>
                        <label className="full-width-field"><span>Blocker reason</span><textarea value={getTaskDetailDraft(task).blockerReason} onChange={event => updateTaskDetailDraft(task, 'blockerReason', event.target.value)} aria-label={`${task.taskName} blocker reason`} rows="4" /></label>
                        <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingTaskDetailsId === task.id}>Save task details</button>
                      </form>
                    )}
                    {onUpdateTaskStatus && task.id && <div className="operational-task-actions" aria-label={`Update ${task.taskName} status`}><button type="button" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingTaskId === task.id || task.status === 'IN_PROGRESS'} onClick={() => updateStatus(task, 'IN_PROGRESS')}>Start</button><button type="button" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingTaskId === task.id || task.status === 'BLOCKED'} onClick={() => updateStatus(task, 'BLOCKED')}>Block</button><button type="button" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingTaskId === task.id || task.status === 'COMPLETE'} onClick={() => updateStatus(task, 'COMPLETE')}>Complete</button></div>}
                    {onDeleteTask && task.id && <button type="button" className="operational-task-remove-action" disabled={deletingTaskId === task.id} onClick={() => removeTask(task)} data-testid="react-operational-task-remove-button">{deletingTaskId === task.id ? 'Removing task...' : 'Remove task'}</button>}
                  </article>
                )}
              </li>
            )
          })}
        </ul>
      </div>

    </div>
  )}
</section>
  )
}
