"use strict";

const fs = require("fs");
const path = require("path");
const { expect, devices } = require("@playwright/test");
const {
  BASELINES_DIR,
  BUTTON_BOX_TOLERANCE_PX,
  FIXTURES_DIR,
  LATEST_DIR,
  LOCAL_ORIGIN,
  MOCK_WIDGET_PATH,
  PAGES_CONFIG_PATH,
  SDK_SCRIPT_PATH,
  VIEWPORTS,
} = require("../config");

const SERIOUS_CONSOLE_PATTERNS = [
  /\[Looksy\].*error/i,
  /Virtual Fitting.*error/i,
  /TypeError/i,
  /ReferenceError/i,
  /SyntaxError/i,
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function loadPages({ enabledOnly = true } = {}) {
  const config = readJson(PAGES_CONFIG_PATH);
  const pages = Array.isArray(config.pages) ? config.pages : [];
  return enabledOnly ? pages.filter((page) => page.enabled !== false) : pages;
}

function getViewports(pageConfig) {
  const names = Array.isArray(pageConfig.viewports) && pageConfig.viewports.length
    ? pageConfig.viewports
    : ["desktop"];

  return names.map((name) => {
    const viewport = VIEWPORTS[name];
    if (!viewport) {
      throw new Error(`Unknown viewport "${name}" for page "${pageConfig.name}"`);
    }
    return { name, size: viewport };
  });
}

function getClickButtons(pageConfig, meta) {
  if (Array.isArray(pageConfig.clickButtons)) return pageConfig.clickButtons;
  if (meta && Array.isArray(meta.clickButtons)) return meta.clickButtons;
  return [0];
}

function fixtureDir(pageName) {
  return path.join(FIXTURES_DIR, pageName);
}

function fixtureHtmlPath(pageName) {
  return path.join(fixtureDir(pageName), "page.html");
}

function fixtureMetaPath(pageName) {
  return path.join(fixtureDir(pageName), "meta.json");
}

function fixtureHarPath(pageName) {
  return path.join(fixtureDir(pageName), "har", "network.har");
}

// Replay strips all page scripts and serves its own HTML, so only layout assets
// matter offline. Drop everything else (JS/JSON/HTML) from the recorded HAR and
// delete the orphaned resource files to keep the committed fixture small.
const HAR_ASSET_MIME = /^(?:image\/|font\/|application\/font|application\/vnd\.ms-fontobject)|^text\/css/i;
const HAR_ASSET_EXT = /\.(?:css|woff2?|ttf|otf|eot|png|jpe?g|gif|webp|avif|svg|ico)(?:\?|$)/i;

function pruneHarToAssets(harPath) {
  if (!fs.existsSync(harPath)) return;

  const harDir = path.dirname(harPath);
  const har = readJson(harPath);
  const entries = Array.isArray(har.log && har.log.entries) ? har.log.entries : [];

  const kept = entries.filter((entry) => {
    const mime = (entry.response && entry.response.content && entry.response.content.mimeType) || "";
    const url = (entry.request && entry.request.url) || "";
    let pathname = "";
    try {
      pathname = new URL(url).pathname;
    } catch (error) {
      pathname = "";
    }
    return HAR_ASSET_MIME.test(mime) || HAR_ASSET_EXT.test(pathname);
  });

  har.log.entries = kept;
  fs.writeFileSync(harPath, `${JSON.stringify(har)}\n`);

  const referenced = new Set();
  kept.forEach((entry) => {
    const file = entry.response && entry.response.content && entry.response.content._file;
    if (file) referenced.add(file);
  });

  fs.readdirSync(harDir).forEach((name) => {
    if (name === path.basename(harPath)) return;
    if (!referenced.has(name)) {
      fs.rmSync(path.join(harDir, name), { force: true });
    }
  });
}

function latestDir(pageName, viewportName) {
  return path.join(LATEST_DIR, pageName, viewportName);
}

function baselineDir(pageName, viewportName) {
  return path.join(BASELINES_DIR, pageName, viewportName);
}

function latestPath(pageName, viewportName, fileName) {
  return path.join(latestDir(pageName, viewportName), fileName);
}

function baselinePath(pageName, viewportName, fileName) {
  return path.join(baselineDir(pageName, viewportName), fileName);
}

function readFixture(pageName) {
  const htmlPath = fixtureHtmlPath(pageName);
  const metaPath = fixtureMetaPath(pageName);

  if (!fs.existsSync(htmlPath) || !fs.existsSync(metaPath)) {
    return null;
  }

  return {
    html: fs.readFileSync(htmlPath, "utf8"),
    meta: readJson(metaPath),
  };
}

function shouldUpdateBaselines(testInfo) {
  if (testInfo.project.name === "capture") return true;
  if (process.env.UPDATE_BASELINES === "1") return true;
  if (process.argv.includes("--update-snapshots")) return true;
  return testInfo.config.updateSnapshots === "all" || testInfo.config.updateSnapshots === "changed";
}

function normalizeScriptAttrs(attrs) {
  const normalized = {};

  Object.entries(attrs || {}).forEach(([name, value]) => {
    if (!name) return;
    if (value == null) return;
    normalized[name] = String(value);
  });

  return normalized;
}

function getReplayScriptAttrs(pageConfig, meta) {
  const originalAttrs = normalizeScriptAttrs(meta && meta.script && meta.script.attrs);
  const configAttrs = normalizeScriptAttrs(pageConfig.scriptAttrs);

  return {
    ...originalAttrs,
    ...configAttrs,
    "data-shop-token": configAttrs["data-shop-token"] || originalAttrs["data-shop-token"] || "regression-test-token",
    "data-widget-url": `${LOCAL_ORIGIN}/mock-widget.html`,
  };
}

function htmlAttr(name, value) {
  return `${name}="${String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`;
}

function createSdkScriptTag(pageConfig, meta) {
  const attrs = getReplayScriptAttrs(pageConfig, meta);
  const attrText = Object.entries(attrs)
    .map(([name, value]) => htmlAttr(name, value))
    .join(" ");

  return `<script src="${LOCAL_ORIGIN}/script/script.js" ${attrText}></script>`;
}

function stripAllScripts(html) {
  return html
    .replace(/<meta\b[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "");
}

function stripLooksyScripts(html) {
  return html
    .replace(/<meta\b[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, "")
    .replace(/<script\b[^>]*\b(?:data-shop-token|src=["'][^"']*(?:looksy|min-script\.js|\/script\.js))[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\b(?:data-shop-token|src=["'][^"']*(?:looksy|min-script\.js|\/script\.js))[^>]*\/>/gi, "");
}

function prepareReplayHtml(html, pageConfig, meta) {
  const scriptTag = createSdkScriptTag(pageConfig, meta);
  let replayHtml = pageConfig.preservePageScripts ? stripLooksyScripts(html) : stripAllScripts(html);

  if (/<\/body>/i.test(replayHtml)) {
    replayHtml = replayHtml.replace(/<\/body>/i, `${scriptTag}\n</body>`);
  } else {
    replayHtml += scriptTag;
  }

  return replayHtml;
}

async function extractLooksyScript(page) {
  return page.evaluate(() => {
    const scripts = Array.from(document.scripts);
    const looksyScript = scripts.find((script) => {
      const src = script.getAttribute("src") || "";
      return script.hasAttribute("data-shop-token")
        || /looksy/i.test(src)
        || /min-script\.js/i.test(src)
        || /\/script\.js(?:$|\?)/i.test(src);
    });

    if (!looksyScript) {
      return null;
    }

    const attrs = {};
    Array.from(looksyScript.attributes).forEach((attr) => {
      if (attr.name === "src" || attr.name.startsWith("data-")) {
        attrs[attr.name] = attr.value;
      }
    });

    const src = looksyScript.getAttribute("src") || "";
    delete attrs.src;

    return { src, attrs };
  });
}

async function waitForPageStable(page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function captureSourcePage(browser, pageConfig) {
  const firstViewport = getViewports(pageConfig)[0];
  const harPath = fixtureHarPath(pageConfig.name);

  // Re-record the HAR from scratch so stale assets from a previous capture do
  // not linger next to the new fixture.
  fs.rmSync(path.dirname(harPath), { recursive: true, force: true });
  ensureDir(path.dirname(harPath));

  // Dedicated context that records every third-party asset (HTML/CSS/img/font)
  // into a HAR. Replay later serves these from disk, so the test is frozen to
  // the client page exactly as it looked at capture time.
  const context = await browser.newContext({
    ...devices["Desktop Chrome"],
    viewport: firstViewport.size,
    ignoreHTTPSErrors: true,
    recordHar: { path: harPath, content: "attach", mode: "minimal" },
  });

  let result;
  try {
    const page = await context.newPage();

    // Keep the recorded HAR small: we never assert on heavy media or live
    // sockets, so drop them instead of freezing megabytes into the fixture.
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (type === "media" || type === "websocket" || type === "eventsource") {
        return route.abort();
      }
      return route.continue();
    });

    await page.goto(pageConfig.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await waitForPageStable(page);

    const script = await extractLooksyScript(page);
    const html = await page.content();
    const meta = {
      name: pageConfig.name,
      sourceUrl: pageConfig.url,
      capturedAt: new Date().toISOString(),
      script: script || { src: "", attrs: {} },
      viewports: getViewports(pageConfig).map((viewport) => viewport.name),
      clickButtons: getClickButtons(pageConfig),
      notes: pageConfig.notes || "",
    };

    ensureDir(fixtureDir(pageConfig.name));
    fs.writeFileSync(fixtureHtmlPath(pageConfig.name), html);
    writeJson(fixtureMetaPath(pageConfig.name), meta);

    result = { html, meta };
  } finally {
    // Closing the context flushes the recorded HAR to disk.
    await context.close();
  }

  // Pages that keep their own scripts during replay may need the recorded JS,
  // so only prune to layout assets for the default (scripts-stripped) replay.
  if (!pageConfig.preservePageScripts) {
    pruneHarToAssets(harPath);
  }

  return result;
}

async function installReplayRoutes(page, pageConfig, fixture) {
  const sdkScript = fs.readFileSync(SDK_SCRIPT_PATH, "utf8");
  const mockWidget = fs.readFileSync(MOCK_WIDGET_PATH, "utf8");
  const replayHtml = prepareReplayHtml(fixture.html, pageConfig, fixture.meta);

  // Serve every third-party asset (CSS/img/font/...) from the recorded HAR so
  // replay is fully offline and deterministic. Requests that were not recorded
  // are aborted instead of hitting the live network. Registered first so the
  // SDK/mock/fixture routes below (registered last) take precedence and only
  // fall through here for real client assets.
  const harPath = fixtureHarPath(pageConfig.name);
  const hasHar = fs.existsSync(harPath);
  if (hasHar) {
    await page.routeFromHAR(harPath, { url: "**/*", notFound: "abort" });
  }

  await page.route("**/*", async (route) => {
    const requestUrl = new URL(route.request().url());

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === "/script/script.js") {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript; charset=utf-8",
        body: sdkScript,
      });
      return;
    }

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname.startsWith("/mock-widget.html")) {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: mockWidget,
      });
      return;
    }

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === `/__fixtures__/${pageConfig.name}/page.html`) {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: replayHtml,
      });
      return;
    }

    // Hand the request to the HAR (offline) when we have one; otherwise let it
    // reach the network so a fixture captured before HAR support still replays.
    await route.fallback();
  });
}

