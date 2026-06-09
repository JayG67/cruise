import { useCallback, useEffect, useRef, useState } from 'react'

import { createTurnaroundEscalation, createTurnaroundTask, createTurnaroundTaskUpdate, deleteTurnaroundTask, getTurnaroundOperations, updateTurnaroundEscalation, updateTurnaroundHandoff, updateTurnaroundOperationCommand, updateTurnaroundStaffing, updateTurnaroundSignoff, updateTurnaroundTaskDetails, updateTurnaroundTaskStatus } from '../api/client.js'

export default function useTurnaroundOperations({ enabled = true } = {}) {
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

  const reload = useCallback(async () => {
    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)

    try {
      const operations = await getTurnaroundOperations({ signal: controller.signal })
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
  }, [])


  const updateOperationCommand = useCallback(async (operationId, payload) => {
    setUpdatingOperationId(operationId)
    setMutationStatus('')
    setMutationError('')

    try {
      const response = await updateTurnaroundOperationCommand(operationId, payload)
      if (response?.operation?.id) {
        setTurnaroundOperations(currentOperations => currentOperations.map(operation => (
          operation.id === response.operation.id ? response.operation : operation
        )))
      } else {
        await reload()
      }
      setMutationStatus(response?.message || 'Turnaround command plan updated successfully')
      return response
    } catch (updateError) {
      setMutationError(updateError.message || 'Unable to update turnaround command plan.')
      return null
    } finally {
      setUpdatingOperationId('')
    }
  }, [reload])

  const updateTaskStatus = useCallback(async (taskId, status, options = {}) => {
    setUpdatingTaskId(taskId)
    setMutationStatus('')
    setMutationError('')

    try {
      const response = await updateTurnaroundTaskStatus(taskId, status, options)
      if (response?.operation?.id) {
        setTurnaroundOperations(currentOperations => currentOperations.map(operation => (
          operation.id === response.operation.id ? response.operation : operation
        )))
      } else {
        await reload()
      }
      setMutationStatus(response?.message || 'Turnaround task status updated successfully')
      return response
    } catch (updateError) {
      setMutationError(updateError.message || 'Unable to update turnaround task status.')
      return null
    } finally {
      setUpdatingTaskId('')
    }
  }, [reload])



  const updateTaskDetails = useCallback(async (taskId, payload) => {
    setUpdatingTaskDetailsId(taskId)
    setMutationStatus('')
    setMutationError('')

    try {
      const response = await updateTurnaroundTaskDetails(taskId, payload)
      if (response?.operation?.id) {
        setTurnaroundOperations(currentOperations => currentOperations.map(operation => (
          operation.id === response.operation.id ? response.operation : operation
        )))
      } else {
        await reload()
      }
      setMutationStatus(response?.message || 'Turnaround task details updated successfully')
      return response
    } catch (updateError) {
      setMutationError(updateError.message || 'Unable to update turnaround task details.')
      return null
    } finally {
      setUpdatingTaskDetailsId('')
    }
  }, [reload])


  const createTask = useCallback(async (operationId, payload) => {
    setCreatingTaskId(operationId)
    setMutationStatus('')
    setMutationError('')

    try {
      const response = await createTurnaroundTask(operationId, payload)
      if (response?.operation?.id) {
        setTurnaroundOperations(currentOperations => currentOperations.map(operation => (
          operation.id === response.operation.id ? response.operation : operation
        )))
      } else {
        await reload()
      }
      setMutationStatus(response?.message || 'Turnaround task created successfully')
      return response
    } catch (updateError) {
      setMutationError(updateError.message || 'Unable to create turnaround task.')
      return null
    } finally {
      setCreatingTaskId('')
    }
  }, [reload])

  const createTaskUpdate = useCallback(async (taskId, payload) => {
    setCreatingTaskUpdateId(taskId)
    setMutationStatus('')
    setMutationError('')

    try {
      const response = await createTurnaroundTaskUpdate(taskId, payload)
      if (response?.operation?.id) {
        setTurnaroundOperations(currentOperations => currentOperations.map(operation => (
          operation.id === response.operation.id ? response.operation : operation
        )))
      } else {
        await reload()
      }
      setMutationStatus(response?.message || 'Turnaround task update added successfully')
      return response
    } catch (updateError) {
      setMutationError(updateError.message || 'Unable to add turnaround task update.')
      return null
    } finally {
      setCreatingTaskUpdateId('')
    }
  }, [reload])


  const deleteTask = useCallback(async (taskId) => {
    setDeletingTaskId(taskId)
    setMutationStatus('')
    setMutationError('')

    try {
      const response = await deleteTurnaroundTask(taskId)
      if (response?.operation?.id) {
        setTurnaroundOperations(currentOperations => currentOperations.map(operation => (
          operation.id === response.operation.id ? response.operation : operation
        )))
      } else {
        await reload()
      }
      setMutationStatus(response?.message || 'Turnaround task removed successfully')
      return response
    } catch (deleteError) {
      setMutationError(deleteError.message || 'Unable to remove turnaround task.')
      return null
    } finally {
      setDeletingTaskId('')
    }
  }, [reload])


  const updateStaffing = useCallback(async (operationId, departmentRole, payload) => {
    const staffingKey = `${operationId}:${departmentRole}`
    setUpdatingStaffingKey(staffingKey)
    setMutationStatus('')
    setMutationError('')

    try {
      const response = await updateTurnaroundStaffing(operationId, departmentRole, payload)
      if (response?.operation?.id) {
        setTurnaroundOperations(currentOperations => currentOperations.map(operation => (
          operation.id === response.operation.id ? response.operation : operation
        )))
      } else {
        await reload()
      }
      setMutationStatus(response?.message || 'Turnaround staffing plan updated successfully')
      return response
    } catch (updateError) {
      setMutationError(updateError.message || 'Unable to update turnaround staffing plan.')
      return null
    } finally {
      setUpdatingStaffingKey('')
    }
  }, [reload])

  const updateSignoff = useCallback(async (operationId, departmentRole, payload) => {
    const signoffKey = `${operationId}:${departmentRole}`
    setUpdatingSignoffKey(signoffKey)
    setMutationStatus('')
    setMutationError('')

    try {
      const response = await updateTurnaroundSignoff(operationId, departmentRole, payload)
      if (response?.operation?.id) {
        setTurnaroundOperations(currentOperations => currentOperations.map(operation => (
          operation.id === response.operation.id ? response.operation : operation
        )))
      } else {
        await reload()
      }
      setMutationStatus(response?.message || 'Turnaround readiness signoff updated successfully')
      return response
    } catch (updateError) {
      setMutationError(updateError.message || 'Unable to update turnaround readiness signoff.')
      return null
    } finally {
      setUpdatingSignoffKey('')
    }
  }, [reload])


  const createEscalation = useCallback(async (operationId, payload) => {
    setCreatingEscalationId(operationId)
    setMutationStatus('')
    setMutationError('')

    try {
      const response = await createTurnaroundEscalation(operationId, payload)
      if (response?.operation?.id) {
        setTurnaroundOperations(currentOperations => currentOperations.map(operation => (
          operation.id === response.operation.id ? response.operation : operation
        )))
      } else {
        await reload()
      }
      setMutationStatus(response?.message || 'Turnaround escalation created successfully')
      return response
    } catch (createError) {
      setMutationError(createError.message || 'Unable to create turnaround escalation.')
      return null
    } finally {
      setCreatingEscalationId('')
    }
  }, [reload])

  const updateEscalation = useCallback(async (escalationId, payload) => {
    setUpdatingEscalationId(escalationId)
    setMutationStatus('')
    setMutationError('')

    try {
      const response = await updateTurnaroundEscalation(escalationId, payload)
      if (response?.operation?.id) {
        setTurnaroundOperations(currentOperations => currentOperations.map(operation => (
          operation.id === response.operation.id ? response.operation : operation
        )))
      } else {
        await reload()
      }
      setMutationStatus(response?.message || 'Turnaround escalation updated successfully')
      return response
    } catch (updateError) {
      setMutationError(updateError.message || 'Unable to update turnaround escalation.')
      return null
    } finally {
      setUpdatingEscalationId('')
    }
  }, [reload])


  const updateHandoff = useCallback(async (handoffId, payload) => {
    setUpdatingHandoffId(handoffId)
    setMutationStatus('')
    setMutationError('')

    try {
      const response = await updateTurnaroundHandoff(handoffId, payload)
      if (response?.operation?.id) {
        setTurnaroundOperations(currentOperations => currentOperations.map(operation => (
          operation.id === response.operation.id ? response.operation : operation
        )))
      } else {
        await reload()
      }
      setMutationStatus(response?.message || 'Turnaround handoff updated successfully')
      return response
    } catch (updateError) {
      setMutationError(updateError.message || 'Unable to update turnaround handoff.')
      return null
    } finally {
      setUpdatingHandoffId('')
    }
  }, [reload])

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
