# Виджет виртуальной примерки - Скрипт для интеграции

Встраиваемый скрипт для добавления функционала виртуальной примерки одежды на сайты e-commerce.

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





# Примеры интеграции для популярных CMS

## Нужна помощь?

Если у вас возникли сложности с интеграцией или у вас есть вопросы, свяжитесь с нашей командой. Мы поможем настроить виртуальную примерку специально для вашего сервиса.



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

### 1. Найдите селекторы элементов

Селекторы в Tilda зависят от используемого блока. Чтобы найти нужные:

1. Откройте опубликованную страницу в браузере
2. Нажмите `F12` (DevTools) → вкладка "Elements"
3. Кликните на иконку выбора элемента (стрелка в квадрате) или нажмите `Ctrl+Shift+C`
4. Наведите на карточку товара, изображение, название и цену
5. Запишите классы каждого элемента

### 2. Через "HTML-код"

Добавьте блок "T123 - HTML-код" в конец страницы и вставьте код, заменив селекторы на найденные:

```html
<script src="https://looksy.tech/min-script.js" defer data-shop-token="YOUR_SHOP_TOKEN"></script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Замените селекторы на найденные в DevTools для вашего блока
    const CARD_SELECTOR = '.t-store__card';           // Карточка товара
    const IMG_SELECTOR = '.t-store__card__imgwrapper img'; // Изображение
    const TITLE_SELECTOR = '.t-store__card__title';   // Название
    const PRICE_SELECTOR = '.t-store__card__price';   // Цена

    document.querySelectorAll(CARD_SELECTOR).forEach(function(card) {
        const img = card.querySelector(IMG_SELECTOR);
        const title = card.querySelector(TITLE_SELECTOR);
        const price = card.querySelector(PRICE_SELECTOR);
        
        if (img) {
            card.setAttribute('data-fitting-product', '');
            card.setAttribute('data-fitting-name', title ? title.textContent.trim() : '');
            card.setAttribute('data-fitting-price', price ? price.textContent.trim() : '');
            img.setAttribute('data-fitting-image', '');
        }
    });
    
    window.VirtualFitting.init();
});
</script>
```

### Примеры селекторов для разных блоков Tilda

| Блок | Карточка | Изображение | Название | Цена |
|------|----------|-------------|----------|------|
| ST100 | `.t-store__card` | `.t-store__card__imgwrapper img` | `.t-store__card__title` | `.t-store__card__price` |
| ST200 | `.t-store__card` | `.t-store__card__img img` | `.t-store__card__title` | `.t-store__card__price-value` |
| Zero Block | Зависит от вашей вёрстки — используйте классы, заданные вами |

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
