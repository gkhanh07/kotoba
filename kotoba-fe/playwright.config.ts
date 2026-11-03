import { defineConfig } from "@playwright/test";

const BE_PORT = 4000;
const FE_PORT = 3000;

// Against the production build, as the Next.js Playwright guide recommends.
// kotoba-be gets its own throwaway database so E2E never touches dev.db.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  // e2e/sync-status.spec.ts restarts kotoba-be outside Playwright's control; this stops whatever still listens.
  globalTeardown: "./e2e/backend.ts",
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${FE_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true } },
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } },
  ],
  webServer: [
    {
      command: "rm -f e2e.db e2e.db-journal && npm run start",
      cwd: "../kotoba-be",
      env: { DATABASE_URL: "file:./e2e.db", PORT: String(BE_PORT) },
      url: `http://127.0.0.1:${BE_PORT}/content/kana`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      // The fetch cache outlives builds and would serve content from the previous run for an hour (BUG-005).
      command: `rm -rf .next/cache/fetch-cache && npm run build && npm run start -- -p ${FE_PORT}`,
      url: `http://localhost:${FE_PORT}`,
      env: { API_URL: `http://127.0.0.1:${BE_PORT}` },
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});
