import { useCallback, useState } from 'react'
import { updateCustomerProfile, updatePassengerProfile } from '../api/client.js'

function trimOptional(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function hasPassengerProfileFields(draft = {}) {
  return Object.prototype.hasOwnProperty.call(draft, 'diningPreference') ||
    Object.prototype.hasOwnProperty.call(draft, 'accessibilityNotes')
}

export default function useCustomerProfileMutation({ onSaved } = {}) {
  const [savingCustomerId, setSavingCustomerId] = useState('')
  const [mutationError, setMutationError] = useState('')

  const saveCustomerProfile = useCallback(async (customerId, draft) => {
    setSavingCustomerId(customerId)
    setMutationError('')

    try {
      const basePayload = {
        firstName: trimOptional(draft.firstName),
        lastName: trimOptional(draft.lastName),
        email: trimOptional(draft.email),
        phone: trimOptional(draft.phone)
      }

      const response = hasPassengerProfileFields(draft)
        ? await updatePassengerProfile(customerId, {
          ...basePayload,
          diningPreference: trimOptional(draft.diningPreference),
          accessibilityNotes: trimOptional(draft.accessibilityNotes)
        })
        : await updateCustomerProfile(customerId, {
          ...basePayload,
          loyaltyNumber: trimOptional(draft.loyaltyNumber)
        })

      if (onSaved) onSaved()

      return response
    } catch (error) {
      const message = error.message || 'Unable to save the React customer profile.'
      setMutationError(message)
      throw new Error(message)
    } finally {
      setSavingCustomerId('')
    }
  }, [onSaved])

  return {
    saveCustomerProfile,
    savingCustomerId,
    mutationError
  }
}
