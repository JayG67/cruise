import { useCallback, useState } from 'react'
import { updateBookingDetails } from '../api/client.js'

function getPassengerPayload(passenger = {}) {
  return {
    customerId: passenger.customerId || passenger.customer?.id || '',
    passengerRole: passenger.passengerRole || 'GUEST',
    isPrimaryGuest: Boolean(passenger.isPrimaryGuest),
    diningPreference: passenger.diningPreference || 'Main Dining',
    accessibilityNotes: passenger.accessibilityNotes || '',
    boardingGroup: passenger.boardingGroup || 'A'
  }
}

export default function useBookingDetailsMutation({ onSaved } = {}) {
  const [savingBookingId, setSavingBookingId] = useState('')
  const [bookingMutationError, setBookingMutationError] = useState('')

  const saveBookingDetails = useCallback(async (booking, draft) => {
    const bookingId = booking?.id || draft?.id

    setSavingBookingId(bookingId)
    setBookingMutationError('')

    try {
      const response = await updateBookingDetails(bookingId, {
        sailingId: booking.sailingId || booking.sailing?.id,
        bookingStatus: draft.bookingStatus.trim(),
        cabinNumber: draft.cabinNumber.trim(),
        fareCode: draft.fareCode.trim(),
        embarkationPort: draft.embarkationPort.trim(),
        debarkationPort: draft.debarkationPort.trim(),
        createdByCustomerId: booking.createdByCustomerId || null,
        passengers: (booking.passengers || []).map(getPassengerPayload)
      })

      if (onSaved) onSaved()

      return response
    } catch (error) {
      const message = error.message || 'Unable to save the React booking draft.'
      setBookingMutationError(message)
      throw new Error(message)
    } finally {
      setSavingBookingId('')
    }
  }, [onSaved])

  return {
    saveBookingDetails,
    savingBookingId,
    bookingMutationError
  }
}
