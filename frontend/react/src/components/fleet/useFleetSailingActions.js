import {
  createSailing,
  deleteSailing,
  getSailingsForShip,
  updateSailing
} from '../../api/client.js'

import {
  EMPTY_SAILING_DRAFT,
  buildSailingEditDraft,
  getSailingDateLabel
} from './fleetDirectoryUtils.js'

export default function useFleetSailingActions({
  selectedShipForSailings,
  selectedSailingForItinerary,
  sailingDraft,
  sailingEditDraft,
  setSelectedShipForSailings,
  setSailings,
  setSailingsLoading,
  setSailingsError,
  setSailingDraft,
  setSailingActionMessage,
  setSailingActionId,
  setActiveSailingEditId,
  setSailingEditDraft,
  setPendingDelete,
  clearItinerary
}) {
  async function reloadSelectedSailings(ship = selectedShipForSailings) {
    if (!ship?.id) return []
    const nextSailings = await getSailingsForShip(ship.id)
    setSailings(nextSailings)
    return nextSailings
  }

  async function handleViewSailings(ship) {
    setSelectedShipForSailings(ship)
    window.setTimeout(() => {
      document.getElementById('react-sailings-heading')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }, 0)
    setSailings([])
    setSailingsError('')
    setSailingActionMessage('')
    setActiveSailingEditId('')
    setSailingEditDraft(EMPTY_SAILING_DRAFT)
    clearItinerary()
    setSailingsLoading(true)

    try {
      setSailings(await getSailingsForShip(ship.id))
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
      if (selectedSailingForItinerary?.id === sailing.id) clearItinerary()
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
      if (selectedSailingForItinerary?.id === sailing.id) clearItinerary()
      setSailingActionMessage(`${getSailingDateLabel(sailing)} sailing was deleted.`)
    } catch (deleteError) {
      setSailingActionMessage(deleteError.message || 'Unable to delete sailing.')
    } finally {
      setSailingActionId('')
    }
  }

  return {
    handleViewSailings,
    handleCreateSailing,
    openSailingEdit,
    cancelSailingEdit,
    handleUpdateSailing,
    requestDeleteSailing,
    executeDeleteSailing
  }
}
