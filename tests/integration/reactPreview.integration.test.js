const fs = require('fs')
const path = require('path')
const request = require('supertest')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

const reactBuildDir = path.join(__dirname, '..', '..', 'dist', 'react')
const reactIndexPath = path.join(reactBuildDir, 'index.html')
let createdReactIndex = false

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()

  if (!fs.existsSync(reactIndexPath)) {
    fs.mkdirSync(reactBuildDir, { recursive: true })
    fs.writeFileSync(
      reactIndexPath,
      '<!doctype html><html><head><title>Cruise Explorer Operations Console</title></head><body><div id="root">React application test shell</div></body></html>'
    )
    createdReactIndex = true
  }
})

afterAll(() => {
  if (createdReactIndex && fs.existsSync(reactIndexPath)) {
    fs.rmSync(reactIndexPath)
  }
})

describe('React application hosting integration tests', () => {
  it('GET / should serve the React application shell', async () => {
    const res = await request(app).get('/')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('Cruise Explorer Operations Console')
    expect(res.text).not.toContain('data-testid="home-section"')
  })

  it('GET /app-next should remain a compatibility alias for the built React shell', async () => {
    const res = await request(app).get('/app-next')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('Cruise Explorer Operations Console')
  })

  it('GET /app-next nested routes should fall back to the React shell', async () => {
    const res = await request(app).get('/app-next/fleet')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('Cruise Explorer Operations Console')
  })

  it('GET /app-next should reference React assets under the /app-next route base when built assets include absolute asset paths', async () => {
    const res = await request(app).get('/app-next')

    expect(res.statusCode).toBe(200)
    expect(res.text).not.toContain('src="/assets/')
    expect(res.text).not.toContain('href="/assets/')

    if (res.text.includes('/assets/')) {
      expect(res.text).toContain('/app-next/assets/')
    }
  })

  it('GET / should not expose retired DOM JavaScript or CSS assets at the production root', async () => {
    const legacyScriptRes = await request(app).get('/app.js')
    const legacyStylesRes = await request(app).get('/styles.css')

    expect(legacyScriptRes.statusCode).toBe(404)
    expect(legacyStylesRes.statusCode).toBe(404)
  })

  it('GET /legacy should no longer serve the retired DOM application', async () => {
    const res = await request(app).get('/legacy')

    expect(res.statusCode).toBe(404)
    expect(res.text).not.toContain('data-testid="home-section"')
  })

  it('GET /legacy DOM assets should no longer be available', async () => {
    const legacyScriptRes = await request(app).get('/legacy/app.js')
    const legacyStylesRes = await request(app).get('/legacy/styles.css')

    expect(legacyScriptRes.statusCode).toBe(404)
    expect(legacyStylesRes.statusCode).toBe(404)
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
