import { defineConfig, devices } from '@playwright/test'

// BASE_URL points the suite at a deployed site; without it the suite builds and previews locally.
const baseURL = process.env.BASE_URL ?? 'http://localhost:4173'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // On CI a stray `test.only` must fail the run, a flaky test gets one more try, and the runner has two cores.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'pnpm build && pnpm preview --port 4173 --strictPort',
        url: baseURL,
        reuseExistingServer: true,
      },
})
