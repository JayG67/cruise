export function formatTurnaroundSetupRefreshSummary(response = {}) {
  return `Setup data reloaded. ${response.turnaroundPeople?.length || 0} people, ${response.ships?.length || 0} ships, and ${response.sailings?.length || 0} sailings available.`
}

export function reconcileTurnaroundSetupDraft(current = {}, response = {}) {
  const cruiseLines = response.cruiseLines || []
  const ships = response.ships || []
  const sailings = response.sailings || []
  const cruiseLineId = cruiseLines.some(line => line.id === current.cruiseLineId)
    ? current.cruiseLineId
    : cruiseLines[0]?.id || ''
  const assignedShipId = ships.some(ship => ship.id === current.assignedShipId && ship.cruiseLineId === cruiseLineId)
    ? current.assignedShipId
    : ''
  const sailingId = sailings.some(sailing => sailing.id === current.sailingId && sailing.shipId === assignedShipId)
    ? current.sailingId
    : ''

  return { ...current, cruiseLineId, assignedShipId, sailingId }
}
