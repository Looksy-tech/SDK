import { createRouter, createWebHistory } from "vue-router";
import CatalogPage from "./pages/CatalogPage.vue";
import ProductPage from "./pages/ProductPage.vue";

const routes = [
  { path: "/", component: CatalogPage },
  { path: "/product1", component: ProductPage, props: { productId: "product1" } },
  { path: "/product2", component: ProductPage, props: { productId: "product2" } },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
