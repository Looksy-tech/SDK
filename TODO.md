# TODO

## Рефакторинг передачи данных в iframe

- [ ] **Дублирование fetch shopConfig** — `script.js` (loadShopConfig, ~line 315) и виджет (`useShopConfig` в hooks.ts:166) оба делают запрос к одному эндпоинту `/widget/config?shop_token=...`. Проверить, можно ли убрать fetch из `script.js` и обработчик `SHOP_CONFIG` в виджете, оставив только прямой fetch внутри iframe.

- [ ] **Лишняя передача product через URL** — данные товара (image, name, price, description) сейчас кодируются в URL iframe (`?product=...`). При длинном description или URL картинки можно упереться в лимит ~2000 символов. postMessage надёжен (виджет шлёт WIDGET_READY только после подписки на слушатель, race condition исключён). Рассмотреть переход на передачу product только через postMessage, в URL оставить только `shopToken`.
