import { ROLE_OPTIONS, REQUIRED_TEAM_ROLES, VISIBLE_ROSTER_LIMIT, getBasePersonName, getRoleLabel, getSailingDate, normalizeRole } from '../domain/turnaroundAdminWorkspace.js'
import useTurnaroundAdminSetupState from './useTurnaroundAdminSetupState.js'
import TurnaroundSetupRefreshControl from './TurnaroundSetupRefreshControl.jsx'

export default function ReactTurnaroundAdminSetup({ selectedDemoUser, onSetupChanged }) {
  const {
    draft, error, filteredRosterGroups, handleAssignRosterPersonToSelectedTurnaround, handleRemovePerson,
    handleSubmit, isLoading, isSaving, loadSetup, message, refreshStatus, rosterRoleFilter, rosterSearch, selectedPort,
    selectedTurnaroundLabel, setRosterRoleFilter, setRosterSearch, setShowAllRoster, setup, showAllRoster,
    teamWorkspace, updateDraft, visibleRosterGroups
  } = useTurnaroundAdminSetupState({ selectedDemoUser, onSetupChanged })

  const shipsForSelectedCruiseLine = teamWorkspace.shipsForCruiseLine
  const sailingsForSelectedShip = teamWorkspace.sailingsForShip
  const peopleForSelectedCruiseLine = teamWorkspace.peopleForCruiseLine
  const selectedCruiseLine = teamWorkspace.selectedCruiseLine
  const selectedShip = teamWorkspace.selectedShip
  const selectedSailing = teamWorkspace.selectedSailing
  const sameDayConflicts = teamWorkspace.sameDayConflicts
  const conflictCount = sameDayConflicts.length
  const selectedSailingDate = getSailingDate(selectedSailing)
  const selectedDateConflicts = teamWorkspace.selectedDateConflicts
  const selectedShipTeam = teamWorkspace.selectedTeam
  const missingRoles = teamWorkspace.missingRoles
  const teamReadinessScore = teamWorkspace.readinessScore

  return (
    <section className="react-app-section turnaround-admin-setup-panel ce-command-panel" id="react-turnaround-admin-setup" aria-labelledby="react-turnaround-admin-setup-heading" data-testid="react-turnaround-admin-setup">
      <div className="section-heading-row ce-section-heading compact-turnaround-admin-heading">
        <div>
          <p className="eyebrow ce-kicker">Turnaround admin setup</p>
          <h2 id="react-turnaround-admin-setup-heading">Build the team for one ship turnaround</h2>
          <p>
            Pick a cruise line, ship, and sailing date first. The panel then shows the current team for that turnaround queue and lets you add or remove people in one place.
          </p>
        </div>
      </div>

      <TurnaroundSetupRefreshControl isLoading={isLoading} onReload={() => loadSetup({ announce: true })} status={refreshStatus} />

      <div className="turnaround-admin-model-card" data-testid="react-turnaround-admin-assignment-model">
        <strong>How to use this</strong>
        <p>
          Start with the ship and sailing date, review the assigned team, then add or remove role coverage. Each turnaround person belongs to exactly one cruise line, while ship queues keep the workflow focused on the actual turnaround being staffed.
        </p>
        <p className="turnaround-admin-conflict-summary" data-testid="react-turnaround-admin-conflict-summary">
          {conflictCount ? `${conflictCount} same-day staffing conflict${conflictCount === 1 ? '' : 's'} need review.` : 'No same-day multi-ship staffing conflicts detected.'}
        </p>
      </div>

      <div className="turnaround-team-workspace ce-command-panel" data-testid="react-turnaround-team-workspace">
        <article className="turnaround-workspace-card ce-command-card ce-surface-light active">
          <span className="turnaround-workspace-step-label">1. Cruise line</span>
          <strong className="turnaround-workspace-step-value">{selectedCruiseLine?.name || 'Select cruise line'}</strong>
          <p className="turnaround-workspace-step-detail">{peopleForSelectedCruiseLine.length} available turnaround person{peopleForSelectedCruiseLine.length === 1 ? '' : 's'}</p>
        </article>
        <article className={selectedShip ? 'turnaround-workspace-card ce-command-card ce-surface-light active' : 'turnaround-workspace-card ce-command-card ce-surface-light'}>
          <span className="turnaround-workspace-step-label">2. Ship</span>
          <strong className="turnaround-workspace-step-value">{selectedShip?.name || 'Choose ship queue'}</strong>
          <p className="turnaround-workspace-step-detail">{shipsForSelectedCruiseLine.length} ship queue{shipsForSelectedCruiseLine.length === 1 ? '' : 's'} available</p>
        </article>
        <article className={selectedSailing ? 'turnaround-workspace-card ce-command-card ce-surface-light active' : 'turnaround-workspace-card ce-command-card ce-surface-light'}>
          <span className="turnaround-workspace-step-label">3. Sailing</span>
          <strong className="turnaround-workspace-step-value">{selectedSailing?.departureDate || 'Choose sailing date'}</strong>
          <p className="turnaround-workspace-step-detail">{selectedPort}</p>
        </article>
        <article className={missingRoles.length === 0 && selectedShip ? 'turnaround-workspace-card ce-command-card ce-surface-light ready' : 'turnaround-workspace-card ce-command-card ce-surface-light'}>
          <span className="turnaround-workspace-step-label">4. Team readiness</span>
          <strong className="turnaround-workspace-step-value">{teamReadinessScore}% staffed</strong>
          <p className="turnaround-workspace-step-detail">{teamWorkspace.staffedRoleCount} of {teamWorkspace.requiredRoleCount} required roles assigned</p>
        </article>
      </div>

      <div className="turnaround-admin-grid improved-turnaround-admin-grid">
        <form className="turnaround-admin-form ce-editor-card compact-turnaround-admin-form" onSubmit={handleSubmit} data-testid="react-turnaround-admin-person-form">
          <h3>1. Choose the turnaround, then add a team member</h3>
          <div className="turnaround-admin-form-grid ce-field-grid">
            <label>
              <span>Person name</span>
              <input value={draft.displayName} onChange={event => updateDraft('displayName', event.target.value)} required maxLength={255} data-testid="react-turnaround-person-name-input" />
            </label>
            <label>
              <span>Operational role</span>
              <select value={draft.role} onChange={event => updateDraft('role', event.target.value)} data-testid="react-turnaround-person-role-select">
                {ROLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              <span>Cruise line</span>
              <select value={draft.cruiseLineId} onChange={event => updateDraft('cruiseLineId', event.target.value)} required data-testid="react-turnaround-person-cruise-line-select">
                {(setup.cruiseLines || []).map(line => <option key={line.id} value={line.id}>{line.name}</option>)}
              </select>
            </label>
            <label>
              <span>Ship</span>
              <select value={draft.assignedShipId} onChange={event => updateDraft('assignedShipId', event.target.value)} data-testid="react-turnaround-person-ship-select">
                <option value="">Select a ship first</option>
                {shipsForSelectedCruiseLine.map(ship => <option key={ship.id} value={ship.id}>{ship.name}</option>)}
              </select>
            </label>
            <label className="turnaround-admin-wide-field">
              <span>Sailing date / port</span>
              <select value={draft.sailingId} onChange={event => updateDraft('sailingId', event.target.value)} disabled={!draft.assignedShipId} data-testid="react-turnaround-person-sailing-select">
                <option value="">Select a sailing date</option>
                {sailingsForSelectedShip.map(sailing => <option key={sailing.id} value={sailing.id}>{getSailingDate(sailing) || 'Sailing date pending'} · {sailing.departurePort || sailing.port || 'Port pending'}</option>)}
              </select>
            </label>
          </div>

          <div className="turnaround-admin-draft-summary ce-surface-dark" data-testid="react-turnaround-admin-draft-summary">
            <span>Selected turnaround</span>
            <strong>{selectedCruiseLine?.name || 'No cruise line'} · {selectedPort}</strong>
            <p>{selectedShip?.name || 'Select a ship'}{selectedSailing ? ` · ${getSailingDate(selectedSailing) || 'sailing date pending'}` : ' · choose a sailing date before adding people'}</p>
          </div>

          <button type="submit" className="primary-action-button ce-button-primary" disabled={isSaving || !draft.cruiseLineId || !draft.assignedShipId || !draft.sailingId} data-testid="react-turnaround-person-submit-button">
            {isSaving ? 'Saving team member...' : 'Add to this turnaround team'}
          </button>
          <p className="draft-message ce-feedback-message ce-editor-card" role="status" aria-live="polite" data-testid="react-turnaround-admin-message">
            {error || message || 'Select a ship and sailing date, then add the person who should cover that role.'}
          </p>
        </form>

        <div className="turnaround-admin-roster compact-turnaround-admin-roster" data-testid="react-turnaround-admin-roster">
          <div className="turnaround-roster-header">
            <div>
              <h3>2. Current team for {selectedTurnaroundLabel}</h3>
              <p className="muted-copy ce-muted">
                {selectedShip ? `${selectedShipTeam.length} assigned team member${selectedShipTeam.length === 1 ? '' : 's'} for this sailing` : 'Choose a ship to see the current turnaround team'}
              </p>
            </div>
          </div>

          {selectedShip ? (
            <div className="turnaround-team-readiness-card" data-testid="react-turnaround-admin-team-readiness">
              <div className="turnaround-team-readiness-summary">
                <span>Team readiness</span>
                <strong>{teamReadinessScore}% staffed</strong>
                <p>{missingRoles.length ? `Missing ${missingRoles.length} required role${missingRoles.length === 1 ? '' : 's'}` : 'All required turnaround roles are assigned for this ship queue.'}</p>
              </div>
              <div className="turnaround-missing-role-list" aria-label="Missing turnaround roles">
                {missingRoles.length === 0 ? <span className="turnaround-team-complete-badge">Complete team</span> : missingRoles.map(role => <span key={role} className="turnaround-team-missing-role-badge">{getRoleLabel(role)}</span>)}
              </div>
            </div>
          ) : null}

          {selectedDateConflicts.length ? (
            <div className="turnaround-same-day-conflict-card" data-testid="react-turnaround-admin-same-day-conflicts">
              <strong>Same-day conflict guardrail</strong>
              <p>{selectedDateConflicts.length} person{selectedDateConflicts.length === 1 ? '' : 's'} already show a multi-ship assignment conflict on {selectedSailingDate}. Assign a different team member before the ship turns.</p>
            </div>
          ) : null}

          {selectedShip ? (
            <div className="turnaround-role-coverage-grid" data-testid="react-turnaround-admin-role-coverage">
              {REQUIRED_TEAM_ROLES.map(role => {
                const assignedPerson = selectedShipTeam.find(person => normalizeRole(person.roleView || person.role) === role)
                const replacementCandidate = teamWorkspace.replacementCandidatesByRole[role]?.[0]
                return (
                  <article key={role} className={assignedPerson ? 'turnaround-role-coverage-card staffed' : 'turnaround-role-coverage-card missing'} data-testid="react-turnaround-admin-role-card">
                    <div className="turnaround-role-assignment">
                      <span className="turnaround-role-assignment-label">{getRoleLabel(role)}</span>
                      <strong className="turnaround-role-assignment-person">
                        {assignedPerson
                          ? getBasePersonName(assignedPerson.displayName)
                          : 'Unassigned'}
                      </strong>
                    </div>
                    {assignedPerson ? (
                      <button type="button" className="secondary-action-button compact-action ce-button-secondary" onClick={() => handleRemovePerson(assignedPerson)} disabled={isSaving} data-testid="react-turnaround-admin-clear-role">Clear role</button>
                    ) : replacementCandidate && draft.sailingId ? (
                      <button type="button" className="secondary-action-button compact-action ce-button-secondary" onClick={() => handleAssignRosterPersonToSelectedTurnaround(replacementCandidate)} disabled={isSaving} data-testid="react-turnaround-admin-fill-role">Fill from roster</button>
                    ) : null}
                  </article>
                )
              })}
            </div>
          ) : null}

          <div className="turnaround-selected-team" data-testid="react-turnaround-admin-selected-team">
            {!selectedShip ? (
              <p className="empty-state compact ce-empty-state ce-editor-card">Select a ship and sailing date to manage that exact turnaround team.</p>
            ) : selectedShipTeam.length === 0 ? (
              <p className="empty-state compact ce-empty-state ce-editor-card">No team members are assigned to this ship queue yet. Add the first role on the left.</p>
            ) : selectedShipTeam.map(person => (
              <article key={person.id} className="turnaround-team-member-card" data-testid="react-turnaround-admin-team-member">
                <div>
                  <strong>{getBasePersonName(person.displayName)}</strong>
                  <span>{getRoleLabel(person.role)} · {person.assignedShipName || selectedShip.name}{selectedSailing ? ` · ${getSailingDate(selectedSailing) || 'sailing date pending'}` : ''}</span>
                </div>
                <button type="button" className="secondary-action-button compact-action ce-button-secondary" onClick={() => handleRemovePerson(person)} disabled={isSaving} data-testid="react-turnaround-admin-remove-person">Remove</button>
              </article>
            ))}
          </div>

          <details className="turnaround-roster-browser">
            <summary>Browse the wider {selectedCruiseLine?.name || 'cruise-line'} roster</summary>
          <div className="turnaround-roster-toolbar" aria-label="Turnaround roster filters">
            <label>
              <span>Search roster</span>
              <input value={rosterSearch} onChange={event => setRosterSearch(event.target.value)} placeholder="Name, role, port, or ship" data-testid="react-turnaround-admin-roster-search" />
            </label>
            <label>
              <span>Role</span>
              <select value={rosterRoleFilter} onChange={event => setRosterRoleFilter(event.target.value)} data-testid="react-turnaround-admin-roster-role-filter">
                <option value="all">All roles</option>
                {ROLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>

          {visibleRosterGroups.length === 0 ? (
            <p>No turnaround people match this roster view.</p>
          ) : (
            <div className="turnaround-roster-list compact-turnaround-roster-list">
              {visibleRosterGroups.map(group => (
                <article key={group.id} className="turnaround-roster-card compact-turnaround-roster-card" data-testid="react-turnaround-admin-roster-person">
                  <div>
                    <strong>{group.baseName}</strong>
                    <span>{group.roleLabel} · {group.homePort}</span>
                  </div>
                  <p>{group.ships.length} ship queue{group.ships.length === 1 ? '' : 's'} · {group.dates.length ? `${group.dates.length} scheduled date${group.dates.length === 1 ? '' : 's'}` : 'date not selected'}</p>
                  <div className="turnaround-roster-chip-list" aria-label={`${group.baseName} ship assignments`}>
                    {group.ships.slice(0, 4).map(shipName => <span key={shipName}>{shipName}</span>)}
                    {group.ships.length > 4 ? <span>+{group.ships.length - 4} more</span> : null}
                  </div>
                  <small className={group.conflicts.length ? 'turnaround-conflict-warning' : 'turnaround-conflict-ok'}>
                    {group.conflicts.length ? `Conflict warning: ${group.conflicts.join(', ')}` : 'No same-day conflict in this roster'}
                  </small>
                  {draft.assignedShipId && draft.sailingId ? (
                    <button type="button" className="secondary-action-button compact-action ce-button-secondary" onClick={() => handleAssignRosterPersonToSelectedTurnaround(group.people[0])} disabled={isSaving} data-testid="react-turnaround-admin-assign-existing-person">
                      Assign to selected sailing
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          )}

          {filteredRosterGroups.length > VISIBLE_ROSTER_LIMIT ? (
            <button type="button" className="secondary-action-button turnaround-roster-toggle ce-button-secondary" onClick={() => setShowAllRoster(current => !current)} data-testid="react-turnaround-admin-roster-toggle">
              {showAllRoster ? 'Show fewer people' : `Show all ${filteredRosterGroups.length} roster groups`}
            </button>
          ) : null}
          </details>
        </div>
      </div>
    </section>
  )
}

