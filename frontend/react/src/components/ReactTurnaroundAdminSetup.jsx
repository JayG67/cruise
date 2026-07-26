import { useEffect, useMemo, useState } from 'react'

import { createTurnaroundPerson, deleteTurnaroundPerson, getTurnaroundAdminSetup, updateTurnaroundPerson } from '../api/client.js'

const ROLE_OPTIONS = [
  ['turnaround-manager', 'Turnaround Manager'],
  ['housekeeping-lead', 'Housekeeping Lead'],
  ['guest-services-lead', 'Guest Services Lead'],
  ['food-beverage-lead', 'Food & Beverage Lead'],
  ['engineering-lead', 'Engineering Lead'],
  ['security-lead', 'Security Lead'],
  ['port-operations-lead', 'Port Operations Lead']
]

const VISIBLE_ROSTER_LIMIT = 12
const REQUIRED_TEAM_ROLES = ROLE_OPTIONS.map(([value]) => value)

function normalizeRole(role = '') {
  return String(role || '').toLowerCase().replace(/_/g, '-')
}

function getRoleLabel(role = '') {
  const normalizedRole = normalizeRole(role)
  const match = ROLE_OPTIONS.find(([value]) => value === normalizedRole)
  return match?.[1] || role
}


function getTurnaroundAdminErrorMessage(error = {}) {
  const message = String(error.message || '')

  if (message.includes("Cannot find module '../encodings'") || message.includes('iconv-lite')) {
    return 'Local dependency install is incomplete. Stop the server, run npm install, then restart and create the assignment again.'
  }

  if (message === 'Internal server error') {
    return 'The server could not create this assignment. Refresh setup and try again; if it repeats, restart the app after reinstalling dependencies.'
  }

  return message || 'Unable to save turnaround assignment.'
}

function initialDraft(cruiseLines = []) {
  return {
    displayName: '',
    role: 'housekeeping-lead',
    cruiseLineId: cruiseLines[0]?.id || '',
    assignedShipId: '',
    sailingId: ''
  }
}

function getBasePersonName(displayName = '') {
  return String(displayName || '')
    .replace(/\s+—\s+.+$/, '')
    .replace(/\s+(Turnaround Manager|Housekeeping Lead|Guest Services Lead|Food & Beverage Lead|Engineering Lead|Security Lead|Port Operations Lead)$/i, '')
    .trim()
}

function getSailingDate(sailing = {}) {
  if (!sailing) return ''
  return sailing.departureDate || sailing.date || sailing.sailingDate || ''
}

function getAssignedSailingId(person = {}) {
  return person.assignedSailingId || person.sailingId || ''
}

function getAssignmentPort({ person, ship, sailing } = {}) {
  return sailing?.departurePort || sailing?.port || ship?.currentPort || person?.homePort || person?.turnaroundPort || 'Port pool not assigned'
}

function buildSameDayConflicts(people = [], sailings = []) {
  const safePeople = people.filter(Boolean)
  const safeSailings = sailings.filter(Boolean)
  const sailingById = new Map(safeSailings.map(sailing => [sailing.id, sailing]))
  const conflictMap = new Map()

  for (const person of safePeople) {
    const assignedSailingId = getAssignedSailingId(person)
    if (!assignedSailingId) continue

    const sailing = sailingById.get(assignedSailingId)
    const date = getSailingDate(sailing)
    if (!date) continue

    const baseName = getBasePersonName(person.displayName)
    const key = `${baseName}:${person.cruiseLineId || person.cruiseLineName || ''}:${date}`
    if (!conflictMap.has(key)) {
      conflictMap.set(key, {
        key,
        baseName,
        date,
        people: [],
        sailingIds: new Set(),
        shipIds: new Set()
      })
    }

    const conflict = conflictMap.get(key)
    conflict.people.push(person)
    conflict.sailingIds.add(assignedSailingId)
    if (person.assignedShipId) conflict.shipIds.add(person.assignedShipId)
  }

  return [...conflictMap.values()]
    .filter(conflict => conflict.sailingIds.size > 1 || conflict.shipIds.size > 1)
    .map(conflict => ({
      ...conflict,
      sailingIds: [...conflict.sailingIds],
      shipIds: [...conflict.shipIds]
    }))
}

