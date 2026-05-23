<template>
  <RouterView />
</template>

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
