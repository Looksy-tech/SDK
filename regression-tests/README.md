# Looksy SDK regression tests

Этот harness проверяет, что локальный `script/script.js` по-прежнему находит товары на сохранённых страницах магазинов, добавляет кнопки примерки, открывает iframe виджета и передаёт ожидаемый product payload.

Главная идея: мы берём **реальные страницы клиентов**, замораживаем их один раз (HTML + все ассеты верстки в HAR) и потом гоняем по ним текущий `script/script.js` полностью офлайн. Так регрессия ловит именно поломки **нашего скрипта** (кнопки пропали / сдвинулись / не кликаются / iframe не тот / payload изменился), а не то, что клиент поменял у себя на сайте.

## Быстрый сценарий

```bash
# один раз после установки зависимостей
npm install
npx playwright install

# добавить или поменять URL страниц
vim regression-tests/pages.config.json

# захватить HTML фикстуры и первичные baselines
npm run regression:capture

# после правок в script/script.js: быстрый автоматический прогон в терминале.
# Команда сама проходит все enabled фикстуры, сравнивает кнопки, скриншоты и payload с baselines.
# Ничего не обновляет; если есть отличие, команда падает и пишет, какой файл/страница не совпали.
# Replay полностью офлайн (ассеты берутся из HAR), каждая пара страница×viewport — отдельный
# тест; по умолчанию до 6 тестов параллельно.
npm run regression:test

# интерактивный режим для разбора падений.
# Открывает Playwright UI: можно выбрать конкретный тест, запустить его отдельно,
# посмотреть шаги, скриншоты, trace и понять, что именно изменилось.
# Обычно запускается после падения regression:test, а не вместо него.
# UI использует те же тесты и тоже может запускать несколько страниц параллельно.
npm run regression:ui

# принять намеренно изменившееся поведение
npm run regression:update
```

Параллельность задаётся вверху `regression-tests/playwright.config.js` в константе `PARALLEL_STORE_WORKERS`.

## Где добавлять страницы

Список страниц лежит в `regression-tests/pages.config.json`.

Основные поля:

- `name`: уникальное имя фикстуры, безопасное для имени папки.
- `url`: реальный URL страницы.
- `enabled`: участвует ли страница в capture/test.
- `viewports`: `desktop`, `mobile` или оба.
- `scriptAttrs`: атрибуты, которые нужно принудительно добавить на локальный SDK при replay.
- `clickButtons`: индексы кнопок `.virtual-fitting-button`, которые надо кликнуть.
- `buttonBoxTolerancePx`: необязательный допуск координат кнопок в пикселях. Дефолт — 8 px. Так как replay теперь офлайн и детерминированный, координаты обычно совпадают точь-в-точь, и этот допуск почти никогда не нужен.
- `checkButtonPosition`: если `false`, проверяются количество/текст кнопок, но не их координаты. После перехода на HAR layout стабилен, поэтому это нужно только в редких случаях, когда сам клиентский скрипт рисует кнопку в нестабильном месте.
- `preservePageScripts`: если `true`, при replay сохраняются сторонние `<script>` страницы (и в HAR остаётся записанный JS). По умолчанию `false`: все скрипты страницы вырезаются, в HAR хранятся только ассеты верстки.
- `captureBlockResourceTypes`: необязательный список Playwright resource types, которые нужно abort во время capture для конкретной тяжёлой страницы. Полезно, когда replay всё равно вырезает скрипты страницы, а запись JS/XHR в HAR делает capture нестабильным.
- `notes`: комментарий для человека.

Если статичная фикстура страницы стабильно проверяет появление кнопок, но не может открыть iframe без runtime-состояния CMS, можно поставить `"clickButtons": []`. Тогда replay сохранит `buttons.json` и скриншоты страницы/кнопок, но пропустит widget-open и product payload проверки для этой страницы.

В конфиге уже есть 3 выключенных placeholder-примера: локальный пример, Popnshop / Bitrix и Tilda. Ниже них добавлены реальные страницы из задачи.

Для Popnshop / Bitrix страниц обычно нужно:

```json
"scriptAttrs": {
  "data-adapter": "bitrix_popnshop_v1"
}
```

## Как работает capture

`npm run regression:capture` открывает каждый enabled URL в Playwright (в отдельном контексте с записью HAR), ждёт стабилизации страницы, сохраняет финальный HTML, metadata и HAR со всеми ассетами верстки:

```txt
regression-tests/fixtures/<page-name>/page.html
regression-tests/fixtures/<page-name>/meta.json
regression-tests/fixtures/<page-name>/har/network.har   # + content-addressed файлы ассетов рядом
```

В `meta.json` сохраняются исходный URL, время захвата, найденный Looksy script tag и его `data-*` атрибуты. Если на странице нет Looksy script tag, replay использует fallback `data-shop-token="regression-test-token"`.

