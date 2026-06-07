(function () {
  "use strict";

  // =====================================================
  // НАСТРОЙКИ ДЛЯ БЫСТРОГО РЕДАКТИРОВАНИЯ
  // =====================================================
  const WIDGET_URL = "https://widget.looksy.tech";
  const EN_WIDGET_URL = "https://en.widget.looksy.tech";
  const RU_WIDGET_URL = "https://ru.widget.looksy.tech";
  const BUTTON_TEXT = "Примерить на себе";
  const EN_BUTTON_TEXT = "Try on";
  const Z_INDEX = 2147483646;
  const BUTTON_RENDER_DELAY_MS = 140;
  const ST305N_RELOAD_STEPS_MS = [120, 450, 900, 1600, 2600, 3800];
  const ICON_URL = "https://s3.regru.cloud/looksy-widget/try_on.svg";
  // =====================================================

  // Получаем shopToken из data-атрибута текущего скрипта
  const currentScript = document.currentScript ||
    document.querySelector('script[data-shop-token]');
  const SHOP_TOKEN = currentScript?.getAttribute('data-shop-token') || '';
  const DEBUG_MODE = currentScript?.getAttribute("data-debug") === "true";
  const LANG = currentScript?.getAttribute('data-lang') || '';
  /** Внешняя кнопка на витрине: отдельный UI и иконка без S3 (как на site/Looksy.html). */
  const IS_EN_WIDGET = LANG === "en";
  const EN_LAUNCHER_MODIFIER = "virtual-fitting-button--en";
  /** Поверх оверлея виджета (Z_INDEX) и кнопки L — блокировка повторного открытия */
  const SESSION_MODAL_Z_INDEX = 2147483647;
  const SESSION_MODAL_ROOT_ID = "looksy-vf-session-modal-root";
  const SESSION_MODAL_STYLE_ID = "looksy-vf-session-modal-styles";
  const SESSION_MODAL_COPY_RU = {
    message:
      "У вас уже есть активная примерка. Закройте текущую или дождитесь её окончания, чтобы начать новую.",
    ok: "Понятно",
  };
  const SESSION_MODAL_COPY_EN = {
    message:
      "You already have an active try-on. Close the current one or wait for it to finish before starting a new one.",
    ok: "OK",
  };
  const DATA_WIDGET_URL = (currentScript && currentScript.getAttribute("data-widget-url") || "").trim();
  const IS_RU_TOKEN = SHOP_TOKEN.startsWith('ru_');
  const RESOLVED_WIDGET_URL = DATA_WIDGET_URL || (LANG === 'en' ? EN_WIDGET_URL : IS_RU_TOKEN ? RU_WIDGET_URL : WIDGET_URL);

  if (!SHOP_TOKEN) {
    console.error('[Looksy] Missing data-shop-token attribute on script tag');
  }

  function debugLog() {
    if (!DEBUG_MODE) return;
    const args = Array.prototype.slice.call(arguments);
    args.unshift("[Looksy]");
    console.log.apply(console, args);
  }

  const WIDGET_CONFIG = {
    iframeId: "virtual-fitting-iframe",
    buttonClass: "virtual-fitting-button",
    overlayClass: "virtual-fitting-overlay",
    productSelector: "[data-fitting-product]",
    imageSelector: "img[data-fitting-image]",
    nameAttribute: "data-fitting-name",
    priceAttribute: "data-fitting-price",
    imageAttribute: "data-fitting-image",
    onlyOpenCardFirstImage: true,
    openCardSelector: ".t-store__prod-popup.t-popup_show, .t-store__prod-popup_showed, .t-popup_show .t-store__prod-popup, .t-popup_show .js-store-prod-all, .t-popup_show .js-product-single-wrapper, .t-popup_show .t-store__prod-popup__container, .t-catalog__prod-popup.t-popup_show, .t-catalog__prod-popup_showed, .t-popup_show .t-catalog__prod-popup, .t-popup_show .js-catalog-prod-all, .t-popup_show .t-catalog__prod-popup__container, .t-popup_show .js-catalog-product, .t-catalog__product-popup.t-popup_show, .t-popup_show .t-catalog__product-popup",
    openCardProductSelectors: [
      ".js-store-prod-all",
      ".js-catalog-prod-all",
      ".js-product-single-wrapper",
      ".t-store__prod-popup",
      ".t-catalog__prod-popup",
      ".t-store__prod-popup__container",
      ".t-catalog__prod-popup__container",
      ".t-store__prod-popup__content",
      ".t-catalog__prod-popup__content",
      ".js-store-product",
      ".js-catalog-product",
      ".t-catalog__product-popup",
      ".t-store__product-snippet",
      ".t-catalog__product-snippet",
    ],
    productContainerSelectors: [
      "[data-fitting-product]",
      ".js-store-prod-all",
      ".js-catalog-prod-all",
      ".js-product-single-wrapper",
      ".t-store__prod-popup",
      ".t-catalog__prod-popup",
      ".t-store__prod-popup__container",
      ".t-catalog__prod-popup__container",
      ".t-store__prod-popup__content",
      ".t-catalog__prod-popup__content",
      ".js-store-product",
      ".js-catalog-product",
      ".t-catalog__product-popup",
      ".t-store__product-snippet",
      ".t-catalog__product-snippet",
      ".t-store__card",
      ".t-catalog__card",
      ".js-product",
      ".js-product-wrapper",
      ".t-store__prod-popup__slider",
      ".t-catalog__prod-popup__slider",
      ".js-catalog-desktop-custom-gallery",
    ],
    firstPhotoSelectors: [
      // Попап: специфичные селекторы первого слайда
      ".t-store__prod-popup .t-slds__imgwrapper .js-product-img",
      ".t-catalog__prod-popup .t-slds__imgwrapper .js-product-img",
      ".t-store__prod-popup .t-slds__imgwrapper .t-bgimg",
      ".t-catalog__prod-popup .t-slds__imgwrapper .t-bgimg",
      ".t-store__prod-popup .t-slds__imgwrapper .t-slds__bgimg",
      ".t-catalog__prod-popup .t-slds__imgwrapper .t-slds__bgimg",
      ".t-store__prod-popup__slider .t-slds__item:first-child .t-bgimg",
      ".t-catalog__prod-popup__slider .t-slds__item:first-child .t-bgimg",
      ".t-store__prod-popup__slider .t-slds__item:first-child img",
      ".t-catalog__prod-popup__slider .t-slds__item:first-child img",
      ".t-store__prod-popup__slider .t-slds__item:first-child [data-original]",
      ".t-catalog__prod-popup__slider .t-slds__item:first-child [data-original]",
      ".t-store__prod-popup__imgwrapper .t-bgimg",
      ".t-catalog__prod-popup__imgwrapper .t-bgimg",
      ".t-store__prod-popup__imgwrapper img",
      ".t-catalog__prod-popup__imgwrapper img",
      // T1291 t-catalog: custom desktop gallery (новый каталог, напр. TOOMATCH)
      ".t-popup_show .js-catalog-desktop-custom-gallery .t-img",
      ".t-catalog__prod-popup .js-catalog-desktop-custom-gallery .t-img",
      ".t-popup_show .js-catalog-product .js-catalog-desktop-custom-gallery .t-img",
      ".js-catalog-product .js-catalog-desktop-custom-gallery .t-img",
      ".t-popup_show .js-catalog-product .t-slds__main .t-img",
      ".t-popup_show .js-catalog-product .t-slds__main img",
      ".js-catalog-product .t-slds__main .t-img",
      ".js-catalog-desktop-custom-gallery img",
      // Одиночная страница товара: первый слайд по DOM-порядку
      ".t-slds__wrapper:first-child .js-product-img",
      ".t-slds__wrapper:first-child .t-bgimg",
      ".t-slds__wrapper:first-child .t-slds__bgimg",
      ".t-slds__wrapper:first-child [data-original]",
      ".t-slds__item:first-child .js-product-img",
      ".t-slds__item:first-child .t-bgimg",
      ".t-slds__item:first-child .t-slds__bgimg",
      ".t-slds__item:first-child img",
      // Fallback: активный слайд (только если первый не найден)
      ".t-store__prod-popup__slider .t-slds__item_active .t-bgimg",
      ".t-catalog__prod-popup__slider .t-slds__item_active .t-bgimg",
      ".t-store__prod-popup__slider .t-slds__item_active img",
      ".t-catalog__prod-popup__slider .t-slds__item_active img",
      ".t-store__prod-popup__slider .t-slds__item_active .js-product-img",
      ".t-catalog__prod-popup__slider .t-slds__item_active .js-product-img",
      ".t-slds__item_active .js-product-img",
      ".t-slds__item_active .t-bgimg",
      ".js-product-img.t-bgimg",
      ".js-product-img",
    ],
    productSelectors: [
      "[data-fitting-product]",
      ".js-product",
      ".t-store__card",
      ".t-catalog__card",
      ".js-store-prod-all",
      ".js-catalog-prod-all",
      ".js-product-wrapper",
      ".js-product-single-wrapper",
      ".t-store__prod-popup__content",
      ".t-catalog__prod-popup__content",
      ".js-store-product",
      ".js-catalog-product",
      ".t-store__product-snippet",
      ".t-catalog__product-snippet",
    ],
    imageSelectors: [
      "img[data-fitting-image]",
      "[data-fitting-image]",
      "img.js-product-img",
      ".js-product-img",
      ".t-slds__imgwrapper .js-product-img",
      ".t-slds__imgwrapper .t-bgimg",
      ".t-slds__imgwrapper .t-slds__bgimg",
      ".t-slds__bgimg",
      ".t-store__card__bgimg",
      ".t-catalog__card__bgimg",
      ".js-catalog-desktop-custom-gallery .t-img",
      ".js-catalog-desktop-custom-gallery img",
      ".js-catalog-product .t-slds__main .t-img",
      ".js-catalog-product .t-slds__main img",
      ".t-bgimg",
      "[data-original]",
      "img",
    ],
    nameSelectors: [
      ".js-product-name",
      ".js-product-title",
      ".js-store-prod-name",
      ".js-catalog-prod-name",
      ".t-store__prod-popup__title",
      ".t-catalog__prod-popup__name",
      ".t-store__card__title",
      ".t-catalog__card__title",
      "[itemprop='name']",
      "h1",
      "h2",
      "h3",
    ],
    priceSelectors: [
      ".js-product-price",
      ".js-store-prod-price-val",
      ".js-catalog-prod-price-val",
      ".t-store__prod-popup__price-value",
      ".t-catalog__prod-popup__price-value",
      ".t-store__prod-popup__price",
      ".t-catalog__prod-popup__price",
      ".t-store__card__price-value",
      ".t-catalog__card__price-value",
      ".t-store__card__price",
      ".t-catalog__card__price",
      "[itemprop='price']",
      "[data-price]",
      "[data-product-price]",
    ],
    descriptionSelectors: [
      ".js-store-prod-all-text",
      ".js-catalog-prod-all-text",
      ".js-catalog-prod-text",
      ".t-store__prod-popup__description",
      ".t-catalog__prod-popup__text",
      "[itemprop='description']",
    ],
    descriptionCutMarkers: [
      "Размеры", "Размерная сетка", "Размер на модели",
      "Состав изделия", "Состав:", "Уход", "Уход за изделием",
      "OS:", "Параметры модели", "Обхват груди",
    ],
    st305nRootSelectors: [
      ".t-store__grid-cont",
      ".t-catalog__grid-cont",
      ".js-store-grid-cont",
      ".js-catalog-grid-cont",
      ".t-store__card",
      ".t-catalog__card",
      ".js-store-product",
      ".js-catalog-product",
      ".t-store__product-snippet",
      ".t-catalog__product-snippet",
    ],
    excludedProductNameKeywords: [
      "Сертификат",
      "Бокс",
      "Пакет",
      "Упаковка",
      "Игры",
      "Дженга"
    ],
    widgetUrl: RESOLVED_WIDGET_URL,
    buttonText: LANG === 'en' ? EN_BUTTON_TEXT : BUTTON_TEXT,
    iconUrl: ICON_URL,
    zIndex: Z_INDEX,
    shopToken: SHOP_TOKEN,
  };

  // Helper: получить origin из URL (нормализованный, без trailing slash)
  function getWidgetOrigin() {
    try {
      return new URL(WIDGET_CONFIG.widgetUrl).origin;
    } catch (e) {
      return WIDGET_CONFIG.widgetUrl.replace(/\/$/, "");
    }
  }

  // Helper: получить base URL скрипта для загрузки ассетов
  function getScriptBaseUrl() {
    const scripts = document.getElementsByTagName("script");
    for (let i = scripts.length - 1; i >= 0; i--) {
      const src = scripts[i].src;
      if (src && src.includes("script.js")) {
        return src.substring(0, src.lastIndexOf("/") + 1);
      }
    }
    return "";
  }

  let iframe = null;
  let overlay = null;
  let currentProduct = null;
  var sessionModalEscapeHandler = null;
  let productsProcessQueued = false;
  let productsProcessTimer = null;

  // ─── SHOP CUSTOMIZATION ──────────────────────────────────────────────────
  // Загружается из /widget/config?shop_token=XXX при инициализации.
  // Все значения nullable на беке — дефолты совпадают с текущим дизайном.
  var shopConfig = {
    button: {
      bg_color: "#323232",
      text_color: "#ffffff",
      text: LANG === 'en' ? EN_BUTTON_TEXT : BUTTON_TEXT,
      font_size: 14,
      height: 37,
      border_radius: 7,
      icon_url: null,
      icon_size: 18,
      icon_offset_x: 0,
      icon_offset_y: 0,
      offset_x: 0,
      offset_y: 0,
    },
    iframe: {
      primary_button_color: "#0a0a0b",
      accent_color: "#7886ff",
      widget_bg_color: "#ffffff",
      example_good_photo_url: null,
      example_bad_photo_url: null,
    },
  };

  function loadShopConfig() {
    if (!WIDGET_CONFIG.shopToken) return Promise.resolve();
    var url = WIDGET_CONFIG.widgetUrl.replace(/\/$/, "") + "/api/widget/config?shop_token=" + encodeURIComponent(WIDGET_CONFIG.shopToken);
    return fetch(url)
      .then(function(response) {
        if (response.ok) return response.json();
      })
      .then(function(data) {
        if (data && data.button && data.iframe) {
          shopConfig = data;
        }
      })
      .catch(function() {
        // Не удалось загрузить — используем дефолты
      });
  }
  // ─────────────────────────────────────────────────────────────────────────
  let buttonRenderTimer = null;
  let startupRenderInterval = null;
  let st305nReloadTimers = [];
  /** Пока iframe на экране генерации (PROCESSING); для кнопки минимайзера — спиннер вместо L */
  var generationInProgress = false;

  const MINIMIZED_CLASS = "virtual-fitting-minimized";
  const TOGGLE_BTN_ID = "virtual-fitting-toggle-btn";
  const CONTAINER_ID = "virtual-fitting-minimizer";
  const PRODUCT_BTN_ATTR = "data-virtual-fitting-product-btn";

  var MINIMIZER_SPINNER_HTML =
    '<span class="virtual-fitting-toggle-spinner-wrap" aria-hidden="true">' +
    '<svg class="virtual-fitting-toggle-spinner-svg" width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">' +
    '<g transform="translate(17,17)">' +
    '<line x1="0" y1="-13" x2="0" y2="-8" stroke="#0a0a0a" stroke-width="2.8" stroke-linecap="round" transform="rotate(0)"/>' +
    '<line x1="0" y1="-13" x2="0" y2="-8" stroke="#0a0a0a" stroke-width="2.8" stroke-linecap="round" transform="rotate(45)"/>' +
    '<line x1="0" y1="-13" x2="0" y2="-8" stroke="#0a0a0a" stroke-width="2.8" stroke-linecap="round" transform="rotate(90)"/>' +
    '<line x1="0" y1="-13" x2="0" y2="-8" stroke="#0a0a0a" stroke-width="2.8" stroke-linecap="round" transform="rotate(135)"/>' +
    '<line x1="0" y1="-13" x2="0" y2="-8" stroke="#0a0a0a" stroke-width="2.8" stroke-linecap="round" transform="rotate(180)"/>' +
    '<line x1="0" y1="-13" x2="0" y2="-8" stroke="#0a0a0a" stroke-width="2.8" stroke-linecap="round" transform="rotate(225)"/>' +
    '<line x1="0" y1="-13" x2="0" y2="-8" stroke="#0a0a0a" stroke-width="2.8" stroke-linecap="round" transform="rotate(270)"/>' +
    '<line x1="0" y1="-13" x2="0" y2="-8" stroke="#0a0a0a" stroke-width="2.8" stroke-linecap="round" transform="rotate(315)"/>' +
    "</g></svg></span>";

  function minimizeWidget() {
    if (!overlay) return;
    overlay.classList.add(MINIMIZED_CLASS);
    document.body.style.overflow = "";
    updateMinimizerButton(true, null);
  }

  function expandWidget() {
    if (!overlay) return;
    overlay.classList.remove(MINIMIZED_CLASS);
    document.body.style.overflow = "hidden";
    updateMinimizerButton(false, null);
    // После 0→100% высоты iframe iOS часто оставляет Vaul/transform/scroll в битом состоянии
    // до первого жеста — даём iframe явный сигнал сбросить layout (см. widget-en App).
    postMessageToIframe({ type: "WIDGET_EXPANDED" });
  }

  function updateMinimizerButton(isMinimized, attentionState) {
    var btn = document.getElementById(TOGGLE_BTN_ID);
    if (!btn) return;
    var showingAttention = attentionState === "success" || attentionState === "error";
    btn.classList.toggle("virtual-fitting-toggle--minimized", isMinimized);
    btn.classList.toggle("virtual-fitting-toggle--attention", showingAttention);
    btn.classList.toggle(
      "virtual-fitting-toggle--generating",
      isMinimized && !showingAttention && generationInProgress,
    );
    if (attentionState === "success") {
      btn.innerHTML = '<span class="virtual-fitting-toggle-check">✓</span><span class="virtual-fitting-toggle-badge"></span>';
    } else if (attentionState === "error") {
      btn.innerHTML = '<span class="virtual-fitting-toggle-cross">×</span><span class="virtual-fitting-toggle-badge"></span>';
    } else if (isMinimized) {
      btn.innerHTML = generationInProgress ? MINIMIZER_SPINNER_HTML : '<span class="virtual-fitting-toggle-letter">L</span>';
    }
    btn.title = isMinimized ? "Развернуть виджет" : "Свернуть в фон";
    btn.style.display = isMinimized ? "flex" : "none";
  }

  function triggerMinimizerAttention(isError) {
    var btn = document.getElementById(TOGGLE_BTN_ID);
    if (!btn || !overlay || !overlay.classList.contains(MINIMIZED_CLASS)) return;
    updateMinimizerButton(true, isError ? "error" : "success");
    // Галочка/крестик висят и пульсируют до клика по кнопке (развернуть)
  }

  function createMinimizerButton() {
    if (document.getElementById(CONTAINER_ID)) return;
    var container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483647;";
    var btn = document.createElement("button");
    btn.id = TOGGLE_BTN_ID;
    btn.type = "button";
    btn.className = "virtual-fitting-toggle virtual-fitting-toggle--minimized";
    btn.style.display = "none";
    btn.title = "Развернуть виджет";
    btn.innerHTML = '<span class="virtual-fitting-toggle-letter">L</span>';
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      expandWidget();
    });
    container.appendChild(btn);
    document.body.appendChild(container);
  }

  function createStyles() {
    if (document.getElementById("virtual-fitting-styles")) return;

    const style = document.createElement("style");
    style.id = "virtual-fitting-styles";
    style.textContent = `
      ${
        IS_EN_WIDGET
          ? `
      .${WIDGET_CONFIG.buttonClass}.${EN_LAUNCHER_MODIFIER} {
        position: absolute;
        right: 0;
        bottom: 0;
        z-index: 999;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        padding: 10px 16px 10px 18px;
        border: none;
        border-radius: 0;
        background: #0a0a0a;
        color: #ffffff;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        white-space: nowrap;
        cursor: pointer;
        transition: padding-right 0.2s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        height: auto;
      }
      .${WIDGET_CONFIG.buttonClass}.${EN_LAUNCHER_MODIFIER}:hover {
        padding-right: 22px;
      }
      .${WIDGET_CONFIG.buttonClass}.${EN_LAUNCHER_MODIFIER} .virtual-fitting-button-star {
        display: inline-block;
        font-size: 9px;
        line-height: 1;
        transform: translateY(-1px);
        flex-shrink: 0;
      }
      .t-slds__bgimg .${WIDGET_CONFIG.buttonClass}.${EN_LAUNCHER_MODIFIER},
      .js-product-img .${WIDGET_CONFIG.buttonClass}.${EN_LAUNCHER_MODIFIER} {
        right: 0;
        bottom: 0;
      }
      `
          : `
      .${WIDGET_CONFIG.buttonClass} {
        position: absolute;
        right: 12px;
        bottom: 12px;
        z-index: 999;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 8px;
        background: ${shopConfig.button.bg_color};
        height: ${shopConfig.button.height}px;
        color: ${shopConfig.button.text_color};
        border: none;
        border-radius: ${shopConfig.button.border_radius}px;
        font-size: ${shopConfig.button.font_size}px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .${WIDGET_CONFIG.buttonClass}:hover {
        opacity: 90%;
      }
      .${WIDGET_CONFIG.buttonClass} img {
        width: 16px;
        height: 16px;
        margin-right: 4px;
        flex-shrink: 0;
      }
      .${WIDGET_CONFIG.buttonClass}.${BUTTON_SLOT_CLASS} {
        position: static !important;
        right: auto !important;
        bottom: auto !important;
        transform: none;
      }
      .${WIDGET_CONFIG.buttonClass}.${BUTTON_FULL_WIDTH_CLASS} {
        width: 100%;
      }
      .t-slds__bgimg .${WIDGET_CONFIG.buttonClass},
      .js-product-img .${WIDGET_CONFIG.buttonClass} {
        right: 12px;
        bottom: 12px;
      }
      `
      }
      .t-store__prod-popup__slider,
      .t-catalog__prod-popup__slider,
      .t-slds,
      .t-slds__main,
      .t-slds__container {
        position: relative;
        isolation: isolate;
      }
      .t-slds__imgwrapper {
        position: relative;
        isolation: isolate;
      }
      .${WIDGET_CONFIG.overlayClass} {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0);
        z-index: ${WIDGET_CONFIG.zIndex} !important;
        display: flex;
        align-items: center;
        justify-content: center;
        visibility: hidden;
        transition: background 0.15s ease, visibility 0.15s ease;
      }
      .${WIDGET_CONFIG.overlayClass}.active {
        background: rgba(0, 0, 0, 0.5);
        visibility: visible;
      }
      .${WIDGET_CONFIG.overlayClass}.active_processing {
        background: rgba(0, 0, 0, 0.9);
        visibility: visible;
      }
      #${WIDGET_CONFIG.iframeId} {
        width: 100%;
        max-width: 520px;
        height: min(860px, 96vh);
        max-height: 860px;
        z-index: ${WIDGET_CONFIG.zIndex} !important;
        border: none;
        border-radius: 0 !important;
        overflow: hidden !important;
        background-color: transparent;
        opacity: 0;
        transform: scale(0.95);
        transition: opacity 0.2s ease, transform 0.2s ease, height 0.2s ease;
      }
      .${WIDGET_CONFIG.overlayClass}.active #${WIDGET_CONFIG.iframeId} {
        opacity: 1;
        transform: scale(1);
      }
      @media (max-width: 768px) {
        ${
          IS_EN_WIDGET
            ? `
        .${WIDGET_CONFIG.buttonClass}.${EN_LAUNCHER_MODIFIER} {
          padding: 9px 14px 9px 16px;
          font-size: 10px;
          letter-spacing: 0.18em;
        }
        .${WIDGET_CONFIG.buttonClass}.${EN_LAUNCHER_MODIFIER}:hover {
          padding-right: 20px;
        }
        .${WIDGET_CONFIG.buttonClass}.${EN_LAUNCHER_MODIFIER} .virtual-fitting-button-star {
          font-size: 8px;
        }
        `
            : `
        .${WIDGET_CONFIG.buttonClass} {
          height: ${shopConfig.button.height - 3}px;
          font-size: ${shopConfig.button.font_size - 1}px;
        }
        `
        }
        .${WIDGET_CONFIG.overlayClass} {
          align-items: flex-end;
          justify-content: center;
        }
        #${WIDGET_CONFIG.iframeId} {
          max-width: 100%;
          width: 100%;
          height: 100vh;
          height: 100dvh;
          max-height: none;
          border-radius: 0 !important;
          overflow: hidden !important;
          opacity: 1;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
        .${WIDGET_CONFIG.overlayClass}.active #${WIDGET_CONFIG.iframeId} {
          transform: translateY(0);
        }
      }
      /* Minimizer: свёрнутое состояние и кнопка L */
      .${WIDGET_CONFIG.overlayClass}.active #${WIDGET_CONFIG.iframeId} {
        transition: width 0.4s cubic-bezier(0.32, 0.72, 0, 1), height 0.4s cubic-bezier(0.32, 0.72, 0, 1), max-width 0.4s cubic-bezier(0.32, 0.72, 0, 1), max-height 0.4s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.4s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.3s ease, opacity 0.2s ease, transform 0.2s ease !important;
      }
      .${WIDGET_CONFIG.overlayClass}.${MINIMIZED_CLASS} {
        align-items: flex-end !important;
        justify-content: flex-end !important;
        padding: 20px !important;
        background: rgba(0, 0, 0, 0) !important;
        pointer-events: none !important;
      }
      .${WIDGET_CONFIG.overlayClass}.${MINIMIZED_CLASS} #${WIDGET_CONFIG.iframeId} {
        pointer-events: none !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        max-width: 0 !important;
        max-height: 0 !important;
      }
      #${TOGGLE_BTN_ID} {
        position: fixed;
        z-index: 2147483647;
        display: none;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 72px;
        right: 20px;
        bottom: 20px;
        padding: 0;
        border: 2px solid #0a0a0a;
        border-radius: 0;
        background: rgba(255, 255, 255, 0.94);
        color: #0a0a0a;
        cursor: pointer;
        pointer-events: auto;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 4px 28px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      }
      #${TOGGLE_BTN_ID}:hover {
        background: rgba(250, 250, 250, 0.98);
        transform: scale(1.05);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14), 0 2px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1);
      }
      #${TOGGLE_BTN_ID} .virtual-fitting-toggle-letter {
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1;
      }
      #${TOGGLE_BTN_ID} .virtual-fitting-toggle-check {
        font-size: 2rem;
        font-weight: 700;
        line-height: 1;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      #${TOGGLE_BTN_ID} .virtual-fitting-toggle-cross {
        font-size: 2.25rem;
        font-weight: 300;
        line-height: 1;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      #${TOGGLE_BTN_ID} .virtual-fitting-toggle-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 18px;
        height: 18px;
        background: #ef4444;
        border-radius: 0;
        border: 2px solid rgba(255, 255, 255, 0.95);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      }
      #${TOGGLE_BTN_ID}.virtual-fitting-toggle--attention {
        animation: virtual-fitting-pulse 2s ease-in-out infinite;
      }
      #${TOGGLE_BTN_ID}.virtual-fitting-toggle--attention .virtual-fitting-toggle-check,
      #${TOGGLE_BTN_ID}.virtual-fitting-toggle--attention .virtual-fitting-toggle-cross {
        animation: virtual-fitting-check-pop 0.4s ease-out;
      }
      @keyframes virtual-fitting-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.06); opacity: 0.95; }
      }
      @keyframes virtual-fitting-check-pop {
        0% { opacity: 0; transform: scale(0.5); }
        100% { opacity: 1; transform: scale(1); }
      }
      #${TOGGLE_BTN_ID}.virtual-fitting-toggle--generating {
        border-radius: 0;
      }
      #${TOGGLE_BTN_ID} .virtual-fitting-toggle-spinner-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
      }
      #${TOGGLE_BTN_ID} .virtual-fitting-toggle-spinner-svg {
        animation: virtual-fitting-spinner-rotate 1.7s linear infinite;
      }
      @keyframes virtual-fitting-spinner-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @media (max-width: 768px) {
        #${TOGGLE_BTN_ID} { right: 16px; bottom: 16px; width: 64px; height: 64px; }
        #${TOGGLE_BTN_ID}.virtual-fitting-toggle--generating { border-radius: 0; }
        #${TOGGLE_BTN_ID} .virtual-fitting-toggle-spinner-svg { width: 28px; height: 28px; }
        #${TOGGLE_BTN_ID} .virtual-fitting-toggle-letter { font-size: 1.75rem; }
        #${TOGGLE_BTN_ID} .virtual-fitting-toggle-check { font-size: 1.75rem; }
        #${TOGGLE_BTN_ID} .virtual-fitting-toggle-cross { font-size: 2rem; }
        #${TOGGLE_BTN_ID} .virtual-fitting-toggle-badge { width: 16px; height: 16px; top: 2px; right: 2px; }
      }
    `;
    document.head.appendChild(style);
  }

  function createOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = WIDGET_CONFIG.overlayClass;

    document.body.appendChild(overlay);
    return overlay;
  }

  function createIframe() {
    if (iframe) return iframe;

    iframe = document.createElement("iframe");
    iframe.id = WIDGET_CONFIG.iframeId;
    // TEMP: sandbox removed for GA4 debug
    // iframe.setAttribute(
    //   "sandbox",
    //   "allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads",
    // );
    iframe.setAttribute(
      "allow",
      "camera; microphone; web-share; clipboard-read; clipboard-write",
    );

    const container = createOverlay();
    container.appendChild(iframe);

    return iframe;
  }

  function postMessageToIframe(data) {
    if (!iframe || !iframe.contentWindow) return;

    const targetOrigin = getWidgetOrigin();
    iframe.contentWindow.postMessage(data, targetOrigin);
  }

  function textOrEmpty(value) {
    if (value == null) return "";
    return String(value).replace(/\s+/g, " ").trim();
  }

  function normalizeForKeywordMatch(value) {
    return textOrEmpty(value).toLocaleLowerCase("ru-RU");
  }

  function readTextBySelectors(root, selectors) {
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const el = root.querySelector(selector);
      if (!el) continue;
      const text = textOrEmpty(el.textContent);
      if (text) return text;
    }
    return "";
  }

  function readTextBySelectorsFromContexts(contexts, selectors) {
    for (let i = 0; i < contexts.length; i++) {
      const ctx = contexts[i];
      if (!ctx || !ctx.querySelector) continue;
      const value = readTextBySelectors(ctx, selectors);
      if (value) return value;
    }
    return "";
  }

  function getAttrValue(el, attrName) {
    if (!el || !attrName) return "";
    return textOrEmpty(el.getAttribute(attrName));
  }

  function extractUrlFromBackground(backgroundValue) {
    if (!backgroundValue || backgroundValue === "none") return "";
    const match = backgroundValue.match(/url\((['"]?)(.*?)\1\)/i);
    return match ? textOrEmpty(match[2]) : "";
  }

  function resolveImageSourceFromElement(imageElement) {
    if (!imageElement) return "";

    const directCandidates = [
      imageElement.currentSrc,
      imageElement.src,
      imageElement.getAttribute("src"),
      imageElement.getAttribute("data-src"),
      imageElement.getAttribute("data-original"),
      imageElement.getAttribute("data-lazy"),
      imageElement.getAttribute("data-img-zoom-url"),
      imageElement.getAttribute("data-image"),
    ];

    for (let i = 0; i < directCandidates.length; i++) {
      const candidate = textOrEmpty(directCandidates[i]);
      if (candidate) return candidate;
    }

    const inlineBg = extractUrlFromBackground(imageElement.style && imageElement.style.backgroundImage);
    if (inlineBg) return inlineBg;

    const computedBg = extractUrlFromBackground(window.getComputedStyle(imageElement).backgroundImage);
    if (computedBg) return computedBg;

    return "";
  }

  function readImageCandidateAttr(el) {
    const candidate = getAttrValue(el, WIDGET_CONFIG.imageAttribute);
    if (!candidate) return "";
    if (candidate === "true") return "";
    return candidate;
  }

  function getOpenCardRoot(contextElement) {
    const context = contextElement && contextElement.nodeType === 1 ? contextElement : document;
    if (context.matches && context.matches(WIDGET_CONFIG.openCardSelector)) {
      return context;
    }
    if (context.closest) {
      const closest = context.closest(WIDGET_CONFIG.openCardSelector);
      if (closest) return closest;
    }
    return document.querySelector(WIDGET_CONFIG.openCardSelector);
  }

  function isElementVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }
    return true;
  }

  function resolveOpenProductElement(contextElement) {
    const roots = [];
    const context = contextElement && contextElement.nodeType === 1 ? contextElement : null;
    const openRoot = getOpenCardRoot(contextElement);
    if (openRoot) roots.push(openRoot);

    if (context && context.closest) {
      const contextualRoot = context.closest(
        ".js-store-prod-all, .js-catalog-prod-all, .js-product-single-wrapper, .t-store__prod-popup, .t-catalog__prod-popup, .t-catalog__product-popup, .t-popup_show, .js-store-product, .js-catalog-product, .js-catalog-desktop-custom-gallery, .t-store__product-snippet, .t-catalog__product-snippet",
      );
      if (contextualRoot && roots.indexOf(contextualRoot) === -1) {
        roots.push(contextualRoot);
      }
    }

    for (let r = 0; r < roots.length; r++) {
      const root = roots[r];
      if (!root || !isElementVisible(root)) continue;

      for (let i = 0; i < WIDGET_CONFIG.openCardProductSelectors.length; i++) {
        const selector = WIDGET_CONFIG.openCardProductSelectors[i];
        if (root.matches && root.matches(selector)) {
          return root;
        }
        const nested = root.querySelector(selector);
        if (nested) return nested;
      }

      if (isLikelyProductPopupContext(root)) {
        return root;
      }
    }

    // Fallback для Tilda: иногда в открытой карточке нет class-маркера show,
    // но есть активный слайд товара.
    const activeSlideImage = document.querySelector(
      ".t-store__prod-popup .t-slds__item_active .js-product-img, .t-catalog__prod-popup .t-slds__item_active .js-product-img, " +
      ".t-store__prod-popup .t-slds__item_active .t-bgimg, .t-catalog__prod-popup .t-slds__item_active .t-bgimg, " +
      ".t-store__prod-popup .t-slds__item_active .t-slds__bgimg, .t-catalog__prod-popup .t-slds__item_active .t-slds__bgimg, " +
      ".t-popup_show .t-store__prod-popup .t-slds__item_active .js-product-img, .t-popup_show .t-catalog__prod-popup .t-slds__item_active .js-product-img, " +
      ".t-popup_show .t-store__prod-popup .t-slds__item_active .t-bgimg, .t-popup_show .t-catalog__prod-popup .t-slds__item_active .t-bgimg, " +
      ".t-popup_show .t-store__prod-popup .t-slds__item_active .t-slds__bgimg, .t-popup_show .t-catalog__prod-popup .t-slds__item_active .t-slds__bgimg, " +
      ".t-popup_show .t-slds__item_active .js-product-img, .t-popup_show .t-slds__item_active .t-bgimg, .t-popup_show .t-slds__item_active .t-slds__bgimg, " +
      ".js-store-product .t-slds__item_active .js-product-img, .js-catalog-product .t-slds__item_active .js-product-img, " +
      ".js-store-product .t-slds__item_active .t-bgimg, .js-catalog-product .t-slds__item_active .t-bgimg, " +
      ".js-store-product .t-slds__item_active .t-slds__bgimg, .js-catalog-product .t-slds__item_active .t-slds__bgimg, " +
      ".t-store__product-snippet .t-slds__item_active .js-product-img, .t-catalog__product-snippet .t-slds__item_active .js-product-img, " +
      ".t-store__product-snippet .t-slds__item_active .t-bgimg, .t-catalog__product-snippet .t-slds__item_active .t-bgimg, " +
      ".t-store__product-snippet .t-slds__item_active .t-slds__bgimg, .t-catalog__product-snippet .t-slds__item_active .t-slds__bgimg, " +
      ".js-store-prod-all .t-slds__item_active .js-product-img, .js-catalog-prod-all .t-slds__item_active .js-product-img, " +
      ".js-store-prod-all .t-slds__item_active .t-bgimg, .js-catalog-prod-all .t-slds__item_active .t-bgimg, " +
      ".js-store-prod-all .t-slds__item_active .t-slds__bgimg, .js-catalog-prod-all .t-slds__item_active .t-slds__bgimg, " +
      ".t-popup_show .js-catalog-desktop-custom-gallery .t-img, .t-popup_show .js-catalog-product .js-catalog-desktop-custom-gallery .t-img, " +
      ".js-catalog-product .js-catalog-desktop-custom-gallery .t-img, .js-catalog-product .t-slds__main .t-img",
    );

    if (activeSlideImage && isElementVisible(activeSlideImage)) {
      const activeSliderContext = activeSlideImage.closest(
        ".js-store-prod-all, .js-catalog-prod-all, .js-product-single-wrapper, .t-store__prod-popup, .t-catalog__prod-popup, .t-store__prod-popup__slider, .t-catalog__prod-popup__slider, .t-slds__items-wrapper, .t-popup_show, .js-store-product, .js-catalog-product, .js-catalog-desktop-custom-gallery, .t-store__product-snippet, .t-catalog__product-snippet",
      );
      if (
        activeSliderContext &&
        isElementVisible(activeSliderContext) &&
        isLikelyProductPopupContext(activeSliderContext)
      ) {
        return activeSliderContext;
      }
    }

    return null;
  }

  function isLikelyProductPopupContext(element) {
    if (!element || !element.closest) return false;

    const popupContext = element.closest(
      ".t-store__prod-popup, .t-catalog__prod-popup, .t-catalog__product-popup, .js-store-prod-all, .js-catalog-prod-all, .js-product-single-wrapper, .t-popup_show, .js-store-product, .js-catalog-product, .js-catalog-desktop-custom-gallery, .t-store__product-snippet, .t-catalog__product-snippet",
    );
    if (!popupContext) return false;

    const storeContainerHint =
      (popupContext.matches &&
        popupContext.matches(".t-store__prod-popup, .t-catalog__prod-popup, .t-catalog__product-popup, .js-store-prod-all, .js-catalog-prod-all, .js-product-single-wrapper, .js-store-product, .js-catalog-product, .js-catalog-desktop-custom-gallery, .t-store__product-snippet, .t-catalog__product-snippet")) ||
      Boolean(
        popupContext.querySelector(
          ".t-store__prod-popup, .t-catalog__prod-popup, .t-catalog__product-popup, .js-store-prod-all, .js-catalog-prod-all, .js-product-single-wrapper, .js-store-product, .js-catalog-product, .js-catalog-desktop-custom-gallery, .t-store__product-snippet, .t-catalog__product-snippet",
        ),
      );

    const productMeta = popupContext.querySelector(
      ".js-product-name, .js-product-price, .js-store-prod-name, .js-catalog-prod-name, .js-store-prod-price-val, .js-catalog-prod-price-val, .t-store__prod-popup__title, .t-catalog__prod-popup__name, .t-store__prod-popup__price, .t-catalog__prod-popup__price, [data-product-price], [data-price]",
    );

    const productSliderSignals = popupContext.querySelector(
      ".t-store__prod-popup__slider, .t-catalog__prod-popup__slider, .t-slds__item_active .js-product-img, .t-slds__item_active .t-bgimg, .t-slds__imgwrapper[data-img-zoom-url], .t-slds__item [data-img-zoom-url], " +
      ".js-catalog-desktop-custom-gallery .t-img, .js-catalog-desktop-custom-gallery img, .js-catalog-product .js-catalog-desktop-custom-gallery .t-img, .js-catalog-product .t-slds__main .t-img, .js-catalog-product .t-slds__main img",
    );

    const activeProductSliderSignals = popupContext.querySelector(
      ".t-slds__item_active .t-slds__imgwrapper[data-img-zoom-url] .js-product-img, .t-slds__item_active .t-slds__imgwrapper[data-img-zoom-url] .t-bgimg, .t-slds__item_active .t-slds__imgwrapper[data-img-zoom-url] .t-slds__bgimg",
    );

    return Boolean(productMeta || activeProductSliderSignals || (storeContainerHint && productSliderSignals));
  }

  function hasOpenProductPopup() {
    return Boolean(resolveOpenProductElement(document));
  }

  function hasTildaPopupStructure(contextElement) {
    const context = contextElement && contextElement.nodeType === 1 ? contextElement : document;
    const tildaPopupSelectors = [
      ".t-store__prod-popup",
      ".t-catalog__prod-popup",
      ".t-catalog__product-popup",
      ".t-popup",
      ".js-store-prod-all",
      ".js-catalog-prod-all",
      ".js-product-single-wrapper",
      ".js-store-product",
      ".js-catalog-product",
      ".js-catalog-desktop-custom-gallery",
      ".t-store__product-snippet",
      ".t-catalog__product-snippet",
    ];

    for (let i = 0; i < tildaPopupSelectors.length; i++) {
      const selector = tildaPopupSelectors[i];
      if (context.matches && context.matches(selector)) return true;
      if (context.querySelector && context.querySelector(selector)) return true;
    }

    return false;
  }

  function isTildaStorefront() {
    return Boolean(
      document.querySelector(
        ".t-store__card, .t-catalog__card, .t-store__parts-switch-wrapper, .t-catalog__parts-switch-wrapper, .t-store__prod-popup, .t-catalog__prod-popup, .t-catalog__product-popup, .js-store-prod-all, .js-catalog-prod-all, .js-product-single-wrapper, .js-store-product, .js-catalog-product, .js-catalog-desktop-custom-gallery, .js-catalog-has-new-parts-02-26, .t-store__product-snippet, .t-catalog__product-snippet",
      ),
    );
  }

  function isST305NContext() {
    for (let i = 0; i < WIDGET_CONFIG.st305nRootSelectors.length; i++) {
      if (document.querySelector(WIDGET_CONFIG.st305nRootSelectors[i])) {
        return true;
      }
    }
    return false;
  }

  function isOpenCardModeActive(contextElement) {
    if (!WIDGET_CONFIG.onlyOpenCardFirstImage) return false;
    return hasTildaPopupStructure(contextElement);
  }

  function isTildaPopupOnlyMode() {
    return WIDGET_CONFIG.onlyOpenCardFirstImage && isTildaStorefront();
  }

  function removeButtonsOutsideActiveProduct(activeProduct) {
    const buttons = document.querySelectorAll(`.${WIDGET_CONFIG.buttonClass}`);
    buttons.forEach((btn) => {
      if (!activeProduct || !activeProduct.contains(btn)) {
        btn.remove();
      }
    });
  }

  function isInKnownProductContainer(element) {
    if (!element || !element.closest) return false;
    for (let i = 0; i < WIDGET_CONFIG.productContainerSelectors.length; i++) {
      if (element.closest(WIDGET_CONFIG.productContainerSelectors[i])) {
        return true;
      }
    }
    if (isLikelyProductPopupContext(element)) {
      return true;
    }
    return false;
  }

  function isValidProductElement(productElement) {
    if (!productElement || productElement.nodeType !== 1) return false;
    if (productElement.hasAttribute("data-fitting-product")) return true;
    if (isLikelyProductPopupContext(productElement)) return true;

    for (let i = 0; i < WIDGET_CONFIG.productContainerSelectors.length; i++) {
      const selector = WIDGET_CONFIG.productContainerSelectors[i];
      if (productElement.matches && productElement.matches(selector)) {
        return true;
      }
    }

    return false;
  }

  function isInsideOpenCard(element) {
    if (!element || !element.closest) return false;
    return Boolean(element.closest(WIDGET_CONFIG.openCardSelector));
  }

  function resolveFirstPhotoElement(contextElement) {
    const openRoot =
      getOpenCardRoot(contextElement) ||
      (contextElement && contextElement.nodeType === 1 ? contextElement : null);
    if (!openRoot) return null;

    for (let i = 0; i < WIDGET_CONFIG.firstPhotoSelectors.length; i++) {
      const selector = WIDGET_CONFIG.firstPhotoSelectors[i];
      const candidate = openRoot.querySelector(selector);
      if (candidate && resolveImageSourceFromElement(candidate)) {
        return candidate;
      }
    }

    return resolveImageElement(openRoot);
  }

  function shouldRenderForProduct(productElement) {
    if (shouldExcludeByProductName(productElement)) return false;

    if (isTildaPopupOnlyMode()) {
      const activeProductInPopup = resolveOpenProductElement(document);
      return Boolean(activeProductInPopup && activeProductInPopup === productElement);
    }

    if (!isOpenCardModeActive(productElement)) return true;
    const activeProduct = resolveOpenProductElement(productElement);
    return Boolean(activeProduct && activeProduct === productElement);
  }

  function resolveImageElement(productElement) {
    if (!productElement) return null;

    if (productElement.matches) {
      for (let i = 0; i < WIDGET_CONFIG.imageSelectors.length; i++) {
        const selector = WIDGET_CONFIG.imageSelectors[i];
        if (productElement.matches(selector) && resolveImageSourceFromElement(productElement)) {
          return productElement;
        }
      }
    }

    for (let i = 0; i < WIDGET_CONFIG.imageSelectors.length; i++) {
      const selector = WIDGET_CONFIG.imageSelectors[i];
      const candidates = productElement.querySelectorAll(selector);
      for (let j = 0; j < candidates.length; j++) {
        const candidate = candidates[j];
        if (candidate.closest && candidate.closest("." + WIDGET_CONFIG.buttonClass)) continue;
        if (resolveImageSourceFromElement(candidate) && isInKnownProductContainer(candidate)) {
          return candidate;
        }
      }
    }

    return null;
  }

  function resolveButtonHostElement(targetImageElement, productElement) {
    /**
     * Shopify Horizon: на document в capture вешается делегат `on:click` (component.js).
     * Он делает target.closest('[on:click]') — у zoom это сам slideshow-slide.
     * Если кнопка примерки лежит внутри слайда, зум открывается раньше любых
     * слушателей на кнопке; stopPropagation на кнопке бессилен. Хост — media-gallery.
     */
    if (targetImageElement && targetImageElement.closest) {
      const zoomSlide = targetImageElement.closest("slideshow-slide");
      if (
        zoomSlide &&
        zoomSlide.hasAttribute &&
        zoomSlide.hasAttribute("on:click")
      ) {
        const gallery = targetImageElement.closest("media-gallery");
        if (gallery) return gallery;
      }
    }

    // Для слайдеров крепим к стабильному viewport-контейнеру, а не к active-item
    // и не к длинному .t-slds__items-wrapper.
    const stableSliderContainer =
      (targetImageElement && targetImageElement.closest && targetImageElement.closest(
        ".t-store__prod-popup__slider, .t-catalog__prod-popup__slider, .t-slds, .t-slds__main, .t-slds__container, .js-catalog-desktop-custom-gallery",
      )) ||
      null;

    if (stableSliderContainer) {
      return stableSliderContainer;
    }

    const preferredContainer =
      (targetImageElement && targetImageElement.closest && targetImageElement.closest(
        ".t-slds__imgwrapper, .t-store__prod-popup__imgwrapper, .t-catalog__prod-popup__imgwrapper, .js-catalog-desktop-custom-gallery, [data-fitting-image-container]",
      )) ||
      null;

    if (preferredContainer) {
      return preferredContainer;
    }

    if (targetImageElement && targetImageElement.parentNode) {
      return targetImageElement.parentNode;
    }

    return productElement;
  }

  function getProductDataContexts(productElement) {
    const contexts = [];
    const seen = new Set();

    function pushContext(ctx) {
      if (!ctx || !ctx.nodeType || seen.has(ctx)) return;
      seen.add(ctx);
      contexts.push(ctx);
    }

    pushContext(productElement);
    pushContext(resolveOpenProductElement(productElement));
    pushContext(getOpenCardRoot(productElement));
    if (productElement && productElement.closest) {
      pushContext(productElement.closest(".js-store-prod-all, .js-catalog-prod-all, .js-product-single-wrapper, .t-store__prod-popup, .t-catalog__prod-popup"));
    }

    return contexts;
  }

  function resolveProductName(productElement, imageElement) {
    const contexts = getProductDataContexts(productElement);

    const attrName = getAttrValue(productElement, WIDGET_CONFIG.nameAttribute);
    if (attrName) return attrName;

    const selectorName = readTextBySelectorsFromContexts(contexts, WIDGET_CONFIG.nameSelectors);
    if (selectorName) return selectorName;

    const alt = imageElement ? textOrEmpty(imageElement.getAttribute("alt")) : "";
    if (alt) return alt;

    return "";
  }

  function extractDescriptionOnly(fullText) {
    if (!fullText) return "";
    let text = fullText.trim();
    let cutIndex = text.length;
    for (const marker of WIDGET_CONFIG.descriptionCutMarkers) {
      const idx = text.indexOf(marker);
      if (idx !== -1 && idx < cutIndex) {
        cutIndex = idx;
      }
    }
    return text.substring(0, cutIndex).trim();
  }

  function resolveProductDescription(productElement) {
    const contexts = [...getProductDataContexts(productElement), document];
    for (const selector of WIDGET_CONFIG.descriptionSelectors) {
      for (const ctx of contexts) {
        if (!ctx) continue;
        const el = ctx.querySelector ? ctx.querySelector(selector) : null;
        if (el && el.textContent) {
          const cleaned = extractDescriptionOnly(el.textContent);
          if (cleaned) return cleaned;
        }
      }
    }
    return "";
  }

  function resolveProductPrice(productElement) {
    const contexts = getProductDataContexts(productElement);

    const attrPrice = getAttrValue(productElement, WIDGET_CONFIG.priceAttribute);
    if (attrPrice) return attrPrice;

    const selectorPrice = readTextBySelectorsFromContexts(contexts, WIDGET_CONFIG.priceSelectors);
    if (selectorPrice) return selectorPrice;

    for (let i = 0; i < contexts.length; i++) {
      const ctx = contexts[i];
      const dataPrice =
        getAttrValue(ctx, "data-price") ||
        getAttrValue(ctx, "data-product-price");
      if (dataPrice) return dataPrice;
    }

    return "";
  }

  function shouldExcludeByProductName(productElement) {
    const keywords = WIDGET_CONFIG.excludedProductNameKeywords || [];
    if (!keywords.length) return false;

    const imageElement = resolveImageElement(productElement);
    const productName = normalizeForKeywordMatch(resolveProductName(productElement, imageElement));
    if (!productName) return false;

    for (let i = 0; i < keywords.length; i++) {
      const keyword = normalizeForKeywordMatch(keywords[i]);
      if (!keyword) continue;
      if (productName.includes(keyword)) {
        return true;
      }
    }

    return false;
  }

  function hydrateProductElement(productElement) {
    if (!productElement) return;

    // В Tilda popup-режиме избегаем мутаций DOM, чтобы не ломать навигацию блоков.
    if (isTildaPopupOnlyMode()) {
      return;
    }

    if (!productElement.hasAttribute("data-fitting-product")) {
      productElement.setAttribute("data-fitting-product", "true");
    }

    const imageElement = resolveImageElement(productElement);
    if (imageElement && !imageElement.hasAttribute(WIDGET_CONFIG.imageAttribute)) {
      imageElement.setAttribute(WIDGET_CONFIG.imageAttribute, "true");
    }

    if (!productElement.hasAttribute(WIDGET_CONFIG.nameAttribute)) {
      const name = resolveProductName(productElement, imageElement);
      if (name && name !== "Product") {
        productElement.setAttribute(WIDGET_CONFIG.nameAttribute, name);
      }
    }

    if (!productElement.hasAttribute(WIDGET_CONFIG.priceAttribute)) {
      const price = resolveProductPrice(productElement);
      if (price) {
        productElement.setAttribute(WIDGET_CONFIG.priceAttribute, price);
      }
    }
  }

  function collectProducts(rootNode) {
    const root = rootNode && rootNode.nodeType === 1 ? rootNode : document;
    const products = [];
    const seen = new Set();

    for (let i = 0; i < WIDGET_CONFIG.productSelectors.length; i++) {
      const selector = WIDGET_CONFIG.productSelectors[i];
      const elements = root.querySelectorAll(selector);
      for (let j = 0; j < elements.length; j++) {
        const el = elements[j];
        if (!seen.has(el) && isValidProductElement(el)) {
          seen.add(el);
          products.push(el);
        }
      }
    }

    return products;
  }

  function processProducts(rootNode) {
    debugLog("processProducts:start", {
      isTildaPopupOnlyMode: isTildaPopupOnlyMode(),
      rootNodeType: rootNode && rootNode.nodeType,
    });

    if (isTildaPopupOnlyMode()) {
      const activeProduct = resolveOpenProductElement(document) || resolveFallbackProductElement();
      if (!activeProduct) {
        debugLog("processProducts:no-active-product");
        if (!hasOpenProductPopup()) {
          removeButtonsOutsideActiveProduct(null);
        }
        return 0;
      }
      debugLog("processProducts:active-product-found");
      removeButtonsOutsideActiveProduct(activeProduct);
      hydrateProductElement(activeProduct);
      scheduleCreateButton(activeProduct);
      return 1;
    }

    if (isOpenCardModeActive(rootNode)) {
      const activeProduct = resolveOpenProductElement(rootNode);
      removeButtonsOutsideActiveProduct(activeProduct);
      if (!activeProduct) return 0;
      hydrateProductElement(activeProduct);
      scheduleCreateButton(activeProduct);
      return 1;
    }

    const products = collectProducts(rootNode);
    products.forEach((product) => {
      if (!shouldRenderForProduct(product)) return;
      hydrateProductElement(product);
      scheduleCreateButton(product);
    });
    return products.length;
  }

  function resolveFallbackProductElement() {
    return (
      document.querySelector(".t-popup_show .js-store-prod-all") ||
      document.querySelector(".t-popup_show .js-catalog-prod-all") ||
      document.querySelector(".t-popup_show .js-catalog-product") ||
      document.querySelector(".t-popup_show .t-catalog__product-popup") ||
      document.querySelector(".t-popup_show .js-product-single-wrapper") ||
      document.querySelector(".t-popup_show .t-store__prod-popup") ||
      document.querySelector(".t-popup_show .t-catalog__prod-popup") ||
      document.querySelector(".js-store-product") ||
      document.querySelector(".js-catalog-product") ||
      document.querySelector(".t-store__product-snippet") ||
      document.querySelector(".t-catalog__product-snippet") ||
      document.querySelector(".js-store-prod-all") ||
      document.querySelector(".js-catalog-prod-all") ||
      document.querySelector(".js-product-single-wrapper") ||
      document.querySelector(".t-store__prod-popup") ||
      document.querySelector(".t-catalog__prod-popup") ||
      null
    );
  }

  function scheduleProcessProducts() {
    if (productsProcessQueued || productsProcessTimer) return;
    productsProcessQueued = true;
    productsProcessTimer = window.setTimeout(() => {
      productsProcessQueued = false;
      productsProcessTimer = null;
      processProducts(document);
    }, 90);
  }

  function scheduleCreateButton(productElement) {
    if (!productElement) return;
    debugLog("scheduleCreateButton", {
      tildaMode: isTildaPopupOnlyMode(),
    });

    if (!isTildaPopupOnlyMode()) {
      createButton(productElement);
      return;
    }

    // Рендерим сразу, чтобы не пропустить момент после открытия карточки.
    createButton(productElement);

    if (buttonRenderTimer) {
      window.clearTimeout(buttonRenderTimer);
      buttonRenderTimer = null;
    }

    buttonRenderTimer = window.setTimeout(() => {
      buttonRenderTimer = null;
      const stableProduct = resolveOpenProductElement(document) || productElement;
      debugLog("scheduleCreateButton:delayed-render");
      createButton(stableProduct);
    }, BUTTON_RENDER_DELAY_MS);
  }

  function startStartupRenderRecheck() {
    if (startupRenderInterval) {
      window.clearInterval(startupRenderInterval);
      startupRenderInterval = null;
    }

    let attempts = 0;
    const maxAttempts = 20; // ~6 секунд при интервале 300мс

    startupRenderInterval = window.setInterval(() => {
      attempts += 1;
      scheduleProcessProducts();

      // Если в Tilda-режиме кнопка уже на месте — завершаем раньше.
      if (isTildaPopupOnlyMode()) {
        const hasPopupButton = document.querySelector(
          `.${WIDGET_CONFIG.buttonClass}[${PRODUCT_BTN_ATTR}="true"]`,
        );
        if (hasPopupButton) {
          window.clearInterval(startupRenderInterval);
          startupRenderInterval = null;
          return;
        }
      }

      if (attempts >= maxAttempts) {
        window.clearInterval(startupRenderInterval);
        startupRenderInterval = null;
      }
    }, 300);
  }

  function startST305NReloadRecheck() {
    if (!isST305NContext()) return;

    if (st305nReloadTimers.length) {
      st305nReloadTimers.forEach((timerId) => window.clearTimeout(timerId));
      st305nReloadTimers = [];
    }

    for (let i = 0; i < ST305N_RELOAD_STEPS_MS.length; i++) {
      const delay = ST305N_RELOAD_STEPS_MS[i];
      const timerId = window.setTimeout(() => {
        scheduleProcessProducts();
      }, delay);
      st305nReloadTimers.push(timerId);
    }
  }

  function openWidget(productData) {
    if (isWidgetSessionActive()) {
      showActiveSessionModal();
      return;
    }

    currentProduct = productData;

    // Создаём iframe если ещё не создан
    const widgetIframe = createIframe();

    // Формируем URL с параметрами
    const params = new URLSearchParams({
      embedded: "true",
      shopToken: WIDGET_CONFIG.shopToken,
      product: encodeURIComponent(
        JSON.stringify({
          image: productData.image,
          name: productData.name,
          price: productData.price,
          external_id: productData.external_id,
        }),
      ),
    });
    const baseUrl = WIDGET_CONFIG.widgetUrl.replace(/\/$/, "");
    widgetIframe.src = `${baseUrl}/?${params.toString()}`;

    // Даём браузеру время отрендерить элементы перед анимацией
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";
      });
    });
  }

  function closeWidget() {
    dismissSessionModal();
    generationInProgress = false;
    if (overlay) {
      overlay.classList.remove("active");
      overlay.classList.remove("active_processing");
      overlay.classList.remove(MINIMIZED_CLASS);
      document.body.style.overflow = "";
    }
    updateMinimizerButton(false, null);

    // Ждём окончания анимации перед очисткой iframe
    setTimeout(function () {
      if (iframe) {
        iframe.src = "about:blank";
      }
    }, 150);

    currentProduct = null;
  }

  function isWidgetSessionActive() {
    if (!overlay) return false;
    return (
      overlay.classList.contains("active") ||
      overlay.classList.contains("active_processing") ||
      overlay.classList.contains(MINIMIZED_CLASS)
    );
  }

  function ensureSessionModalStyles() {
    if (document.getElementById(SESSION_MODAL_STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = SESSION_MODAL_STYLE_ID;
    style.textContent =
      "#" +
      SESSION_MODAL_ROOT_ID +
      " { position:fixed; inset:0; z-index:" +
      SESSION_MODAL_Z_INDEX +
      "; display:flex; align-items:center; justify-content:center; padding:20px; box-sizing:border-box; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; -webkit-font-smoothing:antialiased; } " +
      "#" +
      SESSION_MODAL_ROOT_ID +
      " .looksy-vf-session-modal__backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.55); cursor:pointer; } " +
      "#" +
      SESSION_MODAL_ROOT_ID +
      " .looksy-vf-session-modal__panel { position:relative; z-index:1; width:100%; max-width:420px; background:#fff; color:#0a0a0a; padding:28px 24px 22px; box-shadow:0 16px 48px rgba(0,0,0,0.22); box-sizing:border-box; display:flex; flex-direction:column; align-items:stretch; } " +
      "#" +
      SESSION_MODAL_ROOT_ID +
      " .looksy-vf-session-modal__text { margin:0 0 22px; font-size:15px; line-height:1.5; font-weight:400; text-align:left; } " +
      "#" +
      SESSION_MODAL_ROOT_ID +
      " .looksy-vf-session-modal__ok { align-self:center; display:inline-flex; align-items:center; justify-content:center; min-width:120px; padding:12px 20px; border:none; background:#0a0a0a; color:#fff; font-size:14px; font-weight:600; cursor:pointer; } " +
      "#" +
      SESSION_MODAL_ROOT_ID +
      " .looksy-vf-session-modal__ok:hover { opacity:0.92; } " +
      "#" +
      SESSION_MODAL_ROOT_ID +
      " .looksy-vf-session-modal__ok:focus { outline:2px solid #0a0a0a; outline-offset:2px; } ";
    document.head.appendChild(style);
  }

  function dismissSessionModal() {
    var root = document.getElementById(SESSION_MODAL_ROOT_ID);
    if (root && root.parentNode) {
      root.parentNode.removeChild(root);
    }
    if (sessionModalEscapeHandler) {
      document.removeEventListener("keydown", sessionModalEscapeHandler);
      sessionModalEscapeHandler = null;
    }
  }

  function showActiveSessionModal() {
    if (document.getElementById(SESSION_MODAL_ROOT_ID)) return;
    ensureSessionModalStyles();
    var copy = IS_EN_WIDGET ? SESSION_MODAL_COPY_EN : SESSION_MODAL_COPY_RU;

    var root = document.createElement("div");
    root.id = SESSION_MODAL_ROOT_ID;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");

    var backdrop = document.createElement("div");
    backdrop.className = "looksy-vf-session-modal__backdrop";
    backdrop.addEventListener("click", dismissSessionModal);

    var panel = document.createElement("div");
    panel.className = "looksy-vf-session-modal__panel";
    panel.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    var p = document.createElement("p");
    p.className = "looksy-vf-session-modal__text";
    p.textContent = copy.message;

    var ok = document.createElement("button");
    ok.type = "button";
    ok.className = "looksy-vf-session-modal__ok";
    ok.textContent = copy.ok;
    ok.addEventListener("click", function (e) {
      e.preventDefault();
      dismissSessionModal();
    });

    panel.appendChild(p);
    panel.appendChild(ok);
    root.appendChild(backdrop);
    root.appendChild(panel);
    document.body.appendChild(root);

    sessionModalEscapeHandler = function (ev) {
      if (ev.key === "Escape" || ev.key === "Esc") {
        ev.preventDefault();
        dismissSessionModal();
      }
    };
    document.addEventListener("keydown", sessionModalEscapeHandler);

    window.setTimeout(function () {
      try {
        ok.focus();
      } catch (e) {}
    }, 0);
  }

  function isTildaSingleColor(productElement) {
    // Tilda помечает опцию цвета атрибутом data-edition-option-id (проверено на текущих партнерах миэндми туматч)
    var colorSelectors = [
      '[data-edition-option-id="Цвет"] select',
      '[data-edition-option-id="Color"] select',
      '[data-edition-option-id="Colour"] select',
    ];

    var context = (productElement && productElement.closest &&
      productElement.closest(".t-store__prod-popup, .t-catalog__prod-popup, .js-store-prod-all, .js-catalog-prod-all, .js-product-single-wrapper")) ||
      document;

    for (var i = 0; i < colorSelectors.length; i++) {
      var sel = context.querySelector(colorSelectors[i]);
      if (!sel) sel = document.querySelector(colorSelectors[i]);
      if (sel) return sel.options.length <= 1;
    }

    return false;
  }

  function findFirstImage(productElement) {
    var selectors = WIDGET_CONFIG.firstPhotoSelectors;
    for (var i = 0; i < selectors.length; i++) {
      var el = (productElement && productElement.querySelector(selectors[i])) ||
               document.querySelector(selectors[i]);
      if (el) {
        var src = resolveImageSourceFromElement(el);
        if (src) return src;
      }
    }
    return null;
  }

  function findCurrentImage(productElement) {
    const containerRect = productElement.getBoundingClientRect();
    if (containerRect.width === 0 && containerRect.height === 0) return null;

    var activeSlide = productElement.querySelector(".t-slds__item_active");
    var candidates = (activeSlide || productElement).querySelectorAll("img, .t-bgimg, .t-slds__bgimg, .js-product-img, [data-original], [data-src]");
    var bestSrc = null;
    var bestArea = 0;

    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (el.closest && el.closest("." + WIDGET_CONFIG.buttonClass)) continue;

      var src = resolveImageSourceFromElement(el);
      if (!src) continue;

      if (el.style && el.style.opacity === "0") continue;

      var rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      var intersects =
        rect.right > containerRect.left &&
        rect.left < containerRect.right &&
        rect.bottom > containerRect.top &&
        rect.top < containerRect.bottom;

      if (!intersects) continue;

      var area = rect.width * rect.height;
      if (area > bestArea) {
        bestArea = area;
        bestSrc = src;
      }
    }

    return bestSrc;
  }

  function extractProductData(productElement) {
    const imageElement = resolveImageElement(productElement);

    if (!imageElement) {
      console.warn("Virtual Fitting: Image not found in product element");
      return null;
    }

    const imageSrc =
      readImageCandidateAttr(productElement) ||
      readImageCandidateAttr(imageElement) ||
      ((!isTildaPopupOnlyMode() && isTildaSingleColor(productElement)) ? findFirstImage(productElement) : findCurrentImage(productElement)) ||
      resolveImageSourceFromElement(imageElement);
    const name = resolveProductName(productElement, imageElement) || "Product";
    const price = resolveProductPrice(productElement);

    if (!imageSrc) {
      console.warn("Virtual Fitting: Image source not found");
      return null;
    }

    const description = resolveProductDescription(productElement);
    const externalId = productElement.getAttribute("data-fitting-id") || undefined;

    return {
      image: imageSrc,
      name: name,
      price: price,
      description: description || undefined,
      external_id: externalId,
      extendedProductData: extractExtendedProductData(),
    };
  }

  function createButton(productElement) {
    if (!shouldRenderForProduct(productElement)) return;
    if (!isValidProductElement(productElement)) return;
    debugLog("createButton:initialized");

    const existingButton = isTildaPopupOnlyMode()
      ? document.querySelector(`.${WIDGET_CONFIG.buttonClass}[${PRODUCT_BTN_ATTR}="true"]`)
      : productElement.querySelector(`.${WIDGET_CONFIG.buttonClass}`);

    const button = document.createElement("button");
    button.className = IS_EN_WIDGET
      ? WIDGET_CONFIG.buttonClass + " " + EN_LAUNCHER_MODIFIER
      : WIDGET_CONFIG.buttonClass;
    button.type = "button";
    if (isTildaPopupOnlyMode()) {
      button.setAttribute(PRODUCT_BTN_ATTR, "true");
    }

    var customIconUrl = shopConfig.button.icon_url;
    if (customIconUrl) {
      const icon = document.createElement("img");
      icon.src = customIconUrl;
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");
      var iconSize = shopConfig.button.icon_size || 18;
      icon.style.width = iconSize + "px";
      icon.style.height = iconSize + "px";
      icon.style.objectFit = "contain";
      icon.style.flexShrink = "0";
      var ix = shopConfig.button.icon_offset_x || 0;
      var iy = shopConfig.button.icon_offset_y || 0;
      if (ix !== 0 || iy !== 0) {
        icon.style.transform = "translate(" + ix + "px, " + iy + "px)";
      }
      button.appendChild(icon);
    } else if (IS_EN_WIDGET) {
      const star = document.createElement("span");
      star.className = "virtual-fitting-button-star";
      star.setAttribute("aria-hidden", "true");
      star.textContent = "\u2726";
      button.appendChild(star);
    } else {
      const icon = document.createElement("img");
      icon.src = WIDGET_CONFIG.iconUrl;
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");
      button.appendChild(icon);
    }

    var bx = shopConfig.button.offset_x || 0;
    var by = shopConfig.button.offset_y || 0;
    if (bx !== 0 || by !== 0) {
      button.style.transform = "translate(" + bx + "px, " + (-by) + "px)";
    }

    const text = document.createTextNode(shopConfig.button.text);
    button.appendChild(text);

    /** Shopify Horizon: полноэкранный zoom-слой рядом с кнопкой — без этого тап может открыть и виджет, и zoom. */
    function stopGestureBubbleToGallery(e) {
      e.stopPropagation();
    }
    ["pointerdown", "touchstart", "touchend", "mousedown"].forEach(function (type) {
      button.addEventListener(type, stopGestureBubbleToGallery, true);
    });

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") {
        e.stopImmediatePropagation();
      }

      const effectiveProduct = isTildaPopupOnlyMode()
        ? (resolveOpenProductElement(document) || productElement)
        : productElement;
      const productData = extractProductData(effectiveProduct);
      if (productData) {
        openWidget(productData);
      }
    });

    if (
      tryRenderButtonInCustomSlot({
        productElement: productElement,
        button: button,
        existingButton: existingButton,
      })
    ) {
      return;
    }

    const imageElement = productElement.querySelector(
      WIDGET_CONFIG.imageSelector,
    );
    const firstPhotoElement =
      isOpenCardModeActive(productElement) ? resolveFirstPhotoElement(productElement) : null;
    const targetImageElement = firstPhotoElement || imageElement || resolveImageElement(productElement);
    if (targetImageElement && targetImageElement.parentNode) {
      if (!isInKnownProductContainer(targetImageElement)) return;
      const hostElement = resolveButtonHostElement(targetImageElement, productElement);
      const hostStyle = window.getComputedStyle(hostElement);
      if (hostStyle.position === "static") {
        hostElement.style.position = "relative";
      }

      // Если кнопка уже есть, переносим её в нужный контейнер активного фото.
      if (existingButton) {
        if (existingButton.parentNode !== hostElement) {
          hostElement.appendChild(existingButton);
          debugLog("createButton:moved-existing");
        }
        return;
      }

      hostElement.appendChild(button);
      debugLog("createButton:appended-new");
    } else {
      if (existingButton) return;
      productElement.appendChild(button);
      debugLog("createButton:appended-fallback");
    }
  }

  function initButtons() {
    const count = processProducts(document);
    console.log(`Virtual Fitting: Initialized ${count} buttons`);
  }

  function setupMessageListener() {
    const widgetOrigin = getWidgetOrigin();

    window.addEventListener("message", (event) => {
      // Проверяем что сообщение пришло от нашего виджета
      if (event.origin !== widgetOrigin) return;

      const message = event.data || {};
      const { type, source, request_id, payload } = message;

      switch (type) {
        case "CLOSE_WIDGET":
          closeWidget();
          break;

        case "WIDGET_READY":
          if (currentProduct) {
            postMessageToIframe({
              type: "PRODUCT_DATA",
              product: currentProduct,
            });
          }
          postMessageToIframe({
            type: "SHOP_CONFIG",
            config: shopConfig.iframe,
          });
          break;

        case "REQUEST_PRODUCT":
          if (currentProduct) {
            postMessageToIframe({
              type: "PRODUCT_DATA",
              product: currentProduct,
            });
          }
          break;

        case "PRESS_ADD_TO_CART_BTN":
          if (source && source !== "looksy-widget") return;
          if (!request_id) {
            debugLog("PRESS_ADD_TO_CART_BTN: missing request_id");
            break;
          }
          dispatchAddToCartRequest(payload || {}, request_id);
          break;

        case "PROCESSING":
          generationInProgress = true;
          if (overlay) {
            overlay.classList.add("active_processing");
            if (overlay.classList.contains(MINIMIZED_CLASS)) {
              updateMinimizerButton(true, null);
            }
          }
          break;
          
        case "MINIMIZE_WIDGET":
          minimizeWidget();
          break;
        case "EXPAND_WIDGET":
          expandWidget();
          break;
        case "GENERATION_READY":
          generationInProgress = false;
          if (overlay) {
            overlay.classList.remove("active_processing");
            if (overlay.classList.contains(MINIMIZED_CLASS)) {
              triggerMinimizerAttention(false);
            }
          }
          break;
        case "GENERATION_ERROR":
          generationInProgress = false;
          if (overlay) {
            overlay.classList.remove("active_processing");
            if (overlay.classList.contains(MINIMIZED_CLASS)) {
              triggerMinimizerAttention(true);
            }
          }
          break;

          
        default:
          break;
      }
    });
  }

  function observeDOM() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type !== "childList") return;

        let shouldReprocess = false;
        mutation.addedNodes.forEach((node) => {
          if (shouldReprocess || node.nodeType !== 1) return;
          const el = node;
          if (
            (el.matches && el.matches(
              ".t-popup_show, .t-store__prod-popup, .t-store__prod-popup_showed, .t-catalog__prod-popup, .t-catalog__prod-popup_showed, .js-store-prod-all, .js-catalog-prod-all, .js-product-single-wrapper, .t-slds__item, .t-slds__items-wrapper, .t-slds__imgwrapper, .js-product-img, .t-bgimg, .js-catalog-desktop-custom-gallery, .t-img",
            )) ||
            (el.querySelector && el.querySelector(
              ".t-popup_show, .t-store__prod-popup, .t-store__prod-popup_showed, .t-catalog__prod-popup, .t-catalog__prod-popup_showed, .js-store-prod-all, .js-catalog-prod-all, .js-product-single-wrapper, .t-slds__item, .t-slds__items-wrapper, .t-slds__imgwrapper, .js-product-img, .t-bgimg, .js-catalog-desktop-custom-gallery, .t-img",
            ))
          ) {
            shouldReprocess = true;
          }
        });

        if (shouldReprocess) {
          scheduleProcessProducts();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    processProducts(document);
    startStartupRenderRecheck();
    startST305NReloadRecheck();

    window.addEventListener("pageshow", function () {
      startStartupRenderRecheck();
      startST305NReloadRecheck();
    });

    document.addEventListener("click", function () {
      scheduleProcessProducts();
    }, true);

    // На некоторых Tilda-слайдерах активный слайд меняется без клика,
    // поэтому ловим завершение трансформации/анимации.
    document.addEventListener("transitionend", function (e) {
      const target = e.target;
      if (!target || !target.closest) return;
      if (target.closest(".t-slds__items-wrapper, .t-slds__item, .t-slds__imgwrapper")) {
        scheduleProcessProducts();
      }
    }, true);

    document.addEventListener("animationend", function (e) {
      const target = e.target;
      if (!target || !target.closest) return;
      if (target.closest(".t-slds__items-wrapper, .t-slds__item, .t-slds__imgwrapper")) {
        scheduleProcessProducts();
      }
    }, true);
  }

  function initWidget() {
    createStyles();
    initButtons();
    setupMessageListener();
    observeDOM();
  }

  function init() {
    createMinimizerButton();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        loadShopConfig().then(initWidget);
      });
    } else {
      loadShopConfig().then(initWidget);
    }
  }
  
  // ============================================================================
  // EXTENDED PRODUCT DATA ADAPTERS
  // ============================================================================
  //
  // Optional extra product data extraction.
  //
  // Main code only calls:
  //
  // extendedProductData: extractExtendedProductData()
  //
  // The function reads data-adapter from the current script tag.
  // If data-adapter="bitrix_v1", it reads Bitrix/Intec product data from DOM.
  // If adapter is missing or extraction fails, it returns null.
  //
  // This block must stay isolated at the bottom of the file.
  // ============================================================================

  // Reads the data-adapter attribute from the Looksy script tag,
  // which tells us which shop platform's DOM structure to parse.
  function getLooksyAdapterName() {
    const script =
      document.currentScript ||
      document.querySelector("script[data-shop-token]");

    return script?.getAttribute("data-adapter") || "";
  }

  // Entry point for extended product data extraction.
  // Picks the right extractor based on the configured adapter,
  // or falls back to the Bitrix extractor when debug mode is enabled
  // via the ?popnshop_debug=true URL parameter.
  // Returns null if no adapter matches or extraction throws.
  function extractExtendedProductData() {
    try {
      const adapter = getLooksyAdapterName();

      if (adapter === "bitrix_v1") {
        return extractBitrixV1ExtendedProductData();
      }

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("popnshop_debug") === "true") {
        return extractBitrixV1ExtendedProductData();
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  function extractBitrixV1ExtendedProductData() {
    const root = document.querySelector(
      ".c-catalog-element[data-data][data-properties]"
    );

    if (!root) return null;

    let productData = null;
    let properties = null;

    try {
      productData = JSON.parse(root.getAttribute("data-data"));
      properties = JSON.parse(root.getAttribute("data-properties"));
    } catch (error) {
      return null;
    }

    if (!productData || !Array.isArray(properties)) return null;

    const offers = productData.offers || {};
    const offerFromUrl = new URLSearchParams(window.location.search).get("offer");

    const selectedOffer =
      (offerFromUrl && offers[offerFromUrl]) ||
      Object.values(offers).find((offer) => offer?.available) ||
      Object.values(offers)[0] ||
      null;

    if (!selectedOffer) return null;

    const variants = properties
      .map((property) => ({
        code: property.code,
        name: property.name,
        type: property.type || null,
        values: Object.entries(property.values || {})
          .filter(([id, value]) => (
            id !== "0" &&
            value &&
            value.id !== 0 &&
            value.name !== "-" &&
            value.stub !== true
          ))
          .map(([id, value]) => ({
            id: String(id),
            name: value.name,
            picture: value.picture || null,
          })),
      }))
      .filter((property) => property.values.length > 0);

    // Full map of every offer (SKU) and the exact variant combination it
    // represents, so the widget can resolve the target offer_id itself when
    // the user switches a variant — then send that offer_id back to us to add.
    const extractOfferPrice = (offer) => {
      const price = (offer.prices && offer.prices[0]) || null;
      if (!price) return null;
      const source =
        price.discount && price.discount.use ? price.discount : price.base;
      if (!source) return null;
      return { value: source.value, display: source.display || null };
    };

    const offerList = Object.values(offers).map((offer) => ({
      id: String(offer.id),
      values: offer.values || {},
      available: !!offer.available,
      price: extractOfferPrice(offer),
    }));

    const result = {
      product_id: String(productData.id),
      variants,
      selected: selectedOffer.values || {},
      offers: offerList,
    };

    console.log("[Looksy] extendedProductData", result);

    return result;
  }

  // ============================================================================
  // END EXTENDED PRODUCT DATA ADAPTERS
  // ============================================================================

  // ============================================================================
  // CUSTOM BUTTON SLOT PLACEMENT
  // ============================================================================
  //
  // Optional manual placement for the Try On button.
  //
  // Public HTML API:
  //
  //   <div data-fitting-button-slot></div>
  //   <div data-fitting-button-slot data-fitting-full-width="true"></div>
  //
  // If a slot exists inside the current product context, the SDK renders or
  // moves the Try On button into that slot and skips the default absolute
  // image placement.
  // ============================================================================

  const BUTTON_SLOT_SELECTOR = "[data-fitting-button-slot]";
  const BUTTON_SLOT_CLASS = "virtual-fitting-button-slot";
  const BUTTON_FULL_WIDTH_CLASS = "virtual-fitting-button-full-width";
  const FULL_WIDTH_ATTR = "data-fitting-full-width";

  function isCustomSlotButtonDebugEnabled() {
    try {
      return new URLSearchParams(window.location.search).get("slot_button_debug") === "true";
    } catch (e) {
      return false;
    }
  }

  function isTruthyFittingAttribute(value) {
    if (value == null) return false;

    var normalized = String(value).trim().toLowerCase();
    return normalized === "" || normalized === "true" || normalized === "1" || normalized === "yes";
  }

  function getButtonSlotContexts(productElement) {
    var contexts = [];
    var seen = [];

    function pushContext(ctx) {
      if (!ctx || !ctx.nodeType) return;
      if (ctx === document || ctx === document.body || ctx === document.documentElement) return;
      if (seen.indexOf(ctx) !== -1) return;
      seen.push(ctx);
      contexts.push(ctx);
    }

    pushContext(productElement);
    pushContext(resolveOpenProductElement(productElement));
    pushContext(getOpenCardRoot(productElement));

    if (productElement && productElement.closest) {
      pushContext(
        productElement.closest(
          ".js-store-prod-all, .js-catalog-prod-all, .js-product-single-wrapper, .t-store__prod-popup, .t-catalog__prod-popup, .js-store-product, .js-catalog-product, .t-store__product-snippet, .t-catalog__product-snippet",
        ),
      );
    }

    return contexts;
  }

  function resolveButtonSlotElement(productElement) {
    var contexts = getButtonSlotContexts(productElement);

    for (var i = 0; i < contexts.length; i++) {
      var ctx = contexts[i];
      if (!ctx || !ctx.querySelector) continue;

      var slot = ctx.querySelector(BUTTON_SLOT_SELECTOR);
      if (slot) return slot;
    }

    return null;
  }

  function applyCustomSlotButtonClasses(button, slotElement) {
    if (!button) return;

    button.classList.add(BUTTON_SLOT_CLASS);
    button.classList.toggle(BUTTON_FULL_WIDTH_CLASS, isTruthyFittingAttribute(slotElement && slotElement.getAttribute(FULL_WIDTH_ATTR)));
  }

  function removeCustomSlotButtonClasses(button) {
    if (!button) return;

    button.classList.remove(BUTTON_SLOT_CLASS);
    button.classList.remove(BUTTON_FULL_WIDTH_CLASS);
  }

  function tryRenderButtonInCustomSlot(args) {
    var productElement = args.productElement;
    var button = args.button;
    var existingButton = args.existingButton;

    if (!isCustomSlotButtonDebugEnabled()) {
      if (existingButton) {
        removeCustomSlotButtonClasses(existingButton);
      }
      return false;
    }

    var slotElement = resolveButtonSlotElement(productElement);

    if (!slotElement) {
      if (existingButton) {
        removeCustomSlotButtonClasses(existingButton);
      }
      return false;
    }

    var targetButton = existingButton || button;
    applyCustomSlotButtonClasses(targetButton, slotElement);

    if (targetButton.parentNode !== slotElement) {
      slotElement.appendChild(targetButton);
    }

    return true;
  }

  // ============================================================================
  // END CUSTOM BUTTON SLOT PLACEMENT
  // ============================================================================

  // ============================================================================
  // ADD TO CART BRIDGE
  // ============================================================================

  const ADD_TO_CART_RESPONSE_TIMEOUT_MS = 15000;

  function sendAddToCartResult(requestId, success, message) {
    console.log("[Looksy] add-to-cart result -> iframe", {
      request_id: requestId,
      success: !!success,
      message: message || undefined,
    });
    postMessageToIframe({
      source: "looksy-sdk",
      type: "PRESS_ADD_TO_CART_BTN_RESULT",
      request_id: requestId,
      success: !!success,
      message: message || undefined,
    });
  }

  function dispatchAddToCartRequest(payload, requestId) {
    let responded = false;

    console.log("[Looksy] add-to-cart request <- iframe", {
      request_id: requestId,
      payload,
    });

    const reply = function (result) {
      if (responded) return;
      responded = true;
      console.log("[Looksy] add-to-cart reply <- parent", {
        request_id: requestId,
        success: !!(result && result.success),
        message: result && result.message ? String(result.message) : undefined,
      });
      sendAddToCartResult(
        requestId,
        !!(result && result.success),
        result && result.message ? String(result.message) : "",
      );
    };

    // Global safety net: if the handler never settles, fail closed so the
    // iframe is not left waiting forever.
    window.setTimeout(function () {
      if (responded) return;
      reply({
        success: false,
        message: "Add-to-cart handler did not respond",
      });
    }, ADD_TO_CART_RESPONSE_TIMEOUT_MS);

    try {
      performBitrixV1AddToCart(payload || {}, reply);
    } catch (error) {
      debugLog("add-to-cart handler failed", error);
      reply({
        success: false,
        message: "Add-to-cart handler threw an error",
      });
    }
  }

  // Performs add-to-cart on Bitrix/Intec storefronts (e.g. popnshop.ru).
  //
  // Intec renders a basket control for every offer:
  //   <div class="intec-ui intec-ui-control-basket-button"
  //        data-basket-id="<offerId>" data-basket-action="add"
  //        data-basket-state="none"> ... </div>
  //
  // Intec binds its own click handler to that element and runs the real
  // basket AJAX request (correct session, CSRF, stock checks, etc.). While
  // the request is in flight it sets data-basket-state="processing"; on
  // success the state becomes a terminal in-basket value ("basket"), on
  // failure it reverts to "none".
  //
  // We don't reimplement their AJAX — we drive their own button with the
  // offer_id coming from the iframe and watch data-basket-state to learn the
  // outcome, then report it back through `reply`.
  //
  // The widget already knows the full offer map (sent in extendedProductData),
  // so it resolves the variant combination to a concrete offer_id itself and
  // sends just that offer_id here.
  function performBitrixV1AddToCart(payload, reply) {
    const offerId = String(payload.offer_id || "").trim();

    if (!offerId) {
      reply({
        success: false,
        message: "offer_id is missing in payload",
      });
      return;
    }

    const button = document.querySelector(
      '.intec-ui-control-basket-button[data-basket-id="' +
        offerId +
        '"][data-basket-action="add"]',
    );

    if (!button) {
      reply({
        success: false,
        message: "Add-to-cart button not found for offer " + offerId,
      });
      return;
    }

    const currentState = function () {
      return button.getAttribute("data-basket-state") || "none";
    };
    // Intec uses "none" (not in basket) and "processing" (request in flight);
    // any other terminal value means the offer is in the basket.
    const isInBasket = function (state) {
      return state !== "none" && state !== "processing";
    };

    // Already in the basket — treat as success without re-adding.
    if (isInBasket(currentState())) {
      reply({ success: true, message: "Already in basket" });
      return;
    }

    let settled = false;
    let timer = null;
    const observer = new MutationObserver(function () {
      const state = currentState();
      if (state === "processing") return; // still in flight, keep waiting

      if (isInBasket(state)) {
        settle(true, "");
      } else {
        // Reverted to "none" => Intec rejected it (out of stock, error, ...).
        settle(false, "Item was not added to basket");
      }
    });

    function settle(success, message) {
      if (settled) return;
      settled = true;
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
      reply({ success: success, message: message });
    }

    observer.observe(button, {
      attributes: true,
      attributeFilter: ["data-basket-state"],
    });

    // If Intec never settles the state, fall back to whatever it ended on.
    timer = window.setTimeout(function () {
      const inBasket = isInBasket(currentState());
      settle(inBasket, inBasket ? "" : "Add-to-cart timed out");
    }, ADD_TO_CART_RESPONSE_TIMEOUT_MS - 1000);

    // Trigger Intec's own add-to-cart flow.
    button.click();
  }

  // ============================================================================
  // END ADD TO CART BRIDGE
  // ============================================================================

  window.VirtualFitting = {
    open: openWidget,
    close: closeWidget,
    init: initButtons,
  };

  init();
})();
