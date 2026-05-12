<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useSettingsStore } from './stores/settings';
import ToastContainer from './components/ToastContainer.vue';

const auth = useAuthStore();
const settings = useSettingsStore();

onMounted(async () => {
  if (auth.isLoggedIn) {
    await settings.loadSettings();
    settings.applyTheme();
  }
});
</script>

<template>
  <router-view />
  <ToastContainer />
</template>

<style>
/* Global styles if needed */
</style>
