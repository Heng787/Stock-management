<!-- src/views/SettingsView.vue -->
<script setup>
import { ref } from 'vue';

import { 
  Building2, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Database, 
  Palette,
  Tag
} from 'lucide-vue-next';

// Components
import GeneralSettings from '../components/settings/GeneralSettings.vue';
import AppearanceSettings from '../components/settings/AppearanceSettings.vue';
import CategorySettings from '../components/settings/CategorySettings.vue';
import InventorySettings from '../components/settings/InventorySettings.vue';
import SecuritySettings from '../components/settings/SecuritySettings.vue';
import MaintenanceSettings from '../components/settings/MaintenanceSettings.vue';

const activeTab = ref('general');

const tabs = [
  { id: 'general', name: 'Business Profile', icon: Building2 },
  { id: 'categories', name: 'Categories', icon: Tag },
  { id: 'inventory', name: 'Inventory Rules', icon: SettingsIcon },
  { id: 'security', name: 'Security & Roles', icon: ShieldCheck },
  { id: 'appearance', name: 'UI & Appearance', icon: Palette },
  { id: 'maintenance', name: 'Maintenance', icon: Database }
];

// REFACTOR-2: Removed redundant onMounted(() => settings.loadSettings())
// as it is already handled globally in App.vue to maintain state.
</script>

<template>
  <div class="settings-page">
    <header class="header">
      <div class="header-content">
        <h1>System Settings</h1>
        <p>Centralized configuration for your enterprise stock management.</p>
      </div>
    </header>

    <div class="settings-container card glass">
      <aside class="settings-sidebar">
        <nav class="settings-nav">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            class="nav-item"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" :size="20" />
            <span>{{ tab.name }}</span>
          </button>
        </nav>
      </aside>

      <main class="settings-main">
        <Transition name="fade-slide" mode="out-in">
          <div :key="activeTab" class="tab-content">
            <GeneralSettings v-if="activeTab === 'general'" />
            <CategorySettings v-else-if="activeTab === 'categories'" />
            <InventorySettings v-else-if="activeTab === 'inventory'" />
            <SecuritySettings v-else-if="activeTab === 'security'" />
            <AppearanceSettings v-else-if="activeTab === 'appearance'" />
            <MaintenanceSettings v-else-if="activeTab === 'maintenance'" />
          </div>
        </Transition>
      </main>
    </div>
  </div>
</template>

<style scoped>
.settings-page { animation: fadeIn 0.4s ease-out; padding-bottom: 2rem; }
.header { margin-bottom: 2.5rem; }
.header h1 { font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, var(--text-color), var(--text-muted)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.header p { color: var(--text-muted); margin-top: 0.5rem; font-size: 1.1rem; }

.settings-container { display: grid; grid-template-columns: 280px 1fr; min-height: 750px; padding: 0; overflow: hidden; border-radius: 32px; border: 1px solid rgba(255,255,255,0.1); }
.settings-sidebar { background: rgba(0, 0, 0, 0.03); padding: 2rem 1.5rem; border-right: 1px solid var(--border-color); }
.settings-nav { display: flex; flex-direction: column; gap: 0.75rem; }

.nav-item { display: flex; align-items: center; gap: 1.25rem; padding: 1rem 1.5rem; border: none; background: transparent; border-radius: 16px; color: var(--text-muted); font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.nav-item:hover { background: var(--hover-color); color: var(--text-color); transform: translateX(4px); }
.nav-item.active { background: var(--primary-color); color: white; box-shadow: 0 8px 20px rgba(var(--primary-rgb), 0.3); }

.settings-main { padding: 3rem; overflow-y: auto; background: rgba(255, 255, 255, 0.01); }

/* Transitions */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(15px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-15px); }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 1024px) {
  .settings-container { grid-template-columns: 1fr; }
  .settings-sidebar { border-right: none; border-bottom: 1px solid var(--border-color); }
}
</style>
