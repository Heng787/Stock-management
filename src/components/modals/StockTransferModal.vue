<script setup>
import { ref, computed, watch } from 'vue';
import { useStockStore } from '../../stores/stock';
import { useUIStore } from '../../stores/ui';
import { X, Search, Package, ArrowRightLeft, Loader2, AlertCircle } from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
  initialSourceId: String
});

const emit = defineEmits(['close', 'success']);

const stock = useStockStore();
const ui = useUIStore();

const searchQuery = ref('');
const selectedProduct = ref(null);
const quantity = ref(1);
const sourceWarehouseId = ref(props.initialSourceId || '');
const targetWarehouseId = ref('');
const reason = ref('');
const isSubmitting = ref(false);

const filteredProducts = computed(() => {
  if (!searchQuery.value) return [];
  const q = searchQuery.value.toLowerCase();
  return stock.products.filter(p => 
    p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  ).slice(0, 5);
});

const sourceStock = computed(() => {
  if (!selectedProduct.value || !sourceWarehouseId.value) return 0;
  const entry = selectedProduct.value.warehouseStock?.find(ws => ws.warehouse === sourceWarehouseId.value);
  return entry ? entry.quantity : 0;
});

const selectProduct = (product) => {
  selectedProduct.value = product;
  searchQuery.value = '';
};

