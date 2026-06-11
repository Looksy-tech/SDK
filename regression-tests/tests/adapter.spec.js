"use strict";

const fs = require("fs");
const { test, expect } = require("@playwright/test");
const {
  LOCAL_ORIGIN,
  MOCK_WIDGET_PATH,
  SDK_SCRIPT_PATH,
} = require("../config");

const PRODUCT_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const MULTI_PRODUCTS = [
  {
    id: "looksy-multi-hoodie",
    name: "Centralized Hoodie",
    price: "4 990 ₽",
    image: `${LOCAL_ORIGIN}/assets/hoodie.png`,
  },
  {
    id: "looksy-multi-dress",
    name: "Centralized Dress",
    price: "8 500 ₽",
    image: `${LOCAL_ORIGIN}/assets/dress.png`,
  },
  {
    id: "looksy-multi-shirt",
    name: "Centralized Shirt",
    price: "2 100 ₽",
    image: `${LOCAL_ORIGIN}/assets/shirt.png`,
  },
];

const PNG_1X1 =
  Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64");

function createBitrixFixtureHtml({ adapterName = "" } = {}) {
  const productData = {
    id: 501,
    offers: {
      101: {
        id: 101,
        available: true,
        values: { SIZE: "s", COLOR: "black" },
        prices: [{ base: { value: 1200, display: "1 200 ₽" } }],
      },
      102: {
        id: 102,
        available: true,
        values: { SIZE: "m", COLOR: "black" },
        prices: [{ discount: { use: true, value: 990, display: "990 ₽" } }],
      },
    },
  };

  const properties = [
    {
      code: "SIZE",
      name: "Размер",
      type: "list",
      values: {
        s: { id: "s", name: "S" },
        m: { id: "m", name: "M" },
      },
    },
    {
      code: "COLOR",
      name: "Цвет",
      type: "list",
      values: {
        black: { id: "black", name: "Чёрный" },
      },
    },
  ];

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Bitrix adapter regression</title>
</head>
<body>
  <main>
    <div
      class="c-catalog-element"
      data-data='${JSON.stringify(productData)}'
      data-properties='${JSON.stringify(properties)}'
    >
      <article data-fitting-product data-fitting-name="Bitrix adapter dress" data-fitting-price="990 ₽">
        <img src="${PRODUCT_IMAGE}" alt="Bitrix adapter dress" data-fitting-image>
      </article>
    </div>
  </main>
  <script
    src="${LOCAL_ORIGIN}/script/script.js"
    data-shop-token="adapter-test-token"
    data-widget-url="${LOCAL_ORIGIN}/mock-widget.html"
    ${adapterName ? `data-adapter="${adapterName}"` : ""}
  ></script>
</body>
</html>`;
}

function createMultiProductFixtureHtml() {
  const cards = MULTI_PRODUCTS.map((product) => `
      <article
        class="product-card"
        data-fitting-product
        data-fitting-id="${product.id}"
        data-fitting-name="${product.name}"
        data-fitting-price="${product.price}"
      >
        <img src="${product.image}" alt="${product.name}" data-fitting-image>
        <h2>${product.name}</h2>
        <p>${product.price}</p>
      </article>`).join("\n");

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Centralized multi-product regression</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; }
    main { display: grid; grid-template-columns: repeat(3, 220px); gap: 24px; align-items: start; }
    .product-card { position: relative; border: 1px solid #d7dce2; padding: 12px; min-height: 260px; }
    .product-card img { width: 180px; height: 180px; display: block; object-fit: cover; background: #f5f5f5; }
  </style>
</head>
<body>
  <main>${cards}</main>
  <script
    src="${LOCAL_ORIGIN}/script/script.js"
    data-shop-token="multi-product-test-token"
    data-widget-url="${LOCAL_ORIGIN}/mock-widget.html"
  ></script>
</body>
</html>`;
}

function createSlotPriorityFixtureHtml({ includeSlot = true, lang = "" } = {}) {
  return `<!doctype html>
<html lang="${lang || "ru"}">
<head>
  <meta charset="utf-8">
  <title>Slot priority regression</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; }
    .product-card { position: relative; width: 320px; border: 1px solid #d7dce2; padding: 12px; }
    .product-card img { width: 180px; height: 180px; display: block; object-fit: cover; background: #f5f5f5; }
    [data-fitting-button-slot] { margin-top: 12px; min-height: 48px; }
    [data-testid="image-wrap"] { width: 180px; }
  </style>
</head>
<body>
  <main>
    <article
      class="product-card"
      data-fitting-product
      data-fitting-id="looksy-slot-hoodie"
      data-fitting-name="Slot priority hoodie"
      data-fitting-price="4 990 ₽"
    >
      <div class="image-wrap" data-testid="image-wrap">
        <img src="${PRODUCT_IMAGE}" alt="Slot priority hoodie" data-fitting-image>
      </div>
      <button class="buy-button" type="button">Buy</button>
      ${includeSlot ? '<div data-fitting-button-slot data-fitting-full-width="true" data-testid="slot"></div>' : ""}
    </article>
  </main>
  <script
    src="${LOCAL_ORIGIN}/script/script.js"
    data-shop-token="slot-priority-test-token"
    ${lang ? `data-lang="${lang}"` : ""}
    data-widget-url="${LOCAL_ORIGIN}/mock-widget.html"
  ></script>
</body>
</html>`;
}

