require("dotenv/config")
const express = require('express');
const {serverLogger} = require('./middleware/loggers')

const app = express()
const PORT = 8000

// Middleware
app.use(express.json())
app.use(serverLogger)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})