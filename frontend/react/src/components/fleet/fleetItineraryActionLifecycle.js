export function createFleetItineraryActionLifecycle({
  reloadItinerary,
  setActionId,
  setActionMessage
}) {
  return async function runItineraryAction({
    actionId,
    pendingMessage,
    execute,
    successMessage,
    errorMessage,
    afterSuccess
  }) {
    setActionId(actionId)
    setActionMessage(pendingMessage)

    try {
      await execute()
      await reloadItinerary()
      afterSuccess?.()
      setActionMessage(successMessage)
      return true
    } catch (error) {
      setActionMessage(error.message || errorMessage)
      return false
    } finally {
      setActionId('')
    }
  }
}
