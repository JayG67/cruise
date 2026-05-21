const API_BASE = '/cruise'
const testOutput = document.getElementById('testOutput')
const healthCheckBtn = document.getElementById('healthCheckBtn')
const reloadDataBtn = document.getElementById('reloadDataBtn')
const uiSmokeTestBtn = document.getElementById('uiSmokeTestBtn')
const apiContractCheckBtn = document.getElementById('apiContractCheckBtn')
const crudWorkflowCheckBtn = document.getElementById('crudWorkflowCheckBtn')
const performanceSmokeCheckBtn = document.getElementById('performanceSmokeCheckBtn')
const seedIntegrityCheckBtn = document.getElementById('seedIntegrityCheckBtn')
const renderingConsistencyCheckBtn = document.getElementById('renderingConsistencyCheckBtn')
const deploymentDiagnosticsBtn = document.getElementById('deploymentDiagnosticsBtn')
const resetDemoDataBtn = document.getElementById('resetDemoDataBtn')
const clearTestOutputBtn = document.getElementById('clearTestOutputBtn')

let cruiseLines = []
let selectedCruiseLineForShips = null
let selectedCruiseLineNameForShips = ''
let selectedShipForSailings = null
let selectedShipNameForSailings = ''
let selectedSailingForItinerary = null
let demoUsers = []
let activeDemoUser = null
let activeDemoContext = null


const DINING_PREFERENCE_OPTIONS = [
  "Early seating",
  "Late seating",
  "Anytime dining",
  "My Time dining",
  "Freestyle dining",
  "Rotational dining",
  "Flexible dining",
  "Special dietary request",
  "Kids menu"
]

function renderDiningPreferenceOptions(selectedPreference = '') {
  return DINING_PREFERENCE_OPTIONS
    .map(option => `<option value="${escapeHtml(option)}" ${option === selectedPreference ? 'selected' : ''}>${escapeHtml(option)}</option>`)
    .join('')
}


let pendingFocusTarget = null


function renderInlineBookingDetailsContainer(bookingId) {
  return `
    <div
      class="inline-booking-details"
      id="inline-booking-details-${bookingId}"
      data-testid="inline-booking-details"
      data-cy="inline-booking-details"
      hidden
    >
      <div
        class="inline-booking-details-content"
        id="inline-booking-details-content-${bookingId}"
      ></div>
    </div>
  `
}



function getActiveCustomerId() {
  return activeDemoContext?.customer?.id || activeDemoUser?.customerId || ''
}

function renderPassengerSelfServicePanel(context) {
  const customer = context.customer || {}
  const canEdit = Boolean(customer.id)

  if (!canEdit) return ''

  return `
    <section class="passenger-self-service" data-cy="passenger-self-service-panel" data-testid="passenger-self-service-panel">
      <h4>My travel profile</h4>
      <p>Passengers can update limited contact and cruise preference information for the demo booking experience.</p>
      <form class="passenger-profile-form" data-cy="passenger-profile-form" data-testid="passenger-profile-form">
        <label><span>First name</span><input name="firstName" value="${escapeHtml(customer.firstName || '')}" required /></label>
        <label><span>Last name</span><input name="lastName" value="${escapeHtml(customer.lastName || '')}" required /></label>
        <label><span>Email</span><input name="email" type="email" value="${escapeHtml(customer.email || '')}" required /></label>
        <label><span>Phone</span><input name="phone" value="${escapeHtml(customer.phone || '')}" /></label>
        <label><span>Dining preference</span><select name="diningPreference" data-cy="dining-preference-select" data-testid="dining-preference-select">${renderDiningPreferenceOptions(context.bookings?.[0]?.passengers?.find(passenger => passenger.customerId === customer.id)?.diningPreference || 'Anytime dining')}</select></label>
        <label><span>Accessibility notes</span><input name="accessibilityNotes" value="${escapeHtml(context.bookings?.[0]?.passengers?.find(passenger => passenger.customerId === customer.id)?.accessibilityNotes || '')}" /></label>
        <button type="submit" data-cy="passenger-profile-submit-button" data-testid="passenger-profile-submit-button">Save profile</button>
        <p class="form-message" data-cy="passenger-profile-message" data-testid="passenger-profile-message"></p>
      </form>
    </section>
  `
}

