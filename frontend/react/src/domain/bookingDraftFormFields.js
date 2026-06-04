export const bookingDraftFields = [
  { name: 'bookingStatus', label: 'Status', required: true, type: 'text', autoComplete: 'off' },
  { name: 'cabinNumber', label: 'Cabin', required: true, type: 'text', autoComplete: 'off' },
  { name: 'fareCode', label: 'Fare code', required: false, type: 'text', autoComplete: 'off' },
  { name: 'embarkationPort', label: 'Embarkation port', required: true, type: 'text', autoComplete: 'off' },
  { name: 'debarkationPort', label: 'Debarkation port', required: true, type: 'text', autoComplete: 'off' }
]

export function getBookingDraftFieldNames() {
  return bookingDraftFields.map(field => field.name)
}

export function getRequiredBookingDraftFieldNames() {
  return bookingDraftFields
    .filter(field => field.required)
    .map(field => field.name)
}
