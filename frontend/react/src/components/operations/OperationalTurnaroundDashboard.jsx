import { useMemo } from 'react'

import { useOperationalDashboardDrafts } from './useOperationalDashboardDrafts.js'
import { useOperationalDashboardSelectionState } from './useOperationalDashboardSelectionState.js'
import { getLifecycleTargetWorkspace, getPhaseTargetWorkspace } from './operationalDashboardNavigation.js'

import {
  OperationalTurnaroundHero,
  TurnaroundFleetBoard,
  OperationsReleaseBoard,
  TurnaroundSelectorPanel
} from './OperationalOverviewBoards.jsx'
import { OperationsWorkspaceCommandPanels } from './OperationsCommandPanels.jsx'
import { OperationsEvidencePanels } from './OperationsEvidencePanels.jsx'
import { OperationsLifecyclePanel } from './OperationsLifecyclePanel.jsx'
import { OperationsWorkspaceRouter } from './OperationsWorkspaceRouter.jsx'
import OperationalCommandOverviewPanel from './OperationalCommandOverviewPanel.jsx'
import AiTurnaroundBriefingWorkspace from './AiTurnaroundBriefingWorkspace.jsx'

import {
  buildTurnaroundOperationCards,
  getOperationalRoleFocus
} from '../../domain/roleView.js'
import { buildOperationalWorkspaceModel } from '../../domain/operationalDashboardWorkspace.js'
import {
  buildRoleOperationsBrief,
  getTurnaroundReadinessTone,
  getOperationReleaseMetrics
} from './operationalDashboardUtils.js'

export default function OperationalTurnaroundDashboard({ roleView, selectedDemoUser, turnaroundOperations = [], isLoading = false, error = '', onRetry, onUpdateOperationCommand, onUpdateTaskStatus, onUpdateTaskDetails, onCreateTask, onCreateTaskUpdate, onDeleteTask, onUpdateStaffing, onUpdateSignoff, onCreateEscalation, onUpdateEscalation, onUpdateHandoff, updatingOperationId = '', updatingTaskId = '', updatingTaskDetailsId = '', creatingTaskId = '', creatingTaskUpdateId = '', deletingTaskId = '', updatingStaffingKey = '', updatingSignoffKey = '', creatingEscalationId = '', updatingEscalationId = '', updatingHandoffId = '', mutationStatus = '', mutationError = '' }) {
  const readinessOperations = useMemo(() => buildTurnaroundOperationCards(turnaroundOperations, roleView), [turnaroundOperations, roleView])
  const {
    activeOperationsWorkspace,
    activeOperationsWorkspaceDetails,
    focusOperationsWorkspace,
    operationalDirectory,
    operationsWorkspaceTabs,
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
  } = useOperationalDashboardSelectionState({ readinessOperations, roleView, selectedDemoUser })
  const highCoordinationCount = visibleReadinessOperations.filter(item => String(item.readinessLevel).toLowerCase().includes('high')).length
  const passengerTotal = selectedOperation?.passengerCount || 0
  const focusLine = selectedOperation?.tasks?.[0]?.taskName || getOperationalRoleFocus(roleView)
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

  const {
    tasks: selectedOperationTasks,
    dependencies: selectedOperationDependencies,
    handoffs: selectedOperationHandoffs,
    staffing: selectedOperationStaffing,
    signoffs: selectedOperationSignoffs,
    escalations: selectedOperationEscalations,
    selectedTaskKey,
    selectedDependency,
    selectedDependencyKey,
    selectedHandoff,
    selectedHandoffKey,
    selectedEscalation,
    selectedEscalationKey,
    selectedStaffing,
    selectedStaffingKey,
    selectedReadinessSignoff,
    selectedReadinessKey,
    dependencySummary: dependencyWorkspaceSummary,
    handoffSummary: handoffWorkspaceSummary,
    readinessSummary: readinessWorkspaceSummary,
    staffingSummary: staffingWorkspaceSummary,
    escalationSummary: escalationWorkspaceSummary,
    taskSummary: taskWorkspaceSummary,
    operationReleaseScore,
    releaseBoardItems
  } = useMemo(() => buildOperationalWorkspaceModel({
    selectedOperation,
    roleView,
    selectedTaskId,
    selectedDependencyId,
    selectedHandoffId,
    selectedEscalationId,
    selectedStaffingRole,
    selectedReadinessRole
  }), [selectedOperation, roleView, selectedTaskId, selectedDependencyId, selectedHandoffId, selectedEscalationId, selectedStaffingRole, selectedReadinessRole])
  const roleOperationsBrief = useMemo(() => buildRoleOperationsBrief({ roleView, selectedOperation, selectedStaffing, selectedReadinessSignoff }), [roleView, selectedOperation, selectedStaffing, selectedReadinessSignoff])

  const fleetOperationItems = readinessOperations.map(operation => ({
    operation,
    metrics: getOperationReleaseMetrics(operation)
  }))
  const fleetAverageReadiness = fleetOperationItems.length > 0
    ? Math.round(fleetOperationItems.reduce((sum, item) => sum + item.metrics.releaseScore, 0) / fleetOperationItems.length)
    : 0
  const fleetNeedsAttention = fleetOperationItems.filter(item => getTurnaroundReadinessTone(item.metrics) === 'attention').length
  const fleetWatchCount = fleetOperationItems.filter(item => getTurnaroundReadinessTone(item.metrics) === 'watch').length
  const fleetOpenEscalations = fleetOperationItems.reduce((sum, item) => sum + Number(item.metrics.openEscalations || 0), 0)

  return (
    <section className="operational-turnaround-panel ce-command-panel" aria-labelledby="operational-turnaround-heading" data-testid="react-operational-turnaround-panel">
      <OperationalTurnaroundHero
        focusLine={focusLine}
        selectedDemoUser={selectedDemoUser}
        readinessCount={readinessOperations.length}
        passengerTotal={passengerTotal}
        highCoordinationCount={highCoordinationCount}
      />

      <TurnaroundFleetBoard
        fleetOperationItems={fleetOperationItems}
        selectedOperation={selectedOperation}
        fleetAverageReadiness={fleetAverageReadiness}
        fleetNeedsAttention={fleetNeedsAttention}
        fleetWatchCount={fleetWatchCount}
        fleetOpenEscalations={fleetOpenEscalations}
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

      <OperationalCommandOverviewPanel
        creatingTaskId={creatingTaskId}
        getOperationCommandDraft={getOperationCommandDraft}
        getTaskCreateDraft={getTaskCreateDraft}
        onCreateTask={onCreateTask}
        onUpdateOperationCommand={onUpdateOperationCommand}
        roleView={roleView}
        saveOperationCommand={saveOperationCommand}
        saveTaskCreate={saveTaskCreate}
        selectedOperation={selectedOperation}
        updateOperationCommandDraft={updateOperationCommandDraft}
        updateTaskCreateDraft={updateTaskCreateDraft}
        updatingOperationId={updatingOperationId}
      />

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