function getFixtureReplayUrl(pageConfig, meta) {
  const source = new URL(meta.sourceUrl || pageConfig.url);
  return `${LOCAL_ORIGIN}/__fixtures__/${pageConfig.name}/page.html${source.search || ""}`;
}

async function waitForButtonsSettled(page) {
  await page.waitForFunction(() => window.VirtualFitting && typeof window.VirtualFitting.init === "function", null, {
    timeout: 20000,
  });

  // Wait until the rendered button count is stable across two consecutive polls
  // instead of sleeping a fixed amount. This is both faster on quick machines
  // and more reliable on slow ones.
  let previous = -1;
  await expect
    .poll(async () => {
      const count = await page.locator(".virtual-fitting-button").count();
      const settled = count > 0 && count === previous;
      previous = count;
      return settled;
    }, { timeout: 10000, intervals: [100, 150, 200, 300] })
    .toBe(true);
}

async function getVisibleButtons(page) {
  return page.locator(".virtual-fitting-button").evaluateAll((buttons) => {
    return buttons
      .map((button, index) => {
        const rect = button.getBoundingClientRect();
        const style = window.getComputedStyle(button);
        const visible = rect.width > 0
          && rect.height > 0
          && style.visibility !== "hidden"
          && style.display !== "none"
          && style.opacity !== "0";

        return {
          index,
          text: (button.textContent || "").replace(/\s+/g, " ").trim(),
          visible,
          box: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      })
      .filter((button) => button.visible);
  });
}

function compareButtonBoxes(actualButtons, expectedButtons, tolerancePx, checkPosition) {
  expect(actualButtons.length, "visible button count").toBe(expectedButtons.length);

  actualButtons.forEach((actual, index) => {
    const expected = expectedButtons[index];
    expect(actual.visible, `button ${index} should be visible`).toBe(true);
    expect(actual.text, `button ${index} text`).toBe(expected.text);

    if (checkPosition === false) return;

    ["x", "y", "width", "height"].forEach((key) => {
      const delta = Math.abs(actual.box[key] - expected.box[key]);
      expect(
        delta,
        `button ${index} ${key} moved by ${delta}px; allowed ${tolerancePx}px`,
      ).toBeLessThanOrEqual(tolerancePx);
    });
  });
}

function compareJsonStrict(actual, expected, label) {
  expect(actual, label).toEqual(expected);
}

function compareBoxWithTolerance(actualBox, expectedBox, label, tolerancePx) {
  ["x", "y", "width", "height"].forEach((key) => {
    const delta = Math.abs(actualBox[key] - expectedBox[key]);
    expect(delta, `${label} ${key} moved by ${delta}px; allowed ${tolerancePx}px`).toBeLessThanOrEqual(tolerancePx);
  });
}

function compareIframeSummaries(actualFrames, expectedFrames) {
  expect(actualFrames.length, "iframe summary count").toBe(expectedFrames.length);

  actualFrames.forEach((actual, index) => {
    const expected = expectedFrames[index];
    expect(actual.buttonIndex, `iframe ${index} buttonIndex`).toBe(expected.buttonIndex);
    expect(actual.visible, `iframe ${index} visible`).toBe(expected.visible);
    expect(actual.src, `iframe ${index} src`).toBe(expected.src);
  });
}

async function saveAndCompareJson({ pageName, viewportName, fileName, value, update, buttonBoxTolerancePx, checkButtonPosition }) {
  const latestFile = latestPath(pageName, viewportName, fileName);
  const baselineFile = baselinePath(pageName, viewportName, fileName);

  writeJson(latestFile, value);

  if (update) {
    writeJson(baselineFile, value);
    return;
  }

  if (!fs.existsSync(baselineFile)) {
    throw new Error(`Missing baseline ${baselineFile}. Run npm run regression:capture first.`);
  }

  const baseline = readJson(baselineFile);
  if (fileName === "buttons.json") {
    compareButtonBoxes(value, baseline, buttonBoxTolerancePx || BUTTON_BOX_TOLERANCE_PX, checkButtonPosition);
  } else if (fileName === "iframe.json") {
    compareIframeSummaries(value, baseline);
  } else {
    compareJsonStrict(value, baseline, fileName);
  }
}

async function saveAndCompareScreenshot({ page, pageName, viewportName, fileName, testInfo, update, locator }) {
  ensureDir(latestDir(pageName, viewportName));
  async function captureViewportScreenshot() {
    const cdp = await page.context().newCDPSession(page);
    try {
      const result = await cdp.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
        fromSurface: true,
      });
      return Buffer.from(result.data, "base64");
    } finally {
      await cdp.detach().catch(() => {});
    }
  }

  const screenshot = locator
    ? await locator.screenshot({ timeout: 15000, animations: "disabled" })
    : await captureViewportScreenshot();

  fs.writeFileSync(latestPath(pageName, viewportName, fileName), screenshot);

  if (update) {
    ensureDir(baselineDir(pageName, viewportName));
    fs.writeFileSync(baselinePath(pageName, viewportName, fileName), screenshot);
    return;
  }

  await expect(screenshot).toMatchSnapshot([pageName, viewportName, fileName], {
    maxDiffPixelRatio: 0.05,
  });
}

