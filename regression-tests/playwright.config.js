"use strict";

const path = require("path");
const { defineConfig, devices } = require("@playwright/test");

// How many test units Playwright may run at the same time.
// Replay is offline (HAR-backed) and CPU-bound, so this can be fairly high.
// Lower it (e.g. to 2-3) only if `regression:capture` gets rate-limited by the
// real client sites, since capture shares this worker count.
const PARALLEL_STORE_WORKERS = 6;

module.exports = defineConfig({
  testDir: path.join(__dirname, "tests"),
  timeout: 120000,
  expect: {
    timeout: 7000,
  },
  fullyParallel: true,
  workers: PARALLEL_STORE_WORKERS,
  reporter: [["list"], ["html", { outputFolder: path.join(__dirname, "playwright-report"), open: "never" }]],
  snapshotPathTemplate: path.join(__dirname, "baselines", "{arg}{ext}"),
  use: {
    ...devices["Desktop Chrome"],
    actionTimeout: 8000,
    navigationTimeout: 60000,
    ignoreHTTPSErrors: true,
    screenshot: "off",
    video: "off",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "capture",
      grep: /@capture/,
    },
    {
      name: "regression",
      grep: /@regression/,
    },
  ],
  outputDir: path.join(__dirname, "test-results"),
});