async function savePassengerProfile(event) {
  event.preventDefault()

  const form = event.currentTarget
  const customerId = getActiveCustomerId()
  const message = form.querySelector('[data-cy="passenger-profile-message"]')

  if (!customerId) return

  const formData = new FormData(form)
  const payload = {
    firstName: getTrimmedFormValue(formData, 'firstName'),
    lastName: getTrimmedFormValue(formData, 'lastName'),
    email: getTrimmedFormValue(formData, 'email'),
    phone: getTrimmedFormValue(formData, 'phone'),
    diningPreference: getTrimmedFormValue(formData, 'diningPreference'),
    accessibilityNotes: getTrimmedFormValue(formData, 'accessibilityNotes')
  }

  try {
    if (message) message.textContent = 'Saving profile...'

    const response = await fetch(`${API_BASE}/customers/${customerId}/passenger-profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await parseJsonResponse(response)

    if (!response.ok) {
      throw new Error(result.message || `Profile update failed with status ${response.status}`)
    }

    if (message) message.textContent = result.message || 'Profile saved.'
    await loadDemoUserContext(activeDemoUser.id)
  } catch (error) {
    console.error(error)
    if (message) message.textContent = error.message || 'Could not save profile.'
  }
}


function focusSection(sectionId) {
  const section = document.getElementById(sectionId)

  if (!section) return

  pendingFocusTarget = sectionId
  section.setAttribute('tabindex', '-1')
  section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  section.focus({ preventScroll: true })
}

function getPendingFocusTarget() {
  return pendingFocusTarget
}


document.addEventListener('DOMContentLoaded', () => {
  const reloadButton = document.getElementById('reload-button')
  const searchInput = document.getElementById('search-input')
  const createCruiseLineForm = document.getElementById('create-cruise-line-form')
  const addShipInputBtn = document.getElementById('add-ship-input-btn')
  const resetCruiseLineFormBtn = document.getElementById('reset-cruise-line-form-btn')
  const updateCruiseLineForm = document.getElementById('update-cruise-line-form')
  const addUpdateShipInputBtn = document.getElementById('add-update-ship-input-btn')
  const cancelUpdateCruiseLineBtn = document.getElementById('cancel-update-cruise-line-btn')
  const demoUserSelector = document.getElementById('demo-user-selector')

  if (document.getElementById('cruise-grid')) {
    loadDemoUsers()
    loadCruiseLines()
  }

  if (reloadButton) {
    reloadButton.addEventListener('click', loadCruiseLines)
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.trim().toLowerCase()
      const filteredLines = cruiseLines.filter(line =>
        line.name.toLowerCase().includes(searchTerm) ||
        (line.country && line.country.toLowerCase().includes(searchTerm))
      )
      renderCruiseLines(filteredLines)
    })
  }

  if (createCruiseLineForm) {
    createCruiseLineForm.addEventListener('submit', createCruiseLine)
  }

  if (addShipInputBtn) {
    addShipInputBtn.addEventListener('click', () => addShipInputRow())
  }

  if (resetCruiseLineFormBtn) {
    resetCruiseLineFormBtn.addEventListener('click', resetCreateCruiseLineForm)
  }

  if (updateCruiseLineForm) {
    updateCruiseLineForm.addEventListener('submit', updateCruiseLine)
  }

  if (addUpdateShipInputBtn) {
    addUpdateShipInputBtn.addEventListener('click', () => addUpdateShipInputRow())
  }

  if (cancelUpdateCruiseLineBtn) {
    cancelUpdateCruiseLineBtn.addEventListener('click', hideUpdateCruiseLinePanel)
  }

  if (demoUserSelector) {
    demoUserSelector.addEventListener('change', () => {
      resetDashboardSelectionState()
      loadDemoUserContext(demoUserSelector.value)
    })
  }
})


function resetDashboardSelectionState() {
  selectedCruiseLineForShips = null
  selectedCruiseLineNameForShips = ''
  selectedShipForSailings = null
  selectedShipNameForSailings = ''
  selectedSailingForItinerary = null

  const searchInput = document.getElementById('search-input')
  const shipsPanel = document.getElementById('ships-panel')
  const shipsTitle = document.getElementById('ships-title')
  const shipsGrid = document.getElementById('ships-grid')
  const sailingsPanel = document.getElementById('sailings-panel')
  const sailingsTitle = document.getElementById('sailings-title')
  const sailingsGrid = document.getElementById('sailings-grid')
  const itineraryPanel = document.getElementById('itinerary-panel')
  const itineraryTitle = document.getElementById('itinerary-title')
  const itineraryGrid = document.getElementById('itinerary-grid')

  if (searchInput) searchInput.value = ''
  if (shipsPanel) shipsPanel.hidden = true
  if (shipsTitle) shipsTitle.textContent = 'Ships'
  if (shipsGrid) shipsGrid.innerHTML = ''
  if (sailingsPanel) sailingsPanel.hidden = true
  if (sailingsTitle) sailingsTitle.textContent = 'Sailings'
  if (sailingsGrid) sailingsGrid.innerHTML = ''
  if (itineraryPanel) itineraryPanel.hidden = true
  if (itineraryTitle) itineraryTitle.textContent = 'Cruise Details'
  if (itineraryGrid) itineraryGrid.innerHTML = ''

  hideUpdateCruiseLinePanel()

  if (Array.isArray(cruiseLines) && cruiseLines.length) {
    renderCruiseLines(cruiseLines)
  }
}


async function loadDemoUsers() {
  const selector = document.getElementById('demo-user-selector')
  const summary = document.getElementById('demo-role-summary')

  if (!selector) return

  try {
    const response = await fetch(`${API_BASE}/demo-users`)

    if (!response.ok) {
      throw new Error(`Demo users request failed with status ${response.status}`)
    }

    demoUsers = await response.json()
    selector.innerHTML = ''

    demoUsers.forEach(user => {
      const option = document.createElement('option')
      option.value = user.id
      option.textContent = `${user.displayName} (${formatDemoRole(user.role)})`
      selector.appendChild(option)
    })

    const adminUser = demoUsers.find(user => user.role === 'ADMIN') || demoUsers[0]

    if (adminUser) {
      selector.value = adminUser.id
      await loadDemoUserContext(adminUser.id)
    }
  } catch (err) {
    console.error(err)
    if (summary) summary.textContent = 'Could not load demo roles.'
  }
}

async function loadDemoUserContext(userId) {
  const summary = document.getElementById('demo-role-summary')

  if (!userId) return

  try {
    if (summary) summary.textContent = 'Loading selected role context...'

    const response = await fetch(`${API_BASE}/demo-users/${encodeURIComponent(userId)}/context`)
    const context = await parseJsonResponse(response)

    if (!response.ok) {
      throw new Error(context.message || `Demo user context failed with status ${response.status}`)
    }

    activeDemoUser = context.user
    activeDemoContext = context
    applyDemoRoleVisibility(context)
    renderDemoRoleSummary(context)
    renderRoleBookingDashboard(context)
  } catch (err) {
    console.error(err)
    if (summary) summary.textContent = err.message || 'Could not load demo role context.'
    renderRoleBookingDashboard(null, err.message || 'Could not load demo role context.')
  }
}

function applyDemoRoleVisibility(context) {
  const body = document.body
  const canManage = Boolean(context?.visibility?.canManageCruiseData)

  body.classList.toggle('demo-admin-mode', canManage)
  body.classList.toggle('demo-passenger-mode', !canManage)

  document.querySelectorAll('[data-admin-only="true"]').forEach(element => {
    element.hidden = !canManage
  })
}

function renderDemoRoleSummary(context) {
  const summary = document.getElementById('demo-role-summary')

  if (!summary || !context) return

  const user = context.user
  const customer = context.customer
  const bookingCount = context.visibility?.accessibleBookingCount || 0
  const customerCount = context.visibility?.accessibleCustomerCount || 0

  if (user.role === 'ADMIN') {
    summary.innerHTML = `
      <strong>${escapeHtml(user.displayName)}</strong>
      <span>Admin mode — full cruise data management enabled.</span>
      <span>${escapeHtml(String(context.visibility.accessibleCustomerCount))} customers and ${escapeHtml(String(context.visibility.accessibleBookingCount))} bookings available.</span>
    `
    return
  }

  summary.innerHTML = `
    <strong>${escapeHtml(user.displayName)}</strong>
    <span>${escapeHtml(formatDemoRole(user.role))}${customer ? ` for ${escapeHtml(customer.firstName)} ${escapeHtml(customer.lastName)}` : ''}</span>
    <span>${escapeHtml(String(bookingCount))} booking${bookingCount === 1 ? '' : 's'} and ${escapeHtml(String(customerCount))} visible customer profile${customerCount === 1 ? '' : 's'}.</span>
  `
}

function renderRoleBookingDashboard(context, errorMessage = '') {
  const dashboard = document.getElementById('role-booking-dashboard')
  const title = document.getElementById('role-booking-dashboard-heading')
  const description = document.querySelector('[data-cy="role-booking-dashboard-description"]')
  const grid = document.getElementById('role-booking-dashboard-grid')

  if (!dashboard || !grid) return

  if (!context) {
    if (title) title.textContent = 'Booking visibility unavailable'
    if (description) description.textContent = errorMessage || 'Role context could not be loaded.'
    grid.innerHTML = '<p class="empty-message" data-cy="role-booking-dashboard-empty" data-testid="role-booking-dashboard-empty">No role-specific booking information is currently available.</p>'
    return
  }

  const user = context.user || {}
  const bookings = Array.isArray(context.bookings) ? context.bookings : []
  const visibility = context.visibility || {}

  dashboard.hidden = false
  document.querySelectorAll('[data-cy="passenger-self-service-panel"]').forEach(panel => panel.remove())
  grid.innerHTML = ''

  if (user.role === 'ADMIN') {
    if (title) title.textContent = 'Admin operations visibility'
    if (description) {
      description.textContent = `Admin can manage cruise data and view ${visibility.accessibleCustomerCount || 0} customers across ${visibility.accessibleBookingCount || 0} bookings.`
    }

    const card = document.createElement('article')
    card.className = 'role-booking-card role-admin-card'
    card.setAttribute('data-cy', 'role-admin-visibility-card')
    card.setAttribute('data-testid', 'role-admin-visibility-card')
    card.innerHTML = `
      <h4>Administrative access</h4>
      <p><strong>Mode:</strong> Full cruise operations management</p>
      <p><strong>Customers visible:</strong> ${escapeHtml(String(visibility.accessibleCustomerCount || 0))}</p>
      <p><strong>Bookings visible:</strong> ${escapeHtml(String(visibility.accessibleBookingCount || 0))}</p>
      <p class="role-dashboard-note">Customer-facing booking cards are shown when a passenger or group leader role is selected.</p>
    `
    grid.appendChild(card)
    return
  }

  grid.insertAdjacentHTML('beforebegin', renderPassengerSelfServicePanel(context))
  const profileForm = document.querySelector('[data-cy="passenger-profile-form"]')
  if (profileForm) profileForm.addEventListener('submit', savePassengerProfile)

  if (title) title.textContent = `${formatDemoRole(user.role)} booking dashboard`
  if (description) {
    description.textContent = `Showing ${bookings.length} booking${bookings.length === 1 ? '' : 's'} visible to ${user.displayName || 'this role'}.`
  }

  if (!bookings.length) {
    grid.innerHTML = '<p class="empty-message" data-cy="role-booking-dashboard-empty" data-testid="role-booking-dashboard-empty">No bookings are visible for this selected role.</p>'
    return
  }

  bookings.forEach(booking => {
    const card = document.createElement('article')
    card.className = 'role-booking-card'
    card.setAttribute('data-cy', 'role-booking-card')
    card.setAttribute('data-testid', 'role-booking-card')

    const passengers = Array.isArray(booking.passengers) ? booking.passengers : []
    const passengerItems = passengers.map(passenger => {
      const customer = passenger.customer || {}
      const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || passenger.customerId

      return `
        <li data-cy="role-booking-passenger" data-testid="role-booking-passenger">
          <span>${escapeHtml(name)}</span>
          <span>${escapeHtml(passenger.isPrimaryGuest ? 'Primary Guest' : formatDemoRole(passenger.passengerRole || 'Guest'))}</span>
        </li>
      `
    }).join('')

    card.innerHTML = `
      <div class="role-booking-card-header">
        <h4>Booking ${escapeHtml(booking.id)}</h4>
        <span class="status-pill">${escapeHtml(booking.bookingStatus || 'Status unavailable')}</span>
      </div>
      <dl class="role-booking-details">
        <div><dt>Cruise line</dt><dd>${escapeHtml(booking.cruiseLine?.name || 'Cruise line unavailable')}</dd></div>
        <div><dt>Ship</dt><dd>${escapeHtml(booking.ship?.name || 'Ship unavailable')}</dd></div>
        <div><dt>Sailing date</dt><dd>${escapeHtml(booking.sailing?.departureDate || 'Date unavailable')}</dd></div>
        <div><dt>Cabin</dt><dd>${escapeHtml(booking.cabinNumber || 'Not assigned')}</dd></div>
        <div><dt>Route</dt><dd>${escapeHtml(booking.embarkationPort || booking.sailing?.departurePort || 'Departure unavailable')} → ${escapeHtml(booking.debarkationPort || booking.sailing?.arrivalPort || 'Arrival unavailable')}</dd></div>
      </dl>
      <div class="role-passenger-list">
        <h5>Visible passengers</h5>
        <ul>${passengerItems}</ul>
      </div>
      <div class="role-booking-actions">
        <button type="button" data-cy="role-booking-details-button" data-testid="role-booking-details-button" aria-expanded="false">View Details</button>
      </div>

      ${renderInlineBookingDetailsContainer(booking.bookingId || booking.id || booking.sailing?.id || 'booking')}
    `

    const detailsButton = card.querySelector('[data-cy="role-booking-details-button"]')

    if (detailsButton && booking.sailing?.id) {
      detailsButton.addEventListener('click', () => toggleBookingCruiseDetails(booking, detailsButton))
    } else if (detailsButton) {
      detailsButton.disabled = true
      detailsButton.textContent = 'Details unavailable'
    }

    grid.appendChild(card)
  })
}


function toggleBookingCruiseDetails(booking, detailsButton) {
  const bookingKey = booking.bookingId || booking.id || booking.sailing?.id
  const detailsContainer = document.getElementById(`inline-booking-details-${bookingKey}`)

  if (detailsContainer && !detailsContainer.hidden) {
    detailsContainer.hidden = true
    detailsButton.textContent = 'View Details'
    detailsButton.setAttribute('aria-expanded', 'false')
    return
  }

  detailsButton.textContent = 'Hide Details'
  detailsButton.setAttribute('aria-expanded', 'true')
  loadBookingCruiseDetails(booking)
}

async function loadBookingCruiseDetails(booking, favoritesOnly = false) {
  if (!booking?.sailing?.id) return

  const bookingKey = booking.bookingId || booking.id || booking.sailing.id
  const customerId = getActiveCustomerId()
  const detailsContainer = document.getElementById(`inline-booking-details-${bookingKey}`)
  const detailsContent = document.getElementById(`inline-booking-details-content-${bookingKey}`)

  if (!detailsContainer || !detailsContent) {
    await loadItinerary(booking.sailing.id, {
      ...booking.sailing,
      departurePort: booking.embarkationPort || booking.sailing.departurePort,
      arrivalPort: booking.debarkationPort || booking.sailing.arrivalPort
    })
    return
  }

  detailsContainer.hidden = false
  detailsContent.innerHTML = '<p class="inline-details-loading">Loading cruise details...</p>'

  try {
    const query = new URLSearchParams()
    if (customerId) query.set('customerId', customerId)
    if (favoritesOnly) query.set('favoritesOnly', 'true')

    const response = await fetch(`${API_BASE}/sailings/${booking.sailing.id}/itinerary?${query.toString()}`)

    if (!response.ok) throw new Error(`Cruise details request failed with status ${response.status}`)

    const itineraryDays = await response.json()

    const itineraryMarkup = Array.isArray(itineraryDays) && itineraryDays.length
      ? itineraryDays.map(day => {
        const activities = (day.activitySchedule || [])
          .map(activity => `
            <li class="inline-itinerary-activity" data-testid="inline-itinerary-activity" data-cy="inline-itinerary-activity">
              <span><strong>${escapeHtml(activity.time)}</strong> ${escapeHtml(activity.activity)}</span>
              <button
                type="button"
                class="favorite-toggle star-favorite-checkbox ${activity.isFavorite ? 'is-favorite' : ''}"
                role="checkbox"
                aria-checked="${activity.isFavorite ? 'true' : 'false'}"
                aria-label="${activity.isFavorite ? 'Remove favorite' : 'Save favorite'}: ${escapeHtml(activity.activity)}"
                title="${activity.isFavorite ? 'Remove favorite' : 'Save favorite'}"
                data-testid="favorite-toggle-button"
                data-cy="favorite-toggle-button"
                data-activity-id="${escapeHtml(activity.id)}"
                data-is-favorite="${activity.isFavorite ? 'true' : 'false'}"
              >
                <span aria-hidden="true">${activity.isFavorite ? '★' : '☆'}</span>
                <span class="sr-only">${activity.isFavorite ? 'Saved favorite' : 'Save favorite'}</span>
              </button>
            </li>
          `)
          .join('')

        return `
          <article class="inline-itinerary-day" data-cy="inline-itinerary-day" data-testid="inline-itinerary-day">
            <h5>Day ${escapeHtml(String(day.day))}: ${escapeHtml(day.title)}</h5>
            <p class="inline-itinerary-port">${escapeHtml(day.port)}</p>
            <ul class="inline-itinerary-activities">${activities}</ul>
          </article>
        `
      }).join('')
      : '<p class="empty-message">No favorite itinerary items yet. Switch back to all activities to save some favorites.</p>'

    detailsContent.innerHTML = `
      <section class="inline-booking-details-panel">
        <header class="inline-booking-details-header">
          <h4>${escapeHtml(booking.ship?.name || 'Cruise')} Details</h4>
          <p>${escapeHtml(booking.embarkationPort || booking.sailing.departurePort || '')} → ${escapeHtml(booking.debarkationPort || booking.sailing.arrivalPort || '')}</p>
          <div class="itinerary-filter-actions">
            <button type="button" data-cy="show-all-itinerary-button" data-testid="show-all-itinerary-button">All itinerary items</button>
            <button type="button" data-cy="show-favorite-itinerary-button" data-testid="show-favorite-itinerary-button">My favorites</button>
          </div>
        </header>
        <div class="inline-booking-itinerary">${itineraryMarkup}</div>
      </section>
    `

    detailsContent.querySelector('[data-cy="show-all-itinerary-button"]')?.addEventListener('click', () => loadBookingCruiseDetails(booking, false))
    detailsContent.querySelector('[data-cy="show-favorite-itinerary-button"]')?.addEventListener('click', () => loadBookingCruiseDetails(booking, true))
    detailsContent.querySelectorAll('[data-cy="favorite-toggle-button"]').forEach(button => {
      button.addEventListener('click', () => toggleItineraryFavorite(button, booking, favoritesOnly))
    })

    focusSection(`inline-booking-details-${bookingKey}`)
  } catch (error) {
    console.error(error)
    detailsContent.innerHTML = '<div class="inline-booking-details-error">Unable to load cruise details.</div>'
  }
}

async function toggleItineraryFavorite(button, booking, favoritesOnly = false) {
  const customerId = getActiveCustomerId()
  const activityScheduleId = button.dataset.activityId
  const isFavorite = button.dataset.isFavorite === 'true'

  if (!customerId || !activityScheduleId) return

  const url = isFavorite
    ? `${API_BASE}/itinerary-favorites/${customerId}/${activityScheduleId}`
    : `${API_BASE}/itinerary-favorites`

  const options = isFavorite
    ? { method: 'DELETE' }
    : {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, activityScheduleId })
    }

  const response = await fetch(url, options)

  if (!response.ok) {
    const result = await parseJsonResponse(response)
    throw new Error(result.message || 'Could not update itinerary favorite.')
  }

  await loadBookingCruiseDetails(booking, favoritesOnly)
}

function formatDemoRole(role) {
  return String(role || '')
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isDemoAdminMode() {
  return !activeDemoContext || Boolean(activeDemoContext?.visibility?.canManageCruiseData)
}

function writeTestOutput(title, data) {
  if (!testOutput) return

  testOutput.textContent = `${title}\n\n${JSON.stringify(data, null, 2)}`

  const passed = data && data.passed === true
  const failed = data && data.passed === false
  updateSqaConsoleStatus(
    passed ? 'pass' : failed ? 'fail' : 'running',
    passed ? 'Validation passed' : failed ? 'Validation needs attention' : 'Validation running'
  )
  updateSqaLastRun(title)
}

function updateSqaConsoleStatus(status, label) {
  const statusText = document.querySelector('[data-cy="sqa-console-status-text"]')
  const statusDot = document.querySelector('[data-cy="sqa-console-status-dot"]')

  if (statusText) statusText.textContent = label

  if (statusDot) {
    statusDot.className = `status-dot ${status}`.trim()
  }
}

function updateSqaLastRun(title) {
  const lastRunLabel = document.querySelector('[data-cy="sqa-last-run-label"]')

  if (lastRunLabel) {
    lastRunLabel.textContent = `Last run: ${title}`
  }
}

function setSqaButtonLoading(button, isLoading, loadingLabel, defaultLabel) {
  if (!button) return

  button.disabled = isLoading
  button.textContent = isLoading ? loadingLabel : defaultLabel
}

async function loadCruiseLines() {
  const statusMessage = document.getElementById('status-message')
  const grid = document.getElementById('cruise-grid')

  try {
    if (statusMessage) statusMessage.textContent = 'Loading cruise lines...'
    if (grid) grid.innerHTML = ''

    const res = await fetch(API_BASE)

    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`)
    }

    cruiseLines = await res.json()
    renderCruiseLines(cruiseLines)

    updateCruiseLineStatus(cruiseLines.length, cruiseLines.length)
  } catch (err) {
    console.error(err)
    if (statusMessage) {
      statusMessage.textContent = 'Could not load cruise lines. Check that the server is running and the database has data.'
    }
  }
}

