const express = require('express')
const controller = require('../controllers/cruise.controller')
const router = express.Router()

router.get('/', controller.getCruiseLines)

router.get('/cruiseLine:id', controller.getCruiseLineById)

router.get('/ships/:id', controller.getShipsByCruiseLine)

router.post('/cruiseLine:id', controller.insertCruiseLine)

router.post('/ship/:id', controller.insertShip)

router.patch('/cruiseLine:id', controller.updateCruiseLine)

router.patch('/ship/:id', controller.updateShip)

router.delete('/cruiseLine:id', controller.deleteCruiseLine)

router.delete('/ship/:id', controller.deleteShip)

module.exports = router