async function installAdapterRoutes(page) {
  const sdkScript = fs.readFileSync(SDK_SCRIPT_PATH, "utf8");
  const mockWidget = fs.readFileSync(MOCK_WIDGET_PATH, "utf8");

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

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === "/api/widget/config") {
      await route.fulfill({
        status: 404,
        contentType: "application/json; charset=utf-8",
        body: "{}",
      });
      return;
    }

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname.startsWith("/assets/")) {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: PNG_1X1,
      });
      return;
    }

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === "/adapter/bitrix-v1.html") {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: createBitrixFixtureHtml({ adapterName: "bitrix_popnshop_v1" }),
      });
      return;
    }

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === "/adapter/popnshop-debug.html") {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: createBitrixFixtureHtml(),
      });
      return;
    }

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === "/adapter/no-adapter.html") {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: createBitrixFixtureHtml(),
      });
      return;
    }

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === "/adapter/multi-product.html") {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: createMultiProductFixtureHtml(),
      });
      return;
    }

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === "/adapter/slot-priority.html") {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: createSlotPriorityFixtureHtml({ includeSlot: true }),
      });
      return;
    }

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === "/adapter/slot-priority-en.html") {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: createSlotPriorityFixtureHtml({ includeSlot: true, lang: "en" }),
      });
      return;
    }

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === "/adapter/slot-priority-no-slot.html") {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: createSlotPriorityFixtureHtml({ includeSlot: false }),
      });
      return;
    }

    await route.continue();
  });
}