async function createCruiseLine(event) {
  event.preventDefault()

  const form = event.currentTarget
  const formData = new FormData(form)
  const name = getTrimmedFormValue(formData, 'name')
  const country = getTrimmedFormValue(formData, 'country')
  const website = getTrimmedFormValue(formData, 'website')
  const shipNames = getShipNamesFromForm(form)

  if (!name) {
    setCreateCruiseLineMessage('Cruise line name is required.', 'error')
    return
  }

  const cruiseLinePayload = { name }

  if (country) cruiseLinePayload.country = country
  if (website) cruiseLinePayload.website = website

  setCreateCruiseLineLoading(true)
  setCreateCruiseLineMessage('Creating cruise line...', '')

  try {
    const cruiseLineResponse = await fetch(`${API_BASE}/cruise-line`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cruiseLinePayload)
    })

    const cruiseLineResult = await parseJsonResponse(cruiseLineResponse)

    if (!cruiseLineResponse.ok) {
      throw new Error(cruiseLineResult.message || `Create failed with status ${cruiseLineResponse.status}`)
    }

    const cruiseLineId = cruiseLineResult.id

    if (!cruiseLineId) {
      throw new Error('Cruise line was created, but the API did not return a cruise line ID.')
    }

    const createdShipCount = await createShipsForCruiseLine(shipNames, cruiseLineId)

    resetCreateCruiseLineForm()
    await loadCruiseLines()

    setCreateCruiseLineMessage(
      `Created ${name}${createdShipCount ? ` with ${createdShipCount} ship${createdShipCount === 1 ? '' : 's'}` : ''}.`,
      'success'
    )
  } catch (err) {
    console.error(err)
    setCreateCruiseLineMessage(err.message || 'Could not create the cruise line.', 'error')
  } finally {
    setCreateCruiseLineLoading(false)
  }
}

async function createShipsForCruiseLine(shipNames, cruiseLineId) {
  let createdShipCount = 0

  for (const shipName of shipNames) {
    const shipResponse = await fetch(`${API_BASE}/ship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: shipName,
        cruiseLineId
      })
    })

    const shipResult = await parseJsonResponse(shipResponse)

    if (!shipResponse.ok) {
      throw new Error(shipResult.message || `Cruise line was created, but ship "${shipName}" could not be created.`)
    }

    createdShipCount += 1
  }

  return createdShipCount
}

function getTrimmedFormValue(formData, fieldName) {
  return String(formData.get(fieldName) || '').trim()
}

function getShipNamesFromForm(form) {
  const shipInputs = form.querySelectorAll('input[name="shipName"]')
  const shipNames = Array.from(shipInputs)
    .map(input => input.value.trim())
    .filter(Boolean)

  return Array.from(new Set(shipNames))
}

function addShipInputRow(value = '') {
  const shipInputList = document.getElementById('new-ship-inputs')

  if (!shipInputList) return

  const row = document.createElement('div')
  row.className = 'ship-input-row'

  row.innerHTML = `
    <label>
      Ship name
      <input name="shipName" data-cy="create-cruise-line-ship-name-input" data-testid="create-cruise-line-ship-name-input" type="text" placeholder="Example: Rotterdam" maxlength="255" value="${escapeHtml(value)}" />
    </label>
    <button class="remove-ship-row-btn" data-cy="remove-ship-input-button" data-testid="remove-ship-input-button" type="button">Remove</button>
  `

  row.querySelector('.remove-ship-row-btn').addEventListener('click', () => row.remove())
  shipInputList.appendChild(row)
}

function resetCreateCruiseLineForm() {
  const form = document.getElementById('create-cruise-line-form')
  const shipInputList = document.getElementById('new-ship-inputs')

  if (form) form.reset()

  if (shipInputList) {
    shipInputList.innerHTML = `
      <label>
        Ship name
        <input name="shipName" data-cy="create-cruise-line-ship-name-input" data-testid="create-cruise-line-ship-name-input" type="text" placeholder="Example: Rotterdam" maxlength="255" />
      </label>
    `
  }

  setCreateCruiseLineMessage('', '')
}

function setCreateCruiseLineLoading(isLoading) {
  const submitButton = document.getElementById('create-cruise-line-btn')

  if (submitButton) {
    submitButton.disabled = isLoading
    submitButton.textContent = isLoading ? 'Creating...' : 'Create Cruise Line'
  }
}

function setCreateCruiseLineMessage(message, type) {
  const messageElement = document.getElementById('create-cruise-line-message')

  if (!messageElement) return

  messageElement.textContent = message
  messageElement.className = `form-message ${type}`.trim()
}

async function openUpdateCruiseLineForm(cruiseLineId) {
  const cruiseLine = cruiseLines.find(line => line.id === cruiseLineId)

  if (!cruiseLine) return

  const panel = document.getElementById('update-cruise-line-panel')
  const shipInputList = document.getElementById('update-ship-inputs')

  document.getElementById('update-cruise-line-id').value = cruiseLine.id
  document.getElementById('update-cruise-line-name').value = cruiseLine.name || ''
  document.getElementById('update-cruise-line-country').value = cruiseLine.country || ''
  document.getElementById('update-cruise-line-website').value = cruiseLine.website || ''

  setUpdateCruiseLineMessage('Loading ships for update...', '')

  if (panel) {
    panel.hidden = false
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (shipInputList) {
    shipInputList.innerHTML = '<p data-cy="update-ships-loading-message" data-testid="update-ships-loading-message">Loading ships...</p>'
  }

  try {
    const ships = await fetchShipsForCruiseLine(cruiseLineId)
    renderUpdateShipInputs(ships)
    setUpdateCruiseLineMessage(`Editing ${cruiseLine.name}.`, '')
  } catch (err) {
    console.error(err)

    if (shipInputList) {
      shipInputList.innerHTML = `
        <div class="empty-message compact-message update-ship-load-error" data-cy="update-ships-load-error" data-testid="update-ships-load-error">
          <p>${escapeHtml(err.message || 'Could not load ships for update.')}</p>
          <p>You can still update cruise line details. Reopen the update workflow to try loading ships again.</p>
        </div>
      `
    }

    setUpdateCruiseLineMessage('Ships could not be loaded for this update workflow.', 'error')
  }
}

async function fetchShipsForCruiseLine(cruiseLineId) {
  const encodedCruiseLineId = encodeURIComponent(cruiseLineId)
  const shipUrl = `${API_BASE}/ships/${encodedCruiseLineId}`

  let res

  try {
    res = await fetch(shipUrl, {
      headers: {
        Accept: 'application/json'
      }
    })
  } catch (err) {
    console.error('Ship request failed before the API responded:', err)
    throw new Error('Could not reach the ships API. Please try loading the update form again.')
  }

  if (res.status === 404) {
    return []
  }

  if (!res.ok) {
    let message = `Ship request failed with status ${res.status}`

    try {
      const errorBody = await res.json()
      if (errorBody && errorBody.message) {
        message = errorBody.message
      }
    } catch (err) {
      // Keep the default message when the API response is not JSON.
    }

    throw new Error(message)
  }

  const ships = await res.json()

  if (!Array.isArray(ships)) {
    throw new Error('The ships API returned an unexpected response.')
  }

  return ships
}

function renderUpdateShipInputs(ships) {
  const shipInputList = document.getElementById('update-ship-inputs')

  if (!shipInputList) return

  shipInputList.innerHTML = ''

  if (!ships.length) {
    const message = document.createElement('p')
    message.className = 'empty-message compact-message'
    message.setAttribute('data-cy', 'update-no-ships-message')
    message.textContent = 'No ships exist for this cruise line yet. Add one below if needed.'
    shipInputList.appendChild(message)
  }

  ships.forEach(ship => addUpdateShipInputRow(ship.name, ship.id))
  addUpdateShipInputRow()
}

function addUpdateShipInputRow(value = '', shipId = '') {
  const shipInputList = document.getElementById('update-ship-inputs')

  if (!shipInputList) return

  const row = document.createElement('div')
  row.className = 'ship-input-row update-ship-input-row'
  row.setAttribute('data-cy', shipId ? 'existing-update-ship-row' : 'new-update-ship-row')

  row.innerHTML = `
    <label>
      <span>${shipId ? 'Ship name' : 'New ship name'}</span>
      <input name="updateShipName" data-cy="update-cruise-line-ship-name-input" data-testid="update-cruise-line-ship-name-input" type="text" placeholder="Example: Rotterdam" maxlength="255" value="${escapeHtml(value)}" data-ship-id="${escapeHtml(shipId)}" />
    </label>
    ${shipId ? `
      <div class="ship-row-actions">
        <button class="delete-ship-btn danger subtle-danger" data-cy="delete-update-ship-button" data-testid="delete-update-ship-button" type="button">Delete Ship</button>
      </div>
    ` : '<button class="remove-ship-row-btn" data-cy="remove-update-ship-input-button" data-testid="remove-update-ship-input-button" type="button">Remove</button>'}
  `

  const removeButton = row.querySelector('.remove-ship-row-btn')
  if (removeButton) removeButton.addEventListener('click', () => row.remove())

  const deleteShipButton = row.querySelector('.delete-ship-btn')
  if (deleteShipButton) {
    deleteShipButton.addEventListener('click', () => deleteShipFromUpdateForm(shipId, value, row))
  }

  shipInputList.appendChild(row)
}

async function updateCruiseLine(event) {
  event.preventDefault()

  const form = event.currentTarget
  const formData = new FormData(form)
  const cruiseLineId = getTrimmedFormValue(formData, 'id')
  const name = getTrimmedFormValue(formData, 'name')
  const country = getTrimmedFormValue(formData, 'country')
  const website = getTrimmedFormValue(formData, 'website')
  const shipChanges = getUpdateShipChanges(form)

  if (!cruiseLineId) {
    setUpdateCruiseLineMessage('Cruise line ID is missing. Please reopen the update form.', 'error')
    return
  }

  if (!name) {
    setUpdateCruiseLineMessage('Cruise line name is required.', 'error')
    return
  }

  if (shipChanges.existingShips.some(ship => !ship.name)) {
    setUpdateCruiseLineMessage('Existing ship names cannot be blank. Use Delete Ship to remove a ship.', 'error')
    return
  }

  const cruiseLinePayload = { name }

  if (country) cruiseLinePayload.country = country
  if (website) cruiseLinePayload.website = website

  setUpdateCruiseLineLoading(true)
  setUpdateCruiseLineMessage('Saving updates...', '')

  try {
    const cruiseLineResponse = await fetch(`${API_BASE}/cruise-line/${cruiseLineId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cruiseLinePayload)
    })

    const cruiseLineResult = await parseJsonResponse(cruiseLineResponse)

    if (!cruiseLineResponse.ok) {
      throw new Error(cruiseLineResult.message || `Update failed with status ${cruiseLineResponse.status}`)
    }

    const updatedShipCount = await updateExistingShips(shipChanges.existingShips, cruiseLineId)
    const createdShipCount = await createShipsForCruiseLine(shipChanges.newShipNames, cruiseLineId)

    await loadCruiseLines()

    if (selectedCruiseLineForShips === cruiseLineId) {
      await loadShips(cruiseLineId, name)
    }

    hideUpdateCruiseLinePanel()
  } catch (err) {
    console.error(err)
    setUpdateCruiseLineMessage(err.message || 'Could not update the cruise line.', 'error')
  } finally {
    setUpdateCruiseLineLoading(false)
  }
}

