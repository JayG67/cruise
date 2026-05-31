import { useMemo, useState } from 'react'

import ConfirmActionPanel from './ConfirmActionPanel.jsx'

import {
  createItineraryActivity,
  createItineraryDay,
  createSailing,
  createShip,
  deleteCruiseLine,
  deleteItineraryActivity,
  deleteItineraryDay,
  deleteSailing,
  deleteShip,
  getItineraryForSailing,
  getSailingsForShip,
  getShipsForCruiseLine,
  updateCruiseLine,
  updateItineraryActivity,
  updateItineraryDay,
  updateSailing,
  updateShip
} from '../api/client.js'

const EMPTY_SHIP_DRAFT = {
  name: '',
  currentPort: ''
}

const EMPTY_CRUISE_LINE_DRAFT = {
  name: '',
  country: '',
  website: ''
}

function buildCruiseLineDraft(cruiseLine = {}) {
  return {
    name: cruiseLine.name || '',
    country: cruiseLine.country || '',
    website: cruiseLine.website || ''
  }
}

function buildShipEditDraft(ship = {}) {
  return {
    name: ship.name || '',
    currentPort: getCurrentPortLabel(ship)
  }
}

const EMPTY_SAILING_DRAFT = {
  departureDate: '',
  departurePort: '',
  arrivalPort: '',
  days: '',
  isRepositioning: false
}

const EMPTY_ITINERARY_DAY_DRAFT = {
  day: '',
  title: '',
  port: ''
}

const EMPTY_ACTIVITY_DRAFT = {
  itineraryDayId: '',
  time: '',
  activity: ''
}

function buildSailingEditDraft(sailing = {}) {
  return {
    departureDate: sailing.departureDate || '',
    departurePort: sailing.departurePort || sailing.port || '',
    arrivalPort: sailing.arrivalPort || sailing.port || '',
    days: String(sailing.days || ''),
    isRepositioning: Boolean(sailing.isRepositioning)
  }
}

function buildItineraryDayEditDraft(day = {}) {
  return {
    day: String(day.day || ''),
    title: day.title || '',
    port: day.port || ''
  }
}

function buildActivityEditDraft(activity = {}) {
  return {
    time: activity.time || '',
    activity: activity.activity || ''
  }
}

function getCurrentPortLabel(ship) {
  return ship.currentPort || ship.current_port || ship.homePort || ship.home_port || 'Not currently listed'
}

function getSailingDateLabel(sailing) {
  if (!sailing?.departureDate) {
    return 'Departure date unavailable'
  }

  return sailing.departureDate
}

function getSailingTypeLabel(sailing) {
  return sailing?.isRepositioning ? 'Repositioning Sailing' : 'Round-Trip / Regional Sailing'
}

function getItineraryDayLabel(day) {
  return `Day ${day?.day || '?'} — ${day?.title || 'Itinerary day'}`
}

