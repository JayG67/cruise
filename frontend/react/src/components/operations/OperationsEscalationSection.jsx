import { getOperationalOwnerDisplay } from './operationalDashboardUtils.js'

export function OperationsEscalationSection({
  creatingEscalationId,
  getEscalationCreateDraft,
  getEscalationUpdateDraft,
  item,
  onCreateEscalation,
  onUpdateEscalation,
  saveEscalationCreate,
  saveEscalationUpdate,
  updateEscalationCreateDraft,
  updateEscalationDraft,
  updatingEscalationId,
}) {
  return (
    <>
      {onCreateEscalation && (
        <form className="operational-escalation-create-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveEscalationCreate(item) }} data-testid="react-operational-escalation-create-form">
          <label>
            <span>Escalation department</span>
            <select value={getEscalationCreateDraft(item).departmentRole} onChange={event => updateEscalationCreateDraft(item, 'departmentRole', event.target.value)} aria-label={`${item.title} escalation department`}>
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
            <select value={getEscalationCreateDraft(item).severity} onChange={event => updateEscalationCreateDraft(item, 'severity', event.target.value)} aria-label={`${item.title} escalation severity`}>
              <option value="WATCH">Watch</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </label>
          <label className="full-width-field">
            <span>Escalation title</span>
            <input value={getEscalationCreateDraft(item).title} onChange={event => updateEscalationCreateDraft(item, 'title', event.target.value)} aria-label={`${item.title} escalation title`} />
          </label>
          <label>
            <span>Owner</span>
            <input value={getEscalationCreateDraft(item).ownerName} onChange={event => updateEscalationCreateDraft(item, 'ownerName', event.target.value)} aria-label={`${item.title} escalation owner`} />
          </label>
          <label className="full-width-field">
            <span>Escalation notes</span>
            <input value={getEscalationCreateDraft(item).resolutionNotes} onChange={event => updateEscalationCreateDraft(item, 'resolutionNotes', event.target.value)} aria-label={`${item.title} escalation notes`} />
          </label>
          <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingEscalationId === item.id || !getEscalationCreateDraft(item).title.trim()}>Add escalation</button>
        </form>
      )}

      {item.escalations?.length > 0 && (
        <div className="operational-escalation-list" data-testid="react-operational-escalation-list">
          <strong>Active escalation log</strong>
          <ul>
            {item.escalations.map(escalation => (
              <li key={escalation.id}>
                <div><strong>{escalation.severity}</strong> — {escalation.title}</div>
                <p>{escalation.departmentRole} · {getOperationalOwnerDisplay(escalation)} · {escalation.status}</p>
                {escalation.resolutionNotes && <p>{escalation.resolutionNotes}</p>}
                {onUpdateEscalation && (
                  <form className="operational-escalation-update-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveEscalationUpdate(escalation) }} data-testid="react-operational-escalation-update-form">
                    <label>
                      <span>Status</span>
                      <select value={getEscalationUpdateDraft(escalation).status} onChange={event => updateEscalationDraft(escalation, 'status', event.target.value)} aria-label={`${escalation.title} escalation status`}>
                        <option value="OPEN">Open</option>
                        <option value="MONITORING">Monitoring</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </label>
                    <label>
                      <span>Severity</span>
                      <select value={getEscalationUpdateDraft(escalation).severity} onChange={event => updateEscalationDraft(escalation, 'severity', event.target.value)} aria-label={`${escalation.title} escalation update severity`}>
                        <option value="WATCH">Watch</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </label>
                    <label>
                      <span>Owner</span>
                      <input value={getEscalationUpdateDraft(escalation).ownerName} onChange={event => updateEscalationDraft(escalation, 'ownerName', event.target.value)} aria-label={`${escalation.title} escalation update owner`} />
                    </label>
                    <label className="full-width-field">
                      <span>Resolution notes</span>
                      <input value={getEscalationUpdateDraft(escalation).resolutionNotes} onChange={event => updateEscalationDraft(escalation, 'resolutionNotes', event.target.value)} aria-label={`${escalation.title} escalation resolution notes`} />
                    </label>
                    <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingEscalationId === escalation.id || !getEscalationUpdateDraft(escalation).title.trim()}>Save escalation</button>
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
