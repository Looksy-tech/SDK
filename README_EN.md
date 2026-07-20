# Virtual Try-On Widget - Integration Script

Embeddable script for adding virtual clothing try-on functionality to e-commerce websites.

## Navigation

- [Quick Start](#quick-start)
- [Data Attributes](#data-attributes)
- [Placing the Button Outside the Image](#placing-the-button-outside-the-image)
- [How It Works](#how-it-works)
- [Integration Examples for Popular CMS Platforms](#integration-examples-for-popular-cms-platforms)
- [WooCommerce (WordPress)](#woocommerce-wordpress)
- [Shopify](#shopify)
- [Tilda](#tilda)
- [Plain HTML/CSS/JS Layout](#plain-htmlcssjs-layout)
- [React (for SPA)](#react-for-spa)
- [Vue.js](#vuejs)

## Quick Start

### 1. Add the script

Add the script before the closing `</body>` tag:

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
></script>
```

### 2. Mark up products

Add data attributes to the product elements:

```html
<div
	class="product"
	data-fitting-product
	data-fitting-name="Product name"
	data-fitting-price="$49"
>
	<img
		src="product.jpg"
		alt="Product"
		data-fitting-image
	/>
</div>
```

## Data Attributes

### Required attributes

| Attribute              | Element   | Description                         |
| ---------------------- | --------- | ----------------------------------- |
| `data-fitting-product` | Container | Marks the product container         |
| `data-fitting-image`   | `<img>`   | Marks the product image             |

### Optional attributes

| Attribute            | Element   | Description  | Default value                                                                 |
| -------------------- | --------- | ------------ | ----------------------------------------------------------------------------- |
| `data-fitting-name`  | Container | Product name | First searched in the card/headings text, then taken from the image `alt`     |
| `data-fitting-price` | Container | Product price | Empty string                                                                  |

---

## Placing the Button Outside the Image

By default, the SDK places the button on top of the product image. To place it elsewhere — for example, below an “Add to cart” button — add an empty slot inside the **same** `data-fitting-product` container:

```html
<div
  class="product"
  data-fitting-product
  data-fitting-name="Product name"
  data-fitting-price="$49"
>
  <img src="product.jpg" alt="Product name" data-fitting-image />

  <div class="product-actions">
    <button type="button">Add to cart</button>
    <div data-fitting-button-slot data-fitting-full-width="true"></div>
  </div>
</div>
```

The SDK creates the try-on button and inserts it into the first slot found for the current product. The click handler and product data are retained, so you do not need to create a button or attach an event handler yourself.

- `data-fitting-button-slot` — where the SDK inserts the button;
- `data-fitting-full-width="true"` — optional; makes the button span the slot width. `1`, `yes`, and an empty attribute are also accepted.

When no slot is present, the default placement on the image is used. Do not place a slot outside its specific product container; otherwise the SDK cannot reliably associate the button with the correct product.

---

## How It Works

This section explains how the widget script works under the hood. Understanding these principles will help you configure the integration for almost any service.

### How the script finds products on the page

When the script loads, it automatically scans the whole page for elements with specific **data attributes**. These attributes work like labels:

```
Page
   │
   ├── <div data-fitting-product>  ← The script finds this element
   │      └── <img data-fitting-image>  ← And the image inside it
   │
   └── <div class="other-content">  ← This element is ignored
```

**Selectors** are CSS rules used by the script to find elements:

- `[data-fitting-product]` — finds all elements with the `data-fitting-product` attribute
- `img[data-fitting-image]` — finds all `<img>` elements with the `data-fitting-image` attribute

### The role of data attributes

Data attributes let you “mark” HTML elements for the script without changing their appearance or default behaviour:

| Attribute              | Why it is needed                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| `data-fitting-product` | Tells the script: “This is a product container, add the try-on button here” |
| `data-fitting-image`   | Tells the script: “This is the product image, use it for the try-on”    |
| `data-fitting-name`    | Passes the product name to the widget                                   |
| `data-fitting-price`   | Passes the product price to the widget                                  |

### The `data-shop-token` attribute

The shop token is passed through the `data-shop-token` attribute in the `<script>` tag:

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
></script>
```

The script automatically reads the token on load and uses it to:

- identify your store;
- authorize requests to the widget API;
- apply personalized settings.

### Debug mode

To enable diagnostic logs in the browser console, add `data-debug="true"`:

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
	data-debug="true"
></script>
```

In this mode, the script writes diagnostic messages with the `[Looksy]` prefix.

### Public API

After the script loads, the `window.VirtualFitting` object becomes available:

- `window.VirtualFitting.open(productData)` — opens the widget programmatically;
- `window.VirtualFitting.close()` — closes the widget;
- `window.VirtualFitting.init()` — rescans the page and reinitializes buttons. This is useful after products are loaded dynamically.

---

# Integration Examples for Popular CMS Platforms

## Need help?

If you have trouble integrating the widget or have any questions, contact our team. We can help configure the widget for your specific service.

---

## WooCommerce (WordPress)

### Recommended method: using the Code Snippets plugin

This method works for most WooCommerce stores. You do not need to edit theme files, search for `footer.php`, or create `single-product.php`.

Do not use this method together with manual script insertion in `footer.php`, otherwise the SDK may be loaded twice.

### 1. Install the Code Snippets plugin

1. Open the WordPress admin panel.
2. Go to `Plugins -> Add New`.
3. Search for `Code Snippets`.
4. Install and activate the plugin.
5. Make sure a `Snippets` or `Code Snippets` section appears in the menu.

### 2. Create a new PHP snippet

1. Go to `Snippets -> Add New`.
2. Set a name, for example `Looksy WooCommerce Widget`.
3. Paste the code below.
4. Replace `YOUR_SHOP_TOKEN` with your store token.
5. If needed, change the language via `data-lang`.

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

1. Select the `Run snippet everywhere` mode.
2. Click `Save Changes and Activate`.
3. Make sure the snippet is enabled.

If the snippet is saved but not activated, the widget will not appear on the site.

### 5. Test it on a product page

Open any WooCommerce product page, for example `/product/product-name/`.

Expected result:

- the try-on button appears on the product image;
- clicking the button opens the Looksy widget;
- `[Looksy]` messages appear in the browser console if you temporarily enabled `data-debug="true"`.

### 6. If the button does not appear

Open DevTools -> `Console`.

Check whether this message appears:

```text
[Looksy] WooCommerce product marked
```

If the message is missing, check the following:

- the snippet is activated;
- `Run snippet everywhere` is selected;
- you are viewing an actual product page;
- the product has a main image;
- the store is not in `Coming Soon` mode;
- for testing, you can add `data-debug="true"` to the SDK tag.

If you see this message:

```text
[Looksy] WooCommerce product image not found
```

then the theme uses non-standard image markup. In that case, you need manual product markup or a custom selector setup.

### 7. How to enable and disable debug mode

For testing, add the `data-debug="true"` attribute.

After testing, remove it or replace it with `data-debug="false"`.

### 8. How to change the button language

For the English button:

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
	data-lang="en"
></script>
```

For Russian/default mode, remove `data-lang` or set `data-lang="ru"`.

### 9. Manual integration for developers

If the theme heavily changes the standard WooCommerce markup, you can mark up the product manually:

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

Place `data-fitting-product` on the container of a single product.

Place `data-fitting-image` on the product image inside that container.

`data-fitting-name` and `data-fitting-price` pass the product name and price to the widget.

### 10. Not recommended for regular users

Do not edit `footer.php` or create `single-product.php` unless you are a theme developer.

## Shopify

### Purpose

This guide connects the `Try on` button to a Shopify product page.

After installation, the SDK receives the current product data: image, name, and price. The button is added to the main product image.

### Where to start after logging in to Shopify Admin

1. In the left menu, open `Sales channels -> Online Store`.
2. In the `Current theme` block, click `...` or `Actions`.
3. Choose `Edit code`.

### 1. Add the SDK in `theme.liquid`

In the file editor, open `layout/theme.liquid` and find the closing tag:

```liquid
</body>
```

If there is already a block near it like this:

```liquid
{% if request.page_type == 'product' %}
  ...
{% endif %}
```

add the SDK inside the existing block before its `{% endif %}`.

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

The SDK must be connected only once. If the theme already contains `https://looksy.tech/min-script.js`, do not add the same script again.

### 2. Add product markup

Now find the template that renders the main product image or product gallery.

In some themes, this file is called `snippets/product-information-content.liquid`. It may contain a block like this:

```liquid
<div
  class="product-information__media"
  data-testid="product-information-media"
>
  {{ media_gallery }}
</div>
```

Add these attributes to the div:

```text
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

In this example, `.product-information__media` is the product gallery container. The `data-fitting-*` attributes pass current product data to the SDK.

### 3. If the file has a different name

If you cannot find `snippets/product-information-content.liquid` or this block:

```text
<div
  class="product-information__media"
  data-testid="product-information-media"
>
  {{ media_gallery }}
</div>
```

try the fallback option through the file that renders a single product image.

In the Shopify editor, open `snippets/product-media.liquid`.

There may be two markup variants.

#### Variant A: the image is rendered through `image_tag`

Find a block similar to this:

```liquid
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

In this case, you do not need to rewrite `image_tag`. It is easier to add the attributes to the outer container of one image.

Find a block similar to this:

```liquid
<div
  class="product-media"
  style="--ratio: {{ media.aspect_ratio }}"
  data-media-id="{{ media.id }}"
>
```

Replace it with:

```liquid
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
```

The condition:

```liquid
{%- if media.position == 1 -%}
```

is needed so that the `Try on` button appears only on the first product image, not on every image in the gallery.

After saving, open the product page and check whether the `Try on` button appears.

Important: this method is a fallback. In some Shopify themes, `product-media.liquid` may be used not only for the main product image, but also for the image preview modal. If the button appears in the wrong place, return to searching for the main product gallery container.

#### Variant B: the image is rendered as a regular `<img>`

Find the block that renders the product image. It usually looks similar to this:

```liquid
{%- if media.media_type == 'image' -%}
  <img
    ...
  >
{%- endif -%}
```

Add the `data-fitting-*` attributes to this `<img>`.

Example:

```liquid
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

After saving, open the product page and check whether the `Try on` button appears.

Important: this method is also a fallback. In some Shopify themes, `product-media.liquid` may be used not only for the main product image, but also for the image preview modal. If the button appears in the wrong place, return to searching for the main product gallery container.

#### 3.1 If the button stretches across the whole image

In some Shopify themes, gallery styles may stretch the `Try on` button across the whole image area. If the button appears but looks like a large black block over the entire image, open the file: `layout/theme.liquid`.

Find the place where you added the SDK:

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

Add CSS inside the same block, immediately after `<script>`:

```liquid
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

If the SDK is already connected, do not add a second `<script>`. Add only the following block:

```html
<style>
  ...
</style>
```

inside the existing `{% if request.page_type == 'product' %}` condition.

### 4. Passing the image through the container

If it is difficult to add `data-fitting-image` directly to the `<img>` in the theme, you can pass the image URL on the product container:

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

If a regular `<img>` is available in the template, you can use the standard variant:

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

Test on a product page, for example `/products/product-name`.

### 6. Testing with DevTools

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

Open DevTools -> `Elements` and check that the page contains the `data-fitting-product` attribute.

Then check that there is a `data-fitting-image` attribute, or that the image URL is passed on the container through `data-fitting-image`.

In DevTools -> `Network`, check that `min-script.js` is loaded.

There should be only one SDK connection on the page.

## Bitrix (1C-Bitrix)

### 1. Add the script in the template

```php
<?php
// In footer.php or in the bitrix:main.include component
?>
<script defer src="https://looksy.tech/min-script.js" data-shop-token="YOUR_SHOP_TOKEN"></script>
```

### 2. Product page setup

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

### 1. Add it in `theme.js`

```javascript
$(document).ready(function () {
	const script = document.createElement('script')
	script.src = 'https://looksy.tech/min-script.js'
	script.setAttribute('data-shop-token', 'YOUR_SHOP_TOKEN')
	document.body.appendChild(script)
})
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

### 1. Add through layout XML

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

For Tilda, it is usually enough to add one script in the site settings. After that, the Looksy SDK tracks product card opening, finds the product image, name, and price, and adds the try-on button to the opened product card.

Manual `data-fitting-*` markup is usually not required.

### 1. Open site settings

1. Log in to your Tilda account.
2. Open the required site.
3. Go to **Site Settings**.

### 2. Open the code insertion section

In the site settings, open `More -> Code insertion` or, depending on your Tilda interface, `Site Settings -> Code insertion`.

Find the block for adding HTML code before the closing `</body>` tag. It is usually called `Before closing BODY tag` or `Before </body>`.

Click `Edit code`.

### 3. Paste the Looksy code

Add this code:

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
	data-debug="true"
></script>
```

Important: for Tilda, keep the `defer` attribute.

### 4. Save changes

1. Click `Save`.
2. Return to the site.
3. Publish the site again.

In Tilda, changes made in site settings are applied to published pages only after republishing.

### 5. Test the integration

Open the published site and test the flow: catalog → product card → open product → product photo.

Expected result:

- the try-on button appears in the opened product card;
- the button is attached to the product photo;
- clicking the button opens the Looksy widget.

### 6. If the button does not appear

Open DevTools -> `Console` and check whether there are `[Looksy]` messages.

Also check the following:

- the script was added in the site settings, not only on one page;
- the site was republished after saving the code;
- the code contains `data-shop-token`;
- the `defer` attribute was not removed;
- the product card contains a product image;
- there is no second `min-script.js` connection on the page.

### 7. How to disable debug mode

After testing, replace `data-debug="true"` with `data-debug="false"` or remove the attribute:

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
></script>
```

### For custom layouts

If you use a custom Zero Block or custom HTML product markup, you can mark the product manually:

```html
<div
	data-fitting-product
	data-fitting-name="Product name"
	data-fitting-price="$49"
>
	<img
		src="product.jpg"
		alt="Product name"
		data-fitting-image
	/>
</div>
```

After inserting a product dynamically, you can call:

```html
<script>
	if (window.VirtualFitting) {
		window.VirtualFitting.init()
	}
</script>
```

## Plain HTML/CSS/JS Layout

### Product catalog

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8" />
		<title>Catalog</title>
	</head>
	<body>
		<div class="products">
			<div
				class="product"
				data-fitting-product
				data-fitting-name="Basic T-shirt"
				data-fitting-price="$29"
			>
				<img
					src="images/tshirt.jpg"
					alt="T-shirt"
					data-fitting-image
				/>
				<h3>Basic T-shirt</h3>
				<p class="price">$29</p>
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

### With dynamic loading

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

## React (for SPA)

Connect the SDK once in `index.html` or in the root layout. Call `window.VirtualFitting.init()` at the page/route level after the content has rendered, not inside every product card.

Example initialization on route change:

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

Connect the SDK once in `index.html`, and call `window.VirtualFitting.init()` at the application level when the route changes, not inside the product card.

```html
<script
	defer
	src="https://looksy.tech/min-script.js"
	data-shop-token="YOUR_SHOP_TOKEN"
	data-lang="en"
></script>
```

Example initialization in `App.vue`:

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

The product card/page must contain `data-fitting-*`, and the button should be anchored to the photo block:

```vue
<div class="product-media" data-fitting-product :data-fitting-name="product.name" :data-fitting-price="product.price">
  <img
    :src="product.image"
    :alt="product.name"
    data-fitting-image
  />
</div>
```

If the `img` uses a local or private URL, pass a public URL separately on the container:

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
