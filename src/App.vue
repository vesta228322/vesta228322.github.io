<template>
  <NavBar />
  <main class="main-layout">
    <RouterView />
  </main>
</template>

<script setup>
import NavBar from "@/components/NavBar.vue";
</script>

<style>
.main-layout {
  min-height: 100vh;
  padding-top: var(--nav-height);
}
</style>
