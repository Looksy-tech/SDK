<template>
  <article class="card">
    <RouterLink :to="`/${product.id}`" class="card-link">
      <img :src="product.image" :alt="product.name" class="card-image" />
      <h2 class="card-title">{{ product.name }}</h2>
      <p class="card-price">{{ product.price }}</p>
    </RouterLink>
  </article>
</template>

<script setup>
defineProps({
  product: {
    type: Object,
    required: true,
  },
});
</script>
