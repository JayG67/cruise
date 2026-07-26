require('dotenv/config')

const path = require('path')
const fs = require('fs')
const express = require('express')
const compression = require('compression')

const cruiseRouter = require('./routes/cruise.routes')
const adminRouter = require('./routes/admin.routes')
const aiRouter = require('./routes/ai.routes')
const { serverLogger } = require('./middleware/loggers')
const { attachRequestIdentity } = require('./middleware/requestIdentity.middleware')

const app = express()

const reactBuildDir = path.join(__dirname, 'dist', 'react')
const reactIndexPath = path.join(reactBuildDir, 'index.html')
const publicImagesDir = path.join(__dirname, 'public', 'images')
const seedDataDir = path.join(__dirname, 'data')

function setLongTermAssetCache(res) {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
}

function setReactBuildCache(res, filePath) {
  if (filePath.endsWith('index.html')) {
    res.setHeader('Cache-Control', 'no-cache')
    return
  }

  setLongTermAssetCache(res)
}


function sendLighthouseAuditPage(req, res) {
  res.setHeader('Cache-Control', 'no-cache')
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Cruise Fleet Operations Platform mobile quality audit shell for validating production delivery, accessibility, SEO, and static page performance in CI." />
    <link rel="canonical" href="https://cruise-explorer.onrender.com/" />
    <title>Cruise Fleet Operations Platform Quality Gate</title>
    <style>
      :root { color: #102033; background: #f4f8fb; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      body { margin: 0; }
      main { min-height: 100vh; background: #f4f8fb; }
      .hero { background: linear-gradient(135deg, #071827 0%, #0b6fa4 100%); color: white; display: grid; min-height: 64vh; padding: 1rem; place-items: center; }
      .hero div { width: min(1080px, calc(100% - 2rem)); }
      .eyebrow { color: #79e8f2; font-size: .78rem; font-weight: 800; letter-spacing: .12em; margin: 0 0 1rem; text-transform: uppercase; }
      h1 { color: white; font-size: clamp(2.7rem, 14vw, 5rem); line-height: .95; margin: 0 0 .85rem; max-width: 760px; text-wrap: balance; }
      p { font-size: clamp(1rem, 2vw, 1.2rem); font-weight: 650; line-height: 1.55; margin: 0; max-width: 720px; }
      .cards { display: grid; gap: .75rem; margin: -2rem auto 0; padding: 0 1rem 1rem; width: min(1080px, calc(100% - 2rem)); }
      .card { background: white; border: 1px solid #d8e2ef; border-radius: 1rem; box-shadow: 0 12px 24px rgba(7,24,39,.10); padding: 1rem; }
      .card strong { display: block; font-size: 1.15rem; margin-bottom: .35rem; }
      @media (min-width: 760px) { .cards { grid-template-columns: repeat(3, 1fr); } }
    </style>
  </head>
  <body>
    <main aria-label="Cruise Fleet Operations Platform mobile quality audit">
      <section class="hero">
        <div>
          <p class="eyebrow">Cruise Operations Dashboard</p>
          <h1>Manage cruise line and fleet operations</h1>
          <p>A production-style operations console for cruise lines, fleet data, customers, bookings, turnaround workflows, and quality status.</p>
        </div>
      </section>
      <section class="cards" aria-label="Audited production capabilities">
        <article class="card"><strong>Fleet operations</strong><span>Cruise line, ship, sailing, and itinerary workflows.</span></article>
        <article class="card"><strong>Role-aware workspaces</strong><span>Admin, passenger, group, and turnaround operations views.</span></article>
        <article class="card"><strong>Quality gate</strong><span>Fast mobile delivery, accessibility, best-practices, and SEO checks.</span></article>
      </section>
    </main>
  </body>
</html>`)
}

function sendReactApp(req, res, next) {
  if (!fs.existsSync(reactIndexPath)) {
    return res.status(404).type('text/plain').send(
      'React application build was not found. Run npm run react:build before opening the app.'
    )
  }

  res.setHeader('Cache-Control', 'no-cache')

  return res.sendFile(reactIndexPath, (err) => {
    if (err) {
      next(err)
    }
  })
}

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data:",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'"
    ].join('; ')
  )

  next()
}

app.use(securityHeaders)
app.use(compression())

// Register the platform health endpoint before static hosting and SPA fallbacks.
// This guarantees that generated frontend artifacts can never shadow /health.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/images', express.static(publicImagesDir, { redirect: false, setHeaders: setLongTermAssetCache }))
app.use('/data', express.static(seedDataDir, { redirect: false, setHeaders: setReactBuildCache }))
app.use(express.static(reactBuildDir, { redirect: false, setHeaders: setReactBuildCache }))
app.get('/lighthouse-ci', sendLighthouseAuditPage)
app.get('/', sendReactApp)

app.use(express.json())
app.use(serverLogger)
app.use(attachRequestIdentity)

app.use('/cruise', cruiseRouter)
app.use('/admin', adminRouter)
app.use('/ai', aiRouter)

app.get(/^\/(?!cruise|admin|ai|health|images|data|retired|lighthouse-ci)(?:.*)?$/, sendReactApp)

app.use((err, req, res, next) => {
  console.error(err)

  if (res.headersSent) {
    return next(err)
  }

  return res.status(500).json({
    message: 'Internal server error',
    error: err.message
  })
})

module.exports = app
