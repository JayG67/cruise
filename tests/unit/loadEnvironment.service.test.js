describe('loadEnvironment', () => {
  const { loadEnvironment } = require('../../config/loadEnvironment')

  it('loads dotenv configuration when the package is available', () => {
    const loadModule = jest.fn(() => ({}))

    expect(loadEnvironment(loadModule)).toEqual({ dotenvLoaded: true })
    expect(loadModule).toHaveBeenCalledWith('dotenv/config')
  })

  it('allows startup when dotenv configuration is not installed', () => {
    const loadModule = jest.fn(() => {
      const error = new Error("Cannot find module 'dotenv/config'")
      error.code = 'MODULE_NOT_FOUND'
      throw error
    })

    expect(loadEnvironment(loadModule)).toEqual({ dotenvLoaded: false })
  })

  it('rethrows dotenv initialization errors that are not missing-module errors', () => {
    const loadModule = jest.fn(() => {
      throw new Error('dotenv parse failure')
    })

    expect(() => loadEnvironment(loadModule)).toThrow('dotenv parse failure')
  })
})
