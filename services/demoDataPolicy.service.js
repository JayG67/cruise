const DEMO_DATA_MODES = Object.freeze({
  ENABLED: 'enabled',
  DISABLED: 'disabled'
})

function isProductionEnvironment() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production'
}

function getDemoDataMode() {
  if (isProductionEnvironment()) return DEMO_DATA_MODES.DISABLED

  const configuredMode = String(process.env.CRUISE_DEMO_DATA_MODE || '').trim().toLowerCase()
  if (configuredMode === DEMO_DATA_MODES.DISABLED) return DEMO_DATA_MODES.DISABLED

  return DEMO_DATA_MODES.ENABLED
}

function isDemoDataEnabled() {
  return getDemoDataMode() === DEMO_DATA_MODES.ENABLED
}

function shouldLoadDemoDataOnStartup() {
  return isDemoDataEnabled()
}

function canExposeSeedDataOverHttp() {
  return isDemoDataEnabled()
}

function canResetDemoData() {
  return isDemoDataEnabled()
}

module.exports = {
  DEMO_DATA_MODES,
  canExposeSeedDataOverHttp,
  canResetDemoData,
  getDemoDataMode,
  isDemoDataEnabled,
  isProductionEnvironment,
  shouldLoadDemoDataOnStartup
}
