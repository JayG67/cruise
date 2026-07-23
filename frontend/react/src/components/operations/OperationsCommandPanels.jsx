import {
  getDirectoryHealthStatus,
  normalizeOperationalRoleName
} from './operationalDashboardUtils.js'

export function OperationsWorkspaceCommandPanels({
  activeOperationsWorkspace,
  activeOperationsWorkspaceDetails,
  focusOperationsWorkspace,
  operationsWorkspaceTabs,
  operationalDirectory,
  roleOperationsBrief,
  roleView,
  selectedDirectoryEntry,
  selectedOperation,
  setSelectedDirectoryRole
}) {
  const selectedDirectoryHealth = selectedDirectoryEntry
    ? getDirectoryHealthStatus(selectedDirectoryEntry)
    : { label: 'Pending', tone: 'pending' }

  return (
    <>
      <section className="operations-workspace-shell ce-command-panel" aria-labelledby="operations-workspace-heading" data-testid="react-operations-workspace-shell">
        <div className="operations-workspace-heading">
          <p className="eyebrow ce-kicker">Operations workspace</p>
          <h4 id="operations-workspace-heading">Focus by operational workstream</h4>
          <p>Select a workstream to orient the command center around the job this role needs to complete.</p>
        </div>
        <nav className="operations-workspace-nav" aria-label="Turnaround operations workstreams" data-testid="react-operations-workspace-nav">
          {operationsWorkspaceTabs.map(tab => (
            <button
              type="button"
              key={tab.id}
              className={`operations-workspace-nav-button${activeOperationsWorkspace === tab.id ? ' active' : ''}`}
              aria-pressed={activeOperationsWorkspace === tab.id}
              onClick={() => focusOperationsWorkspace(tab.id)}
              data-testid={`react-operations-workspace-${tab.id}-button`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="operations-workspace-active-summary ce-surface-light" data-testid="react-operations-workspace-active-summary">
          <strong>{activeOperationsWorkspaceDetails.label}</strong>
          <span>{activeOperationsWorkspaceDetails.summary}</span>
        </div>
      </section>

      {selectedOperation && (
        <section className="operations-role-brief-panel ce-command-panel" aria-labelledby="operations-role-brief-heading" data-testid="react-operations-role-brief-panel">
          <div className="operations-role-brief-heading">
            <div>
              <p className="eyebrow ce-kicker">Role command brief</p>
              <h4 id="operations-role-brief-heading">{roleOperationsBrief.roleLabel} priorities for {selectedOperation.title}</h4>
              <p>Use this department brief to move directly into the highest-value work for the selected turnaround.</p>
            </div>
            <span className={`operations-role-brief-alert${roleOperationsBrief.attentionCount > 0 ? ' needs-attention' : ''}`} data-testid="react-operations-role-brief-attention">
              {roleOperationsBrief.attentionCount > 0 ? `${roleOperationsBrief.attentionCount} needs attention` : 'No immediate blockers'}
            </span>
          </div>
          <div className="operations-role-brief-grid" data-testid="react-operations-role-brief-grid">
            {roleOperationsBrief.actionCards.map(card => (
              <button
                type="button"
                key={card.id}
                className={`operations-role-brief-card ce-command-card ${card.priority}`}
                onClick={() => focusOperationsWorkspace(card.id)}
                data-testid="react-operations-role-brief-card"
              >
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <em>{card.status}</em>
                <small>{card.description}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {operationalDirectory.length > 0 && selectedDirectoryEntry && (
        <section className="operations-directory-panel ce-command-panel" aria-labelledby="operations-directory-heading" data-testid="react-operations-directory-panel">
          <div className="operations-directory-heading">
            <div>
              <p className="eyebrow ce-kicker">Operations directory</p>
              <h4 id="operations-directory-heading">Department command directory</h4>
              <p>Select a department to review contacts, coverage, blockers, and coordination details without scanning every department card at once.</p>
            </div>
            <span className="operations-directory-count" data-testid="react-operations-directory-count">{operationalDirectory.length} departments</span>
          </div>
          <div className="operations-directory-layout">
            <div className="operations-directory-list" aria-label="Operational department directory">
              {operationalDirectory.map(entry => {
                const health = getDirectoryHealthStatus(entry)
                return (
                  <button
                    type="button"
                    className={`operations-directory-card ce-command-card${entry.role === selectedDirectoryEntry.role ? ' active' : ''}${entry.role === normalizeOperationalRoleName(roleView) ? ' current-role' : ''}`}
                    key={entry.role}
                    aria-pressed={entry.role === selectedDirectoryEntry.role}
                    onClick={() => setSelectedDirectoryRole(entry.role)}
                    data-testid="react-operations-directory-card"
                  >
                    <span className="operations-directory-card-title">
                      <span>
                        <span className="eyebrow ce-kicker">{entry.role === normalizeOperationalRoleName(roleView) ? 'Current role' : 'Partner role'}</span>
                        <strong>{entry.label}</strong>
                      </span>
                      <em className={`operations-directory-health ${health.tone}`}>{health.label}</em>
                    </span>
                    <span className="operations-directory-card-summary">
                      <strong>{entry.staffingPercent}%</strong> staffed · {entry.taskCount} tasks · {entry.activeEscalations} escalations
                    </span>
                  </button>
                )
              })}
            </div>
            <article className="operations-directory-detail ce-command-card" aria-label={`${selectedDirectoryEntry.label} department details`} data-testid="react-operations-directory-detail">
              <div className="operations-directory-detail-header">
                <div>
                  <p className="eyebrow ce-kicker">Department detail</p>
                  <h5>{selectedDirectoryEntry.label}</h5>
                </div>
                <span className={`operations-directory-health ${selectedDirectoryHealth.tone}`}>{selectedDirectoryHealth.label}</span>
              </div>
              <dl className="operations-directory-metrics">
                <div className="operations-directory-metric ce-surface-light">
                  <dt>Staffed</dt>
                  <dd>{selectedDirectoryEntry.staffingPercent}%</dd>
                </div>
                <div className="operations-directory-metric ce-surface-light">
                  <dt>Tasks</dt>
                  <dd>{selectedDirectoryEntry.taskCount}</dd>
                </div>
                <div className="operations-directory-metric ce-surface-light">
                  <dt>Blocked</dt>
                  <dd>{selectedDirectoryEntry.blockedTasks + selectedDirectoryEntry.blockedHandoffs}</dd>
                </div>
                <div className="operations-directory-metric ce-surface-light">
                  <dt>Handoffs</dt>
                  <dd>{selectedDirectoryEntry.handoffCount}</dd>
                </div>
                <div className="operations-directory-metric ce-surface-light">
                  <dt>Escalations</dt>
                  <dd>{selectedDirectoryEntry.activeEscalations}</dd>
                </div>
              </dl>
              <div className="operations-directory-detail-grid">
                <div className="operations-directory-contact ce-surface-light">
                  <strong>Contacts</strong>
                  <p>{selectedDirectoryEntry.leadNames.length ? selectedDirectoryEntry.leadNames.join(', ') : 'Lead assignment pending'}</p>
                </div>
                <div className="operations-directory-contact ce-surface-light">
                  <strong>Muster / coordination</strong>
                  <p>{selectedDirectoryEntry.musterLocations.length ? selectedDirectoryEntry.musterLocations.join(', ') : 'Location pending'}</p>
                </div>
              </div>
            </article>
          </div>
        </section>
      )}
    </>
  )
}
