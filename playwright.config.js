import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4173/terraforming-mars-score/',
    locale: 'en-US',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: '"' + process.execPath + '" scripts/serve.js',
    url: 'http://127.0.0.1:4173/terraforming-mars-score/',
    reuseExistingServer: !process.env.CI,
  },
});
