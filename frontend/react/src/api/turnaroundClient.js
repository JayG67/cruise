import { buildScopedApiPath, getScopedRequestOptions, requestJson } from './httpClient.js'

export async function getTurnaroundOperations(options = {}) {
  const requestOptions = getScopedRequestOptions(options)
  const operations = await requestJson('/cruise/turnaround-operations', {
    ...requestOptions,
    cache: 'no-store'
  })
  return Array.isArray(operations) ? operations : []
}

export async function getTurnaroundOperationAuditEvents(operationId, options = {}) {
  if (!operationId) {
    throw new Error('Turnaround operation id is required.')
  }

  const response = await requestJson(buildScopedApiPath(`/cruise/turnaround-operations/${encodeURIComponent(operationId)}/audit-events`, options), getScopedRequestOptions(options))
  return Array.isArray(response?.auditEvents) ? response.auditEvents : []
}


export async function updateTurnaroundOperationCommand(operationId, payload, options = {}) {
  if (!operationId) {
    throw new Error('Turnaround operation id is required.')
  }

  return requestJson(buildScopedApiPath(`/cruise/turnaround-operations/${encodeURIComponent(operationId)}`, options), {
    ...getScopedRequestOptions(options),
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateTurnaroundTaskStatus(taskId, status, options = {}) {
  if (!taskId) {
    throw new Error('Turnaround task id is required.')
  }

  const { blockerReason, ...statusOptions } = options
  const requestOptions = getScopedRequestOptions(statusOptions)
  const payload = { status }

  if (blockerReason !== undefined) {
    payload.blockerReason = blockerReason
  }

  return requestJson(buildScopedApiPath(`/cruise/turnaround-tasks/${encodeURIComponent(taskId)}/status`, options), {
    ...requestOptions,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(requestOptions.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateTurnaroundTaskDetails(taskId, payload, options = {}) {
  if (!taskId) {
    throw new Error('Turnaround task id is required.')
  }

  return requestJson(buildScopedApiPath(`/cruise/turnaround-tasks/${encodeURIComponent(taskId)}/details`, options), {
    ...getScopedRequestOptions(options),
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}


export async function createTurnaroundTask(operationId, payload, options = {}) {
  if (!operationId) {
    throw new Error('Turnaround operation id is required.')
  }

  return requestJson(buildScopedApiPath(`/cruise/turnaround-operations/${encodeURIComponent(operationId)}/tasks`, options), {
    ...getScopedRequestOptions(options),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function createTurnaroundTaskUpdate(taskId, payload, options = {}) {
  if (!taskId) {
    throw new Error('Turnaround task id is required.')
  }

  return requestJson(buildScopedApiPath(`/cruise/turnaround-tasks/${encodeURIComponent(taskId)}/updates`, options), {
    ...getScopedRequestOptions(options),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}


export async function deleteTurnaroundTask(taskId, options = {}) {
  if (!taskId) {
    throw new Error('Turnaround task id is required.')
  }

  return requestJson(buildScopedApiPath(`/cruise/turnaround-tasks/${encodeURIComponent(taskId)}`, options), {
    ...getScopedRequestOptions(options),
    method: 'DELETE'
  })
}


export async function createTurnaroundEscalation(operationId, payload, options = {}) {
  if (!operationId) {
    throw new Error('Turnaround operation id is required.')
  }

  return requestJson(buildScopedApiPath(`/cruise/turnaround-operations/${encodeURIComponent(operationId)}/escalations`, options), {
    ...getScopedRequestOptions(options),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateTurnaroundEscalation(escalationId, payload, options = {}) {
  if (!escalationId) {
    throw new Error('Turnaround escalation id is required.')
  }

  return requestJson(buildScopedApiPath(`/cruise/turnaround-escalations/${encodeURIComponent(escalationId)}`, options), {
    ...getScopedRequestOptions(options),
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}


export async function updateTurnaroundHandoff(handoffId, payload, options = {}) {
  if (!handoffId) {
    throw new Error('Turnaround handoff id is required.')
  }

  return requestJson(buildScopedApiPath(`/cruise/turnaround-handoffs/${encodeURIComponent(handoffId)}`, options), {
    ...getScopedRequestOptions(options),
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateTurnaroundStaffing(operationId, departmentRole, payload, options = {}) {
  if (!operationId) {
    throw new Error('Turnaround operation id is required.')
  }

  if (!departmentRole) {
    throw new Error('Turnaround department role is required.')
  }

  return requestJson(buildScopedApiPath(`/cruise/turnaround-operations/${encodeURIComponent(operationId)}/staffing/${encodeURIComponent(departmentRole)}`, options), {
    ...getScopedRequestOptions(options),
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}
export async function updateTurnaroundSignoff(operationId, departmentRole, payload, options = {}) {
  if (!operationId) {
    throw new Error('Turnaround operation id is required.')
  }
  if (!departmentRole) {
    throw new Error('Turnaround department role is required.')
  }
  return requestJson(buildScopedApiPath(`/cruise/turnaround-operations/${encodeURIComponent(operationId)}/signoffs/${encodeURIComponent(departmentRole)}`, options), {
    ...getScopedRequestOptions(options),
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}
