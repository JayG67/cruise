const fs = require('fs')
const path = require('path')

const logDir = path.join(__dirname, '..', 'logs')
const logFile = path.join(logDir, 'server.log')

function appendLogLine(line) {
  fs.mkdirSync(logDir, { recursive: true })
  fs.appendFile(logFile, `${line}\n`, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err)
    }
  })
}

exports.serverLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint()
  const requestId = req.requestId || 'no-request-id'

  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    appendLogLine(
      `${new Date().toISOString()} requestId=${requestId} method=${req.method} path=${req.path} status=${res.statusCode} durationMs=${elapsedMs.toFixed(1)}`
    )
  })

  next()
}
