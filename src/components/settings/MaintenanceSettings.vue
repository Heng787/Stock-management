<!-- src/components/settings/MaintenanceSettings.vue -->
<script setup>
import { ref } from 'vue';
import { useUIStore } from '../../stores/ui';
import { Database, Download, ServerCrash, Trash2, AlertTriangle } from 'lucide-vue-next';
import api from '../../api/client';
import * as settingsApi from '../../api/settingsApi';

const ui = useUIStore();
const isBackingUp = ref(false);
const isExporting = ref('');
const isWiping = ref(false);

const triggerBackup = async () => {
  if (!confirm('This will create a full snapshot of the database. Proceed?')) return;
  
  isBackingUp.value = true;
  try {
    const res = await api.post('/settings/backup');
    ui.notify(res.data.message || 'Backup initiated successfully', 'success');
  } catch (err) {
    ui.notify(err.error || 'Backup failed', 'error');
  } finally {
    isBackingUp.value = false;
  }
};

const handleClearDatabase = async () => {
  const confirmation1 = confirm('WARNING: This will delete ALL Products, Warehouses, Suppliers, Customers, and Transactions.\n\nOnly Categories and your Admin account will be kept.\n\nAre you ABSOLUTELY sure?');
  if (!confirmation1) return;

  const confirmation2 = confirm('FINAL WARNING: This action is permanent and cannot be undone.\n\nProceed with system wipe?');
  if (!confirmation2) return;

  isWiping.value = true;
  try {
    const res = await settingsApi.clearDatabase();
    ui.notify(res.data.message || 'Database wiped successfully', 'success');
    // Refresh page to clear local states
    setTimeout(() => window.location.reload(), 2000);
  } catch (err) {
    ui.notify(err.response?.data?.error || 'Failed to wipe database', 'error');
  } finally {
    isWiping.value = false;
  }
};

const handleExport = async (resource) => {
  isExporting.value = resource;
  try {
    const res = await api.get(`/settings/export/${resource}`, { responseType: 'blob' });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${resource}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    ui.notify(`${resource} exported successfully`, 'success');
  } catch (err) {
    ui.notify(`Failed to export ${resource}`, 'error');
  } finally {
    isExporting.value = '';
  }
};
</script>

<template>
  <div class="section">
    <div class="section-header">
      <h2>System Maintenance</h2>
      <p>Data exports, backups, and critical system operations.</p>
    </div>

    <div class="maintenance-grid">
      
      <!-- Backup Section -->
      <div class="maintenance-card danger-zone">
        <div class="card-header">
          <div class="icon-box warning-box"><Database :size="20" /></div>
          <h3>System Backup</h3>
        </div>
        <p>Create a full JSON snapshot of your Products, Customers, and Transactions. This file will be stored securely on the server.</p>
        <button 
          @click="triggerBackup" 
          class="btn btn-warning" 
          :disabled="isBackingUp"
        >
          <Database v-if="!isBackingUp" :size="16" />
          <span v-if="isBackingUp" class="spinner"></span>
          {{ isBackingUp ? 'Generating Backup...' : 'Trigger Full Backup' }}
        </button>
      </div>

      <!-- Export Section -->
      <div class="maintenance-card">
        <div class="card-header">
          <div class="icon-box primary-box"><Download :size="20" /></div>
          <h3>Data Export (CSV)</h3>
        </div>
        <p>Download your raw data as CSV files for use in external spreadsheet software like Excel or Google Sheets.</p>
        <div class="export-actions">
          <button @click="handleExport('products')" class="btn btn-secondary btn-sm" :disabled="isExporting !== ''">
            {{ isExporting === 'products' ? 'Exporting...' : 'Export Products' }}
          </button>
          <button @click="handleExport('customers')" class="btn btn-secondary btn-sm" :disabled="isExporting !== ''">
            {{ isExporting === 'customers' ? 'Exporting...' : 'Export Customers' }}
          </button>
          <button @click="handleExport('transactions')" class="btn btn-secondary btn-sm" :disabled="isExporting !== ''">
            {{ isExporting === 'transactions' ? 'Exporting...' : 'Export Transactions' }}
          </button>
        </div>
      </div>

      <!-- Wipe Database (Requirement) -->
      <div class="maintenance-card danger-zone-red">
        <div class="card-header">
          <div class="icon-box error-box"><Trash2 :size="20" /></div>
          <h3>System Reset</h3>
        </div>
        <p>Delete all Products, Transactions, and Master Data. <br/><strong>Note: Categories and Admin account will be preserved.</strong></p>
        <button 
          @click="handleClearDatabase" 
          class="btn btn-error" 
          :disabled="isWiping"
        >
          <Trash2 v-if="!isWiping" :size="16" />
          <span v-if="isWiping" class="spinner"></span>
          {{ isWiping ? 'Wiping Database...' : 'Wipe Everything' }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.section-header { margin-bottom: 2rem; }
.section-header h2 { margin-bottom: 0.5rem; font-weight: 800; }

.maintenance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .maintenance-grid { grid-template-columns: 1fr; }
}

.maintenance-card {
  padding: 1.5rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.danger-zone {
  border-color: rgba(245, 158, 11, 0.3);
  background: linear-gradient(145deg, var(--surface-color), rgba(245, 158, 11, 0.05));
}

.danger-zone-red {
  border-color: rgba(239, 68, 68, 0.3);
  background: linear-gradient(145deg, var(--surface-color), rgba(239, 68, 68, 0.05));
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-header h3 { font-weight: 700; margin: 0; }

.maintenance-card p {
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  flex: 1;
}

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.warning-box { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.error-box { background: rgba(239, 68, 68, 0.1); color: var(--error-color); }
.primary-box { background: rgba(14, 165, 233, 0.1); color: var(--primary-color); }

.export-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-warning {
  background: #f59e0b;
  color: white;
  border: none;
}
.btn-warning:hover:not(:disabled) { background: #d97706; }

.btn-error {
  background: var(--error-color);
  color: white;
  border: none;
}
.btn-error:hover:not(:disabled) { background: #dc2626; }

.btn-sm { padding: 0.5rem 1rem; font-size: 0.85rem; }

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
