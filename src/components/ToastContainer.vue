<script setup>
import { useUIStore } from '../stores/ui'
import { CheckCircle2, AlertCircle, Info } from 'lucide-vue-next'

const ui = useUIStore()

const getIcon = (type) => {
  switch (type) {
    case 'success': return CheckCircle2
    case 'error': return AlertCircle
    default: return Info
  }
}
</script>

<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div 
        v-for="toast in ui.toasts" 
        :key="toast.id" 
        class="toast-item glass"
        :class="toast.type"
      >
        <div class="toast-icon">
          <component :is="getIcon(toast.type)" :size="20" />
        </div>
        <p class="toast-msg">{{ toast.message }}</p>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  min-width: 280px;
  max-width: 400px;
  padding: 1rem 1.25rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  background: var(--surface-color);
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-msg {
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
}

/* Types */
.success .toast-icon { color: #10b981; }
.success { border-left: 4px solid #10b981; }

.error .toast-icon { color: #ef4444; }
.error { border-left: 4px solid #ef4444; }

.info .toast-icon { color: var(--primary-color); }
.info { border-left: 4px solid var(--primary-color); }

/* Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}
</style>
