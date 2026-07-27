import { useEffect, useMemo, useState } from 'react'

import { useOperationalDashboardDrafts } from './useOperationalDashboardDrafts.js'

import {
  OperationalTurnaroundHero,
  OperationsPortfolioBoard,
  OperationsReleaseBoard,
  TurnaroundSelectorPanel
} from './OperationalOverviewBoards.jsx'
import { OperationsWorkspaceCommandPanels } from './OperationsCommandPanels.jsx'
import { OperationsEvidencePanels } from './OperationsEvidencePanels.jsx'
import { OperationsLifecyclePanel } from './OperationsLifecyclePanel.jsx'
import { OperationsWorkspaceRouter } from './OperationsWorkspaceRouter.jsx'
import AiTurnaroundBriefingWorkspace from './AiTurnaroundBriefingWorkspace.jsx'

import {
  buildTurnaroundOperationCards,
  getOperationalRoleFocus
} from '../../domain/roleView.js'
import {
  COMMAND_READINESS_OPTIONS,
  buildOperationalDirectory,
  buildRoleOperationsBrief,
  getOperationPortfolioTone,
  getOperationReleaseMetrics,
  normalizeOperationalRoleName
} from './operationalDashboardUtils.js'

export default function OperationalTurnaroundDashboard({ roleView, selectedDemoUser, turnaroundOperations = [], isLoading = false, error = '', onRetry, onUpdateOperationCommand, onUpdateTaskStatus, onUpdateTaskDetails, onCreateTask, onCreateTaskUpdate, onDeleteTask, onUpdateStaffing, onUpdateSignoff, onCreateEscalation, onUpdateEscalation, onUpdateHandoff, updatingOperationId = '', updatingTaskId = '', updatingTaskDetailsId = '', creatingTaskId = '', creatingTaskUpdateId = '', deletingTaskId = '', updatingStaffingKey = '', updatingSignoffKey = '', creatingEscalationId = '', updatingEscalationId = '', updatingHandoffId = '', mutationStatus = '', mutationError = '' }) {
  const readinessOperations = useMemo(() => buildTurnaroundOperationCards(turnaroundOperations, roleView), [turnaroundOperations, roleView])
  const [selectedTurnaroundId, setSelectedTurnaroundId] = useState('')

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
  const visibleReadinessOperations = selectedOperation ? [selectedOperation] : []
  const operationalDirectory = useMemo(() => buildOperationalDirectory(visibleReadinessOperations), [visibleReadinessOperations])
  const [selectedDirectoryRole, setSelectedDirectoryRole] = useState('')
  const selectedDirectoryEntry = operationalDirectory.find(entry => entry.role === selectedDirectoryRole) || operationalDirectory.find(entry => entry.role === normalizeOperationalRoleName(roleView)) || operationalDirectory[0]
  const highCoordinationCount = visibleReadinessOperations.filter(item => String(item.readinessLevel).toLowerCase().includes('high')).length
  const passengerTotal = selectedOperation?.passengerCount || 0
  const focusLine = selectedOperation?.tasks?.[0]?.taskName || getOperationalRoleFocus(roleView)
  const [activeOperationsWorkspace, setActiveOperationsWorkspace] = useState('overview')
  const operationsWorkspaceTabs = [
    { id: 'overview', label: 'Overview', summary: 'Command plan, selected sailing context, and cross-department directory.' },
    { id: 'tasks', label: 'Tasks', summary: 'Task checklist, follow-up tasks, blocker notes, and shift updates.' },
    { id: 'dependencies', label: 'Dependencies', summary: 'Gates that must clear before embarkation or department release work can continue.' },
    { id: 'handoffs', label: 'Handoffs', summary: 'Department-to-department release workflow, owners, due times, and notes.' },
    { id: 'escalations', label: 'Escalations', summary: 'Open operational risks, owners, severity, monitoring, and resolution state.' },
    { id: 'staffing', label: 'Staffing', summary: 'Crew check-in, department leads, muster locations, and coverage gaps.' },
    { id: 'readiness', label: 'Readiness', summary: 'Department signoffs and final readiness approval workflow.' },
    { id: 'ai-briefing', label: 'AI Briefing', summary: 'Generate, review, and retrieve evidence-grounded turnaround briefings.' }
  ]
  const activeOperationsWorkspaceDetails = operationsWorkspaceTabs.find(tab => tab.id === activeOperationsWorkspace) || operationsWorkspaceTabs[0]
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [selectedDependencyId, setSelectedDependencyId] = useState('')
  const [selectedHandoffId, setSelectedHandoffId] = useState('')
  const [selectedEscalationId, setSelectedEscalationId] = useState('')
  const [selectedStaffingRole, setSelectedStaffingRole] = useState('')
  const [selectedReadinessRole, setSelectedReadinessRole] = useState('')
  const {
    getOperationCommandDraft,
    updateOperationCommandDraft,
    saveOperationCommand,
    getEscalationCreateDraft,
    updateEscalationCreateDraft,
    saveEscalationCreate,
    getEscalationUpdateDraft,
    updateEscalationDraft,
    saveEscalationUpdate,
    getHandoffDraft,
    updateHandoffDraft,
    saveHandoffUpdate,
    getStaffingDraft,
    updateStaffingDraft,
    saveStaffing,
    getSignoffDraft,
    updateSignoffDraft,
    saveSignoff,
    getTaskCreateDraft,
    updateTaskCreateDraft,
    saveTaskCreate,
    getTaskDetailDraft,
    updateTaskDetailDraft,
    saveTaskDetails,
    updateStatus,
    getTaskUpdateDraft,
    updateTaskUpdateDraft,
    saveTaskUpdate,
    removeTask
  } = useOperationalDashboardDrafts({
    roleView,
    selectedDemoUser,
    onUpdateOperationCommand,
    onCreateEscalation,
    onUpdateEscalation,
    onUpdateHandoff,
    onUpdateStaffing,
    onUpdateSignoff,
    onCreateTask,
    onUpdateTaskDetails,
    onUpdateTaskStatus,
    onCreateTaskUpdate,
    onDeleteTask
  })

  const selectedOperationTasks = selectedOperation?.tasks || []
  const selectedOperationDependencies = selectedOperation?.taskDependencies || []
  const selectedOperationHandoffs = selectedOperation?.handoffs || []
  const selectedDependency = selectedOperationDependencies.find(dependency => (dependency.id || `${dependency.taskName}:${dependency.dependsOnTaskName}`) === selectedDependencyId) || selectedOperationDependencies[0]
  const selectedDependencyKey = selectedDependency?.id || (selectedDependency ? `${selectedDependency.taskName}:${selectedDependency.dependsOnTaskName}` : '')
  const dependencyWorkspaceSummary = selectedOperation?.dependencySummary || {
    totalDependencies: selectedOperationDependencies.length,
    activeDependencies: selectedOperationDependencies.filter(dependency => dependency.status !== 'CLEARED').length,
    clearedDependencies: selectedOperationDependencies.filter(dependency => dependency.status === 'CLEARED').length
  }
  const selectedHandoff = selectedOperationHandoffs.find(handoff => handoff.id === selectedHandoffId) || selectedOperationHandoffs[0]
  const selectedHandoffKey = selectedHandoff?.id || ''
  const handoffWorkspaceSummary = selectedOperation?.handoffSummary || {
    totalHandoffs: selectedOperationHandoffs.length,
    completedHandoffs: selectedOperationHandoffs.filter(handoff => handoff.status === 'COMPLETE').length,
    blockedHandoffs: selectedOperationHandoffs.filter(handoff => handoff.status === 'BLOCKED').length,
    pendingHandoffs: selectedOperationHandoffs.filter(handoff => handoff.status !== 'COMPLETE').length
  }
  const selectedOperationStaffing = selectedOperation?.staffing || []
  const selectedStaffing = selectedOperationStaffing.find(staffing => staffing.departmentRole === selectedStaffingRole) || selectedOperationStaffing.find(staffing => staffing.departmentRole === roleView) || selectedOperationStaffing[0]
  const selectedStaffingKey = selectedStaffing?.departmentRole || ''
  const selectedOperationSignoffs = selectedOperation?.signoffs || []
  const selectedReadinessSignoff = selectedOperationSignoffs.find(signoff => signoff.departmentRole === selectedReadinessRole) || selectedOperationSignoffs.find(signoff => signoff.departmentRole === roleView) || selectedOperationSignoffs[0]
  const selectedReadinessKey = selectedReadinessSignoff?.departmentRole || ''
  const roleOperationsBrief = useMemo(() => buildRoleOperationsBrief({ roleView, selectedOperation, selectedStaffing, selectedReadinessSignoff }), [roleView, selectedOperation, selectedStaffing, selectedReadinessSignoff])
  const readinessWorkspaceSummary = {
    totalSignoffs: selectedOperationSignoffs.length,
    approvedSignoffs: selectedOperationSignoffs.filter(signoff => String(signoff.status || '').toUpperCase() === 'APPROVED').length,
    pendingSignoffs: selectedOperationSignoffs.filter(signoff => String(signoff.status || '').toUpperCase() === 'PENDING').length,
    blockedSignoffs: selectedOperationSignoffs.filter(signoff => String(signoff.status || '').toUpperCase() === 'BLOCKED').length
  }
  const staffingWorkspaceSummary = selectedOperation?.staffingSummary || {
    totalDepartments: selectedOperationStaffing.length,
    plannedCount: selectedOperationStaffing.reduce((sum, staffing) => sum + Number(staffing.plannedCount || 0), 0),
    checkedInCount: selectedOperationStaffing.reduce((sum, staffing) => sum + Number(staffing.checkedInCount || 0), 0),
    gapCount: selectedOperationStaffing.reduce((sum, staffing) => sum + Math.max(Number(staffing.plannedCount || 0) - Number(staffing.checkedInCount || 0), 0), 0),
    checkInPercent: selectedOperationStaffing.reduce((sum, staffing) => sum + Number(staffing.plannedCount || 0), 0) > 0
      ? Math.round((selectedOperationStaffing.reduce((sum, staffing) => sum + Number(staffing.checkedInCount || 0), 0) / selectedOperationStaffing.reduce((sum, staffing) => sum + Number(staffing.plannedCount || 0), 0)) * 100)
      : 0
  }
  const selectedOperationEscalations = selectedOperation?.escalations || []
  const selectedEscalation = selectedOperationEscalations.find(escalation => escalation.id === selectedEscalationId) || selectedOperationEscalations[0]
  const selectedEscalationKey = selectedEscalation?.id || ''
  const escalationWorkspaceSummary = selectedOperation?.escalationSummary || {
    totalEscalations: selectedOperationEscalations.length,
    openEscalations: selectedOperationEscalations.filter(escalation => String(escalation.status || '').toUpperCase() === 'OPEN').length,
    monitoringEscalations: selectedOperationEscalations.filter(escalation => String(escalation.status || '').toUpperCase() === 'MONITORING').length,
    criticalEscalations: selectedOperationEscalations.filter(escalation => String(escalation.severity || '').toUpperCase() === 'CRITICAL').length
  }
  const selectedTask = selectedOperationTasks.find(task => (task.id || task.taskName) === selectedTaskId) || selectedOperationTasks[0]
  const selectedTaskKey = selectedTask?.id || selectedTask?.taskName || ''
  const taskWorkspaceSummary = selectedOperation?.taskSummary || {
    totalTasks: selectedOperationTasks.length,
    completeTasks: selectedOperationTasks.filter(task => task.status === 'COMPLETE').length,
    blockedTasks: selectedOperationTasks.filter(task => task.status === 'BLOCKED').length,
    completionPercent: selectedOperationTasks.length > 0
      ? Math.round((selectedOperationTasks.filter(task => task.status === 'COMPLETE').length / selectedOperationTasks.length) * 100)
      : 0
  }
  const operationReleaseScore = Math.round((
    Number(taskWorkspaceSummary.completionPercent || 0) +
    Number(staffingWorkspaceSummary.checkInPercent || 0) +
    (readinessWorkspaceSummary.totalSignoffs > 0 ? Math.round((readinessWorkspaceSummary.approvedSignoffs / readinessWorkspaceSummary.totalSignoffs) * 100) : 0) +
    (dependencyWorkspaceSummary.totalDependencies > 0 ? Math.round((dependencyWorkspaceSummary.clearedDependencies / dependencyWorkspaceSummary.totalDependencies) * 100) : 100)
  ) / 4)
  const releaseBoardItems = [
    {
      id: 'tasks',
      label: 'Task execution',
      value: `${taskWorkspaceSummary.completeTasks || 0}/${taskWorkspaceSummary.totalTasks || 0}`,
      detail: taskWorkspaceSummary.blockedTasks > 0 ? `${taskWorkspaceSummary.blockedTasks} blocked` : 'Active workstream',
      tone: taskWorkspaceSummary.blockedTasks > 0 ? 'attention' : 'steady'
    },
    {
      id: 'dependencies',
      label: 'Dependency gates',
      value: `${dependencyWorkspaceSummary.clearedDependencies || 0}/${dependencyWorkspaceSummary.totalDependencies || 0}`,
      detail: dependencyWorkspaceSummary.activeDependencies > 0 ? `${dependencyWorkspaceSummary.activeDependencies} active` : 'Gates clear',
      tone: dependencyWorkspaceSummary.activeDependencies > 0 ? 'watch' : 'clear'
    },
    {
      id: 'staffing',
      label: 'Staffing coverage',
      value: `${staffingWorkspaceSummary.checkInPercent || 0}%`,
      detail: staffingWorkspaceSummary.gapCount > 0 ? `${staffingWorkspaceSummary.gapCount} open positions` : 'Coverage aligned',
      tone: staffingWorkspaceSummary.gapCount > 0 ? 'watch' : 'clear'
    },
    {
      id: 'readiness',
      label: 'Readiness approvals',
      value: `${readinessWorkspaceSummary.approvedSignoffs || 0}/${readinessWorkspaceSummary.totalSignoffs || 0}`,
      detail: readinessWorkspaceSummary.blockedSignoffs > 0 ? `${readinessWorkspaceSummary.blockedSignoffs} blocked` : 'Department signoffs',
      tone: readinessWorkspaceSummary.blockedSignoffs > 0 ? 'attention' : 'steady'
    }
  ]

  const portfolioOperationItems = readinessOperations.map(operation => ({
    operation,
    metrics: getOperationReleaseMetrics(operation)
  }))
  const portfolioAverageReadiness = portfolioOperationItems.length > 0
    ? Math.round(portfolioOperationItems.reduce((sum, item) => sum + item.metrics.releaseScore, 0) / portfolioOperationItems.length)
    : 0
  const portfolioNeedsAttention = portfolioOperationItems.filter(item => getOperationPortfolioTone(item.metrics) === 'attention').length
  const portfolioWatchCount = portfolioOperationItems.filter(item => getOperationPortfolioTone(item.metrics) === 'watch').length
  const portfolioOpenEscalations = portfolioOperationItems.reduce((sum, item) => sum + Number(item.metrics.openEscalations || 0), 0)

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


  useEffect(() => {
    if (selectedOperationTasks.length === 0) {
      if (selectedTaskId) setSelectedTaskId('')
      return
    }

    if (!selectedOperationTasks.some(task => (task.id || task.taskName) === selectedTaskId)) {
      setSelectedTaskId(selectedOperationTasks[0].id || selectedOperationTasks[0].taskName)
    }
  }, [selectedOperation?.id, selectedOperationTasks, selectedTaskId])

  useEffect(() => {
    if (selectedOperationDependencies.length === 0) {
      if (selectedDependencyId) setSelectedDependencyId('')
      return
    }

    if (!selectedOperationDependencies.some(dependency => (dependency.id || `${dependency.taskName}:${dependency.dependsOnTaskName}`) === selectedDependencyId)) {
      const firstDependency = selectedOperationDependencies[0]
      setSelectedDependencyId(firstDependency.id || `${firstDependency.taskName}:${firstDependency.dependsOnTaskName}`)
    }
  }, [selectedOperation?.id, selectedOperationDependencies, selectedDependencyId])



  useEffect(() => {
    if (selectedOperationHandoffs.length === 0) {
      if (selectedHandoffId) setSelectedHandoffId('')
      return
    }

    if (!selectedOperationHandoffs.some(handoff => handoff.id === selectedHandoffId)) {
      setSelectedHandoffId(selectedOperationHandoffs[0].id)
    }
  }, [selectedOperation?.id, selectedOperationHandoffs, selectedHandoffId])


  useEffect(() => {
    if (selectedOperationStaffing.length === 0) {
      if (selectedStaffingRole) setSelectedStaffingRole('')
      return
    }

    if (!selectedOperationStaffing.some(staffing => staffing.departmentRole === selectedStaffingRole)) {
      const roleStaffing = selectedOperationStaffing.find(staffing => staffing.departmentRole === roleView)
      setSelectedStaffingRole((roleStaffing || selectedOperationStaffing[0]).departmentRole)
    }
  }, [selectedOperation?.id, selectedOperationStaffing, selectedStaffingRole, roleView])


  useEffect(() => {
    if (selectedOperationSignoffs.length === 0) {
      if (selectedReadinessRole) setSelectedReadinessRole('')
      return
    }

    if (!selectedOperationSignoffs.some(signoff => signoff.departmentRole === selectedReadinessRole)) {
      const roleSignoff = selectedOperationSignoffs.find(signoff => signoff.departmentRole === roleView)
      setSelectedReadinessRole((roleSignoff || selectedOperationSignoffs[0]).departmentRole)
    }
  }, [selectedOperation?.id, selectedOperationSignoffs, selectedReadinessRole, roleView])


  useEffect(() => {
    if (selectedOperationEscalations.length === 0) {
      if (selectedEscalationId) setSelectedEscalationId('')
      return
    }

    if (!selectedOperationEscalations.some(escalation => escalation.id === selectedEscalationId)) {
      setSelectedEscalationId(selectedOperationEscalations[0].id)
    }
  }, [selectedOperation?.id, selectedOperationEscalations, selectedEscalationId])



  function focusOperationsWorkspace(workspaceId) {
    setActiveOperationsWorkspace(workspaceId)
    window.requestAnimationFrame(() => {
      document.getElementById('operations-workspace-heading')?.scrollIntoView({ block: 'start' })
    })
  }

  function getLifecycleTargetWorkspace(item = {}) {
    const typeText = String(item.type || item.label || item.detail || item.departmentRole || '').toLowerCase()
    if (typeText.includes('staff')) return 'staffing'
    if (typeText.includes('dependency')) return 'dependencies'
    if (typeText.includes('handoff')) return 'handoffs'
    if (typeText.includes('escalation')) return 'escalations'
    if (typeText.includes('signoff') || typeText.includes('department')) return 'readiness'
    return 'tasks'
  }

  function getPhaseTargetWorkspace(phase = {}) {
    const blockerText = [...(phase.blockers || []), phase.description, phase.label].filter(Boolean).join(' ').toLowerCase()
    if (blockerText.includes('staff')) return 'staffing'
    if (blockerText.includes('depend')) return 'dependencies'
    if (blockerText.includes('handoff')) return 'handoffs'
    if (blockerText.includes('escalation')) return 'escalations'
    if (blockerText.includes('signoff') || blockerText.includes('readiness')) return 'readiness'
    return 'tasks'
  }

  return (
    <section className="operational-turnaround-panel ce-command-panel" aria-labelledby="operational-turnaround-heading" data-testid="react-operational-turnaround-panel">
      <OperationalTurnaroundHero
        focusLine={focusLine}
        selectedDemoUser={selectedDemoUser}
        readinessCount={readinessOperations.length}
        passengerTotal={passengerTotal}
        highCoordinationCount={highCoordinationCount}
      />

      <OperationsPortfolioBoard
        portfolioOperationItems={portfolioOperationItems}
        selectedOperation={selectedOperation}
        portfolioAverageReadiness={portfolioAverageReadiness}
        portfolioNeedsAttention={portfolioNeedsAttention}
        portfolioWatchCount={portfolioWatchCount}
        portfolioOpenEscalations={portfolioOpenEscalations}
        onSelectTurnaround={setSelectedTurnaroundId}
      />

      <TurnaroundSelectorPanel
        readinessOperations={readinessOperations}
        selectedOperation={selectedOperation}
        onSelectTurnaround={setSelectedTurnaroundId}
      />

      <OperationsReleaseBoard
        selectedOperation={selectedOperation}
        operationReleaseScore={operationReleaseScore}
        releaseBoardItems={releaseBoardItems}
        onFocusWorkspace={focusOperationsWorkspace}
      />



      <OperationsLifecyclePanel
        selectedOperation={selectedOperation}
        focusOperationsWorkspace={focusOperationsWorkspace}
        getLifecycleTargetWorkspace={getLifecycleTargetWorkspace}
        getPhaseTargetWorkspace={getPhaseTargetWorkspace}
      />


      <OperationsEvidencePanels selectedOperation={selectedOperation} />

      <OperationsWorkspaceCommandPanels
        activeOperationsWorkspace={activeOperationsWorkspace}
        activeOperationsWorkspaceDetails={activeOperationsWorkspaceDetails}
        focusOperationsWorkspace={focusOperationsWorkspace}
        operationsWorkspaceTabs={operationsWorkspaceTabs}
        operationalDirectory={operationalDirectory}
        roleOperationsBrief={roleOperationsBrief}
        roleView={roleView}
        selectedDirectoryEntry={selectedDirectoryEntry}
        selectedOperation={selectedOperation}
        setSelectedDirectoryRole={setSelectedDirectoryRole}
      />

      {selectedOperation && (
        <section className="operational-readiness-list operational-command-compatibility-panel" aria-label="Selected turnaround command workspace">
          {[selectedOperation].map(item => (
            <article className="operational-readiness-card ce-command-card" key={`command-${item.id}`} data-testid="react-operational-command-overview-card">
              <div>
                <p className="eyebrow ce-kicker">{item.status}</p>
                <h4>{item.title}</h4>
                <p>{item.shipName} · {item.route}</p>
                {item.notes && <p>{item.notes}</p>}
              </div>
              <dl className="role-booking-fields compact-fields">
                <div>
                  <dt>Sailing date</dt>
                  <dd>{item.sailingDate}</dd>
                </div>
                <div>
                  <dt>Turnaround port</dt>
                  <dd>{item.port || item.arrivalPort}</dd>
                </div>
                <div>
                  <dt>Passenger load</dt>
                  <dd>{item.passengerCount} passenger{item.passengerCount === 1 ? '' : 's'}</dd>
                </div>
                <div>
                  <dt>Readiness level</dt>
                  <dd>{item.readinessLevel}</dd>
                </div>
                <div>
                  <dt>Command status</dt>
                  <dd>{item.commandStatus || item.status}</dd>
                </div>
                <div>
                  <dt>Command readiness</dt>
                  <dd>{item.commandReadinessLevel || item.readinessLevel}</dd>
                </div>
              </dl>

              {onUpdateOperationCommand && roleView === 'turnaround-manager' && (
                <form className="operational-command-form ce-editor-card ce-surface-light operational-light-editor" onSubmit={event => { event.preventDefault(); saveOperationCommand(item) }} data-testid="react-operational-command-form">
                  <label>
                    <span>Command status</span>
                    <select value={getOperationCommandDraft(item).status} onChange={event => updateOperationCommandDraft(item, 'status', event.target.value)} aria-label={`${item.title} command status`}>
                      <option value="PLANNED">Planned</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="READY">Ready</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="COMPLETE">Complete</option>
                    </select>
                  </label>
                  <label>
                    <span>Command readiness</span>
                    <select value={getOperationCommandDraft(item).readinessLevel} onChange={event => updateOperationCommandDraft(item, 'readinessLevel', event.target.value)} aria-label={`${item.title} command readiness`}>
                      {COMMAND_READINESS_OPTIONS.map(option => (
                        <option value={option} key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Turnaround port</span>
                    <input value={getOperationCommandDraft(item).port} onChange={event => updateOperationCommandDraft(item, 'port', event.target.value)} aria-label={`${item.title} turnaround port`} />
                  </label>
                  <label className="full-width-field">
                    <span>Command notes</span>
                    <textarea value={getOperationCommandDraft(item).notes} onChange={event => updateOperationCommandDraft(item, 'notes', event.target.value)} aria-label={`${item.title} command notes`} rows="3" />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingOperationId === item.id || !getOperationCommandDraft(item).readinessLevel.trim() || !getOperationCommandDraft(item).port.trim()}>Save command plan</button>
                </form>
              )}

              {onCreateTask && (
                <form className="operational-task-create-form ce-editor-card ce-surface-light operational-light-editor" onSubmit={event => { event.preventDefault(); saveTaskCreate(item) }} data-testid="react-operational-task-create-form">
                  <label>
                    <span>New task department</span>
                    <select value={getTaskCreateDraft(item).departmentRole} onChange={event => updateTaskCreateDraft(item, 'departmentRole', event.target.value)} aria-label={`${item.title} new task department`}>
                      <option value="turnaround-manager">Turnaround Manager</option>
                      <option value="housekeeping-lead">Housekeeping Lead</option>
                      <option value="guest-services-lead">Guest Services Lead</option>
                      <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
                      <option value="engineering-lead">Engineering Lead</option>
                      <option value="security-lead">Security Lead</option>
                      <option value="port-operations-lead">Port Operations Lead</option>
                    </select>
                  </label>
                  <label className="full-width-field">
                    <span>New task name</span>
                    <input value={getTaskCreateDraft(item).taskName} onChange={event => updateTaskCreateDraft(item, 'taskName', event.target.value)} aria-label={`${item.title} new task name`} />
                  </label>
                  <label>
                    <span>Owner</span>
                    <input value={getTaskCreateDraft(item).ownerName} onChange={event => updateTaskCreateDraft(item, 'ownerName', event.target.value)} aria-label={`${item.title} new task owner`} />
                  </label>
                  <label>
                    <span>Due time</span>
                    <input value={getTaskCreateDraft(item).dueTime} onChange={event => updateTaskCreateDraft(item, 'dueTime', event.target.value)} aria-label={`${item.title} new task due time`} />
                  </label>
                  <label>
                    <span>Location</span>
                    <input value={getTaskCreateDraft(item).location} onChange={event => updateTaskCreateDraft(item, 'location', event.target.value)} aria-label={`${item.title} new task location`} />
                  </label>
                  <label className="full-width-field">
                    <span>Blocker reason</span>
                    <input value={getTaskCreateDraft(item).blockerReason} onChange={event => updateTaskCreateDraft(item, 'blockerReason', event.target.value)} aria-label={`${item.title} new task blocker reason`} />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingTaskId === item.id || !getTaskCreateDraft(item).taskName.trim()}>Add turnaround task</button>
                </form>
              )}

              {item.tasks.length > 0 && (
                <ul className="operational-checklist" data-testid="react-operational-role-checklist-summary">
                  {item.tasks.map(task => (
                    <li key={task.id || `${item.id}-${task.taskName}`}>
                      <div><strong>{task.status}</strong> — {task.taskName}</div>
                      {task.ownerName && <p>{task.ownerDisplayName || task.ownerName}</p>}
                      {task.blockerReason && <p>Blocked: {task.blockerReason}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}

      {activeOperationsWorkspace === 'ai-briefing' && (
        <AiTurnaroundBriefingWorkspace
          selectedOperation={selectedOperation}
          selectedDemoUser={selectedDemoUser}
        />
      )}

      <OperationsWorkspaceRouter
        activeOperationsWorkspace={activeOperationsWorkspace}
        creatingEscalationId={creatingEscalationId}
        creatingTaskId={creatingTaskId}
        creatingTaskUpdateId={creatingTaskUpdateId}
        deletingTaskId={deletingTaskId}
        dependencyWorkspaceSummary={dependencyWorkspaceSummary}
        error={error}
        escalationWorkspaceSummary={escalationWorkspaceSummary}
        getEscalationCreateDraft={getEscalationCreateDraft}
        getEscalationUpdateDraft={getEscalationUpdateDraft}
        getHandoffDraft={getHandoffDraft}
        getOperationCommandDraft={getOperationCommandDraft}
        getSignoffDraft={getSignoffDraft}
        getStaffingDraft={getStaffingDraft}
        getTaskCreateDraft={getTaskCreateDraft}
        getTaskDetailDraft={getTaskDetailDraft}
        getTaskUpdateDraft={getTaskUpdateDraft}
        handoffWorkspaceSummary={handoffWorkspaceSummary}
        isLoading={isLoading}
        mutationError={mutationError}
        mutationStatus={mutationStatus}
        onCreateEscalation={onCreateEscalation}
        onCreateTask={onCreateTask}
        onCreateTaskUpdate={onCreateTaskUpdate}
        onDeleteTask={onDeleteTask}
        onRetry={onRetry}
        onUpdateEscalation={onUpdateEscalation}
        onUpdateHandoff={onUpdateHandoff}
        onUpdateOperationCommand={onUpdateOperationCommand}
        onUpdateSignoff={onUpdateSignoff}
        onUpdateStaffing={onUpdateStaffing}
        onUpdateTaskDetails={onUpdateTaskDetails}
        onUpdateTaskStatus={onUpdateTaskStatus}
        readinessOperations={readinessOperations}
        readinessWorkspaceSummary={readinessWorkspaceSummary}
        removeTask={removeTask}
        roleView={roleView}
        saveEscalationCreate={saveEscalationCreate}
        saveEscalationUpdate={saveEscalationUpdate}
        saveHandoffUpdate={saveHandoffUpdate}
        saveOperationCommand={saveOperationCommand}
        saveSignoff={saveSignoff}
        saveStaffing={saveStaffing}
        saveTaskCreate={saveTaskCreate}
        saveTaskDetails={saveTaskDetails}
        saveTaskUpdate={saveTaskUpdate}
        selectedDependency={selectedDependency}
        selectedDependencyKey={selectedDependencyKey}
        selectedEscalation={selectedEscalation}
        selectedEscalationKey={selectedEscalationKey}
        selectedHandoff={selectedHandoff}
        selectedHandoffKey={selectedHandoffKey}
        selectedOperation={selectedOperation}
        selectedOperationDependencies={selectedOperationDependencies}
        selectedOperationEscalations={selectedOperationEscalations}
        selectedOperationHandoffs={selectedOperationHandoffs}
        selectedOperationSignoffs={selectedOperationSignoffs}
        selectedOperationStaffing={selectedOperationStaffing}
        selectedOperationTasks={selectedOperationTasks}
        selectedReadinessKey={selectedReadinessKey}
        selectedReadinessSignoff={selectedReadinessSignoff}
        selectedStaffing={selectedStaffing}
        selectedStaffingKey={selectedStaffingKey}
        selectedTaskKey={selectedTaskKey}
        setSelectedDependencyId={setSelectedDependencyId}
        setSelectedEscalationId={setSelectedEscalationId}
        setSelectedHandoffId={setSelectedHandoffId}
        setSelectedReadinessRole={setSelectedReadinessRole}
        setSelectedStaffingRole={setSelectedStaffingRole}
        setSelectedTaskId={setSelectedTaskId}
        staffingWorkspaceSummary={staffingWorkspaceSummary}
        taskWorkspaceSummary={taskWorkspaceSummary}
        updateEscalationCreateDraft={updateEscalationCreateDraft}
        updateEscalationDraft={updateEscalationDraft}
        updateHandoffDraft={updateHandoffDraft}
        updateOperationCommandDraft={updateOperationCommandDraft}
        updateSignoffDraft={updateSignoffDraft}
        updateStaffingDraft={updateStaffingDraft}
        updateStatus={updateStatus}
        updateTaskCreateDraft={updateTaskCreateDraft}
        updateTaskDetailDraft={updateTaskDetailDraft}
        updateTaskUpdateDraft={updateTaskUpdateDraft}
        updatingEscalationId={updatingEscalationId}
        updatingHandoffId={updatingHandoffId}
        updatingOperationId={updatingOperationId}
        updatingSignoffKey={updatingSignoffKey}
        updatingStaffingKey={updatingStaffingKey}
        updatingTaskDetailsId={updatingTaskDetailsId}
        updatingTaskId={updatingTaskId}
        visibleReadinessOperations={visibleReadinessOperations}
      />
    </section>
  )
}
