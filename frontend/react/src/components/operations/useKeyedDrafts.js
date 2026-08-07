import { useState } from 'react'

export function useKeyedDrafts(buildDraft) {
  const [drafts, setDrafts] = useState({})

  function getDraft(key, ...builderArguments) {
    return drafts[key] ?? buildDraft(...builderArguments)
  }

  function updateDraft(key, fieldName, value, ...builderArguments) {
    setDrafts(current => ({
      ...current,
      [key]: {
        ...(current[key] ?? buildDraft(...builderArguments)),
        [fieldName]: value
      }
    }))
  }

  function setDraft(key, value) {
    setDrafts(current => ({ ...current, [key]: value }))
  }

  function clearDraft(key) {
    setDrafts(current => {
      if (!(key in current)) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  return { getDraft, updateDraft, setDraft, clearDraft }
}
