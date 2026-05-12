<!-- src/components/settings/InventorySettings.vue -->
<script setup>
import { reactive, watch } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { Save, AlertTriangle, Hash, Percent } from 'lucide-vue-next';

const settings = useSettingsStore();
const form = reactive({ ...settings.config.inventory });

watch(
  () => settings.config.inventory,
  (newVal) => Object.assign(form, newVal),
  { deep: true }
);

const handleSave = () => {
  settings.saveSettings('inventory', form);
};
</script>

<template>
  <div class="section">
    <div class="section-header">
      <h2>Inventory Rules</h2>
      <p>Configure automated behaviors and defaults for your stock.</p>
    </div>

    <form @submit.prevent="handleSave" class="settings-form">
      <div class="setting-card">
        <div class="setting-info">
          <div class="icon-box"><AlertTriangle :size="20" class="text-warning" /></div>
          <div>
            <h3>Low Stock Alerts</h3>
            <p>Automatically notify staff when items drop below minimum threshold.</p>
          </div>
        </div>
        <label class="toggle">
          <input type="checkbox" v-model="form.lowStockAlerts" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <div class="icon-box"><Hash :size="20" class="text-primary" /></div>
          <div>
            <h3>SKU Auto-generation</h3>
            <p>Generate SKU numbers automatically (e.g. PRD-123456) when left blank.</p>
          </div>
        </div>
        <label class="toggle">
          <input type="checkbox" v-model="form.skuPrefixEnabled" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <div class="icon-box"><Percent :size="20" class="text-success" /></div>
          <div>
            <h3>Default Tax Rate (%)</h3>
            <p>Apply this tax rate automatically to new sales transactions.</p>
          </div>
        </div>
        <div class="input-inline">
          <input type="number" v-model="form.defaultTaxRate" min="0" max="100" step="0.1" />
          <span class="suffix">%</span>
        </div>
      </div>

      <div class="footer-actions">
        <button type="submit" class="btn btn-primary">
          <Save :size="18" /> Save Changes
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.section-header { margin-bottom: 2rem; }
.section-header h2 { margin-bottom: 0.5rem; font-weight: 800; }
.settings-form { display: flex; flex-direction: column; gap: 1rem; }

.setting-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.setting-info { display: flex; align-items: center; gap: 1rem; }
.setting-info h3 { font-size: 1rem; margin-bottom: 0.25rem; font-weight: 700; color: var(--text-color); }
.setting-info p { font-size: 0.85rem; color: var(--text-muted); margin: 0; }

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--hover-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-inline {
  display: flex;
  align-items: center;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0 1rem;
}
.input-inline input { border: none; background: transparent; width: 60px; text-align: right; padding: 0.5rem 0; font-size: 1rem; }
.input-inline input:focus { outline: none; }
.input-inline .suffix { color: var(--text-muted); font-weight: 600; margin-left: 0.25rem; }

/* Toggle Switch Styles */
.toggle { position: relative; display: inline-block; width: 44px; height: 24px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border-color); transition: .4s; border-radius: 24px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
input:checked + .slider { background-color: var(--primary-color); }
input:checked + .slider:before { transform: translateX(20px); }

.footer-actions { display: flex; justify-content: flex-end; padding-top: 1rem; margin-top: 1rem; border-top: 1px solid var(--border-color); }

.text-warning { color: #f59e0b; }
.text-primary { color: var(--primary-color); }
.text-success { color: #10b981; }
</style>
