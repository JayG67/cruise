const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './playwright/responsive',
  timeout: 45_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/responsive', open: 'never' }],
    ['json', { outputFile: 'playwright-report/responsive-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'Desktop Chrome - 1440px',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 }
      }
    },
    {
      name: 'Desktop Safari - 1280px',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 900 }
      }
    },
    {
      name: 'Tablet Chrome - 900px',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 900, height: 1100 }
      }
    }
  ]
})
