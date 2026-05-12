<!-- src/components/settings/SecuritySettings.vue -->
<script setup>
import { reactive, watch } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { Save, ShieldCheck, History, Users } from 'lucide-vue-next';

const settings = useSettingsStore();
const form = reactive({ ...settings.config.security });

watch(
  () => settings.config.security,
  (newVal) => Object.assign(form, newVal),
  { deep: true }
);

const handleSave = () => {
  settings.saveSettings('security', form);
};

const defaultRoles = [
  { id: 'admin', name: 'Administrator', desc: 'Full access to all modules and system settings.' },
  { id: 'manager', name: 'Manager', desc: 'Can manage inventory, sales, and view reports. Cannot access system settings.' },
  { id: 'staff', name: 'Staff', desc: 'Can only process sales and view basic inventory.' }
];
</script>

<template>
  <div class="section">
    <div class="section-header">
      <h2>Security & Roles</h2>
      <p>Manage system access levels and data retention policies.</p>
    </div>

    <form @submit.prevent="handleSave" class="settings-form">
      
      <!-- Data Retention -->
      <div class="setting-card">
        <div class="setting-info">
          <div class="icon-box"><History :size="20" class="text-primary" /></div>
          <div>
            <h3>Audit Log Retention</h3>
            <p>Number of days to keep system activity logs before automatic deletion.</p>
          </div>
        </div>
        <div class="input-inline">
          <input type="number" v-model="form.auditLogRetentionDays" min="7" max="365" />
          <span class="suffix">days</span>
        </div>
      </div>

      <!-- Role Management Mockup -->
      <div class="roles-section">
        <div class="roles-header">
          <div class="setting-info">
            <div class="icon-box"><ShieldCheck :size="20" class="text-success" /></div>
            <div>
              <h3>Role Permissions (RBAC)</h3>
              <p>System roles are predefined for stability. Assign these to users in the Staff module.</p>
            </div>
          </div>
        </div>
        
        <div class="roles-grid">
          <div v-for="role in defaultRoles" :key="role.id" class="role-card">
            <div class="role-icon"><Users :size="16" /></div>
            <div class="role-details">
              <h4>{{ role.name }}</h4>
              <p>{{ role.desc }}</p>
            </div>
          </div>
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
.settings-form { display: flex; flex-direction: column; gap: 1.5rem; }

.setting-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
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
.input-inline .suffix { color: var(--text-muted); font-weight: 600; margin-left: 0.5rem; }

/* Roles Grid */
.roles-section {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--surface-color);
  overflow: hidden;
}

.roles-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.roles-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1px;
  background: var(--border-color);
}

.role-card {
  background: var(--surface-color);
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.role-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
}

.role-details h4 { font-weight: 700; margin-bottom: 0.25rem; }
.role-details p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; margin: 0; }

.footer-actions { display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid var(--border-color); }

.text-primary { color: var(--primary-color); }
.text-success { color: #10b981; }
</style>
