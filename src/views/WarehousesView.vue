<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStockStore } from '../stores/stock';
import { useUIStore } from '../stores/ui';
import { 
  Warehouse, Plus, MapPin, Package, Settings, 
  ExternalLink, ArrowRightLeft,
  Store, ShieldAlert, CheckCircle2, AlertTriangle,
  X
} from 'lucide-vue-next';

import StockTransferModal from '../components/modals/StockTransferModal.vue';

const stock = useStockStore();
const ui = useUIStore();
const isModalOpen = ref(false);
const isTransferModalOpen = ref(false);
const selectedSourceWarehouse = ref('');
const isSubmitting = ref(false);
const editingWarehouseId = ref(null);
const warehouseForm = ref({ 
  name: '', 
  location: '', 
  isDefault: false,
  capacity: 1000,
  type: 'Storage',
  status: 'Active',
  manager: ''
});

onMounted(() => {
  stock.fetchAll();
});

const openTransfer = (warehouseId) => {
  selectedSourceWarehouse.value = warehouseId;
  isTransferModalOpen.value = true;
};

const openEditModal = (w) => {
  editingWarehouseId.value = w._id;
  warehouseForm.value = { 
    name: w.name, 
    location: w.location || '', 
    isDefault: w.isDefault || false, 
    capacity: w.capacity || 1000, 
    type: w.type || 'Storage', 
    status: w.status || 'Active' 
  };
  isModalOpen.value = true;
};

const closeMainModal = () => {
  isModalOpen.value = false;
  editingWarehouseId.value = null;
  warehouseForm.value = { name: '', location: '', isDefault: false, capacity: 1000, type: 'Storage', status: 'Active' };
};

