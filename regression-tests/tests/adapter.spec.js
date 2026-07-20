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

const GLENFIELD_SIZE_TO_OFFER_ID = {
  "75": "496082",
  "71": "496083",
  "70": "496084",
  "68": "496085",
  "74": "496086",
  "76": "496087",
};

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

function createGlenfieldFixtureHtml({ adapterName = "" } = {}) {
  const scriptAttrs = adapterName ? `data-adapter="${adapterName}"` : "";

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Glenfield adapter regression</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; }
    main { max-width: 640px; }
    .card-product { border: 1px solid #d7dce2; padding: 16px; }
    .goods-var { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
    .goods-var-item { border: 1px solid #9aa5b1; padding: 6px 10px; cursor: pointer; user-select: none; }
    .goods-var-item_active { border-color: #1f2933; background: #1f2933; color: #fff; }
    .goods-var-item.disabled,
    .goods-var-item.goods-var-item_disabled { opacity: 0.45; cursor: not-allowed; }
    .card-product-action__add-to-card { display: inline-block; margin-top: 8px; padding: 8px 12px; border: 1px solid #1f2933; text-decoration: none; color: #1f2933; }
  </style>
</head>
<body>
  <span id="cart_quality_top"></span>
  <main>
    <div
      class="card-product card-product_page"
      data-id="496081"
      data-iblock="1"
      data-section_id="163"
      data-exchange_id="753677"
      data-fitting-product=""
      data-fitting-name="джемпер женский в розово - сиреневом цвете с перфорированным узором"
      data-fitting-price="4690 руб."
    >
      <div class="goods-var goods-var_colors">
        <div class="goods-var-item goods-var-item_active" data-color="2022" data-sizes="68;70;71;74;75;76">
          <img class="goods-var-item__img" src="${LOCAL_ORIGIN}/assets/hoodie.png" alt="">
        </div>
      </div>

      <div class="goods-var-wrap goods-var-wrap-product_size">
        <div class="goods-var goods-var_size js-goods-var-car owl-theme owl-carousel">
          <div class="js-size-card-hover goods-var-item goods-var-item_active" data-size="75" data-size-desc="S">S</div>
          <div class="js-size-card-hover goods-var-item" data-size="71" data-size-desc="M">M</div>
          <div class="js-size-card-hover goods-var-item" data-size="70" data-size-desc="L">L</div>
          <div class="js-size-card-hover goods-var-item" data-size="68" data-size-desc="XL">XL</div>
          <div class="js-size-card-hover goods-var-item" data-size="74" data-size-desc="2XL">2XL</div>
          <div class="js-size-card-hover goods-var-item" data-size="76" data-size-desc="3XL">3XL</div>
        </div>
      </div>

      <a class="card-product-action__add-to-card js-add-basket" data-id="496082" data-fbq-price="4690" href="">В корзину</a>
    </div>
  </main>
  <script>
    (function () {
      var sizeToOffer = ${JSON.stringify(GLENFIELD_SIZE_TO_OFFER_ID)};

      function syncSizeState(sizeId) {
        var sizeItems = document.querySelectorAll(".goods-var_size .goods-var-item[data-size]");
        for (var i = 0; i < sizeItems.length; i++) {
          var item = sizeItems[i];
          item.classList.toggle("goods-var-item_active", item.getAttribute("data-size") === sizeId);
        }

        var addButton = document.querySelector(".js-add-basket");
        if (addButton) {
          addButton.setAttribute("data-id", sizeToOffer[sizeId] || "");
        }
      }

      document.addEventListener("click", function (event) {
        var sizeButton = event.target.closest(".goods-var_size .goods-var-item[data-size]");
        if (sizeButton) {
          syncSizeState(sizeButton.getAttribute("data-size"));
        }

        var addButton = event.target.closest(".js-add-basket");
        if (addButton) {
          event.preventDefault();
          var cart = document.getElementById("cart_quality_top");
          cart.textContent = String((Number(cart.textContent || "0") || 0) + 1);
        }
      });

      syncSizeState("75");
    })();
  </script>
  <script
    src="${LOCAL_ORIGIN}/script/script.js"
    data-shop-token="adapter-test-token"
    data-widget-url="${LOCAL_ORIGIN}/mock-widget.html"
    ${scriptAttrs}
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

function createTildaDesktopColumnsFixtureHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Tilda desktop columns regression</title>
  <style>
    .js-store-product { width: 900px; }
    .t-store__prod-popup__slider { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .t-store__prod-popup__wrapper { width: 360px; height: 540px; }
    .t-store__prod-popup__columns { display: block; width: 100%; height: 100%; object-fit: cover; }
  </style>
</head>
<body>
  <main>
    <article class="js-store-product js-product t-store__product-snippet">
      <div class="t-store__prod-popup__slider js-store-prod-slider">
        <div class="t-store__prod-popup__wrapper t-store__prod-popup__wrapper__col2_fixed" data-testid="first-photo-wrapper">
          <img class="t-store__prod-popup__columns t-img js-product-img t-zoomable loaded" src="${PRODUCT_IMAGE}" data-original="${PRODUCT_IMAGE}" alt="First photo">
        </div>
        <div class="t-store__prod-popup__wrapper t-store__prod-popup__wrapper__col2_fixed" data-testid="second-photo-wrapper">
          <img class="t-store__prod-popup__columns t-img t-zoomable loaded" src="${PRODUCT_IMAGE}" data-original="${PRODUCT_IMAGE}" alt="Second photo">
        </div>
      </div>
      <h1 class="js-store-prod-name js-product-name">Tilda desktop dress</h1>
      <div class="js-product-price">13 500 ₽</div>
    </article>
  </main>
  <script
    src="${LOCAL_ORIGIN}/script/script.js"
    data-shop-token="tilda-desktop-columns-test-token"
    data-widget-url="${LOCAL_ORIGIN}"
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
      if (requestUrl.searchParams.get("shop_token") === "tilda-desktop-columns-test-token") {
        await route.fulfill({
          status: 200,
          contentType: "application/json; charset=utf-8",
          body: JSON.stringify({
            button: {
              bg_color: "#323232",
              text_color: "#ffffff",
              text: "Примерить онлайн",
              font_size: 14,
              height: 37,
              border_radius: 7,
              icon_url: null,
              icon_size: 12,
              icon_offset_x: 0,
              icon_offset_y: 0,
              offset_x: 0,
              offset_y: 0,
            },
            iframe: {
              primary_button_color: "#0a0a0b",
              accent_color: "#7886ff",
              widget_bg_color: "#ffffff",
            },
          }),
        });
        return;
      }

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
        body: createBitrixFixtureHtml({ adapterName: "popnshop" }),
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

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === "/adapter/glenfield-debug.html") {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: createGlenfieldFixtureHtml(),
      });
      return;
    }

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === "/local/ajax/getCartData.php") {
      const postData = new URLSearchParams(route.request().postData() || "");
      const sizeXmlId = postData.get("size_xml_id") || "";
      const offerId = GLENFIELD_SIZE_TO_OFFER_ID[sizeXmlId];

      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({
          res: true,
          fields: {
            id: offerId,
            price_raw: sizeXmlId === "68" ? 4690 : 4490,
            price: sizeXmlId === "68" ? "4 690 руб." : "4 490 руб.",
            old_price: sizeXmlId === "68" ? 6690 : 0,
            quantity: "5",
            active: "Y",
            in_online_store: true,
            EXCHANGE_ID: "753680",
            SECTION_ID: "163",
            seo_el_id: "496082",
            url: "/catalog/women/dzhempery/dzhemper-zhenskiy_D62GC731A-35Q_main_496082/",
          },
        }),
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

    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === "/adapter/tilda-desktop-columns.html") {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: createTildaDesktopColumnsFixtureHtml(),
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

function expectGlenfieldExtendedProductData(product) {
  expect(product.extendedProductData).toMatchObject({
    adapter: "glenfield",
    product_id: "496081",
    color_xml_id: "2022",
    selected: { SIZE: "75", COLOR: "2022" },
  });

  expect(product.extendedProductData.variants).toEqual([
    {
      code: "SIZE",
      name: "Размер",
      values: [
        { id: "75", name: "S" },
        { id: "71", name: "M" },
        { id: "70", name: "L" },
        { id: "68", name: "XL" },
        { id: "74", name: "2XL" },
        { id: "76", name: "3XL" },
      ],
    },
  ]);

  expect(product.extendedProductData.offers).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "496082",
        available: true,
        quantity: 5,
        price: "4 490 руб.",
        price_raw: 4490,
        old_price: 0,
        values: { SIZE: "75", COLOR: "2022" },
      }),
      expect.objectContaining({
        id: "496085",
        available: true,
        quantity: 5,
        price: "4 690 руб.",
        price_raw: 4690,
        old_price: 6690,
        values: { SIZE: "68", COLOR: "2022" },
      }),
    ]),
  );
  expect(product.extendedProductData.offers).toHaveLength(6);
}

