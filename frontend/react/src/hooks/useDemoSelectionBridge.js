import { useEffect } from 'react'
import { getSelectedRoleView } from '../domain/roleView.js'

export default function useDemoSelectionBridge({
  demoUsers,
  selectedDemoUser,
  selectedRole,
  selectedRoleView,
  setSelectedDemoUserId
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    window.__cruiseDemoUsers = demoUsers.map(user => ({
      id: user.id,
      name: user.displayName || user.name || '',
      displayName: user.displayName || user.name || '',
      customerId: user.customerId || '',
      role: user.role || user.userType || '',
      roleView: getSelectedRoleView(user)
    }))

    window.__cruiseDemoSelectionState = {
      selectedDemoUserId: selectedDemoUser?.id || '',
      selectedDemoUserName: selectedDemoUser?.name || selectedDemoUser?.displayName || '',
      selectedRoleView,
      selectedRole
    }

    window.__cruiseSelectDemoUser = ({ userId = '', role = '', personText = '' } = {}) => {
      const normalizedPersonText = String(personText || '').trim().toLowerCase()
      const normalizedRole = String(role || '').trim()
      const matchingUser = demoUsers.find(user => {
        const roleMatches = !normalizedRole || getSelectedRoleView(user) === normalizedRole
        const userSearchText = [user.displayName, user.name, user.email].filter(Boolean).join(' ').toLowerCase()
        const nameMatches = userId
          ? user.id === userId
          : !normalizedPersonText || userSearchText.includes(normalizedPersonText)

        return roleMatches && nameMatches
      })

      if (!matchingUser) return { ok: false, reason: 'No matching assigned person found.' }

      const targetRole = getSelectedRoleView(matchingUser)
      setSelectedDemoUserId(matchingUser.id)
      return {
        ok: true,
        userId: matchingUser.id,
        name: matchingUser.displayName || matchingUser.name,
        role: targetRole
      }
    }

    return () => {
      delete window.__cruiseDemoUsers
      delete window.__cruiseDemoSelectionState
      delete window.__cruiseSelectDemoUser
    }
  }, [demoUsers, selectedDemoUser?.displayName, selectedDemoUser?.id, selectedDemoUser?.name, selectedRole, selectedRoleView, setSelectedDemoUserId])
}
