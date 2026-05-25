export function createCustomerDraft(customer = {}) {
  return {
    id: customer.id || '',
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    email: customer.email || '',
    phone: customer.phone || '',
    loyaltyNumber: customer.loyaltyNumber || ''
  }
}

export function updateCustomerDraftField(draft = {}, fieldName, value) {
  if (!Object.prototype.hasOwnProperty.call(draft, fieldName)) {
    return { ...draft }
  }

  return {
    ...draft,
    [fieldName]: value
  }
}

export function validateCustomerDraft(draft = {}) {
  const errors = {}

  if (!draft.firstName?.trim()) errors.firstName = 'First name is required.'
  if (!draft.lastName?.trim()) errors.lastName = 'Last name is required.'
  if (!draft.email?.trim()) {
    errors.email = 'Email is required.'
  } else if (!draft.email.includes('@')) {
    errors.email = 'Email must contain @.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function summarizeCustomerDraftChanges(customer = {}, draft = {}) {
  return ['firstName', 'lastName', 'email', 'phone', 'loyaltyNumber']
    .filter(fieldName => (customer[fieldName] || '') !== (draft[fieldName] || ''))
}
