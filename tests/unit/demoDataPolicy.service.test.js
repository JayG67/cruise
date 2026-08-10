const {
  DEMO_DATA_MODES,
  canExposeSeedDataOverHttp,
  canResetDemoData,
  getDemoDataMode,
  isDemoDataEnabled,
  isProductionEnvironment,
  shouldLoadDemoDataOnStartup
} = require('../../services/demoDataPolicy.service')

describe('demo data production-isolation policy', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalMode = process.env.CRUISE_DEMO_DATA_MODE

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = originalNodeEnv

    if (originalMode === undefined) delete process.env.CRUISE_DEMO_DATA_MODE
    else process.env.CRUISE_DEMO_DATA_MODE = originalMode
  })

  it('forces demo data off in production even when configuration asks to enable it', () => {
    process.env.NODE_ENV = 'production'
    process.env.CRUISE_DEMO_DATA_MODE = 'enabled'

    expect(isProductionEnvironment()).toBe(true)
    expect(getDemoDataMode()).toBe(DEMO_DATA_MODES.DISABLED)
    expect(isDemoDataEnabled()).toBe(false)
    expect(shouldLoadDemoDataOnStartup()).toBe(false)
    expect(canExposeSeedDataOverHttp()).toBe(false)
    expect(canResetDemoData()).toBe(false)
  })

  it('keeps deterministic demo data enabled by default outside production', () => {
    process.env.NODE_ENV = 'test'
    delete process.env.CRUISE_DEMO_DATA_MODE

    expect(isProductionEnvironment()).toBe(false)
    expect(getDemoDataMode()).toBe(DEMO_DATA_MODES.ENABLED)
    expect(shouldLoadDemoDataOnStartup()).toBe(true)
    expect(canExposeSeedDataOverHttp()).toBe(true)
    expect(canResetDemoData()).toBe(true)
  })

  it('allows developers and CI to explicitly disable demo data outside production', () => {
    process.env.NODE_ENV = 'development'
    process.env.CRUISE_DEMO_DATA_MODE = 'disabled'

    expect(getDemoDataMode()).toBe(DEMO_DATA_MODES.DISABLED)
    expect(shouldLoadDemoDataOnStartup()).toBe(false)
    expect(canExposeSeedDataOverHttp()).toBe(false)
    expect(canResetDemoData()).toBe(false)
  })
})
