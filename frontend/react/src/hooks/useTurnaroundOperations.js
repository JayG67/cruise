import { useCallback, useEffect, useRef, useState } from 'react'

import { createTurnaroundEscalation, createTurnaroundTask, createTurnaroundTaskUpdate, deleteTurnaroundTask, getTurnaroundOperations, updateTurnaroundEscalation, updateTurnaroundHandoff, updateTurnaroundOperationCommand, updateTurnaroundStaffing, updateTurnaroundSignoff, updateTurnaroundTaskDetails, updateTurnaroundTaskStatus } from '../api/client.js'

export default function useTurnaroundOperations({ enabled = true, selectedDemoUser = null } = {}) {
  const abortRef = useRef(null)
  const [turnaroundOperations, setTurnaroundOperations] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(enabled))
  const [error, setError] = useState('')
  const [mutationStatus, setMutationStatus] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [updatingOperationId, setUpdatingOperationId] = useState('')
  const [updatingTaskId, setUpdatingTaskId] = useState('')
  const [updatingTaskDetailsId, setUpdatingTaskDetailsId] = useState('')
  const [creatingTaskId, setCreatingTaskId] = useState('')
  const [creatingTaskUpdateId, setCreatingTaskUpdateId] = useState('')
  const [deletingTaskId, setDeletingTaskId] = useState('')
  const [updatingSignoffKey, setUpdatingSignoffKey] = useState('')
  const [updatingStaffingKey, setUpdatingStaffingKey] = useState('')
  const [creatingEscalationId, setCreatingEscalationId] = useState('')
  const [updatingEscalationId, setUpdatingEscalationId] = useState('')
  const [updatingHandoffId, setUpdatingHandoffId] = useState('')
  const mutationScope = { selectedDemoUser }

  const reload = useCallback(async () => {
    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)

    try {
      const operations = await getTurnaroundOperations({ signal: controller.signal, selectedDemoUser })
      setTurnaroundOperations(operations)
      setError('')
    } catch (loadError) {
      if (loadError.name !== 'AbortError') {
        setTurnaroundOperations([])
        setError(loadError.message || 'Unable to load turnaround operations.')
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [selectedDemoUser?.id])

  const runMutation = useCallback(async ({
    pendingKey,
    setPendingKey,
    request,
    successMessage,
    errorMessage
  }) => {
    setPendingKey(pendingKey)
    setMutationStatus('')
    setMutationError('')

    try {
      const response = await request()
      if (response?.operation?.id) {
        setTurnaroundOperations(currentOperations => currentOperations.map(operation => (
          operation.id === response.operation.id ? response.operation : operation
        )))
      } else {
        await reload()
      }
      setMutationStatus(response?.message || successMessage)
      return response
    } catch (mutationFailure) {
      setMutationError(mutationFailure.message || errorMessage)
      return null
    } finally {
      setPendingKey('')
    }
  }, [reload])

  const updateOperationCommand = useCallback((operationId, payload) => runMutation({
    pendingKey: operationId,
    setPendingKey: setUpdatingOperationId,
    request: () => updateTurnaroundOperationCommand(operationId, payload, mutationScope),
    successMessage: 'Turnaround command plan updated successfully',
    errorMessage: 'Unable to update turnaround command plan.'
  }), [runMutation, selectedDemoUser?.id])

  const updateTaskStatus = useCallback((taskId, status, options = {}) => runMutation({
    pendingKey: taskId,
    setPendingKey: setUpdatingTaskId,
    request: () => updateTurnaroundTaskStatus(taskId, status, { ...options, ...mutationScope }),
    successMessage: 'Turnaround task status updated successfully',
    errorMessage: 'Unable to update turnaround task status.'
  }), [runMutation, selectedDemoUser?.id])

  const updateTaskDetails = useCallback((taskId, payload) => runMutation({
    pendingKey: taskId,
    setPendingKey: setUpdatingTaskDetailsId,
    request: () => updateTurnaroundTaskDetails(taskId, payload, mutationScope),
    successMessage: 'Turnaround task details updated successfully',
    errorMessage: 'Unable to update turnaround task details.'
  }), [runMutation, selectedDemoUser?.id])

  const createTask = useCallback((operationId, payload) => runMutation({
    pendingKey: operationId,
    setPendingKey: setCreatingTaskId,
    request: () => createTurnaroundTask(operationId, payload, mutationScope),
    successMessage: 'Turnaround task created successfully',
    errorMessage: 'Unable to create turnaround task.'
  }), [runMutation, selectedDemoUser?.id])

  const createTaskUpdate = useCallback((taskId, payload) => runMutation({
    pendingKey: taskId,
    setPendingKey: setCreatingTaskUpdateId,
    request: () => createTurnaroundTaskUpdate(taskId, payload, mutationScope),
    successMessage: 'Turnaround task update added successfully',
    errorMessage: 'Unable to add turnaround task update.'
  }), [runMutation, selectedDemoUser?.id])

  const deleteTask = useCallback((taskId) => runMutation({
    pendingKey: taskId,
    setPendingKey: setDeletingTaskId,
    request: () => deleteTurnaroundTask(taskId, mutationScope),
    successMessage: 'Turnaround task removed successfully',
    errorMessage: 'Unable to remove turnaround task.'
  }), [runMutation, selectedDemoUser?.id])

  const updateStaffing = useCallback((operationId, departmentRole, payload) => runMutation({
    pendingKey: `${operationId}:${departmentRole}`,
    setPendingKey: setUpdatingStaffingKey,
    request: () => updateTurnaroundStaffing(operationId, departmentRole, payload, mutationScope),
    successMessage: 'Turnaround staffing plan updated successfully',
    errorMessage: 'Unable to update turnaround staffing plan.'
  }), [runMutation, selectedDemoUser?.id])

  const updateSignoff = useCallback((operationId, departmentRole, payload) => runMutation({
    pendingKey: `${operationId}:${departmentRole}`,
    setPendingKey: setUpdatingSignoffKey,
    request: () => updateTurnaroundSignoff(operationId, departmentRole, payload, mutationScope),
    successMessage: 'Turnaround readiness signoff updated successfully',
    errorMessage: 'Unable to update turnaround readiness signoff.'
  }), [runMutation, selectedDemoUser?.id])

  const createEscalation = useCallback((operationId, payload) => runMutation({
    pendingKey: operationId,
    setPendingKey: setCreatingEscalationId,
    request: () => createTurnaroundEscalation(operationId, payload, mutationScope),
    successMessage: 'Turnaround escalation created successfully',
    errorMessage: 'Unable to create turnaround escalation.'
  }), [runMutation, selectedDemoUser?.id])

  const updateEscalation = useCallback((escalationId, payload) => runMutation({
    pendingKey: escalationId,
    setPendingKey: setUpdatingEscalationId,
    request: () => updateTurnaroundEscalation(escalationId, payload, mutationScope),
    successMessage: 'Turnaround escalation updated successfully',
    errorMessage: 'Unable to update turnaround escalation.'
  }), [runMutation, selectedDemoUser?.id])

  const updateHandoff = useCallback((handoffId, payload) => runMutation({
    pendingKey: handoffId,
    setPendingKey: setUpdatingHandoffId,
    request: () => updateTurnaroundHandoff(handoffId, payload, mutationScope),
    successMessage: 'Turnaround handoff updated successfully',
    errorMessage: 'Unable to update turnaround handoff.'
  }), [runMutation, selectedDemoUser?.id])

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort()
      setIsLoading(false)
      return undefined
    }

    reload()

    return () => abortRef.current?.abort()
  }, [enabled, reload])

  return {
    turnaroundOperations,
    isLoading,
    error,
    reload,
    updateOperationCommand,
    updateTaskStatus,
    updateTaskDetails,
    createTask,
    createTaskUpdate,
    deleteTask,
    updateStaffing,
    updateSignoff,
    createEscalation,
    updateEscalation,
    updateHandoff,
    updatingOperationId,
    updatingTaskId,
    updatingTaskDetailsId,
    creatingTaskId,
    creatingTaskUpdateId,
    deletingTaskId,
    updatingSignoffKey,
    updatingStaffingKey,
    creatingEscalationId,
    updatingEscalationId,
    updatingHandoffId,
    mutationStatus,
    mutationError
  }
}
