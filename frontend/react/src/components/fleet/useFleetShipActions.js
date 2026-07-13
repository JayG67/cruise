import {
  createShip,
  deleteShip,
  getShipsForCruiseLine,
  updateShip
} from '../../api/client.js'

import {
  EMPTY_SHIP_DRAFT,
  buildShipEditDraft
} from './fleetDirectoryUtils.js'

export default function useFleetShipActions({
  selectedCruiseLine,
  selectedShipForSailings,
  shipDraft,
  shipEditDraft,
  setSelectedCruiseLine,
  setSelectedShips,
  setShipsLoading,
  setShipsError,
  setFleetActionMessage,
  setShipDraft,
  setActiveShipEditId,
  setShipEditDraft,
  setShipActionMessage,
  setShipActionId,
  setPendingDelete,
  clearSailings
}) {
  async function reloadSelectedShips(cruiseLine = selectedCruiseLine) {
    if (!cruiseLine?.id) return []
    const ships = await getShipsForCruiseLine(cruiseLine.id)
    setSelectedShips(ships)
    return ships
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
      setSelectedShips(await getShipsForCruiseLine(cruiseLine.id))
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
      if (selectedShipForSailings?.id === ship.id) clearSailings()
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
      if (selectedShipForSailings?.id === ship.id) clearSailings()
      setShipActionMessage(`${ship.name} was deleted.`)
    } catch (deleteError) {
      setShipActionMessage(deleteError.message || 'Unable to delete ship.')
    } finally {
      setShipActionId('')
    }
  }

  return {
    handleViewShips,
    handleCreateShip,
    openShipEdit,
    cancelShipEdit,
    handleUpdateShip,
    requestDeleteShip,
    executeDeleteShip
  }
}
