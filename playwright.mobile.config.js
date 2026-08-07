const { defineConfig, devices } = require('@playwright/test')

// Mobile coverage intentionally uses one Chromium phone and one WebKit phone.
// Tablet layout coverage already lives in playwright.responsive.config.js, so
// repeating the full mobile suite on iPad added runtime without unique coverage.
const mobileProjects = [
  {
    name: 'Mobile Chrome - Pixel 7',
    use: {
      ...devices['Pixel 7']
    }
  },
  {
    name: 'Mobile Safari - iPhone 13',
    use: {
      ...devices['iPhone 13']
    }
  }
]

module.exports = defineConfig({
  testDir: './playwright/mobile',
  timeout: 45_000,
  expect: {
    timeout: 5_000
  },
  // Tests remain serial inside each browser project. CI also serializes the
  // browser projects because they share one database-backed application server;
  // local development retains two workers for faster feedback.
  fullyParallel: false,
  workers: process.env.CI ? 1 : 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/mobile', open: 'never' }],
    ['json', { outputFile: 'playwright-report/mobile-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: mobileProjects
})
