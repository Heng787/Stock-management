<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStockStore } from '../stores/stock';
import { useUIStore } from '../stores/ui';
import { 
  ReceiptText, 
  TrendingUp, 
  ShoppingCart, 
  Download, 
  ArrowRight
} from 'lucide-vue-next';
import TransactionSummaryCards from '../components/TransactionSummaryCards.vue';
import BulkActionToolbar from '../components/BulkActionToolbar.vue';
import TransactionDetailsDrawer from '../components/TransactionDetailsDrawer.vue';
import TransactionFilters from '../components/TransactionFilters.vue';
import { formatDate, formatCurrency, formatID } from '../utils/format';
import { exportToCSV } from '../utils/export';

const stock = useStockStore();
const ui = useUIStore();
const searchQuery = ref('');
const typeFilter = ref('ALL');
const selectedIds = ref([]);
const startDate = ref('');
const endDate = ref('');
const selectedTransaction = ref(null);
const isDrawerOpen = ref(false);

const clearDates = () => {
  startDate.value = '';
  endDate.value = '';
};

const clearFilters = () => {
  clearDates();
  searchQuery.value = '';
  typeFilter.value = 'ALL';
};

onMounted(() => {
  stock.fetchAll();
});

const filteredTransactions = computed(() => {
  const transactions = stock.transactions || [];
  let list = [...transactions];
  
  if (typeFilter.value !== 'ALL') {
    list = list.filter(t => t.type === typeFilter.value);
  }
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(t => 
      (t._id || '').toLowerCase().includes(q) || 
      (t.customer?.name || '').toLowerCase().includes(q) ||
      (t.supplier?.name || '').toLowerCase().includes(q)
    );
  }
  
  if (startDate.value) {
    const start = new Date(startDate.value);
    start.setHours(0, 0, 0, 0);
    list = list.filter(t => t.createdAt && new Date(t.createdAt) >= start);
  }
  
  if (endDate.value) {
    const end = new Date(endDate.value);
    end.setHours(23, 59, 59, 999);
    list = list.filter(t => t.createdAt && new Date(t.createdAt) <= end);
  }
  
  return list;
});

const toggleSelectAll = (event) => {
  if (event.target.checked) {
    selectedIds.value = filteredTransactions.value.map(t => t._id).filter(id => !!id);
  } else {
    selectedIds.value = [];
  }
};

