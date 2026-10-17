import { defineConfig, devices } from '@playwright/test'

// BASE_URL points the suite at a deployed site; without it the suite builds and previews locally.
const baseURL = process.env.BASE_URL ?? 'http://localhost:4173'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // On CI nothing hides a weak test: a stray `test.only` fails the run, there are no retries, and a test that
  // passes only on a second try would fail anyway. The runner has two cores.
  forbidOnly: !!process.env.CI,
  failOnFlakyTests: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['html', { open: 'never' }]],
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        // PREBUILT: CI serves the exact `dist` the pipeline built and will publish, instead of building a second one.
        command: `${process.env.PREBUILT ? '' : 'pnpm build && '}pnpm preview --port 4173 --strictPort`,
        url: baseURL,
        // Never test whatever already listens on the port: a leftover server could be an older build.
        reuseExistingServer: false,
      },
})
