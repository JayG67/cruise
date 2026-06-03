import { useCallback, useState } from 'react'

import { createCruiseLine, createShip } from '../api/client.js'

const INITIAL_DRAFT = {
  name: '',
  country: '',
  website: '',
  brandFamily: '',
  brandTheme: '',
  marketPositioning: '',
  ships: [{ name: '', currentPort: '' }]
}

function normalizeOptional(value) {
  const trimmed = value.trim()
  return trimmed || undefined
}

function normalizeShips(ships) {
  const seenNames = new Set()

  return ships
    .map(ship => ({
      name: ship.name.trim(),
      currentPort: ship.currentPort.trim()
    }))
    .filter(ship => ship.name)
    .filter(ship => {
      const key = ship.name.toLowerCase()
      if (seenNames.has(key)) return false
      seenNames.add(key)
      return true
    })
}

export default function useCruiseLineCreateWorkflow({ onCreated } = {}) {
  const [draft, setDraft] = useState(INITIAL_DRAFT)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const updateField = useCallback((fieldName, value) => {
    setDraft(current => ({
      ...current,
      [fieldName]: value
    }))
  }, [])

  const updateShip = useCallback((index, fieldName, value) => {
    setDraft(current => ({
      ...current,
      ships: current.ships.map((ship, shipIndex) =>
        shipIndex === index ? { ...ship, [fieldName]: value } : ship
      )
    }))
  }, [])

  const addShipRow = useCallback(() => {
    setDraft(current => ({
      ...current,
      ships: [...current.ships, { name: '', currentPort: '' }]
    }))
  }, [])

  const removeShipRow = useCallback(index => {
    setDraft(current => ({
      ...current,
      ships: current.ships.length === 1
        ? [{ name: '', currentPort: '' }]
        : current.ships.filter((_, shipIndex) => shipIndex !== index)
    }))
  }, [])

  const reset = useCallback(() => {
    setDraft(INITIAL_DRAFT)
    setMessage('')
  }, [])

  const save = useCallback(async () => {
    const name = draft.name.trim()
    const country = normalizeOptional(draft.country)
    const website = normalizeOptional(draft.website)
    const brandFamily = normalizeOptional(draft.brandFamily)
    const brandTheme = normalizeOptional(draft.brandTheme)
    const marketPositioning = normalizeOptional(draft.marketPositioning)
    const ships = normalizeShips(draft.ships)

    if (!name) {
      setMessage('Cruise line name is required.')
      return
    }

    setIsSaving(true)
    setMessage('Creating cruise line…')

    try {
      const createdCruiseLine = await createCruiseLine({ name, country, website, brandFamily, brandTheme, marketPositioning })

      for (const ship of ships) {
        await createShip({
          ...ship,
          currentPort: ship.currentPort || country || 'Port to be assigned',
          cruiseLineId: createdCruiseLine.id
        })
      }

      setDraft(INITIAL_DRAFT)
      setMessage(`${name} created successfully${ships.length ? ` with ${ships.length} starter ship${ships.length === 1 ? '' : 's'}` : ''}.`)
      await onCreated?.()
    } catch (error) {
      setMessage(error.message || 'Unable to create cruise line.')
    } finally {
      setIsSaving(false)
    }
  }, [draft, onCreated])

  return {
    draft,
    isSaving,
    message,
    updateField,
    updateShip,
    addShipRow,
    removeShipRow,
    save,
    reset
  }
}
