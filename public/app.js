const API_BASE = '/cruise'
const testOutput = document.getElementById('testOutput')
const healthCheckBtn = document.getElementById('healthCheckBtn')
const reloadDataBtn = document.getElementById('reloadDataBtn')
const uiSmokeTestBtn = document.getElementById('uiSmokeTestBtn')
const clearTestOutputBtn = document.getElementById('clearTestOutputBtn')

let cruiseLines = []

document.addEventListener('DOMContentLoaded', () => {
  const reloadButton = document.getElementById('reload-button')
  const searchInput = document.getElementById('search-input')
  const createCruiseLineForm = document.getElementById('create-cruise-line-form')
  const addShipInputBtn = document.getElementById('add-ship-input-btn')
  const resetCruiseLineFormBtn = document.getElementById('reset-cruise-line-form-btn')

  if (document.getElementById('cruise-grid')) {
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
})

function writeTestOutput(title, data) {
  if (!testOutput) return

  testOutput.textContent = `${title}\n\n${JSON.stringify(data, null, 2)}`
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
  const submitButton = document.getElementById('create-cruise-line-btn')
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
      <input name="shipName" data-cy="create-cruise-line-ship-name-input" type="text" placeholder="Example: Rotterdam" maxlength="255" value="${escapeHtml(value)}" />
    </label>
    <button class="remove-ship-row-btn" data-cy="remove-ship-input-button" type="button">Remove</button>
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
        <input name="shipName" data-cy="create-cruise-line-ship-name-input" type="text" placeholder="Example: Rotterdam" maxlength="255" />
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

async function parseJsonResponse(response) {
  try {
    return await response.json()
  } catch (err) {
    return {}
  }
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
    grid.innerHTML = '<p class="empty-message" data-cy="cruise-empty-message">No cruise lines match your search.</p>'
    return
  }

  lines.forEach(line => {
    const card = document.createElement('article')
    card.className = 'data-card'
    card.setAttribute('data-cy', 'cruise-card')

    card.innerHTML = `
      <h3>${escapeHtml(line.name)}</h3>
      <p><strong>Country:</strong> ${escapeHtml(line.country || 'Not listed')}</p>
      ${line.website ? `<p><a href="${escapeHtml(line.website)}" target="_blank" rel="noopener" data-cy="cruise-website-link">Visit website</a></p>` : ''}
      <button data-cy="view-ships-button" onclick="loadShips('${line.id}', '${escapeSingleQuotes(line.name)}')">View Ships</button>
    `

    grid.appendChild(card)
  })
}

async function loadShips(cruiseLineId, cruiseLineName) {
  const panel = document.getElementById('ships-panel')
  const title = document.getElementById('ships-title')
  const grid = document.getElementById('ships-grid')

  try {
    if (panel) panel.hidden = false
    if (title) title.textContent = `${cruiseLineName} Ships`
    if (grid) grid.innerHTML = '<p data-cy="ships-loading-message">Loading ships...</p>'

    const res = await fetch(`${API_BASE}/ships/${cruiseLineId}`)

    if (!res.ok) {
      throw new Error(`Ship request failed with status ${res.status}`)
    }

    const ships = await res.json()
    renderShips(ships)
  } catch (err) {
    console.error(err)
    if (grid) grid.innerHTML = '<p data-cy="ships-empty-message">No ships found for this cruise line yet.</p>'
  }
}

function renderShips(ships) {
  const grid = document.getElementById('ships-grid')

  if (!grid) return

  grid.innerHTML = ''

  ships.forEach(ship => {
    const card = document.createElement('article')
    card.className = 'data-card'
    card.setAttribute('data-cy', 'ship-card')
    card.innerHTML = `<h3>${escapeHtml(ship.name)}</h3>`
    grid.appendChild(card)
  })
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
    }
  })
}

if (reloadDataBtn) {
  reloadDataBtn.addEventListener('click', async () => {
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
    }
  })
}

if (uiSmokeTestBtn) {
  uiSmokeTestBtn.addEventListener('click', async () => {
    const results = []

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
    }
  })
}

if (clearTestOutputBtn) {
  clearTestOutputBtn.addEventListener('click', () => {
    testOutput.textContent = 'Test output will appear here...'
  })
}
