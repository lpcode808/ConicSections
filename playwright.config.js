const { defineConfig, devices } = require('@playwright/test');

// Override when something else occupies the default port locally.
const PORT = Number(process.env.CONIC_TEST_PORT || 4173);

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 8_000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] }
    }
  ],
  webServer: {
    command: `node scripts/dev-server.mjs --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 20_000
  }
});