function buildTurnaroundTeamWorkspace({ people = [], cruiseLines = [], ships = [], sailings = [], selectedCruiseLineId = '', selectedShipId = '', selectedSailingId = '' } = {}) {
  const safePeople = people.filter(Boolean)
  const safeCruiseLines = cruiseLines.filter(Boolean)
  const safeShips = ships.filter(Boolean)
  const safeSailings = sailings.filter(Boolean)

  const selectedCruiseLine = safeCruiseLines.find(line => line.id === selectedCruiseLineId) || null
  const shipsForCruiseLine = safeShips.filter(ship => !selectedCruiseLineId || ship.cruiseLineId === selectedCruiseLineId)
  const selectedShip = shipsForCruiseLine.find(ship => ship.id === selectedShipId) || null
  const sailingsForShip = safeSailings.filter(sailing => !selectedShipId || sailing.shipId === selectedShipId)
  const selectedSailing = sailingsForShip.find(sailing => sailing.id === selectedSailingId) || null

  const peopleForCruiseLine = safePeople.filter(person => !selectedCruiseLineId || person.cruiseLineId === selectedCruiseLineId)
  const selectedTeam = peopleForCruiseLine
    .filter(person => selectedShipId ? person.assignedShipId === selectedShipId : !person.assignedShipId)
    .filter(person => !selectedSailingId || !getAssignedSailingId(person) || getAssignedSailingId(person) === selectedSailingId)
    .sort((a, b) => getRoleLabel(a.role).localeCompare(getRoleLabel(b.role)) || String(a.displayName).localeCompare(String(b.displayName)))

  const assignedRoleSet = new Set(selectedTeam.map(person => normalizeRole(person.roleView || person.role)))
  const missingRoles = REQUIRED_TEAM_ROLES.filter(role => !assignedRoleSet.has(role))
  const staffedRoleCount = REQUIRED_TEAM_ROLES.length - missingRoles.length
  const readinessScore = Math.round((staffedRoleCount / REQUIRED_TEAM_ROLES.length) * 100)

  const sailingDate = getSailingDate(selectedSailing)
  const sameDayConflicts = buildSameDayConflicts(peopleForCruiseLine, safeSailings)
  const selectedDateConflicts = sailingDate
    ? sameDayConflicts.filter(conflict => conflict.date === sailingDate)
    : []

  const replacementCandidatesByRole = REQUIRED_TEAM_ROLES.reduce((groups, role) => {
    groups[role] = peopleForCruiseLine.filter(person => {
      const personRole = normalizeRole(person.roleView || person.role)
      if (personRole !== role) return false
      if (selectedTeam.some(teamPerson => teamPerson.id === person.id)) return false
      return true
    })
    return groups
  }, {})

  return {
    selectedCruiseLine,
    shipsForCruiseLine,
    selectedShip,
    sailingsForShip,
    selectedSailing,
    peopleForCruiseLine,
    selectedTeam,
    missingRoles,
    readinessScore,
    staffedRoleCount,
    requiredRoleCount: REQUIRED_TEAM_ROLES.length,
    sameDayConflicts,
    selectedDateConflicts,
    replacementCandidatesByRole
  }
}

