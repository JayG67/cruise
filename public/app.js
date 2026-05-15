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

document.addEventListener('DOMContentLoaded', () => {
  const reloadButton = document.getElementById('reload-button')
  const searchInput = document.getElementById('search-input')
  const createCruiseLineForm = document.getElementById('create-cruise-line-form')
  const addShipInputBtn = document.getElementById('add-ship-input-btn')
  const resetCruiseLineFormBtn = document.getElementById('reset-cruise-line-form-btn')
  const updateCruiseLineForm = document.getElementById('update-cruise-line-form')
  const addUpdateShipInputBtn = document.getElementById('add-update-ship-input-btn')
  const cancelUpdateCruiseLineBtn = document.getElementById('cancel-update-cruise-line-btn')

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

  if (updateCruiseLineForm) {
    updateCruiseLineForm.addEventListener('submit', updateCruiseLine)
  }

  if (addUpdateShipInputBtn) {
    addUpdateShipInputBtn.addEventListener('click', () => addUpdateShipInputRow())
  }

  if (cancelUpdateCruiseLineBtn) {
    cancelUpdateCruiseLineBtn.addEventListener('click', hideUpdateCruiseLinePanel)
  }
})

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
    shipInputList.innerHTML = '<p data-cy="update-ships-loading-message">Loading ships...</p>'
  }

  try {
    const ships = await fetchShipsForCruiseLine(cruiseLineId)
    renderUpdateShipInputs(ships)
    setUpdateCruiseLineMessage(`Editing ${cruiseLine.name}.`, '')
  } catch (err) {
    console.error(err)

    if (shipInputList) {
      shipInputList.innerHTML = `
        <div class="empty-message compact-message update-ship-load-error" data-cy="update-ships-load-error">
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
      <input name="updateShipName" data-cy="update-cruise-line-ship-name-input" type="text" placeholder="Example: Rotterdam" maxlength="255" value="${escapeHtml(value)}" data-ship-id="${escapeHtml(shipId)}" />
    </label>
    ${shipId ? `
      <div class="ship-row-actions">
        <button class="delete-ship-btn danger subtle-danger" data-cy="delete-update-ship-button" type="button">Delete Ship</button>
      </div>
    ` : '<button class="remove-ship-row-btn" data-cy="remove-update-ship-input-button" type="button">Remove</button>'}
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
    grid.innerHTML = '<p class="empty-message" data-cy="cruise-empty-message">No cruise lines match your search.</p>'
    return
  }

  lines.forEach(line => {
    const card = document.createElement('article')
    card.className = 'data-card'
    card.setAttribute('data-cy', 'cruise-card')

    card.innerHTML = `
      <div class="card-content">
        <h3>${escapeHtml(line.name)}</h3>
        <p class="card-meta"><strong>Country:</strong> ${escapeHtml(line.country || 'Not listed')}</p>
        ${line.website ? `<p class="card-website"><a href="${escapeHtml(line.website)}" target="_blank" rel="noopener" data-cy="cruise-website-link">Visit website</a></p>` : ''}
      </div>
      <div class="card-actions">
        <div class="card-primary-actions">
          <button data-cy="view-ships-button" type="button">View Ships</button>
          <button data-cy="update-cruise-line-button" type="button">Update</button>
        </div>
        <button class="danger subtle-danger" data-cy="delete-cruise-line-button" type="button">Delete</button>
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
