import { useCallback, useEffect, useRef, useState } from 'react'

import { getDemoUsers } from '../api/client.js'

export default function useDemoUsers() {
  const abortRef = useRef(null)
  const [demoUsers, setDemoUsers] = useState([])
  const [selectedDemoUserId, setSelectedDemoUserId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const users = await getDemoUsers({ signal: controller.signal })
      setDemoUsers(users)
      setSelectedDemoUserId(currentId => currentId || users[0]?.id || '')
      setError('')
    } catch (loadError) {
      if (loadError.name !== 'AbortError') {
        setError(loadError.message || 'Unable to load demo users.')
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    reload()

    return () => abortRef.current?.abort()
  }, [reload])

  const selectedDemoUser = demoUsers.find(user => user.id === selectedDemoUserId) || demoUsers[0]

  return {
    demoUsers,
    selectedDemoUser,
    selectedDemoUserId,
    setSelectedDemoUserId,
    isLoading,
    error,
    reload
  }
}