async function openFixtureAndReadProduct(page, pathAndSearch) {
  await page.goto(`${LOCAL_ORIGIN}${pathAndSearch}`, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForFunction(() => window.VirtualFitting && typeof window.VirtualFitting.init === "function");
  await expect(page.locator(".virtual-fitting-button")).toHaveCount(1);
  await page.locator(".virtual-fitting-button").click();

  const iframeElement = await page.locator("#virtual-fitting-iframe").elementHandle();
  const frame = await iframeElement.contentFrame();
  await frame.waitForFunction(() => document.body.dataset.product && document.body.dataset.product !== "null");

  const product = await frame.evaluate(() => JSON.parse(document.body.dataset.product));

  return product;
}

function expectBitrixExtendedProductData(product) {
  expect(product.extendedProductData).toMatchObject({
    product_id: "501",
    selected: { SIZE: "m", COLOR: "black" },
  });
  expect(product.extendedProductData.variants).toHaveLength(2);
  expect(product.extendedProductData.offers).toEqual([
    {
      id: "101",
      values: { SIZE: "s", COLOR: "black" },
      available: true,
      price: { value: 1200, display: "1 200 ₽" },
    },
    {
      id: "102",
      values: { SIZE: "m", COLOR: "black" },
      available: true,
      price: { value: 990, display: "990 ₽" },
    },
  ]);
}

test("@regression bitrix_popnshop_v1 adapter sends extendedProductData", async ({ page }) => {
  await installAdapterRoutes(page);
  const product = await openFixtureAndReadProduct(page, "/adapter/bitrix-v1.html?offer=102");

  expectBitrixExtendedProductData(product);
});

test("@regression popnshop_debug=true sends extendedProductData without adapter", async ({ page }) => {
  await installAdapterRoutes(page);
  const product = await openFixtureAndReadProduct(
    page,
    "/adapter/popnshop-debug.html?offer=102&popnshop_debug=true",
  );

  expectBitrixExtendedProductData(product);
});

test("@regression Bitrix fixture without adapter or debug sends null extendedProductData", async ({ page }) => {
  await installAdapterRoutes(page);
  const product = await openFixtureAndReadProduct(page, "/adapter/no-adapter.html?offer=102");

  expect(product.extendedProductData).toBeNull();
});

test("@regression one SDK instance handles multiple product buttons", async ({ page }) => {
  await installAdapterRoutes(page);
  await page.goto(`${LOCAL_ORIGIN}/adapter/multi-product.html`, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForFunction(() => window.VirtualFitting && typeof window.VirtualFitting.init === "function");
  await expect(page.locator("script[data-shop-token]")).toHaveCount(1);
  await expect(page.locator(".virtual-fitting-button")).toHaveCount(MULTI_PRODUCTS.length);
  await expect(page.locator(".virtual-fitting-overlay")).toHaveCount(0);
  await expect(page.locator("#virtual-fitting-iframe")).toHaveCount(0);

  for (const [index, expectedProduct] of MULTI_PRODUCTS.entries()) {
    await page.locator(".virtual-fitting-button").nth(index).click();

    await expect(page.locator(".virtual-fitting-overlay")).toBeVisible();
    await expect(page.locator("#virtual-fitting-iframe")).toBeVisible();
    await expect(page.locator(".virtual-fitting-overlay")).toHaveCount(1);
    await expect(page.locator("#virtual-fitting-iframe")).toHaveCount(1);

    const iframeElement = await page.locator("#virtual-fitting-iframe").elementHandle();
    const frame = await iframeElement.contentFrame();
    await frame.waitForFunction(() => document.body.dataset.product && document.body.dataset.product !== "null");

    const product = await frame.evaluate(() => JSON.parse(document.body.dataset.product));
    expect(product).toMatchObject({
      external_id: expectedProduct.id,
      name: expectedProduct.name,
      price: expectedProduct.price,
      image: expectedProduct.image,
    });

    await page.evaluate(() => window.VirtualFitting.close());
    await expect(page.locator(".virtual-fitting-overlay")).toBeHidden();
  }

  await expect(page.locator("script[data-shop-token]")).toHaveCount(1);
  await expect(page.locator(".virtual-fitting-overlay")).toHaveCount(1);
  await expect(page.locator("#virtual-fitting-iframe")).toHaveCount(1);
});

test("@regression custom button slot takes priority over image placement", async ({ page }) => {
  await installAdapterRoutes(page);
  await page.goto(`${LOCAL_ORIGIN}/adapter/slot-priority.html?slot_button_debug=true`, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForFunction(() => window.VirtualFitting && typeof window.VirtualFitting.init === "function");
  const button = page.locator(".virtual-fitting-button");

  await expect(button).toHaveCount(1);
  await expect(page.locator("[data-fitting-button-slot] .virtual-fitting-button")).toHaveCount(1);
  await expect(page.locator(".product-card > .virtual-fitting-button")).toHaveCount(0);
  await expect(button).toHaveClass(/virtual-fitting-button-slot/);
  await expect(button).toHaveClass(/virtual-fitting-button-full-width/);
  await expect(button).toHaveCSS("position", "static");

  await button.click();

  const iframeElement = await page.locator("#virtual-fitting-iframe").elementHandle();
  const frame = await iframeElement.contentFrame();
  await frame.waitForFunction(() => document.body.dataset.product && document.body.dataset.product !== "null");

  const product = await frame.evaluate(() => JSON.parse(document.body.dataset.product));
  expect(product).toMatchObject({
    external_id: "looksy-slot-hoodie",
    name: "Slot priority hoodie",
    price: "4 990 ₽",
    image: PRODUCT_IMAGE,
  });
});

test("@regression EN slot button is not absolute", async ({ page }) => {
  await installAdapterRoutes(page);
  await page.goto(`${LOCAL_ORIGIN}/adapter/slot-priority-en.html?slot_button_debug=true`, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForFunction(() => window.VirtualFitting && typeof window.VirtualFitting.init === "function");
  const slotButton = page.locator('[data-testid="slot"] .virtual-fitting-button');
  const imageButton = page.locator('[data-testid="image-wrap"] .virtual-fitting-button');

  await expect(slotButton).toHaveCount(1);
  await expect(slotButton).toHaveClass(/virtual-fitting-button--en/);
  await expect(slotButton).toHaveClass(/virtual-fitting-button-slot/);
  await expect(slotButton).toHaveClass(/virtual-fitting-button-full-width/);
  await expect(imageButton).toHaveCount(0);

  const position = await slotButton.evaluate((el) => getComputedStyle(el).position);
  expect(position).toBe("static");

  const slotBox = await page.locator('[data-testid="slot"]').boundingBox();
  const buttonBox = await slotButton.boundingBox();
  expect(buttonBox.width).toBeGreaterThan(slotBox.width - 4);
});

test("@regression slot is ignored without slot_button_debug=true", async ({ page }) => {
  await installAdapterRoutes(page);
  await page.goto(`${LOCAL_ORIGIN}/adapter/slot-priority.html`, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForFunction(() => window.VirtualFitting && typeof window.VirtualFitting.init === "function");
  const slot = page.locator("[data-fitting-button-slot]");
  const imageWrap = page.locator(".product-card");
  const button = page.locator(".virtual-fitting-button");

  await expect(slot.locator(".virtual-fitting-button")).toHaveCount(0);
  await expect(imageWrap.locator(".virtual-fitting-button")).toHaveCount(1);
  await expect(button).not.toHaveClass(/virtual-fitting-button-slot/);
  await expect(button).not.toHaveClass(/virtual-fitting-button-full-width/);
});

test("@regression debug flag does not break fallback without slot", async ({ page }) => {
  await installAdapterRoutes(page);
  await page.goto(`${LOCAL_ORIGIN}/adapter/slot-priority-no-slot.html?slot_button_debug=true`, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForFunction(() => window.VirtualFitting && typeof window.VirtualFitting.init === "function");
  const product = page.locator(".product-card");
  const button = page.locator(".virtual-fitting-button");

  await expect(product.locator("[data-fitting-button-slot]")).toHaveCount(0);
  await expect(product.locator(".virtual-fitting-button")).toHaveCount(1);
  await expect(button).not.toHaveClass(/virtual-fitting-button-slot/);
  await expect(button).not.toHaveClass(/virtual-fitting-button-full-width/);
});
