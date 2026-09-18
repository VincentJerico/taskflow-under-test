import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Playwright starts the app itself (webServer) against a throwaway SQLite file, then runs
 * browser journeys against it. Tests register unique users, so a persistent DB file is harmless.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: 'DATABASE_PATH=e2e.db npm start',
    url: 'http://localhost:3000/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
