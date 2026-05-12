<script setup>
import { Trash2, Download, CheckCircle, X } from 'lucide-vue-next';

defineProps({
  selectedCount: Number,
  isVisible: Boolean
});

const emit = defineEmits(['clear', 'delete', 'export', 'mark-paid']);
</script>

<template>
  <Transition name="slide-up">
    <div v-if="isVisible" class="bulk-toolbar card glass">
      <div class="selection-info">
        <span class="count">{{ selectedCount }}</span>
        <span>items selected</span>
      </div>
      
      <div class="divider"></div>
      
      <div class="actions">
        <button class="action-btn" @click="emit('mark-paid')">
          <CheckCircle :size="18" />
          <span>Mark as Paid</span>
        </button>
        <button class="action-btn" @click="emit('export')">
          <Download :size="18" />
          <span>Export Selected</span>
        </button>
        <button class="action-btn delete" @click="emit('delete')">
          <Trash2 :size="18" />
          <span>Delete</span>
        </button>
      </div>

      <button class="close-btn" @click="emit('clear')">
        <X :size="18" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.bulk-toolbar {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 99px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.4);
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.count {
  background: var(--primary-color);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.action-btn.delete { color: #f87171; }
.action-btn.delete:hover { background: rgba(248, 113, 113, 0.1); }

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Transitions */
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translate(-50%, 100px);
  opacity: 0;
}
</style>