export default function ReactFleetDirectory({ cruiseLines = [], isLoading = false, isRefreshing = false, error = '', onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCruiseLine, setSelectedCruiseLine] = useState(null)
  const [selectedShips, setSelectedShips] = useState([])
  const [shipsLoading, setShipsLoading] = useState(false)
  const [shipsError, setShipsError] = useState('')
  const [fleetActionMessage, setFleetActionMessage] = useState('')
  const [deletingCruiseLineId, setDeletingCruiseLineId] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [updatingCruiseLineId, setUpdatingCruiseLineId] = useState('')
  const [activeCruiseLineEditId, setActiveCruiseLineEditId] = useState('')
  const [cruiseLineDraft, setCruiseLineDraft] = useState(EMPTY_CRUISE_LINE_DRAFT)
  const [shipDraft, setShipDraft] = useState(EMPTY_SHIP_DRAFT)
  const [activeShipEditId, setActiveShipEditId] = useState('')
  const [shipEditDraft, setShipEditDraft] = useState(EMPTY_SHIP_DRAFT)
  const [shipActionMessage, setShipActionMessage] = useState('')
  const [shipActionId, setShipActionId] = useState('')
  const [selectedShipForSailings, setSelectedShipForSailings] = useState(null)
  const [sailings, setSailings] = useState([])
  const [sailingsLoading, setSailingsLoading] = useState(false)
  const [sailingsError, setSailingsError] = useState('')
  const [sailingDraft, setSailingDraft] = useState(EMPTY_SAILING_DRAFT)
  const [sailingActionMessage, setSailingActionMessage] = useState('')
  const [sailingActionId, setSailingActionId] = useState('')
  const [activeSailingEditId, setActiveSailingEditId] = useState('')
  const [sailingEditDraft, setSailingEditDraft] = useState(EMPTY_SAILING_DRAFT)
  const [selectedSailingForItinerary, setSelectedSailingForItinerary] = useState(null)
  const [itineraryDays, setItineraryDays] = useState([])
  const [itineraryLoading, setItineraryLoading] = useState(false)
  const [itineraryError, setItineraryError] = useState('')
  const [itineraryDayDraft, setItineraryDayDraft] = useState(EMPTY_ITINERARY_DAY_DRAFT)
  const [activityDraft, setActivityDraft] = useState(EMPTY_ACTIVITY_DRAFT)
  const [itineraryActionMessage, setItineraryActionMessage] = useState('')
  const [itineraryActionId, setItineraryActionId] = useState('')
  const [activeItineraryDayEditId, setActiveItineraryDayEditId] = useState('')
  const [itineraryDayEditDraft, setItineraryDayEditDraft] = useState(EMPTY_ITINERARY_DAY_DRAFT)
  const [activeActivityEditId, setActiveActivityEditId] = useState('')
  const [activityEditDraft, setActivityEditDraft] = useState({ time: '', activity: '' })

  const filteredCruiseLines = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return cruiseLines
    }

    return cruiseLines.filter(cruiseLine => {
      return [
        cruiseLine.name,
        cruiseLine.country
      ].some(value => String(value || '').toLowerCase().includes(normalizedSearch))
    })
  }, [cruiseLines, searchTerm])

  const visibleCruiseLines = filteredCruiseLines.slice(0, 8)

  async function reloadSelectedShips(cruiseLine = selectedCruiseLine) {
    if (!cruiseLine?.id) {
      return []
    }

    const ships = await getShipsForCruiseLine(cruiseLine.id)
    setSelectedShips(ships)
    return ships
  }

  function clearItinerary() {
    setSelectedSailingForItinerary(null)
    setItineraryDays([])
    setItineraryError('')
    setItineraryLoading(false)
    setItineraryActionMessage('')
    setItineraryDayDraft(EMPTY_ITINERARY_DAY_DRAFT)
    setActivityDraft(EMPTY_ACTIVITY_DRAFT)
    setActiveItineraryDayEditId('')
    setItineraryDayEditDraft(EMPTY_ITINERARY_DAY_DRAFT)
    setActiveActivityEditId('')
    setActivityEditDraft({ time: '', activity: '' })
  }

  function clearSailings() {
    setSelectedShipForSailings(null)
    setSailings([])
    setSailingsError('')
    setSailingsLoading(false)
    clearItinerary()
  }

  async function handleViewShips(cruiseLine) {
    setSelectedCruiseLine(cruiseLine)
    setSelectedShips([])
    setShipsError('')
    setFleetActionMessage('')
    setShipActionMessage('')
    clearSailings()
    setShipsLoading(true)

    try {
      const ships = await getShipsForCruiseLine(cruiseLine.id)

      setSelectedShips(ships)
    } catch (loadError) {
      setShipsError(loadError.message || 'Unable to load ships for this cruise line.')
    } finally {
      setShipsLoading(false)
    }
  }

  async function handleCreateShip(event) {
    event.preventDefault()

    if (!selectedCruiseLine?.id) {
      setShipActionMessage('Select a cruise line before adding ships.')
      return
    }

    const name = shipDraft.name.trim()
    const currentPort = shipDraft.currentPort.trim()

    if (!name) {
      setShipActionMessage('Ship name is required.')
      return
    }

    setShipActionId('create')
    setShipActionMessage('Creating ship…')

    try {
      await createShip({
        name,
        currentPort: currentPort || selectedCruiseLine.country || 'Port to be assigned',
        cruiseLineId: selectedCruiseLine.id
      })

      setShipDraft(EMPTY_SHIP_DRAFT)
      await reloadSelectedShips()
      clearSailings()
      setShipActionMessage(`${name} was added to ${selectedCruiseLine.name}.`)
    } catch (createError) {
      setShipActionMessage(createError.message || 'Unable to create ship.')
    } finally {
      setShipActionId('')
    }
  }

  function openShipEdit(ship) {
    setActiveShipEditId(ship.id)
    setShipEditDraft(buildShipEditDraft(ship))
    setShipActionMessage('')
  }

  function cancelShipEdit() {
    setActiveShipEditId('')
    setShipEditDraft(EMPTY_SHIP_DRAFT)
    setShipActionMessage('Ship update was cancelled.')
  }

  async function handleUpdateShip(event, ship) {
    event.preventDefault()

    const trimmedName = shipEditDraft.name.trim()
    const currentPort = shipEditDraft.currentPort.trim()

    if (!trimmedName) {
      setShipActionMessage('Ship name is required.')
      return
    }

    setShipActionId(ship.id)
    setShipActionMessage(`Updating ${ship.name}…`)

    try {
      await updateShip(ship.id, {
        name: trimmedName,
        currentPort,
        cruiseLineId: ship.cruiseLineId || selectedCruiseLine?.id
      })

      await reloadSelectedShips()
      if (selectedShipForSailings?.id === ship.id) {
        clearSailings()
      }
      setActiveShipEditId('')
      setShipEditDraft(EMPTY_SHIP_DRAFT)
      setShipActionMessage(`${trimmedName} was updated.`)
    } catch (updateError) {
      setShipActionMessage(updateError.message || 'Unable to update ship.')
    } finally {
      setShipActionId('')
    }
  }

  function requestDeleteShip(ship) {
    setPendingDelete({
      type: 'ship',
      id: ship.id,
      label: ship.name,
      message: `Delete ${ship.name}? This will also delete related sailings, itinerary days, and activities.`,
      confirmLabel: 'Delete Ship',
      payload: ship
    })
  }

  async function executeDeleteShip(ship) {
    setShipActionId(ship.id)
    setShipActionMessage(`Deleting ${ship.name}…`)

    try {
      await deleteShip(ship.id)
      await reloadSelectedShips()
      if (selectedShipForSailings?.id === ship.id) {
        clearSailings()
      }
      setShipActionMessage(`${ship.name} was deleted.`)
    } catch (deleteError) {
      setShipActionMessage(deleteError.message || 'Unable to delete ship.')
    } finally {
      setShipActionId('')
    }
  }

  async function reloadSelectedSailings(ship = selectedShipForSailings) {
    if (!ship?.id) {
      return []
    }

    const nextSailings = await getSailingsForShip(ship.id)
    setSailings(nextSailings)
    return nextSailings
  }

  async function handleViewSailings(ship) {
    setSelectedShipForSailings(ship)
    setSailings([])
    setSailingsError('')
    setSailingActionMessage('')
    setActiveSailingEditId('')
    setSailingEditDraft(EMPTY_SAILING_DRAFT)
    clearItinerary()
    setSailingsLoading(true)

    try {
      const nextSailings = await getSailingsForShip(ship.id)

      setSailings(nextSailings)
    } catch (loadError) {
      setSailingsError(loadError.message || 'No sailings found for this ship yet.')
    } finally {
      setSailingsLoading(false)
    }
  }

  async function handleCreateSailing(event) {
    event.preventDefault()

    if (!selectedShipForSailings?.id) {
      setSailingActionMessage('Select a ship before creating a sailing.')
      return
    }

    const payload = {
      departureDate: sailingDraft.departureDate.trim(),
      departurePort: sailingDraft.departurePort.trim(),
      arrivalPort: sailingDraft.arrivalPort.trim(),
      days: Number(sailingDraft.days),
      isRepositioning: Boolean(sailingDraft.isRepositioning)
    }

    if (!payload.departureDate || !payload.departurePort || !payload.arrivalPort || !Number.isFinite(payload.days) || payload.days <= 0) {
      setSailingActionMessage('Departure date, ports, and a valid day count are required.')
      return
    }

    setSailingActionId('create')
    setSailingActionMessage('Creating sailing…')

    try {
      await createSailing(selectedShipForSailings.id, payload)
      setSailingDraft(EMPTY_SAILING_DRAFT)
      await reloadSelectedSailings()
      clearItinerary()
      setSailingActionMessage(`${payload.departureDate} sailing was created for ${selectedShipForSailings.name}.`)
    } catch (createError) {
      setSailingActionMessage(createError.message || 'Unable to create sailing.')
    } finally {
      setSailingActionId('')
    }
  }

  function openSailingEdit(sailing) {
    setActiveSailingEditId(sailing.id)
    setSailingEditDraft(buildSailingEditDraft(sailing))
    setSailingActionMessage('')
  }

  function cancelSailingEdit() {
    setActiveSailingEditId('')
    setSailingEditDraft(EMPTY_SAILING_DRAFT)
    setSailingActionMessage('Sailing update was cancelled.')
  }

  async function handleUpdateSailing(event, sailing) {
    event.preventDefault()

    const payload = {
      departureDate: sailingEditDraft.departureDate.trim(),
      departurePort: sailingEditDraft.departurePort.trim(),
      arrivalPort: sailingEditDraft.arrivalPort.trim(),
      days: Number(sailingEditDraft.days),
      isRepositioning: Boolean(sailingEditDraft.isRepositioning)
    }

    if (!payload.departureDate || !payload.departurePort || !payload.arrivalPort || !Number.isFinite(payload.days) || payload.days <= 0) {
      setSailingActionMessage('Departure date, ports, and a valid day count are required.')
      return
    }

    setSailingActionId(sailing.id)
    setSailingActionMessage(`Updating ${sailing.departureDate}…`)

    try {
      await updateSailing(sailing.id, payload)
      await reloadSelectedSailings()
      if (selectedSailingForItinerary?.id === sailing.id) {
        clearItinerary()
      }
      setActiveSailingEditId('')
      setSailingEditDraft(EMPTY_SAILING_DRAFT)
      setSailingActionMessage(`${payload.departureDate} sailing was updated.`)
    } catch (updateError) {
      setSailingActionMessage(updateError.message || 'Unable to update sailing.')
    } finally {
      setSailingActionId('')
    }
  }

  function requestDeleteSailing(sailing) {
    setPendingDelete({
      type: 'sailing',
      id: sailing.id,
      label: getSailingDateLabel(sailing),
      message: `Delete sailing ${getSailingDateLabel(sailing)}?`,
      confirmLabel: 'Delete Sailing',
      payload: sailing
    })
  }

  async function executeDeleteSailing(sailing) {
    setSailingActionId(sailing.id)
    setSailingActionMessage(`Deleting ${getSailingDateLabel(sailing)}…`)

    try {
      await deleteSailing(sailing.id)
      await reloadSelectedSailings()
      if (selectedSailingForItinerary?.id === sailing.id) {
        clearItinerary()
      }
      setSailingActionMessage(`${getSailingDateLabel(sailing)} sailing was deleted.`)
    } catch (deleteError) {
      setSailingActionMessage(deleteError.message || 'Unable to delete sailing.')
    } finally {
      setSailingActionId('')
    }
  }

  async function reloadSelectedItinerary(sailing = selectedSailingForItinerary) {
    if (!sailing?.id) {
      return []
    }

    const nextItinerary = await getItineraryForSailing(sailing.id)
    setItineraryDays(nextItinerary)
    return nextItinerary
  }

  async function handleViewItinerary(sailing) {
    setSelectedSailingForItinerary(sailing)
    setItineraryDays([])
    setItineraryError('')
    setItineraryActionMessage('')
    setItineraryLoading(true)

    try {
      const nextItinerary = await getItineraryForSailing(sailing.id)

      setItineraryDays(nextItinerary)
    } catch (loadError) {
      setItineraryError(loadError.message || 'No itinerary found for this sailing yet.')
    } finally {
      setItineraryLoading(false)
    }
  }

  async function handleCreateItineraryDay(event) {
    event.preventDefault()

    if (!selectedSailingForItinerary?.id) {
      setItineraryActionMessage('Select a sailing before creating an itinerary day.')
      return
    }

    const payload = {
      day: Number(itineraryDayDraft.day),
      title: itineraryDayDraft.title.trim(),
      port: itineraryDayDraft.port.trim()
    }

    if (!Number.isFinite(payload.day) || payload.day <= 0 || !payload.title) {
      setItineraryActionMessage('Day number and title are required.')
      return
    }

    setItineraryActionId('create-day')
    setItineraryActionMessage('Creating itinerary day…')

    try {
      await createItineraryDay(selectedSailingForItinerary.id, payload)
      setItineraryDayDraft(EMPTY_ITINERARY_DAY_DRAFT)
      await reloadSelectedItinerary()
      setItineraryActionMessage(`Day ${payload.day} was created for this React itinerary.`)
    } catch (createError) {
      setItineraryActionMessage(createError.message || 'Unable to create itinerary day.')
    } finally {
      setItineraryActionId('')
    }
  }

  function openItineraryDayEdit(day) {
    setActiveItineraryDayEditId(day.id)
    setItineraryDayEditDraft(buildItineraryDayEditDraft(day))
    setItineraryActionMessage('')
  }

  function cancelItineraryDayEdit() {
    setActiveItineraryDayEditId('')
    setItineraryDayEditDraft(EMPTY_ITINERARY_DAY_DRAFT)
    setItineraryActionMessage('Itinerary day update was cancelled.')
  }

  async function handleUpdateItineraryDay(event, day) {
    event.preventDefault()

    const payload = {
      day: Number(itineraryDayEditDraft.day),
      title: itineraryDayEditDraft.title.trim(),
      port: itineraryDayEditDraft.port.trim()
    }

    if (!Number.isFinite(payload.day) || payload.day <= 0 || !payload.title) {
      setItineraryActionMessage('Day number and title are required.')
      return
    }

    setItineraryActionId(day.id)
    setItineraryActionMessage(`Updating day ${day.day}…`)

    try {
      await updateItineraryDay(day.id, payload)
      await reloadSelectedItinerary()
      setActiveItineraryDayEditId('')
      setItineraryDayEditDraft(EMPTY_ITINERARY_DAY_DRAFT)
      setItineraryActionMessage(`Day ${payload.day} was updated in this React itinerary.`)
    } catch (updateError) {
      setItineraryActionMessage(updateError.message || 'Unable to update itinerary day.')
    } finally {
      setItineraryActionId('')
    }
  }

  function requestDeleteItineraryDay(day) {
    setPendingDelete({
      type: 'itineraryDay',
      id: day.id,
      label: `Day ${day.day}`,
      message: `Delete itinerary day ${day.day}?`,
      confirmLabel: 'Delete Day',
      payload: day
    })
  }

  async function executeDeleteItineraryDay(day) {
    setItineraryActionId(day.id)
    setItineraryActionMessage(`Deleting day ${day.day}…`)

    try {
      await deleteItineraryDay(day.id)
      await reloadSelectedItinerary()
      setItineraryActionMessage(`Day ${day.day} was deleted from this React itinerary.`)
    } catch (deleteError) {
      setItineraryActionMessage(deleteError.message || 'Unable to delete itinerary day.')
    } finally {
      setItineraryActionId('')
    }
  }

  async function handleCreateItineraryActivity(event) {
    event.preventDefault()

    const itineraryDayId = activityDraft.itineraryDayId.trim()

    if (!itineraryDayId) {
      setItineraryActionMessage('Select an itinerary day before creating an activity.')
      return
    }

    const payload = {
      time: activityDraft.time.trim(),
      activity: activityDraft.activity.trim()
    }

    if (!payload.time || !payload.activity) {
      setItineraryActionMessage('Activity time and description are required.')
      return
    }

    setItineraryActionId('create-activity')
    setItineraryActionMessage('Creating activity…')

    try {
      await createItineraryActivity(itineraryDayId, payload)
      setActivityDraft(EMPTY_ACTIVITY_DRAFT)
      await reloadSelectedItinerary()
      setItineraryActionMessage(`${payload.activity} was added to this React itinerary.`)
    } catch (createError) {
      setItineraryActionMessage(createError.message || 'Unable to create itinerary activity.')
    } finally {
      setItineraryActionId('')
    }
  }

  function openActivityEdit(activity) {
    setActiveActivityEditId(activity.id)
    setActivityEditDraft(buildActivityEditDraft(activity))
    setItineraryActionMessage('')
  }

  function cancelActivityEdit() {
    setActiveActivityEditId('')
    setActivityEditDraft({ time: '', activity: '' })
    setItineraryActionMessage('Activity update was cancelled.')
  }

  async function handleUpdateItineraryActivity(event, activity) {
    event.preventDefault()

    const payload = {
      time: activityEditDraft.time.trim(),
      activity: activityEditDraft.activity.trim()
    }

    if (!payload.time || !payload.activity) {
      setItineraryActionMessage('Activity time and description are required.')
      return
    }

    setItineraryActionId(activity.id)
    setItineraryActionMessage(`Updating ${activity.activity}…`)

    try {
      await updateItineraryActivity(activity.id, payload)
      await reloadSelectedItinerary()
      setActiveActivityEditId('')
      setActivityEditDraft({ time: '', activity: '' })
      setItineraryActionMessage(`${payload.activity} was updated in this React itinerary.`)
    } catch (updateError) {
      setItineraryActionMessage(updateError.message || 'Unable to update itinerary activity.')
    } finally {
      setItineraryActionId('')
    }
  }

  function requestDeleteItineraryActivity(activity) {
    setPendingDelete({
      type: 'activity',
      id: activity.id,
      label: activity.activity,
      message: `Delete activity ${activity.activity}?`,
      confirmLabel: 'Delete Activity',
      payload: activity
    })
  }

  async function executeDeleteItineraryActivity(activity) {
    setItineraryActionId(activity.id)
    setItineraryActionMessage(`Deleting ${activity.activity}…`)

    try {
      await deleteItineraryActivity(activity.id)
      await reloadSelectedItinerary()
      setItineraryActionMessage(`${activity.activity} was deleted from this React itinerary.`)
    } catch (deleteError) {
      setItineraryActionMessage(deleteError.message || 'Unable to delete itinerary activity.')
    } finally {
      setItineraryActionId('')
    }
  }

  function openCruiseLineEdit(cruiseLine) {
    setActiveCruiseLineEditId(cruiseLine.id)
    setCruiseLineDraft(buildCruiseLineDraft(cruiseLine))
    setFleetActionMessage('')
  }

  function cancelCruiseLineEdit() {
    setActiveCruiseLineEditId('')
    setCruiseLineDraft(EMPTY_CRUISE_LINE_DRAFT)
    setFleetActionMessage('Cruise line update was cancelled.')
  }

  async function handleUpdateCruiseLine(event, cruiseLine) {
    event.preventDefault()

    const trimmedName = cruiseLineDraft.name.trim()

    if (!trimmedName) {
      setFleetActionMessage('Cruise line name is required.')
      return
    }

    setUpdatingCruiseLineId(cruiseLine.id)
    setFleetActionMessage(`Updating ${cruiseLine.name}…`)

    try {
      const payload = {
        name: trimmedName,
        country: cruiseLineDraft.country.trim(),
        website: cruiseLineDraft.website.trim()
      }

      const updatedCruiseLine = await updateCruiseLine(cruiseLine.id, payload)

      if (selectedCruiseLine?.id === cruiseLine.id) {
        setSelectedCruiseLine({
          ...selectedCruiseLine,
          ...updatedCruiseLine,
          ...payload,
          id: cruiseLine.id
        })
      }

      setActiveCruiseLineEditId('')
      setCruiseLineDraft(EMPTY_CRUISE_LINE_DRAFT)
      await onRefresh?.()
      setFleetActionMessage(`${trimmedName} was updated in the React fleet directory.`)
    } catch (updateError) {
      setFleetActionMessage(updateError.message || 'Unable to update this cruise line.')
    } finally {
      setUpdatingCruiseLineId('')
    }
  }

  function requestDeleteCruiseLine(cruiseLine) {
    setPendingDelete({
      type: 'cruiseLine',
      id: cruiseLine.id,
      label: cruiseLine.name,
      message: `Delete ${cruiseLine.name}? This also removes its ships.`,
      confirmLabel: 'Delete Cruise Line',
      payload: cruiseLine
    })
  }

  async function executeDeleteCruiseLine(cruiseLine) {
    setDeletingCruiseLineId(cruiseLine.id)
    setFleetActionMessage('')
    setShipsError('')

    try {
      await deleteCruiseLine(cruiseLine.id)

      if (selectedCruiseLine?.id === cruiseLine.id) {
        setSelectedCruiseLine(null)
        setSelectedShips([])
        clearSailings()
      }

      await onRefresh?.()
      setFleetActionMessage(`${cruiseLine.name} was deleted from the React fleet directory.`)
    } catch (deleteError) {
      setFleetActionMessage(deleteError.message || 'Unable to delete this cruise line.')
    } finally {
      setDeletingCruiseLineId('')
    }
  }

  async function confirmPendingDelete() {
    const action = pendingDelete
    if (!action) return

    try {
      if (action.type === 'cruiseLine') await executeDeleteCruiseLine(action.payload)
      if (action.type === 'ship') await executeDeleteShip(action.payload)
      if (action.type === 'sailing') await executeDeleteSailing(action.payload)
      if (action.type === 'itineraryDay') await executeDeleteItineraryDay(action.payload)
      if (action.type === 'activity') await executeDeleteItineraryActivity(action.payload)
    } finally {
      setPendingDelete(null)
    }
  }

  function cancelPendingDelete() {
    setPendingDelete(null)
    setFleetActionMessage('Delete action was cancelled.')
  }

  return (
    <section className="react-app-section fleet-directory-section" id="react-fleet" aria-labelledby="react-fleet-heading" data-testid="react-fleet-directory">
      <div className="section-heading-row fleet-heading-row">
        <div>
          <p className="eyebrow">Fleet dashboard</p>
          <h2 id="react-fleet-heading">Cruise Line Directory</h2>
          <p>
            Search, review, and manage the cruise lines currently available in the live application dataset.
          </p>
        </div>
        <button type="button" className="button-link secondary light-action" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing fleet…' : 'Refresh fleet'}
        </button>
      </div>

      <label className="search-control fleet-search-control">
        <span>Search cruise lines</span>
        <input
          type="search"
          placeholder="Search cruise lines..."
          aria-describedby="react-fleet-count"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          data-testid="react-fleet-search"
        />
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      {fleetActionMessage && <p className="muted-status" role="status" data-testid="react-fleet-action-message">{fleetActionMessage}</p>}
      <ConfirmActionPanel
        title="Confirm fleet delete"
        message={pendingDelete?.message}
        confirmLabel={pendingDelete?.confirmLabel}
        onConfirm={confirmPendingDelete}
        onCancel={cancelPendingDelete}
        isWorking={Boolean(deletingCruiseLineId || shipActionId || sailingActionId || itineraryActionId)}
        testId="react-fleet-delete-confirmation"
      />
      {isLoading && <p className="muted-status">Loading cruise line directory…</p>}

      <p id="react-fleet-count" className="muted-status" data-testid="react-fleet-count">
        Showing {visibleCruiseLines.length} of {filteredCruiseLines.length} matching cruise lines.
      </p>

      <div className="fleet-card-grid" data-testid="react-fleet-card-grid">
        {visibleCruiseLines.map(cruiseLine => (
          <article className="fleet-card" key={cruiseLine.id || cruiseLine.name} data-testid="react-fleet-card">
            <h3>{cruiseLine.name}</h3>
            <p><strong>Country:</strong> {cruiseLine.country || 'Not provided'}</p>
            {cruiseLine.website && (
              <a href={cruiseLine.website} target="_blank" rel="noreferrer">Visit website</a>
            )}
            <div className="fleet-card-actions" aria-label={`Actions for ${cruiseLine.name}`}>
              <button
                type="button"
                className="fleet-primary-action"
                onClick={() => handleViewShips(cruiseLine)}
                data-testid="react-view-ships-button"
              >
                View Ships
              </button>
              <button
                type="button"
                className="fleet-primary-action"
                onClick={() => openCruiseLineEdit(cruiseLine)}
                disabled={updatingCruiseLineId === cruiseLine.id}
                data-testid="react-update-cruise-line-button"
              >
                {updatingCruiseLineId === cruiseLine.id ? 'Updating…' : 'Update'}
              </button>
              <button
                type="button"
                className="fleet-danger-action"
                onClick={() => requestDeleteCruiseLine(cruiseLine)}
                disabled={deletingCruiseLineId === cruiseLine.id}
                data-testid="react-delete-cruise-line-button"
              >
                {deletingCruiseLineId === cruiseLine.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
            {activeCruiseLineEditId === cruiseLine.id && (
              <form className="react-inline-edit-form" onSubmit={event => handleUpdateCruiseLine(event, cruiseLine)} data-testid="react-cruise-line-edit-form">
                <h4>Edit cruise line</h4>
                <div className="react-inline-edit-grid">
                  <label>
                    <span>Cruise line name</span>
                    <input
                      value={cruiseLineDraft.name}
                      onChange={event => setCruiseLineDraft(current => ({ ...current, name: event.target.value }))}
                      data-testid="react-edit-cruise-line-name"
                    />
                  </label>
                  <label>
                    <span>Country</span>
                    <input
                      value={cruiseLineDraft.country}
                      onChange={event => setCruiseLineDraft(current => ({ ...current, country: event.target.value }))}
                      data-testid="react-edit-cruise-line-country"
                    />
                  </label>
                  <label>
                    <span>Website</span>
                    <input
                      value={cruiseLineDraft.website}
                      onChange={event => setCruiseLineDraft(current => ({ ...current, website: event.target.value }))}
                      data-testid="react-edit-cruise-line-website"
                    />
                  </label>
                </div>
                <div className="react-inline-edit-actions">
                  <button type="submit" className="fleet-primary-action" disabled={updatingCruiseLineId === cruiseLine.id} data-testid="react-save-cruise-line-edit">
                    {updatingCruiseLineId === cruiseLine.id ? 'Saving…' : 'Save Cruise Line'}
                  </button>
                  <button type="button" className="fleet-secondary-action" onClick={cancelCruiseLineEdit} data-testid="react-cancel-cruise-line-edit">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </article>
        ))}
      </div>

      {visibleCruiseLines.length === 0 && !isLoading && (
        <p className="muted-status" data-testid="react-fleet-empty-state">No cruise lines match the current search.</p>
      )}

      <section
        className="react-selected-ships-panel"
        aria-labelledby="react-selected-ships-heading"
        data-testid="react-selected-ships-panel"
      >
        <div className="selected-ships-heading-row">
          <div>
            <p className="eyebrow">Selected fleet</p>
            <h3 id="react-selected-ships-heading">
              {selectedCruiseLine ? `${selectedCruiseLine.name} ships` : 'Select a cruise line to view ships'}
            </h3>
          </div>
          {selectedCruiseLine && (
            <span className="selected-ships-count" data-testid="react-selected-ships-count">
              {selectedShips.length} ships
            </span>
          )}
        </div>

        {!selectedCruiseLine && (
          <p className="muted-status">Use View Ships on a cruise line card to load its current fleet.</p>
        )}

        {selectedCruiseLine && (
          <form className="react-ship-create-form" onSubmit={handleCreateShip} data-testid="react-create-ship-form">
            <h4>Add Ship</h4>
            <div className="react-ship-form-grid">
              <label>
                <span>Ship name</span>
                <input
                  value={shipDraft.name}
                  onChange={event => setShipDraft(current => ({ ...current, name: event.target.value }))}
                  placeholder="Example: Rotterdam"
                  data-testid="react-create-ship-name-input"
                />
              </label>
              <label>
                <span>Current port</span>
                <input
                  value={shipDraft.currentPort}
                  onChange={event => setShipDraft(current => ({ ...current, currentPort: event.target.value }))}
                  placeholder="Miami, Florida"
                  data-testid="react-create-ship-current-port-input"
                />
              </label>
            </div>
            <button type="submit" className="fleet-primary-action" disabled={shipActionId === 'create'} data-testid="react-create-ship-submit-button">
              {shipActionId === 'create' ? 'Creating…' : 'Create Ship'}
            </button>
          </form>
        )}

        {shipsLoading && <p className="muted-status">Loading ships…</p>}
        {shipsError && <p className="error" role="alert">{shipsError}</p>}
        {shipActionMessage && <p className="muted-status" role="status" data-testid="react-ship-action-message">{shipActionMessage}</p>}

        {selectedCruiseLine && !shipsLoading && !shipsError && selectedShips.length === 0 && (
          <p className="muted-status">No ships are currently listed for this cruise line.</p>
        )}

        {selectedShips.length > 0 && (
          <div className="react-ship-card-grid" data-testid="react-ship-card-grid">
            {selectedShips.map(ship => (
              <article className="react-ship-card" key={ship.id || ship.name} data-testid="react-ship-card">
                <h4>{ship.name}</h4>
                <p><strong>Current port:</strong> {getCurrentPortLabel(ship)}</p>
                <div className="react-ship-card-actions">
                  <button type="button" className="fleet-primary-action" onClick={() => handleViewSailings(ship)} data-testid="react-view-sailings-button">
                    View Sailings
                  </button>
                  <button type="button" className="fleet-primary-action" onClick={() => openShipEdit(ship)} disabled={shipActionId === ship.id} data-testid="react-update-ship-button">
                    Update Ship
                  </button>
                  <button type="button" className="fleet-danger-action" onClick={() => requestDeleteShip(ship)} disabled={shipActionId === ship.id} data-testid="react-delete-ship-button">
                    Delete Ship
                  </button>
                </div>
                {activeShipEditId === ship.id && (
                  <form className="react-inline-edit-form" onSubmit={event => handleUpdateShip(event, ship)} data-testid="react-ship-edit-form">
                    <h5>Edit ship</h5>
                    <div className="react-inline-edit-grid">
                      <label>
                        <span>Ship name</span>
                        <input
                          value={shipEditDraft.name}
                          onChange={event => setShipEditDraft(current => ({ ...current, name: event.target.value }))}
                          data-testid="react-edit-ship-name"
                        />
                      </label>
                      <label>
                        <span>Current port</span>
                        <input
                          value={shipEditDraft.currentPort}
                          onChange={event => setShipEditDraft(current => ({ ...current, currentPort: event.target.value }))}
                          data-testid="react-edit-ship-current-port"
                        />
                      </label>
                    </div>
                    <div className="react-inline-edit-actions">
                      <button type="submit" className="fleet-primary-action" disabled={shipActionId === ship.id} data-testid="react-save-ship-edit">
                        {shipActionId === ship.id ? 'Saving…' : 'Save Ship'}
                      </button>
                      <button type="button" className="fleet-secondary-action" onClick={cancelShipEdit} data-testid="react-cancel-ship-edit">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedShipForSailings && (
        <section className="react-sailings-panel" aria-labelledby="react-sailings-heading" data-testid="react-sailings-panel">
          <div className="selected-ships-heading-row">
            <div>
              <p className="eyebrow">Selected ship</p>
              <h3 id="react-sailings-heading">{selectedShipForSailings.name} Sailings</h3>
            </div>
            <span className="selected-ships-count" data-testid="react-sailings-count">{sailings.length} sailings</span>
          </div>

          <form className="react-sailing-create-form" onSubmit={handleCreateSailing} data-testid="react-create-sailing-form">
            <h4>Create Sailing</h4>
            <div className="react-sailing-form-grid">
              <label>
                <span>Departure date</span>
                <input
                  value={sailingDraft.departureDate}
                  onChange={event => setSailingDraft(current => ({ ...current, departureDate: event.target.value }))}
                  placeholder="2026-10-01"
                  data-testid="react-create-sailing-departure-date"
                />
              </label>
              <label>
                <span>Departure port</span>
                <input
                  value={sailingDraft.departurePort}
                  onChange={event => setSailingDraft(current => ({ ...current, departurePort: event.target.value }))}
                  placeholder="Miami, Florida"
                  data-testid="react-create-sailing-departure-port"
                />
              </label>
              <label>
                <span>Arrival port</span>
                <input
                  value={sailingDraft.arrivalPort}
                  onChange={event => setSailingDraft(current => ({ ...current, arrivalPort: event.target.value }))}
                  placeholder="Nassau, Bahamas"
                  data-testid="react-create-sailing-arrival-port"
                />
              </label>
              <label>
                <span>Days</span>
                <input
                  value={sailingDraft.days}
                  onChange={event => setSailingDraft(current => ({ ...current, days: event.target.value }))}
                  placeholder="4"
                  data-testid="react-create-sailing-days"
                />
              </label>
              <label className="react-checkbox-label">
                <input
                  type="checkbox"
                  checked={sailingDraft.isRepositioning}
                  onChange={event => setSailingDraft(current => ({ ...current, isRepositioning: event.target.checked }))}
                  data-testid="react-create-sailing-repositioning"
                />
                <span>Repositioning sailing</span>
              </label>
            </div>
            <button type="submit" className="fleet-primary-action" disabled={sailingActionId === 'create'} data-testid="react-create-sailing-submit-button">
              {sailingActionId === 'create' ? 'Creating…' : 'Create Sailing'}
            </button>
          </form>

          {sailingActionMessage && <p className="muted-status" role="status" data-testid="react-sailing-action-message">{sailingActionMessage}</p>}

          {sailingsLoading && <p className="muted-status">Loading sailings…</p>}
          {sailingsError && <p className="error" role="alert">{sailingsError}</p>}

          {!sailingsLoading && !sailingsError && sailings.length === 0 && (
            <p className="muted-status">No sailings found for this ship yet.</p>
          )}

          {sailings.length > 0 && (
            <div className="react-sailing-card-grid" data-testid="react-sailing-card-grid">
              {sailings.map(sailing => (
                <article className="react-sailing-card" key={sailing.id || sailing.departureDate} data-testid="react-sailing-card">
                  <h4>{getSailingDateLabel(sailing)}</h4>
                  <p><strong>Type:</strong> {getSailingTypeLabel(sailing)}</p>
                  <p><strong>Departure Port:</strong> {sailing.departurePort || sailing.port || 'Unavailable'}</p>
                  <p><strong>Arrival Port:</strong> {sailing.arrivalPort || sailing.port || 'Unavailable'}</p>
                  <p><strong>Length:</strong> {sailing.days || 'Unavailable'} days</p>
                  <div className="react-sailing-card-actions">
                    <button
                      type="button"
                      className="fleet-primary-action"
                      onClick={() => handleViewItinerary(sailing)}
                      data-testid="react-view-itinerary-button"
                    >
                      View Itinerary
                    </button>
                    <button
                      type="button"
                      className="fleet-primary-action"
                      onClick={() => openSailingEdit(sailing)}
                      disabled={sailingActionId === sailing.id}
                      data-testid="react-update-sailing-button"
                    >
                      Update Sailing
                    </button>
                    <button
                      type="button"
                      className="fleet-danger-action"
                      onClick={() => requestDeleteSailing(sailing)}
                      disabled={sailingActionId === sailing.id}
                      data-testid="react-delete-sailing-button"
                    >
                      Delete Sailing
                    </button>
                  </div>
                  {activeSailingEditId === sailing.id && (
                    <form className="react-inline-edit-form" onSubmit={event => handleUpdateSailing(event, sailing)} data-testid="react-sailing-edit-form">
                      <h5>Edit sailing</h5>
                      <div className="react-inline-edit-grid four-column-edit-grid">
                        <label>
                          <span>Departure date</span>
                          <input value={sailingEditDraft.departureDate} onChange={event => setSailingEditDraft(current => ({ ...current, departureDate: event.target.value }))} data-testid="react-edit-sailing-departure-date" />
                        </label>
                        <label>
                          <span>Departure port</span>
                          <input value={sailingEditDraft.departurePort} onChange={event => setSailingEditDraft(current => ({ ...current, departurePort: event.target.value }))} data-testid="react-edit-sailing-departure-port" />
                        </label>
                        <label>
                          <span>Arrival port</span>
                          <input value={sailingEditDraft.arrivalPort} onChange={event => setSailingEditDraft(current => ({ ...current, arrivalPort: event.target.value }))} data-testid="react-edit-sailing-arrival-port" />
                        </label>
                        <label>
                          <span>Days</span>
                          <input value={sailingEditDraft.days} onChange={event => setSailingEditDraft(current => ({ ...current, days: event.target.value }))} data-testid="react-edit-sailing-days" />
                        </label>
                        <label className="react-checkbox-label inline-edit-checkbox">
                          <input type="checkbox" checked={sailingEditDraft.isRepositioning} onChange={event => setSailingEditDraft(current => ({ ...current, isRepositioning: event.target.checked }))} data-testid="react-edit-sailing-repositioning" />
                          <span>Repositioning sailing</span>
                        </label>
                      </div>
                      <div className="react-inline-edit-actions">
                        <button type="submit" className="fleet-primary-action" disabled={sailingActionId === sailing.id} data-testid="react-save-sailing-edit">
                          {sailingActionId === sailing.id ? 'Saving…' : 'Save Sailing'}
                        </button>
                        <button type="button" className="fleet-secondary-action" onClick={cancelSailingEdit} data-testid="react-cancel-sailing-edit">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedSailingForItinerary && (
        <section className="react-itinerary-panel" aria-labelledby="react-itinerary-heading" data-testid="react-itinerary-panel">
          <div className="selected-ships-heading-row">
            <div>
              <p className="eyebrow">Selected sailing</p>
              <h3 id="react-itinerary-heading">{getSailingDateLabel(selectedSailingForItinerary)} Itinerary</h3>
            </div>
            <span className="selected-ships-count" data-testid="react-itinerary-count">{itineraryDays.length} days</span>
          </div>

          <form className="react-itinerary-create-form" onSubmit={handleCreateItineraryDay} data-testid="react-create-itinerary-day-form">
            <h4>Create Itinerary Day</h4>
            <div className="react-itinerary-form-grid">
              <label>
                <span>Day</span>
                <input value={itineraryDayDraft.day} onChange={event => setItineraryDayDraft(current => ({ ...current, day: event.target.value }))} data-testid="react-create-itinerary-day-number" />
              </label>
              <label>
                <span>Title</span>
                <input value={itineraryDayDraft.title} onChange={event => setItineraryDayDraft(current => ({ ...current, title: event.target.value }))} data-testid="react-create-itinerary-day-title" />
              </label>
              <label>
                <span>Port</span>
                <input value={itineraryDayDraft.port} onChange={event => setItineraryDayDraft(current => ({ ...current, port: event.target.value }))} data-testid="react-create-itinerary-day-port" />
              </label>
            </div>
            <button type="submit" className="fleet-primary-action" disabled={itineraryActionId === 'create-day'} data-testid="react-create-itinerary-day-submit-button">
              {itineraryActionId === 'create-day' ? 'Creating…' : 'Create Itinerary Day'}
            </button>
          </form>

          <form className="react-itinerary-create-form" onSubmit={handleCreateItineraryActivity} data-testid="react-create-itinerary-activity-form">
            <h4>Create Activity</h4>
            <div className="react-itinerary-form-grid">
              <label>
                <span>Itinerary Day</span>
                <select value={activityDraft.itineraryDayId} onChange={event => setActivityDraft(current => ({ ...current, itineraryDayId: event.target.value }))} data-testid="react-create-itinerary-activity-day-select">
                  <option value="">Choose a day</option>
                  {itineraryDays.map(day => (
                    <option key={day.id} value={day.id}>{getItineraryDayLabel(day)}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Time</span>
                <input value={activityDraft.time} onChange={event => setActivityDraft(current => ({ ...current, time: event.target.value }))} data-testid="react-create-itinerary-activity-time" />
              </label>
              <label>
                <span>Activity</span>
                <input value={activityDraft.activity} onChange={event => setActivityDraft(current => ({ ...current, activity: event.target.value }))} data-testid="react-create-itinerary-activity-name" />
              </label>
            </div>
            <button type="submit" className="fleet-primary-action" disabled={itineraryActionId === 'create-activity'} data-testid="react-create-itinerary-activity-submit-button">
              {itineraryActionId === 'create-activity' ? 'Creating…' : 'Create Activity'}
            </button>
          </form>

          {itineraryActionMessage && <p className="muted-status" role="status" data-testid="react-itinerary-action-message">{itineraryActionMessage}</p>}

          {itineraryLoading && <p className="muted-status">Loading itinerary…</p>}
          {itineraryError && <p className="error" role="alert">{itineraryError}</p>}

          {!itineraryLoading && !itineraryError && itineraryDays.length === 0 && (
            <p className="muted-status">No itinerary found for this sailing yet.</p>
          )}

          {itineraryDays.length > 0 && (
            <div className="react-itinerary-day-grid" data-testid="react-itinerary-day-grid">
              {itineraryDays.map(day => (
                <article className="react-itinerary-day-card" key={day.id || `${selectedSailingForItinerary.id}-${day.day}`} data-testid="react-itinerary-day-card">
                  <h4>{getItineraryDayLabel(day)}</h4>
                  <p><strong>Port:</strong> {day.port || 'At Sea'}</p>
                  <div className="react-itinerary-card-actions">
                    <button type="button" className="fleet-primary-action" onClick={() => openItineraryDayEdit(day)} disabled={itineraryActionId === day.id} data-testid="react-update-itinerary-day-button">Update Day</button>
                    <button type="button" className="fleet-danger-action" onClick={() => requestDeleteItineraryDay(day)} disabled={itineraryActionId === day.id} data-testid="react-delete-itinerary-day-button">Delete Day</button>
                  </div>
                  {activeItineraryDayEditId === day.id && (
                    <form className="react-inline-edit-form" onSubmit={event => handleUpdateItineraryDay(event, day)} data-testid="react-itinerary-day-edit-form">
                      <h5>Edit itinerary day</h5>
                      <div className="react-inline-edit-grid">
                        <label>
                          <span>Day</span>
                          <input value={itineraryDayEditDraft.day} onChange={event => setItineraryDayEditDraft(current => ({ ...current, day: event.target.value }))} data-testid="react-edit-itinerary-day-number" />
                        </label>
                        <label>
                          <span>Title</span>
                          <input value={itineraryDayEditDraft.title} onChange={event => setItineraryDayEditDraft(current => ({ ...current, title: event.target.value }))} data-testid="react-edit-itinerary-day-title" />
                        </label>
                        <label>
                          <span>Port</span>
                          <input value={itineraryDayEditDraft.port} onChange={event => setItineraryDayEditDraft(current => ({ ...current, port: event.target.value }))} data-testid="react-edit-itinerary-day-port" />
                        </label>
                      </div>
                      <div className="react-inline-edit-actions">
                        <button type="submit" className="fleet-primary-action" disabled={itineraryActionId === day.id} data-testid="react-save-itinerary-day-edit">
                          {itineraryActionId === day.id ? 'Saving…' : 'Save Day'}
                        </button>
                        <button type="button" className="fleet-secondary-action" onClick={cancelItineraryDayEdit} data-testid="react-cancel-itinerary-day-edit">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                  <ul className="react-itinerary-activity-list" data-testid="react-itinerary-activity-list">
                    {(day.activitySchedule || []).length === 0 ? (
                      <li>No scheduled activities yet.</li>
                    ) : day.activitySchedule.map(activity => (
                      <li key={activity.id || `${day.id}-${activity.time}-${activity.activity}`} data-testid="react-itinerary-activity">
                        <strong>{activity.time || 'Time TBD'}:</strong> {activity.activity || 'Activity TBD'}
                        <div className="react-itinerary-card-actions">
                          <button type="button" className="fleet-primary-action" onClick={() => openActivityEdit(activity)} disabled={itineraryActionId === activity.id} data-testid="react-update-itinerary-activity-button">Update Activity</button>
                          <button type="button" className="fleet-danger-action" onClick={() => requestDeleteItineraryActivity(activity)} disabled={itineraryActionId === activity.id} data-testid="react-delete-itinerary-activity-button">Delete Activity</button>
                        </div>
                        {activeActivityEditId === activity.id && (
                          <form className="react-inline-edit-form activity-inline-edit-form" onSubmit={event => handleUpdateItineraryActivity(event, activity)} data-testid="react-itinerary-activity-edit-form">
                            <h5>Edit activity</h5>
                            <div className="react-inline-edit-grid two-column-edit-grid">
                              <label>
                                <span>Time</span>
                                <input value={activityEditDraft.time} onChange={event => setActivityEditDraft(current => ({ ...current, time: event.target.value }))} data-testid="react-edit-itinerary-activity-time" />
                              </label>
                              <label>
                                <span>Activity</span>
                                <input value={activityEditDraft.activity} onChange={event => setActivityEditDraft(current => ({ ...current, activity: event.target.value }))} data-testid="react-edit-itinerary-activity-name" />
                              </label>
                            </div>
                            <div className="react-inline-edit-actions">
                              <button type="submit" className="fleet-primary-action" disabled={itineraryActionId === activity.id} data-testid="react-save-itinerary-activity-edit">
                                {itineraryActionId === activity.id ? 'Saving…' : 'Save Activity'}
                              </button>
                              <button type="button" className="fleet-secondary-action" onClick={cancelActivityEdit} data-testid="react-cancel-itinerary-activity-edit">
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </section>
  )
}
