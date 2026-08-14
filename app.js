require('./config/loadEnvironment').loadEnvironment()

const path = require('path')
const fs = require('fs')
const express = require('express')
const compression = require('compression')

const cruiseRouter = require('./routes/cruise.routes')
const adminRouter = require('./routes/admin.routes')
const aiRouter = require('./routes/ai.routes')
const { serverLogger } = require('./middleware/loggers')
const { attachRequestIdentity } = require('./middleware/requestIdentity.middleware')
const { canExposeSeedDataOverHttp } = require('./services/demoDataPolicy.service')
const {
  attachRequestContext,
  securityHeaders,
  apiNoStore,
  generalApiRateLimit,
  mutationRateLimitWhenNeeded,
  aiRateLimitWhenNeeded,
  errorHandler
} = require('./middleware/security.middleware')

const app = express()
app.disable('x-powered-by')

if (String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production') {
  app.set('trust proxy', 1)
}

const reactBuildDir = path.join(__dirname, 'dist', 'react')
const reactIndexPath = path.join(reactBuildDir, 'index.html')
const publicImagesDir = path.join(__dirname, 'public', 'images')
const ROBOTS_POLICY = 'User-agent: *\nAllow: /\n'
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


function sendLighthouseAuditPage(req, res, next) {
  res.setHeader('Cache-Control', 'no-cache')
  return res.sendFile(path.join(__dirname, 'public', 'lighthouse-ci.html'), (err) => {
    if (err) next(err)
  })
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

app.use(attachRequestContext)
app.use(securityHeaders)
app.use(compression())

// Register the platform health endpoint before static hosting and SPA fallbacks.
// This guarantees that generated frontend artifacts can never shadow /health.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/images', express.static(publicImagesDir, { redirect: false, setHeaders: setLongTermAssetCache }))
app.get('/robots.txt', (req, res) => res.status(200).type('text/plain').send(ROBOTS_POLICY))

const seedDataStatic = express.static(seedDataDir, { redirect: false, setHeaders: setReactBuildCache })
app.use('/data', (req, res, next) => {
  if (!canExposeSeedDataOverHttp()) {
    return res.status(404).type('text/plain').send('Not found')
  }

  return seedDataStatic(req, res, next)
})
app.use(express.static(reactBuildDir, { redirect: false, setHeaders: setReactBuildCache }))
app.get('/lighthouse-ci.css', (req, res) => res.sendFile(path.join(__dirname, 'public', 'lighthouse-ci.css')))
app.get('/lighthouse-ci', sendLighthouseAuditPage)
app.get('/', sendReactApp)

app.use(express.json({ limit: '512kb' }))
app.use(serverLogger)
app.use(attachRequestIdentity)

app.use('/cruise', apiNoStore, generalApiRateLimit, mutationRateLimitWhenNeeded, cruiseRouter)
app.use('/admin', apiNoStore, generalApiRateLimit, mutationRateLimitWhenNeeded, adminRouter)
app.use('/ai', apiNoStore, generalApiRateLimit, aiRateLimitWhenNeeded, aiRouter)

app.get(/^\/(?!cruise|admin|ai|health|images|data|retired|lighthouse-ci)(?:.*)?$/, sendReactApp)

app.use(errorHandler)

module.exports = app
