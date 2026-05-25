import { useCallback, useState } from 'react'
import { updateCustomerProfile } from '../api/client.js'

export default function useCustomerProfileMutation({ onSaved } = {}) {
  const [savingCustomerId, setSavingCustomerId] = useState('')
  const [mutationError, setMutationError] = useState('')

  const saveCustomerProfile = useCallback(async (customerId, draft) => {
    setSavingCustomerId(customerId)
    setMutationError('')

    try {
      const response = await updateCustomerProfile(customerId, {
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        loyaltyNumber: draft.loyaltyNumber.trim()
      })

      if (onSaved) onSaved()

      return response
    } catch (error) {
      const message = error.message || 'Unable to save the React customer draft.'
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
