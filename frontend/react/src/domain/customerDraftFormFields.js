export const customerDraftFields = [
  { name: 'firstName', label: 'First name', autoComplete: 'given-name', required: true, type: 'text' },
  { name: 'lastName', label: 'Last name', autoComplete: 'family-name', required: true, type: 'text' },
  { name: 'email', label: 'Email', autoComplete: 'email', required: true, type: 'email' },
  { name: 'phone', label: 'Phone', autoComplete: 'tel', required: false, type: 'tel' },
  { name: 'loyaltyNumber', label: 'Loyalty number', autoComplete: 'off', required: false, type: 'text' }
]

export function getCustomerDraftFieldNames() {
  return customerDraftFields.map(field => field.name)
}

export function getRequiredCustomerDraftFieldNames() {
  return customerDraftFields
    .filter(field => field.required)
    .map(field => field.name)
}
