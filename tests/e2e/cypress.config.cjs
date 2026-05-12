const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    // Set to false only if you have NO custom commands/global hooks
    supportFile: false,
    specPattern: 'tests/e2e/cypress/e2e/**/*.cy.js',
  },
})
