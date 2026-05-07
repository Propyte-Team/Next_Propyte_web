import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for propyte.com e2e + smoke tests.
 *
 * Default invocation:
 *   npm run test:e2e          → runs the full suite headlessly
 *   npm run test:e2e:smoke    → runs only the smoke tag (fast, ~1 min)
 *   npm run test:e2e:ui       → opens the Playwright UI runner
 *
 * Targets the local dev server on :3000 by default; override with
 * PLAYWRIGHT_BASE_URL=https://dev.propyte.com to run against staging.
 */
export default defineConfig({
  testDir: './tests/e2e',
  // Each spec gets up to 30s; large pages on cold cache need a buffer.
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // Fail the build on .only() in CI; never on local.
  forbidOnly: !!process.env.CI,
  // Retry only in CI — local failures should surface immediately.
  retries: process.env.CI ? 2 : 0,
  // Single worker locally for predictable interleaving with the dev server.
  workers: process.env.CI ? 4 : 1,

  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['list']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'es-MX',
    timezoneId: 'America/Cancun',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      // Mobile coverage is lighter — only the mobile-tagged specs.
      grep: /@mobile/,
    },
  ],

  // Spin up `next dev` automatically when no PLAYWRIGHT_BASE_URL was set.
  // Skipped on CI when running against a deployed URL.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