async function readProductPayloadFromIframe(page) {
  const iframeElement = await page.locator("#virtual-fitting-iframe").elementHandle();
  const frame = await iframeElement.contentFrame();
  if (!frame) return null;

  await frame.waitForFunction(() => document.body.dataset.product && document.body.dataset.product !== "null", null, {
    timeout: 10000,
  });

  return frame.evaluate(() => {
    const rawProduct = document.body.dataset.product || "null";
    const rawShopConfig = document.body.dataset.shopConfig || "null";
    return {
      product: JSON.parse(rawProduct),
      shopConfig: JSON.parse(rawShopConfig),
    };
  });
}

async function getIframeSummary(page) {
  return page.locator("#virtual-fitting-iframe").evaluate((iframe) => {
    const rect = iframe.getBoundingClientRect();
    return {
      src: iframe.getAttribute("src"),
      visible: rect.width > 0 && rect.height > 0,
      box: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    };
  });
}

async function assertNoDuplicateButtons(page, expectedCount) {
  await page.evaluate(() => {
    window.VirtualFitting.init();
    window.VirtualFitting.init();
  });

  // After repeated init the count must return to (and stay at) the original
  // number. Polling catches a transient re-render while still failing if real
  // duplicates persist.
  await expect
    .poll(() => page.locator(".virtual-fitting-button").count(), {
      timeout: 5000,
      intervals: [100, 150, 200, 300],
    }, "button count after repeated init")
    .toBe(expectedCount);
}

