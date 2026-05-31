const { defineConfig } = require('cypress')

module.exports = defineConfig({
  allowCypressEnv: false,
  e2e: {
    baseUrl: 'http://localhost:8000',
    specPattern: [
      'cypress/e2e/**/*.cy.js',
      'cypress/react/**/*.cy.js'
    ],
    supportFile: false
  }
})
