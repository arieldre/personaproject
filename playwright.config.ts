import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',
  globalSetup: './e2e/global-setup',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    storageState: 'e2e/auth.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