const enrichedWarehouses = computed(() => {
  return stock.warehouses.map(w => {
    // Calculate total items and valuation for this warehouse
    let totalItems = 0;
    let totalValue = 0;
    
    stock.products.forEach(p => {
      const stockInW = p.warehouseStock?.find(ws => ws.warehouse === w._id);
      if (stockInW) {
        totalItems += stockInW.quantity;
        totalValue += (stockInW.quantity * p.price);
      }
    });

    const capacityPercent = Math.round((totalItems / (w.capacity || 1000)) * 100);
    
    return {
      ...w,
      totalItems,
      totalValue,
      capacityPercent: Math.min(capacityPercent, 100),
      isFull: capacityPercent >= 100
    };
  });
});

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  
  const trimmedName = warehouseForm.value.name.trim();
  const trimmedLocation = warehouseForm.value.location.trim();
  
  if (!trimmedName) {
    ui.notify('Warehouse name is required', 'error');
    return;
  }

  isSubmitting.value = true;
  try {
    if (editingWarehouseId.value) {
      await stock.updateWarehouse(editingWarehouseId.value, { ...warehouseForm.value, name: trimmedName, location: trimmedLocation });
      ui.notify('Warehouse updated successfully!', 'success');
    } else {
      await stock.addWarehouse({ ...warehouseForm.value, name: trimmedName, location: trimmedLocation });
      ui.notify('Warehouse added successfully!', 'success');
    }
    closeMainModal();
  } catch (err) {
    ui.notify(err.error || 'Failed to save warehouse', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const getMapsLink = (location) => {
  if (!location) return '#';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
};
</script>

<template>
  <div class="warehouses-page">
    <header class="header">
      <div class="title-section">
        <h1>Warehouse Hub</h1>
        <p class="subtitle">Monitor capacity, valuation, and logistics across {{ stock.warehouses.length }} locations.</p>
      </div>
      <button @click="isModalOpen = true" class="btn btn-primary shadow-lg">
        <Plus :size="18" />
        <span>New Location</span>
      </button>
    </header>

    <div class="warehouse-grid">
      <div v-for="w in enrichedWarehouses" :key="w._id" class="card warehouse-card" :class="{ 'full-load': w.isFull }">
        <!-- Top Section -->
        <div class="card-main">
          <div class="icon-box" :class="w.type?.toLowerCase() || 'storage'">
            <component :is="w.type === 'Storefront' ? Store : Warehouse" :size="24" />
          </div>
          
          <div class="content">
            <div class="top-row">
              <div class="title-wrap">
                <h3>{{ w.name }}</h3>
                <div class="badges">
                  <span v-if="w.isDefault" class="badge default">Primary</span>
                  <span class="status-badge" :class="(w.status || 'Active').toLowerCase()">
                    <component :is="w.status === 'Active' ? CheckCircle2 : (w.status === 'Full' ? ShieldAlert : AlertTriangle)" :size="10" />
                    {{ w.status || 'Active' }}
                  </span>
                </div>
              </div>
              <button 
                class="btn-icon mini" 
                @click.stop="openEditModal(w)"
                title="Edit Warehouse"
              >
                <Settings :size="14" />
              </button>
            </div>

            <div class="location-link">
              <MapPin :size="14" />
              <a :href="getMapsLink(w.location)" target="_blank" class="link">
                {{ w.location || 'Assign Location' }}
                <ExternalLink :size="10" />
              </a>
            </div>

            <div class="metrics-row">
              <div class="metric">
                <span class="m-label">Total Items</span>
                <span class="m-value">{{ w.totalItems.toLocaleString() }}</span>
              </div>
              <div class="metric">
                <span class="m-label">Stock Value</span>
                <span class="m-value highlight">${{ w.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="capacity-section">
          <div class="cap-header">
            <span class="cap-label">Capacity Usage</span>
            <span class="cap-value" :class="{ danger: w.capacityPercent > 90 }">{{ w.capacityPercent }}%</span>
          </div>
          <div class="progress-container">
            <div 
              class="progress-fill" 
              :style="{ width: w.capacityPercent + '%' }"
              :class="{ 
                'warning': w.capacityPercent > 70 && w.capacityPercent <= 90,
                'danger': w.capacityPercent > 90 
              }"
            ></div>
          </div>
          <p class="cap-sub">{{ w.totalItems }} / {{ w.capacity || 1000 }} units</p>
        </div>

        <!-- Actions -->
        <div class="card-footer">
          <router-link :to="'/inventory?warehouse=' + w._id" class="action-btn">
            <Package :size="16" />
            <span>Inventory</span>
          </router-link>
          <button class="action-btn" @click="openTransfer(w._id)">
            <ArrowRightLeft :size="16" />
            <span>Transfer</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="stock.warehouses.length === 0" class="empty-warehouse card glass">
      <Warehouse :size="64" class="empty-icon" />
      <h3>No Storage Locations</h3>
      <p>Start by adding your first warehouse or storefront location.</p>
      <button @click="isModalOpen = true" class="btn btn-primary">Add Warehouse</button>
    </div>

    <!-- Modals -->
    <StockTransferModal 
      :is-open="isTransferModalOpen"
      :initial-source-id="selectedSourceWarehouse"
      @close="isTransferModalOpen = false"
      @success="isTransferModalOpen = false"
    />

    <!-- Modal -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal card glass">
        <div class="modal-header">
          <h3>{{ editingWarehouseId ? 'Edit Warehouse' : 'Register New Location' }}</h3>
          <button @click="closeMainModal" class="close-btn"><X :size="20" /></button>
        </div>
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-grid">
            <div class="input-group">
              <label>Location Name *</label>
              <input v-model="warehouseForm.name" required placeholder="e.g. West Coast Hub" />
            </div>
            <div class="input-group">
              <label>Location Type</label>
              <select v-model="warehouseForm.type">
                <option value="Storage">Storage / Warehouse</option>
                <option value="Storefront">Retail Storefront</option>
              </select>
            </div>
          </div>

          <div class="input-group">
            <label>Physical Address / Coordinates</label>
            <input v-model="warehouseForm.location" placeholder="123 Supply Ave, City..." />
          </div>

          <div class="form-grid">
            <div class="input-group">
              <label>Max Unit Capacity</label>
              <input v-model.number="warehouseForm.capacity" type="number" step="100" />
            </div>
            <div class="input-group">
              <label>Status</label>
              <select v-model="warehouseForm.status">
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Full">Full / Locked</option>
              </select>
            </div>
          </div>

          <div class="input-group checkbox">
            <input v-model="warehouseForm.isDefault" type="checkbox" id="isDefault" />
            <label for="isDefault">Set as primary fulfillment center</label>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeMainModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : (editingWarehouseId ? 'Update Warehouse' : 'Create Location') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.warehouses-page { display: flex; flex-direction: column; gap: 2.5rem; }
.header { display: flex; justify-content: space-between; align-items: flex-end; }
.title-section h1 { font-family: 'Outfit', sans-serif; font-size: 2.25rem; font-weight: 800; margin: 0; letter-spacing: -0.02em; }
.subtitle { color: var(--text-muted); margin-top: 0.5rem; font-size: 1.1rem; }

.warehouse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 2rem;
}

.warehouse-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  border-radius: 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.warehouse-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.15);
  border-color: var(--primary-color);
}