const handleRemoveProduct = () => {
  selectedProduct.value = null;
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  
  if (!selectedProduct.value || !sourceWarehouseId.value || !targetWarehouseId.value || quantity.value <= 0) {
    ui.notify('Please fill all required fields', 'warning');
    return;
  }
  
  if (sourceWarehouseId.value === targetWarehouseId.value) {
    ui.notify('Source and target warehouses cannot be the same', 'error');
    return;
  }

  if (quantity.value > sourceStock.value) {
    ui.notify('Insufficient stock in source warehouse', 'error');
    return;
  }
  
  isSubmitting.value = true;
  try {
    // We send a TRANSFER type movement
    await stock.processMovement({
      productId: selectedProduct.value._id,
      type: 'TRANSFER',
      quantity: quantity.value,
      fromWarehouseId: sourceWarehouseId.value,
      toWarehouseId: targetWarehouseId.value,
      reason: reason.value,
      timestamp: new Date()
    });
    
    ui.notify(`Successfully transferred ${quantity.value} units to ${stock.warehouses.find(w => w._id === targetWarehouseId.value)?.name}`, 'success');
    emit('success');
    resetForm();
  } catch (err) {
    ui.notify(err.response?.data?.error || 'Failed to complete transfer', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  selectedProduct.value = null;
  quantity.value = 1;
  targetWarehouseId.value = '';
  reason.value = '';
  searchQuery.value = '';
};

watch(() => props.isOpen, (val) => {
  if (val && props.initialSourceId) {
    sourceWarehouseId.value = props.initialSourceId;
  }
  if (!val) resetForm();
});
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
      <div class="modal card glass">
        <div class="modal-header">
          <div class="header-title">
            <div class="icon-box transfer">
              <ArrowRightLeft :size="20" />
            </div>
            <div>
              <h3>Stock Transfer</h3>
              <p>Move inventory between locations</p>
            </div>
          </div>
          <button class="close-btn" @click="emit('close')">
            <X :size="20" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-content">
          <!-- Source/Target Selection -->
          <div class="row">
            <div class="input-group">
              <label>Source Location</label>
              <select v-model="sourceWarehouseId" required>
                <option value="" disabled>Select Source</option>
                <option v-for="w in stock.warehouses" :key="w._id" :value="w._id">
                  {{ w.name }}
                </option>
              </select>
            </div>
            <div class="input-group">
              <label>Destination Location</label>
              <select v-model="targetWarehouseId" required>
                <option value="" disabled>Select Target</option>
                <option v-for="w in stock.warehouses" :key="w._id" :value="w._id">
                  {{ w.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Product Search -->
          <div class="input-group">
            <label>Select Product to Move</label>
            <div v-if="!selectedProduct" class="search-container">
              <Search class="search-icon" :size="18" />
              <input 
                v-model="searchQuery" 
                placeholder="Search by name or SKU..." 
              />
              <div v-if="filteredProducts.length > 0" class="search-results card">
                <div 
                  v-for="p in filteredProducts" 
                  :key="p._id" 
                  class="result-item"
                  @click="selectProduct(p)"
                >
                  <div class="item-info">
                    <span class="name">{{ p.name }}</span>
                    <span class="sku">{{ p.sku }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="selected-product card">
              <Package :size="20" />
              <div class="info">
                <p class="name">{{ selectedProduct.name }}</p>
                <p class="sku">{{ selectedProduct.sku }}</p>
              </div>
              <button type="button" class="btn-text" @click="handleRemoveProduct"><Trash2 :size="16" /></button>
            </div>
          </div>

          <div class="row">
            <div class="input-group">
              <label>Quantity</label>
              <input 
                v-model.number="quantity" 
                type="number" 
                min="1" 
                required 
              />
              <div v-if="selectedProduct && sourceWarehouseId" class="helper-box" :class="{ 'low': sourceStock < quantity }">
                <AlertCircle :size="12" />
                <span>Available in source: {{ sourceStock }}</span>
              </div>
            </div>
            <div class="input-group">
              <label>Reason / Note</label>
              <input v-model="reason" placeholder="e.g. Restock Storefront" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="emit('close')">Cancel</button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="isSubmitting || !selectedProduct || !targetWarehouseId || quantity > sourceStock"
            >
              <Loader2 v-if="isSubmitting" class="spinner" :size="18" />
              <span v-else>Execute Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.modal {
  width: 100%;
  max-width: 580px;
  border-radius: 28px;
  padding: 2.5rem;
  box-shadow: 0 25px 70px -10px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2.5rem;
}

.header-title {
  display: flex;
  gap: 1.25rem;
  align-items: center;
}

.icon-box {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-box.transfer { background: var(--primary-light); color: var(--primary-color); }

.header-title h3 { margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; }
.header-title p { margin: 0.25rem 0 0; font-size: 0.95rem; color: var(--text-muted); }

.close-btn {
  background: var(--hover-color);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}
.close-btn:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }

.modal-content { display: grid; gap: 1.75rem; }

.row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

.input-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.75rem;
}

.input-group input, .input-group select {
  width: 100%;
  padding: 0.875rem 1rem;
  border-radius: 14px;
  border: 1.5px solid var(--border-color);
  background: var(--surface-color);
  transition: all 0.2s;
  font-weight: 600;
  color: var(--text-color);
}

.input-group input:focus, .input-group select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1);
  outline: none;
}

.search-container { position: relative; }
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}
.search-container input { padding-left: 44px; }

.search-results {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  width: 100%;
  background: var(--bg-surface);
  z-index: 100;
  border-radius: 16px;
  overflow-y: auto;
  max-height: 280px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(20px);
}

.result-item {
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid var(--border-color);
}
.result-item:last-child { border-bottom: none; }
.result-item:hover { background: var(--hover-color); padding-left: 1.5rem; }

.item-info .name { display: block; font-weight: 700; font-size: 1rem; color: var(--text-color); }
.item-info .sku { font-size: 0.75rem; color: var(--text-muted); }

.selected-product {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem 1.5rem;
  background: var(--primary-light);
  border: 1px solid var(--primary-color);
  border-radius: 16px;
}
.selected-product .info { flex: 1; }
.selected-product .name { font-weight: 800; margin: 0; color: var(--primary-color); }
.selected-product .sku { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
.btn-text { background: none; border: none; color: var(--primary-color); font-weight: 700; cursor: pointer; font-size: 0.85rem; }

.helper-box { 
  display: flex; align-items: center; gap: 0.5rem; 
  font-size: 0.75rem; color: #059669; font-weight: 700; 
  margin-top: 0.5rem; padding: 0.5rem; background: #ecfdf5; border-radius: 8px;
}
.helper-box.low { color: #ef4444; background: #fef2f2; }

.modal-footer {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.25rem;
  margin-top: 1rem;
}

.btn {
  padding: 1rem 1.5rem;
  border-radius: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.btn-primary { 
  background: var(--primary-color); 
  color: white; 
  box-shadow: 0 10px 20px -5px rgba(var(--primary-rgb), 0.4);
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -8px rgba(var(--primary-rgb), 0.5); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

.btn-secondary { background: var(--hover-color); color: var(--text-color); }

.spinner { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.modal-enter-active, .modal-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
