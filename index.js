require('dotenv/config')

const app = require('./app')
const initializeDatabase = require('./services/initializeDatabase.service')
const loadCruiseData = require('./services/loadCruiseData.service')

const PORT = process.env.PORT || 8000

async function startServer() {
  try {
    await initializeDatabase()
    await loadCruiseData()

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start application:', err)
    process.exit(1)
  }
}

startServer()