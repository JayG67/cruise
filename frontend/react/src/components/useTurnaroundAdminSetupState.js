import { useEffect, useMemo, useState } from 'react'

import {
  createTurnaroundPerson,
  deleteTurnaroundPerson,
  getTurnaroundAdminSetup,
  updateTurnaroundPerson
} from '../api/client.js'
import { VISIBLE_ROSTER_LIMIT, buildRosterGroups, buildTurnaroundTeamWorkspace, getAssignmentPort, getSailingDate, getTurnaroundAdminErrorMessage, initialDraft, normalizeRole } from '../domain/turnaroundAdminWorkspace.js'
import { formatTurnaroundSetupRefreshSummary, reconcileTurnaroundSetupDraft } from '../domain/turnaroundSetupRefresh.js'

const EMPTY_SETUP = { turnaroundPeople: [], cruiseLines: [], ships: [], sailings: [] }

export default function useTurnaroundAdminSetupState({ selectedDemoUser, onSetupChanged }) {
  const [setup, setSetup] = useState(EMPTY_SETUP)
  const [draft, setDraft] = useState(initialDraft())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [refreshStatus, setRefreshStatus] = useState('Setup data loads automatically. Use reload when you need the latest assignments, ships, or sailings.')
  const [rosterSearch, setRosterSearch] = useState('')
  const [rosterRoleFilter, setRosterRoleFilter] = useState('all')
  const [showAllRoster, setShowAllRoster] = useState(false)

  const adminScope = useMemo(() => ({ selectedDemoUser }), [selectedDemoUser])

  async function loadSetup({ announce = false } = {}) {
    setIsLoading(true)
    if (announce) setRefreshStatus('Reloading turnaround setup data...')
    try {
      const response = await getTurnaroundAdminSetup(adminScope)
      setSetup(response)
      setDraft(current => reconcileTurnaroundSetupDraft(current, response))
      setError('')
      if (announce) setRefreshStatus(formatTurnaroundSetupRefreshSummary(response))
    } catch (loadError) {
      const loadMessage = loadError.message || 'Unable to load turnaround setup.'
      setError(loadMessage)
      if (announce) setRefreshStatus(`Setup reload failed. ${loadMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSetup({ announce: false })
    // The selected user id is the lifecycle boundary for the scoped setup request.
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

  const rosterGroups = useMemo(() => (
    buildRosterGroups(teamWorkspace.peopleForCruiseLine, setup.ships || [], setup.sailings || [])
  ), [teamWorkspace.peopleForCruiseLine, setup.ships, setup.sailings])

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

  const visibleRosterGroups = showAllRoster
    ? filteredRosterGroups
    : filteredRosterGroups.slice(0, VISIBLE_ROSTER_LIMIT)

  const selectedPort = getAssignmentPort({
    person: {},
    ship: teamWorkspace.selectedShip,
    sailing: teamWorkspace.selectedSailing
  })
  const selectedTurnaroundLabel = teamWorkspace.selectedShip && teamWorkspace.selectedSailing
    ? `${teamWorkspace.selectedShip.name} · ${getSailingDate(teamWorkspace.selectedSailing) || 'sailing date pending'}`
    : teamWorkspace.selectedShip?.name || 'the selected ship'

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

  async function runMutation({ pendingMessage, execute, successMessage, afterSuccess }) {
    setIsSaving(true)
    setMessage(pendingMessage)
    setError('')

    try {
      const response = await execute()
      setSetup(response.setup || setup)
      afterSuccess?.()
      setMessage(response.message || successMessage)
      await onSetupChanged?.()
    } catch (mutationError) {
      setError(getTurnaroundAdminErrorMessage(mutationError))
      setMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const payload = {
      displayName: draft.displayName,
      role: draft.role,
      cruiseLineId: draft.cruiseLineId,
      assignedShipId: draft.assignedShipId || null,
      assignedSailingId: draft.sailingId || null,
      sailingId: draft.sailingId || null
    }

    await runMutation({
      pendingMessage: 'Saving turnaround person assignment...',
      execute: () => createTurnaroundPerson(payload, adminScope),
      successMessage: 'Turnaround person created and assigned successfully',
      afterSuccess: () => setDraft(current => ({ ...current, displayName: '' }))
    })
  }

  async function handleAssignRosterPersonToSelectedTurnaround(person) {
    if (!person?.id || !draft.assignedShipId || !draft.sailingId) return

    await runMutation({
      pendingMessage: `Assigning ${person.displayName} to ${selectedTurnaroundLabel}...`,
      execute: () => updateTurnaroundPerson(person.id, {
        displayName: person.displayName,
        role: normalizeRole(person.role),
        cruiseLineId: draft.cruiseLineId,
        assignedShipId: draft.assignedShipId,
        assignedSailingId: draft.sailingId,
        sailingId: draft.sailingId
      }, adminScope),
      successMessage: `${person.displayName} assigned to ${selectedTurnaroundLabel}`
    })
  }

  async function handleRemovePerson(person) {
    if (!person?.id) return

    await runMutation({
      pendingMessage: `Removing ${person.displayName} from this turnaround team...`,
      execute: () => deleteTurnaroundPerson(person.id, adminScope),
      successMessage: 'Turnaround person removed from this team and kept in the cruise-line roster'
    })
  }

  return {
    draft,
    error,
    filteredRosterGroups,
    handleAssignRosterPersonToSelectedTurnaround,
    handleRemovePerson,
    handleSubmit,
    isLoading,
    isSaving,
    loadSetup,
    message,
    refreshStatus,
    rosterRoleFilter,
    rosterSearch,
    selectedPort,
    selectedTurnaroundLabel,
    setRosterRoleFilter,
    setRosterSearch,
    setShowAllRoster,
    setup,
    showAllRoster,
    teamWorkspace,
    updateDraft,
    visibleRosterGroups
  }
}
