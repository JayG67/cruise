import {
  createItineraryActivity,
  createItineraryDay,
  deleteItineraryActivity,
  deleteItineraryDay,
  getItineraryForSailing,
  updateItineraryActivity,
  updateItineraryDay
} from '../../api/client.js'

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

  async function handleViewItinerary(sailing) {
    setSelectedSailingForItinerary(sailing)
    setItineraryDays([])
    setItineraryError('')
    setItineraryActionMessage('')
    setItineraryLoading(true)
    try {
      setItineraryDays(await getItineraryForSailing(sailing.id))
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
      type: 'itineraryDay', id: day.id, label: `Day ${day.day}`,
      message: `Delete itinerary day ${day.day}?`, confirmLabel: 'Delete Day', payload: day
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
    const payload = { time: activityDraft.time.trim(), activity: activityDraft.activity.trim() }
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
    setItineraryActionId(activity.id)
    setItineraryActionMessage(`Updating ${activity.activity}…`)
    try {
      await updateItineraryActivity(activity.id, payload)
      await reloadSelectedItinerary()
      setActiveActivityEditId('')
      setActivityEditDraft(EMPTY_ACTIVITY_EDIT_DRAFT)
      setItineraryActionMessage(`${payload.activity} was updated in this React itinerary.`)
    } catch (updateError) {
      setItineraryActionMessage(updateError.message || 'Unable to update itinerary activity.')
    } finally {
      setItineraryActionId('')
    }
  }

  function requestDeleteItineraryActivity(activity) {
    setPendingDelete({
      type: 'activity', id: activity.id, label: activity.activity,
      message: `Delete activity ${activity.activity}?`, confirmLabel: 'Delete Activity', payload: activity
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
