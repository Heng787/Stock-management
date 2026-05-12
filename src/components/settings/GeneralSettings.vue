<!-- src/components/settings/GeneralSettings.vue -->
<script setup>
import { reactive, watch } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { Save, UploadCloud, Building2 } from 'lucide-vue-next';

const settings = useSettingsStore();
const form = reactive({ ...settings.config.business, ...settings.config.localization });

// REFACTOR-1: Ensure local form state stays synced if settings are loaded after mount
watch(
  () => [settings.config.business, settings.config.localization],
  ([newBusiness, newLocalization]) => {
    Object.assign(form, newBusiness, newLocalization);
  },
  { deep: true }
);

const handleSave = () => {
  const business = { name: form.name, address: form.address, phone: form.phone, email: form.email };
  const localization = { currency: form.currency, dateFormat: form.dateFormat, timezone: form.timezone };
  settings.saveSettings('business', business);
  settings.saveSettings('localization', localization);
};
</script>

<template>
  <div class="section">
    <div class="section-header">
      <h2>Business Profile</h2>
      <p>Configure your organization details for invoices and reports.</p>
    </div>

    <form @submit.prevent="handleSave" class="settings-form">
      <div class="logo-upload card">
        <div class="current-logo">
          <img v-if="form.logo" :src="form.logo" alt="Business Logo" />
          <div v-else class="logo-placeholder"><Building2 :size="32" /></div>
        </div>
        <div class="upload-info">
          <h3>Business Logo</h3>
          <p>PNG or JPG, max 2MB. Recommended 200x200px.</p>
          <button type="button" class="btn btn-secondary btn-sm">
            <UploadCloud :size="16" /> Change Logo
          </button>
        </div>
      </div>

      <div class="grid">
        <div class="input-group">
          <label>Organization Name</label>
          <input v-model="form.name" placeholder="e.g. Acme Corp" />
        </div>
        <div class="input-group">
          <label>Email Address</label>
          <input v-model="form.email" type="email" />
        </div>
        <div class="input-group">
          <label>Contact Phone</label>
          <input v-model="form.phone" />
        </div>
        <div class="input-group">
          <label>Default Currency</label>
          <select v-model="form.currency">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="KHR">KHR (៛)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
      </div>

      <div class="input-group">
        <label>Physical Address</label>
        <textarea v-model="form.address" rows="3"></textarea>
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
.settings-form { display: flex; flex-direction: column; gap: 2rem; }
.logo-upload { display: flex; align-items: center; gap: 2rem; padding: 1.5rem; border: 1.5px dashed var(--border-color); background: transparent; }
.current-logo { width: 80px; height: 80px; border-radius: 16px; background: var(--hover-color); display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid var(--border-color); }
.logo-placeholder { color: var(--text-muted); }
.upload-info h3 { font-size: 1rem; margin-bottom: 0.25rem; font-weight: 700; }
.upload-info p { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.footer-actions { display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid var(--border-color); }

.btn-sm { padding: 0.5rem 1rem; font-size: 0.8rem; }
</style>
