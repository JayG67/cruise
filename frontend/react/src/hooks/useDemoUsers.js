import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getDemoUsers } from '../api/client.js'
import { normalizeOperationalDemoUsers, normalizeRole } from '../domain/roleView.js'

export default function useDemoUsers({ enabled = true } = {}) {
  const abortRef = useRef(null)
  const [demoUsers, setDemoUsers] = useState([])
  const [selectedDemoUserId, setSelectedDemoUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('admin')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const users = normalizeOperationalDemoUsers(await getDemoUsers({ signal: controller.signal }))
      setDemoUsers(users)
      setSelectedRole(currentRole => currentRole || 'admin')
      setSelectedDemoUserId(currentId => {
        if (currentId) return currentId
        return users.find(user => normalizeRole(user.role || user.userType) === 'admin')?.id || users[0]?.id || ''
      })
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
    if (!enabled) {
      return undefined
    }

    reload()

    return () => abortRef.current?.abort()
  }, [enabled, reload])

  const availableRoles = useMemo(() => {
    const roles = demoUsers.map(user => normalizeRole(user.role || user.userType)).filter(Boolean)
    return [...new Set(roles)]
  }, [demoUsers])

  const filteredDemoUsers = useMemo(() => {
    if (!selectedRole) return demoUsers
    return demoUsers.filter(user => normalizeRole(user.role || user.userType) === selectedRole)
  }, [demoUsers, selectedRole])

  function selectDemoUser(userId) {
    setSelectedDemoUserId(userId)

    const selectedUser = demoUsers.find(user => user.id === userId)
    const selectedUserRole = normalizeRole(selectedUser?.role || selectedUser?.userType)

    if (selectedRole && selectedUserRole !== selectedRole) {
      setSelectedRole('')
    }
  }

  function selectRole(role) {
    setSelectedRole(role)

    if (!role) {
      setSelectedDemoUserId(demoUsers[0]?.id || '')
      return
    }

    const firstUserForRole = demoUsers.find(user => normalizeRole(user.role || user.userType) === role)
    setSelectedDemoUserId(firstUserForRole?.id || '')
  }

  const selectedDemoUser = demoUsers.find(user => user.id === selectedDemoUserId) || filteredDemoUsers[0] || demoUsers[0]

  return {
    demoUsers,
    filteredDemoUsers,
    availableRoles,
    selectedRole,
    selectedDemoUser,
    selectedDemoUserId,
    setSelectedDemoUserId: selectDemoUser,
    setSelectedRole: selectRole,
    isLoading,
    error,
    reload
  }
}
