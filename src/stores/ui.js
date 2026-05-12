import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const isSidebarOpen = ref(true);
  const isMobileMenuOpen = ref(false);
  const theme = ref(localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', theme.value);
    document.documentElement.dataset.theme = theme.value;
  };

  const initTheme = () => {
    document.documentElement.dataset.theme = theme.value;
  };

  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
  };

  const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
  };

  const closeMobileMenu = () => {
    isMobileMenuOpen.value = false;
  };

  // Immediate init for SSR/hydration consistency
  if (typeof window !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme.value);
  }

  const toasts = ref([]);

  const notify = (message, type = 'success', duration = 3000) => {
    const id = Date.now();
    toasts.value.push({ id, message, type });
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id);
    }, duration);
  };

  return {
    isSidebarOpen,
    isMobileMenuOpen,
    theme,
    toasts,
    toggleSidebar,
    toggleMobileMenu,
    closeMobileMenu,
    toggleTheme,
    initTheme,
    notify
  };
});
