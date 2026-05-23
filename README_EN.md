# Virtual Try-On Widget — Integration Script

An embeddable script for adding virtual try-on functionality to e-commerce websites.

## Navigation

- [Quick Start](#quick-start)
- [Data Attributes](#data-attributes)
- [How It Works](#how-it-works)
- [Integration Examples for Popular CMS Platforms](#integration-examples-for-popular-cms-platforms)
- [WooCommerce (WordPress)](#woocommerce-wordpress)
- [Shopify](#shopify)
- [Tilda](#tilda)
- [Plain HTML/CSS/JS](#plain-htmlcssjs)
- [React (SPA)](#react-spa)
- [Vue.js](#vuejs)

## Quick Start

### 1. Add the script

Add the script before the closing `</body>` tag:

```html
<script
  defer
  src="https://looksy.tech/min-script.js"
  data-shop-token="YOUR_SHOP_TOKEN"></script>
```

### 2. Mark up products

Add data attributes to product elements:

```html
<div class="product" 
     data-fitting-product 
     data-fitting-name="Product name" 
     data-fitting-price="$49">
  <img src="product.jpg" 
       alt="Product" 
       data-fitting-image />
</div>
```

## Data Attributes

### Required attributes

| Attribute | Element | Description |
|---------|---------|----------|
| `data-fitting-product` | Container | Marks the product container |
| `data-fitting-image` | `<img>` | Marks the product image |

### Optional attributes

| Attribute | Element | Description | Default |
|---------|---------|----------|--------------|
| `data-fitting-name` | Container | Product name | First searched in card text/headings, then taken from the image `alt` |
| `data-fitting-price` | Container | Product price | Empty string |

---

## How It Works

This section explains how the widget script works under the hood. Understanding these principles will help you configure the integration for any platform.

### How the script finds products on the page

When the script loads, it automatically scans the page for elements with specific **data attributes**. These attributes work like markers:

```txt
Page
   │
   ├── <div data-fitting-product>  ← The script finds this element
   │      └── <img data-fitting-image>  ← And the image inside it
   │
   └── <div class="other-content">  ← This element is ignored
```

**Selectors** are CSS rules used by the script to find elements:

- `[data-fitting-product]` — finds all elements with the `data-fitting-product` attribute.
- `img[data-fitting-image]` — finds all `<img>` elements with the `data-fitting-image` attribute.

### Role of data attributes

Data attributes are a way to “mark” HTML elements for the script without changing their appearance or default behavior:

| Attribute | Purpose |
|---------|-------------|
| `data-fitting-product` | Tells the script: “This is a product container; add a try-on button here.” |
| `data-fitting-image` | Tells the script: “This is the product image; use it for try-on.” |
| `data-fitting-name` | Passes the product name to the widget |
| `data-fitting-price` | Passes the product price to the widget |

### The `data-shop-token` attribute

The shop token is passed through the `data-shop-token` attribute on the `<script>` tag:

```html
<script
  defer
  src="https://looksy.tech/min-script.js"
  data-shop-token="YOUR_SHOP_TOKEN"></script>
```

The script automatically reads the token when it loads and uses it for:

- Identifying your store.
- Authorizing requests to the widget API.
- Applying personalized settings.

### Debug mode

To enable diagnostic logs in the browser console, add `data-debug="true"`:

```html
<script
  defer
  src="https://looksy.tech/min-script.js"
  data-shop-token="YOUR_SHOP_TOKEN"
  data-debug="true"></script>
```

In this mode, the script writes diagnostic messages with the `[Looksy]` prefix.

### Public API

After loading, the script exposes the `window.VirtualFitting` object:

- `window.VirtualFitting.open(productData)` — open the widget programmatically.
- `window.VirtualFitting.close()` — close the widget.
- `window.VirtualFitting.init()` — rescan the page and reinitialize buttons. Useful after dynamically loading products.

---

# Integration Examples for Popular CMS Platforms

## Need help?

If you have trouble integrating the widget or have questions, contact our team. We can help configure the widget for your specific platform.

---

## WooCommerce (WordPress)

### Recommended method: Code Snippets plugin

This method works for most WooCommerce stores. You do not need to edit theme files, search for `footer.php`, or create `single-product.php`.

Do not use this method together with manual script insertion in `footer.php`, otherwise the SDK may be loaded twice.

### 1. Install Code Snippets

1. Open the WordPress admin panel.
2. Go to `Plugins -> Add New`.
3. Search for `Code Snippets`.
4. Install and activate the plugin.
5. Make sure the `Snippets` or `Code Snippets` section appears in the menu.

### 2. Create a new PHP snippet

1. Go to `Snippets -> Add New`.
2. Set a name, for example `Looksy WooCommerce Widget`.
3. Paste the code below.
4. Replace `YOUR_SHOP_TOKEN` with your store token.
5. If needed, change the language using `data-lang`.

Available options:

```text
data-lang="en" - English interface and Try on button
data-lang="ru" or no data-lang - Russian/default mode
```

### 3. Paste the code

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

### 4. Activate the snippet

1. Select `Run snippet everywhere`.
2. Click `Save Changes and Activate`.
3. Make sure the snippet is enabled.

If the snippet is saved but not activated, the widget will not appear on the site.

### 5. Check the product page

Open any WooCommerce product page, for example:

```text
/product/product-name/
```

Expected result:

- A try-on button appears on the product image.
- Clicking the button opens the Looksy widget.
- Browser console messages with the `[Looksy]` prefix appear if `data-debug="true"` is temporarily enabled.

### 6. If the button does not appear

Open DevTools -> `Console`.

Check whether this message appears:

```text
[Looksy] WooCommerce product marked
```

If the message is missing, check that:

- the snippet is activated;
- `Run snippet everywhere` is selected;
- you are on a product page;
- the product has a main image;
- the store is not in `Coming Soon` mode;
- for testing, you can add `data-debug="true"` to the SDK tag.

If this message appears:

```text
[Looksy] WooCommerce product image not found
```

the theme uses non-standard image markup. In this case, use manual product markup or configure a custom selector.

### 7. How to enable and disable debug mode

For testing, add:

```html
data-debug="true"
```

After testing, remove this attribute or replace it with:

```html
data-debug="false"
```

### 8. How to change the button language

For the English button:

```html
<script
  defer
  src="https://looksy.tech/min-script.js"
  data-shop-token="YOUR_SHOP_TOKEN"
  data-lang="en">
</script>
```

For Russian/default mode, remove `data-lang` or set:

```html
data-lang="ru"
```

### 9. Manual integration for developers

If the theme significantly changes the standard WooCommerce markup, you can mark up the product manually:

```html
<div
  data-fitting-product
  data-fitting-name="Product name"
  data-fitting-price="$49">
  <img
    src="https://example.com/product.jpg"
    alt="Product name"
    data-fitting-image />
</div>
```

`data-fitting-product` is added to the container of one product.

`data-fitting-image` is added to the product image inside that container.

`data-fitting-name` and `data-fitting-price` pass the product name and price to the widget.

### 10. Not recommended for regular users

Do not edit `footer.php` or create `single-product.php` unless you are a theme developer.

## Shopify

### Purpose

This instruction adds the `Try on` button to the Shopify product page.

After installation, the SDK receives the current product data: image, name, and price. The button is added to the main product image.

### Where to start in Shopify Admin

1. In the left menu, open `Sales channels -> Online Store`.
2. In the `Current theme` block, click `...` or `Actions`.
3. Select `Edit code`.

### 1. Add the SDK in `theme.liquid`

In the file editor, open:

```txt
layout/theme.liquid
```

Find the closing tag:

```liquid
</body>
```

If there is already a block near it:

```liquid
{% if request.page_type == 'product' %}
  ...
{% endif %}
```

add the SDK inside the existing block, before its `{% endif %}`.

If there is no such block, add a new block before `</body>`:

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

Replace `YOUR_SHOP_TOKEN` with your store token.

The SDK must be connected only once. If the theme already contains this line:

```txt
https://looksy.tech/min-script.js
```

do not add the same script again.

### 2. Add product markup

Now find the template that outputs the main product image or gallery.

In some themes, this file is called:

```txt
snippets/product-information-content.liquid
```

It may contain this block:

```liquid
<div
  class="product-information__media"
  data-testid="product-information-media"
>
  {{ media_gallery }}
</div>
```

Add these attributes to this `div`:

```liquid
data-fitting-product
data-fitting-name="{{ product.title | escape }}"
data-fitting-price="{{ product.price | money }}"
```

The result should look like this:

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

In this example, `.product-information__media` is the product gallery container. The `data-fitting-*` attributes pass the current product data to the SDK.

### 3. If the file has a different name

Shopify themes may use different file and block names. If you cannot find `snippets/product-information-content.liquid`, use the theme code search.

In the Shopify code editor, search one by one for:

```txt
product-information__media
```

```txt
media_gallery
```

```txt
media-gallery
```

```txt
product.media
```

```txt
product.featured_media
```

```txt
product.featured_image
```

```txt
product__media
```

```txt
product-media
```

```txt
product-gallery
```

```txt
main-product
```

```txt
{{ product.title
```

```txt
{{ product.price
```

You need to find the block that outputs the main product image or product gallery on the product page.

Usually, the correct place is near variables such as:

```liquid
{{ product.title }}
{{ product.price }}
{{ product.media }}
{{ product.featured_media }}
{{ product.featured_image }}
```

or classes such as:

```txt
product__media
product-media
product-gallery
media-gallery
product-single__media
product-information__media
```

### 4. Option: pass the image through the container

If it is difficult to add `data-fitting-image` directly to the `<img>`, you can pass the image URL through the product container:

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

If the template exposes a regular `<img>`, you can use the standard option:

```liquid
<img
  src="{{ product.featured_image | image_url: width: 1200 }}"
  alt="{{ product.title | escape }}"
  data-fitting-image>
```

### 5. Save and test

1. Click `Save`.
2. Open a product page.
3. Refresh the page.
4. Check whether the `Try on` button appears.

Test on a product page, for example:

```txt
/products/product-name
```

### 6. Check via DevTools

If the button does not appear, temporarily enable debug mode:

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

Open DevTools -> `Elements` and check that the page contains:

```txt
data-fitting-product
```

Then check that there is an image:

```txt
data-fitting-image
```

or that the image URL is passed through `data-fitting-image` on the container.

In DevTools -> `Network`, check that the following file is loaded:

```txt
min-script.js
```

There should be only one SDK script on the page.

## Bitrix (1C-Bitrix)

### 1. Add the script in the template

```php
<?php
// In footer.php or in the bitrix:main.include component
?>
<script defer src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
```

### 2. Configure the product card

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

### 3. Product catalog

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

### 1. Add the script

In `catalog/view/theme/default/template/common/footer.tpl`:

```php
<script defer src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
</body>
</html>
```

### 2. Product page

In `catalog/view/theme/default/template/product/product.tpl`:

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

### 1. Add in theme.js

```javascript
$(document).ready(function() {
    const script = document.createElement('script');
    script.src = 'https://looksy.tech/min-script.js';
    script.setAttribute('data-shop-token', 'YOUR_SHOP_TOKEN');
    document.body.appendChild(script);
});
```

### 2. Product template

In `themes/your-theme/templates/catalog/product.tpl`:

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

### 1. Add via layout XML

Create `app/design/frontend/YourVendor/YourTheme/Magento_Theme/layout/default.xml`:

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

Create `app/design/frontend/YourVendor/YourTheme/Magento_Theme/templates/virtual-fitting.phtml`:

```php
<script defer src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
```

### 2. Product template

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

### What the integration does

For Tilda, it is enough to add one script in the site settings. After that, Looksy SDK automatically tracks when a product card opens, finds the product image, name, and price, and adds the try-on button inside the opened card.

Manual `data-fitting-*` markup is usually not required.

### 1. Open site settings

1. Log in to your Tilda account.
2. Open the required site.
3. Go to **Site Settings**.

### 2. Open the code insertion section

In site settings, open:

```txt
More -> Code Injection
```

or, depending on the Tilda interface:

```txt
Site Settings -> Code Injection
```

Find the block for adding HTML code before the closing `</body>` tag.

It is usually called:

```txt
Before closing BODY tag
```

or:

```txt
Before </body>
```

Click `Edit code`.

### 3. Paste the Looksy code

Add this code:

```html
<script
  defer
  src="https://looksy.tech/min-script.js"
  data-shop-token="YOUR_SHOP_TOKEN"
  data-debug="true">
</script>
```

Important: keep the `defer` attribute for Tilda.

### 4. Save changes

1. Click `Save`.
2. Return to the site.
3. Publish the site again.

In Tilda, changes in site settings are applied to published pages after republishing.

### 5. Test the integration

Open the published site and test the flow:

```txt
catalog -> product card -> open product -> product photo
```

Expected result:

- the try-on button appears inside the opened product card;
- the button is attached to the product photo;
- clicking it opens the Looksy widget.

### 6. If the button does not appear

Open DevTools -> `Console` and check for `[Looksy]` messages.

Also check that:

- the script was added in site settings, not only on one page;
- the site was republished after saving the code;
- the code contains `data-shop-token`;
- the `defer` attribute was not removed;
- the product card contains a product image;
- the page does not include `min-script.js` twice.

### 7. How to disable debug mode

After testing, you can replace:

```html
data-debug="true"
```

with:

```html
data-debug="false"
```

or remove the attribute:

```html
<script
  defer
  src="https://looksy.tech/min-script.js"
  data-shop-token="YOUR_SHOP_TOKEN">
</script>
```

### For custom layouts

If you use a custom Zero Block or your own HTML product markup, you can mark the product manually:

```html
<div
  data-fitting-product
  data-fitting-name="Product name"
  data-fitting-price="$49">
  <img
    src="product.jpg"
    alt="Product name"
    data-fitting-image>
</div>
```

After dynamically inserting a product, you can call:

```html
<script>
  if (window.VirtualFitting) {
    window.VirtualFitting.init();
  }
</script>
```

## Plain HTML/CSS/JS

### Product catalog

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Catalog</title>
</head>
<body>
    <div class="products">
        <div class="product" 
             data-fitting-product 
             data-fitting-name="Basic T-shirt" 
             data-fitting-price="$39">
            <img src="images/tshirt.jpg" 
                 alt="T-shirt"
                 data-fitting-image />
            <h3>Basic T-shirt</h3>
            <p class="price">$39</p>
        </div>
    </div>

    <script defer src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
</body>
</html>
```

### With dynamic loading

```html
<div id="products-container"></div>

<script defer src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
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

## React (SPA)

Connect the SDK once in `index.html` or in the root layout. Call `window.VirtualFitting.init()` at the page/route level after content renders, not inside every product card.

Example initialization on route change:

```tsx
function useLooksyInitOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (window.VirtualFitting) {
        window.VirtualFitting.init();
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);
}
```

## Vue.js

Connect the SDK once in `index.html`. Call `window.VirtualFitting.init()` at the app level on route changes, not inside the product card.

```html
<script
  defer
  src="https://looksy.tech/min-script.js"
  data-shop-token="YOUR_SHOP_TOKEN"
  data-lang="en">
</script>
```

Example initialization in `App.vue`:

```vue
<script setup>
import { nextTick, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

watch(
  () => route.path,
  async () => {
    await nextTick();
    if (window.VirtualFitting) {
      window.VirtualFitting.init();
    }
  },
  { immediate: true }
);
</script>
```

The product card/page must contain `data-fitting-*`, and the button should be anchored to the photo block:

```vue
<div
  class="product-media"
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
```

If `img` uses a local or private URL, pass a public URL separately on the container:

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
