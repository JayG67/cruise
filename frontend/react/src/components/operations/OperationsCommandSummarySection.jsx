import { COMMAND_READINESS_OPTIONS } from './operationalDashboardUtils.js'

export function OperationsCommandSummarySection({
  getOperationCommandDraft,
  item,
  onUpdateOperationCommand,
  roleView,
  saveOperationCommand,
  updateOperationCommandDraft,
  updatingOperationId,
}) {
  return (
    <>
      <div>
        <p className="eyebrow ce-kicker">{item.status}</p>
        <h4>{item.title}</h4>
        <p>{item.shipName} · {item.route}</p>
        {item.notes && <p>{item.notes}</p>}
      </div>
      <dl className="role-booking-fields compact-fields">
        <div>
          <dt>Sailing date</dt>
          <dd>{item.sailingDate}</dd>
        </div>
        <div>
          <dt>Turnaround port</dt>
          <dd>{item.port || item.arrivalPort}</dd>
        </div>
        <div>
          <dt>Passenger load</dt>
          <dd>{item.passengerCount} passenger{item.passengerCount === 1 ? '' : 's'}</dd>
        </div>
        <div>
          <dt>Readiness level</dt>
          <dd>{item.readinessLevel}</dd>
        </div>
        <div>
          <dt>Command status</dt>
          <dd>{item.commandStatus || item.status}</dd>
        </div>
        <div>
          <dt>Command readiness</dt>
          <dd>{item.commandReadinessLevel || item.readinessLevel}</dd>
        </div>
      </dl>

      {onUpdateOperationCommand && roleView === 'turnaround-manager' && (
        <form className="operational-command-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveOperationCommand(item) }} data-testid="react-operational-command-form">
          <label>
            <span>Command status</span>
            <select value={getOperationCommandDraft(item).status} onChange={event => updateOperationCommandDraft(item, 'status', event.target.value)} aria-label={`${item.title} command status`}>
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="READY">Ready</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETE">Complete</option>
            </select>
          </label>
          <label>
            <span>Command readiness</span>
            <select value={getOperationCommandDraft(item).readinessLevel} onChange={event => updateOperationCommandDraft(item, 'readinessLevel', event.target.value)} aria-label={`${item.title} command readiness`}>
              {COMMAND_READINESS_OPTIONS.map(option => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Turnaround port</span>
            <input value={getOperationCommandDraft(item).port} onChange={event => updateOperationCommandDraft(item, 'port', event.target.value)} aria-label={`${item.title} turnaround port`} />
          </label>
          <label className="full-width-field">
            <span>Command notes</span>
            <textarea value={getOperationCommandDraft(item).notes} onChange={event => updateOperationCommandDraft(item, 'notes', event.target.value)} aria-label={`${item.title} command notes`} rows="3" />
          </label>
          <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingOperationId === item.id || !getOperationCommandDraft(item).readinessLevel.trim() || !getOperationCommandDraft(item).port.trim()}>Save command plan</button>
        </form>
      )}

      {item.taskSummary && (
        <div className="operational-progress-summary" data-testid="react-operational-progress-summary">
          <span>{item.taskSummary.completeTasks} of {item.taskSummary.totalTasks} tasks complete</span>
          <span>{item.taskSummary.completionPercent}% task ready</span>
          {item.signoffSummary && <span>{item.signoffSummary.approvedSignoffs} of {item.signoffSummary.totalSignoffs} signoffs approved</span>}
          {item.taskSummary.blockedTasks > 0 && <span>{item.taskSummary.blockedTasks} blocked</span>}
        </div>
      )}

      {item.escalationSummary && (
        <div className="operational-escalation-summary" data-testid="react-operational-escalation-summary">
          <strong>Escalation watch</strong>
          <span>{item.escalationSummary.openEscalations} open</span>
          <span>{item.escalationSummary.monitoringEscalations} monitoring</span>
          <span>{item.escalationSummary.criticalEscalations} critical</span>
        </div>
      )}
    </>
  )
}
