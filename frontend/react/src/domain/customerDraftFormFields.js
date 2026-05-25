export const customerDraftFields = [
  { name: 'firstName', label: 'First name', autoComplete: 'given-name' },
  { name: 'lastName', label: 'Last name', autoComplete: 'family-name' },
  { name: 'email', label: 'Email', autoComplete: 'email' },
  { name: 'phone', label: 'Phone', autoComplete: 'tel' },
  { name: 'loyaltyNumber', label: 'Loyalty number', autoComplete: 'off' }
]

export function getCustomerDraftFieldNames() {
  return customerDraftFields.map(field => field.name)
}
