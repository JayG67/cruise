import { useCallback, useEffect, useRef, useState } from 'react'

import { createTurnaroundTaskUpdate, getTurnaroundOperations, updateTurnaroundTaskDetails, updateTurnaroundTaskStatus } from '../api/client.js'

export default function useTurnaroundOperations({ enabled = true } = {}) {
  const abortRef = useRef(null)
  const [turnaroundOperations, setTurnaroundOperations] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(enabled))
  const [error, setError] = useState('')
  const [mutationStatus, setMutationStatus] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [updatingTaskId, setUpdatingTaskId] = useState('')
  const [updatingTaskDetailsId, setUpdatingTaskDetailsId] = useState('')
  const [creatingTaskUpdateId, setCreatingTaskUpdateId] = useState('')

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

  useEffect(() => {
    if (!enabled) {
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
    updateTaskStatus,
    updateTaskDetails,
    createTaskUpdate,
    updatingTaskId,
    updatingTaskDetailsId,
    creatingTaskUpdateId,
    mutationStatus,
    mutationError
  }
}
