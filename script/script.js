(function () {
  "use strict";

  // =====================================================
  // НАСТРОЙКИ ДЛЯ БЫСТРОГО РЕДАКТИРОВАНИЯ
  // =====================================================
  const WIDGET_URL = "https://widget.looksy.tech";
  const ICON_URL = "https://s3.regru.cloud/looksy-widget/try_on.svg";
  const BUTTON_TEXT = "Примерить на себе";
  const Z_INDEX = 999999;
  // =====================================================

  // Получаем shopToken из data-атрибута текущего скрипта
  const currentScript = document.currentScript;
  const SHOP_TOKEN = currentScript?.getAttribute('data-shop-token') || '';

  if (!SHOP_TOKEN) {
    console.error('[Looksy] Missing data-shop-token attribute on script tag');
  }

  const WIDGET_CONFIG = {
    iframeId: "virtual-fitting-iframe",
    buttonClass: "virtual-fitting-button",
    overlayClass: "virtual-fitting-overlay",
    productSelector: "[data-fitting-product]",
    imageSelector: "img[data-fitting-image]",
    nameAttribute: "data-fitting-name",
    priceAttribute: "data-fitting-price",
    widgetUrl: WIDGET_URL,
    iconUrl: ICON_URL,
    buttonText: BUTTON_TEXT,
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

  const MINIMIZED_CLASS = "virtual-fitting-minimized";
  const TOGGLE_BTN_ID = "virtual-fitting-toggle-btn";
  const CONTAINER_ID = "virtual-fitting-minimizer";

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
  }

  function updateMinimizerButton(isMinimized, attentionState) {
    var btn = document.getElementById(TOGGLE_BTN_ID);
    if (!btn) return;
    btn.classList.toggle("virtual-fitting-toggle--minimized", isMinimized);
    btn.classList.toggle("virtual-fitting-toggle--attention", attentionState === "success" || attentionState === "error");
    if (attentionState === "success") {
      btn.innerHTML = '<span class="virtual-fitting-toggle-check">✓</span><span class="virtual-fitting-toggle-badge"></span>';
    } else if (attentionState === "error") {
      btn.innerHTML = '<span class="virtual-fitting-toggle-cross">×</span><span class="virtual-fitting-toggle-badge"></span>';
    } else if (isMinimized) {
      btn.innerHTML = '<span class="virtual-fitting-toggle-letter">L</span>';
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
      .${WIDGET_CONFIG.buttonClass} {
        position: absolute;
        right: 8px;
        bottom: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 8px;
        background: #323232;
        height: 37px;
        color: #fff;
        border: none;
        border-radius: 7px;
        font-size: 14px;
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
      .${WIDGET_CONFIG.overlayClass} {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0);
        z-index: ${WIDGET_CONFIG.zIndex};
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
        max-width: 700px;
        height: 90vh;
        max-height: 800px;
        border: none;
        border-radius: 12px;
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
        .${WIDGET_CONFIG.overlayClass} {
          align-items: flex-end;
          justify-content: center;
        }
        #${WIDGET_CONFIG.iframeId} {
          max-width: 100%;
          width: 100%;
          height: 95vh;
          height: 95dvh;
          max-height: none;
          border-radius: 20px 20px 0 0;
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
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 50%;
        background: rgba(99, 102, 241, 0.85);
        color: #fff;
        cursor: pointer;
        pointer-events: auto;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 4px 24px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      }
      #${TOGGLE_BTN_ID}:hover {
        background: rgba(99, 102, 241, 0.9);
        transform: scale(1.05);
        box-shadow: 0 6px 28px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25);
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
        border-radius: 50%;
        border: 2px solid #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
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
      @media (max-width: 768px) {
        #${TOGGLE_BTN_ID} { right: 16px; bottom: 16px; width: 64px; height: 64px; }
        #${TOGGLE_BTN_ID} .virtual-fitting-toggle-letter { font-size: 1.75rem; }
        #${TOGGLE_BTN_ID} .virtual-fitting-toggle-check { font-size: 1.75rem; }
        #${TOGGLE_BTN_ID} .virtual-fitting-toggle-cross { font-size: 2rem; }
        #${TOGGLE_BTN_ID} .virtual-fitting-toggle-badge { width: 16px; height: 16px; top: 2px; right: 2px; }
      }
    `;
    document.head.appendChild(style);
  }

  function overlayListenerFn(e) {
    if (e.target === overlay) {
      closeWidget();
    }
  }

  function createOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = WIDGET_CONFIG.overlayClass;

    overlay.addEventListener("click", overlayListenerFn);

    document.body.appendChild(overlay);
    return overlay;
  }

  function createIframe() {
    if (iframe) return iframe;

    iframe = document.createElement("iframe");
    iframe.id = WIDGET_CONFIG.iframeId;
    iframe.setAttribute(
      "sandbox",
      "allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads",
    );
    iframe.setAttribute("allow", "camera; microphone; web-share");

    const container = createOverlay();
    container.appendChild(iframe);

    return iframe;
  }

  function postMessageToIframe(data) {
    if (!iframe || !iframe.contentWindow) return;

    const targetOrigin = getWidgetOrigin();
    iframe.contentWindow.postMessage(data, targetOrigin);
  }

  function openWidget(productData) {
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

  function extractProductData(productElement) {
    const imageElement = productElement.querySelector(
      WIDGET_CONFIG.imageSelector,
    );

    if (!imageElement) {
      console.warn("Virtual Fitting: Image not found in product element");
      return null;
    }

    const imageSrc = imageElement.src || imageElement.getAttribute("data-src");
    const name =
      productElement.getAttribute(WIDGET_CONFIG.nameAttribute) ||
      imageElement.getAttribute("alt") ||
      "Product";
    const price =
      productElement.getAttribute(WIDGET_CONFIG.priceAttribute) || "";

    if (!imageSrc) {
      console.warn("Virtual Fitting: Image source not found");
      return null;
    }

    return {
      image: imageSrc,
      name: name,
      price: price,
    };
  }

  function createButton(productElement) {
    const existingButton = productElement.querySelector(
      `.${WIDGET_CONFIG.buttonClass}`,
    );
    if (existingButton) return;

    const button = document.createElement("button");
    button.className = WIDGET_CONFIG.buttonClass;
    button.type = "button";

    // Добавляем иконку
    const icon = document.createElement("img");
    icon.src = WIDGET_CONFIG.iconUrl;
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");
    button.appendChild(icon);

    // Добавляем текст
    const text = document.createTextNode(WIDGET_CONFIG.buttonText);
    button.appendChild(text);

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const productData = extractProductData(productElement);
      console.log("productData :>> ", productData);
      if (productData) {
        openWidget(productData);
      }
    });

    const imageElement = productElement.querySelector(
      WIDGET_CONFIG.imageSelector,
    );
    if (imageElement && imageElement.parentNode) {
      console.log("imageElement.nextSibling :>> ", imageElement.nextSibling);
      imageElement.parentNode.insertBefore(button, imageElement.nextSibling);
    } else {
      productElement.appendChild(button);
    }
  }

  function initButtons() {
    const products = document.querySelectorAll(WIDGET_CONFIG.productSelector);

    products.forEach((product) => {
      createButton(product);
    });

    console.log(`Virtual Fitting: Initialized ${products.length} buttons`);
  }

  function setupMessageListener() {
    const widgetOrigin = getWidgetOrigin();

    window.addEventListener("message", (event) => {
      // Проверяем что сообщение пришло от нашего виджета
      if (event.origin !== widgetOrigin) return;

      const { type, data } = event.data;

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
          break;

        case "REQUEST_PRODUCT":
          if (currentProduct) {
            postMessageToIframe({
              type: "PRODUCT_DATA",
              product: currentProduct,
            });
          }
          break;

        case "PROCESSING":
          overlay.classList.add("active_processing");
          overlay.removeEventListener('click', overlayListenerFn)
          break;
          
        case "MINIMIZE_WIDGET":
          minimizeWidget();
          break;
        case "EXPAND_WIDGET":
          expandWidget();
          break;
        case "GENERATION_READY":
          overlay.classList.remove("active_processing");
          overlay.addEventListener("click", overlayListenerFn);
          if (overlay.classList.contains(MINIMIZED_CLASS)) {
            triggerMinimizerAttention(false);
          }
          break;
        case "GENERATION_ERROR":
          overlay.classList.remove("active_processing");
          overlay.addEventListener("click", overlayListenerFn);
          if (overlay.classList.contains(MINIMIZED_CLASS)) {
            triggerMinimizerAttention(true);
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
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.matches && node.matches(WIDGET_CONFIG.productSelector)) {
              createButton(node);
            }
            const products =
              node.querySelectorAll &&
              node.querySelectorAll(WIDGET_CONFIG.productSelector);
            if (products) {
              products.forEach((product) => createButton(product));
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function init() {
    createMinimizerButton();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        createStyles();
        initButtons();
        setupMessageListener();
        observeDOM();
      });
    } else {
      createStyles();
      initButtons();
      setupMessageListener();
      observeDOM();
    }
  }
  

  window.VirtualFitting = {
    open: openWidget,
    close: closeWidget,
    init: initButtons,
  };

  init();
})();
