require('dotenv/config')

const path = require('path')
const express = require('express')

const cruiseRouter = require('./routes/cruise.routes')
const { serverLogger } = require('./middleware/loggers')
const initializeDatabase = require('./services/initializeDatabase.service')
const loadCruiseData = require('./services/loadCruiseData.service')

const app = express()
const PORT = process.env.PORT || 8000

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(serverLogger)

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/cruise', cruiseRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({
    message: 'Internal server error',
    error: err.message
  })
})

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