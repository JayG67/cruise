export const bookingDraftFields = [
  { name: 'bookingStatus', label: 'Status' },
  { name: 'cabinNumber', label: 'Cabin' },
  { name: 'fareCode', label: 'Fare code' },
  { name: 'embarkationPort', label: 'Embarkation port' },
  { name: 'debarkationPort', label: 'Debarkation port' }
]

export function getBookingDraftFieldNames() {
  return bookingDraftFields.map(field => field.name)
}
