import {
  createItineraryActivity,
  createItineraryDay,
  deleteItineraryActivity,
  deleteItineraryDay,
  getItineraryForSailing,
  updateItineraryActivity,
  updateItineraryDay
} from '../../api/client.js'

import { createFleetItineraryActionLifecycle } from './fleetItineraryActionLifecycle.js'

import {
  EMPTY_ACTIVITY_DRAFT,
  EMPTY_ITINERARY_DAY_DRAFT,
  buildActivityEditDraft,
  buildItineraryDayEditDraft
} from './fleetDirectoryUtils.js'

const EMPTY_ACTIVITY_EDIT_DRAFT = { time: '', activity: '' }

export default function useFleetItineraryActions({
  selectedSailingForItinerary,
  itineraryDayDraft,
  itineraryDayEditDraft,
  activityDraft,
  activityEditDraft,
  setSelectedSailingForItinerary,
  setItineraryDays,
  setItineraryLoading,
  setItineraryError,
  setItineraryDayDraft,
  setActivityDraft,
  setItineraryActionMessage,
  setItineraryActionId,
  setActiveItineraryDayEditId,
  setItineraryDayEditDraft,
  setActiveActivityEditId,
  setActivityEditDraft,
  setPendingDelete
}) {
  async function reloadSelectedItinerary(sailing = selectedSailingForItinerary) {
    if (!sailing?.id) return []
    const nextItinerary = await getItineraryForSailing(sailing.id)
    setItineraryDays(nextItinerary)
    return nextItinerary
  }

  const runItineraryAction = createFleetItineraryActionLifecycle({
    reloadItinerary: reloadSelectedItinerary,
    setActionId: setItineraryActionId,
    setActionMessage: setItineraryActionMessage
  })

  async function handleViewItinerary(sailing) {
    setSelectedSailingForItinerary(sailing)
    setItineraryDays([])
    setItineraryError('')
    setItineraryActionMessage('')
    setItineraryLoading(true)
    try {
      const nextItinerary = await getItineraryForSailing(sailing.id)
      setItineraryDays(nextItinerary)
      return nextItinerary
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
    await runItineraryAction({
      actionId: 'create-day',
      pendingMessage: 'Creating itinerary day…',
      execute: () => createItineraryDay(selectedSailingForItinerary.id, payload),
      afterSuccess: () => setItineraryDayDraft(EMPTY_ITINERARY_DAY_DRAFT),
      successMessage: `Day ${payload.day} was created for this itinerary.`,
      errorMessage: 'Unable to create itinerary day.'
    })
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
    await runItineraryAction({
      actionId: day.id,
      pendingMessage: `Updating day ${day.day}…`,
      execute: () => updateItineraryDay(day.id, payload),
      afterSuccess: () => {
        setActiveItineraryDayEditId('')
        setItineraryDayEditDraft(EMPTY_ITINERARY_DAY_DRAFT)
      },
      successMessage: `Day ${payload.day} was updated in this itinerary.`,
      errorMessage: 'Unable to update itinerary day.'
    })
  }

  function requestDeleteItineraryDay(day) {
    setPendingDelete({
      type: 'itineraryDay', id: day.id, label: `Day ${day.day}`,
      message: `Delete itinerary day ${day.day}?`, confirmLabel: 'Delete Day', payload: day
    })
  }

  async function executeDeleteItineraryDay(day) {
    await runItineraryAction({
      actionId: day.id,
      pendingMessage: `Deleting day ${day.day}…`,
      execute: () => deleteItineraryDay(day.id),
      successMessage: `Day ${day.day} was deleted from this itinerary.`,
      errorMessage: 'Unable to delete itinerary day.'
    })
  }

  async function handleCreateItineraryActivity(event) {
    event.preventDefault()
    const itineraryDayId = activityDraft.itineraryDayId.trim()
    if (!itineraryDayId) {
      setItineraryActionMessage('Select an itinerary day before creating an activity.')
      return
    }
    const payload = { time: activityDraft.time.trim(), activity: activityDraft.activity.trim() }
    if (!payload.time || !payload.activity) {
      setItineraryActionMessage('Activity time and description are required.')
      return
    }
    await runItineraryAction({
      actionId: 'create-activity',
      pendingMessage: 'Creating activity…',
      execute: () => createItineraryActivity(itineraryDayId, payload),
      afterSuccess: () => setActivityDraft(EMPTY_ACTIVITY_DRAFT),
      successMessage: `${payload.activity} was added to this itinerary.`,
      errorMessage: 'Unable to create itinerary activity.'
    })
  }

  function openActivityEdit(activity) {
    setActiveActivityEditId(activity.id)
    setActivityEditDraft(buildActivityEditDraft(activity))
    setItineraryActionMessage('')
  }

  function cancelActivityEdit() {
    setActiveActivityEditId('')
    setActivityEditDraft(EMPTY_ACTIVITY_EDIT_DRAFT)
    setItineraryActionMessage('Activity update was cancelled.')
  }

  async function handleUpdateItineraryActivity(event, activity) {
    event.preventDefault()
    const payload = { time: activityEditDraft.time.trim(), activity: activityEditDraft.activity.trim() }
    if (!payload.time || !payload.activity) {
      setItineraryActionMessage('Activity time and description are required.')
      return
    }
    await runItineraryAction({
      actionId: activity.id,
      pendingMessage: `Updating ${activity.activity}…`,
      execute: () => updateItineraryActivity(activity.id, payload),
      afterSuccess: () => {
        setActiveActivityEditId('')
        setActivityEditDraft(EMPTY_ACTIVITY_EDIT_DRAFT)
      },
      successMessage: `${payload.activity} was updated in this itinerary.`,
      errorMessage: 'Unable to update itinerary activity.'
    })
  }

  function requestDeleteItineraryActivity(activity) {
    setPendingDelete({
      type: 'activity', id: activity.id, label: activity.activity,
      message: `Delete activity ${activity.activity}?`, confirmLabel: 'Delete Activity', payload: activity
    })
  }

  async function executeDeleteItineraryActivity(activity) {
    await runItineraryAction({
      actionId: activity.id,
      pendingMessage: `Deleting ${activity.activity}…`,
      execute: () => deleteItineraryActivity(activity.id),
      successMessage: `${activity.activity} was deleted from this itinerary.`,
      errorMessage: 'Unable to delete itinerary activity.'
    })
  }

  return {
    handleViewItinerary,
    handleCreateItineraryDay,
    openItineraryDayEdit,
    cancelItineraryDayEdit,
    handleUpdateItineraryDay,
    requestDeleteItineraryDay,
    executeDeleteItineraryDay,
    handleCreateItineraryActivity,
    openActivityEdit,
    cancelActivityEdit,
    handleUpdateItineraryActivity,
    requestDeleteItineraryActivity,
    executeDeleteItineraryActivity
  }
}
