import { useEffect, useState } from 'react'
import {
  getItineraryForSailing,
  getSailingsForShip,
  getShipsForCruiseLine
} from '../api/client.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function hasPersistentId(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

export default function useAuthoritativeSailingItinerary({
  cruiseLineId,
  shipId,
  shipName,
  sailingId,
  departureDate
} = {}) {
  const [itinerary, setItinerary] = useState(null)

  useEffect(() => {
    let active = true
    setItinerary(null)

    async function loadItinerary() {
      let resolvedSailingId = hasPersistentId(sailingId) ? sailingId : ''

      if (!resolvedSailingId && hasPersistentId(cruiseLineId)) {
        const ships = await getShipsForCruiseLine(cruiseLineId)
        const selectedShip = ships.find(ship => (
          (hasPersistentId(shipId) && ship.id === shipId)
          || ship.name === shipName
        ))

        if (!selectedShip?.id) return null

        const sailings = await getSailingsForShip(selectedShip.id)
        const selectedSailing = sailings.find(sailing => (
          (hasPersistentId(sailingId) && sailing.id === sailingId)
          || sailing.departureDate === departureDate
        ))

        resolvedSailingId = selectedSailing?.id || ''
      }

      if (!resolvedSailingId) return null
      return getItineraryForSailing(resolvedSailingId)
    }

    loadItinerary()
      .then(nextItinerary => {
        if (active) setItinerary(Array.isArray(nextItinerary) ? nextItinerary : null)
      })
      .catch(() => {
        if (active) setItinerary(null)
      })

    return () => { active = false }
  }, [cruiseLineId, shipId, shipName, sailingId, departureDate])

  return itinerary
}
