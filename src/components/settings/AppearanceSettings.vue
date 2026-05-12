<!-- src/components/settings/AppearanceSettings.vue -->
<script setup>
import { reactive, watch } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { Monitor, Sun, Moon, Layout, Save } from 'lucide-vue-next';

const settings = useSettingsStore();
const form = reactive({ ...settings.config.ui });

// REFACTOR-1: Ensure local form state stays synced if settings are loaded after mount
watch(
  () => settings.config.ui,
  (newUI) => {
    Object.assign(form, newUI);
  },
  { deep: true }
);

const handleSave = () => {
  settings.saveSettings('ui', form);
};
</script>

<template>
  <div class="section">
    <div class="section-header">
      <h2>UI & Appearance</h2>
      <p>Personalize how the application looks and feels.</p>
    </div>

    <div class="appearance-grid">
      <div class="input-group">
        <label>Color Theme</label>
        <div class="theme-selector">
          <button 
            type="button" 
            class="theme-btn" 
            :class="{ active: form.theme === 'light' }"
            @click="form.theme = 'light'"
          >
            <Sun :size="20" />
            <span>Light</span>
          </button>
          <button 
            type="button" 
            class="theme-btn" 
            :class="{ active: form.theme === 'dark' }"
            @click="form.theme = 'dark'"
          >
            <Moon :size="20" />
            <span>Dark</span>
          </button>
          <button 
            type="button" 
            class="theme-btn" 
            :class="{ active: form.theme === 'system' }"
            @click="form.theme = 'system'"
          >
            <Monitor :size="20" />
            <span>System</span>
          </button>
        </div>
      </div>

      <div class="input-group">
        <label>Layout Options</label>
        <div class="toggle-card card">
          <div class="toggle-info">
            <Layout :size="20" />
            <div>
              <h4>Compact Sidebar</h4>
              <p>Keep the sidebar collapsed by default for more workspace.</p>
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="form.sidebarCollapsed">
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>

    <div class="footer-actions">
      <button class="btn btn-primary" @click="handleSave">
        <Save :size="18" /> Apply Changes
      </button>
    </div>
  </div>
</template>

<style scoped>
.section-header { margin-bottom: 2rem; }
.section-header h2 { margin-bottom: 0.5rem; font-weight: 800; }
.appearance-grid { display: grid; gap: 2.5rem; }
.theme-selector { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.theme-btn { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 1.5rem; border: 1.5px solid var(--border-color); background: transparent; border-radius: 16px; cursor: pointer; transition: all 0.2s; color: var(--text-muted); font-weight: 600; }
.theme-btn:hover { border-color: var(--primary-color); color: var(--text-color); }
.theme-btn.active { border-color: var(--primary-color); background: var(--primary-light); color: var(--primary-color); }

.toggle-card { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; background: var(--hover-color); border: 1px solid var(--border-color); }
.toggle-info { display: flex; gap: 1rem; align-items: center; }
.toggle-info h4 { margin: 0; font-weight: 700; }
.toggle-info p { font-size: 0.85rem; color: var(--text-muted); margin: 0; }

.footer-actions { display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid var(--border-color); margin-top: 2rem; }

/* Switch Style */
.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border-color); transition: .4s; border-radius: 24px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
input:checked + .slider { background-color: var(--primary-color); }
input:checked + .slider:before { transform: translateX(20px); }
</style>
