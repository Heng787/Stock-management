<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useUIStore } from '../stores/ui';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  LogOut,
  Box,
  Moon,
  Sun,
  ShoppingCart,
  TrendingUp,
  Users,
  UserCheck,
  Truck,
  Warehouse as WarehouseIcon,
  ReceiptText,
  Activity
} from 'lucide-vue-next';

const router = useRouter();
const auth = useAuthStore();
const ui = useUIStore();

const menuGroups = [
  {
    label: 'Main',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { name: 'Inventory', icon: Package, path: '/inventory' },
      { name: 'Warehouses', icon: WarehouseIcon, path: '/warehouses' }
    ]
  },
  {
    label: 'Transactions',
    items: [
      { name: 'Sales', icon: ShoppingCart, path: '/sales' },
      { name: 'Purchases', icon: TrendingUp, path: '/purchases' },
      { name: 'Reports', icon: TrendingUp, path: '/analytics' },
      { name: 'History', icon: ReceiptText, path: '/transactions' }
    ]
  },
  {
    label: 'People',
    items: [
      { name: 'Suppliers', icon: Truck, path: '/suppliers' },
      { name: 'Customers', icon: Users, path: '/customers' },
      { name: 'Staff', icon: UserCheck, path: '/staff' }
    ]
  },
  {
    label: 'System',
    items: [
      { name: 'Logs', icon: Activity, path: '/logs' },
      { name: 'Settings', icon: Settings, path: '/settings' }
    ]
  }
];

const handleLogout = () => {
  auth.logout();
  router.push('/login');
};

const handleNavClick = () => {
  ui.closeMobileMenu();
};
</script>

<template>
  <aside class="sidebar glass">
    <div class="logo">
      <div class="logo-icon">
        <Box :size="24" />
      </div>
      <span>StockFlow</span>
      <button 
        @click="ui.toggleTheme" 
        class="theme-toggle" 
        :aria-label="'Switch to ' + (ui.theme === 'light' ? 'dark' : 'light') + ' mode'"
      >
        <Moon v-if="ui.theme === 'light'" :size="18" />
        <Sun v-else :size="18" />
      </button>
    </div>

    <nav class="nav">
      <div v-for="group in menuGroups" :key="group.label" class="nav-group">
        <h4 class="group-label">{{ group.label }}</h4>
        <router-link 
          v-for="item in group.items" 
          :key="item.path" 
          :to="item.path"
          class="nav-item"
          active-class="active"
          @click="handleNavClick"
        >
          <div class="icon-box">
            <component :is="item.icon" :size="18" />
          </div>
          <span>{{ item.name }}</span>
        </router-link>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="user-card glass">
        <div class="avatar">{{ auth.user?.name?.[0] }}</div>
        <div class="details">
          <p class="name">{{ auth.user?.name }}</p>
          <p class="role">{{ auth.user?.role }}</p>
        </div>
      </div>
      <button @click="handleLogout" class="logout-btn">
        <LogOut :size="20" />
        <span>Sign Out</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 2rem;
  color: var(--primary-color);
  padding: 0 0.5rem;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.theme-toggle {
  margin-left: auto;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.group-label {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin: 0 0 0.5rem 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 10px;
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: var(--hover-color);
  color: var(--text-color);
}

.nav-item.active {
  background: var(--primary-color);
  color: white;
}

.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
}

.sidebar-footer {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: var(--surface-color);
}

.avatar {
  width: 36px;
  height: 36px;
  background: var(--primary-color);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.details .name { font-weight: 700; font-size: 0.85rem; margin: 0; color: var(--text-color); }
.details .role { font-size: 0.65rem; color: var(--text-muted); margin: 0; text-transform: uppercase; }

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  width: 100%;
  border: none;
  background: transparent;
  color: var(--error-color);
  cursor: pointer;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
}

.logout-btn:hover { background: var(--error-light); }
</style>