function getUpdateShipChanges(form) {
  const shipInputs = form.querySelectorAll('input[name="updateShipName"]')
  const existingShips = []
  const newShipNames = []

  Array.from(shipInputs).forEach(input => {
    const shipId = input.dataset.shipId || ''
    const name = input.value.trim()

    if (shipId) {
      existingShips.push({ id: shipId, name })
    } else if (name) {
      newShipNames.push(name)
    }
  })

  return {
    existingShips,
    newShipNames: Array.from(new Set(newShipNames))
  }
}

async function deleteShipFromUpdateForm(shipId, shipName, row) {
  const cruiseLineId = document.getElementById('update-cruise-line-id')?.value
  const confirmed = window.confirm(`Delete ${shipName}?`)

  if (!confirmed) return

  try {
    setUpdateCruiseLineMessage(`Deleting ${shipName}...`, '')

    const response = await fetch(`${API_BASE}/ship/${shipId}`, {
      method: 'DELETE'
    })

    const result = await parseJsonResponse(response)

    if (!response.ok) {
      throw new Error(result.message || `Delete ship failed with status ${response.status}`)
    }

    row.remove()
    showNoExistingShipsMessageIfNeeded()

    if (selectedCruiseLineForShips === cruiseLineId && selectedCruiseLineNameForShips) {
      await loadShips(cruiseLineId, selectedCruiseLineNameForShips)
    }

    setUpdateCruiseLineMessage(`${shipName} was deleted successfully.`, 'success')
  } catch (err) {
    console.error(err)
    setUpdateCruiseLineMessage(err.message || `Could not delete ${shipName}.`, 'error')
  }
}

function showNoExistingShipsMessageIfNeeded() {
  const shipInputList = document.getElementById('update-ship-inputs')

  if (!shipInputList) return
  if (shipInputList.querySelector('[data-cy="existing-update-ship-row"]')) return
  if (shipInputList.querySelector('[data-cy="update-no-ships-message"]')) return

  const message = document.createElement('p')
  message.className = 'empty-message compact-message'
  message.setAttribute('data-cy', 'update-no-ships-message')
  message.textContent = 'No ships exist for this cruise line yet. Add one below if needed.'

  const firstNewShipRow = shipInputList.querySelector('[data-cy="new-update-ship-row"]')
  shipInputList.insertBefore(message, firstNewShipRow)
}

