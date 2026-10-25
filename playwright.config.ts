import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "https://localhost:4401",
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Match production: its security policy upgrades asset requests to HTTPS.
    command: "npm run preview:worker -- --port 4401 --local-protocol https",
    url: "https://localhost:4401",
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
  },
});