HAR пишется в режиме `content: "attach"`: тела ответов лежат отдельными файлами рядом с `network.har`. Сразу после записи HAR обрезается до ассетов, влияющих на верстку (CSS, шрифты, картинки) — сторонний JS/JSON/HTML выкидываются, потому что при replay все скрипты страницы всё равно вырезаются. Это держит размер фикстуры в разумных пределах (обычно несколько МБ на страницу). Тяжёлая media (видео/аудио) и сокеты не записываются вовсе.

После сохранения HTML capture сразу прогоняет локальный SDK по этой фикстуре и создаёт baselines:

```txt
regression-tests/baselines/<page-name>/<viewport>/
  02-buttons.png
  03-widget-opened-button-0.png
  buttons.json
  iframe.json
  product-payloads.json
```

## Папки и артефакты

`regression-tests/fixtures/` — сохранённые страницы, из которых потом запускается replay.

```txt
fixtures/<page-name>/
  page.html         # HTML, снятый с реального URL во время regression:capture
  meta.json         # исходный URL, дата capture, найденные data-* атрибуты Looksy script
  har/network.har   # записанные ассеты верстки (CSS/шрифты/картинки), которыми replay кормит страницу офлайн
```

Эта папка отвечает на вопрос: "На какой сохранённой версии страницы мы тестируем SDK?". Обычно `fixtures` коммитятся, чтобы тесты не зависели от того, как реальный магазин изменится завтра.

`regression-tests/baselines/` — эталонное ожидаемое поведение SDK на фикстурах.

```txt
baselines/<page-name>/<viewport>/
  02-buttons.png                 # страница после инициализации SDK и появления кнопок
  03-widget-opened-button-0.png  # виджет после клика по кнопке, если clickButtons не пустой
  buttons.json                   # количество, текст и координаты кнопок
  iframe.json                    # src/visibility iframe после открытия виджета
  product-payloads.json          # PRODUCT_DATA, полученный mock-widget
```

Эта папка отвечает на вопрос: "Что считается правильным результатом?". `regression:test` сравнивает текущий запуск с `baselines`. Если изменение поведения намеренное, `npm run regression:update` обновляет именно эту папку. Обычно `baselines` тоже коммитятся.

`regression-tests/latest/` — фактический результат последнего запуска.

```txt
latest/<page-name>/<viewport>/
  02-buttons.png
  03-widget-opened-button-0.png
  buttons.json
  iframe.json
  product-payloads.json
```

Эта папка отвечает на вопрос: "Что получилось сейчас?". Она нужна для ручного сравнения при падении: смотришь `latest` рядом с `baselines` и решаешь, это баг или ожидаемое изменение. `latest` не является источником истины и по умолчанию игнорируется git, кроме `.gitkeep`.

Дополнительно Playwright может создавать служебные папки:

- `regression-tests/test-results/` — trace, error context, actual/diff screenshots для упавших тестов.
- `regression-tests/playwright-report/` — HTML-отчёт Playwright.

Эти папки нужны только для локальной диагностики и не коммитятся.

## Как работает replay

`npm run regression:test` не загружает production SDK и не открывает реальный Looksy widget. Он работает полностью офлайн: все ассеты страницы (CSS, шрифты, картинки) отдаются из записанного `har/network.har` через `page.routeFromHAR(..., { notFound: "abort" })`. Реальная сеть на replay не используется вообще: если какой-то ассет не нашёлся в HAR, запрос обрывается, а не уходит в интернет. Поверх HAR висят свои роуты, которые подменяют `script.js`, `mock-widget.html` и сам fixture HTML.

Replay берёт сохранённый `page.html`, удаляет из него исходные `<script>` теги и вставляет локальный SDK:

```html
<script
  src="http://looksy-regression.local/script/script.js"
  data-shop-token="..."
  data-widget-url="http://looksy-regression.local/mock-widget.html"
></script>
```

Атрибуты из найденного реального script tag сохраняются, `scriptAttrs` из `pages.config.json` накладываются сверху, а `data-widget-url` всегда указывает на mock-widget.

Проверки:

- `.virtual-fitting-button` появился.
- Количество, текст и координаты кнопок совпадают с `buttons.json` с допуском 8 px.
- После двух повторных `window.VirtualFitting.init()` не появляются дубликаты кнопок.
- После клика появляется `.virtual-fitting-overlay`.
- Появляется `#virtual-fitting-iframe`.
- iframe открыт на `mock-widget.html`.
- mock-widget получил `PRODUCT_DATA`.
- Скриншоты совпадают с baseline.

Важно: страницы с `"clickButtons": []` проверяют только загрузку фикстуры, инициализацию SDK, появление/координаты кнопок и отсутствие дублей. Они не открывают iframe и не проверяют `PRODUCT_DATA`.

Для Bitrix/Popnshop `extendedProductData` есть отдельные стабильные тесты в `regression-tests/tests/adapter.spec.js`. Они не зависят от реального сайта: поднимают минимальную Bitrix DOM-фикстуру, подключают локальный `script/script.js`, кликают кнопку и проверяют три режима:

