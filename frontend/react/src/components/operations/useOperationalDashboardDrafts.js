import {
  buildEscalationCreateDraft,
  buildEscalationUpdateDraft,
  buildHandoffDraft,
  buildOperationCommandDraft,
  buildSignoffDraft,
  buildStaffingDraft,
  buildTaskCreateDraft,
  buildTaskDetailDraft
} from '../../domain/operationalDashboardDrafts.js'
import { useKeyedDrafts } from './useKeyedDrafts.js'

export function useOperationalDashboardDrafts({
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
}) {
  const operationCommands = useKeyedDrafts(buildOperationCommandDraft)
  const escalationCreates = useKeyedDrafts(() => buildEscalationCreateDraft({ roleView, selectedPerson: selectedDemoUser }))
  const escalationUpdates = useKeyedDrafts(buildEscalationUpdateDraft)
  const handoffs = useKeyedDrafts(handoff => buildHandoffDraft(handoff, selectedDemoUser))
  const staffing = useKeyedDrafts((operationCard, departmentRole) => buildStaffingDraft(operationCard, departmentRole, selectedDemoUser))
  const signoffs = useKeyedDrafts((operationCard, departmentRole) => buildSignoffDraft(operationCard, departmentRole, selectedDemoUser))
  const taskCreates = useKeyedDrafts(() => buildTaskCreateDraft({ roleView, selectedPerson: selectedDemoUser }))
  const taskDetails = useKeyedDrafts(buildTaskDetailDraft)
  const taskUpdates = useKeyedDrafts(() => '')

  async function saveAndClear({ save, clear, key }) {
    const response = await save()
    if (response) clear(key)
    return response
  }

  function getOperationCommandDraft(operationCard) {
    return operationCommands.getDraft(operationCard.id, operationCard)
  }

  function updateOperationCommandDraft(operationCard, fieldName, value) {
    operationCommands.updateDraft(operationCard.id, fieldName, value, operationCard)
  }

  function saveOperationCommand(operationCard) {
    return saveAndClear({
      key: operationCard.id,
      clear: operationCommands.clearDraft,
      save: () => onUpdateOperationCommand?.(operationCard.id, getOperationCommandDraft(operationCard))
    })
  }

  function getEscalationCreateDraft(operationCard) {
    return escalationCreates.getDraft(operationCard.id)
  }

  function updateEscalationCreateDraft(operationCard, fieldName, value) {
    escalationCreates.updateDraft(operationCard.id, fieldName, value)
  }

  function saveEscalationCreate(operationCard) {
    return saveAndClear({
      key: operationCard.id,
      clear: escalationCreates.clearDraft,
      save: () => onCreateEscalation?.(operationCard.id, getEscalationCreateDraft(operationCard))
    })
  }

  function getEscalationUpdateDraft(escalation) {
    return escalationUpdates.getDraft(escalation.id, escalation)
  }

  function updateEscalationDraft(escalation, fieldName, value) {
    escalationUpdates.updateDraft(escalation.id, fieldName, value, escalation)
  }

  function saveEscalationUpdate(escalation) {
    return saveAndClear({
      key: escalation.id,
      clear: escalationUpdates.clearDraft,
      save: () => onUpdateEscalation?.(escalation.id, getEscalationUpdateDraft(escalation))
    })
  }

  function getHandoffDraft(handoff) {
    return handoffs.getDraft(handoff.id, handoff)
  }

  function updateHandoffDraft(handoff, fieldName, value) {
    handoffs.updateDraft(handoff.id, fieldName, value, handoff)
  }

  function saveHandoffUpdate(handoff) {
    return saveAndClear({
      key: handoff.id,
      clear: handoffs.clearDraft,
      save: () => onUpdateHandoff?.(handoff.id, getHandoffDraft(handoff))
    })
  }

  function getStaffingDraft(operationCard, departmentRole = roleView) {
    const draftKey = `${operationCard.id}:${departmentRole}`
    return staffing.getDraft(draftKey, operationCard, departmentRole)
  }

  function updateStaffingDraft(operationCard, fieldName, value, departmentRole = roleView) {
    const draftKey = `${operationCard.id}:${departmentRole}`
    staffing.updateDraft(draftKey, fieldName, value, operationCard, departmentRole)
  }

  function saveStaffing(operationCard, departmentRole = roleView) {
    const draftKey = `${operationCard.id}:${departmentRole}`
    const draft = getStaffingDraft(operationCard, departmentRole)
    const payload = {
      ...draft,
      plannedCount: Number(draft.plannedCount || 0),
      checkedInCount: Number(draft.checkedInCount || 0)
    }

    return saveAndClear({
      key: draftKey,
      clear: staffing.clearDraft,
      save: () => onUpdateStaffing?.(operationCard.id, departmentRole, payload)
    })
  }

  function getSignoffDraft(operationCard, departmentRole = roleView) {
    const draftKey = `${operationCard.id}:${departmentRole}`
    return signoffs.getDraft(draftKey, operationCard, departmentRole)
  }

  function updateSignoffDraft(operationCard, fieldName, value, departmentRole = roleView) {
    const draftKey = `${operationCard.id}:${departmentRole}`
    signoffs.updateDraft(draftKey, fieldName, value, operationCard, departmentRole)
  }

  function saveSignoff(operationCard, departmentRole = roleView) {
    const draftKey = `${operationCard.id}:${departmentRole}`
    return saveAndClear({
      key: draftKey,
      clear: signoffs.clearDraft,
      save: () => onUpdateSignoff?.(operationCard.id, departmentRole, getSignoffDraft(operationCard, departmentRole))
    })
  }

  function getTaskCreateDraft(operationCard) {
    return taskCreates.getDraft(operationCard.id)
  }

  function updateTaskCreateDraft(operationCard, fieldName, value) {
    taskCreates.updateDraft(operationCard.id, fieldName, value)
  }

  function saveTaskCreate(operationCard) {
    return saveAndClear({
      key: operationCard.id,
      clear: taskCreates.clearDraft,
      save: () => onCreateTask?.(operationCard.id, { ...getTaskCreateDraft(operationCard), status: 'READY' })
    })
  }

  function getTaskDetailDraft(task) {
    return taskDetails.getDraft(task.id, task)
  }

  function updateTaskDetailDraft(task, fieldName, value) {
    taskDetails.updateDraft(task.id, fieldName, value, task)
  }

  function saveTaskDetails(task) {
    return saveAndClear({
      key: task.id,
      clear: taskDetails.clearDraft,
      save: () => onUpdateTaskDetails?.(task.id, getTaskDetailDraft(task))
    })
  }

  function updateStatus(task, status) {
    return onUpdateTaskStatus?.(task.id, status, { blockerReason: getTaskDetailDraft(task).blockerReason })
  }

  function getTaskUpdateDraft(task) {
    return taskUpdates.getDraft(task.id)
  }

  function updateTaskUpdateDraft(task, value) {
    taskUpdates.setDraft(task.id, value)
  }

  async function saveTaskUpdate(task) {
    const message = getTaskUpdateDraft(task).trim()
    if (!message) return undefined

    return saveAndClear({
      key: task.id,
      clear: taskUpdates.clearDraft,
      save: () => onCreateTaskUpdate?.(task.id, {
        authorName: selectedDemoUser?.displayName || 'Operational lead',
        updateType: 'NOTE',
        message
      })
    })
  }

  async function removeTask(task) {
    const response = await onDeleteTask?.(task.id)
    if (response) {
      taskDetails.clearDraft(task.id)
      taskUpdates.clearDraft(task.id)
    }
    return response
  }

  return {
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
  }
}