async function updateExistingShips(existingShips, cruiseLineId) {
  let updatedShipCount = 0

  for (const ship of existingShips) {
    const shipResponse = await fetch(`${API_BASE}/ship/${ship.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: ship.name,
        cruiseLineId
      })
    })

    const shipResult = await parseJsonResponse(shipResponse)

    if (!shipResponse.ok) {
      throw new Error(shipResult.message || `Cruise line was updated, but ship "${ship.name}" could not be updated.`)
    }

    updatedShipCount += 1
  }

  return updatedShipCount
}

function hideUpdateCruiseLinePanel() {
  const panel = document.getElementById('update-cruise-line-panel')
  const form = document.getElementById('update-cruise-line-form')
  const shipInputList = document.getElementById('update-ship-inputs')

  if (panel) panel.hidden = true
  if (form) form.reset()
  if (shipInputList) shipInputList.innerHTML = ''
  setUpdateCruiseLineMessage('', '')
}

function setUpdateCruiseLineLoading(isLoading) {
  const submitButton = document.getElementById('update-cruise-line-btn')

  if (submitButton) {
    submitButton.disabled = isLoading
    submitButton.textContent = isLoading ? 'Saving...' : 'Save Updates'
  }
}

function setUpdateCruiseLineMessage(message, type) {
  const messageElement = document.getElementById('update-cruise-line-message')

  if (!messageElement) return

  messageElement.textContent = message
  messageElement.className = `form-message ${type}`.trim()
}

async function deleteCruiseLine(cruiseLineId, cruiseLineName) {
  const confirmed = window.confirm(`Delete ${cruiseLineName}? This will also delete all related ships.`)

  if (!confirmed) return

  const statusMessage = document.getElementById('status-message')

  try {
    if (statusMessage) statusMessage.textContent = `Deleting ${cruiseLineName}...`

    const response = await fetch(`${API_BASE}/cruise-line/${cruiseLineId}`, {
      method: 'DELETE'
    })

    const result = await parseJsonResponse(response)

    if (!response.ok) {
      throw new Error(result.message || `Delete failed with status ${response.status}`)
    }

    if (selectedCruiseLineForShips === cruiseLineId) {
      selectedCruiseLineForShips = null
      selectedCruiseLineNameForShips = ''

      const shipsPanel = document.getElementById('ships-panel')
      const shipsGrid = document.getElementById('ships-grid')

      if (shipsPanel) shipsPanel.hidden = true
      if (shipsGrid) shipsGrid.innerHTML = ''
      hideSailingAndItineraryPanels()
    }

    const activeUpdateId = document.getElementById('update-cruise-line-id')?.value
    if (activeUpdateId === cruiseLineId) {
      hideUpdateCruiseLinePanel()
    }

    await loadCruiseLines()

    if (statusMessage) {
      statusMessage.textContent = `${cruiseLineName} was deleted successfully.`
    }
  } catch (err) {
    console.error(err)
    if (statusMessage) {
      statusMessage.textContent = err.message || `Could not delete ${cruiseLineName}.`
    }
  }
}

async function parseJsonResponse(response) {
  try {
    return await response.json()
  } catch (err) {
    return {}
  }
}

function validateCruiseLineContract(line) {
  return Boolean(
    line &&
    typeof line.id === 'string' &&
    typeof line.name === 'string' &&
    (line.country === null || line.country === undefined || typeof line.country === 'string') &&
    (line.website === null || line.website === undefined || typeof line.website === 'string')
  )
}

function validateShipContract(ship) {
  return Boolean(
    ship &&
    typeof ship.id === 'string' &&
    typeof ship.name === 'string' &&
    typeof ship.cruiseLineId === 'string'
  )
}

async function timedFetch(url, options = {}) {
  const startedAt = performance.now()
  const response = await fetch(url, options)
  const durationMs = Math.round(performance.now() - startedAt)

  return {
    response,
    durationMs
  }
}

async function runSqaAction(button, labels, statusText, action) {
  setSqaButtonLoading(button, true, labels.loading, labels.default)
  updateSqaConsoleStatus('running', statusText)

  try {
    await action()
  } catch (err) {
    writeTestOutput(labels.failureTitle, {
      passed: false,
      error: err.message || 'Manual validation failed.'
    })
  } finally {
    setSqaButtonLoading(button, false, labels.loading, labels.default)
  }
}

async function runApiContractCheck() {
  await runSqaAction(
    apiContractCheckBtn,
    {
      loading: 'Checking...',
      default: 'Check API Contract',
      failureTitle: 'API Contract Check Failed'
    },
    'Checking API contracts',
    async () => {
      const cruiseResponse = await fetch(API_BASE)
      const cruiseData = await parseJsonResponse(cruiseResponse)
      const cruiseLineContractsPass = Array.isArray(cruiseData) && cruiseData.every(validateCruiseLineContract)

      const firstCruiseLine = Array.isArray(cruiseData) && cruiseData.length > 0 ? cruiseData[0] : null
      let shipResponseStatus = null
      let shipContractsPass = false
      let shipRecordCount = 0

      if (firstCruiseLine) {
        const shipResponse = await fetch(`${API_BASE}/ships/${firstCruiseLine.id}`)
        const shipData = await parseJsonResponse(shipResponse)

        shipResponseStatus = shipResponse.status
        shipRecordCount = Array.isArray(shipData) ? shipData.length : 0
        shipContractsPass = shipResponse.ok && Array.isArray(shipData) && shipData.every(validateShipContract)
      }

      writeTestOutput('API Contract Check Result', {
        passed: cruiseResponse.ok && cruiseLineContractsPass && Boolean(firstCruiseLine) && shipContractsPass,
        cruiseLineEndpoint: {
          statusCode: cruiseResponse.status,
          recordCount: Array.isArray(cruiseData) ? cruiseData.length : 0,
          requiredFields: ['id', 'name', 'country', 'website'],
          contractPassed: cruiseLineContractsPass
        },
        shipEndpoint: {
          statusCode: shipResponseStatus,
          recordCount: shipRecordCount,
          requiredFields: ['id', 'name', 'cruiseLineId'],
          contractPassed: shipContractsPass
        }
      })
    }
  )
}

async function runSafeCrudWorkflowCheck() {
  await runSqaAction(
    crudWorkflowCheckBtn,
    {
      loading: 'Running...',
      default: 'Run CRUD Workflow Check',
      failureTitle: 'Safe CRUD Workflow Check Failed'
    },
    'Running safe CRUD workflow',
    async () => {
      const timestamp = Date.now()
      const temporaryCruiseLineName = `SQA Temporary Cruise Line ${timestamp}`
      const updatedCruiseLineName = `${temporaryCruiseLineName} Updated`
      let createdCruiseLine = null
      let createdShip = null
      const workflowSteps = []

      try {
        const createCruiseResponse = await fetch(`${API_BASE}/cruise-line`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: temporaryCruiseLineName,
            country: 'SQA',
            website: 'https://example.com/sqa-temp'
          })
        })
        createdCruiseLine = await parseJsonResponse(createCruiseResponse)
        workflowSteps.push({ step: 'create cruise line', passed: createCruiseResponse.ok, statusCode: createCruiseResponse.status })

        if (!createCruiseResponse.ok || !createdCruiseLine.id) {
          throw new Error(createdCruiseLine.message || 'Temporary cruise line could not be created.')
        }

        const updateCruiseResponse = await fetch(`${API_BASE}/cruise-line/${createdCruiseLine.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: updatedCruiseLineName,
            country: 'SQA',
            website: 'https://example.com/sqa-temp-updated'
          })
        })
        const updatedCruiseLine = await parseJsonResponse(updateCruiseResponse)
        workflowSteps.push({ step: 'update cruise line', passed: updateCruiseResponse.ok, statusCode: updateCruiseResponse.status })

        if (!updateCruiseResponse.ok) {
          throw new Error(updatedCruiseLine.message || 'Temporary cruise line could not be updated.')
        }

        const createShipResponse = await fetch(`${API_BASE}/ship`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `SQA Temporary Ship ${timestamp}`,
            cruiseLineId: createdCruiseLine.id
          })
        })
        createdShip = await parseJsonResponse(createShipResponse)
        workflowSteps.push({ step: 'create ship', passed: createShipResponse.ok, statusCode: createShipResponse.status })

        if (!createShipResponse.ok || !createdShip.id) {
          throw new Error(createdShip.message || 'Temporary ship could not be created.')
        }

        const updateShipResponse = await fetch(`${API_BASE}/ship/${createdShip.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `SQA Temporary Ship ${timestamp} Updated`,
            cruiseLineId: createdCruiseLine.id
          })
        })
        const updatedShip = await parseJsonResponse(updateShipResponse)
        workflowSteps.push({ step: 'update ship', passed: updateShipResponse.ok, statusCode: updateShipResponse.status })

        if (!updateShipResponse.ok) {
          throw new Error(updatedShip.message || 'Temporary ship could not be updated.')
        }

        const shipsResponse = await fetch(`${API_BASE}/ships/${createdCruiseLine.id}`)
        const shipsData = await parseJsonResponse(shipsResponse)
        workflowSteps.push({
          step: 'verify temporary ship lookup',
          passed: shipsResponse.ok && Array.isArray(shipsData) && shipsData.some(ship => ship.id === createdShip.id),
          statusCode: shipsResponse.status
        })

        if (!shipsResponse.ok || !Array.isArray(shipsData) || !shipsData.some(ship => ship.id === createdShip.id)) {
          throw new Error('Temporary ship lookup did not return the created ship.')
        }

        const deleteCruiseResponse = await fetch(`${API_BASE}/cruise-line/${createdCruiseLine.id}`, {
          method: 'DELETE'
        })
        const deleteCruiseResult = await parseJsonResponse(deleteCruiseResponse)
        workflowSteps.push({ step: 'delete temporary cruise line', passed: deleteCruiseResponse.ok, statusCode: deleteCruiseResponse.status })

        if (!deleteCruiseResponse.ok) {
          throw new Error(deleteCruiseResult.message || 'Temporary cruise line cleanup failed.')
        }

        await loadCruiseLines()

        writeTestOutput('Safe CRUD Workflow Check Result', {
          passed: workflowSteps.every(step => step.passed),
          temporaryRecordCleanedUp: true,
          steps: workflowSteps
        })
      } catch (err) {
        if (createdCruiseLine && createdCruiseLine.id) {
          await fetch(`${API_BASE}/cruise-line/${createdCruiseLine.id}`, { method: 'DELETE' }).catch(() => {})
          await loadCruiseLines().catch(() => {})
        }

        writeTestOutput('Safe CRUD Workflow Check Failed', {
          passed: false,
          temporaryRecordCleanedUp: Boolean(createdCruiseLine && createdCruiseLine.id),
          error: err.message,
          steps: workflowSteps
        })
      }
    }
  )
}

async function runPerformanceSmokeCheck() {
  await runSqaAction(
    performanceSmokeCheckBtn,
    {
      loading: 'Measuring...',
      default: 'Run Performance Check',
      failureTitle: 'Performance Smoke Check Failed'
    },
    'Measuring API response times',
    async () => {
      const thresholds = {
        healthMs: 500,
        cruiseMs: 750,
        shipsMs: 750
      }

      const health = await timedFetch('/health')
      const healthData = await parseJsonResponse(health.response)

      const cruise = await timedFetch(API_BASE)
      const cruiseData = await parseJsonResponse(cruise.response)
      const firstCruiseLine = Array.isArray(cruiseData) && cruiseData.length > 0 ? cruiseData[0] : null

      let ships = {
        response: null,
        durationMs: null
      }
      let shipsData = []

      if (firstCruiseLine) {
        ships = await timedFetch(`${API_BASE}/ships/${firstCruiseLine.id}`)
        shipsData = await parseJsonResponse(ships.response)
      }

      const results = [
        {
          endpoint: 'GET /health',
          statusCode: health.response.status,
          durationMs: health.durationMs,
          thresholdMs: thresholds.healthMs,
          passed: health.response.ok && health.durationMs < thresholds.healthMs && healthData.status === 'ok'
        },
        {
          endpoint: 'GET /cruise',
          statusCode: cruise.response.status,
          durationMs: cruise.durationMs,
          thresholdMs: thresholds.cruiseMs,
          passed: cruise.response.ok && cruise.durationMs < thresholds.cruiseMs && Array.isArray(cruiseData)
        },
        {
          endpoint: 'GET /cruise/ships/:cruiseLineId',
          statusCode: ships.response ? ships.response.status : null,
          durationMs: ships.durationMs,
          thresholdMs: thresholds.shipsMs,
          passed: Boolean(ships.response && ships.response.ok && ships.durationMs < thresholds.shipsMs && Array.isArray(shipsData))
        }
      ]

      writeTestOutput('Performance Smoke Check Result', {
        passed: results.every(result => result.passed),
        thresholds,
        results
      })
    }
  )
}

async function runSeedIntegrityCheck() {
  await runSqaAction(
    seedIntegrityCheckBtn,
    {
      loading: 'Checking...',
      default: 'Check Seed Integrity',
      failureTitle: 'Seed Data Integrity Check Failed'
    },
    'Checking seed data integrity',
    async () => {
      const cruiseResponse = await fetch(API_BASE)
      const cruiseData = await parseJsonResponse(cruiseResponse)
      const firstCruiseLine = Array.isArray(cruiseData) && cruiseData.length > 0 ? cruiseData[0] : null

      let shipResponseStatus = null
      let shipCount = 0
      let shipCheckPassed = false

      if (firstCruiseLine) {
        const shipResponse = await fetch(`${API_BASE}/ships/${firstCruiseLine.id}`)
        const shipData = await parseJsonResponse(shipResponse)

        shipResponseStatus = shipResponse.status
        shipCount = Array.isArray(shipData) ? shipData.length : 0
        shipCheckPassed = shipResponse.ok && Array.isArray(shipData)
      }

      writeTestOutput('Seed Data Integrity Check Result', {
        passed: cruiseResponse.ok && Array.isArray(cruiseData) && cruiseData.length > 0 && shipCheckPassed,
        cruiseLineCount: Array.isArray(cruiseData) ? cruiseData.length : 0,
        firstCruiseLineName: firstCruiseLine ? firstCruiseLine.name : null,
        firstCruiseLineShipLookup: {
          statusCode: shipResponseStatus,
          shipCount,
          passed: shipCheckPassed
        }
      })
    }
  )
}

async function runRenderingConsistencyCheck() {
  await runSqaAction(
    renderingConsistencyCheckBtn,
    {
      loading: 'Checking...',
      default: 'Check Rendering',
      failureTitle: 'Rendering Consistency Check Failed'
    },
    'Checking frontend rendering',
    async () => {
      const visibleCards = Array.from(document.querySelectorAll('[data-cy="cruise-card"]'))
      const renderedNames = visibleCards.map(card => card.querySelector('h3')?.textContent).filter(Boolean)
      const expectedVisibleNames = cruiseLines.map(line => line.name)

      const missingNames = expectedVisibleNames.filter(name => !renderedNames.includes(name))
      const unexpectedNames = renderedNames.filter(name => !expectedVisibleNames.includes(name))

      writeTestOutput('Rendering Consistency Check Result', {
        passed: visibleCards.length === cruiseLines.length && missingNames.length === 0 && unexpectedNames.length === 0,
        apiRecordCount: cruiseLines.length,
        renderedCardCount: visibleCards.length,
        missingNames,
        unexpectedNames
      })
    }
  )
}

async function runDeploymentDiagnosticsCheck() {
  await runSqaAction(
    deploymentDiagnosticsBtn,
    {
      loading: 'Checking...',
      default: 'Run Deployment Check',
      failureTitle: 'Deployment Diagnostics Check Failed'
    },
    'Running deployment diagnostics',
    async () => {
      const health = await timedFetch('/health')
      const healthData = await parseJsonResponse(health.response)

      writeTestOutput('Deployment Diagnostics Result', {
        passed: health.response.ok && healthData.status === 'ok',
        runtime: {
          origin: window.location.origin,
          path: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        },
        api: {
          healthStatusCode: health.response.status,
          healthDurationMs: health.durationMs,
          healthResponse: healthData,
          visibleCruiseLineCount: document.querySelectorAll('[data-cy="cruise-card"]').length
        }
      })
    }
  )
}

function updateCruiseLineStatus(shownCount, totalCount) {
  const statusMessage = document.getElementById('status-message')

  if (!statusMessage) return

  statusMessage.textContent =
    `Showing ${shownCount} of ${totalCount} cruise line${totalCount === 1 ? '' : 's'}.`
}

function renderCruiseLines(lines) {
  const grid = document.getElementById('cruise-grid')

  if (!grid) return

  updateCruiseLineStatus(lines.length, cruiseLines.length)

  grid.innerHTML = ''

  if (!lines.length) {
    grid.innerHTML = '<p class="empty-message" data-cy="cruise-empty-message" data-testid="cruise-empty-message">No cruise lines match your search.</p>'
    return
  }

  lines.forEach(line => {
    const card = document.createElement('article')
    card.className = 'data-card'
    card.setAttribute('data-cy', 'cruise-card')
    card.setAttribute('data-testid', 'cruise-card')

    card.innerHTML = `
      <div class="card-content">
        <h3>${escapeHtml(line.name)}</h3>
        <p class="card-meta"><strong>Country:</strong> ${escapeHtml(line.country || 'Not listed')}</p>
        ${line.website ? `<p class="card-website"><a href="${escapeHtml(line.website)}" target="_blank" rel="noopener" data-cy="cruise-website-link" data-testid="cruise-website-link">Visit website</a></p>` : ''}
      </div>
      <div class="card-actions">
        <div class="card-primary-actions">
          <button data-cy="view-ships-button" data-testid="view-ships-button" type="button">View Ships</button>
          <button data-admin-only="true" data-cy="update-cruise-line-button" data-testid="update-cruise-line-button" type="button">Update</button>
        </div>
        <button data-admin-only="true" class="danger subtle-danger" data-cy="delete-cruise-line-button" data-testid="delete-cruise-line-button" type="button">Delete</button>
      </div>
    `

    card.querySelector('[data-cy="view-ships-button"]').addEventListener('click', () => loadShips(line.id, line.name))
    card.querySelector('[data-cy="update-cruise-line-button"]').addEventListener('click', () => openUpdateCruiseLineForm(line.id))
    card.querySelector('[data-cy="delete-cruise-line-button"]').addEventListener('click', () => deleteCruiseLine(line.id, line.name))

    grid.appendChild(card)
  })
}

async function loadShips(cruiseLineId, cruiseLineName) {
  const panel = document.getElementById('ships-panel')
  const title = document.getElementById('ships-title')
  const grid = document.getElementById('ships-grid')

  try {
    selectedCruiseLineForShips = cruiseLineId
    selectedCruiseLineNameForShips = cruiseLineName

    if (panel) {
      panel.hidden = false
      focusSection('ships-panel')
    }
    if (title) title.textContent = `${cruiseLineName} Ships`
    if (grid) grid.innerHTML = '<p data-cy="ships-loading-message" data-testid="ships-loading-message">Loading ships...</p>'

    hideSailingAndItineraryPanels()

    const res = await fetch(`${API_BASE}/ships/${cruiseLineId}`)

    if (res.status === 404) {
      renderShips([])
      return
    }

    if (!res.ok) {
      throw new Error(`Ship request failed with status ${res.status}`)
    }

    const ships = await res.json()
    renderShips(Array.isArray(ships) ? ships : [])
  } catch (err) {
    console.error(err)
    if (grid) {
      grid.innerHTML = ''
      renderShipCreateForm(grid)
      const message = document.createElement('p')
      message.className = 'empty-message'
      message.setAttribute('data-cy', 'ships-empty-message')
      message.setAttribute('data-testid', 'ships-empty-message')
      message.textContent = 'No ships found for this cruise line yet.'
      grid.appendChild(message)
    }
  }
}

function renderShips(ships) {
  const grid = document.getElementById('ships-grid')

  if (!grid) return

  grid.innerHTML = ''
  renderShipCreateForm(grid)

  if (!ships.length) {
    const message = document.createElement('p')
    message.className = 'empty-message'
    message.setAttribute('data-cy', 'ships-empty-message')
    message.setAttribute('data-testid', 'ships-empty-message')
    message.textContent = 'No ships found for this cruise line yet.'
    grid.appendChild(message)
    return
  }

  ships.forEach(ship => {
    const card = document.createElement('article')
    card.className = 'data-card'
    card.setAttribute('data-cy', 'ship-card')
    card.setAttribute('data-testid', 'ship-card')
    card.innerHTML = `
      <div class="card-content">
        <h3>${escapeHtml(ship.name)}</h3>
        <p class="card-meta"><strong>Current Port:</strong> ${escapeHtml(ship.currentPort || 'Not listed')}</p>
      </div>
      <div class="card-actions stacked-card-actions">
        <button data-cy="view-sailings-button" data-testid="view-sailings-button" type="button">View Sailings</button>
        <button class="secondary" data-admin-only="true" data-cy="update-ship-button" data-testid="update-ship-button" type="button">Update Ship</button>
        <button class="danger subtle-danger" data-admin-only="true" data-cy="delete-ship-button" data-testid="delete-ship-button" type="button">Delete Ship</button>
      </div>
    `
    card.querySelector('[data-cy="view-sailings-button"]').addEventListener('click', () => loadSailings(ship.id, ship.name))
    card.querySelector('[data-cy="update-ship-button"]').addEventListener('click', () => updateShipWithPrompts(ship))
    card.querySelector('[data-cy="delete-ship-button"]').addEventListener('click', () => deleteShipFromShipsPanel(ship))
    grid.appendChild(card)
  })
}

function renderShipCreateForm(grid) {
  const form = document.createElement('form')
  form.className = 'inline-admin-form'
  form.setAttribute('data-cy', 'create-ship-form')
  form.setAttribute('data-testid', 'create-ship-form')
  form.setAttribute('data-admin-only', 'true')
  form.innerHTML = `
    <h3>Add Ship</h3>
    <div class="inline-admin-grid">
      <label><span>Ship name</span><input name="name" type="text" placeholder="Example: Rotterdam" data-cy="create-ship-name-input" data-testid="create-ship-name-input" required /></label>
      <label><span>Current port</span><input name="currentPort" type="text" placeholder="Miami, Florida" data-cy="create-ship-current-port-input" data-testid="create-ship-current-port-input" /></label>
    </div>
    <p class="form-message" data-cy="create-ship-message" data-testid="create-ship-message"></p>
    <button type="submit" data-cy="create-ship-submit-button" data-testid="create-ship-submit-button">Create Ship</button>
  `
  form.addEventListener('submit', createShipFromShipsPanel)
  grid.appendChild(form)
}

async function createShipFromShipsPanel(event) {
  event.preventDefault()

  const form = event.currentTarget
  const message = form.querySelector('[data-cy="create-ship-message"]')
  const formData = new FormData(form)
  const payload = {
    name: getTrimmedFormValue(formData, 'name'),
    currentPort: getTrimmedFormValue(formData, 'currentPort'),
    cruiseLineId: selectedCruiseLineForShips
  }

  if (!payload.name) {
    if (message) message.textContent = 'Ship name is required.'
    return
  }

  try {
    if (message) message.textContent = 'Creating ship...'

    const res = await fetch(`${API_BASE}/ship`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await parseJsonResponse(res)

    if (!res.ok) {
      throw new Error(result.message || `Create ship failed with status ${res.status}`)
    }

    form.reset()
    if (message) message.textContent = result.message || 'Ship created successfully.'
    await loadShips(selectedCruiseLineForShips, selectedCruiseLineNameForShips)
  } catch (err) {
    console.error(err)
    if (message) message.textContent = err.message || 'Could not create ship.'
  }
}

async function updateShipWithPrompts(ship) {
  const name = window.prompt('Ship name', ship.name || '')
  if (name === null) return

  const currentPort = window.prompt('Current port', ship.currentPort || '')
  if (currentPort === null) return

  const payload = {
    name: name.trim(),
    currentPort: currentPort.trim(),
    cruiseLineId: ship.cruiseLineId || selectedCruiseLineForShips
  }

  try {
    const res = await fetch(`${API_BASE}/ship/${ship.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await parseJsonResponse(res)

    if (!res.ok) {
      throw new Error(result.message || `Update ship failed with status ${res.status}`)
    }

    hideSailingAndItineraryPanelsForShip(ship.id)
    await loadShips(selectedCruiseLineForShips, selectedCruiseLineNameForShips)
  } catch (err) {
    console.error(err)
    window.alert(err.message || 'Could not update ship.')
  }
}