test("@regression popnshop adapter sends extendedProductData", async ({ page }) => {
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

test("@regression Bitrix fixture without adapter sends null extendedProductData", async ({ page }) => {
  await installAdapterRoutes(page);
  const product = await openFixtureAndReadProduct(page, "/adapter/no-adapter.html?offer=102");

  expect(product.extendedProductData).toBeNull();
});

test("@regression Glenfield debug adapter collects offers and adds selected offer", async ({ page }) => {
  await installAdapterRoutes(page);
  await page.goto(`${LOCAL_ORIGIN}/adapter/glenfield-debug.html?glenfield_debug=true`, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForFunction(() => window.VirtualFitting && typeof window.VirtualFitting.init === "function");
  await expect(page.locator(".virtual-fitting-button")).toHaveCount(1);
  await page.locator(".virtual-fitting-button").click();

  const iframeElement = await page.locator("#virtual-fitting-iframe").elementHandle();
  const frame = await iframeElement.contentFrame();
  await frame.waitForFunction(() => {
    try {
      const product = JSON.parse(document.body.dataset.product || "null");
      return !!(
        product &&
        product.extendedProductData &&
        Array.isArray(product.extendedProductData.offers) &&
        product.extendedProductData.offers.length === 6
      );
    } catch (error) {
      return false;
    }
  });

  const product = await frame.evaluate(() => JSON.parse(document.body.dataset.product));
  expectGlenfieldExtendedProductData(product);

  await frame.evaluate((payload) => {
    window.parent.postMessage(
      {
        source: "looksy-widget",
        type: "PRESS_ADD_TO_CART_BTN",
        request_id: "glenfield-add-to-cart",
        payload,
      },
      "*",
    );
  }, { offer_id: "496085", values: { SIZE: "68", COLOR: "2022" } });

  await frame.waitForFunction(() => Boolean(document.body.dataset.addToCartResult));
  const addToCartResult = await frame.evaluate(() => JSON.parse(document.body.dataset.addToCartResult));

  expect(addToCartResult.success).toBe(true);
  expect(addToCartResult.message).toBe("Added to cart");
  await expect(page.locator(".goods-var_size .goods-var-item_active")).toHaveAttribute("data-size", "68");
  await expect(page.locator(".js-add-basket")).toHaveAttribute("data-id", "496085");
  await expect(page.locator("#cart_quality_top")).toHaveText("1");
});

test("@regression Glenfield debug adapter fetches offer data once and adds selected offer", async ({ page }) => {
  await installAdapterRoutes(page);
  let cartDataRequests = 0;

  page.on("request", (request) => {
    const requestUrl = new URL(request.url());
    if (requestUrl.origin === LOCAL_ORIGIN && requestUrl.pathname === "/local/ajax/getCartData.php") {
      cartDataRequests += 1;
    }
  });

  await page.goto(`${LOCAL_ORIGIN}/adapter/glenfield-debug.html?glenfield_debug=true`, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForFunction(() => window.VirtualFitting && typeof window.VirtualFitting.init === "function");
  await expect(page.locator(".virtual-fitting-button")).toHaveCount(1);
  await page.locator(".virtual-fitting-button").click();

  const iframeElement = await page.locator("#virtual-fitting-iframe").elementHandle();
  const frame = await iframeElement.contentFrame();
  await frame.waitForFunction(() => document.body.dataset.product && document.body.dataset.product !== "null");

  const product = await frame.evaluate(() => JSON.parse(document.body.dataset.product));
  expectGlenfieldExtendedProductData(product);
  expect(cartDataRequests).toBe(6);

  await frame.evaluate(() => {
    window.parent.postMessage(
      {
        source: "looksy-widget",
        type: "PRESS_ADD_TO_CART_BTN",
        request_id: "glenfield-add-to-cart-disabled",
        payload: { offer_id: "496085", values: { SIZE: "68", COLOR: "2022" } },
      },
      "*",
    );
  });

  await frame.waitForFunction(() => Boolean(document.body.dataset.addToCartResult));
  const addToCartResult = await frame.evaluate(() => JSON.parse(document.body.dataset.addToCartResult));
  expect(addToCartResult.success).toBe(true);
  expect(addToCartResult.message).toBe("Added to cart");
  await expect(page.locator(".goods-var_size .goods-var-item_active")).toHaveAttribute("data-size", "68");
  await expect(page.locator(".js-add-basket")).toHaveAttribute("data-id", "496085");
  await expect(page.locator("#cart_quality_top")).toHaveText("1");
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

test("@regression Tilda desktop columns place one button on the first photo", async ({ page }) => {
  await installAdapterRoutes(page);
  await page.goto(`${LOCAL_ORIGIN}/adapter/tilda-desktop-columns.html`, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForFunction(() => window.VirtualFitting && typeof window.VirtualFitting.init === "function");
  await expect(page.locator(".virtual-fitting-button")).toHaveCount(1);
  await expect(page.locator('[data-testid="first-photo-wrapper"] .virtual-fitting-button')).toHaveCount(1);
  await expect(page.locator('[data-testid="second-photo-wrapper"] .virtual-fitting-button')).toHaveCount(0);
  await expect(page.locator('[data-testid="first-photo-wrapper"]')).toHaveCSS("position", "relative");
  await expect(page.locator('[data-testid="first-photo-wrapper"] .virtual-fitting-button img')).toHaveCSS("width", "12px");
  await expect(page.locator('[data-testid="first-photo-wrapper"] .virtual-fitting-button img')).toHaveCSS("height", "12px");
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

test("@regression dev_flag query params are passed to widget URL and PRODUCT_DATA", async ({ page }) => {
  await installAdapterRoutes(page);
  await page.goto(
    `${LOCAL_ORIGIN}/adapter/slot-priority.html?dev_flag_alt_flow=true&regular_flag=true&dev_flag_size_test=1&dev_flag_alt_flow=false`,
    { waitUntil: "domcontentloaded" },
  );

  await page.waitForFunction(() => window.VirtualFitting && typeof window.VirtualFitting.init === "function");
  await page.locator(".virtual-fitting-button").click();

  const iframe = page.locator("#virtual-fitting-iframe");
  await expect(iframe).toBeVisible();

  const iframeSrc = await iframe.getAttribute("src");
  const params = new URL(iframeSrc).searchParams;
  expect(JSON.parse(params.get("devFlags"))).toEqual([
    "dev_flag_alt_flow",
    "dev_flag_size_test",
  ]);

  const iframeElement = await iframe.elementHandle();
  const frame = await iframeElement.contentFrame();
  await frame.waitForFunction(() => document.body.dataset.product && document.body.dataset.product !== "null");

  const product = await frame.evaluate(() => JSON.parse(document.body.dataset.product));
  expect(product.devFlags).toBeUndefined();

  const devFlags = await frame.evaluate(() => JSON.parse(document.body.dataset.devFlags));
  expect(devFlags).toEqual([
    "dev_flag_alt_flow",
    "dev_flag_size_test",
  ]);
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
