import { defineConfig, devices } from "@playwright/test";

/**
 * Prerequisite for full browser tests: legacy BodyBank Express on port 3000
 * (same DB the app uses). This config starts Next on 3001 with API rewrites to 3000.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- -p 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      ...process.env,
      LEGACY_ORIGIN: "http://127.0.0.1:3000",
    },
  },
});
