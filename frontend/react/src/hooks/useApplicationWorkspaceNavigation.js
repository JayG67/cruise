import { useEffect, useState } from 'react'

function scrollToSection(sectionId) {
  document.getElementById(sectionId)?.scrollIntoView({ block: 'start' })
}

export default function useApplicationWorkspaceNavigation({
  adminDemoUser,
  selectedRoleView,
  setSelectedDemoUserId
}) {
  const [roleSwitchRequest, setRoleSwitchRequest] = useState(null)
  const [pendingNavigationSectionId, setPendingNavigationSectionId] = useState('')

  useEffect(() => {
    if (selectedRoleView !== 'admin' || !pendingNavigationSectionId) return undefined

    const timerId = window.setTimeout(() => {
      scrollToSection(pendingNavigationSectionId)
      setPendingNavigationSectionId('')
    }, 50)

    return () => window.clearTimeout(timerId)
  }, [pendingNavigationSectionId, selectedRoleView])

  function openWorkspace(sectionId, workspaceLabel, requiredRole = null) {
    if (!requiredRole || selectedRoleView === requiredRole) {
      scrollToSection(sectionId)
      return
    }

    setRoleSwitchRequest({ sectionId, workspaceLabel, requiredRole })
  }

  function confirmRoleSwitch() {
    if (!roleSwitchRequest) return

    if (roleSwitchRequest.requiredRole === 'admin' && adminDemoUser) {
      setSelectedDemoUserId(adminDemoUser.id)
      setPendingNavigationSectionId(roleSwitchRequest.sectionId)
      setRoleSwitchRequest(null)
    }
  }

  function cancelRoleSwitch() {
    setRoleSwitchRequest(null)
    setPendingNavigationSectionId('')
  }

  return {
    cancelRoleSwitch,
    confirmRoleSwitch,
    openWorkspace,
    roleSwitchRequest
  }
}