- `data-adapter="bitrix_popnshop_v1"` отправляет `extendedProductData`;
- `?popnshop_debug=true` без adapter тоже отправляет `extendedProductData`;
- без adapter и без `popnshop_debug=true` отправляется `extendedProductData: null`.

Там же есть contract-test для централизованного сценария: одна страница с несколькими товарами и одним `<script data-shop-token>`. Тест проверяет, что SDK создаёт отдельную кнопку для каждого товара, но использует один общий overlay/iframe, и что каждая кнопка открывает mock-widget с данными именно своего товара. Это защищает от регрессии, где вместо одного централизованного SDK-подключения случайно начинают плодиться отдельные скрипты/виджеты на каждый товар.

### `regression:test` или `regression:ui`

`npm run regression:test` — основная проверка после правок в `script/script.js`. Она запускается в headless-режиме, быстро даёт pass/fail и подходит для регулярной проверки перед коммитом.

`npm run regression:ui` — режим диагностики. Он открывает Playwright UI, где можно вручную перезапускать отдельные страницы, смотреть шаги теста, актуальные скриншоты, diff и trace. Эта команда удобна, когда `regression:test` уже упал и нужно понять причину.

Обе команды используют одни и те же фикстуры и baselines. Разница только в интерфейсе: `regression:test` — автоматическая проверка в терминале, `regression:ui` — интерактивный разбор.

### Параллельный запуск

Каждая пара страница×viewport — это отдельный Playwright-тест, поэтому desktop и mobile одной страницы тоже идут параллельно. По умолчанию запускается до 6 тестов одновременно.

Число параллельных воркеров задаётся вверху `regression-tests/playwright.config.js`:

```js
const PARALLEL_STORE_WORKERS = 6;
```

Replay офлайновый и упирается в CPU, так что это число можно держать высоким. Снижать (например до 2–3) есть смысл в основном ради `regression:capture`: он делит тот же worker count и ходит на реальные сайты, а слишком много одновременных браузеров может дать сетевые флейки или блокировки.

Свежие результаты каждого запуска пишутся сюда:

```txt
regression-tests/latest/<page-name>/<viewport>/
```

Их удобно сравнивать с `baselines`, когда тест падает.

## Mock widget

`regression-tests/public/mock-widget.html` имитирует iframe виджета без внешних ассетов.

Он:

- отправляет родителю `{ type: "WIDGET_READY" }`;
- принимает `PRODUCT_DATA` и `SHOP_CONFIG`;
- сохраняет их в `document.body.dataset.product` и `document.body.dataset.shopConfig`;
- рендерит стабильный текстовый UI для скриншотов;
- содержит кнопки для close, minimize, processing, ready, error и add-to-cart сценариев.

Базовый add-to-cart bridge уже можно расширить: mock-widget умеет отправлять `PRESS_ADD_TO_CART_BTN`, а SDK должен ответить `PRESS_ADD_TO_CART_BTN_RESULT`.

## Когда обновлять baselines

Обычный `regression:test` не должен менять baseline-файлы. Если тест упал после намеренного изменения SDK:

1. Открой `regression-tests/latest/...` и глазами проверь, что новое поведение правильное.
2. Запусти:

```bash
npm run regression:update
```

3. Закоммить обновлённые файлы из `regression-tests/baselines`.

После `regression:capture` обычно коммитятся:

- `regression-tests/fixtures/...`;
- `regression-tests/baselines/...`;
- изменения в `regression-tests/pages.config.json`, если добавлялись URL.

После обычного `regression:test` обычно ничего коммитить не нужно: он только проверяет и пишет диагностический `latest`.

## Просмотр фикстур

Список уже захваченных фикстур:

```bash
node regression-tests/scripts/list-fixtures.js
```

## Ограничения

- Фикстура замораживает страницу на момент capture: HTML + ассеты верстки в HAR. Replay офлайн и не зависит от сети, но и не увидит изменений, которые клиент внёс на сайт после capture — для этого нужно перезапустить `regression:capture`.
- В HAR попадают только CSS/шрифты/картинки; сторонний JS, JSON и media отбрасываются. Если включить `preservePageScripts`, JS останется в HAR (и фикстура станет тяжелее).
- HAR-зависимость: если реальный сайт отдаёт ассеты нестабильно (рандомные query, CDN-редиректы), часть запросов на replay может не найтись и оборваться. Это видно сразу на первом прогоне после capture; для статичных CSS/картинок такое редко.
- Replay специально удаляет исходные scripts страницы, чтобы тест был стабильнее и проверял только локальный SDK.
- `product-payloads.json` сравнивается строго. Если реальные сайты дают нестабильное форматирование, сравнение можно ослабить в `regression-tests/scripts/harness.js`.
- Capture реальных URL требует доступной сети и установленных браузеров Playwright.
