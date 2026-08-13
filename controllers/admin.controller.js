const { requireAdminRequest } = require('../services/requestAuthorization.service')
const loadCruiseData = require('../services/loadCruiseData.service')
const { canResetDemoData } = require('../services/demoDataPolicy.service')

exports.resetDemoData = async (req, res, next) => {
  try {
    if (!canResetDemoData()) {
      return res.status(404).json({ message: 'Not found' })
    }

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
