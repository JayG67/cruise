const express = require('express')
const controller = require('../controllers/cruise.controller')

const router = express.Router()

router.get('/', controller.getCruiseLines)
router.get('/cruise-line/:id', controller.getCruiseLineById)
router.get('/ships/:cruiseLineId', controller.getShipsByCruiseLine)

router.post('/cruise-line', controller.insertCruiseLine)
router.post('/ship', controller.insertShip)

router.patch('/cruise-line/:id', controller.updateCruiseLine)
router.patch('/ship/:id', controller.updateShip)

router.delete('/cruise-line/:id', controller.deleteCruiseLine)
router.delete('/ship/:id', controller.deleteShip)

module.exports = router
