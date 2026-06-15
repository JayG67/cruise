import { useEffect, useMemo, useState } from 'react'

import { createTurnaroundPerson, getTurnaroundAdminSetup } from '../api/client.js'

const ROLE_OPTIONS = [
  ['turnaround-manager', 'Turnaround Manager'],
  ['housekeeping-lead', 'Housekeeping Lead'],
  ['guest-services-lead', 'Guest Services Lead'],
  ['food-beverage-lead', 'Food & Beverage Lead'],
  ['engineering-lead', 'Engineering Lead'],
  ['security-lead', 'Security Lead'],
  ['port-operations-lead', 'Port Operations Lead']
]

function getRoleLabel(role = '') {
  const match = ROLE_OPTIONS.find(([value]) => value === String(role).toLowerCase().replace(/_/g, '-'))
  return match?.[1] || role
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

export default function ReactTurnaroundAdminSetup({ selectedDemoUser, onSetupChanged }) {
  const [setup, setSetup] = useState({ turnaroundPeople: [], cruiseLines: [], ships: [], sailings: [] })
  const [draft, setDraft] = useState(initialDraft())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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

  const shipsForSelectedCruiseLine = useMemo(() => (
    (setup.ships || []).filter(ship => ship.cruiseLineId === draft.cruiseLineId)
  ), [setup.ships, draft.cruiseLineId])

  const sailingsForSelectedShip = useMemo(() => (
    (setup.sailings || []).filter(sailing => sailing.shipId === draft.assignedShipId)
  ), [setup.sailings, draft.assignedShipId])

  const peopleForSelectedCruiseLine = useMemo(() => (
    (setup.turnaroundPeople || []).filter(person => !draft.cruiseLineId || person.cruiseLineId === draft.cruiseLineId)
  ), [setup.turnaroundPeople, draft.cruiseLineId])

  function updateDraft(fieldName, value) {
    setDraft(current => {
      const next = { ...current, [fieldName]: value }
      if (fieldName === 'cruiseLineId') {
        next.assignedShipId = ''
        next.sailingId = ''
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
        sailingId: draft.sailingId || null
      }
      const response = await createTurnaroundPerson(payload, adminScope)
      setSetup(response.setup || setup)
      setDraft({ ...initialDraft(response.setup?.cruiseLines || setup.cruiseLines), cruiseLineId: draft.cruiseLineId })
      setMessage(response.message || 'Turnaround person created and assigned successfully')
      await onSetupChanged?.()
    } catch (saveError) {
      setError(saveError.message || 'Unable to save turnaround assignment.')
      setMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCruiseLine = setup.cruiseLines?.find(line => line.id === draft.cruiseLineId)

  return (
    <section className="react-app-section turnaround-admin-setup-panel" id="react-turnaround-admin-setup" aria-labelledby="react-turnaround-admin-setup-heading" data-testid="react-turnaround-admin-setup">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Turnaround admin setup</p>
          <h2 id="react-turnaround-admin-setup-heading">Create the operational world for a turnaround demo</h2>
          <p>
            Admins can create role-play operational personnel, lock each person to one cruise line,
            optionally scope them to a ship, and immediately use them from the role selector.
          </p>
        </div>
        <button type="button" className="secondary-action-button" onClick={loadSetup} disabled={isLoading} data-testid="react-turnaround-admin-refresh-button">
          {isLoading ? 'Refreshing...' : 'Refresh setup'}
        </button>
      </div>

      <div className="turnaround-admin-grid">
        <form className="turnaround-admin-form" onSubmit={handleSubmit} data-testid="react-turnaround-admin-person-form">
          <h3>Add turnaround person</h3>
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
            <span>Assigned ship</span>
            <select value={draft.assignedShipId} onChange={event => updateDraft('assignedShipId', event.target.value)} data-testid="react-turnaround-person-ship-select">
              <option value="">Cruise-line wide assignment</option>
              {shipsForSelectedCruiseLine.map(ship => <option key={ship.id} value={ship.id}>{ship.name}</option>)}
            </select>
          </label>
          <label>
            <span>Lifecycle sailing contract</span>
            <select value={draft.sailingId} onChange={event => updateDraft('sailingId', event.target.value)} disabled={!draft.assignedShipId} data-testid="react-turnaround-person-sailing-select">
              <option value="">No sailing selected yet</option>
              {sailingsForSelectedShip.map(sailing => <option key={sailing.id} value={sailing.id}>{sailing.departureDate} · {sailing.departurePort || sailing.port}</option>)}
            </select>
          </label>
          <button type="submit" className="primary-action-button" disabled={isSaving || !draft.cruiseLineId} data-testid="react-turnaround-person-submit-button">
            {isSaving ? 'Creating assignment...' : 'Create assignment'}
          </button>
          <p className="draft-message" role="status" aria-live="polite" data-testid="react-turnaround-admin-message">
            {error || message || 'Create a scoped person, then switch to that role in Role-aware Views.'}
          </p>
        </form>

        <div className="turnaround-admin-roster" data-testid="react-turnaround-admin-roster">
          <h3>{selectedCruiseLine?.name || 'Selected cruise line'} roster</h3>
          <p className="muted-copy">Each listed person has one cruise-line assignment. Ship scope is optional but never crosses brands.</p>
          {peopleForSelectedCruiseLine.length === 0 ? (
            <p>No turnaround people exist for this cruise line yet.</p>
          ) : (
            <div className="turnaround-roster-list">
              {peopleForSelectedCruiseLine.map(person => (
                <article key={person.id} className="turnaround-roster-card" data-testid="react-turnaround-admin-roster-person">
                  <strong>{person.displayName}</strong>
                  <span>{getRoleLabel(person.roleView || person.role)}</span>
                  <span>{person.assignedShipName || 'Cruise-line wide'} · {person.cruiseLineName}</span>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
