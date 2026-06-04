import { useState } from 'react'
import {
  createBookingDraft,
  summarizeBookingDraftChanges,
  updateBookingDraftField,
  validateBookingDraft
} from '../domain/bookingDrafts.js'
import {
  createMutationErrorFeedback,
  createNoChangesFeedback,
  createSaveSuccessFeedback,
  createSaveUnavailableFeedback,
  createValidationFeedback
} from '../domain/draftFeedback.js'
import { createBookingExpansionKey } from '../domain/hierarchyExpansionState.js'

export function useBookingDraftWorkflow({ onSaveBookingDraft, bookingMutationError = '' } = {}) {
  const [bookingDrafts, setBookingDrafts] = useState(() => ({}))
  const [bookingDraftMessages, setBookingDraftMessages] = useState(() => ({}))

  function openBookingDraft(customerId, booking) {
    const bookingKey = createBookingExpansionKey(customerId, booking.id)

    setBookingDrafts(current => ({
      ...current,
      [bookingKey]: createBookingDraft(booking)
    }))
    setBookingDraftMessages(current => ({
      ...current,
      [bookingKey]: ''
    }))
  }

  function updateBookingDraft(bookingKey, fieldName, value) {
    setBookingDrafts(current => ({
      ...current,
      [bookingKey]: updateBookingDraftField(current[bookingKey], fieldName, value)
    }))
  }

  function clearBookingDraft(bookingKey) {
    setBookingDrafts(current => {
      const nextDrafts = { ...current }
      delete nextDrafts[bookingKey]
      return nextDrafts
    })
    setBookingDraftMessages(current => {
      const nextMessages = { ...current }
      delete nextMessages[bookingKey]
      return nextMessages
    })
  }

  function validateBookingDraftFor(customerId, booking) {
    const bookingKey = createBookingExpansionKey(customerId, booking.id)
    const draft = bookingDrafts[bookingKey]
    const validation = validateBookingDraft(draft)
    const changedFields = summarizeBookingDraftChanges(booking, draft)

    setBookingDraftMessages(current => ({
      ...current,
      [bookingKey]: createValidationFeedback(
        validation,
        `Booking draft is valid with ${changedFields.length} changed fields. Use Save booking draft to exercise the React booking mutation boundary.`
      )
    }))

    return { draft, validation, changedFields }
  }

  async function saveBookingDraftFor(customerId, booking) {
    const bookingKey = createBookingExpansionKey(customerId, booking.id)
    const { draft, validation, changedFields } = validateBookingDraftFor(customerId, booking)

    if (!validation.isValid) return

    if (changedFields.length === 0) {
      setBookingDraftMessages(current => ({
        ...current,
        [bookingKey]: createNoChangesFeedback('booking')
      }))
      return
    }

    if (!onSaveBookingDraft) {
      setBookingDraftMessages(current => ({
        ...current,
        [bookingKey]: createSaveUnavailableFeedback('Booking')
      }))
      return
    }

    try {
      const result = await onSaveBookingDraft(booking, draft)
      setBookingDraftMessages(current => ({
        ...current,
        [bookingKey]: createSaveSuccessFeedback(result?.message || 'Booking draft saved through the React mutation boundary.')
      }))
      setBookingDrafts(current => {
        const nextDrafts = { ...current }
        delete nextDrafts[bookingKey]
        return nextDrafts
      })
    } catch (saveError) {
      setBookingDraftMessages(current => ({
        ...current,
        [bookingKey]: createMutationErrorFeedback(saveError, bookingMutationError || 'Unable to save booking draft.')
      }))
    }
  }

  return {
    bookingDrafts,
    bookingDraftMessages,
    openBookingDraft,
    updateBookingDraft,
    validateBookingDraftFor,
    saveBookingDraftFor,
    cancelBookingDraft: clearBookingDraft
  }
}
