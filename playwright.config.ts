import { defineConfig, devices } from "@playwright/test";
const port = Number(process.env.TEST_PORT || 3100);
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:" + port, trace: "retain-on-failure" },
  webServer: {
    command: "npm run start -- --port " + port,
    url: "http://127.0.0.1:" + port,
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: "desktop",
      grep: /@shared|@desktop/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile",
      grep: /@shared|@mobile/,
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "webkit",
      grep: /@shared/,
      use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "firefox",
      grep: /@shared/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "edge",
      grep: /@shared/,
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
  ],
});
