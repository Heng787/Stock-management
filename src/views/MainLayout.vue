<script setup>
import { onMounted } from 'vue'
import AppSidebar from '../components/AppSidebar.vue'
import GlobalTopbar from '../components/GlobalTopbar.vue'
import ToastContainer from '../components/ToastContainer.vue'
import { useStockStore } from '../stores/stock'
import { useUIStore } from '../stores/ui'
import { Menu, X } from 'lucide-vue-next'
const stock = useStockStore()
const ui = useUIStore()

onMounted(() => {
  stock.fetchAll()
})
</script>

<template>
  <div class="app-layout" :class="{ 'sidebar-collapsed': !ui.isSidebarOpen }">
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <!-- Mobile Overlay -->
    <div v-if="ui.isMobileMenuOpen" class="mobile-overlay" @click="ui.closeMobileMenu"></div>
    <ToastContainer />

    <!-- Sidebar Wrapper -->
    <div class="sidebar-wrapper" :class="{ 'mobile-open': ui.isMobileMenuOpen }">
      <AppSidebar />
    </div>

    <div class="main-container">
      <header class="mobile-header">
        <button 
          @click="ui.toggleMobileMenu" 
          class="menu-btn"
          aria-label="Toggle mobile menu"
          :aria-expanded="ui.isMobileMenuOpen"
        >
          <Menu v-if="!ui.isMobileMenuOpen" :size="24" />
          <X v-else :size="24" />
        </button>
        <span class="mobile-logo">StockFlow</span>
      </header>

      <main id="main-content" class="content-area">
        <GlobalTopbar />
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-color);
}

.sidebar-wrapper {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: 260px; /* Default sidebar width */
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-area {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.mobile-header {
  display: none;
  height: 64px;
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  align-items: center;
  padding: 0 1.5rem;
  gap: 1rem;
  position: sticky;
  top: 0;
  z-index: 50;
}

.menu-btn {
  background: transparent;
  border: none;
  color: var(--text-color);
  cursor: pointer;
}

.mobile-logo {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--primary-color);
}

/* Transitions */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.3s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 1024px) {
  .main-container {
    margin-left: 0;
  }

  .sidebar-wrapper {
    transform: translateX(-100%);
  }

  .sidebar-wrapper.mobile-open {
    transform: translateX(0);
  }

  .mobile-header {
    display: flex;
  }

  .mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    z-index: 90;
  }

  .content-area {
    padding: 1.5rem;
  }
}
</style>
