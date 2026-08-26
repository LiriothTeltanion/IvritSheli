import { defineConfig, devices } from '@playwright/test';

const port = 4177;
const runtimeProcess = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process;
const externalBaseURL = runtimeProcess?.env?.PLAYWRIGHT_BASE_URL?.trim();
const baseURL = externalBaseURL || `http://127.0.0.1:${port}`;
const isCI = Boolean(runtimeProcess?.env?.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Concurrent viewport projects can mount up to 2,160 semantic SVGs during
  // the full-catalog case and starve unrelated checks on the Windows reference
  // machine. Keep CI at its proven two-worker ceiling and serialize locally so
  // the same complete matrix is repeatable under desktop memory pressure.
  workers: isCI ? 2 : 1,
  reporter: isCI
    ? [['line'], ['html', { open: 'never', outputFolder: '../tmp/playwright-report' }]]
    : 'list',
  outputDir: '../tmp/playwright-results',
  use: {
    baseURL,
    browserName: 'chromium',
    colorScheme: 'light',
    locale: 'en-US',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-390',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'tablet-768',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'desktop-1440',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        // Exercise the optimized artifact Kevin will actually inspect and ship.
        // The HMR server progressively slows while the full visual matrix mounts
        // thousands of SVGs; preview keeps the same browser coverage deterministic.
        command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
        url: `http://127.0.0.1:${port}`,
        // Never accept a stale process on the gate port as evidence for this tree.
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
