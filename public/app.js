const API_BASE = '/cruise'

let cruiseLines = []

document.addEventListener('DOMContentLoaded', () => {
  const reloadButton = document.getElementById('reload-button')
  const searchInput = document.getElementById('search-input')

  if (document.getElementById('cruise-grid')) {
    loadCruiseLines()
  }

  if (reloadButton) {
    reloadButton.addEventListener('click', loadCruiseLines)
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase()
      const filteredLines = cruiseLines.filter(line =>
        line.name.toLowerCase().includes(searchTerm) ||
        (line.country || '').toLowerCase().includes(searchTerm)
      )
      renderCruiseLines(filteredLines)
    })
  }
})

function selectStack(stack) {
  if (stack === 'vanilla') {
    window.location.href = '/index.html#cruise-lines'
    return
  }

  if (stack === 'node') {
    window.location.href = '/cruise'
    return
  }

  alert('Coming soon!')
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

    if (statusMessage) {
      statusMessage.textContent = `Loaded ${cruiseLines.length} cruise line${cruiseLines.length === 1 ? '' : 's'}.`
    }
  } catch (err) {
    console.error(err)
    if (statusMessage) {
      statusMessage.textContent = 'Could not load cruise lines. Check that the server is running and the database has data.'
    }
  }
}

function renderCruiseLines(lines) {
  const grid = document.getElementById('cruise-grid')

  if (!grid) return

  grid.innerHTML = ''

  if (!lines.length) {
    grid.innerHTML = '<p>No cruise lines match your search.</p>'
    return
  }

  lines.forEach(line => {
    const card = document.createElement('article')
    card.className = 'data-card'

    card.innerHTML = `
      <h3>${line.name}</h3>
      <p><strong>Country:</strong> ${line.country || 'Not listed'}</p>
      ${line.website ? `<p><a href="${line.website}" target="_blank" rel="noopener">Visit website</a></p>` : ''}
      <button onclick="loadShips('${line.id}', '${escapeSingleQuotes(line.name)}')">View Ships</button>
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
    if (grid) grid.innerHTML = '<p>Loading ships...</p>'

    const res = await fetch(`${API_BASE}/ships/${cruiseLineId}`)

    if (!res.ok) {
      throw new Error(`Ship request failed with status ${res.status}`)
    }

    const ships = await res.json()
    renderShips(ships)
  } catch (err) {
    console.error(err)
    if (grid) grid.innerHTML = '<p>No ships found for this cruise line yet.</p>'
  }
}

function renderShips(ships) {
  const grid = document.getElementById('ships-grid')

  if (!grid) return

  grid.innerHTML = ''

  ships.forEach(ship => {
    const card = document.createElement('article')
    card.className = 'data-card'
    card.innerHTML = `<h3>${ship.name}</h3>`
    grid.appendChild(card)
  })
}

function escapeSingleQuotes(value) {
  return String(value).replace(/'/g, '\\&#39;')
}
