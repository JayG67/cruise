import { useCallback, useEffect, useState } from 'react'
import { getAdminHierarchySnapshot } from '../api/client.js'

const EMPTY_SNAPSHOT = { customers: [], bookings: [] }

export default function useAdminHierarchySnapshot() {
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  const reload = useCallback(() => {
    setReloadCount(current => current + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let isMounted = true

    async function loadSnapshot() {
      setIsLoading(true)

      try {
        const data = await getAdminHierarchySnapshot({ signal: controller.signal })

        if (!isMounted) return

        setSnapshot({
          customers: Array.isArray(data.customers) ? data.customers : [],
          bookings: Array.isArray(data.bookings) ? data.bookings : []
        })
        setError('')
      } catch (loadError) {
        if (!isMounted || loadError.name === 'AbortError') return

        setSnapshot(EMPTY_SNAPSHOT)
        setError(loadError.message || 'Unable to load the React migration snapshot.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadSnapshot()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [reloadCount])

  return {
    snapshot,
    isLoading,
    error,
    reload
  }
}
