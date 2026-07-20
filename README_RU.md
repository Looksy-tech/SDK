# Виджет виртуальной примерки - Скрипт для интеграции

Встраиваемый скрипт для добавления функционала виртуальной примерки одежды на сайты e-commerce.

## Навигация

- [Быстрый старт](#быстрый-старт)
- [Data-атрибуты](#data-атрибуты)
- [Размещение кнопки отдельно от изображения](#размещение-кнопки-отдельно-от-изображения)
- [Принцип работы](#принцип-работы)
- [Примеры интеграции для популярных CMS](#примеры-интеграции-для-популярных-cms)
- [WooCommerce (WordPress)](#woocommerce-wordpress)
- [Shopify](#shopify)
- [Tilda](#tilda)
- [Вёрстка на чистом HTML/CSS/JS](#вёрстка-на-чистом-htmlcssjs)
- [React (для SPA)](#react-для-spa)
- [Vue.js](#vuejs)

## Быстрый старт

### 1. Подключение скрипта

Добавьте скрипт перед закрывающим тегом `</body>`:

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
></script>
```

### 2. Разметка продуктов

Добавьте data-атрибуты к элементам продуктов:

```html
<div
	class="product"
	data-fitting-product
	data-fitting-name="Название товара"
	data-fitting-price="2990 ₽"
>
	<img
		src="product.jpg"
		alt="Product"
		data-fitting-image
	/>
</div>
```

## Data-атрибуты

### Обязательные атрибуты

| Атрибут                | Элемент   | Описание                    |
| ---------------------- | --------- | --------------------------- |
| `data-fitting-product` | Контейнер | Отмечает контейнер продукта |
| `data-fitting-image`   | `<img>`   | Отмечает изображение товара |

### Опциональные атрибуты

| Атрибут              | Элемент   | Описание        | По умолчанию                                                                    |
| -------------------- | --------- | --------------- | ------------------------------------------------------------------------------- |
| `data-fitting-name`  | Контейнер | Название товара | Сначала ищется в тексте карточки/заголовках, затем берётся из `alt` изображения |
| `data-fitting-price` | Контейнер | Цена товара     | Пустая строка                                                                   |

---

## Размещение кнопки отдельно от изображения

По умолчанию SDK располагает кнопку поверх изображения товара. Чтобы поставить её, например, под кнопкой «В корзину», добавьте пустой slot внутри **того же** контейнера `data-fitting-product`:

```html
<div
  class="product"
  data-fitting-product
  data-fitting-name="Название товара"
  data-fitting-price="2990 ₽"
>
  <img src="product.jpg" alt="Название товара" data-fitting-image />

  <div class="product-actions">
    <button type="button">В корзину</button>
    <div data-fitting-button-slot data-fitting-full-width="true"></div>
  </div>
</div>
```

SDK сам создаёт кнопку примерки и вставляет её в первый найденный slot текущего товара. Обработчик клика и данные товара сохраняются — вручную создавать кнопку или добавлять обработчик не нужно.

- `data-fitting-button-slot` — место, куда SDK вставит кнопку;
- `data-fitting-full-width="true"` — необязательный атрибут: растягивает кнопку на ширину slot. Поддерживаются также значения `1`, `yes` и пустой атрибут.

Если slot отсутствует, используется стандартное размещение поверх изображения. Slot не следует выносить за пределы контейнера конкретного товара: иначе SDK не сможет надёжно определить, к какому товару привязать кнопку.

---

## Принцип работы

Этот раздел объясняет, как скрипт виджета работает под капотом. Понимание этих принципов поможет вам правильно настроить интеграцию для любого сервиса.

### Как скрипт находит товары на странице

При загрузке скрипт автоматически сканирует всю страницу в поисках элементов с определёнными **data-атрибутами**. Это работает как система меток:

```
Страница
   │
   ├── <div data-fitting-product>  ← Скрипт находит этот элемент
   │      └── <img data-fitting-image>  ← И изображение внутри
   │
   └── <div class="other-content">  ← Этот элемент игнорируется
```

**Селекторы** — это CSS-правила, по которым скрипт ищет элементы:

- `[data-fitting-product]` — находит все элементы с атрибутом `data-fitting-product`
- `img[data-fitting-image]` — находит все `<img>` с атрибутом `data-fitting-image`

### Роль data-атрибутов

Data-атрибуты — это способ «пометить» HTML-элементы для скрипта, не влияя на их внешний вид или поведение:

| Атрибут                | Зачем нужен                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| `data-fitting-product` | Говорит скрипту: «Это контейнер товара, добавь сюда кнопку примерки»  |
| `data-fitting-image`   | Говорит скрипту: «Это изображение товара, используй его для примерки» |
| `data-fitting-name`    | Передаёт название товара в виджет                                     |
| `data-fitting-price`   | Передаёт цену товара в виджет                                         |

### Атрибут data-shop-token

Токен магазина передаётся через атрибут `data-shop-token` в теге `<script>`:

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
></script>
```

Скрипт автоматически извлекает токен при загрузке и использует его для:

- Идентификации вашего магазина
- Авторизации запросов к API виджета
- Персонализации настроек

### Debug-режим

Чтобы включить отладочные логи в консоли браузера, добавьте атрибут `data-debug="true"`:

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
	data-debug="true"
></script>
```

В этом режиме скрипт пишет диагностические сообщения с префиксом `[Looksy]`.

### Публичный API

После загрузки доступен объект `window.VirtualFitting`:

- `window.VirtualFitting.open(productData)` — открыть виджет программно;
- `window.VirtualFitting.close()` — закрыть виджет;
- `window.VirtualFitting.init()` — повторно пересканировать страницу и переинициализировать кнопки (полезно после динамической подгрузки товаров).

---

# Примеры интеграции для популярных CMS

## Нужна помощь?

Если у вас возникли сложности с интеграцией или у вас есть вопросы, свяжитесь с нашей командой. Мы поможем настроить виджет специально для вашего сервиса.

---

## WooCommerce (WordPress)

### Рекомендуемый способ: через плагин Code Snippets

Этот способ подходит для большинства магазинов WooCommerce. Не нужно редактировать файлы темы, искать `footer.php` или создавать `single-product.php`.

Не используйте этот способ одновременно с ручной вставкой скрипта в `footer.php`, чтобы SDK не подключился дважды.

### 1. Установите плагин Code Snippets

1. Откройте админку WordPress.
2. Перейдите в раздел `Плагины -> Добавить новый`.
3. В поиске введите `Code Snippets`.
4. Установите и активируйте плагин.
5. Убедитесь, что в меню появился раздел `Сниппеты` или `Code Snippets`.

### 2. Создайте новый PHP-сниппет

1. Перейдите в `Сниппеты -> Добавить новый`.
2. Укажите название, например `Looksy WooCommerce Widget`.
3. Вставьте код ниже.
4. Замените `YOUR_SHOP_TOKEN` на токен вашего магазина.
5. При необходимости измените язык через `data-lang`.

Доступные варианты:

```text
data-lang="en" - английский интерфейс и кнопка Try on
data-lang="ru" или отсутствие data-lang - русский/default режим
```

### 3. Вставьте код

```php
add_action('wp_footer', function () {
    if (!function_exists('is_product') || !is_product()) {
        return;
    }

    global $product;

    if (!$product) {
        return;
    }

    $product_name = $product->get_name();
    $product_price = wp_strip_all_tags(wc_price($product->get_price()));
    ?>
    <script>
    (function () {
        function markLooksyProduct() {
            const productImage =
                document.querySelector('.woocommerce-product-gallery__image img') ||
                document.querySelector('.wp-block-woocommerce-product-image-gallery img') ||
                document.querySelector('.wc-block-components-product-image img') ||
                document.querySelector('main img');

            if (!productImage) {
                console.warn('[Looksy] WooCommerce product image not found');
                return;
            }

            const container =
                productImage.closest('.woocommerce-product-gallery__image') ||
                productImage.closest('.wp-block-woocommerce-product-image-gallery') ||
                productImage.closest('figure') ||
                productImage.parentElement;

            if (!container) {
                console.warn('[Looksy] WooCommerce product image container not found');
                return;
            }

            container.setAttribute('data-fitting-product', '');
            container.setAttribute('data-fitting-name', <?php echo wp_json_encode($product_name); ?>);
            container.setAttribute('data-fitting-price', <?php echo wp_json_encode($product_price); ?>);

            productImage.setAttribute('data-fitting-image', '');

            console.log('[Looksy] WooCommerce product marked', {
                name: <?php echo wp_json_encode($product_name); ?>,
                price: <?php echo wp_json_encode($product_price); ?>,
                image: productImage.currentSrc || productImage.src
            });
        }

        markLooksyProduct();
    })();
    </script>

    <script
        defer
        src="https://looksy.tech/min-script.js"
        data-shop-token="YOUR_SHOP_TOKEN"
        data-lang="en">
    </script>
    <?php
}, 99);
```

### 4. Активируйте сниппет

1. Выберите режим запуска `Run snippet everywhere`.
2. Нажмите `Save Changes and Activate`.
3. Убедитесь, что сниппет включен.

Если сниппет сохранен, но не активирован, виджет не появится на сайте.

### 5. Проверьте работу на странице товара

Откройте любую страницу товара WooCommerce, например `/product/product-name/`.

Ожидаемый результат:

- на изображении товара появляется кнопка примерки;
- при клике открывается виджет Looksy;
- в консоли браузера появляются сообщения `[Looksy]`, если вы временно включили `data-debug="true"`.

### 6. Если кнопка не появилась

Откройте DevTools -> `Console`.

Проверьте, есть ли сообщение:

```text
[Looksy] WooCommerce product marked
```

Если такого сообщения нет, проверьте:

- сниппет активирован;
- выбран режим `Run snippet everywhere`;
- открыта именно страница товара;
- у товара есть основное изображение;
- магазин не в режиме `Coming Soon`.
- на время проверки можно добавить `data-debug="true"` в тег SDK.

Если появляется сообщение:

```text
[Looksy] WooCommerce product image not found
```

значит тема использует нестандартную разметку изображения. В этом случае нужна ручная разметка товара или отдельная настройка селектора.

### 7. Как включить и отключить debug-режим

На время проверки добавьте атрибут `data-debug="true"`.

После проверки удалите его или замените на `data-debug="false"`.

### 8. Как изменить язык кнопки

Для английской кнопки:

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
	data-lang="en"
></script>
```

Для русского/default режима уберите `data-lang` или укажите `data-lang="ru"`.

### 9. Ручная интеграция для разработчиков

Если тема сильно изменяет стандартную WooCommerce-разметку, можно разметить товар вручную:

```html
<div
	data-fitting-product
	data-fitting-name="Product name"
	data-fitting-price="$49"
>
	<img
		src="https://example.com/product.jpg"
		alt="Product name"
		data-fitting-image
	/>
</div>
```

`data-fitting-product` ставится на контейнер одного товара.

`data-fitting-image` ставится на изображение товара внутри этого контейнера.

`data-fitting-name` и `data-fitting-price` передают название и цену товара в виджет.

### 10. Не рекомендуется для обычных пользователей

Не редактируйте `footer.php` и не создавайте `single-product.php`, если вы не разработчик темы.

## Shopify

### Назначение

Инструкция подключает кнопку `Try on` на странице товара Shopify.

После установки SDK получает данные текущего товара: изображение, название и цену. Кнопка добавляется к основному изображению товара.

### С чего начать после входа в Shopify Admin

1. В левом меню откройте `Sales channels -> Online Store`.
2. В блоке `Current theme` нажмите `...` или `Actions`.
3. Выберите `Edit code`.

### 1. Подключите SDK в `theme.liquid`

В редакторе файлов откройте `layout/theme.liquid` и найдите закрывающий тег:

```liquid
</body>
```

Если рядом с ним уже есть блок:

```liquid
{% if request.page_type == 'product' %}
  ...
{% endif %}
```

добавьте SDK внутрь существующего блока, перед его `{% endif %}`.

Если такого блока нет, добавьте новый блок перед `</body>`:

```liquid
{% if request.page_type == 'product' %}
  <script
    defer
    src="https://looksy.tech/min-script.js"
    data-shop-token="YOUR_SHOP_TOKEN"
    data-lang="en">
  </script>
{% endif %}
```

Замените `YOUR_SHOP_TOKEN` на токен вашего магазина.

SDK должен быть подключён один раз. Если в теме уже есть строка `https://looksy.tech/min-script.js`, не добавляйте второй такой же скрипт.

### 2. Добавьте разметку товара

Теперь нужно найти шаблон, который выводит основное изображение или галерею товара.

В некоторых темах этот файл называется `snippets/product-information-content.liquid`. В нём может быть блок:

```liquid
<div
  class="product-information__media"
  data-testid="product-information-media"
>
  {{ media_gallery }}
</div>
```

Добавьте в этот div атрибуты:

```
data-fitting-product
data-fitting-name="{{ product.title | escape }}"
data-fitting-price="{{ product.price | money }}"
```

В итоге должно получиться так:

```liquid
<div
  class="product-information__media"
  data-testid="product-information-media"
  data-fitting-product
  data-fitting-name="{{ product.title | escape }}"
  data-fitting-price="{{ product.price | money }}"
>
  {{ media_gallery }}
</div>
```

В этом примере `.product-information__media` — контейнер галереи товара. Атрибуты `data-fitting-*` передают SDK данные текущего товара.

### 3. Если файл называется иначе

Если вы не нашли файл `snippets/product-information-content.liquid` или блок:

```
<div
  class="product-information__media"
  data-testid="product-information-media"
>
  {{ media_gallery }}
</div>
```

попробуйте запасной вариант через файл, который выводит отдельное изображение товара.

В редакторе Shopify откройте файл `snippets/product-media.liquid`

Дальше возможны два варианта разметки.

#### Вариант A: изображение выводится через image_tag

Найдите блок примерно такого вида:

```
{{
  media.preview_image
  | image_url: width: 3840
  | image_tag:
    widths: widths,
    alt: media.alt,
    sizes: sizes,
    loading: loading,
    class: 'product-media__image'
}}
```

В этом случае не нужно переписывать image_tag. Проще добавить атрибуты на внешний контейнер одного изображения.

Найдите блок примерно такого вида:

<div
  class="product-media"
  style="--ratio: {{ media.aspect_ratio }}"
  data-media-id="{{ media.id }}"
>

Замените его на:

<div
  class="product-media"
  style="--ratio: {{ media.aspect_ratio }}"
  data-media-id="{{ media.id }}"
  {%- if media.position == 1 -%}
    data-fitting-product
    data-fitting-name="{{ selected_product.title | escape }}"
    data-fitting-price="{{ selected_product.price | money }}"
    data-fitting-image="{{ media.preview_image | image_url: width: 1200 }}"
  {%- endif -%}
>

Условие:

{%- if media.position == 1 -%}

нужно для того, чтобы кнопка Try on появилась только на первом изображении товара, а не на всех фото в галерее.

После сохранения откройте страницу товара и проверьте, появилась ли кнопка Try on.

Важно: этот способ является запасным. В некоторых Shopify-темах файл product-media.liquid может использоваться не только для основной картинки товара, но и для модального окна просмотра изображения. Если кнопка появилась не там, где нужно, вернитесь к поиску основного контейнера галереи товара.

Найдите блок, который выводит изображение товара. Обычно он выглядит примерно так:

```
{%- if media.media_type == 'image' -%}
  <img
    ...
  >
{%- endif -%}
```

Добавьте в этот <img> атрибуты `data-fitting-*.`

Пример:

```
{%- if media.media_type == 'image' -%}
  <img
    class="global-media-settings global-media-settings--no-shadow{% if variant_image %} product__media-item--variant{% endif %}"
    srcset="
      {%- if media.preview_image.width >= 550 -%}{{ media.preview_image | image_url: width: 550 }} 550w,{%- endif -%}
      {%- if media.preview_image.width >= 1100 -%}{{ media.preview_image | image_url: width: 1100 }} 1100w,{%- endif -%}
      {%- if media.preview_image.width >= 1445 -%}{{ media.preview_image | image_url: width: 1445 }} 1445w,{%- endif -%}
      {%- if media.preview_image.width >= 1680 -%}{{ media.preview_image | image_url: width: 1680 }} 1680w,{%- endif -%}
      {%- if media.preview_image.width >= 2048 -%}{{ media.preview_image | image_url: width: 2048 }} 2048w,{%- endif -%}
      {{ media.preview_image | image_url }} {{ media.preview_image.width }}w
    "
    sizes="(min-width: 750px) calc(100vw - 22rem), 1100px"
    src="{{ media.preview_image | image_url: width: 1445 }}"
    alt="{{ media.alt | escape }}"
    loading="lazy"
    width="1100"
    height="{{ 1100 | divided_by: media.preview_image.aspect_ratio | ceil }}"

    data-fitting-product
    data-fitting-name="{{ product.title | escape }}"
    data-fitting-price="{{ product.price | money }}"
    data-fitting-image="{{ media.preview_image | image_url: width: 1200 }}"
    data-media-id="{{ media.id }}"
  >
{%- endif -%}
```

После сохранения откройте страницу товара и проверьте, появилась ли кнопка Try on.

Важно: этот способ является запасным. В некоторых Shopify-темах файл product-media.liquid может использоваться не только для основной картинки товара, но и для модального окна просмотра изображения. Если кнопка появилась не там, где нужно, вернитесь к поиску основного контейнера галереи товара.

#### 3.1 Если кнопка растянулась на всю картинку

В некоторых Shopify-темах стили галереи могут растянуть кнопку `Try on` на всю область изображения. Если кнопка появилась, но выглядит как большой чёрный блок поверх всей картинки, откройте файл: `layout/theme.liquid`

Найдите место, где вы подключили SDK:

```
{% if request.page_type == 'product' %}
  <script
    defer
    src="https://looksy.tech/min-script.js"
    data-shop-token="YOUR_SHOP_TOKEN"
    data-lang="en">
  </script>
{% endif %}
```

Добавьте CSS внутрь этого же блока, сразу после <script>:

```
{% if request.page_type == 'product' %}
  <script
    defer
    src="https://looksy.tech/min-script.js"
    data-shop-token="YOUR_SHOP_TOKEN"
    data-lang="en">
  </script>

  <style>
    .virtual-fitting-button,
    .virtual-fitting-button.virtual-fitting-button--en {
      position: absolute !important;
      top: auto !important;
      left: auto !important;
      right: 12px !important;
      bottom: 12px !important;

      width: auto !important;
      height: auto !important;
      min-width: 0 !important;
      min-height: 0 !important;
      max-width: none !important;
      max-height: none !important;

      padding: 10px 16px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;

      background: #0a0a0a !important;
      color: #ffffff !important;
      z-index: 20 !important;
      object-fit: initial !important;
      inset: auto 12px 12px auto !important;
    }

    .virtual-fitting-button img,
    .virtual-fitting-button svg {
      width: 16px !important;
      height: 16px !important;
      max-width: 16px !important;
      max-height: 16px !important;
      position: static !important;
    }
  </style>
{% endif %}
```

Если SDK уже подключён, не добавляйте второй <script>. Добавьте только блок:

```
<style>
  ...
</style>
```

внутрь существующего условия `{% if request.page_type == 'product' %}`.

### 4. Вариант с передачей изображения через контейнер

Если в теме сложно добавить `data-fitting-image` прямо на `<img>`, можно передать URL изображения на контейнере товара:

```liquid
<div
  class="YOUR_PRODUCT_MEDIA_CONTAINER"
  data-fitting-product
  data-fitting-name="{{ product.title | escape }}"
  data-fitting-price="{{ product.price | money }}"
  data-fitting-image="{{ product.featured_image | image_url: width: 1200 }}"
>
  ...
</div>
```

Если в шаблоне доступен обычный `<img>`, можно использовать стандартный вариант:

```liquid
<img
  src="{{ product.featured_image | image_url: width: 1200 }}"
  alt="{{ product.title | escape }}"
  data-fitting-image>
```

### 5. Сохраните и проверьте

1. Нажмите `Save`.
2. Откройте страницу товара.
3. Обновите страницу.
4. Проверьте, появилась ли кнопка `Try on`.

Проверять нужно страницу товара, например `/products/product-name`.

### 6. Проверка через DevTools

Если кнопка не появилась, временно включите debug-режим:

```liquid
{% if request.page_type == 'product' %}
  <script
    defer
    src="https://looksy.tech/min-script.js"
    data-shop-token="YOUR_SHOP_TOKEN"
    data-lang="en"
    data-debug="true">
  </script>
{% endif %}
```

Откройте DevTools -> `Elements` и проверьте, что на странице есть атрибут `data-fitting-product`.

Затем проверьте, что есть атрибут `data-fitting-image` или что URL изображения передан на контейнере через `data-fitting-image`.

В DevTools -> `Network` проверьте, что загружается `min-script.js`.

На странице должен быть один подключённый SDK.

## Битрикс (1C-Bitrix)

### 1. Подключение в шаблоне

```php
<?php
// В footer.php или в компоненте bitrix:main.include
?>
<script defer src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
```

### 2. Настройка карточки товара

```php
<div class="product-detail"
     data-fitting-product
     data-fitting-name="<?=$arResult['NAME']?>"
     data-fitting-price="<?=$arResult['PRICES']['BASE']['PRINT_VALUE']?>">

    <?php if ($arResult['DETAIL_PICTURE']): ?>
        <img src="<?=$arResult['DETAIL_PICTURE']['SRC']?>"
             alt="<?=$arResult['NAME']?>"
             data-fitting-image />
    <?php endif; ?>

</div>
```

### 3. Для каталога товаров

```php
<?php foreach ($arResult['ITEMS'] as $item): ?>
    <div class="catalog-item"
         data-fitting-product
         data-fitting-name="<?=$item['NAME']?>"
         data-fitting-price="<?=$item['PRICES']['BASE']['PRINT_VALUE']?>">

        <img src="<?=$item['PREVIEW_PICTURE']['SRC']?>"
             alt="<?=$item['NAME']?>"
             data-fitting-image />

    </div>
<?php endforeach; ?>
```

## OpenCart

### 1. Добавление скрипта

В файле `catalog/view/theme/default/template/common/footer.tpl`:

```php
<script defer src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
</body>
</html>
```

### 2. Карточка товара

В файле `catalog/view/theme/default/template/product/product.tpl`:

```php
<div data-fitting-product
     data-fitting-name="<?php echo $heading_title; ?>"
     data-fitting-price="<?php echo $price; ?>">

    <?php if ($thumb) { ?>
        <img src="<?php echo $thumb; ?>"
             alt="<?php echo $heading_title; ?>"
             data-fitting-image />
    <?php } ?>

</div>
```

## PrestaShop

### 1. Добавление в theme.js

```javascript
$(document).ready(function () {
	const script = document.createElement('script')
	script.src = 'https://looksy.tech/min-script.js'
	script.setAttribute('data-shop-token', 'YOUR_SHOP_TOKEN')
	document.body.appendChild(script)
})
```

### 2. Шаблон товара

В `themes/your-theme/templates/catalog/product.tpl`:

```smarty
<div data-fitting-product
     data-fitting-name="{$product.name}"
     data-fitting-price="{$product.price}">

    <img src="{$product.cover.large.url}"
         alt="{$product.name}"
         data-fitting-image />

</div>
```

## Magento 2

### 1. Добавление через layout XML

Создайте `app/design/frontend/YourVendor/YourTheme/Magento_Theme/layout/default.xml`:

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="before.body.end">
            <block class="Magento\Framework\View\Element\Template"
                   name="virtual.fitting.script"
                   template="Magento_Theme::virtual-fitting.phtml"/>
        </referenceContainer>
    </body>
</page>
```

Создайте `app/design/frontend/YourVendor/YourTheme/Magento_Theme/templates/virtual-fitting.phtml`:

```php
<script defer src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
```

### 2. Шаблон товара

```php
<?php
$_product = $block->getProduct();
$_imageHelper = $this->helper('Magento\Catalog\Helper\Image');
?>

<div data-fitting-product
     data-fitting-name="<?= $block->escapeHtml($_product->getName()) ?>"
     data-fitting-price="<?= $block->escapeHtml($_product->getFormattedPrice()) ?>">

    <img src="<?= $block->escapeUrl($_imageHelper->init($_product, 'product_page_image_large')->getUrl()) ?>"
         alt="<?= $block->escapeHtml($_product->getName()) ?>"
         data-fitting-image />

</div>
```

## Tilda

### Что делает интеграция

Для Tilda достаточно добавить один скрипт в настройки сайта. После этого Looksy SDK сам отслеживает открытие карточки товара, находит изображение, название и цену товара и добавляет кнопку примерки в открытой карточке.

Ручная разметка `data-fitting-*` обычно не требуется.

### 1. Откройте настройки сайта

1. Войдите в аккаунт Tilda.
2. Откройте нужный сайт.
3. Перейдите в раздел **Настройки сайта**.

### 2. Откройте раздел вставки кода

В настройках сайта откройте `Ещё -> Вставка кода` или, в зависимости от интерфейса Tilda, `Настройки сайта -> Вставка кода`.

Найдите блок для добавления HTML-кода перед закрывающим тегом `</body>`. Обычно он называется `Перед закрывающим тегом BODY` или `Before </body>`.

Нажмите `Редактировать код`.

### 3. Вставьте код Looksy

Добавьте этот код:

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
	data-debug="true"
></script>
```

Важно: для Tilda оставьте атрибут `defer`.

### 4. Сохраните изменения

1. Нажмите `Сохранить`.
2. Вернитесь к сайту.
3. Опубликуйте сайт заново.

В Tilda изменения в настройках сайта применяются на опубликованных страницах после повторной публикации.

### 5. Проверьте работу

Откройте опубликованный сайт и проверьте сценарий: каталог → карточка товара → открытие товара → фото товара.

Ожидаемый результат:

- кнопка примерки появляется в открытой карточке товара;
- кнопка привязана к фото товара;
- при клике открывается виджет Looksy.

### 6. Если кнопка не появилась

Откройте DevTools -> `Console` и проверьте, есть ли сообщения `[Looksy]`.

Также проверьте:

- скрипт добавлен именно в настройках сайта, а не только на одной странице;
- сайт был заново опубликован после сохранения кода;
- в коде есть `data-shop-token`;
- атрибут `defer` не удалён;
- в карточке товара есть изображение товара;
- на странице нет второго подключения `min-script.js`.

### 7. Как отключить debug-режим

После проверки замените `data-debug="true"` на `data-debug="false"` или удалите атрибут:

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
></script>
```

### Для нестандартной вёрстки

Если используется кастомный Zero Block или собственная HTML-разметка товара, можно вручную пометить товар:

```html
<div
	data-fitting-product
	data-fitting-name="Название товара"
	data-fitting-price="2990 ₽"
>
	<img
		src="product.jpg"
		alt="Название товара"
		data-fitting-image
	/>
</div>
```

После динамической вставки товара можно вызвать:

```html
<script>
	if (window.VirtualFitting) {
		window.VirtualFitting.init()
	}
</script>
```

## Вёрстка на чистом HTML/CSS/JS

### Каталог товаров

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8" />
		<title>Каталог</title>
	</head>
	<body>
		<div class="products">
			<div
				class="product"
				data-fitting-product
				data-fitting-name="Футболка базовая"
				data-fitting-price="1990 ₽"
			>
				<img
					src="images/tshirt.jpg"
					alt="Футболка"
					data-fitting-image
				/>
				<h3>Футболка базовая</h3>
				<p class="price">1990 ₽</p>
			</div>
		</div>

		<script
			defer
			src="https://looksy.tech/min-script.js"
			data-shop-token="YOUR_SHOP_TOKEN"
		></script>
	</body>
</html>
```

### С динамической загрузкой

```html
<div id="products-container"></div>

<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
></script>
<script>
	fetch('/api/products')
		.then(res => res.json())
		.then(products => {
			const container = document.getElementById('products-container')

			products.forEach(product => {
				const div = document.createElement('div')
				div.className = 'product'
				div.setAttribute('data-fitting-product', '')
				div.setAttribute('data-fitting-name', product.name)
				div.setAttribute('data-fitting-price', product.price)

				const img = document.createElement('img')
				img.src = product.image
				img.alt = product.name
				img.setAttribute('data-fitting-image', '')

				div.appendChild(img)
				container.appendChild(div)
			})

			window.VirtualFitting.init()
		})
</script>
```

## React (для SPA)

Подключайте SDK один раз в `index.html` (или в root layout), а `window.VirtualFitting.init()` вызывайте на уровне страницы/роута после рендера контента, не внутри каждой карточки товара.

Пример инициализации при смене маршрута:

```tsx
function useLooksyInitOnRouteChange() {
	const location = useLocation()

	useEffect(() => {
		const frame = requestAnimationFrame(() => {
			if (window.VirtualFitting) {
				window.VirtualFitting.init()
			}
		})

		return () => cancelAnimationFrame(frame)
	}, [location.pathname])
}
```

## Vue.js

Подключайте SDK один раз в `index.html`, а `window.VirtualFitting.init()` вызывайте на уровне приложения при смене маршрута, не внутри карточки товара.

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
	data-lang="en"
></script>
```

Пример инициализации в `App.vue`:

```vue
<script setup>
import { nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

watch(
	() => route.path,
	async () => {
		await nextTick()
		if (window.VirtualFitting) {
			window.VirtualFitting.init()
		}
	},
	{ immediate: true },
)
</script>
```

Карточка/страница товара должна содержать `data-fitting-*`, а кнопка должна якориться к блоку фото:

```vue
<div class="product-media" data-fitting-product :data-fitting-name="product.name" :data-fitting-price="product.price">
  <img
    :src="product.image"
    :alt="product.name"
    data-fitting-image
  />
</div>
```

Если `img` использует локальный или закрытый URL, передайте публичный URL отдельно на контейнер:

```vue
<div
	class="product-media"
	data-fitting-product
	:data-fitting-name="product.name"
	:data-fitting-price="product.price"
	:data-fitting-image="product.tryOnImage"
>
  <img :src="product.image" :alt="product.name" data-fitting-image />
</div>
```
