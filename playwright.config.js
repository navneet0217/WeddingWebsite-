import { defineConfig } from '@playwright/test'
import { browserChannel } from './scripts/viewports.mjs'

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  timeout: 90000,
  expect: { timeout: 10000 },
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  updateSnapshots: 'none',
  snapshotPathTemplate: '{testDir}/../../inspection/screenshots/baselines/{arg}{ext}',
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  projects: [
    { name: 'app', testIgnore: '**/visual.spec.js' },
    { name: 'reference', testMatch: '**/visual.spec.js' },
  ],
  use: {
    browserName: 'chromium',
    channel: browserChannel,
    baseURL: 'http://127.0.0.1:5173',
    timezoneId: 'Asia/Kolkata',
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
})
