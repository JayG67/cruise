require('./config/loadEnvironment').loadEnvironment()

const app = require('./app')
const initializeDatabase = require('./services/initializeDatabase.service')
const loadCruiseData = require('./services/loadCruiseData.service')

const PORT = process.env.PORT || 8000
const startupAttempts = Number(process.env.DB_STARTUP_ATTEMPTS || 30)
const startupRetryDelayMs = Number(process.env.DB_STARTUP_RETRY_DELAY_MS || 1000)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function prepareDatabaseWithRetry() {
  for (let attempt = 1; attempt <= startupAttempts; attempt += 1) {
    try {
      await initializeDatabase()
      await loadCruiseData()
      return
    } catch (err) {
      const isLastAttempt = attempt === startupAttempts

      if (isLastAttempt) {
        throw err
      }

      if (process.env.SUPPRESS_DB_LOGS !== 'true') {
        console.warn(`Database startup attempt ${attempt}/${startupAttempts} failed; retrying in ${startupRetryDelayMs}ms.`)
      }

      await sleep(startupRetryDelayMs)
    }
  }
}

async function startServer() {
  try {
    await prepareDatabaseWithRetry()

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start application:', err)
    process.exit(1)
  }
}

startServer()
