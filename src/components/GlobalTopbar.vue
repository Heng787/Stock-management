<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import client from '../api/client';
import { useUIStore } from '../stores/ui';
import { 
  Search, 
  Bell, 
  ChevronRight, 
  AlertTriangle, 
  TrendingUp, 
  UserPlus, 
  CheckCircle2 
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const ui = useUIStore();
const searchQuery = ref('');
const showNotifications = ref(false);
const notifications = ref([]);

const fetchNotifications = async () => {
  try {
    const res = await client.get('/notifications');
    notifications.value = res.data;
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
  }
};

const markRead = async (id) => {
  try {
    await client.patch(`/notifications/${id}/read`);
    notifications.value = notifications.value.filter(n => n._id !== id);
  } catch (err) {
    console.error('Failed to mark read:', err);
  }
};

const markAllRead = async () => {
  try {
    await client.post('/notifications/read-all');
    notifications.value = [];
    ui.notify('All notifications cleared', 'success');
  } catch (err) {
    console.error('Failed to mark all read:', err);
  }
};

const getNotificationConfig = (type) => {
  switch (type) {
    case 'LOW_STOCK': return { icon: AlertTriangle, color: 'var(--error-color)', bg: 'var(--error-light)' };
    case 'SALE': return { icon: TrendingUp, color: 'var(--success-color)', bg: 'var(--success-light)' };
    case 'STAFF': return { icon: UserPlus, color: 'var(--primary-color)', bg: 'var(--primary-light)' };
    default: return { icon: CheckCircle2, color: 'var(--primary-color)', bg: 'var(--primary-light)' };
  }
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return date.toLocaleDateString();
};

const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);

const breadcrumbs = computed(() => {
  const pathArray = route.path.split('/').filter(p => p);
  
  if (pathArray.length === 0) {
    return [{ name: 'Dashboard', path: '/' }];
  }

  const breadcrumbList = [{ name: 'Dashboard', path: '/' }];
  
  let currentPath = '';
  pathArray.forEach(path => {
    currentPath += `/${path}`;
    breadcrumbList.push({
      name: path.charAt(0).toUpperCase() + path.slice(1),
      path: currentPath
    });
  });
  
  return breadcrumbList;
});

const handleSearch = () => {
  const q = searchQuery.value.trim();
  if (!q) return;
  router.push({ path: '/inventory', query: { search: q } });
  searchQuery.value = '';
};

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
};

const closeNotifications = (e) => {
  if (showNotifications.value && !e.target.closest('.notification-wrapper')) {
    showNotifications.value = false;
  }
};

onMounted(() => {
  fetchNotifications();
  // Poll every 60 seconds
  const interval = setInterval(fetchNotifications, 60000);
  window.addEventListener('click', closeNotifications);
  onUnmounted(() => {
    clearInterval(interval);
    window.removeEventListener('click', closeNotifications);
  });
});

onUnmounted(() => {
  window.removeEventListener('click', closeNotifications);
});
</script>

