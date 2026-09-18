import { defineConfig } from 'vitest/config';

// Keep Vitest to unit + API tests only. E2E specs (tests/e2e/*.spec.js) are run by Playwright.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
