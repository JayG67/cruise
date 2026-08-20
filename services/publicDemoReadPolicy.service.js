const PUBLIC_DEMO_READ_MODES = Object.freeze({
  ENABLED: 'enabled',
  DISABLED: 'disabled'
})

const SAFE_READ_METHODS = new Set(['GET', 'HEAD'])

function isProductionEnvironment(env = process.env) {
  return String(env.NODE_ENV || '').trim().toLowerCase() === 'production'
}

function getPublicDemoReadMode(env = process.env) {
  if (!isProductionEnvironment(env)) return PUBLIC_DEMO_READ_MODES.DISABLED

  const configuredMode = String(env.CRUISE_PUBLIC_DEMO_READ_MODE || '').trim().toLowerCase()
  return configuredMode === PUBLIC_DEMO_READ_MODES.ENABLED
    ? PUBLIC_DEMO_READ_MODES.ENABLED
    : PUBLIC_DEMO_READ_MODES.DISABLED
}

function isPublicDemoReadEnabled(env = process.env) {
  return getPublicDemoReadMode(env) === PUBLIC_DEMO_READ_MODES.ENABLED
}

function isSafeReadRequest(req = {}) {
  return SAFE_READ_METHODS.has(String(req.method || '').trim().toUpperCase())
}

function isPublicDemoReadRequest(req = {}, env = process.env) {
  return isPublicDemoReadEnabled(env) && isSafeReadRequest(req)
}

module.exports = {
  PUBLIC_DEMO_READ_MODES,
  getPublicDemoReadMode,
  isProductionEnvironment,
  isPublicDemoReadEnabled,
  isPublicDemoReadRequest,
  isSafeReadRequest
}
