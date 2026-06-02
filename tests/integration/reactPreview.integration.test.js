const fs = require('fs')
const path = require('path')
const request = require('supertest')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

const reactBuildDir = path.join(__dirname, '..', '..', 'dist', 'react')
const reactIndexPath = path.join(reactBuildDir, 'index.html')
let createdReactIndex = false
const originalDefaultExperience = process.env.CRUISE_DEFAULT_EXPERIENCE

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()

  if (!fs.existsSync(reactIndexPath)) {
    fs.mkdirSync(reactBuildDir, { recursive: true })
    fs.writeFileSync(
      reactIndexPath,
      '<!doctype html><html><head><title>Cruise Portfolio React Migration</title></head><body><div id="root">React preview test shell</div></body></html>'
    )
    createdReactIndex = true
  }
})

afterEach(() => {
  if (originalDefaultExperience === undefined) {
    delete process.env.CRUISE_DEFAULT_EXPERIENCE
  } else {
    process.env.CRUISE_DEFAULT_EXPERIENCE = originalDefaultExperience
  }
})

afterAll(() => {
  if (createdReactIndex && fs.existsSync(reactIndexPath)) {
    fs.rmSync(reactIndexPath)
  }
})

describe('React preview hosting integration tests', () => {

  it('GET / should serve the React shell by default after cutover', async () => {
    delete process.env.CRUISE_DEFAULT_EXPERIENCE

    const res = await request(app).get('/')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('Cruise Portfolio React Migration')
    expect(res.text).not.toContain('data-testid="home-section"')
  })

  it('GET / should serve the legacy DOM app when legacy rollback mode is enabled', async () => {
    process.env.CRUISE_DEFAULT_EXPERIENCE = 'legacy'

    const res = await request(app).get('/')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('<title>Cruise Explorer</title>')
    expect(res.text).toContain('data-testid="home-section"')
  })

  it('GET /legacy should keep the DOM application available after React default cutover', async () => {
    delete process.env.CRUISE_DEFAULT_EXPERIENCE

    const res = await request(app).get('/legacy')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('<title>Cruise Explorer</title>')
    expect(res.text).toContain('data-testid="home-section"')
  })
  it('GET /app-next should serve the built React preview shell from Express', async () => {
    const res = await request(app).get('/app-next')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('Cruise Portfolio React Migration')
  })

  it('GET /app-next nested routes should fall back to the React shell', async () => {
    const res = await request(app).get('/app-next/readiness')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('Cruise Portfolio React Migration')
  })

  it('GET /app-next should reference React assets under the /app-next route base', async () => {
    const res = await request(app).get('/app-next')

    expect(res.statusCode).toBe(200)
    expect(res.text).not.toContain('src="/assets/')
    expect(res.text).not.toContain('href="/assets/')

    if (res.text.includes('/assets/')) {
      expect(res.text).toContain('/app-next/assets/')
    }
  })



  it('GET / should not expose legacy DOM JavaScript or CSS assets at the production root after React default cutover', async () => {
    delete process.env.CRUISE_DEFAULT_EXPERIENCE

    const legacyScriptRes = await request(app).get('/app.js')
    const legacyStylesRes = await request(app).get('/styles.css')

    expect(legacyScriptRes.statusCode).toBe(404)
    expect(legacyStylesRes.statusCode).toBe(404)
  })

  it('GET /legacy should continue to serve legacy DOM assets for rollback mode', async () => {
    delete process.env.CRUISE_DEFAULT_EXPERIENCE

    const legacyScriptRes = await request(app).get('/legacy/app.js')
    const legacyStylesRes = await request(app).get('/legacy/styles.css')

    expect(legacyScriptRes.statusCode).toBe(200)
    expect(legacyScriptRes.headers['content-type']).toContain('javascript')
    expect(legacyStylesRes.statusCode).toBe(200)
    expect(legacyStylesRes.headers['content-type']).toContain('text/css')
  })

  it('GET / should restore legacy root assets only when rollback mode is enabled', async () => {
    process.env.CRUISE_DEFAULT_EXPERIENCE = 'legacy'

    const legacyScriptRes = await request(app).get('/app.js')
    const legacyStylesRes = await request(app).get('/styles.css')

    expect(legacyScriptRes.statusCode).toBe(200)
    expect(legacyStylesRes.statusCode).toBe(200)
  })

  it('GET /images should keep shared visual assets available to the React default shell', async () => {
    delete process.env.CRUISE_DEFAULT_EXPERIENCE

    const res = await request(app).get('/images/cruise-background.png')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('image/png')
  })

  it('GET /health should remain a JSON API route after React preview hosting is added', async () => {
    const res = await request(app).get('/health')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('application/json')
    expect(res.body).toEqual({ status: 'ok' })
  })
})
