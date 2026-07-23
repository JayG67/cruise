import { getOperationalOwnerDisplay } from './operationalDashboardUtils.js'

export function OperationsDependencyHandoffSection({
  getHandoffDraft,
  item,
  onUpdateHandoff,
  saveHandoffUpdate,
  updateHandoffDraft,
  updatingHandoffId,
}) {
  return (
    <>
      {item.dependencySummary && (
        <div className="operational-dependency-summary" data-testid="react-operational-dependency-summary">
          <strong>Dependency gates</strong>
          <span>{item.dependencySummary.clearedDependencies} of {item.dependencySummary.totalDependencies} clear</span>
          {item.dependencySummary.activeDependencies > 0 && <span>{item.dependencySummary.activeDependencies} active</span>}
        </div>
      )}

      {item.taskDependencies?.length > 0 && (
        <div className="operational-dependency-list" data-testid="react-operational-dependency-list">
          <strong>Task dependencies</strong>
          <ul>
            {item.taskDependencies.map(dependency => (
              <li key={dependency.id}>
                <span>{dependency.taskName}</span>
                <span>depends on {dependency.dependsOnTaskName}</span>
                <span>{dependency.status}</span>
                {dependency.notes && <span>{dependency.notes}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.handoffSummary && (
        <div className="operational-handoff-summary" data-testid="react-operational-handoff-summary">
          <strong>Department handoffs</strong>
          <span>{item.handoffSummary.completedHandoffs} of {item.handoffSummary.totalHandoffs} complete</span>
          {item.handoffSummary.blockedHandoffs > 0 && <span>{item.handoffSummary.blockedHandoffs} blocked</span>}
        </div>
      )}

      {item.handoffs?.length > 0 && (
        <div className="operational-handoff-list" data-testid="react-operational-handoff-list">
          <strong>Handoff workflow</strong>
          <ul>
            {item.handoffs.map(handoff => (
              <li key={handoff.id}>
                <div><strong>{handoff.status}</strong> — {handoff.title}</div>
                <p>{handoff.fromDepartmentRole} → {handoff.toDepartmentRole} · {getOperationalOwnerDisplay(handoff)} · {handoff.dueTime || 'Due pending'}</p>
                {handoff.notes && <p>{handoff.notes}</p>}
                {onUpdateHandoff && (
                  <form className="operational-handoff-form ce-editor-card ce-surface-light operational-light-editor" onSubmit={event => { event.preventDefault(); saveHandoffUpdate(handoff) }} data-testid="react-operational-handoff-form">
                    <label>
                      <span>Status</span>
                      <select value={getHandoffDraft(handoff).status} onChange={event => updateHandoffDraft(handoff, 'status', event.target.value)} aria-label={`${handoff.title} handoff status`}>
                        <option value="PENDING">Pending</option>
                        <option value="READY">Ready</option>
                        <option value="IN_REVIEW">In review</option>
                        <option value="BLOCKED">Blocked</option>
                        <option value="COMPLETE">Complete</option>
                      </select>
                    </label>
                    <label>
                      <span>Owner</span>
                      <input value={getHandoffDraft(handoff).ownerName} onChange={event => updateHandoffDraft(handoff, 'ownerName', event.target.value)} aria-label={`${handoff.title} handoff owner`} />
                    </label>
                    <label>
                      <span>Due time</span>
                      <input value={getHandoffDraft(handoff).dueTime} onChange={event => updateHandoffDraft(handoff, 'dueTime', event.target.value)} aria-label={`${handoff.title} handoff due time`} />
                    </label>
                    <label className="full-width-field">
                      <span>Handoff notes</span>
                      <input value={getHandoffDraft(handoff).notes} onChange={event => updateHandoffDraft(handoff, 'notes', event.target.value)} aria-label={`${handoff.title} handoff notes`} />
                    </label>
                    <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingHandoffId === handoff.id || !getHandoffDraft(handoff).ownerName.trim()}>Save handoff</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
