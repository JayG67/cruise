import { useState } from 'react'

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
  const [operationCommandDrafts, setOperationCommandDrafts] = useState({})
  const [taskDetailDrafts, setTaskDetailDrafts] = useState({})
  const [taskCreateDrafts, setTaskCreateDrafts] = useState({})
  const [taskUpdateDrafts, setTaskUpdateDrafts] = useState({})
  const [signoffDrafts, setSignoffDrafts] = useState({})
  const [staffingDrafts, setStaffingDrafts] = useState({})
  const [escalationCreateDrafts, setEscalationCreateDrafts] = useState({})
  const [escalationUpdateDrafts, setEscalationUpdateDrafts] = useState({})
  const [handoffDrafts, setHandoffDrafts] = useState({})

  function getOperationCommandDraft(operationCard) {
    return operationCommandDrafts[operationCard.id] || {
      status: operationCard.commandStatus || operationCard.status || 'PLANNED',
      readinessLevel: operationCard.commandReadinessLevel || operationCard.readinessLevel || 'Standard coordination',
      port: operationCard.port || operationCard.arrivalPort || '',
      notes: operationCard.notes || ''
    }
  }

  function updateOperationCommandDraft(operationCard, fieldName, value) {
    setOperationCommandDrafts(current => ({
      ...current,
      [operationCard.id]: {
        ...getOperationCommandDraft(operationCard),
        [fieldName]: value
      }
    }))
  }

  async function saveOperationCommand(operationCard) {
    const draft = getOperationCommandDraft(operationCard)
    const response = await onUpdateOperationCommand?.(operationCard.id, draft)

    if (response) {
      setOperationCommandDrafts(current => {
        const next = { ...current }
        delete next[operationCard.id]
        return next
      })
    }
  }

  function getEscalationCreateDraft(operationCard) {
    return escalationCreateDrafts[operationCard.id] || {
      departmentRole: roleView,
      severity: 'WATCH',
      title: '',
      ownerName: selectedDemoUser?.displayName || '',
      status: 'OPEN',
      resolutionNotes: ''
    }
  }

  function updateEscalationCreateDraft(operationCard, fieldName, value) {
    setEscalationCreateDrafts(current => ({
      ...current,
      [operationCard.id]: {
        ...getEscalationCreateDraft(operationCard),
        [fieldName]: value
      }
    }))
  }

  async function saveEscalationCreate(operationCard) {
    const draft = getEscalationCreateDraft(operationCard)
    const response = await onCreateEscalation?.(operationCard.id, draft)

    if (response) {
      setEscalationCreateDrafts(current => {
        const next = { ...current }
        delete next[operationCard.id]
        return next
      })
    }
  }

  function getEscalationUpdateDraft(escalation) {
    return escalationUpdateDrafts[escalation.id] || {
      severity: escalation.severity || 'WATCH',
      title: escalation.title || '',
      ownerName: escalation.ownerName || '',
      status: escalation.status || 'OPEN',
      resolutionNotes: escalation.resolutionNotes || ''
    }
  }

  function updateEscalationDraft(escalation, fieldName, value) {
    setEscalationUpdateDrafts(current => ({
      ...current,
      [escalation.id]: {
        ...getEscalationUpdateDraft(escalation),
        [fieldName]: value
      }
    }))
  }

  async function saveEscalationUpdate(escalation) {
    const draft = getEscalationUpdateDraft(escalation)
    const response = await onUpdateEscalation?.(escalation.id, draft)

    if (response) {
      setEscalationUpdateDrafts(current => {
        const next = { ...current }
        delete next[escalation.id]
        return next
      })
    }
  }

  function getHandoffDraft(handoff) {
    return handoffDrafts[handoff.id] || {
      status: handoff.status || 'PENDING',
      ownerName: handoff.ownerName || selectedDemoUser?.displayName || '',
      dueTime: handoff.dueTime || '',
      notes: handoff.notes || ''
    }
  }

  function updateHandoffDraft(handoff, fieldName, value) {
    setHandoffDrafts(current => ({
      ...current,
      [handoff.id]: {
        ...getHandoffDraft(handoff),
        [fieldName]: value
      }
    }))
  }

  async function saveHandoffUpdate(handoff) {
    const response = await onUpdateHandoff?.(handoff.id, getHandoffDraft(handoff))

    if (response) {
      setHandoffDrafts(current => {
        const next = { ...current }
        delete next[handoff.id]
        return next
      })
    }
  }

  function getRoleStaffing(operationCard, departmentRole = roleView) {
    return (operationCard.staffing || []).find(staffing => staffing.departmentRole === departmentRole) || {
      departmentRole,
      plannedCount: 0,
      checkedInCount: 0,
      leadName: selectedDemoUser?.displayName || '',
      musterLocation: '',
      notes: ''
    }
  }

  function getStaffingDraft(operationCard, departmentRole = roleView) {
    const existingStaffing = getRoleStaffing(operationCard, departmentRole)
    const draftKey = `${operationCard.id}:${departmentRole}`

    return staffingDrafts[draftKey] || {
      plannedCount: String(existingStaffing.plannedCount ?? 0),
      checkedInCount: String(existingStaffing.checkedInCount ?? 0),
      leadName: existingStaffing.leadName || selectedDemoUser?.displayName || '',
      musterLocation: existingStaffing.musterLocation || '',
      notes: existingStaffing.notes || ''
    }
  }

  function updateStaffingDraft(operationCard, fieldName, value, departmentRole = roleView) {
    const draftKey = `${operationCard.id}:${departmentRole}`

    setStaffingDrafts(current => ({
      ...current,
      [draftKey]: {
        ...getStaffingDraft(operationCard, departmentRole),
        [fieldName]: value
      }
    }))
  }

  async function saveStaffing(operationCard, departmentRole = roleView) {
    const draft = getStaffingDraft(operationCard, departmentRole)
    const payload = {
      ...draft,
      plannedCount: Number(draft.plannedCount || 0),
      checkedInCount: Number(draft.checkedInCount || 0)
    }
    const response = await onUpdateStaffing?.(operationCard.id, departmentRole, payload)

    if (response) {
      setStaffingDrafts(current => {
        const next = { ...current }
        delete next[`${operationCard.id}:${departmentRole}`]
        return next
      })
    }
  }

  function getRoleSignoff(operationCard, departmentRole = roleView) {
    return (operationCard.signoffs || []).find(signoff => signoff.departmentRole === departmentRole) || {
      departmentRole,
      approverName: selectedDemoUser?.displayName || '',
      status: 'PENDING',
      notes: ''
    }
  }

  function getSignoffDraft(operationCard, departmentRole = roleView) {
    const existingSignoff = getRoleSignoff(operationCard, departmentRole)
    const draftKey = `${operationCard.id}:${departmentRole}`

    return signoffDrafts[draftKey] || {
      approverName: existingSignoff.approverName || selectedDemoUser?.displayName || '',
      status: existingSignoff.status || 'PENDING',
      notes: existingSignoff.notes || ''
    }
  }

  function updateSignoffDraft(operationCard, fieldName, value, departmentRole = roleView) {
    const draftKey = `${operationCard.id}:${departmentRole}`

    setSignoffDrafts(current => ({
      ...current,
      [draftKey]: {
        ...getSignoffDraft(operationCard, departmentRole),
        [fieldName]: value
      }
    }))
  }

  async function saveSignoff(operationCard, departmentRole = roleView) {
    const draft = getSignoffDraft(operationCard, departmentRole)
    const response = await onUpdateSignoff?.(operationCard.id, departmentRole, draft)

    if (response) {
      setSignoffDrafts(current => {
        const next = { ...current }
        delete next[`${operationCard.id}:${departmentRole}`]
        return next
      })
    }
  }

  function getTaskCreateDraft(operationCard) {
    return taskCreateDrafts[operationCard.id] || {
      departmentRole: roleView,
      taskName: '',
      ownerName: selectedDemoUser?.displayName || '',
      dueTime: '',
      location: '',
      blockerReason: ''
    }
  }

  function updateTaskCreateDraft(operationCard, fieldName, value) {
    setTaskCreateDrafts(current => ({
      ...current,
      [operationCard.id]: {
        ...getTaskCreateDraft(operationCard),
        [fieldName]: value
      }
    }))
  }

  async function saveTaskCreate(operationCard) {
    const draft = getTaskCreateDraft(operationCard)
    const response = await onCreateTask?.(operationCard.id, {
      ...draft,
      status: 'READY'
    })

    if (response) {
      setTaskCreateDrafts(current => {
        const next = { ...current }
        delete next[operationCard.id]
        return next
      })
    }
  }

  function getTaskDetailDraft(task) {
    return taskDetailDrafts[task.id] || {
      ownerName: task.ownerName || '',
      dueTime: task.dueTime || '',
      location: task.location || '',
      blockerReason: task.blockerReason || ''
    }
  }

  function updateTaskDetailDraft(task, fieldName, value) {
    setTaskDetailDrafts(current => {
      const existingDraft = current[task.id] || {
        ownerName: task.ownerName || '',
        dueTime: task.dueTime || '',
        location: task.location || '',
        blockerReason: task.blockerReason || ''
      }

      return {
        ...current,
        [task.id]: {
          ...existingDraft,
          [fieldName]: value
        }
      }
    })
  }

  async function saveTaskDetails(task) {
    const draft = getTaskDetailDraft(task)
    const response = await onUpdateTaskDetails?.(task.id, draft)

    if (response) {
      setTaskDetailDrafts(current => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
    }
  }

  function updateStatus(task, status) {
    const draft = getTaskDetailDraft(task)
    return onUpdateTaskStatus?.(task.id, status, { blockerReason: draft.blockerReason })
  }

  function getTaskUpdateDraft(task) {
    return taskUpdateDrafts[task.id] || ''
  }

  function updateTaskUpdateDraft(task, value) {
    setTaskUpdateDrafts(current => ({
      ...current,
      [task.id]: value
    }))
  }

  async function saveTaskUpdate(task) {
    const message = getTaskUpdateDraft(task).trim()
    if (!message) return

    const response = await onCreateTaskUpdate?.(task.id, {
      authorName: selectedDemoUser?.displayName || 'Operational lead',
      updateType: 'NOTE',
      message
    })

    if (response) {
      setTaskUpdateDrafts(current => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
    }
  }

  async function removeTask(task) {
    const response = await onDeleteTask?.(task.id)

    if (response) {
      setTaskDetailDrafts(current => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
      setTaskUpdateDrafts(current => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
    }
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
