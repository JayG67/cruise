import { useCallback, useEffect, useRef, useState } from 'react'

import { getCruiseLines } from '../api/client.js'

export default function useCruiseLines() {
  const abortRef = useRef(null)
  const [cruiseLines, setCruiseLines] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller

    setIsRefreshing(true)

    try {
      const data = await getCruiseLines({ signal: controller.signal })

      setCruiseLines(data)
      setError('')
    } catch (loadError) {
      if (loadError.name !== 'AbortError') {
        setError(loadError.message || 'Unable to load cruise lines.')
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    reload()

    return () => abortRef.current?.abort()
  }, [reload])

  return {
    cruiseLines,
    isLoading,
    isRefreshing,
    error,
    reload
  }
}
