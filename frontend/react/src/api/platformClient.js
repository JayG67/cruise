import { getScopedRequestOptions, requestJson } from './httpClient.js'

export async function getHealthStatus(options = {}) {
  return requestJson('/health', options)
}

export async function resetDemoData(options = {}) {
  return requestJson('/admin/reset-demo-data', {
    ...options,
    method: 'POST'
  })
}

export async function getTurnaroundAdminSetup(options = {}) {
  return requestJson('/cruise/turnaround-admin/setup', getScopedRequestOptions(options))
}

export async function createTurnaroundPerson(payload, options = {}) {
  return requestJson('/cruise/turnaround-admin/people', {
    ...getScopedRequestOptions(options),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function deleteTurnaroundPerson(personId, options = {}) {
  return requestJson(`/cruise/turnaround-admin/people/${encodeURIComponent(personId)}`, {
    ...getScopedRequestOptions(options),
    method: 'DELETE'
  })
}

export async function updateTurnaroundPerson(personId, payload, options = {}) {
  return requestJson(`/cruise/turnaround-admin/people/${encodeURIComponent(personId)}`, {
    ...getScopedRequestOptions(options),
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}


export async function getDataArchitectureReadiness(options = {}) {
  return requestJson('/cruise/data-architecture/readiness', getScopedRequestOptions(options))
}

export async function getProductionHardeningReadiness(options = {}) {
  return requestJson('/cruise/production-hardening/readiness', getScopedRequestOptions(options))
}

export async function getDeploymentReadiness(options = {}) {
  return requestJson('/cruise/deployment/readiness', getScopedRequestOptions(options))
}

export async function getPublicLaunchReadiness(options = {}) {
  return requestJson('/cruise/public-launch/readiness', getScopedRequestOptions(options))
}

export async function generateOperationalAiBriefing(operationId, payload, options = {}) {
  if (!operationId) throw new Error('Turnaround operation id is required.')
  return requestJson(`/ai/turnaround-operations/${encodeURIComponent(operationId)}/briefing`, {
    ...getScopedRequestOptions(options),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function getOperationalAiBriefingHistory(operationId, options = {}) {
  if (!operationId) throw new Error('Turnaround operation id is required.')
  const limit = Number(options.limit || 20)
  const response = await requestJson(`/ai/turnaround-operations/${encodeURIComponent(operationId)}/briefings?limit=${encodeURIComponent(limit)}`, getScopedRequestOptions(options))
  return response
}

export async function reviewOperationalAiBriefing(operationId, briefingId, payload, options = {}) {
  if (!operationId) throw new Error('Turnaround operation id is required.')
  if (!briefingId) throw new Error('Turnaround briefing id is required.')
  return requestJson(`/ai/turnaround-operations/${encodeURIComponent(operationId)}/briefings/${encodeURIComponent(briefingId)}/review`, {
    ...getScopedRequestOptions(options),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}


export async function getAiCiEvidenceSummary(options = {}) {
  return requestJson('/ai/ci-evidence/summary', getScopedRequestOptions(options))
}


export async function getAiAdversarialQualitySummary(options = {}) {
  return requestJson('/ai/adversarial/quality-summary', getScopedRequestOptions(options))
}


export async function getAiEvaluationQualitySummary(options = {}) {
  const limit = Number(options.limit || 20)
  const suiteId = options.suiteId || 'turnaround-briefing-phase3'
  return requestJson(`/ai/evaluations/turnaround-briefing/quality-summary?suiteId=${encodeURIComponent(suiteId)}&limit=${encodeURIComponent(limit)}`, getScopedRequestOptions(options))
}


export async function previewAiEvaluationReleasePolicy(payload, options = {}) {
  return requestJson('/ai/evaluations/turnaround-briefing/release-policy/preview', {
    ...getScopedRequestOptions(options),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getScopedRequestOptions(options).headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function compareAiEvaluationRuns(currentRunId, baselineRunId, options = {}) {
  if (!currentRunId) throw new Error('Current evaluation run id is required.')
  if (!baselineRunId) throw new Error('Baseline evaluation run id is required.')
  if (currentRunId === baselineRunId) throw new Error('Current and baseline evaluation runs must be different.')
  const suiteId = options.suiteId || 'turnaround-briefing-phase3'
  const query = new URLSearchParams({ suiteId, baselineRunId })
  return requestJson(`/ai/evaluations/turnaround-briefing/runs/${encodeURIComponent(currentRunId)}/compare?${query.toString()}`, getScopedRequestOptions(options))
}
