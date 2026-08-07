import { COMMAND_READINESS_OPTIONS } from './operationalDashboardUtils.js'

export default function OperationalCommandOverviewPanel({
  creatingTaskId = '',
  getOperationCommandDraft,
  getTaskCreateDraft,
  onCreateTask,
  onUpdateOperationCommand,
  roleView,
  saveOperationCommand,
  saveTaskCreate,
  selectedOperation,
  updateOperationCommandDraft,
  updateTaskCreateDraft,
  updatingOperationId = ''
}) {
  if (!selectedOperation) return null

  const item = selectedOperation

  return (
    <section className="operational-readiness-list operational-command-compatibility-panel" aria-label="Selected turnaround command workspace">
      <article className="operational-readiness-card ce-command-card" data-testid="react-operational-command-overview-card">
        <div>
          <p className="eyebrow ce-kicker">{item.status}</p>
          <h4>{item.title}</h4>
          <p>{item.shipName} · {item.route}</p>
          {item.notes && <p>{item.notes}</p>}
        </div>
        <dl className="role-booking-fields compact-fields">
          <div><dt>Sailing date</dt><dd>{item.sailingDate}</dd></div>
          <div><dt>Turnaround port</dt><dd>{item.port || item.arrivalPort}</dd></div>
          <div><dt>Passenger load</dt><dd>{item.passengerCount} passenger{item.passengerCount === 1 ? '' : 's'}</dd></div>
          <div><dt>Readiness level</dt><dd>{item.readinessLevel}</dd></div>
          <div><dt>Command status</dt><dd>{item.commandStatus || item.status}</dd></div>
          <div><dt>Command readiness</dt><dd>{item.commandReadinessLevel || item.readinessLevel}</dd></div>
        </dl>

        {onUpdateOperationCommand && roleView === 'turnaround-manager' && (
          <form className="operational-command-form ce-editor-card ce-surface-light operational-light-editor" onSubmit={event => { event.preventDefault(); saveOperationCommand(item) }} data-testid="react-operational-command-form">
            <label><span>Command status</span><select value={getOperationCommandDraft(item).status} onChange={event => updateOperationCommandDraft(item, 'status', event.target.value)} aria-label={`${item.title} command status`}><option value="PLANNED">Planned</option><option value="IN_PROGRESS">In progress</option><option value="READY">Ready</option><option value="BLOCKED">Blocked</option><option value="COMPLETE">Complete</option></select></label>
            <label><span>Command readiness</span><select value={getOperationCommandDraft(item).readinessLevel} onChange={event => updateOperationCommandDraft(item, 'readinessLevel', event.target.value)} aria-label={`${item.title} command readiness`}>{COMMAND_READINESS_OPTIONS.map(option => <option value={option} key={option}>{option}</option>)}</select></label>
            <label><span>Turnaround port</span><input value={getOperationCommandDraft(item).port} onChange={event => updateOperationCommandDraft(item, 'port', event.target.value)} aria-label={`${item.title} turnaround port`} /></label>
            <label className="full-width-field"><span>Command notes</span><textarea value={getOperationCommandDraft(item).notes} onChange={event => updateOperationCommandDraft(item, 'notes', event.target.value)} aria-label={`${item.title} command notes`} rows="3" /></label>
            <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingOperationId === item.id || !getOperationCommandDraft(item).readinessLevel.trim() || !getOperationCommandDraft(item).port.trim()}>Save command plan</button>
          </form>
        )}

        {onCreateTask && (
          <form className="operational-task-create-form ce-editor-card ce-surface-light operational-light-editor" onSubmit={event => { event.preventDefault(); saveTaskCreate(item) }} data-testid="react-operational-task-create-form">
            <label><span>New task department</span><select value={getTaskCreateDraft(item).departmentRole} onChange={event => updateTaskCreateDraft(item, 'departmentRole', event.target.value)} aria-label={`${item.title} new task department`}><option value="turnaround-manager">Turnaround Manager</option><option value="housekeeping-lead">Housekeeping Lead</option><option value="guest-services-lead">Guest Services Lead</option><option value="food-beverage-lead">Food &amp; Beverage Lead</option><option value="engineering-lead">Engineering Lead</option><option value="security-lead">Security Lead</option><option value="port-operations-lead">Port Operations Lead</option></select></label>
            <label className="full-width-field"><span>New task name</span><input value={getTaskCreateDraft(item).taskName} onChange={event => updateTaskCreateDraft(item, 'taskName', event.target.value)} aria-label={`${item.title} new task name`} /></label>
            <label><span>Owner</span><input value={getTaskCreateDraft(item).ownerName} onChange={event => updateTaskCreateDraft(item, 'ownerName', event.target.value)} aria-label={`${item.title} new task owner`} /></label>
            <label><span>Due time</span><input value={getTaskCreateDraft(item).dueTime} onChange={event => updateTaskCreateDraft(item, 'dueTime', event.target.value)} aria-label={`${item.title} new task due time`} /></label>
            <label><span>Location</span><input value={getTaskCreateDraft(item).location} onChange={event => updateTaskCreateDraft(item, 'location', event.target.value)} aria-label={`${item.title} new task location`} /></label>
            <label className="full-width-field"><span>Blocker reason</span><input value={getTaskCreateDraft(item).blockerReason} onChange={event => updateTaskCreateDraft(item, 'blockerReason', event.target.value)} aria-label={`${item.title} new task blocker reason`} /></label>
            <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingTaskId === item.id || !getTaskCreateDraft(item).taskName.trim()}>Add turnaround task</button>
          </form>
        )}

        {item.tasks.length > 0 && <ul className="operational-checklist" data-testid="react-operational-role-checklist-summary">{item.tasks.map(task => <li key={task.id || `${item.id}-${task.taskName}`}><div><strong>{task.status}</strong> — {task.taskName}</div>{task.ownerName && <p>{task.ownerDisplayName || task.ownerName}</p>}{task.blockerReason && <p>Blocked: {task.blockerReason}</p>}</li>)}</ul>}
      </article>
    </section>
  )
}