function buildRosterGroups(people = [], ships = [], sailings = []) {
  const safePeople = people.filter(Boolean)
  const safeShips = ships.filter(Boolean)
  const safeSailings = sailings.filter(Boolean)
  const shipById = new Map(safeShips.map(ship => [ship.id, ship]))
  const firstSailingByShipId = new Map()

  for (const sailing of safeSailings) {
    if (!sailing.shipId || firstSailingByShipId.has(sailing.shipId)) continue
    firstSailingByShipId.set(sailing.shipId, sailing)
  }

  const groupMap = new Map()

  for (const person of safePeople) {
    const role = normalizeRole(person.roleView || person.role)
    const baseName = getBasePersonName(person.displayName)
    const ship = person.assignedShipId ? shipById.get(person.assignedShipId) : null
    const assignedSailingId = getAssignedSailingId(person)
    const sailing = assignedSailingId ? safeSailings.find(item => item.id === assignedSailingId) : firstSailingByShipId.get(person.assignedShipId)
    const homePort = getAssignmentPort({ person, ship, sailing })
    const groupKey = `${baseName}:${role}:${person.cruiseLineId || person.cruiseLineName || ''}:${homePort}`
    const assignmentDate = getSailingDate(sailing)

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        id: groupKey,
        baseName,
        role,
        roleLabel: getRoleLabel(role),
        cruiseLineName: person.cruiseLineName,
        homePort,
        people: [],
        ships: [],
        dates: [],
        conflicts: []
      })
    }

    const group = groupMap.get(groupKey)
    group.people.push(person)

    const shipName = person.assignedShipName || ship?.name || 'Cruise-line wide'
    if (!group.ships.includes(shipName)) group.ships.push(shipName)
    if (assignmentDate && !group.dates.includes(assignmentDate)) group.dates.push(assignmentDate)
  }

  for (const group of groupMap.values()) {
    const dateCounts = group.people.reduce((counts, person) => {
      const assignedSailingId = getAssignedSailingId(person)
      const sailing = assignedSailingId ? safeSailings.find(item => item.id === assignedSailingId) : firstSailingByShipId.get(person.assignedShipId)
      const date = getSailingDate(sailing)
      if (date) counts.set(date, (counts.get(date) || 0) + 1)
      return counts
    }, new Map())

    group.conflicts = [...dateCounts.entries()].filter(([, count]) => count > 1).map(([date]) => date)
  }

  return [...groupMap.values()].sort((a, b) => {
    const roleCompare = a.roleLabel.localeCompare(b.roleLabel)
    return roleCompare || a.baseName.localeCompare(b.baseName)
  })
}

