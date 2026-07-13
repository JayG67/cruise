import {
  deleteCruiseLine,
  updateCruiseLine
} from '../../api/client.js'

import {
  EMPTY_CRUISE_LINE_DRAFT,
  buildCruiseLineDraft
} from './fleetDirectoryUtils.js'

export default function useFleetCruiseLineActions({
  selectedCruiseLine,
  setSelectedCruiseLine,
  setSelectedShips,
  clearSailings,
  onRefresh,
  cruiseLineDraft,
  setCruiseLineDraft,
  setFleetActionMessage,
  setShipsError,
  setPendingDelete,
  setDeletingCruiseLineId,
  setUpdatingCruiseLineId,
  setActiveCruiseLineEditId
}) {
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
        website: cruiseLineDraft.website.trim(),
        brandFamily: cruiseLineDraft.brandFamily.trim(),
        brandTheme: cruiseLineDraft.brandTheme.trim(),
        marketPositioning: cruiseLineDraft.marketPositioning.trim()
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
      const deletedMessage = `${cruiseLine.name} was deleted from the React fleet directory.`
      setFleetActionMessage(deletedMessage)

      if (selectedCruiseLine?.id === cruiseLine.id) {
        setSelectedCruiseLine(null)
        setSelectedShips([])
        clearSailings()
      }

      await onRefresh?.()
      setFleetActionMessage(deletedMessage)
    } catch (deleteError) {
      setFleetActionMessage(deleteError.message || 'Unable to delete this cruise line.')
    } finally {
      setDeletingCruiseLineId('')
    }
  }

  return {
    openCruiseLineEdit,
    cancelCruiseLineEdit,
    handleUpdateCruiseLine,
    requestDeleteCruiseLine,
    executeDeleteCruiseLine
  }
}
