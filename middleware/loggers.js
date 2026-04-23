const fs = require('fs')

exports.serverLogger = (req, res, next) => {
    const log = `${new Date().toISOString()} - ${req.method} ${req.path}`
    fs.appendFile('/logs/server.log', log + '\n', (err) => {
        if (err) {
            console.error('Failed to write to log file:', err)
        }
    })
    next()
}