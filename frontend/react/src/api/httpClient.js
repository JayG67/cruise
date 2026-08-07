import { requestStaticFallback } from './staticFallback'
const DEFAULT_HEADERS = {
  Accept: 'application/json'
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

class ApiResponseFormatError extends Error {
  constructor(response, cause) {
    const requestedUrl = response?.url || 'API response'
    super(`The live data service did not return JSON for ${requestedUrl}. Showing available read-only fallback data instead.`)
    this.name = 'ApiResponseFormatError'
    this.response = response
    this.cause = cause
  }
}

function buildApiUrl(path) {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with "/": ${path}`)
  }

  return `${API_BASE_URL}${path}`
}



export function getScopedDemoUserId(options = {}) {
  return options.demoUserId || options.selectedDemoUser?.id || ''
}

export function buildScopedHeaders(options = {}) {
  const scopedDemoUserId = getScopedDemoUserId(options)

  if (!scopedDemoUserId) {
    return options.headers || {}
  }

  return {
    ...(options.headers || {}),
    'X-Cruise-Demo-User-Id': scopedDemoUserId
  }
}

export function buildScopedApiPath(path) {
  return path
}

export function getScopedRequestOptions(options = {}) {
  const { demoUserId, selectedDemoUser, ...requestOptions } = options
  return {
    ...requestOptions,
    headers: buildScopedHeaders(options)
  }
}

export async function parseJsonResponse(response) {
  let payload

  try {
    payload = await response.json()
  } catch (error) {
    throw new ApiResponseFormatError(response, error)
  }

  if (!response.ok) {
    const serverMessage = payload?.message || payload?.error || payload?.detail
    throw new Error(serverMessage || `The server could not complete this request. Please review the request data and try again. HTTP ${response.status}.`)
  }

  return payload
}

export async function requestJson(path, options = {}) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...(options.headers || {})
    }
  })

  try {
    return await parseJsonResponse(response)
  } catch (error) {
    if (error instanceof ApiResponseFormatError) {
      return requestStaticFallback(path, options)
    }

    throw error
  }
}
