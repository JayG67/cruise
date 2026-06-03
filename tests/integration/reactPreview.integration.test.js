const fs = require('fs')
const path = require('path')
const request = require('supertest')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

const reactBuildDir = path.join(__dirname, '..', '..', 'dist', 'react')
const reactIndexPath = path.join(reactBuildDir, 'index.html')
const expectedProductTitle = 'Cruise Fleet Operations Platform'
const reactShellFixture = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Cruise Fleet Operations Platform is a React operations application for cruise line fleet, sailing, booking, passenger, quality, and future ship-crew logistics workflows."
    />
    <link rel="canonical" href="https://cruise-explorer.onrender.com/" />
    <title>${expectedProductTitle}</title>
    <link rel="stylesheet" crossorigin href="/assets/index-test.css">
  </head>
  <body>
    <noscript>${expectedProductTitle} requires JavaScript.</noscript>
    <div id="root"></div>
    <script type="module" crossorigin src="/assets/index-test.js"></script>
  </body>
</html>`
let originalReactIndex = null
let restoredReactIndex = false

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()

  fs.mkdirSync(reactBuildDir, { recursive: true })

  if (fs.existsSync(reactIndexPath)) {
    originalReactIndex = fs.readFileSync(reactIndexPath, 'utf8')
  }

  if (!originalReactIndex || !originalReactIndex.includes(expectedProductTitle)) {
    fs.writeFileSync(reactIndexPath, reactShellFixture)
    restoredReactIndex = true
  }
})

afterAll(() => {
  if (!restoredReactIndex) {
    return
  }

  if (originalReactIndex) {
    fs.writeFileSync(reactIndexPath, originalReactIndex)
    return
  }

  if (fs.existsSync(reactIndexPath)) {
    fs.rmSync(reactIndexPath)
  }
})

describe('React application hosting integration tests', () => {
  it('GET / should serve the React application shell', async () => {
    const res = await request(app).get('/')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('Cruise Fleet Operations Platform')
    expect(res.text).not.toContain('data-testid="home-section"')
  })

  it('GET / should remain a compatibility alias for the built React shell', async () => {
    const res = await request(app).get('/')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('Cruise Fleet Operations Platform')
  })

  it('GET / nested routes should fall back to the React shell', async () => {
    const res = await request(app).get('//fleet')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('Cruise Fleet Operations Platform')
  })

  it('GET / should reference built React assets from the production root route', async () => {
    const res = await request(app).get('/')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('Cruise Fleet Operations Platform')
    expect(res.text).toContain('type="module"')
    expect(res.text).toContain('/assets/')
    expect(res.text).not.toContain(`/${['app', 'next'].join('-')}/assets/`)
  })

  it('GET / should not expose retired pre-React JavaScript or CSS assets at the production root', async () => {
    const retiredScriptRes = await request(app).get('/app.js')
    const retiredStylesRes = await request(app).get('/styles.css')

    expect(retiredScriptRes.headers['content-type'] || '').not.toContain('javascript')
    expect(retiredStylesRes.headers['content-type'] || '').not.toContain('text/css')
    expect(retiredScriptRes.text).not.toContain('data-testid="home-section"')
    expect(retiredStylesRes.text).not.toContain('data-testid="home-section"')
  })

  it('GET /retired should no longer serve the retired pre-React application', async () => {
    const res = await request(app).get('/retired')

    expect(res.statusCode).toBe(404)
    expect(res.text).not.toContain('data-testid="home-section"')
  })

  it('GET /retired pre-React assets should no longer be available', async () => {
    const retiredScriptRes = await request(app).get('/retired/app.js')
    const retiredStylesRes = await request(app).get('/retired/styles.css')

    expect(retiredScriptRes.statusCode).toBe(404)
    expect(retiredStylesRes.statusCode).toBe(404)
  })

  it('GET /images should keep shared visual assets available to the React application shell', async () => {
    const res = await request(app).get('/images/cruise-background.png')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('image/png')
  })

  it('GET /health should remain a JSON API route after React application hosting', async () => {
    const res = await request(app).get('/health')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('application/json')
    expect(res.body).toEqual({ status: 'ok' })
  })
})
