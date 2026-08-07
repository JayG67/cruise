import { useEffect, useMemo, useState } from 'react'

import { buildOperationalDirectory, normalizeOperationalRoleName } from './operationalDashboardUtils.js'
import { OPERATIONS_WORKSPACE_TABS } from './operationalDashboardNavigation.js'

function taskKey(task) {
  return task?.id || task?.taskName || ''
}

function dependencyKey(dependency) {
  return dependency?.id || (dependency ? `${dependency.taskName}:${dependency.dependsOnTaskName}` : '')
}

export function useOperationalDashboardSelectionState({ readinessOperations, roleView, selectedDemoUser }) {
  const [selectedTurnaroundId, setSelectedTurnaroundId] = useState('')
  const [selectedDirectoryRole, setSelectedDirectoryRole] = useState('')
  const [activeOperationsWorkspace, setActiveOperationsWorkspace] = useState('overview')
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [selectedDependencyId, setSelectedDependencyId] = useState('')
  const [selectedHandoffId, setSelectedHandoffId] = useState('')
  const [selectedEscalationId, setSelectedEscalationId] = useState('')
  const [selectedStaffingRole, setSelectedStaffingRole] = useState('')
  const [selectedReadinessRole, setSelectedReadinessRole] = useState('')

  useEffect(() => {
    if (readinessOperations.length === 0) {
      if (selectedTurnaroundId) setSelectedTurnaroundId('')
      return
    }

    if (!readinessOperations.some(operation => operation.id === selectedTurnaroundId)) {
      setSelectedTurnaroundId(readinessOperations[0].id)
    }
  }, [readinessOperations, selectedTurnaroundId])

  const selectedOperation = readinessOperations.find(operation => operation.id === selectedTurnaroundId) || readinessOperations[0]
  const visibleReadinessOperations = useMemo(() => selectedOperation ? [selectedOperation] : [], [selectedOperation])
  const operationalDirectory = useMemo(() => buildOperationalDirectory(visibleReadinessOperations), [visibleReadinessOperations])
  const selectedDirectoryEntry = operationalDirectory.find(entry => entry.role === selectedDirectoryRole)
    || operationalDirectory.find(entry => entry.role === normalizeOperationalRoleName(roleView))
    || operationalDirectory[0]
  const activeOperationsWorkspaceDetails = OPERATIONS_WORKSPACE_TABS.find(tab => tab.id === activeOperationsWorkspace) || OPERATIONS_WORKSPACE_TABS[0]

  useEffect(() => {
    setActiveOperationsWorkspace('overview')
  }, [roleView, selectedDemoUser?.id])

  useEffect(() => {
    if (operationalDirectory.length === 0) {
      if (selectedDirectoryRole) setSelectedDirectoryRole('')
      return
    }

    if (!operationalDirectory.some(entry => entry.role === selectedDirectoryRole)) {
      const roleEntry = operationalDirectory.find(entry => entry.role === normalizeOperationalRoleName(roleView))
      setSelectedDirectoryRole((roleEntry || operationalDirectory[0]).role)
    }
  }, [operationalDirectory, selectedDirectoryRole, roleView])

  const tasks = selectedOperation?.tasks || []
  const dependencies = selectedOperation?.taskDependencies || []
  const handoffs = selectedOperation?.handoffs || []
  const staffing = selectedOperation?.staffing || []
  const signoffs = selectedOperation?.signoffs || []
  const escalations = selectedOperation?.escalations || []

  useEffect(() => {
    if (tasks.length === 0) {
      if (selectedTaskId) setSelectedTaskId('')
      return
    }
    if (!tasks.some(task => taskKey(task) === selectedTaskId)) setSelectedTaskId(taskKey(tasks[0]))
  }, [selectedOperation?.id, tasks, selectedTaskId])

  useEffect(() => {
    if (dependencies.length === 0) {
      if (selectedDependencyId) setSelectedDependencyId('')
      return
    }
    if (!dependencies.some(dependency => dependencyKey(dependency) === selectedDependencyId)) {
      setSelectedDependencyId(dependencyKey(dependencies[0]))
    }
  }, [selectedOperation?.id, dependencies, selectedDependencyId])

  useEffect(() => {
    if (handoffs.length === 0) {
      if (selectedHandoffId) setSelectedHandoffId('')
      return
    }
    if (!handoffs.some(handoff => handoff.id === selectedHandoffId)) setSelectedHandoffId(handoffs[0].id)
  }, [selectedOperation?.id, handoffs, selectedHandoffId])

  useEffect(() => {
    if (staffing.length === 0) {
      if (selectedStaffingRole) setSelectedStaffingRole('')
      return
    }
    if (!staffing.some(item => item.departmentRole === selectedStaffingRole)) {
      const roleStaffing = staffing.find(item => item.departmentRole === roleView)
      setSelectedStaffingRole((roleStaffing || staffing[0]).departmentRole)
    }
  }, [selectedOperation?.id, staffing, selectedStaffingRole, roleView])

  useEffect(() => {
    if (signoffs.length === 0) {
      if (selectedReadinessRole) setSelectedReadinessRole('')
      return
    }
    if (!signoffs.some(signoff => signoff.departmentRole === selectedReadinessRole)) {
      const roleSignoff = signoffs.find(signoff => signoff.departmentRole === roleView)
      setSelectedReadinessRole((roleSignoff || signoffs[0]).departmentRole)
    }
  }, [selectedOperation?.id, signoffs, selectedReadinessRole, roleView])

  useEffect(() => {
    if (escalations.length === 0) {
      if (selectedEscalationId) setSelectedEscalationId('')
      return
    }
    if (!escalations.some(escalation => escalation.id === selectedEscalationId)) setSelectedEscalationId(escalations[0].id)
  }, [selectedOperation?.id, escalations, selectedEscalationId])

  function focusOperationsWorkspace(workspaceId) {
    setActiveOperationsWorkspace(workspaceId)
    window.requestAnimationFrame(() => {
      document.getElementById('operations-workspace-heading')?.scrollIntoView({ block: 'start' })
    })
  }

  return {
    activeOperationsWorkspace,
    activeOperationsWorkspaceDetails,
    focusOperationsWorkspace,
    operationalDirectory,
    operationsWorkspaceTabs: OPERATIONS_WORKSPACE_TABS,
    selectedDependencyId,
    selectedDirectoryEntry,
    selectedEscalationId,
    selectedHandoffId,
    selectedOperation,
    selectedReadinessRole,
    selectedStaffingRole,
    selectedTaskId,
    setSelectedDependencyId,
    setSelectedDirectoryRole,
    setSelectedEscalationId,
    setSelectedHandoffId,
    setSelectedReadinessRole,
    setSelectedStaffingRole,
    setSelectedTaskId,
    setSelectedTurnaroundId,
    visibleReadinessOperations
  }
}