async function deleteShipFromShipsPanel(ship) {
  const confirmed = window.confirm(`Delete ${ship.name}? This will also delete related sailings, itinerary days, and activities.`)

  if (!confirmed) return

  try {
    const res = await fetch(`${API_BASE}/ship/${ship.id}`, {
      method: 'DELETE'
    })

    const result = await parseJsonResponse(res)

    if (!res.ok) {
      throw new Error(result.message || `Delete ship failed with status ${res.status}`)
    }

    hideSailingAndItineraryPanelsForShip(ship.id)
    await loadShips(selectedCruiseLineForShips, selectedCruiseLineNameForShips)
  } catch (err) {
    console.error(err)
    window.alert(err.message || 'Could not delete ship.')
  }
}

function hideSailingAndItineraryPanels() {
  const sailingsPanel = document.getElementById('sailings-panel')
  const itineraryPanel = document.getElementById('itinerary-panel')
  const sailingsGrid = document.getElementById('sailings-grid')
  const itineraryGrid = document.getElementById('itinerary-grid')

  selectedShipForSailings = null
  selectedShipNameForSailings = ''
  selectedSailingForItinerary = null

  if (sailingsPanel) sailingsPanel.hidden = true
  if (itineraryPanel) itineraryPanel.hidden = true
  if (sailingsGrid) sailingsGrid.innerHTML = ''
  if (itineraryGrid) itineraryGrid.innerHTML = ''
}

function hideSailingAndItineraryPanelsForShip(shipId) {
  if (selectedShipForSailings === shipId) {
    hideSailingAndItineraryPanels()
  }
}

async function loadSailings(shipId, shipName) {
  ensureSailingSections()

  const panel = document.getElementById('sailings-panel')
  const title = document.getElementById('sailings-title')
  const grid = document.getElementById('sailings-grid')
  const itineraryPanel = document.getElementById('itinerary-panel')

  try {
    selectedShipForSailings = shipId
    selectedShipNameForSailings = shipName
    selectedSailingForItinerary = null

    if (panel) {
      panel.hidden = false
      focusSection('sailings-panel')
    }
    if (itineraryPanel) itineraryPanel.hidden = true
    if (title) title.textContent = `${shipName} Sailings`
    if (grid) grid.innerHTML = '<p data-cy="sailings-loading-message" data-testid="sailings-loading-message">Loading sailings...</p>'

    const res = await fetch(`${API_BASE}/ship/${shipId}/sailings`)

    if (!res.ok) {
      throw new Error(`Sailings request failed with status ${res.status}`)
    }

    const sailings = await res.json()
    renderSailings(sailings)
  } catch (err) {
    console.error(err)
    if (grid) grid.innerHTML = '<p data-cy="sailings-empty-message" data-testid="sailings-empty-message">No sailings found for this ship yet.</p>'
  }
}

function renderSailings(sailings) {
  const grid = document.getElementById('sailings-grid')

  if (!grid) return

  grid.innerHTML = ''
  renderSailingCreateForm(grid)

  sailings.forEach(sailing => {
    const card = document.createElement('article')
    card.className = 'data-card sailing-card'
    card.setAttribute('data-cy', 'sailing-card')
    card.setAttribute('data-testid', 'sailing-card')

    card.innerHTML = `
      <div class="card-content">
        <h3>${escapeHtml(formatSailingDate(sailing.departureDate))}</h3>
        <p class="card-meta"><strong>Type:</strong> ${escapeHtml(sailing.isRepositioning ? 'Repositioning Sailing' : 'Round-Trip / Regional Sailing')}</p>
        <p class="card-meta"><strong>Departure Port:</strong> ${escapeHtml(sailing.departurePort || sailing.port)}</p>
        <p class="card-meta"><strong>Arrival Port:</strong> ${escapeHtml(sailing.arrivalPort || sailing.port)}</p>
        <p class="card-meta"><strong>Length:</strong> ${escapeHtml(String(sailing.days))} days</p>
      </div>
      <div class="card-actions stacked-card-actions">
        <button data-cy="view-itinerary-button" data-testid="view-itinerary-button" type="button">View Details</button>
        <button class="secondary" data-admin-only="true" data-cy="update-sailing-button" data-testid="update-sailing-button" type="button">Update Sailing</button>
        <button class="danger subtle-danger" data-admin-only="true" data-cy="delete-sailing-button" data-testid="delete-sailing-button" type="button">Delete Sailing</button>
      </div>
    `

    card.querySelector('[data-cy="view-itinerary-button"]').addEventListener('click', () => loadItinerary(sailing.id, sailing))
    card.querySelector('[data-cy="update-sailing-button"]').addEventListener('click', () => updateSailingWithPrompts(sailing))
    card.querySelector('[data-cy="delete-sailing-button"]').addEventListener('click', () => deleteSailing(sailing))
    grid.appendChild(card)
  })
}

