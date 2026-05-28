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
      '<!doctype html><html><head><title>Cruise Portfolio React Migration</title></head><body><div id="root">React preview test shell</div></body></html>'
    )
    createdReactIndex = true
  }
})

afterAll(() => {
  if (createdReactIndex && fs.existsSync(reactIndexPath)) {
    fs.rmSync(reactIndexPath)
  }
})

describe('React preview hosting integration tests', () => {
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

  it('GET /health should remain a JSON API route after React preview hosting is added', async () => {
    const res = await request(app).get('/health')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('application/json')
    expect(res.body).toEqual({ status: 'ok' })
  })
})
