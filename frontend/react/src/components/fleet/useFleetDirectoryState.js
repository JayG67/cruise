import { useMemo, useState } from 'react'

import {
  EMPTY_ACTIVITY_DRAFT,
  EMPTY_CRUISE_LINE_DRAFT,
  EMPTY_ITINERARY_DAY_DRAFT,
  EMPTY_SAILING_DRAFT,
  EMPTY_SHIP_DRAFT
} from './fleetDirectoryUtils.js'
import useFleetCruiseLineActions from './useFleetCruiseLineActions.js'
import useFleetItineraryActions from './useFleetItineraryActions.js'
import useFleetSailingActions from './useFleetSailingActions.js'
import useFleetShipActions from './useFleetShipActions.js'

const EMPTY_ACTIVITY_EDIT_DRAFT = { time: '', activity: '' }

export default function useFleetDirectoryState({ cruiseLines = [], onRefresh }) {
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
  const [activityEditDraft, setActivityEditDraft] = useState(EMPTY_ACTIVITY_EDIT_DRAFT)

  const filteredCruiseLines = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return cruiseLines
    return cruiseLines.filter(cruiseLine => [cruiseLine.name, cruiseLine.country]
      .some(value => String(value || '').toLowerCase().includes(normalizedSearch)))
  }, [cruiseLines, searchTerm])

  const visibleCruiseLines = filteredCruiseLines.slice(0, 8)

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
    setActivityEditDraft(EMPTY_ACTIVITY_EDIT_DRAFT)
  }

  function clearSailings() {
    setSelectedShipForSailings(null)
    setSailings([])
    setSailingsError('')
    setSailingsLoading(false)
    clearItinerary()
  }

  const cruiseLineActions = useFleetCruiseLineActions({
    selectedCruiseLine, setSelectedCruiseLine, setSelectedShips, clearSailings, onRefresh,
    cruiseLineDraft, setCruiseLineDraft, setFleetActionMessage, setShipsError, setPendingDelete,
    setDeletingCruiseLineId, setUpdatingCruiseLineId, setActiveCruiseLineEditId
  })

  const shipActions = useFleetShipActions({
    selectedCruiseLine, selectedShipForSailings, shipDraft, shipEditDraft,
    setSelectedCruiseLine, setSelectedShips, setShipsLoading, setShipsError,
    setFleetActionMessage, setShipDraft, setActiveShipEditId, setShipEditDraft,
    setShipActionMessage, setShipActionId, setPendingDelete, clearSailings
  })

  const sailingActions = useFleetSailingActions({
    selectedShipForSailings, selectedSailingForItinerary, sailingDraft, sailingEditDraft,
    setSelectedShipForSailings, setSailings, setSailingsLoading, setSailingsError,
    setSailingDraft, setSailingActionMessage, setSailingActionId, setActiveSailingEditId,
    setSailingEditDraft, setPendingDelete, clearItinerary
  })

  const itineraryActions = useFleetItineraryActions({
    selectedSailingForItinerary, itineraryDayDraft, itineraryDayEditDraft, activityDraft,
    activityEditDraft, setSelectedSailingForItinerary, setItineraryDays, setItineraryLoading,
    setItineraryError, setItineraryDayDraft, setActivityDraft, setItineraryActionMessage,
    setItineraryActionId, setActiveItineraryDayEditId, setItineraryDayEditDraft,
    setActiveActivityEditId, setActivityEditDraft, setPendingDelete
  })

  async function confirmPendingDelete() {
    const action = pendingDelete
    if (!action) return
    try {
      if (action.type === 'cruiseLine') await cruiseLineActions.executeDeleteCruiseLine(action.payload)
      if (action.type === 'ship') await shipActions.executeDeleteShip(action.payload)
      if (action.type === 'sailing') await sailingActions.executeDeleteSailing(action.payload)
      if (action.type === 'itineraryDay') await itineraryActions.executeDeleteItineraryDay(action.payload)
      if (action.type === 'activity') await itineraryActions.executeDeleteItineraryActivity(action.payload)
    } finally {
      setPendingDelete(null)
    }
  }

  function cancelPendingDelete() {
    setPendingDelete(null)
    setFleetActionMessage('Delete action was cancelled.')
  }

  return {
    searchTerm, setSearchTerm, selectedCruiseLine, selectedShips, shipsLoading, shipsError,
    fleetActionMessage, deletingCruiseLineId, pendingDelete, updatingCruiseLineId,
    activeCruiseLineEditId, cruiseLineDraft, setCruiseLineDraft, shipDraft, setShipDraft,
    activeShipEditId, shipEditDraft, setShipEditDraft, shipActionMessage, shipActionId,
    selectedShipForSailings, sailings, sailingsLoading, sailingsError, sailingDraft,
    setSailingDraft, sailingActionMessage, sailingActionId, activeSailingEditId,
    sailingEditDraft, setSailingEditDraft, selectedSailingForItinerary, itineraryDays,
    itineraryLoading, itineraryError, itineraryDayDraft, setItineraryDayDraft,
    activityDraft, setActivityDraft, itineraryActionMessage, itineraryActionId,
    activeItineraryDayEditId, itineraryDayEditDraft, setItineraryDayEditDraft,
    activeActivityEditId, activityEditDraft, setActivityEditDraft, filteredCruiseLines,
    visibleCruiseLines, ...shipActions, ...sailingActions, ...itineraryActions,
    openCruiseLineEdit: cruiseLineActions.openCruiseLineEdit,
    cancelCruiseLineEdit: cruiseLineActions.cancelCruiseLineEdit,
    handleUpdateCruiseLine: cruiseLineActions.handleUpdateCruiseLine,
    requestDeleteCruiseLine: cruiseLineActions.requestDeleteCruiseLine,
    confirmPendingDelete,
    cancelPendingDelete
  }
}
