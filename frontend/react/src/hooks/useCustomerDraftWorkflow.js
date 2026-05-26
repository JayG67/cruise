import { useState } from 'react'
import {
  createCustomerDraft,
  summarizeCustomerDraftChanges,
  updateCustomerDraftField,
  validateCustomerDraft
} from '../domain/customerDrafts.js'
import {
  createMutationErrorFeedback,
  createNoChangesFeedback,
  createSaveSuccessFeedback,
  createSaveUnavailableFeedback,
  createValidationFeedback
} from '../domain/draftFeedback.js'

export function useCustomerDraftWorkflow({ onSaveCustomerDraft, mutationError = '' } = {}) {
  const [customerDrafts, setCustomerDrafts] = useState(() => ({}))
  const [customerDraftMessages, setCustomerDraftMessages] = useState(() => ({}))

  function openCustomerDraft(customer) {
    setCustomerDrafts(current => ({
      ...current,
      [customer.id]: createCustomerDraft(customer)
    }))
    setCustomerDraftMessages(current => ({
      ...current,
      [customer.id]: ''
    }))
  }

  function updateCustomerDraft(customerId, fieldName, value) {
    setCustomerDrafts(current => ({
      ...current,
      [customerId]: updateCustomerDraftField(current[customerId], fieldName, value)
    }))
  }

  function clearCustomerDraft(customerId) {
    setCustomerDrafts(current => {
      const nextDrafts = { ...current }
      delete nextDrafts[customerId]
      return nextDrafts
    })
    setCustomerDraftMessages(current => {
      const nextMessages = { ...current }
      delete nextMessages[customerId]
      return nextMessages
    })
  }

  function validateCustomerDraftFor(customer) {
    const draft = customerDrafts[customer.id]
    const validation = validateCustomerDraft(draft)
    const changedFields = summarizeCustomerDraftChanges(customer, draft)

    setCustomerDraftMessages(current => ({
      ...current,
      [customer.id]: createValidationFeedback(
        validation,
        `Draft is valid with ${changedFields.length} changed fields. Use Save draft to exercise the React mutation boundary.`
      )
    }))

    return { draft, validation, changedFields }
  }

  async function saveCustomerDraftFor(customer) {
    const { draft, validation, changedFields } = validateCustomerDraftFor(customer)

    if (!validation.isValid) return

    if (changedFields.length === 0) {
      setCustomerDraftMessages(current => ({
        ...current,
        [customer.id]: createNoChangesFeedback('customer')
      }))
      return
    }

    if (!onSaveCustomerDraft) {
      setCustomerDraftMessages(current => ({
        ...current,
        [customer.id]: createSaveUnavailableFeedback('Customer')
      }))
      return
    }

    try {
      const result = await onSaveCustomerDraft(customer.id, draft)
      setCustomerDraftMessages(current => ({
        ...current,
        [customer.id]: createSaveSuccessFeedback(result?.message || 'Customer draft saved through the React mutation boundary.')
      }))
      setCustomerDrafts(current => {
        const nextDrafts = { ...current }
        delete nextDrafts[customer.id]
        return nextDrafts
      })
    } catch (saveError) {
      setCustomerDraftMessages(current => ({
        ...current,
        [customer.id]: createMutationErrorFeedback(saveError, mutationError || 'Unable to save customer draft.')
      }))
    }
  }

  return {
    customerDrafts,
    customerDraftMessages,
    openCustomerDraft,
    updateCustomerDraft,
    validateCustomerDraftFor,
    saveCustomerDraftFor,
    cancelCustomerDraft: clearCustomerDraft
  }
}
