const { requireAdminRequest } = require('../services/requestAuthorization.service')
const loadCruiseData = require('../services/loadCruiseData.service')

exports.resetDemoData = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return
    const resetResult = await loadCruiseData()

    return res.status(200).json({
      message: 'Demo data reset successfully',
      ...resetResult
    })
  } catch (err) {
    next(err)
  }
}
