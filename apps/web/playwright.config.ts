import { defineConfig } from "@playwright/test";

/**
 * E2E config for the Início mobile overflow checks (Web 14). Runs with
 * `pnpm test:e2e`; the specs live in `e2e/` and are excluded from vitest.
 * The web server is a local `next dev`; the specs mock every backend call at
 * the browser (page.route) and set the session cookie directly, so no real
 * backend is needed. CI must run `npx playwright install chromium` first.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  reporter: "list",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "next dev --port 3000",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
