<!-- src/components/settings/PlaceholderSettings.vue -->
<script setup>
defineProps({ title: String, description: String });
</script>
<template>
  <div class="placeholder-settings">
    <div class="section-header">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <div class="empty-state card glass">
      <p>This module is being finalized by <strong>wiz</strong> and <strong>kevin</strong>.</p>
      <div class="progress-bar"><div class="progress"></div></div>
    </div>
  </div>
</template>
<style scoped>
.section-header { margin-bottom: 2rem; }
.empty-state { padding: 4rem; text-align: center; border: 2px dashed var(--border-color); background: transparent; }
.progress-bar { width: 200px; height: 4px; background: var(--border-color); border-radius: 2px; margin: 2rem auto; overflow: hidden; }
.progress { width: 60%; height: 100%; background: var(--primary-color); animation: pulse 2s infinite; }
@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
</style>