function renderSailingCreateForm(grid) {
  const form = document.createElement('form')
  form.className = 'inline-admin-form'
  form.setAttribute('data-cy', 'create-sailing-form')
  form.setAttribute('data-testid', 'create-sailing-form')
  form.setAttribute('data-admin-only', 'true')
  form.innerHTML = `
    <h3>Add Sailing</h3>
    <div class="inline-admin-grid">
      <label><span>Departure date</span><input name="departureDate" type="date" value="2026-10-01" data-cy="create-sailing-departure-date-input" data-testid="create-sailing-departure-date-input" required /></label>
      <label><span>Departure port</span><input name="departurePort" type="text" placeholder="Miami, Florida" data-cy="create-sailing-departure-port-input" data-testid="create-sailing-departure-port-input" required /></label>
      <label><span>Arrival port</span><input name="arrivalPort" type="text" placeholder="Nassau, Bahamas" data-cy="create-sailing-arrival-port-input" data-testid="create-sailing-arrival-port-input" required /></label>
      <label><span>Days</span><input name="days" type="number" min="1" max="30" value="3" data-cy="create-sailing-days-input" data-testid="create-sailing-days-input" required /></label>
      <label class="checkbox-field"><input name="isRepositioning" type="checkbox" data-cy="create-sailing-repositioning-input" data-testid="create-sailing-repositioning-input" /><span>Repositioning sailing</span></label>
    </div>
    <p class="form-message" data-cy="create-sailing-message" data-testid="create-sailing-message"></p>
    <button type="submit" data-cy="create-sailing-submit-button" data-testid="create-sailing-submit-button">Create Sailing</button>
  `
  form.addEventListener('submit', createSailing)
  grid.appendChild(form)
}

