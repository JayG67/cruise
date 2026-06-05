import { useCallback, useEffect, useRef, useState } from 'react'

import { getTurnaroundOperations } from '../api/client.js'

export default function useTurnaroundOperations({ enabled = true } = {}) {
  const abortRef = useRef(null)
  const [turnaroundOperations, setTurnaroundOperations] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(enabled))
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)

    try {
      const operations = await getTurnaroundOperations({ signal: controller.signal })
      setTurnaroundOperations(operations)
      setError('')
    } catch (loadError) {
      if (loadError.name !== 'AbortError') {
        setTurnaroundOperations([])
        setError(loadError.message || 'Unable to load turnaround operations.')
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return undefined
    }

    reload()

    return () => abortRef.current?.abort()
  }, [enabled, reload])

  return {
    turnaroundOperations,
    isLoading,
    error,
    reload
  }
}