.card-main {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  padding-bottom: 1rem;
}

.icon-box {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.icon-box.storage { background: var(--primary-light); color: var(--primary-color); }
.icon-box.storefront { background: #fef2f2; color: #ef4444; }

.content { flex: 1; min-width: 0; }
.top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
.title-wrap { display: flex; flex-direction: column; gap: 0.25rem; }
.title-wrap h3 { margin: 0; font-size: 1.25rem; font-weight: 800; }

.badges { display: flex; gap: 0.5rem; align-items: center; }
.badge { font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
.badge.default { background: var(--primary-color); color: white; }

.status-badge { display: flex; align-items: center; gap: 0.35rem; font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 6px; text-transform: uppercase; }
.status-badge.active { background: #ecfdf5; color: #10b981; }
.status-badge.maintenance { background: #fffbeb; color: #f59e0b; }
.status-badge.full { background: #fef2f2; color: #ef4444; }

.location-link { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; }
.link { color: inherit; text-decoration: none; display: flex; align-items: center; gap: 0.25rem; }
.link:hover { color: var(--primary-color); }

.metrics-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--border-color); }
.metric { display: flex; flex-direction: column; gap: 0.25rem; }
.m-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; }
.m-value { font-size: 1.1rem; font-weight: 800; color: var(--text-color); }
.m-value.highlight { color: var(--primary-color); }

.capacity-section { padding: 1rem 1.5rem; background: var(--hover-color); }
.cap-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem; font-weight: 700; }
.cap-label { color: var(--text-muted); }
.cap-value.danger { color: #ef4444; }

.progress-container { height: 8px; background: rgba(0,0,0,0.05); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: #10b981; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
.progress-fill.warning { background: #f59e0b; }
.progress-fill.danger { background: #ef4444; }
.cap-sub { font-size: 0.7rem; color: var(--text-muted); margin-top: 0.5rem; text-align: right; }

.card-footer { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid var(--border-color); }
.action-btn { 
  display: flex; align-items: center; justify-content: center; gap: 0.75rem; 
  padding: 1rem; text-decoration: none; color: var(--text-color); 
  font-weight: 700; font-size: 0.9rem; transition: background 0.2s;
  background: transparent; border: none; cursor: pointer;
}
.action-btn:first-child { border-right: 1px solid var(--border-color); }
.action-btn:hover { background: var(--hover-color); color: var(--primary-color); }

.empty-warehouse { padding: 5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
.empty-icon { opacity: 0.2; color: var(--primary-color); }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal {
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2.5rem;
  border-radius: 32px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.close-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.5rem; border-radius: 10px; }
.close-btn:hover { background: var(--hover-color); color: var(--text-color); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.input-group label { display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.75rem; }
.input-group select { width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1.5px solid var(--border-color); background: #ffffff; color: #000000; }
.input-group select option { color: #000; background: #fff; }
.input-group.checkbox { display: flex; flex-direction: row; align-items: center; gap: 0.75rem; margin-top: 0.5rem; }
.input-group.checkbox input { width: 18px; height: 18px; cursor: pointer; margin: 0; }
.input-group.checkbox label { margin: 0; cursor: pointer; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 900px) {
  .warehouse-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
