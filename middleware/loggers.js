const fs = require('fs')
const path = require('path')

const logDir = path.join(__dirname, '..', 'logs')
const logFile = path.join(logDir, 'server.log')

exports.serverLogger = (req, res, next) => {
  const log = `${new Date().toISOString()} - ${req.method} ${req.path}`

  fs.mkdirSync(logDir, { recursive: true })

  fs.appendFile(logFile, log + '\n', (err) => {
    if (err) {
      console.error('Failed to write to log file:', err)
    }
  })

  next()
}