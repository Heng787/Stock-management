<script setup>
defineProps(['categories', 'modelValue']);
defineEmits(['update:modelValue']);
</script>

<template>
  <div class="category-tabs">
    <button 
      class="tab-btn" 
      :class="{ active: modelValue === 'all' }"
      @click="$emit('update:modelValue', 'all')"
    >
      All Items
    </button>
    <button 
      v-for="cat in categories" 
      :key="cat._id"
      class="tab-btn"
      :class="{ active: modelValue === cat._id }"
      @click="$emit('update:modelValue', cat._id)"
    >
      {{ cat.name }}
    </button>
  </div>
</template>

<style scoped>
.category-tabs {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.25rem 0.25rem 0.75rem;
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color) transparent;
}

.category-tabs::-webkit-scrollbar { height: 4px; }
.category-tabs::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

.tab-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.9rem;
}

.tab-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
}

.tab-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  box-shadow: 0 10px 20px -5px rgba(var(--primary-rgb), 0.3);
}
</style>
