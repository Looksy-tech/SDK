"use strict";

// Synthetic checks for the widget-URL resolution and button text. The main
// replay suite always forces data-widget-url to the mock widget, so the
// production branch in script.js (en. / ru. / default host + EN/RU button text)
// is never exercised there. These tests render the SDK WITHOUT data-widget-url,
// stub the three production hosts so nothing hits the network, and assert which
// host the iframe points at and what the button says.

const fs = require("fs");
const { test, expect } = require("@playwright/test");
const {
  LOCAL_ORIGIN,
  MOCK_WIDGET_PATH,
  SDK_SCRIPT_PATH,
} = require("../config");

const PRODUCT_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const WIDGET_HOSTS = [
  "widget.looksy.tech",
  "en.widget.looksy.tech",
  "ru.widget.looksy.tech",
  "leadsalarm.ru",
];

const RU_BUTTON_TEXT = "Примерить на себе";
const EN_BUTTON_TEXT = "Try on";

const FIXTURE_PATH = "/widget-url-fixture.html";

function createProductFixtureHtml({ token, lang }) {
  const langAttr = lang ? ` data-lang="${lang}"` : "";
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Widget URL resolution</title>
</head>
<body>
  <article data-fitting-product data-fitting-name="Test product" data-fitting-price="1 000 ₽">
    <img src="${PRODUCT_IMAGE}" alt="Test product" data-fitting-image>
  </article>
  <script src="${LOCAL_ORIGIN}/script/script.js" data-shop-token="${token}"${langAttr}></script>
</body>
</html>`;
}

// Renders the SDK with the given token/lang, opens the widget and returns the
// iframe src + button text so each case can assert on them.
async function openWidget(page, { token, lang, widgetDebug = false }) {
  const sdkScript = fs.readFileSync(SDK_SCRIPT_PATH, "utf8");
  const mockWidget = fs.readFileSync(MOCK_WIDGET_PATH, "utf8");
  const fixtureHtml = createProductFixtureHtml({ token, lang });
  const configRequests = [];

  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());

    if (url.origin === LOCAL_ORIGIN && url.pathname === "/script/script.js") {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript; charset=utf-8",
        body: sdkScript,
      });
      return;
    }

    if (url.origin === LOCAL_ORIGIN && url.pathname === FIXTURE_PATH) {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: fixtureHtml,
      });
      return;
    }

    // Stub the real production widget hosts: config requests 404 (SDK falls back
    // to its default shopConfig), everything else serves the mock widget body so
    // the iframe loads offline.
    if (WIDGET_HOSTS.includes(url.hostname)) {
      if (url.pathname.startsWith("/api/widget/config")) {
        configRequests.push(url.href);
        await route.fulfill({
          status: 404,
          contentType: "application/json; charset=utf-8",
          body: "{}",
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: mockWidget,
      });
      return;
    }

    await route.abort();
  });

  const debugQuery = widgetDebug ? "?widget_debug=true" : "";
  await page.goto(`${LOCAL_ORIGIN}${FIXTURE_PATH}${debugQuery}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => window.VirtualFitting && typeof window.VirtualFitting.init === "function",
  );

  const button = page.locator(".virtual-fitting-button");
  await expect(button).toHaveCount(1);
  const buttonText = (await button.textContent()).trim();

  await button.click();
  const iframe = page.locator("#virtual-fitting-iframe");
  await expect(iframe).toBeVisible({ timeout: 10000 });
  const src = await iframe.getAttribute("src");

  return { src, buttonText, origin: new URL(src).origin, configRequests };
}

const CASES = [
  {
    title: "default token + no lang -> default widget host, RU button",
    token: "shop_default_123",
    lang: "",
    expectedOrigin: "https://widget.looksy.tech",
    expectedText: RU_BUTTON_TEXT,
  },
  {
    title: "ru_ token + no lang -> ru widget host, RU button",
    token: "ru_shop_123",
    lang: "",
    expectedOrigin: "https://ru.widget.looksy.tech",
    expectedText: RU_BUTTON_TEXT,
  },
  {
    title: "data-lang=en -> en widget host, EN button",
    token: "shop_default_123",
    lang: "en",
    expectedOrigin: "https://en.widget.looksy.tech",
    expectedText: EN_BUTTON_TEXT,
  },
  {
    title: "data-lang=en wins over ru_ token -> en widget host, EN button",
    token: "ru_shop_123",
    lang: "en",
    expectedOrigin: "https://en.widget.looksy.tech",
    expectedText: EN_BUTTON_TEXT,
  },
  {
    title: "Glenfield RU token + widget_debug=true -> Leadsalarm widget host",
    token: "ru_a5428add-7a7c-41ef-b385-1018c5dd6939",
    lang: "",
    widgetDebug: true,
    expectedOrigin: "https://leadsalarm.ru",
    expectedText: RU_BUTTON_TEXT,
    expectedConfigOrigin: "https://ru.widget.looksy.tech",
  },
];

for (const testCase of CASES) {
  test(`@regression widget URL resolution: ${testCase.title}`, async ({ page }) => {
    const { origin, buttonText, configRequests } = await openWidget(page, {
      token: testCase.token,
      lang: testCase.lang,
      widgetDebug: testCase.widgetDebug,
    });

    expect(origin, "iframe widget host").toBe(testCase.expectedOrigin);
    expect(buttonText, "button text").toContain(testCase.expectedText);
    if (testCase.expectedConfigOrigin) {
      expect(new URL(configRequests[0]).origin, "shop config API host").toBe(
        testCase.expectedConfigOrigin,
      );
    }
  });
}
