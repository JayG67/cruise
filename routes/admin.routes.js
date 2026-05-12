const express = require('express')

const adminController = require('../controllers/admin.controller')

const router = express.Router()

router.post('/reset-demo-data', adminController.resetDemoData)

module.exports = router
