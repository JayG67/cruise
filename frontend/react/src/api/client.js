const DEFAULT_HEADERS = {
  Accept: 'application/json'
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const STATIC_DATA_URL = '/data/cruise.json'

let staticSeedDataPromise

class ApiResponseFormatError extends Error {
  constructor(response, cause) {
    const requestedUrl = response?.url || 'API response'
    super(`The live data service did not return JSON for ${requestedUrl}. Showing available read-only portfolio data instead.`)
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

function isReadOnlyRequest(options = {}) {
  return !options.method || String(options.method).toUpperCase() === 'GET'
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getCruiseLineId(line) {
  return line.id || slugify(line.name)
}

function getShipId(line, ship) {
  return ship.id || `${getCruiseLineId(line)}-${slugify(ship.name)}`
}

function getSailingId(line, ship, sailing) {
  return sailing.id || `${getShipId(line, ship)}-${sailing.departureDate}`
}

async function loadStaticSeedData() {
  if (!staticSeedDataPromise) {
    staticSeedDataPromise = fetch(STATIC_DATA_URL, {
      headers: DEFAULT_HEADERS
    }).then(async response => {
      if (!response.ok) {
        throw new Error(`Unable to load bundled cruise data. HTTP ${response.status}.`)
      }

      return response.json()
    })
  }

  return staticSeedDataPromise
}

function normalizeStaticCustomers(seedData) {
  return Array.isArray(seedData.customers) ? seedData.customers : []
}

function normalizeStaticBookings(seedData) {
  const customersById = new Map(normalizeStaticCustomers(seedData).map(customer => [customer.id, customer]))

  return (Array.isArray(seedData.bookings) ? seedData.bookings : []).map(booking => ({
    ...booking,
    passengers: (booking.passengers || []).map(passenger => ({
      ...passenger,
      customer: customersById.get(passenger.customerId) || null
    }))
  }))
}

function normalizeStaticDemoUsers(seedData) {
  return Array.isArray(seedData.demoUsers) ? seedData.demoUsers : []
}

function normalizeStaticTurnaroundOperations(seedData) {
  return Array.isArray(seedData.turnaroundOperations) ? seedData.turnaroundOperations : []
}

function normalizeStaticCruiseLines(seedData) {
  return (Array.isArray(seedData.cruiseLines) ? seedData.cruiseLines : []).map(line => ({
    ...line,
    id: getCruiseLineId(line),
    shipCount: Array.isArray(line.ships) ? line.ships.length : 0
  }))
}

function getStaticShipsForCruiseLine(seedData, cruiseLineId) {
  const line = normalizeStaticCruiseLines(seedData).find(candidate => candidate.id === cruiseLineId || slugify(candidate.name) === cruiseLineId)

  if (!line) {
    return []
  }

  return (Array.isArray(line.ships) ? line.ships : []).map(ship => ({
    ...ship,
    id: getShipId(line, ship),
    cruiseLineId: line.id,
    cruiseLineName: line.name,
    sailingCount: Array.isArray(ship.sailings) ? ship.sailings.length : 0
  }))
}

function getStaticSailingsForShip(seedData, shipId) {
  for (const line of normalizeStaticCruiseLines(seedData)) {
    for (const ship of (line.ships || [])) {
      if (getShipId(line, ship) !== shipId && slugify(ship.name) !== shipId) {
        continue
      }

      return (Array.isArray(ship.sailings) ? ship.sailings : []).map(sailing => ({
        ...sailing,
        id: getSailingId(line, ship, sailing),
        shipId: getShipId(line, ship),
        shipName: ship.name,
        cruiseLineId: line.id,
        cruiseLineName: line.name
      }))
    }
  }

  return []
}

function getStaticItineraryForSailing(seedData, sailingId) {
  for (const line of normalizeStaticCruiseLines(seedData)) {
    for (const ship of (line.ships || [])) {
      for (const sailing of (ship.sailings || [])) {
        if (getSailingId(line, ship, sailing) === sailingId) {
          return Array.isArray(sailing.itinerary) ? sailing.itinerary : []
        }
      }
    }
  }

  return []
}


function getScopedDemoUserId(options = {}) {
  return options.demoUserId || options.selectedDemoUser?.id || ''
}

function buildScopedHeaders(options = {}) {
  const scopedDemoUserId = getScopedDemoUserId(options)

  if (!scopedDemoUserId) {
    return options.headers || {}
  }

  return {
    ...(options.headers || {}),
    'X-Cruise-Demo-User-Id': scopedDemoUserId
  }
}

function buildScopedApiPath(path) {
  return path
}

function getScopedRequestOptions(options = {}) {
  const { demoUserId, selectedDemoUser, ...requestOptions } = options
  return {
    ...requestOptions,
    headers: buildScopedHeaders(options)
  }
}

async function requestStaticFallback(path, options = {}) {
  if (!isReadOnlyRequest(options)) {
    throw new Error('Live data writes require the application API. Please try again when the service is available.')
  }

  const seedData = await loadStaticSeedData()
  const requestPath = path.split('?')[0]

  if (requestPath === '/cruise/customers') {
    return normalizeStaticCustomers(seedData)
  }

  if (path === '/cruise/bookings' || requestPath === '/cruise/bookings') {
    return normalizeStaticBookings(seedData)
  }

  if (requestPath === '/cruise/demo-users') {
    return normalizeStaticDemoUsers(seedData)
  }

  if (requestPath === '/cruise/turnaround-operations') {
    return normalizeStaticTurnaroundOperations(seedData)
  }

  if (requestPath === '/cruise/audit-events') {
    return { auditEvents: [], filters: {}, staticFallback: true }
  }



  if (requestPath === '/cruise/portfolio/showcase') {
    return {
      title: 'Portfolio Polish Center',
      overallScore: 50,
      status: 'watch',
      summary: 'Bundled static data is available; live portfolio showcase checks require the application API.',
      gates: [
        { id: 'portfolio-narrative', label: 'Portfolio narrative', score: 55, status: 'watch', summary: 'Static fallback cannot inspect the full project README and component index.', evidence: ['Read-only fallback mode'], recommendations: ['Start the API for complete portfolio narrative scoring.'] },
        { id: 'launch-assets', label: 'Launch assets', score: 45, status: 'needs-polish', summary: 'Static fallback cannot inspect launch assets.', evidence: ['Read-only fallback mode'], recommendations: ['Prepare screenshots, architecture diagram, public URL, and resume bullets.'] }
      ],
      screenshotPlan: [
        { id: 'turnaround-command-center', title: 'Turnaround operations command view', purpose: 'Lead with the flagship operational workflow.', capture: 'Show readiness, blockers, and department execution.' }
      ],
      resumeBullets: [
        { id: 'resume-1', text: 'Built a role-aware cruise turnaround operations platform with production-minded readiness gates.', confidence: 'draft' }
      ],
      interviewTalkingPoints: [
        { id: 'product-ownership', prompt: 'Why this project matters', talkingPoint: 'It demonstrates realistic operational workflows beyond CRUD.' }
      ],
      launchChecklist: [{ sequence: 1, gateId: 'launch-assets', title: 'Launch assets', status: 'needs-polish', action: 'Prepare screenshots, architecture diagram, public URL, and resume bullets.' }],
      staticFallback: true
    }
  }

  if (requestPath === '/cruise/deployment/readiness') {
    return {
      title: 'Deployment Readiness Center',
      overallScore: 45,
      status: 'watch',
      summary: 'Bundled static data is available; live deployment readiness checks require the application API.',
      gates: [
        { id: 'platform-target', label: 'Hosting platform target', score: 50, status: 'watch', summary: 'Static fallback cannot inspect live platform configuration.', evidence: ['Read-only fallback mode'], recommendations: ['Start the API for complete deployment target readiness scoring.'] },
        { id: 'environment', label: 'Environment and secrets plan', score: 40, status: 'needs-work', summary: 'Static fallback cannot inspect environment setup.', evidence: ['Read-only fallback mode'], recommendations: ['Document deployment environment variables before launch.'] }
      ],
      launchPlan: [{ sequence: 1, gateId: 'environment', title: 'Environment and secrets plan', status: 'needs-work', action: 'Start the live API for complete deployment readiness checks.' }],
      deploymentTargets: [
        { id: 'render', label: 'Render', status: 'candidate', evidence: 'Static fallback mode.', nextStep: 'Verify platform config from the live API.' }
      ],
      releaseEvidence: [{ label: 'Full regression gate', value: 'Static fallback' }],
      staticFallback: true
    }
  }

  if (requestPath === '/cruise/production-hardening/readiness') {
    return {
      title: 'Production Hardening Center',
      overallScore: 45,
      status: 'watch',
      summary: 'Bundled static data is available; live production hardening checks require the application API.',
      gates: [
        { id: 'environment', label: 'Environment configuration', score: 40, status: 'needs-hardening', summary: 'Static fallback cannot inspect live environment variables.', evidence: ['Read-only fallback mode'], recommendations: ['Start the API for complete production environment readiness scoring.'] },
        { id: 'deployment', label: 'Deployment readiness', score: 50, status: 'watch', summary: 'Static fallback can show the workspace but cannot inspect deployment files.', evidence: ['Read-only fallback mode'], recommendations: ['Add deployment documentation after choosing the hosting target.'] }
      ],
      launchSequence: ['Start the live API for complete production hardening checks.'],
      staticFallback: true
    }
  }

  if (requestPath === '/cruise/data-architecture/readiness') {
    return {
      title: 'Data Architecture Hardening Center',
      overallScore: 50,
      status: 'watch',
      summary: 'Bundled static data is available; live architecture checks require the application API.',
      gates: [
        { id: 'identity', label: 'Identity normalization', score: 50, status: 'watch', summary: 'Static fallback cannot fully inspect normalized user tables.', evidence: ['Read-only fallback mode'], recommendations: ['Start the API for complete architecture readiness scoring.'] },
        { id: 'dates', label: 'Date and time hardening', score: 40, status: 'needs-hardening', summary: 'Static data still uses date-only values for sailings.', evidence: ['Read-only fallback mode'], recommendations: ['Move operational dates to timezone-aware timestamp fields.'] }
      ],
      migrationBacklog: [
        { id: 'migration-dates', gateId: 'dates', sequence: 1, title: 'Promote operational dates to timezone-aware timestamps', phase: 'Foundation', owner: 'Operations platform', effort: 'M', risk: 'high', status: 'needs-hardening', migration: 'Start the API for complete migration planning.', acceptance: 'Operational execution moments are timezone-aware.' },
        { id: 'migration-identity', gateId: 'identity', sequence: 2, title: 'Backfill stable person references', phase: 'Foundation', owner: 'Platform data', effort: 'M', risk: 'medium', status: 'watch', migration: 'Start the API for complete identity backfill planning.', acceptance: 'Records join by IDs instead of display names.' }
      ],
      migrationTimeline: [
        { phase: 'Foundation', sequence: 1, status: 'needs-hardening', risk: 'high', items: ['migration-dates', 'migration-identity'], summary: '2 migration workstreams queued for foundation.' }
      ],
      schemaContract: [],
      riskRegister: [
        { id: 'risk-dates', title: 'Promote operational dates to timezone-aware timestamps', severity: 'high', mitigation: 'Start the live API to inspect real field coverage.', validation: 'Operational execution moments are timezone-aware.' }
      ],
      roadmap: ['Start the live API for complete data architecture hardening checks.'],
      staticFallback: true
    }
  }

  if (requestPath === '/cruise') {
    return normalizeStaticCruiseLines(seedData)
  }

  if (requestPath.startsWith('/cruise/ships/')) {
    return getStaticShipsForCruiseLine(seedData, decodeURIComponent(requestPath.replace('/cruise/ships/', '')))
  }

  if (requestPath.startsWith('/cruise/ship/') && requestPath.endsWith('/sailings')) {
    const shipId = decodeURIComponent(requestPath.replace('/cruise/ship/', '').replace('/sailings', ''))
    return getStaticSailingsForShip(seedData, shipId)
  }

  if (requestPath.startsWith('/cruise/sailings/') && requestPath.endsWith('/itinerary')) {
    const sailingId = decodeURIComponent(requestPath.replace('/cruise/sailings/', '').replace('/itinerary', ''))
    return getStaticItineraryForSailing(seedData, sailingId)
  }

  if (requestPath === '/health') {
    return { status: 'static-fallback', mode: 'read-only' }
  }

  throw new Error('Bundled read-only data is not available for this request.')
}

export async function parseJsonResponse(response) {
  let payload

  try {
    payload = await response.json()
  } catch (error) {
    throw new ApiResponseFormatError(response, error)
  }

  if (!response.ok) {
    throw new Error(payload?.message || `The server could not complete this request. Please review the request data and try again. HTTP ${response.status}.`)
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

export async function getCustomers(options = {}) {
  const customers = await requestJson('/cruise/customers', options)
  return Array.isArray(customers) ? customers : []
}

export async function getBookings(options = {}) {
  const bookings = await requestJson('/cruise/bookings', options)
  return Array.isArray(bookings) ? bookings : []
}


export async function getPlatformAuditEvents(filters = {}, options = {}) {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(filters || {})) {
    if (value !== undefined && value !== null && String(value).trim()) {
      searchParams.set(key, String(value).trim())
    }
  }

  const queryString = searchParams.toString()
  const response = await requestJson(`/cruise/audit-events${queryString ? `?${queryString}` : ''}`, getScopedRequestOptions(options))
  return Array.isArray(response?.auditEvents) ? response.auditEvents : []
}

export async function getTurnaroundOperations(options = {}) {
  const operations = await requestJson('/cruise/turnaround-operations', getScopedRequestOptions(options))
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

export async function getDemoUsers(options = {}) {
  const demoUsers = await requestJson('/cruise/demo-users', options)
  return Array.isArray(demoUsers) ? demoUsers : []
}

export async function getAdminHierarchySnapshot(options = {}) {
  const [customers, bookings] = await Promise.all([
    getCustomers(options),
    getBookings(options)
  ])

  return { customers, bookings }
}


export async function createCustomer(payload, options = {}) {
  return requestJson('/cruise/customers', {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function deleteCustomer(customerId, options = {}) {
  return requestJson(`/cruise/customers/${encodeURIComponent(customerId)}`, {
    ...options,
    method: 'DELETE'
  })
}

export async function createBooking(payload, options = {}) {
  return requestJson('/cruise/bookings', {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function deleteBooking(bookingId, options = {}) {
  return requestJson(`/cruise/bookings/${encodeURIComponent(bookingId)}`, {
    ...options,
    method: 'DELETE'
  })
}

export async function updateCustomerProfile(customerId, payload, options = {}) {
  return requestJson(`/cruise/customers/${encodeURIComponent(customerId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}


export async function updatePassengerProfile(customerId, payload, options = {}) {
  return requestJson(`/cruise/customers/${encodeURIComponent(customerId)}/passenger-profile`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateBookingDetails(bookingId, payload, options = {}) {
  return requestJson(`/cruise/bookings/${encodeURIComponent(bookingId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function getCruiseLines(options = {}) {
  const cruiseLines = await requestJson('/cruise', options)
  return Array.isArray(cruiseLines) ? cruiseLines : []
}

export async function getShipsForCruiseLine(cruiseLineId, options = {}) {
  const ships = await requestJson(`/cruise/ships/${encodeURIComponent(cruiseLineId)}`, options)
  return Array.isArray(ships) ? ships : []
}

export async function createCruiseLine(payload, options = {}) {
  return requestJson('/cruise/cruise-line', {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateCruiseLine(cruiseLineId, payload, options = {}) {
  return requestJson(`/cruise/cruise-line/${encodeURIComponent(cruiseLineId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function createShip(payload, options = {}) {
  return requestJson('/cruise/ship', {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateShip(shipId, payload, options = {}) {
  return requestJson(`/cruise/ship/${encodeURIComponent(shipId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function deleteShip(shipId, options = {}) {
  return requestJson(`/cruise/ship/${encodeURIComponent(shipId)}`, {
    ...options,
    method: 'DELETE'
  })
}

export async function getSailingsForShip(shipId, options = {}) {
  const sailings = await requestJson(`/cruise/ship/${encodeURIComponent(shipId)}/sailings`, options)
  return Array.isArray(sailings) ? sailings : []
}

export async function createSailing(shipId, payload, options = {}) {
  return requestJson(`/cruise/ship/${encodeURIComponent(shipId)}/sailings`, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateSailing(sailingId, payload, options = {}) {
  return requestJson(`/cruise/sailings/${encodeURIComponent(sailingId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function deleteSailing(sailingId, options = {}) {
  return requestJson(`/cruise/sailings/${encodeURIComponent(sailingId)}`, {
    ...options,
    method: 'DELETE'
  })
}

export async function getItineraryForSailing(sailingId, options = {}) {
  const itinerary = await requestJson(`/cruise/sailings/${encodeURIComponent(sailingId)}/itinerary`, options)
  return Array.isArray(itinerary) ? itinerary : []
}

export async function createItineraryDay(sailingId, payload, options = {}) {
  return requestJson(`/cruise/sailings/${encodeURIComponent(sailingId)}/itinerary`, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateItineraryDay(itineraryDayId, payload, options = {}) {
  return requestJson(`/cruise/itinerary-days/${encodeURIComponent(itineraryDayId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function deleteItineraryDay(itineraryDayId, options = {}) {
  return requestJson(`/cruise/itinerary-days/${encodeURIComponent(itineraryDayId)}`, {
    ...options,
    method: 'DELETE'
  })
}

export async function createItineraryActivity(itineraryDayId, payload, options = {}) {
  return requestJson(`/cruise/itinerary-days/${encodeURIComponent(itineraryDayId)}/activities`, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateItineraryActivity(activityId, payload, options = {}) {
  return requestJson(`/cruise/activities/${encodeURIComponent(activityId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function deleteItineraryActivity(activityId, options = {}) {
  return requestJson(`/cruise/activities/${encodeURIComponent(activityId)}`, {
    ...options,
    method: 'DELETE'
  })
}

export async function deleteCruiseLine(cruiseLineId, options = {}) {
  return requestJson(`/cruise/cruise-line/${encodeURIComponent(cruiseLineId)}`, {
    ...options,
    method: 'DELETE'
  })
}

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

export async function getPortfolioShowcase(options = {}) {
  return requestJson('/cruise/portfolio/showcase', getScopedRequestOptions(options))
}

export async function getPublicLaunchReadiness(options = {}) {
  return requestJson('/cruise/public-launch/readiness', getScopedRequestOptions(options))
}
