import { useCallback, useEffect, useState } from 'react'
import { getAdminHierarchySnapshot } from '../api/client.js'

const EMPTY_SNAPSHOT = { customers: [], bookings: [] }

export default function useAdminHierarchySnapshot({ enabled = true } = {}) {
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)
  const [lastLoadedAt, setLastLoadedAt] = useState('')

  const applySnapshot = useCallback(data => {
    setSnapshot({
      customers: Array.isArray(data.customers) ? data.customers : [],
      bookings: Array.isArray(data.bookings) ? data.bookings : []
    })
    setLastLoadedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    setError('')
  }, [])

  const reload = useCallback(() => {
    setReloadCount(current => current + 1)
  }, [])

  const reloadNow = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await getAdminHierarchySnapshot()
      applySnapshot(data)
      return data
    } catch (loadError) {
      setError(loadError.message || 'Unable to refresh the cruise operations snapshot. Existing data is still displayed.')
      throw loadError
    } finally {
      setIsLoading(false)
    }
  }, [applySnapshot])

  const isRefreshing = isLoading && reloadCount > 0

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const controller = new AbortController()
    let isMounted = true

    async function loadSnapshot() {
      setIsLoading(true)

      try {
        const data = await getAdminHierarchySnapshot({ signal: controller.signal })

        if (!isMounted) return

        applySnapshot(data)
      } catch (loadError) {
        if (!isMounted || loadError.name === 'AbortError') return

        setError(loadError.message || 'Unable to load the cruise operations snapshot.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadSnapshot()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [applySnapshot, enabled, reloadCount])

  return {
    snapshot,
    isLoading,
    error,
    reload,
    reloadNow,
    isRefreshing,
    lastLoadedAt,
    requestId: reloadCount + 1
  }
}