<template>
  <header class="global-topbar glass">
    <div class="breadcrumbs">
      <div v-for="(crumb, index) in breadcrumbs" :key="crumb.path" class="breadcrumb-item">
        <router-link :to="crumb.path" :class="{ 'active': index === breadcrumbs.length - 1 }">
          {{ crumb.name }}
        </router-link>
        <ChevronRight v-if="index < breadcrumbs.length - 1" :size="16" class="separator" />
      </div>
    </div>

    <div class="topbar-actions">
      <div class="search-container">
        <Search :size="18" class="search-icon" />
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search products, SKUs..." 
          @keyup.enter="handleSearch"
          class="search-input"
        />
      </div>

      <div class="notification-wrapper">
        <button 
          @click.stop="toggleNotifications"
          class="notification-btn" 
          :class="{ 'active': showNotifications }"
          aria-label="Notifications"
        >
          <Bell :size="20" />
          <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
        </button>

        <transition name="dropdown">
          <div v-if="showNotifications" class="notification-dropdown card glass">
            <div class="dropdown-header">
              <h3>Notifications</h3>
              <button class="mark-read-btn" @click="markAllRead" v-if="notifications.length > 0">
                <CheckCircle2 :size="14" />
                <span>Mark all as read</span>
              </button>
            </div>
            
            <div class="notification-list">
              <div v-if="notifications.length === 0" class="empty-notifications">
                <p>No new notifications</p>
              </div>
              <div 
                v-for="item in notifications" 
                :key="item._id" 
                class="notification-item"
                :class="{ 'unread': !item.isRead }"
                @click="markRead(item._id)"
              >
                <div class="item-icon" :style="{ 
                  backgroundColor: getNotificationConfig(item.type).bg, 
                  color: getNotificationConfig(item.type).color 
                }">
                  <component :is="getNotificationConfig(item.type).icon" :size="18" />
                </div>
                <div class="item-content">
                  <div class="item-top">
                    <p class="item-title">{{ item.title }}</p>
                    <span class="item-time">{{ formatTime(item.timestamp) }}</span>
                  </div>
                  <p class="item-msg">{{ item.message }}</p>
                </div>
              </div>
            </div>

            <div class="dropdown-footer">
              <button @click="router.push('/logs')" class="view-all-btn">
                View All Activity
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.global-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 2rem;
  margin-bottom: 2rem;
  border-radius: 20px;
  background: var(--surface-color);
  box-shadow: 0 4px 20px -10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 1rem;
  z-index: 80;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-item a {
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.breadcrumb-item a:hover {
  color: var(--primary-color);
  transform: translateY(-1px);
}

.breadcrumb-item a.active {
  color: var(--text-color);
  font-weight: 800;
  pointer-events: none;
}

.separator {
  color: var(--text-muted);
  opacity: 0.4;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.search-container {
  position: relative;
  width: 280px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  opacity: 0.6;
}

.search-input {
  width: 100%;
  padding: 0.65rem 1rem 0.65rem 2.75rem;
  border: 1.5px solid var(--border-color);
  border-radius: 99px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 0.85rem;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: var(--surface-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.notification-wrapper {
  position: relative;
}

.notification-btn {
  position: relative;
  background: var(--bg-color);
  border: 1.5px solid var(--border-color);
  color: var(--text-color);
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.notification-btn:hover, .notification-btn.active {
  background: var(--primary-light);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--error-color);
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  border: 2px solid var(--surface-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Dropdown */
.notification-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 360px;
  padding: 0;
  border-radius: 18px;
  box-shadow: 0 20px 50px -15px rgba(0,0,0,0.2);
  z-index: 1000;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.dropdown-header {
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-header h3 { font-size: 1rem; font-weight: 800; margin: 0; }

.mark-read-btn {
  background: transparent;
  border: none;
  color: var(--primary-color);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  opacity: 0.8;
  transition: opacity 0.2s;
}
.mark-read-btn:hover { opacity: 1; }

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  padding: 1rem 1.25rem;
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s;
}
.notification-item:hover { background: var(--hover-color); }
.notification-item:last-child { border-bottom: none; }
.notification-item.unread { background: rgba(var(--primary-rgb), 0.03); }
.notification-item.unread .item-title { color: var(--primary-color); }

.empty-notifications { padding: 3rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.9rem; font-weight: 600; }

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-content { flex: 1; min-width: 0; }
.item-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem; }
.item-title { font-weight: 700; font-size: 0.85rem; margin: 0; }
.item-time { font-size: 0.7rem; color: var(--text-muted); }
.item-msg { font-size: 0.8rem; color: var(--text-muted); margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-clamp: 2; overflow: hidden; }

.dropdown-footer {
  padding: 1rem;
  background: rgba(0,0,0,0.02);
  text-align: center;
}

.view-all-btn {
  width: 100%;
  padding: 0.6rem;
  background: var(--hover-color);
  border: none;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s;
}
.view-all-btn:hover { background: var(--primary-light); color: var(--primary-color); }

/* Transitions */
.dropdown-enter-active, .dropdown-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

@media (max-width: 768px) {
  .global-topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
  }
  
  .topbar-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .search-container {
    width: 100%;
    flex: 1;
    margin-right: 1rem;
  }

  .notification-dropdown {
    position: fixed;
    top: 64px;
    left: 1rem;
    right: 1rem;
    width: auto;
  }
}
</style>
