"use strict";

const { test } = require("@playwright/test");
const {
  captureSourcePage,
  getViewports,
  loadPages,
  readFixture,
  runReplay,
} = require("../scripts/harness");

const pages = loadPages();

for (const pageConfig of pages) {
  const viewports = getViewports(pageConfig);

  // Capture hits the real client site, so it runs once per page (recording the
  // HAR + HTML) and then builds the baseline for every viewport in one go.
  test(`@capture capture ${pageConfig.name}`, async ({ browser, page }, testInfo) => {
    const fixture = await captureSourcePage(browser, pageConfig);

    for (const viewport of viewports) {
      await test.step(`baseline ${viewport.name}`, async () => {
        await runReplay(page, pageConfig, testInfo, viewport.name, fixture);
      });
    }
  });

  // Replay is fully offline, so each viewport is an independent test that
  // Playwright can spread across workers.
  const existingFixture = readFixture(pageConfig.name);
  for (const viewport of viewports) {
    if (!existingFixture) {
      test(`@regression replay ${pageConfig.name} [${viewport.name}]`, async () => {
        test.skip(true, `Missing fixture for "${pageConfig.name}". Run npm run regression:capture first.`);
      });
      continue;
    }

    test(`@regression replay ${pageConfig.name} [${viewport.name}]`, async ({ page }, testInfo) => {
      await runReplay(page, pageConfig, testInfo, viewport.name, existingFixture);
    });
  }
}
