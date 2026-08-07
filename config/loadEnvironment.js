'use strict'

/**
 * Loads local environment-file support when the optional dotenv package is
 * available. Production platforms inject environment variables directly, so
 * absence of dotenv must not prevent the application or operational tooling
 * from starting.
 *
 * A module loader can be injected for deterministic unit testing without
 * mutating Node's global module loader.
 */
function loadEnvironment(loadModule = require) {
  try {
    loadModule('dotenv/config')
    return { dotenvLoaded: true }
  } catch (error) {
    const isMissingDotenv =
      error?.code === 'MODULE_NOT_FOUND' &&
      String(error?.message || '').includes("'dotenv/config'")

    if (!isMissingDotenv) {
      throw error
    }

    return { dotenvLoaded: false }
  }
}

module.exports = { loadEnvironment }
