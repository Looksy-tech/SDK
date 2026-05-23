<template>
  <main class="page">
    <h1>Catalog</h1>
    <div class="grid">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>
  </main>
</template>

<script setup>
import ProductCard from "../components/ProductCard.vue";
import { products } from "../data/products";
</script>