const toggleSelect = (id) => {
  if (!id) return;
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

const formatTime = (dateString) => {
  if (!dateString) return '--:--';
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusColor = (type) => {
  return type === 'SALE' ? '#10b981' : '#ef4444';
};

const handleBulkDelete = () => {
  ui.notify(`Bulk delete functionality pending implementation`, 'info');
  selectedIds.value = [];
};

const handleBulkExport = () => {
  const dataToExport = stock.transactions
    .filter(t => selectedIds.value.includes(t._id))
    .map(t => ({
      Date: formatDate(t.createdAt),
      Reference: formatID(t._id),
      Type: t.type,
      Status: t.status || 'Completed',
      Entity: t.customer?.name || t.supplier?.name || 'N/A',
      Total: t.total
    }));
    
  exportToCSV(dataToExport, 'Selected_Transactions');
  ui.notify(`Exporting ${selectedIds.value.length} records...`, 'success');
  selectedIds.value = [];
};

const handleExportAll = () => {
  if (filteredTransactions.value.length === 0) {
    ui.notify('No transactions to export', 'warning');
    return;
  }
  
  const dataToExport = filteredTransactions.value.map(t => ({
    Date: formatDate(t.createdAt),
    Reference: formatID(t._id),
    Type: t.type,
    Status: t.status || 'Completed',
    Entity: t.customer?.name || t.supplier?.name || 'Walk-in',
    Items: (t.items || []).length,
    Total: t.total,
    Currency: t.currency
  }));

  exportToCSV(dataToExport, 'Transactions_Report');
  ui.notify('Export completed successfully', 'success');
};

const viewDetails = (t) => {
  selectedTransaction.value = t;
  isDrawerOpen.value = true;
};
</script>

<template>
  <div class="transactions-page">
    <header class="header">
      <div class="title-section">
        <h1>Transaction History</h1>
        <p class="subtitle">Review and track all sales and purchase activities.</p>
      </div>
      <div class="header-actions">
        <button @click="handleExportAll" class="btn btn-secondary">
          <Download :size="18" />
          <span>Export List</span>
        </button>
      </div>
    </header>

    <TransactionSummaryCards :transactions="filteredTransactions" />

    <TransactionFilters 
      v-model:searchQuery="searchQuery"
      v-model:startDate="startDate"
      v-model:endDate="endDate"
      v-model:typeFilter="typeFilter"
      @clear="clearDates"
    />

    <div class="table-card card glass">
      <div v-if="filteredTransactions.length === 0" class="empty-state">
        <ReceiptText :size="48" />
        <p>No transactions found matching your criteria.</p>
        <button v-if="searchQuery || startDate || endDate || typeFilter !== 'ALL'" @click="clearFilters" class="btn btn-secondary btn-sm">
          Reset All Filters
        </button>
      </div>
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input 
                  type="checkbox" 
                  :checked="selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0"
                  @change="toggleSelectAll" 
                />
              </th>
              <th>Date</th>
              <th>Reference ID</th>
              <th>Type & Status</th>
              <th>Entity</th>
              <th class="text-right">Total</th>
              <th class="action-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="t in filteredTransactions" 
              :key="t._id" 
              :class="{ 'selected': selectedIds.includes(t._id) }"
              @click="toggleSelect(t._id)"
            >
              <td class="checkbox-col" @click.stop>
                <input 
                  type="checkbox" 
                  :checked="selectedIds.includes(t._id)"
                  @change="toggleSelect(t._id)" 
                />
              </td>
              <td class="date-cell">
                <div class="date-info">
                  <span class="main-date">{{ formatDate(t.createdAt) }}</span>
                  <span class="sub-time">{{ formatTime(t.createdAt) }}</span>
                </div>
              </td>
              <td class="id-cell">
                <span class="ref-link">{{ formatID(t._id) }}</span>
              </td>
              <td>
                <div class="status-stack">
                  <span class="status-badge" :style="{ color: getStatusColor(t.type), background: getStatusColor(t.type) + '15' }">
                    <ShoppingCart v-if="t.type === 'SALE'" :size="12" />
                    <TrendingUp v-else :size="12" />
                    {{ t.type }}
                  </span>
                  <div class="payment-status">
                    <span class="dot" :class="t.status?.toLowerCase() || 'completed'"></span>
                    <span class="status-text">{{ t.status || 'Completed' }}</span>
                  </div>
                </div>
              </td>
              <td class="entity-cell">
                <p class="entity-name">{{ t.customer?.name || t.supplier?.name || 'Walk-in Customer' }}</p>
                <p class="entity-meta">{{ (t.items || []).length }} Items</p>
              </td>
              <td class="text-right total-cell">
                <span :style="{ color: getStatusColor(t.type) }">
                  {{ t.type === 'SALE' ? '+' : '-' }}{{ formatCurrency(t.total) }}
                </span>
              </td>
              <td class="action-col" @click.stop>
                <button 
                  class="icon-btn" 
                  title="View Details"
                  @click="viewDetails(t)"
                >
                  <ArrowRight :size="18" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BulkActionToolbar 
      :is-visible="selectedIds.length > 0"
      :selected-count="selectedIds.length"
      @clear="selectedIds = []"
      @delete="handleBulkDelete"
      @export="handleBulkExport"
    />

    <TransactionDetailsDrawer 
      :is-open="isDrawerOpen"
      :transaction="selectedTransaction"
      @close="isDrawerOpen = false"
    />
  </div>
</template>

<style scoped>
.transactions-page { display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 5rem; animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.header { display: flex; justify-content: space-between; align-items: flex-end; }
.header-actions { display: flex; gap: 1rem; align-items: center; }

.table-card { padding: 0; overflow: hidden; border-radius: 20px; box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.05); }
.table-wrapper { overflow-x: auto; max-height: calc(100vh - 400px); }

.data-table { width: 100%; border-collapse: collapse; text-align: left; }

.data-table thead th { 
  position: sticky; 
  top: 0; 
  z-index: 10; 
  background: var(--surface-color);
  padding: 1rem 1.5rem; 
  font-size: 0.7rem; 
  text-transform: uppercase; 
  letter-spacing: 0.1em; 
  color: var(--text-muted); 
  border-bottom: 2px solid var(--border-color); 
}

.data-table tr { position: relative; }
.data-table td { padding: 0.75rem 1.5rem; border-bottom: 1px solid var(--border-color); transition: all 0.2s; cursor: pointer; }
.data-table tr:hover td { background: var(--hover-color); }
.data-table tr.selected td { background: rgba(var(--primary-rgb), 0.08); }
.data-table tr.selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--primary-color);
  z-index: 5;
}

.checkbox-col { width: 48px; text-align: center; }
.checkbox-col input { width: 18px; height: 18px; border-radius: 4px; cursor: pointer; }

.date-info { display: flex; flex-direction: column; }
.main-date { font-weight: 700; color: var(--text-color); font-size: 0.85rem; }
.sub-time { font-size: 0.7rem; color: var(--text-muted); }

.id-cell { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }
.ref-link { font-weight: 800; color: var(--primary-color); }

.status-stack { display: flex; flex-direction: column; gap: 0.35rem; }
.status-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; width: fit-content; }

.payment-status { display: flex; align-items: center; gap: 0.4rem; }
.dot { width: 6px; height: 6px; border-radius: 50%; }
.dot.completed { background: #10b981; }
.dot.pending { background: #f59e0b; }
.status-text { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }

.entity-name { font-weight: 700; margin: 0; font-size: 0.9rem; }
.entity-meta { font-size: 0.75rem; color: var(--text-muted); margin: 0; }

.total-cell { font-weight: 800; font-size: 1rem; }
.action-col { width: 60px; text-align: center; }

.icon-btn { 
  width: 32px; 
  height: 32px; 
  border-radius: 8px; 
  border: none; 
  background: var(--hover-color); 
  color: var(--text-muted); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  cursor: pointer; 
  transition: all 0.2s; 
}
.icon-btn:hover { 
  background: var(--primary-color); 
  color: white; 
  transform: translateX(4px); 
  box-shadow: 0 4px 10px rgba(var(--primary-rgb), 0.3);
}

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem; color: var(--text-muted); gap: 1.5rem; }
</style>
