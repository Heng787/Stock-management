<script setup>
import { ref, onMounted } from 'vue';
import { Activity, AlertCircle } from 'lucide-vue-next';
import client from '../api/client';

const logs = ref([]);
const loading = ref(true);

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await client.get('/audit');
    logs.value = res.data;
  } catch (err) {
    console.error('Failed to fetch logs:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchLogs);

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDetails = (log) => {
  const d = log.details;
  if (!d) return 'No details available';

  switch (log.module) {
    case 'STOCK': {
      const qty = Math.abs(d.quantity || 0);
      const action = d.type === 'IN' ? 'Added' : (d.type === 'OUT' ? 'Removed' : 'Adjusted');
      const prod = d.productName || `Product ${d.productId?.slice(-4) || ''}`;
      return `${action} ${qty} units of ${prod}`;
    }
    
    case 'PRODUCTS':
      if (log.action === 'CREATE') return `Created new product: ${d.name || 'Unknown'}`;
      if (log.action === 'UPDATE') return `Updated product details for ${d.name || d.productId || 'Product'}`;
      if (log.action === 'DELETE') return `Deleted product: ${d.name || 'Unknown'}`;
      return `Product action: ${log.action}`;

    case 'WAREHOUSES':
      return `${log.action === 'CREATE' ? 'Created' : 'Updated'} warehouse: ${d.name || 'Unknown'}`;

    case 'CUSTOMERS':
      return `${log.action === 'CREATE' ? 'Registered' : 'Updated'} customer: ${d.name || 'Unknown'}`;

    case 'SUPPLIERS':
      return `${log.action === 'CREATE' ? 'Added' : 'Updated'} supplier: ${d.name || 'Unknown'}`;

    case 'AUTH':
      return log.action === 'LOGIN' ? 'User signed into the system' : 'Auth activity';

    default:
      // Fallback for custom or unknown logs
      return typeof d === 'string' ? d : JSON.stringify(d).slice(0, 100);
  }
};

const getActionClass = (action) => {
  switch (action) {
    case 'CREATE': return 'log-create';
    case 'UPDATE': return 'log-update';
    case 'DELETE': return 'log-delete';
    case 'ADJUST': return 'log-adjust';
    default: return '';
  }
};
</script>

<template>
  <div class="logs-page">
    <header class="header">
      <div class="title-section">
        <h1>Audit Logs</h1>
        <p class="subtitle">Complete history of system changes and user activity.</p>
      </div>
      <button @click="fetchLogs" class="btn btn-secondary">
        <Activity :size="18" />
        <span>Refresh Logs</span>
      </button>
    </header>

    <div class="table-card card glass">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading activity logs...</p>
      </div>
      <div v-else-if="logs.length === 0" class="empty-state">
        <AlertCircle :size="48" />
        <p>No activity logs found yet.</p>
      </div>
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Module</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log._id">
              <td class="date-cell">{{ formatDate(log.timestamp) }}</td>
              <td>
                <div class="user-cell">
                  <div class="mini-avatar">{{ log.userId?.name?.[0] }}</div>
                  <span>{{ log.userId?.name }}</span>
                </div>
              </td>
              <td>
                <span class="action-tag" :class="getActionClass(log.action)">
                  {{ log.action }}
                </span>
              </td>
              <td class="module-cell">{{ log.module }}</td>
              <td class="details-cell">
                <span class="readable-details">{{ formatDetails(log) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logs-page { display: flex; flex-direction: column; gap: 2.5rem; animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.header { display: flex; justify-content: space-between; align-items: flex-end; }
.title-section h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
.subtitle { color: var(--text-muted); font-size: 0.95rem; }

.table-card { padding: 0; min-height: 400px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1); }
.table-wrapper { overflow-x: auto; }

.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th { padding: 1.25rem 1.5rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.02); }
.data-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); font-size: 0.875rem; vertical-align: middle; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover { background: rgba(var(--primary-rgb), 0.02); }

.date-cell { color: var(--text-muted); font-variant-numeric: tabular-nums; font-weight: 500; }
.user-cell { display: flex; align-items: center; gap: 0.75rem; font-weight: 600; }
.mini-avatar { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, var(--primary-color), #6366f1); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; box-shadow: 0 4px 10px -2px rgba(99, 102, 241, 0.3); }

.action-tag { font-size: 0.65rem; font-weight: 800; padding: 0.35rem 0.75rem; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 0.4rem; }
.log-create { color: #059669; background: #ecfdf5; border: 1px solid #d1fae5; }
.log-update { color: #2563eb; background: #eff6ff; border: 1px solid #dbeafe; }
.log-delete { color: #dc2626; background: #fef2f2; border: 1px solid #fee2e2; }
.log-adjust { color: #d97706; background: #fffbeb; border: 1px solid #fef3c7; }

.module-cell { font-weight: 700; color: var(--text-muted); font-size: 0.75rem; opacity: 0.8; }
.details-cell { max-width: 450px; }
.readable-details { 
  font-weight: 500; 
  color: var(--text-color); 
  font-size: 0.85rem; 
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem; color: var(--text-muted); gap: 1.5rem; }
.spinner { width: 48px; height: 48px; border: 4px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