function installErrorCollectors(page) {
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (SERIOUS_CONSOLE_PATTERNS.some((pattern) => pattern.test(text))) {
      consoleErrors.push(text);
    }
  });

  return {
    assertClean() {
      expect(pageErrors, "uncaught page errors").toEqual([]);
      expect(consoleErrors, "serious console errors").toEqual([]);
    },
  };
}

async function runReplay(page, pageConfig, testInfo, viewportName, fixtureOverride) {
  const fixture = fixtureOverride || readFixture(pageConfig.name);
  if (!fixture) {
    throw new Error(`Missing fixture for "${pageConfig.name}". Run npm run regression:capture first.`);
  }

  const update = shouldUpdateBaselines(testInfo);
  const errors = installErrorCollectors(page);

  await page.setViewportSize(VIEWPORTS[viewportName]);
  await page.addInitScript(() => {
    const loadedFonts = {
      ready: Promise.resolve(),
      status: "loaded",
      check: () => true,
      load: () => Promise.resolve([]),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };

    try {
      Object.defineProperty(document, "fonts", {
        configurable: true,
        value: loadedFonts,
      });
    } catch (error) {
      // Some browsers may keep document.fonts read-only; route-level font stubbing still applies.
    }
  });
  await installReplayRoutes(page, pageConfig, fixture);
  await page.goto(getFixtureReplayUrl(pageConfig, fixture.meta), { waitUntil: "domcontentloaded", timeout: 60000 });

  // Assets come from the HAR (offline), so "load" settles quickly and gives a
  // stable layout for button coordinates. No networkidle / fixed sleeps needed.
  await page.waitForLoadState("load", { timeout: 15000 }).catch(() => {});

  // Freeze transitions/animations so screenshots and coordinates are stable.
  await page
    .addStyleTag({
      content:
        "*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}",
    })
    .catch(() => {});

  await waitForButtonsSettled(page);
  const buttons = await getVisibleButtons(page);
  await saveAndCompareJson({
    pageName: pageConfig.name,
    viewportName,
    fileName: "buttons.json",
    value: buttons,
    update,
    buttonBoxTolerancePx: pageConfig.buttonBoxTolerancePx,
    checkButtonPosition: pageConfig.checkButtonPosition,
  });
  await assertNoDuplicateButtons(page, buttons.length);

  await saveAndCompareScreenshot({
    page,
    pageName: pageConfig.name,
    viewportName,
    fileName: "02-buttons.png",
    testInfo,
    update,
  });

  const productPayloads = [];
  const iframeSummaries = [];
  const clickButtons = getClickButtons(pageConfig, fixture.meta);

  for (const buttonIndex of clickButtons) {
    const button = page.locator(".virtual-fitting-button").nth(buttonIndex);
    await expect(button, `button ${buttonIndex}`).toBeVisible({ timeout: 10000 });
    await button.click();

    const iframe = page.locator("#virtual-fitting-iframe");
    await expect(page.locator(".virtual-fitting-overlay")).toBeVisible({ timeout: 10000 });
    await expect(iframe).toBeVisible({ timeout: 10000 });
    await expect(iframe).toHaveAttribute("src", /mock-widget\.html/, { timeout: 10000 });

    // readProductPayloadFromIframe waits until the mock widget has received and
    // rendered PRODUCT_DATA, so the overlay is ready for a screenshot without a
    // fixed sleep. locator.screenshot({ animations: "disabled" }) additionally
    // waits for the element to stop moving.
    const payload = await readProductPayloadFromIframe(page);
    const iframeSummary = await getIframeSummary(page);
    productPayloads.push({ buttonIndex, ...payload });
    iframeSummaries.push({ buttonIndex, ...iframeSummary });

    await saveAndCompareScreenshot({
      page,
      pageName: pageConfig.name,
      viewportName,
      fileName: `03-widget-opened-button-${buttonIndex}.png`,
      testInfo,
      update,
      locator: page.locator(".virtual-fitting-overlay"),
    });

    await page.evaluate(() => window.VirtualFitting.close());
    await expect(page.locator(".virtual-fitting-overlay")).toBeHidden({ timeout: 5000 });
  }

  await saveAndCompareJson({
    pageName: pageConfig.name,
    viewportName,
    fileName: "iframe.json",
    value: iframeSummaries,
    update,
  });
  await saveAndCompareJson({
    pageName: pageConfig.name,
    viewportName,
    fileName: "product-payloads.json",
    value: productPayloads,
    update,
  });

  errors.assertClean();
}

module.exports = {
  captureSourcePage,
  ensureDir,
  fixtureHtmlPath,
  fixtureMetaPath,
  getViewports,
  loadPages,
  readFixture,
  runReplay,
  writeJson,
};
