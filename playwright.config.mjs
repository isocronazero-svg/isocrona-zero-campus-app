import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results/browser',
  use: { browserName: 'chromium', headless: true, trace: 'off', screenshot: 'only-on-failure' }
});
