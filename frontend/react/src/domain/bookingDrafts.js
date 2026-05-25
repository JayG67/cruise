export function createBookingDraft(booking = {}) {
  return {
    id: booking.id || '',
    bookingStatus: booking.bookingStatus || '',
    cabinNumber: booking.cabinNumber || '',
    fareCode: booking.fareCode || '',
    embarkationPort: booking.embarkationPort || booking.sailing?.departurePort || '',
    debarkationPort: booking.debarkationPort || booking.sailing?.arrivalPort || ''
  }
}

export function updateBookingDraftField(draft = {}, fieldName, value) {
  if (!Object.prototype.hasOwnProperty.call(draft, fieldName)) {
    return { ...draft }
  }

  return {
    ...draft,
    [fieldName]: value
  }
}

export function validateBookingDraft(draft = {}) {
  const errors = {}

  if (!draft.bookingStatus?.trim()) errors.bookingStatus = 'Booking status is required.'
  if (!draft.cabinNumber?.trim()) errors.cabinNumber = 'Cabin number is required.'
  if (!draft.embarkationPort?.trim()) errors.embarkationPort = 'Embarkation port is required.'
  if (!draft.debarkationPort?.trim()) errors.debarkationPort = 'Debarkation port is required.'

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function summarizeBookingDraftChanges(booking = {}, draft = {}) {
  const currentValues = {
    bookingStatus: booking.bookingStatus || '',
    cabinNumber: booking.cabinNumber || '',
    fareCode: booking.fareCode || '',
    embarkationPort: booking.embarkationPort || booking.sailing?.departurePort || '',
    debarkationPort: booking.debarkationPort || booking.sailing?.arrivalPort || ''
  }

  return Object.keys(currentValues)
    .filter(fieldName => currentValues[fieldName] !== (draft[fieldName] || ''))
}
