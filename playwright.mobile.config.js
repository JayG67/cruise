const { defineConfig, devices } = require('@playwright/test')

const localMobileProjects = [
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
  },
  {
    name: 'Tablet Safari - iPad Mini',
    use: {
      ...devices['iPad Mini']
    }
  }
]

const ciMobileProjects = [
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
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
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
  projects: process.env.CI ? ciMobileProjects : localMobileProjects
})
