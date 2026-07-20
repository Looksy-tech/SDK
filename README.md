# Виджет виртуальной примерки - Скрипт для интеграции

Встраиваемый скрипт для добавления функционала виртуальной примерки одежды на сайты e-commerce.

## Навигация

- [Быстрый старт](#быстрый-старт)
- [Data-атрибуты](#data-атрибуты)
- [Размещение кнопки отдельно от изображения](#размещение-кнопки-отдельно-от-изображения)
- [Принцип работы](#принцип-работы)
- [Примеры интеграции для популярных CMS](#примеры-интеграции-для-популярных-cms)
- [Tilda](#tilda)
- [Вёрстка на чистом HTML/CSS/JS](#вёрстка-на-чистом-htmlcssjs)
- [React (для SPA)](#react-для-spa)
- [Vue.js](#vuejs)

## Быстрый старт

### 1. Подключение скрипта

Добавьте скрипт перед закрывающим тегом `</body>`:

```html
<script src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
```

### 2. Разметка продуктов

Добавьте data-атрибуты к элементам продуктов:

```html
<div class="product" 
     data-fitting-product 
     data-fitting-name="Название товара" 
     data-fitting-price="2990 ₽">
  <img src="product.jpg" 
       alt="Product" 
       data-fitting-image />
</div>
```

## Data-атрибуты

### Обязательные атрибуты

| Атрибут | Элемент | Описание |
|---------|---------|----------|
| `data-fitting-product` | Контейнер | Отмечает контейнер продукта |
| `data-fitting-image` | `<img>` | Отмечает изображение товара |

### Опциональные атрибуты

| Атрибут | Элемент | Описание | По умолчанию |
|---------|---------|----------|--------------|
| `data-fitting-name` | Контейнер | Название товара | Берется из `alt` изображения |
| `data-fitting-price` | Контейнер | Цена товара | Пустая строка |

---

## Размещение кнопки отдельно от изображения

По умолчанию SDK располагает кнопку поверх изображения товара. Чтобы поставить её под кнопкой «В корзину», добавьте пустой slot внутри **того же** контейнера `data-fitting-product`:

```html
<div class="product" data-fitting-product data-fitting-name="Название товара" data-fitting-price="2990 ₽">
  <img src="product.jpg" alt="Название товара" data-fitting-image />

  <div class="product-actions">
    <button type="button">В корзину</button>
    <div data-fitting-button-slot data-fitting-full-width="true"></div>
  </div>
</div>
```

SDK сам вставит кнопку примерки в первый slot текущего товара. `data-fitting-full-width="true"` необязателен и растягивает кнопку на ширину slot. Если slot отсутствует, кнопка размещается поверх изображения.

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

| Атрибут | Зачем нужен |
|---------|-------------|
| `data-fitting-product` | Говорит скрипту: «Это контейнер товара, добавь сюда кнопку примерки» |
| `data-fitting-image` | Говорит скрипту: «Это изображение товара, используй его для примерки» |
| `data-fitting-name` | Передаёт название товара в виджет |
| `data-fitting-price` | Передаёт цену товара в виджет |


### Атрибут data-shop-token

Токен магазина передаётся через атрибут `data-shop-token` в теге `<script>`:

```html
<script src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
```

Скрипт автоматически извлекает токен при загрузке и использует его для:
- Идентификации вашего магазина
- Авторизации запросов к API виджета
- Персонализации настроек

### Debug-режим

Чтобы включить отладочные логи в консоли браузера, добавьте атрибут `data-debug="true"`:

```html
<script src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN" data-debug="true"></script>
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



## WordPress

### 1. Добавление скрипта в footer.php

```php
<?php
// В файле footer.php вашей темы, перед </body>
?>
<script src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
<?php wp_footer(); ?>
</body>
</html>
```

### 2. Настройка шаблона товара WooCommerce

Создайте файл `single-product.php` в вашей теме:

```php
<div class="product" 
     data-fitting-product 
     data-fitting-name="<?php echo esc_attr(get_the_title()); ?>" 
     data-fitting-price="<?php echo esc_attr(get_woocommerce_currency_symbol() . $product->get_price()); ?>">
    
    <?php if (has_post_thumbnail()): ?>
        <img src="<?php echo get_the_post_thumbnail_url(get_the_ID(), 'full'); ?>" 
             alt="<?php echo esc_attr(get_the_title()); ?>"
             data-fitting-image />
    <?php endif; ?>
    
</div>
```

### 3. Через плагин Code Snippets

```php
add_action('wp_footer', function() {
    ?>
    <script src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
    <?php
});

add_filter('woocommerce_product_thumbnails_columns', function() {
    add_action('woocommerce_product_thumbnails', function() {
        global $product;
        ?>
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            const productImage = document.querySelector('.woocommerce-product-gallery__image img');
            if (productImage) {
                const container = productImage.closest('.woocommerce-product-gallery__image');
                container.setAttribute('data-fitting-product', '');
                container.setAttribute('data-fitting-name', '<?php echo esc_js($product->get_name()); ?>');
                container.setAttribute('data-fitting-price', '<?php echo esc_js(wc_price($product->get_price())); ?>');
                productImage.setAttribute('data-fitting-image', '');
            }
        });
        </script>
        <?php
    });
});
```

## Shopify

### 1. Добавление скрипта в theme.liquid

```liquid
<!-- Перед закрывающим тегом </body> в theme.liquid -->
<script src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
</body>
```

### 2. Настройка шаблона товара

В файле `product-template.liquid` или `product.liquid`:

```liquid
<div data-fitting-product 
     data-fitting-name="{{ product.title }}" 
     data-fitting-price="{{ product.price | money }}">
  
  {% if product.featured_image %}
    <img src="{{ product.featured_image | img_url: 'master' }}" 
         alt="{{ product.title }}"
         data-fitting-image />
  {% endif %}
  
</div>
```

### 3. Для продуктов в коллекции

```liquid
{% for product in collection.products %}
  <div class="product-card" 
       data-fitting-product 
       data-fitting-name="{{ product.title }}" 
       data-fitting-price="{{ product.price | money }}">
    
    <a href="{{ product.url }}">
      <img src="{{ product.featured_image | img_url: 'large' }}" 
           alt="{{ product.title }}"
           data-fitting-image />
    </a>
    
  </div>
{% endfor %}
```

## Битрикс (1C-Bitrix)

### 1. Подключение в шаблоне

```php
<?php
// В footer.php или в компоненте bitrix:main.include
?>
<script src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
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
<script src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
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
$(document).ready(function() {
    const script = document.createElement('script');
    script.src = 'https://looksy.tech/min-script.js';
    script.setAttribute('data-shop-token', 'YOUR_SHOP_TOKEN');
    document.body.appendChild(script);
});
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
<script src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
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

### Важно для Tilda

Для большинства магазинов на Tilda (включая блоки ST315N, ST320N, ST305N) достаточно только подключения скрипта с `data-shop-token`.

Скрипт сам:
- отслеживает изменения DOM через Observer;
- ищет товар, изображение, название и цену по цепочке фолбэков селекторов;
- обновляет кнопку при открытии попапа карточки и смене слайдов;
- делает повторные проверки после загрузки и после `pageshow` (важно для переходов назад/вперёд и релоада).

Ручная разметка `data-fitting-*` остается доступной как fallback-режим для нестандартной верстки.

### Для владельцев сайтов на Tilda

1. Подключите скрипт один раз перед закрывающим `</body>` (или в глобальном коде сайта), а не только внутри отдельной страницы.
2. Убедитесь, что передан корректный `data-shop-token`.
3. Опубликуйте сайт и проверьте сценарий: каталог → открытие карточки товара → первая фотография.
4. Если на странице есть кеш или ленивые блоки, проверьте также релоад и возврат кнопкой браузера "назад".

Ожидаемое поведение для Tilda storefront:
- кнопка показывается в открытой карточке товара;
- кнопка привязана к фото товара (в первую очередь к активному/первому слайду);
- в каталоге без открытой карточки кнопка не должна отображаться.

### Для разработчиков на Tilda

#### Рекомендуемый способ подключения

```html
<script src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
```

Скрипт сам работает с типичными Tilda-структурами (`img`, `data-original`, `data-img-zoom-url`, `background-image`) и повторно обрабатывает DOM при изменениях.

#### Когда использовать ручные `data-fitting-*`

Используйте ручную разметку, если:
- у вас сильно кастомный Zero Block или внешний HTML внутри Tilda;
- название/цена рендерятся нестандартно и не находятся селекторами;
- вы хотите полностью контролировать, где появляется кнопка.

Минимальный пример ручной разметки в Tilda-блоке HTML:

```html
<div data-fitting-product data-fitting-name="Название" data-fitting-price="2990 ₽">
  <img src="product.jpg" alt="Название" data-fitting-image />
</div>
```

После динамической вставки товаров вручную вызовите:

```html
<script>
  if (window.VirtualFitting) {
    window.VirtualFitting.init();
  }
</script>
```

### Чеклист диагностики Tilda

Если кнопка не появилась:

1. Проверьте, что скрипт загружен на опубликованной странице (Network/Elements).
2. Проверьте наличие `data-shop-token` в теге скрипта.
3. Включите `data-debug="true"` и откройте консоль: должны быть логи `[Looksy]`.
4. Проверьте, не блокирует ли кнопку кастомный слой с большим `z-index`.
5. Если карточка/слайдер вставляются поздно кастомным кодом, после вставки вызовите `window.VirtualFitting.init()`.

### Пример подключения через T123

```html
<!-- Блок T123 -> HTML-код -->
<script src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
```

Рекомендуется дублировать подключение в глобальном коде сайта Tilda, если карточки товара открываются на страницах, где нет конкретного T123-блока.

## Вёрстка на чистом HTML/CSS/JS

### Каталог товаров

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Каталог</title>
</head>
<body>
    <div class="products">
        <div class="product" 
             data-fitting-product 
             data-fitting-name="Футболка базовая" 
             data-fitting-price="1990 ₽">
            <img src="images/tshirt.jpg" 
                 alt="Футболка"
                 data-fitting-image />
            <h3>Футболка базовая</h3>
            <p class="price">1990 ₽</p>
        </div>
    </div>

    <script src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
</body>
</html>
```

### С динамической загрузкой

```html
<div id="products-container"></div>

<script src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
<script>
fetch('/api/products')
    .then(res => res.json())
    .then(products => {
        const container = document.getElementById('products-container');
        
        products.forEach(product => {
            const div = document.createElement('div');
            div.className = 'product';
            div.setAttribute('data-fitting-product', '');
            div.setAttribute('data-fitting-name', product.name);
            div.setAttribute('data-fitting-price', product.price);
            
            const img = document.createElement('img');
            img.src = product.image;
            img.alt = product.name;
            img.setAttribute('data-fitting-image', '');
            
            div.appendChild(img);
            container.appendChild(div);
        });
        
        window.VirtualFitting.init();
    });
</script>
```

## React (для SPA)

```tsx
import { useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
}

export default function ProductCard({ product }: { product: Product }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://looksy.tech/min-script.js';
    script.setAttribute('data-shop-token', 'YOUR_SHOP_TOKEN');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (window.VirtualFitting) {
      window.VirtualFitting.init();
    }
  }, [product]);

  return (
    <div 
      data-fitting-product
      data-fitting-name={product.name}
      data-fitting-price={product.price}
    >
      <img 
        src={product.image}
        alt={product.name}
        data-fitting-image
      />
    </div>
  );
}
```

## Vue.js

```vue
<template>
  <div 
    data-fitting-product
    :data-fitting-name="product.name"
    :data-fitting-price="product.price"
  >
    <img 
      :src="product.image"
      :alt="product.name"
      data-fitting-image
    />
  </div>
</template>

<script setup>
import { onMounted, onUpdated } from 'vue';

const props = defineProps(['product']);

onMounted(() => {
  const script = document.createElement('script');
  script.src = 'https://looksy.tech/min-script.js';
  script.setAttribute('data-shop-token', 'YOUR_SHOP_TOKEN');
  document.body.appendChild(script);
});

onUpdated(() => {
  if (window.VirtualFitting) {
    window.VirtualFitting.init();
  }
});
</script>
```