async function createSailing(event) {
  event.preventDefault()
  const form = event.currentTarget
  const message = form.querySelector('[data-cy="create-sailing-message"]')
  const formData = new FormData(form)
  const departurePort = getTrimmedFormValue(formData, 'departurePort')
  const payload = {
    departureDate: getTrimmedFormValue(formData, 'departureDate'),
    port: departurePort,
    departurePort,
    arrivalPort: getTrimmedFormValue(formData, 'arrivalPort'),
    days: Number(formData.get('days')),
    isRepositioning: Boolean(formData.get('isRepositioning'))
  }

  try {
    if (message) message.textContent = 'Creating sailing...'
    const res = await fetch(`${API_BASE}/ship/${selectedShipForSailings}/sailings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const result = await parseJsonResponse(res)
    if (!res.ok) throw new Error(result.message || `Create sailing failed with status ${res.status}`)
    form.reset()
    if (message) message.textContent = result.message || 'Sailing created successfully.'
    await loadSailings(selectedShipForSailings, selectedShipNameForSailings)
  } catch (err) {
    console.error(err)
    if (message) message.textContent = err.message || 'Could not create sailing.'
  }
}

async function updateSailingWithPrompts(sailing) {
  const departureDate = window.prompt('Departure date (YYYY-MM-DD)', sailing.departureDate)
  if (departureDate === null) return
  const departurePort = window.prompt('Departure port', sailing.departurePort || sailing.port)
  if (departurePort === null) return
  const arrivalPort = window.prompt('Arrival port', sailing.arrivalPort || sailing.port)
  if (arrivalPort === null) return
  const daysValue = window.prompt('Days', String(sailing.days))
  if (daysValue === null) return
  const repositioningValue = window.prompt('Is this a repositioning sailing? true or false', String(Boolean(sailing.isRepositioning)))
  if (repositioningValue === null) return

  const payload = {
    departureDate: departureDate.trim(),
    port: departurePort.trim(),
    departurePort: departurePort.trim(),
    arrivalPort: arrivalPort.trim(),
    days: Number(daysValue),
    isRepositioning: repositioningValue.trim().toLowerCase() === 'true'
  }

  try {
    const res = await fetch(`${API_BASE}/sailings/${sailing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const result = await parseJsonResponse(res)
    if (!res.ok) throw new Error(result.message || `Update sailing failed with status ${res.status}`)
    await loadSailings(selectedShipForSailings, selectedShipNameForSailings)
  } catch (err) {
    console.error(err)
    window.alert(err.message || 'Could not update sailing.')
  }
}

async function deleteSailing(sailing) {
  if (!window.confirm(`Delete sailing departing ${sailing.departureDate}?`)) return
  try {
    const res = await fetch(`${API_BASE}/sailings/${sailing.id}`, { method: 'DELETE' })
    const result = await parseJsonResponse(res)
    if (!res.ok) throw new Error(result.message || `Delete sailing failed with status ${res.status}`)
    await loadSailings(selectedShipForSailings, selectedShipNameForSailings)
  } catch (err) {
    console.error(err)
    window.alert(err.message || 'Could not delete sailing.')
  }
}

async function loadItinerary(sailingId, sailing) {
  ensureSailingSections()
  const panel = document.getElementById('itinerary-panel')
  const title = document.getElementById('itinerary-title')
  const grid = document.getElementById('itinerary-grid')

  try {
    selectedSailingForItinerary = sailing
    if (panel) {
      panel.hidden = false
      focusSection('itinerary-panel')
    }
    if (title) title.textContent = `${selectedShipNameForSailings || sailing.ship?.name || 'Cruise'} Details - ${formatSailingDate(sailing.departureDate)}`
    if (grid) grid.innerHTML = '<p data-cy="itinerary-loading-message" data-testid="itinerary-loading-message">Loading itinerary...</p>'

    const res = await fetch(`${API_BASE}/sailings/${sailingId}/itinerary`)
    if (!res.ok) throw new Error(`Itinerary request failed with status ${res.status}`)
    const itinerary = await res.json()
    renderItinerary(itinerary)
  } catch (err) {
    console.error(err)
    if (grid) grid.innerHTML = '<p data-cy="itinerary-empty-message" data-testid="itinerary-empty-message">No itinerary found for this sailing yet.</p>'
  }
}

function renderItinerary(itinerary) {
  const grid = document.getElementById('itinerary-grid')
  if (!grid) return
  grid.innerHTML = ''
  renderItineraryCreateForm(grid)

  itinerary.forEach(day => {
    const details = document.createElement('details')
    details.className = 'itinerary-day'
    details.setAttribute('data-cy', 'itinerary-day')
    details.setAttribute('data-testid', 'itinerary-day')

    const activityItems = (day.activitySchedule || []).map(activity => `
      <li data-cy="itinerary-activity" data-testid="itinerary-activity">
        <span class="activity-time">${escapeHtml(activity.time)}</span>
        <span>${escapeHtml(activity.activity)}</span>
        <span class="activity-actions">
          <button class="secondary" data-admin-only="true" data-cy="update-activity-button" data-testid="update-activity-button" data-activity-id="${escapeHtml(activity.id)}" data-activity-time="${escapeHtml(activity.time)}" data-activity-text="${escapeHtml(activity.activity)}" type="button">Update</button>
          <button class="danger subtle-danger" data-admin-only="true" data-cy="delete-activity-button" data-testid="delete-activity-button" data-activity-id="${escapeHtml(activity.id)}" type="button">Delete</button>
        </span>
      </li>
    `).join('')

    details.innerHTML = `
      <summary data-cy="itinerary-day-summary" data-testid="itinerary-day-summary">Day ${escapeHtml(String(day.day))} — ${escapeHtml(day.title)}</summary>
      <p class="itinerary-port" data-cy="itinerary-port" data-testid="itinerary-port"><strong>Port:</strong> ${escapeHtml(day.port || 'At Sea')}</p>
      <div class="itinerary-admin-actions">
        <button class="secondary" data-admin-only="true" data-cy="update-itinerary-day-button" data-testid="update-itinerary-day-button" type="button">Update Day</button>
        <button class="danger subtle-danger" data-admin-only="true" data-cy="delete-itinerary-day-button" data-testid="delete-itinerary-day-button" type="button">Delete Day</button>
      </div>
      <ul class="activity-schedule" data-cy="activity-schedule" data-testid="activity-schedule">${activityItems}</ul>
      <form class="inline-admin-form activity-admin-form" data-admin-only="true" data-cy="create-activity-form" data-testid="create-activity-form">
        <h4>Add Activity</h4>
        <div class="inline-admin-grid">
          <label><span>Time</span><input name="time" type="text" placeholder="2:00 PM" data-cy="create-activity-time-input" data-testid="create-activity-time-input" required /></label>
          <label><span>Activity</span><input name="activity" type="text" placeholder="Poolside games" data-cy="create-activity-text-input" data-testid="create-activity-text-input" required /></label>
        </div>
        <button type="submit" data-cy="create-activity-submit-button" data-testid="create-activity-submit-button">Add Activity</button>
      </form>
    `

    details.querySelector('[data-cy="update-itinerary-day-button"]').addEventListener('click', () => updateItineraryDayWithPrompts(day))
    details.querySelector('[data-cy="delete-itinerary-day-button"]').addEventListener('click', () => deleteItineraryDay(day))
    details.querySelector('[data-cy="create-activity-form"]').addEventListener('submit', event => createActivity(event, day.id))
    details.querySelectorAll('[data-cy="update-activity-button"]').forEach(button => button.addEventListener('click', () => updateActivityWithPrompts({
      id: button.dataset.activityId,
      time: button.dataset.activityTime,
      activity: button.dataset.activityText
    })))
    details.querySelectorAll('[data-cy="delete-activity-button"]').forEach(button => button.addEventListener('click', () => deleteActivity(button.dataset.activityId)))

    grid.appendChild(details)
  })
}

function renderItineraryCreateForm(grid) {
  const form = document.createElement('form')
  form.className = 'inline-admin-form'
  form.setAttribute('data-cy', 'create-itinerary-day-form')
  form.setAttribute('data-testid', 'create-itinerary-day-form')
  form.setAttribute('data-admin-only', 'true')
  form.innerHTML = `
    <h3>Add Itinerary Day</h3>
    <div class="inline-admin-grid">
      <label><span>Day</span><input name="day" type="number" min="1" max="30" value="1" data-cy="create-itinerary-day-number-input" data-testid="create-itinerary-day-number-input" required /></label>
      <label><span>Title</span><input name="title" type="text" placeholder="Port Day — Nassau, Bahamas" data-cy="create-itinerary-day-title-input" data-testid="create-itinerary-day-title-input" required /></label>
      <label><span>Port</span><input name="port" type="text" placeholder="At Sea" data-cy="create-itinerary-day-port-input" data-testid="create-itinerary-day-port-input" required /></label>
      <label><span>Activity time</span><input name="activityTime" type="text" placeholder="9:00 AM" data-cy="create-itinerary-activity-time-input" data-testid="create-itinerary-activity-time-input" /></label>
      <label><span>Activity</span><input name="activity" type="text" placeholder="Morning briefing" data-cy="create-itinerary-activity-text-input" data-testid="create-itinerary-activity-text-input" /></label>
    </div>
    <p class="form-message" data-cy="create-itinerary-day-message" data-testid="create-itinerary-day-message"></p>
    <button type="submit" data-cy="create-itinerary-day-submit-button" data-testid="create-itinerary-day-submit-button">Create Itinerary Day</button>
  `
  form.addEventListener('submit', createItineraryDay)
  grid.appendChild(form)
}

async function createItineraryDay(event) {
  event.preventDefault()
  const form = event.currentTarget
  const formData = new FormData(form)
  const activityTime = getTrimmedFormValue(formData, 'activityTime')
  const activityText = getTrimmedFormValue(formData, 'activity')
  const payload = {
    day: Number(formData.get('day')),
    title: getTrimmedFormValue(formData, 'title'),
    port: getTrimmedFormValue(formData, 'port'),
    activitySchedule: activityTime && activityText ? [{ time: activityTime, activity: activityText }] : []
  }
  try {
    const res = await fetch(`${API_BASE}/sailings/${selectedSailingForItinerary.id}/itinerary`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const result = await parseJsonResponse(res)
    if (!res.ok) throw new Error(result.message || `Create itinerary day failed with status ${res.status}`)
    await loadItinerary(selectedSailingForItinerary.id, selectedSailingForItinerary)
  } catch (err) {
    console.error(err)
    window.alert(err.message || 'Could not create itinerary day.')
  }
}

async function updateItineraryDayWithPrompts(day) {
  const dayValue = window.prompt('Day number', String(day.day))
  if (dayValue === null) return
  const title = window.prompt('Title', day.title)
  if (title === null) return
  const port = window.prompt('Port or At Sea', day.port || 'At Sea')
  if (port === null) return

  try {
    const res = await fetch(`${API_BASE}/itinerary-days/${day.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day: Number(dayValue), title: title.trim(), port: port.trim(), activitySchedule: [] }) })
    const result = await parseJsonResponse(res)
    if (!res.ok) throw new Error(result.message || `Update itinerary day failed with status ${res.status}`)
    await loadItinerary(selectedSailingForItinerary.id, selectedSailingForItinerary)
  } catch (err) {
    console.error(err)
    window.alert(err.message || 'Could not update itinerary day.')
  }
}

async function deleteItineraryDay(day) {
  if (!window.confirm(`Delete itinerary day ${day.day}?`)) return
  try {
    const res = await fetch(`${API_BASE}/itinerary-days/${day.id}`, { method: 'DELETE' })
    const result = await parseJsonResponse(res)
    if (!res.ok) throw new Error(result.message || `Delete itinerary day failed with status ${res.status}`)
    await loadItinerary(selectedSailingForItinerary.id, selectedSailingForItinerary)
  } catch (err) {
    console.error(err)
    window.alert(err.message || 'Could not delete itinerary day.')
  }
}

async function createActivity(event, itineraryDayId) {
  event.preventDefault()
  const form = event.currentTarget
  const formData = new FormData(form)
  const payload = { time: getTrimmedFormValue(formData, 'time'), activity: getTrimmedFormValue(formData, 'activity') }
  try {
    const res = await fetch(`${API_BASE}/itinerary-days/${itineraryDayId}/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const result = await parseJsonResponse(res)
    if (!res.ok) throw new Error(result.message || `Create activity failed with status ${res.status}`)
    await loadItinerary(selectedSailingForItinerary.id, selectedSailingForItinerary)
  } catch (err) {
    console.error(err)
    window.alert(err.message || 'Could not create activity.')
  }
}

async function updateActivityWithPrompts(activity) {
  const time = window.prompt('Activity time', activity.time)
  if (time === null) return
  const activityText = window.prompt('Activity description', activity.activity)
  if (activityText === null) return
  try {
    const res = await fetch(`${API_BASE}/activities/${activity.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ time: time.trim(), activity: activityText.trim() }) })
    const result = await parseJsonResponse(res)
    if (!res.ok) throw new Error(result.message || `Update activity failed with status ${res.status}`)
    await loadItinerary(selectedSailingForItinerary.id, selectedSailingForItinerary)
  } catch (err) {
    console.error(err)
    window.alert(err.message || 'Could not update activity.')
  }
}

async function deleteActivity(activityId) {
  if (!window.confirm('Delete this activity?')) return
  try {
    const res = await fetch(`${API_BASE}/activities/${activityId}`, { method: 'DELETE' })
    const result = await parseJsonResponse(res)
    if (!res.ok) throw new Error(result.message || `Delete activity failed with status ${res.status}`)
    await loadItinerary(selectedSailingForItinerary.id, selectedSailingForItinerary)
  } catch (err) {
    console.error(err)
    window.alert(err.message || 'Could not delete activity.')
  }
}

function ensureSailingSections() {
  if (document.getElementById('sailings-panel')) return

  const shipsPanel = document.getElementById('ships-panel')
  const parent = shipsPanel ? shipsPanel.parentElement : document.querySelector('main')

  const sailingsPanel = document.createElement('section')
  sailingsPanel.className = 'section sailings-section scroll-anchor'
  sailingsPanel.id = 'sailings-panel'
  sailingsPanel.hidden = true
  sailingsPanel.setAttribute('data-cy', 'sailings-panel')
  sailingsPanel.setAttribute('data-testid', 'sailings-panel')
  sailingsPanel.innerHTML = `
    <div class="section-heading">
      <p class="eyebrow">Sailing Admin</p>
      <h2 id="sailings-title" data-cy="sailings-title" data-testid="sailings-title">Ship Sailings</h2>
      <p>Create, update, delete, and review sailing dates for the selected ship.</p>
    </div>
    <div id="sailings-grid" class="card-grid" data-cy="sailings-grid" data-testid="sailings-grid"></div>
  `

  const itineraryPanel = document.createElement('section')
  itineraryPanel.className = 'section itinerary-section scroll-anchor'
  itineraryPanel.id = 'itinerary-panel'
  itineraryPanel.hidden = true
  itineraryPanel.setAttribute('data-cy', 'itinerary-panel')
  itineraryPanel.setAttribute('data-testid', 'itinerary-panel')
  itineraryPanel.innerHTML = `
    <div class="section-heading">
      <p class="eyebrow">Itinerary Admin</p>
      <h2 id="itinerary-title" data-cy="itinerary-title" data-testid="itinerary-title">Sailing Itinerary</h2>
      <p>Create, update, delete, and review itinerary days and scheduled activities.</p>
    </div>
    <div id="itinerary-grid" class="itinerary-grid" data-cy="itinerary-grid" data-testid="itinerary-grid"></div>
  `

  parent.insertAdjacentElement('afterend', itineraryPanel)
  parent.insertAdjacentElement('afterend', sailingsPanel)
}

function formatSailingDate(value) {
  if (!value) return 'Unknown departure date'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function escapeSingleQuotes(value) {
  return String(value).replace(/'/g, '\\&#39;')
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

if (healthCheckBtn) {
  healthCheckBtn.addEventListener('click', async () => {
    setSqaButtonLoading(healthCheckBtn, true, 'Checking...', 'Check API Health')
    updateSqaConsoleStatus('running', 'Running health check')

    try {
      const res = await fetch('/health')
      const data = await res.json()

      writeTestOutput('API Health Check Result', {
        statusCode: res.status,
        passed: res.ok,
        response: data
      })
    } catch (err) {
      writeTestOutput('API Health Check Failed', {
        passed: false,
        error: err.message
      })
    } finally {
      setSqaButtonLoading(healthCheckBtn, false, 'Checking...', 'Check API Health')
    }
  })
}

if (reloadDataBtn) {
  reloadDataBtn.addEventListener('click', async () => {
    setSqaButtonLoading(reloadDataBtn, true, 'Verifying...', 'Verify Cruise Data')
    updateSqaConsoleStatus('running', 'Verifying cruise data')

    try {
      const res = await fetch('/cruise')
      const data = await res.json()

      writeTestOutput('Cruise Data Verification Result', {
        statusCode: res.status,
        passed: res.ok && Array.isArray(data),
        recordCount: Array.isArray(data) ? data.length : 0,
        responsePreview: Array.isArray(data) ? data.slice(0, 3) : data
      })

      if (typeof loadCruiseLines === 'function') {
        await loadCruiseLines()
      }
    } catch (err) {
      writeTestOutput('Cruise Data Verification Failed', {
        passed: false,
        error: err.message
      })
    } finally {
      setSqaButtonLoading(reloadDataBtn, false, 'Verifying...', 'Verify Cruise Data')
    }
  })
}

if (uiSmokeTestBtn) {
  uiSmokeTestBtn.addEventListener('click', async () => {
    const results = []

    setSqaButtonLoading(uiSmokeTestBtn, true, 'Running...', 'Run UI Smoke Check')
    updateSqaConsoleStatus('running', 'Running UI smoke check')

    try {
      const healthRes = await fetch('/health')
      const healthData = await healthRes.json()

      results.push({
        test: 'GET /health',
        passed: healthRes.ok && healthData.status === 'ok',
        statusCode: healthRes.status
      })

      const cruiseRes = await fetch('/cruise')
      const cruiseData = await cruiseRes.json()

      results.push({
        test: 'GET /cruise',
        passed: cruiseRes.ok && Array.isArray(cruiseData) && cruiseData.length > 0,
        statusCode: cruiseRes.status,
        recordCount: Array.isArray(cruiseData) ? cruiseData.length : 0
      })

      if (Array.isArray(cruiseData) && cruiseData.length > 0) {
        const cruiseLineId = cruiseData[0].id
        const shipsRes = await fetch(`/cruise/ships/${cruiseLineId}`)
        const shipsData = await shipsRes.json()

        results.push({
          test: 'GET /cruise/ships/:cruiseLineId',
          passed: shipsRes.ok && Array.isArray(shipsData),
          statusCode: shipsRes.status,
          recordCount: Array.isArray(shipsData) ? shipsData.length : 0
        })
      }

      const passed = results.every(result => result.passed)

      writeTestOutput('UI Smoke Check Result', {
        passed,
        results
      })
    } catch (err) {
      writeTestOutput('UI Smoke Check Failed', {
        passed: false,
        error: err.message,
        results
      })
    } finally {
      setSqaButtonLoading(uiSmokeTestBtn, false, 'Running...', 'Run UI Smoke Check')
    }
  })
}


if (apiContractCheckBtn) {
  apiContractCheckBtn.addEventListener('click', runApiContractCheck)
}

if (crudWorkflowCheckBtn) {
  crudWorkflowCheckBtn.addEventListener('click', runSafeCrudWorkflowCheck)
}

if (performanceSmokeCheckBtn) {
  performanceSmokeCheckBtn.addEventListener('click', runPerformanceSmokeCheck)
}

if (seedIntegrityCheckBtn) {
  seedIntegrityCheckBtn.addEventListener('click', runSeedIntegrityCheck)
}

if (renderingConsistencyCheckBtn) {
  renderingConsistencyCheckBtn.addEventListener('click', runRenderingConsistencyCheck)
}

if (deploymentDiagnosticsBtn) {
  deploymentDiagnosticsBtn.addEventListener('click', runDeploymentDiagnosticsCheck)
}

if (resetDemoDataBtn) {
  resetDemoDataBtn.addEventListener('click', resetDemoData)
}

async function resetDemoData() {
  const confirmed = window.confirm('This will restore the demo database to the original seed data. Continue?')

  if (!confirmed) {
    writeTestOutput('Demo Data Reset Cancelled', {
      passed: false,
      cancelled: true
    })
    return
  }

  setSqaButtonLoading(resetDemoDataBtn, true, 'Resetting...', 'Reset Demo Data')
  updateSqaConsoleStatus('running', 'Resetting demo data')

  try {
    writeTestOutput('Demo Data Reset Started', {
      passed: false,
      message: 'Resetting demo data...'
    })

    const response = await fetch('/admin/reset-demo-data', {
      method: 'POST'
    })

    const result = await parseJsonResponse(response)

    if (!response.ok) {
      throw new Error(result.message || `Demo data reset failed with status ${response.status}`)
    }

    selectedCruiseLineForShips = null
    selectedCruiseLineNameForShips = ''

    const shipsPanel = document.getElementById('ships-panel')
    const shipsGrid = document.getElementById('ships-grid')
    const searchInput = document.getElementById('search-input')

    if (shipsPanel) shipsPanel.hidden = true
    if (shipsGrid) shipsGrid.innerHTML = ''
    if (searchInput) searchInput.value = ''

    hideUpdateCruiseLinePanel()
    hideSailingAndItineraryPanels()
    await loadCruiseLines()

    writeTestOutput('Demo Data Reset Result', {
      statusCode: response.status,
      passed: true,
      response: result
    })
  } catch (err) {
    console.error(err)
    writeTestOutput('Demo Data Reset Failed', {
      passed: false,
      error: err.message || 'Could not reset demo data.'
    })
  } finally {
    setSqaButtonLoading(resetDemoDataBtn, false, 'Resetting...', 'Reset Demo Data')
  }
}

if (clearTestOutputBtn) {
  clearTestOutputBtn.addEventListener('click', () => {
    testOutput.textContent = 'Test output will appear here...'
    updateSqaConsoleStatus('ready', 'Ready for validation')
    const lastRunLabel = document.querySelector('[data-cy="sqa-last-run-label"]')
    if (lastRunLabel) lastRunLabel.textContent = 'No manual run yet'
  })
}


if (typeof window !== 'undefined') {
  window.__cruiseExplorer = {
    getPendingFocusTarget
  }
}
