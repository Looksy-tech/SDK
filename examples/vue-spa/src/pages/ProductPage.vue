<template>
  <main class="page">
    <RouterLink class="back-link" to="/">Back to catalog</RouterLink>
    <div class="product-layout">
      <div
        class="product-media"
        data-fitting-product
        :data-fitting-name="product.name"
        :data-fitting-price="product.price"
        :data-fitting-image="product.tryOnImage"
      >
        <img
          class="product-image"
          :src="product.image"
          :alt="product.name"
          :data-fitting-image="product.tryOnImage"
        />
      </div>
      <div>
        <h1>{{ product.name }}</h1>
        <p class="product-price">{{ product.price }}</p>
        <p class="product-description">{{ product.description }}</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed } from "vue";
import { products } from "../data/products";

const props = defineProps({
  productId: {
    type: String,
    required: true,
  },
});

const product = computed(() => products.find((item) => item.id === props.productId) || products[0]);
</script>
