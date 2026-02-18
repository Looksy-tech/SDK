(function () {
  "use strict";

  // =====================================================
  // НАСТРОЙКИ ДЛЯ БЫСТРОГО РЕДАКТИРОВАНИЯ
  // =====================================================
  const WIDGET_URL = "https://test-widget.looksy.tech";
  const ICON_URL = "https://s3.regru.cloud/test-looksy/try_on_icon.png";
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
        background: rgba(0, 0, 0, 0.8);
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
      document.body.style.overflow = "";
    }

    // Ждём окончания анимации перед очисткой iframe
    setTimeout(() => {
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
          
        case "GENERATION_READY":
          overlay.classList.remove("active_processing");
          overlay.addEventListener('click', overlayListenerFn)
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
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
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
