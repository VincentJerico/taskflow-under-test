import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Playwright starts the app itself (webServer) against e2e.db, a SQLite file kept between
 * runs, then runs browser journeys against it. Tests register unique users, so the leftover data is
 * harmless.
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
    // Auth rate limit off: every test signs up from the same IP. The limit is covered by
    // tests/api/rate-limit.test.js, and the UI's 429 message by a mocked response in ux.spec.js.
    command: 'DATABASE_PATH=e2e.db AUTH_RATE_LIMIT=0 npm start',
    url: 'http://localhost:3000/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
