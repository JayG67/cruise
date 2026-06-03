require('dotenv/config')

const path = require('path')
const fs = require('fs')
const express = require('express')
const compression = require('compression')

const cruiseRouter = require('./routes/cruise.routes')
const adminRouter = require('./routes/admin.routes')
const { serverLogger } = require('./middleware/loggers')

const app = express()

const reactBuildDir = path.join(__dirname, 'dist', 'react')
const reactIndexPath = path.join(reactBuildDir, 'index.html')
const publicImagesDir = path.join(__dirname, 'public', 'images')

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

app.use('/images', express.static(publicImagesDir, { redirect: false, setHeaders: setLongTermAssetCache }))
app.use('/app-next', express.static(reactBuildDir, { redirect: false, setHeaders: setReactBuildCache }))
app.get(/^\/app-next(?:\/.*)?$/, sendReactApp)
app.get('/', sendReactApp)

app.use(express.json())
app.use(serverLogger)

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/cruise', cruiseRouter)
app.use('/admin', adminRouter)

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
