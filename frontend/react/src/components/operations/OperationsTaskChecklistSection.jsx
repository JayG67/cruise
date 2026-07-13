import { getOperationalAuthorDisplay } from './operationalDashboardUtils.js'

export function OperationsTaskChecklistSection({
  creatingTaskId,
  creatingTaskUpdateId,
  deletingTaskId,
  getTaskCreateDraft,
  getTaskDetailDraft,
  getTaskUpdateDraft,
  item,
  onCreateTask,
  onCreateTaskUpdate,
  onDeleteTask,
  onUpdateTaskDetails,
  onUpdateTaskStatus,
  removeTask,
  saveTaskCreate,
  saveTaskDetails,
  saveTaskUpdate,
  updateStatus,
  updateTaskCreateDraft,
  updateTaskDetailDraft,
  updateTaskUpdateDraft,
  updatingTaskDetailsId,
  updatingTaskId,
}) {
  return (
    <>
      {onCreateTask && (
        <form className="operational-task-create-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveTaskCreate(item) }} data-testid="react-operational-task-create-form">
          <label>
            <span>New task department</span>
            <select value={getTaskCreateDraft(item).departmentRole} onChange={event => updateTaskCreateDraft(item, 'departmentRole', event.target.value)} aria-label={`${item.title} new task department`}>
              <option value="turnaround-manager">Turnaround Manager</option>
              <option value="housekeeping-lead">Housekeeping Lead</option>
              <option value="guest-services-lead">Guest Services Lead</option>
              <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
              <option value="engineering-lead">Engineering Lead</option>
              <option value="security-lead">Security Lead</option>
              <option value="port-operations-lead">Port Operations Lead</option>
            </select>
          </label>
          <label className="full-width-field">
            <span>New task name</span>
            <input value={getTaskCreateDraft(item).taskName} onChange={event => updateTaskCreateDraft(item, 'taskName', event.target.value)} aria-label={`${item.title} new task name`} />
          </label>
          <label>
            <span>Owner</span>
            <input value={getTaskCreateDraft(item).ownerName} onChange={event => updateTaskCreateDraft(item, 'ownerName', event.target.value)} aria-label={`${item.title} new task owner`} />
          </label>
          <label>
            <span>Due time</span>
            <input value={getTaskCreateDraft(item).dueTime} onChange={event => updateTaskCreateDraft(item, 'dueTime', event.target.value)} aria-label={`${item.title} new task due time`} />
          </label>
          <label>
            <span>Location</span>
            <input value={getTaskCreateDraft(item).location} onChange={event => updateTaskCreateDraft(item, 'location', event.target.value)} aria-label={`${item.title} new task location`} />
          </label>
          <label className="full-width-field">
            <span>Blocker reason</span>
            <input value={getTaskCreateDraft(item).blockerReason} onChange={event => updateTaskCreateDraft(item, 'blockerReason', event.target.value)} aria-label={`${item.title} new task blocker reason`} />
          </label>
          <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingTaskId === item.id || !getTaskCreateDraft(item).taskName.trim()}>Add turnaround task</button>
        </form>
      )}

      {item.tasks.length > 0 && (
        <ul className="operational-checklist" data-testid="react-operational-role-checklist">
          {item.tasks.map(task => {
            const isUpdating = updatingTaskId === task.id

            return (
              <li key={task.id || `${item.id}-${task.taskName}`}>
                <div>
                  <strong>{task.status}</strong> — {task.taskName}
                </div>
                <dl className="operational-task-detail-list" data-testid="react-operational-task-details">
                  <div>
                    <dt>Owner</dt>
                    <dd>{task.ownerDisplayName || task.ownerName || 'Unassigned'}</dd>
                  </div>
                  <div>
                    <dt>Due</dt>
                    <dd>{task.dueTime || 'Timing pending'}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{task.location || 'Location pending'}</dd>
                  </div>
                </dl>
                {task.blockerReason && <p className="operational-blocker-note" data-testid="react-operational-blocker-note">Blocked: {task.blockerReason}</p>}
                {task.updates?.length > 0 && (
                  <div className="operational-task-updates" data-testid="react-operational-task-updates">
                    <strong>Shift updates</strong>
                    <ul>
                      {task.updates.slice(0, 3).map(update => (
                        <li key={update.id}>
                          <span>{getOperationalAuthorDisplay(update)}</span>
                          <span>{update.updateType || 'NOTE'}</span>
                          <span>{update.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {onCreateTaskUpdate && task.id && (
                  <form className="operational-task-update-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveTaskUpdate(task) }} data-testid="react-operational-task-update-form">
                    <label className="full-width-field">
                      <span>Shift update</span>
                      <input value={getTaskUpdateDraft(task)} onChange={event => updateTaskUpdateDraft(task, event.target.value)} aria-label={`${task.taskName} shift update`} />
                    </label>
                    <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingTaskUpdateId === task.id || !getTaskUpdateDraft(task).trim()}>Add shift update</button>
                  </form>
                )}
                {onUpdateTaskDetails && task.id && (
                  <form className="operational-task-detail-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveTaskDetails(task) }} data-testid="react-operational-task-detail-form">
                    <label>
                      <span>Owner</span>
                      <input value={getTaskDetailDraft(task).ownerName} onChange={event => updateTaskDetailDraft(task, 'ownerName', event.target.value)} aria-label={`${task.taskName} owner`} />
                    </label>
                    <label>
                      <span>Due time</span>
                      <input value={getTaskDetailDraft(task).dueTime} onChange={event => updateTaskDetailDraft(task, 'dueTime', event.target.value)} aria-label={`${task.taskName} due time`} />
                    </label>
                    <label>
                      <span>Location</span>
                      <input value={getTaskDetailDraft(task).location} onChange={event => updateTaskDetailDraft(task, 'location', event.target.value)} aria-label={`${task.taskName} location`} />
                    </label>
                    <label className="full-width-field">
                      <span>Blocker reason</span>
                      <input value={getTaskDetailDraft(task).blockerReason} onChange={event => updateTaskDetailDraft(task, 'blockerReason', event.target.value)} aria-label={`${task.taskName} blocker reason`} />
                    </label>
                    <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingTaskDetailsId === task.id}>Save task details</button>
                  </form>
                )}
                {onUpdateTaskStatus && task.id && (
                  <div className="operational-task-actions" aria-label={`Update ${task.taskName} status`}>
                    <button type="button" className="secondary-action-button compact-button ce-button-secondary" disabled={isUpdating || task.status === 'IN_PROGRESS'} onClick={() => updateStatus(task, 'IN_PROGRESS')}>Start</button>
                    <button type="button" className="secondary-action-button compact-button ce-button-secondary" disabled={isUpdating || task.status === 'BLOCKED'} onClick={() => updateStatus(task, 'BLOCKED')}>Block</button>
                    <button type="button" className="secondary-action-button compact-button ce-button-secondary" disabled={isUpdating || task.status === 'COMPLETE'} onClick={() => updateStatus(task, 'COMPLETE')}>Complete</button>
                  </div>
                )}
                {onDeleteTask && task.id && (
                  <button type="button" className="danger-outline-button compact-button ce-button-danger" disabled={deletingTaskId === task.id} onClick={() => removeTask(task)} data-testid="react-operational-task-remove-button">
                    {deletingTaskId === task.id ? 'Removing task...' : 'Remove task'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