export default function ReactTurnaroundAdminSetup({ selectedDemoUser, onSetupChanged }) {
  const [setup, setSetup] = useState({ turnaroundPeople: [], cruiseLines: [], ships: [], sailings: [] })
  const [draft, setDraft] = useState(initialDraft())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [rosterSearch, setRosterSearch] = useState('')
  const [rosterRoleFilter, setRosterRoleFilter] = useState('all')
  const [showAllRoster, setShowAllRoster] = useState(false)

  const adminScope = { selectedDemoUser }

  async function loadSetup() {
    setIsLoading(true)
    try {
      const response = await getTurnaroundAdminSetup(adminScope)
      setSetup(response)
      setDraft(current => ({
        ...current,
        cruiseLineId: current.cruiseLineId || response.cruiseLines?.[0]?.id || ''
      }))
      setError('')
    } catch (loadError) {
      setError(loadError.message || 'Unable to load turnaround setup.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSetup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDemoUser?.id])

  const teamWorkspace = useMemo(() => buildTurnaroundTeamWorkspace({
    people: setup.turnaroundPeople || [],
    cruiseLines: setup.cruiseLines || [],
    ships: setup.ships || [],
    sailings: setup.sailings || [],
    selectedCruiseLineId: draft.cruiseLineId,
    selectedShipId: draft.assignedShipId,
    selectedSailingId: draft.sailingId
  }), [setup, draft.cruiseLineId, draft.assignedShipId, draft.sailingId])

  const shipsForSelectedCruiseLine = teamWorkspace.shipsForCruiseLine
  const sailingsForSelectedShip = teamWorkspace.sailingsForShip
  const peopleForSelectedCruiseLine = teamWorkspace.peopleForCruiseLine

  const rosterGroups = useMemo(() => (
    buildRosterGroups(peopleForSelectedCruiseLine, setup.ships || [], setup.sailings || [])
  ), [peopleForSelectedCruiseLine, setup.ships, setup.sailings])

  const filteredRosterGroups = useMemo(() => {
    const normalizedSearch = rosterSearch.trim().toLowerCase()
    return rosterGroups.filter(group => {
      const roleMatches = rosterRoleFilter === 'all' || group.role === rosterRoleFilter
      const searchMatches = !normalizedSearch || [
        group.baseName,
        group.roleLabel,
        group.homePort,
        group.cruiseLineName,
        ...group.ships
      ].some(value => String(value || '').toLowerCase().includes(normalizedSearch))
      return roleMatches && searchMatches
    })
  }, [rosterGroups, rosterSearch, rosterRoleFilter])

  const visibleRosterGroups = showAllRoster ? filteredRosterGroups : filteredRosterGroups.slice(0, VISIBLE_ROSTER_LIMIT)
  const selectedCruiseLine = teamWorkspace.selectedCruiseLine
  const selectedShip = teamWorkspace.selectedShip
  const selectedSailing = teamWorkspace.selectedSailing
  const selectedPort = getAssignmentPort({ person: {}, ship: selectedShip, sailing: selectedSailing })
  const sameDayConflicts = teamWorkspace.sameDayConflicts
  const conflictCount = sameDayConflicts.length
  const selectedSailingDate = getSailingDate(selectedSailing)
  const selectedDateConflicts = teamWorkspace.selectedDateConflicts
  const selectedShipTeam = teamWorkspace.selectedTeam
  const missingRoles = teamWorkspace.missingRoles
  const teamReadinessScore = teamWorkspace.readinessScore

  const selectedTurnaroundLabel = selectedShip && selectedSailing
    ? `${selectedShip.name} · ${getSailingDate(selectedSailing) || 'sailing date pending'}`
    : selectedShip?.name || 'the selected ship'

  function updateDraft(fieldName, value) {
    setDraft(current => {
      const next = { ...current, [fieldName]: value }
      if (fieldName === 'cruiseLineId') {
        next.assignedShipId = ''
        next.sailingId = ''
        setShowAllRoster(false)
      }
      if (fieldName === 'assignedShipId') {
        next.sailingId = ''
      }
      return next
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setMessage('Saving turnaround person assignment...')
    setError('')

    try {
      const payload = {
        displayName: draft.displayName,
        role: draft.role,
        cruiseLineId: draft.cruiseLineId,
        assignedShipId: draft.assignedShipId || null,
        assignedSailingId: draft.sailingId || null,
        sailingId: draft.sailingId || null
      }
      const response = await createTurnaroundPerson(payload, adminScope)
      setSetup(response.setup || setup)
      setDraft(current => ({ ...current, displayName: '' }))
      setMessage(response.message || 'Turnaround person created and assigned successfully')
      await onSetupChanged?.()
    } catch (saveError) {
      setError(getTurnaroundAdminErrorMessage(saveError))
      setMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAssignRosterPersonToSelectedTurnaround(person) {
    if (!person?.id || !draft.assignedShipId || !draft.sailingId) return
    setIsSaving(true)
    setMessage(`Assigning ${person.displayName} to ${selectedTurnaroundLabel}...`)
    setError('')

    try {
      const response = await updateTurnaroundPerson(person.id, {
        displayName: person.displayName,
        role: normalizeRole(person.role),
        cruiseLineId: draft.cruiseLineId,
        assignedShipId: draft.assignedShipId,
        assignedSailingId: draft.sailingId,
        sailingId: draft.sailingId
      }, adminScope)
      setSetup(response.setup || setup)
      setMessage(response.message || `${person.displayName} assigned to ${selectedTurnaroundLabel}`)
      await onSetupChanged?.()
    } catch (assignError) {
      setError(getTurnaroundAdminErrorMessage(assignError))
      setMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemovePerson(person) {
    if (!person?.id) return
    setIsSaving(true)
    setMessage(`Removing ${person.displayName} from this turnaround team...`)
    setError('')

    try {
      const response = await deleteTurnaroundPerson(person.id, adminScope)
      setSetup(response.setup || setup)
      setMessage(response.message || 'Turnaround person removed from this team')
      await onSetupChanged?.()
    } catch (removeError) {
      setError(removeError.message || 'Unable to remove this turnaround person.')
      setMessage('')
    } finally {
      setIsSaving(false)
    }
  }

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
        <button type="button" className="secondary-action-button ce-button-secondary" onClick={loadSetup} disabled={isLoading} data-testid="react-turnaround-admin-refresh-button">
          {isLoading ? 'Reloading...' : 'Reload setup data'}
        </button>
      </div>

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
                          ? `${assignedPerson.displayName} — ${assignedPerson.assignedShipName || selectedShip.name}`
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
                  <strong>{person.displayName}</strong>
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

export { buildRosterGroups, buildSameDayConflicts, buildTurnaroundTeamWorkspace, getAssignmentPort, getBasePersonName, getAssignedSailingId, getSailingDate }
